import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
  // Required for client-side routing: serve index.html for all unknown paths.
  // On Vercel/Netlify this is handled by the platform's rewrite rules instead.
  preview: {
    port: 4173,
  },
})
