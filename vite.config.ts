import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Două pagini: turul 3D (`index.html`) și istoria palatului (`istorie/index.html`).
export default defineConfig({
  plugins: [react()],
  server: { port: 5173 },
  preview: { port: 4173 },
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        istorie: 'istorie/index.html',
      },
    },
  },
})
