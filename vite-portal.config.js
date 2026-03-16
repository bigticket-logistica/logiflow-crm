import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: 'index-portal.html'
    }
  },
  server: {
    open: '/index-portal.html'
  }
})
