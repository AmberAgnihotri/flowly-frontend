import process from 'node:process'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'


export default defineConfig({
  server: {
    host: '0.0.0.0',
    proxy: {
      '/api': {
        target: process.env.DOCKER_ENV
          ? 'http://backend:8080'
          : 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  plugins: [react()],
})