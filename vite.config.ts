import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const basePath = env.VITE_BASE_PATH || '/Petraq-admin/'

  return {
    // GitHub Pages serves the app from the repository sub-path instead of the domain root.
    base: mode === 'development' ? '/' : basePath,
    plugins: [react()],
    server: {
      port: 3000,
      open: true
    }
  }
})
