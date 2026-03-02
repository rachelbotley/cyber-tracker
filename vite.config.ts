import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, existsSync, mkdirSync } from 'fs'
import { resolve } from 'path'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-libopenmpt',
      writeBundle(options) {
        // Copy libopenmpt.worklet.js to dist/assets so the worklet can import it
        const src = resolve(__dirname, 'node_modules/chiptune3/libopenmpt.worklet.js')
        const outDir = options.dir || resolve(__dirname, 'dist/assets')
        if (existsSync(src)) {
          copyFileSync(src, resolve(outDir, 'libopenmpt.worklet.js'))
        }
      }
    }
  ],
  optimizeDeps: {
    exclude: ['chiptune3']
  },
})
