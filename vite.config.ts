import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  // Baked in at build time; all builds run through npm scripts (see package.json).
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? 'dev')
  },
  server: {
    watch: {
      // Build outputs, not sources. Watching dist-usb in particular holds
      // file handles that break electron-builder's staging-folder rename.
      ignored: ['**/dist/**', '**/dist-portable/**', '**/dist-usb/**']
    }
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'FTO Corrections Training Portal',
        short_name: 'FTO Portal',
        description:
          'Field Training Officer and trainee portal for county corrections training (TCOLE jail standards). Works fully offline.',
        theme_color: '#16222e',
        background_color: '#16222e',
        display: 'standalone',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}']
      }
    })
  ]
})
