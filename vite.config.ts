import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  base: '/weight-tracker-CURSOR/',
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['pwa.svg'],
      manifest: {
        name: '體重紀錄小幫手',
        short_name: '體重小幫手',
        description: '離線可用的體重與飲食紀錄 PWA',
        theme_color: '#111827',
        background_color: '#111827',
        display: 'standalone',
        scope: '/weight-tracker-CURSOR/',
        start_url: '/weight-tracker-CURSOR/',
        icons: [
          {
            src: '/pwa.svg',
            sizes: '512x512',
            type: 'image/svg+xml',
            purpose: 'any',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico,woff2}'],
        navigateFallback: '/weight-tracker-CURSOR/index.html',
      },
    }),
  ],
})
