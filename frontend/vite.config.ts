import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      // the browser calls /api/... on :5173, Vite forwards it to Spring Boot on :8080
      '/api': 'http://localhost:8080',
    },
  },
})