import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: [
      "https://api.care2connect.in", // 👈 Add your ngrok host here
    ],
    proxy: {
      '/c2c_app': {
        target: 'https://api.care2connect.in',
        changeOrigin: true,
        secure: false,
      },
      '/demo_doctor': {
        target: 'https://api.care2connect.in',
        changeOrigin: true,
        secure: false,
      },
      '/duniyape': {
        target: 'https://api.care2connect.in',
        changeOrigin: true,
        secure: false,
      }
    }
  },
})
