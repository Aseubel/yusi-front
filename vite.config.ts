import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'AI 知己',
        short_name: 'AI知己',
        description: '端到端加密，仅你可见，AI伴你同行。',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,json,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          }
        ]
      }
    })
  ],
  build: {
    // 确保兼容更多浏览器
    target: ['es2015', 'chrome60', 'firefox60', 'safari12', 'edge79'],
    cssTarget: ['chrome60', 'firefox60', 'safari12'],
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          if (!id.includes('node_modules')) return
          if (id.includes('react') || id.includes('react-router')) return 'react-vendor'
          if (id.includes('framer-motion')) return 'motion'
          if (id.includes('@radix-ui')) return 'radix'
          if (id.includes('lucide-react')) return 'icons'
          if (id.includes('@amap')) return 'amap'
          if (id.includes('@stomp')) return 'stomp'
          if (id.includes('sonner')) return 'sonner'
          return 'vendor'
        },
      },
    },
  },
  css: {
    // CSS 预处理选项
    devSourcemap: true,
  },
  server: {
    port: 5174,
    proxy: {
      '/api': {
        target: 'http://aseubel.xyz:611',
        changeOrigin: true,
      },
      '/ws-chat': {
        target: 'http://aseubel.xyz:611',
        ws: true,
      },
    },
  },
})
