import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // 确保兼容更多浏览器
    target: ['es2015', 'chrome60', 'firefox60', 'safari12', 'edge79'],
    cssTarget: ['chrome60', 'firefox60', 'safari12'],
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
    },
  },
})
