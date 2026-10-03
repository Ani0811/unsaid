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

  // Watch file for changes outside the browser (e.g. from native CLI shell)
  try {
    if (!fs.existsSync(storageDir)) fs.mkdirSync(storageDir, { recursive: true })
    if (fs.existsSync(storageFile)) {
      fs.watchFile(storageFile, { interval: 1000 }, (curr, prev) => {
        if (curr.mtimeMs !== prev.mtimeMs) {
          try {
            const data = JSON.parse(fs.readFileSync(storageFile, 'utf-8'))
            const payload = JSON.stringify({ type: 'disk_change', count: data.length, latest: data[0] })
            for (const client of sseClients) {
              client.write(`data: ${payload}\n\n`)
            }
          } catch {}
        }
      })
    }
  } catch {}

  function broadcastSync(existing: any[], incomingLatest?: any) {
    const payload = JSON.stringify({
      type: 'sync',
      count: existing.length,
      latest: incomingLatest || existing[0]
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
              for (const item of incoming) {
                if (item && item.id) {
                  existingMap.set(item.id, {
                    ...existingMap.get(item.id),
                    ...item
                  })
                }
              }

              existing = Array.from(existingMap.values())
              existing.sort((a, b) => (b.updatedAt || b.timestamp || 0) - (a.updatedAt || a.timestamp || 0))
              fs.writeFileSync(storageFile, JSON.stringify(existing.slice(0, 150), null, 2))

              // Broadcast update to all connected web/desktop instances
              broadcastSync(existing, incoming[0])

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
