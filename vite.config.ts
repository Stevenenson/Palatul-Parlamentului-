import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Two pages: the 3D tour (`index.html`) and the palace history (`history/index.html`).
// `BASE_PATH` is the subfolder the site is published in (on GitHub Pages, the repo name).
export default defineConfig({
  base: process.env.BASE_PATH ?? '/',
  plugins: [react()],
  server: { port: 5173 },
  preview: { port: 4173 },
  build: {
    rollupOptions: {
      input: {
        main: 'index.html',
        history: 'history/index.html',
      },
    },
  },
})
