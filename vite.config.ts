import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  base: '/sonus-pointer/',
  plugins: [react(), tailwindcss()],
  build: {
    // Output to docs/ so GitHub Pages branch deployment (source: docs/) also works
    outDir: 'docs',
  },
})
