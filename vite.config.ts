import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Două pagini: turul 3D (`index.html`) și istoria palatului (`istorie/index.html`).
// `BASE_PATH` e subfolderul în care e publicat site-ul (pe GitHub Pages, numele repo-ului).
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
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
