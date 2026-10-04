import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { spawn, execSync } from 'node:child_process'

function unsaidBridgePlugin() {
  const storageDir = path.join(os.homedir(), '.unsaid')
  const storageFile = path.join(storageDir, 'reflections.json')
  const sseClients = new Set<any>()

  function broadcastShellReflection(convo: any, count: number) {
    const payload = JSON.stringify({
      type: 'shell_reflection',
      count,
      convo
    })
    for (const client of sseClients) {
      try {
        client.write(`data: ${payload}\n\n`)
      } catch {
        sseClients.delete(client)
      }
    }
  }

  return {
    name: 'unsaid-bridge-plugin',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
        // SSE Real-time events stream for desktop <-> shell synchronization
        if (req.url === '/api/bridge/events' && req.method === 'GET') {
          res.writeHead(200, {
            'Content-Type': 'text/event-stream',
            'Cache-Control': 'no-cache',
            Connection: 'keep-alive',
            'Access-Control-Allow-Origin': '*'
          })
          res.write(`data: ${JSON.stringify({ type: 'connected', time: Date.now() })}\n\n`)
          sseClients.add(res)

          req.on('close', () => {
            sseClients.delete(res)
          })
          return
        }

        // Bridge status
        if (req.url === '/api/bridge/status' && req.method === 'GET') {
          let count = 0
          let lastModified = 0
          try {
            if (fs.existsSync(storageFile)) {
              const stat = fs.statSync(storageFile)
              lastModified = stat.mtimeMs
              const list = JSON.parse(fs.readFileSync(storageFile, 'utf-8'))
              count = Array.isArray(list) ? list.length : 0
            }
          } catch {}

          res.setHeader('Content-Type', 'application/json')
          return res.end(
            JSON.stringify({
              online: true,
              storageDir,
              storageFile,
              count,
              lastModified,
              connectedClients: sseClients.size
            })
          )
        }

        // Read shared terminal + desktop reflections
        if (req.url === '/api/bridge/history' && req.method === 'GET') {
          try {
            if (fs.existsSync(storageFile)) {
              const data = fs.readFileSync(storageFile, 'utf-8')
              res.setHeader('Content-Type', 'application/json')
              return res.end(data)
            }
          } catch {}
          res.setHeader('Content-Type', 'application/json')
          return res.end('[]')
        }

        // Bidirectional sync between browser localStorage and ~/.unsaid/reflections.json
        if (req.url === '/api/bridge/sync' && req.method === 'POST') {
          let body = ''
          req.on('data', (chunk: any) => {
            body += chunk
          })
          req.on('end', () => {
            try {
              if (!fs.existsSync(storageDir)) fs.mkdirSync(storageDir, { recursive: true })
              const rawIncoming = JSON.parse(body || '[]')
              const incoming = Array.isArray(rawIncoming) ? rawIncoming : [rawIncoming]

              let existing: any[] = []
              if (fs.existsSync(storageFile)) {
                try {
                  existing = JSON.parse(fs.readFileSync(storageFile, 'utf-8'))
                } catch {
                  existing = []
                }
              }

              const existingMap = new Map(existing.map((item) => [item.id, item]))
              let hasNewTerminalReflection = false
              let newTerminalItem: any = null

              for (const item of incoming) {
                if (item && item.id) {
                  const isNew = !existingMap.has(item.id)
                  existingMap.set(item.id, {
                    ...existingMap.get(item.id),
                    ...item
                  })
                  if (isNew && item.source === 'terminal_shell') {
                    hasNewTerminalReflection = true
                    newTerminalItem = item
                  }
                }
              }

              existing = Array.from(existingMap.values())
              existing.sort((a, b) => (b.updatedAt || b.timestamp || 0) - (a.updatedAt || a.timestamp || 0))
              fs.writeFileSync(storageFile, JSON.stringify(existing.slice(0, 150), null, 2))

              // Broadcast update to web app ONLY when a new terminal reflection is saved
              if (hasNewTerminalReflection && newTerminalItem) {
                broadcastShellReflection(newTerminalItem, existing.length)
              }

              res.setHeader('Content-Type', 'application/json')
              return res.end(JSON.stringify({ success: true, count: existing.length, data: existing }))
            } catch (err: unknown) {
              res.statusCode = 500
              const msg = err instanceof Error ? err.message : String(err)
              return res.end(JSON.stringify({ error: msg }))
            }
          })
          return
        }

        // Launch external terminal shell window from web UI
        if (req.url === '/api/bridge/launch-shell' && req.method === 'POST') {
          try {
            spawn('cmd.exe', ['/c', 'start', 'unsaid-shell.bat'], {
              cwd: process.cwd(),
              detached: true,
              stdio: 'ignore'
            }).unref()

            res.setHeader('Content-Type', 'application/json')
            return res.end(JSON.stringify({ launched: true }))
          } catch (err: unknown) {
            res.statusCode = 500
            const msg = err instanceof Error ? err.message : String(err)
            return res.end(JSON.stringify({ error: msg }))
          }
        }

        // Launch desktop app window
        if (req.url === '/api/bridge/launch-desktop' && req.method === 'POST') {
          try {
            spawn('cmd.exe', ['/c', 'start', 'start-desktop.bat'], {
              cwd: process.cwd(),
              detached: true,
              stdio: 'ignore'
            }).unref()

            res.setHeader('Content-Type', 'application/json')
            return res.end(JSON.stringify({ launched: true }))
          } catch (err: unknown) {
            res.statusCode = 500
            const msg = err instanceof Error ? err.message : String(err)
            return res.end(JSON.stringify({ error: msg }))
          }
        }

        // Handy offline speech-to-text bridge status & launcher
        const handyExePath = path.join(os.homedir(), 'AppData', 'Local', 'Handy', 'handy.exe')
        const handyConfigPath = path.join(os.homedir(), 'AppData', 'Roaming', 'com.pais.handy', 'settings_store.json')

        function isHandyRunning(): boolean {
          try {
            const out = execSync('tasklist /FI "IMAGENAME eq handy.exe" /NH', {
              encoding: 'utf-8',
              stdio: ['ignore', 'pipe', 'ignore'],
              timeout: 1200
            })
            return out.toLowerCase().includes('handy.exe')
          } catch {
            return false
          }
        }

        if (req.url === '/api/handy/status' && req.method === 'GET') {
          const installed = fs.existsSync(handyExePath)
          const running = installed ? isHandyRunning() : false
          let selectedModel: string | null = null
          let postProcessConnected = false

          if (installed && fs.existsSync(handyConfigPath)) {
            try {
              const cfg = JSON.parse(fs.readFileSync(handyConfigPath, 'utf-8'))
              selectedModel = cfg?.settings?.selected_model || null
              postProcessConnected = cfg?.settings?.post_process_models?.custom === 'google/gemma-3-4b'
            } catch {}
          }
          res.setHeader('Content-Type', 'application/json')
          return res.end(
            JSON.stringify({
              installed,
              running,
              path: installed ? handyExePath : null,
              hotkey: 'Ctrl+Space',
              selectedModel,
              postProcessConnected
            })
          )
        }

        // Handy Models list & status
        if (req.url === '/api/handy/models' && req.method === 'GET') {
          const installed = fs.existsSync(handyExePath)
          const running = installed ? isHandyRunning() : false
          let selectedModel: string | null = null
          let postProcessConnected = false
          let postProcessEnabled = false

          if (installed && fs.existsSync(handyConfigPath)) {
            try {
              const cfg = JSON.parse(fs.readFileSync(handyConfigPath, 'utf-8'))
              selectedModel = cfg?.settings?.selected_model || null
              postProcessConnected = cfg?.settings?.post_process_models?.custom === 'google/gemma-3-4b'
              postProcessEnabled = !!cfg?.settings?.post_process_enabled
            } catch {}
          }

          let catalogModels: any[] = []
          try {
            if (installed) {
              const raw = execSync(`"${handyExePath}" --list-models --json`, {
                encoding: 'utf-8',
                timeout: 5000,
                stdio: ['ignore', 'pipe', 'ignore']
              })
              const jsonIdx = raw.indexOf('[')
              if (jsonIdx >= 0) {
                catalogModels = JSON.parse(raw.slice(jsonIdx))
              }
            }
          } catch {}

          const recommendedFallback = [
            {
              id: 'handy-computer/parakeet-unified-en-0.6b-gguf/parakeet-unified-en-0.6b-Q8_0.gguf',
              name: 'Parakeet Unified EN 0.6B',
              description: 'Fast, accurate live English transcription (Recommended)',
              size_mb: 697,
              speed_score: 0.79,
              accuracy_score: 0.90,
              is_downloaded: false
            },
            {
              id: 'handy-computer/canary-180m-flash-gguf/canary-180m-flash-Q8_0.gguf',
              name: 'Canary 180M Flash',
              description: 'Tiny & instant, runs smoothly on any CPU or GPU',
              size_mb: 208,
              speed_score: 0.85,
              accuracy_score: 0.82,
              is_downloaded: false
            },
            {
              id: 'handy-computer/whisper-medium-gguf/whisper-medium-Q8_0.gguf',
              name: 'Whisper Medium',
              description: 'Multilingual transcription with deep vocabulary',
              size_mb: 793,
              speed_score: 0.65,
              accuracy_score: 0.92,
              is_downloaded: false
            },
            {
              id: 'handy-computer/nemotron-3.5-asr-streaming-0.6b-gguf/nemotron-3.5-asr-streaming-0.6b-Q8_0.gguf',
              name: 'Nemotron Streaming 3.5',
              description: 'Live multilingual transcription across 28 languages',
              size_mb: 716,
              speed_score: 0.75,
              accuracy_score: 0.88,
              is_downloaded: false
            }
          ]

          const models = catalogModels.length > 0 ? catalogModels : recommendedFallback
          const downloaded = models.filter((m: any) => m.is_downloaded)
          const recommended = models.filter((m: any) => m.is_recommended || recommendedFallback.some((r) => r.id === m.id))

          res.setHeader('Content-Type', 'application/json')
          return res.end(
            JSON.stringify({
              installed,
              running,
              selectedModel,
              postProcessConnected,
              postProcessEnabled,
              downloadedModels: downloaded,
              recommendedModels: recommended.length > 0 ? recommended : recommendedFallback,
              allModelsCount: models.length
            })
          )
        }

        // Set active Handy Voice Model in settings_store.json
        if (req.url === '/api/handy/select-model' && req.method === 'POST') {
          let body = ''
          req.on('data', (chunk: any) => (body += chunk))
          req.on('end', () => {
            try {
              const { modelId } = JSON.parse(body || '{}')
              if (!fs.existsSync(handyConfigPath)) {
                res.statusCode = 404
                return res.end(JSON.stringify({ error: 'Handy config not found' }))
              }
              const cfg = JSON.parse(fs.readFileSync(handyConfigPath, 'utf-8'))
              if (!cfg.settings) cfg.settings = {}
              cfg.settings.selected_model = modelId
              fs.writeFileSync(handyConfigPath, JSON.stringify(cfg, null, 2))

              res.setHeader('Content-Type', 'application/json')
              return res.end(JSON.stringify({ success: true, selectedModel: modelId }))
            } catch (err: unknown) {
              res.statusCode = 500
              const msg = err instanceof Error ? err.message : String(err)
              return res.end(JSON.stringify({ error: msg }))
            }
          })
          return
        }

        // Connect Handy Post-Processing to local LM Studio (google/gemma-3-4b)
        if (req.url === '/api/handy/connect-lmstudio' && req.method === 'POST') {
          try {
            if (!fs.existsSync(handyConfigPath)) {
              res.statusCode = 404
              return res.end(JSON.stringify({ error: 'Handy config not found' }))
            }
            const cfg = JSON.parse(fs.readFileSync(handyConfigPath, 'utf-8'))
            if (!cfg.settings) cfg.settings = {}

            cfg.settings.post_process_enabled = true
            cfg.settings.post_process_provider_id = 'custom'
            if (!cfg.settings.post_process_models) cfg.settings.post_process_models = {}
            cfg.settings.post_process_models.custom = 'google/gemma-3-4b'

            if (Array.isArray(cfg.settings.post_process_providers)) {
              const customProvider = cfg.settings.post_process_providers.find((p: any) => p.id === 'custom')
              if (customProvider) {
                customProvider.base_url = 'http://localhost:1234/v1'
                customProvider.label = 'LM Studio (Local Gemma 3 4B)'
              }
            }

            fs.writeFileSync(handyConfigPath, JSON.stringify(cfg, null, 2))

            res.setHeader('Content-Type', 'application/json')
            return res.end(
              JSON.stringify({
                success: true,
                connected: true,
                endpoint: 'http://localhost:1234/v1',
                model: 'google/gemma-3-4b'
              })
            )
          } catch (err: unknown) {
            res.statusCode = 500
            const msg = err instanceof Error ? err.message : String(err)
            return res.end(JSON.stringify({ error: msg }))
          }
        }

        // Toggle live Handy transcription shortcut in background
        if (req.url === '/api/handy/toggle' && req.method === 'POST') {
          try {
            if (fs.existsSync(handyExePath)) {
              spawn(handyExePath, ['--toggle-transcription'], { detached: true, stdio: 'ignore' }).unref()
              res.setHeader('Content-Type', 'application/json')
              return res.end(JSON.stringify({ toggled: true }))
            } else {
              res.statusCode = 404
              return res.end(JSON.stringify({ error: 'Handy executable not found' }))
            }
          } catch (err: unknown) {
            res.statusCode = 500
            const msg = err instanceof Error ? err.message : String(err)
            return res.end(JSON.stringify({ error: msg }))
          }
        }

        if (req.url === '/api/handy/launch' && req.method === 'POST') {
          try {
            if (fs.existsSync(handyExePath)) {
              spawn(handyExePath, [], { detached: true, stdio: 'ignore' }).unref()
              res.setHeader('Content-Type', 'application/json')
              return res.end(JSON.stringify({ launched: true }))
            } else {
              res.statusCode = 404
              return res.end(JSON.stringify({ error: 'Handy executable not found' }))
            }
          } catch (err: unknown) {
            res.statusCode = 500
            const msg = err instanceof Error ? err.message : String(err)
            return res.end(JSON.stringify({ error: msg }))
          }
        }

        // Redirect /docs and /website to /website/index.html
        if (req.url === '/docs' || req.url === '/docs/' || req.url === '/website' || req.url === '/website/') {
          res.writeHead(302, { Location: '/website/index.html' })
          return res.end()
        }

        next()
      })
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), unsaidBridgePlugin()],
  server: {
    port: 5173,
    proxy: {
      '/api/lmstudio': {
        target: 'http://127.0.0.1:1234',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/lmstudio/, ''),
      },
    },
  },
})
