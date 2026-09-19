import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const mockApiTarget = process.env.MOCK_API_URL ?? 'http://127.0.0.1:4000'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: mockApiTarget, changeOrigin: true },
    },
  },
})
