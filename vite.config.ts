import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import fs from 'node:fs'
import path from 'node:path'
import os from 'node:os'
import { spawn } from 'node:child_process'

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
        if (req.url === '/api/handy/status' && req.method === 'GET') {
          const handyPath = path.join(os.homedir(), 'AppData', 'Local', 'Handy', 'handy.exe')
          const installed = fs.existsSync(handyPath)
          res.setHeader('Content-Type', 'application/json')
          return res.end(
            JSON.stringify({
              installed,
              path: handyPath,
              hotkey: 'Ctrl+Space',
              model: 'Whisper (Local Vulkan / GGML)'
            })
          )
        }

        if (req.url === '/api/handy/launch' && req.method === 'POST') {
          try {
            const handyPath = path.join(os.homedir(), 'AppData', 'Local', 'Handy', 'handy.exe')
            if (fs.existsSync(handyPath)) {
              spawn(handyPath, [], { detached: true, stdio: 'ignore' }).unref()
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
