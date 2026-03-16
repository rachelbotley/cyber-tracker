import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, createReadStream, existsSync, readdirSync, statSync } from 'fs'
import { resolve, extname, join } from 'path'
import { homedir } from 'os'

const TRACKER_EXTENSIONS = new Set(['.mod', '.s3m', '.xm', '.it', '.mptm', '.stm', '.med'])
const MUSIC_DIR = join(homedir(), 'Music', 'tracker-music')

function formatTitle(filename: string): string {
  const name = filename.replace(/\.[^.]+$/, '')
  return decodeURIComponent(name)
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, c => c.toUpperCase())
}

function formatArtist(dirname: string): string {
  return dirname
    .replace(/[_-]/g, ' ')
    .trim()
    .replace(/\b\w/g, c => c.toUpperCase())
}

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'tracker-music-server',
      configureServer(server) {
        server.middlewares.use((req, res, next) => {
          // API: list all tracks
          if (req.url === '/__api/tracks') {
            res.setHeader('Content-Type', 'application/json')
            try {
              if (!existsSync(MUSIC_DIR)) {
                res.end(JSON.stringify([]))
                return
              }
              const tracks: { id: string; file: string; title: string; artist: string; format: string }[] = []
              let id = 0
              const entries = readdirSync(MUSIC_DIR).sort()
              for (const artistDir of entries) {
                const artistPath = join(MUSIC_DIR, artistDir)
                if (!statSync(artistPath).isDirectory()) continue
                const files = readdirSync(artistPath).sort()
                for (const file of files) {
                  const ext = extname(file).toLowerCase()
                  if (!TRACKER_EXTENSIONS.has(ext)) continue
                  const filePath = join(artistPath, file)
                  if (!statSync(filePath).isFile()) continue
                  id++
                  tracks.push({
                    id: String(id),
                    file: `${artistDir}/${file}`,
                    title: formatTitle(file),
                    artist: formatArtist(artistDir),
                    format: ext.slice(1).toUpperCase(),
                  })
                }
              }
              res.end(JSON.stringify(tracks))
            } catch {
              res.statusCode = 500
              res.end(JSON.stringify([]))
            }
            return
          }

          // Serve files from ~/Music/tracker-music at /music/
          if (req.url?.startsWith('/music/')) {
            const relPath = decodeURIComponent(req.url.slice('/music/'.length))
            const filePath = join(MUSIC_DIR, relPath)
            // Prevent path traversal
            if (!filePath.startsWith(MUSIC_DIR)) {
              res.statusCode = 403
              res.end('Forbidden')
              return
            }
            if (existsSync(filePath) && statSync(filePath).isFile()) {
              const ext = extname(filePath).toLowerCase()
              const mimeTypes: Record<string, string> = {
                '.mod': 'application/octet-stream',
                '.s3m': 'application/octet-stream',
                '.xm': 'application/octet-stream',
                '.it': 'application/octet-stream',
                '.mptm': 'application/octet-stream',
                '.stm': 'application/octet-stream',
                '.med': 'application/octet-stream',
              }
              res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream')
              createReadStream(filePath).pipe(res)
              return
            }
          }

          next()
        })
      },
    },
    {
      name: 'copy-libopenmpt',
      writeBundle() {
        const src = resolve(__dirname, 'node_modules/chiptune3/libopenmpt.worklet.js')
        const distRoot = resolve(__dirname, 'dist')
        const assetsDir = resolve(distRoot, 'assets')
        if (existsSync(src)) {
          // Copy to both locations — the hashed worklet in assets/ uses a relative
          // import for libopenmpt.worklet.js, so it must exist in assets/
          copyFileSync(src, resolve(assetsDir, 'libopenmpt.worklet.js'))
          copyFileSync(src, resolve(distRoot, 'libopenmpt.worklet.js'))
        }
      }
    }
  ],
  optimizeDeps: {
    exclude: ['chiptune3']
  },
})
