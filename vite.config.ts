import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
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
