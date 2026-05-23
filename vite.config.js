import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    allowedHosts: [
      "http://192.168.29.145:5000", // 👈 Add your ngrok host here
    ],
    proxy: {
      '/c2c_app': {
        target: 'http://192.168.29.145:5000',
        changeOrigin: true,
        secure: false,
      },
      '/demo_doctor': {
        target: 'http://192.168.29.145:5000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
})
