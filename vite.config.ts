import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  // Use relative asset paths so the app works when served from a sub-path (GitHub Pages).
  base: './',
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  }
})

