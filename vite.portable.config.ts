import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteSingleFile } from 'vite-plugin-singlefile'

/**
 * Portable build: bundles the entire app (JS, CSS, assets) into a single
 * dist-portable/index.html that can be copied to a USB drive and opened by
 * double-clicking — no web server, no internet, no install. Data is stored in
 * the browser (IndexedDB) of whichever computer opens it.
 */
export default defineConfig({
  base: './',
  plugins: [react(), viteSingleFile()],
  resolve: {
    alias: {
      'virtual:pwa-register': fileURLToPath(new URL('./src/pwa-stub.ts', import.meta.url))
    }
  },
  build: {
    outDir: 'dist-portable'
  }
})
