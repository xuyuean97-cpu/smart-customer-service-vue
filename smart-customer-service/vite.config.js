import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      // 代理接口请求
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        // 如果后端接口没有 /api 前缀，可以取消下面这一行注销
        // rewrite: (path) => path.replace(/^\/api/, '')
      },
      // 代理 WebSocket 请求
      '/ws': {
        target: 'ws://localhost:8081',
        ws: true,
      }
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src')
  }
  }
})