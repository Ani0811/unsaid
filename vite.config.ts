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

  return {
    name: 'unsaid-bridge-plugin',
    configureServer(server: any) {
      server.middlewares.use((req: any, res: any, next: any) => {
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
              const incoming = JSON.parse(body || '[]')
              let existing: any[] = []
              if (fs.existsSync(storageFile)) {
                try {
                  existing = JSON.parse(fs.readFileSync(storageFile, 'utf-8'))
                } catch {
                  existing = []
                }
              }

              const existingIds = new Set(existing.map((item) => item.id))
              for (const item of incoming) {
                if (item && item.id && !existingIds.has(item.id)) {
                  existing.push(item)
                  existingIds.add(item.id)
                }
              }

              existing.sort((a, b) => (b.updatedAt || b.timestamp || 0) - (a.updatedAt || a.timestamp || 0))
              fs.writeFileSync(storageFile, JSON.stringify(existing.slice(0, 100), null, 2))

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
