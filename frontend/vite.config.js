import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    host: true, // Expose ke jaringan LAN (agar HP bisa akses)
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:3000', // 127.0.0.1 lebih reliable dari localhost
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://127.0.0.1:3000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  build: {
    target: 'esnext',
    minify: 'terser',
  }
})
