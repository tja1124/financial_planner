import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Root deployment (Vercel, Netlify, etc.). Use base: '/repo-name/' only for GitHub Pages subpaths.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: '/',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: false,
    target: 'es2020',
  },
  preview: {
    port: 4173,
    strictPort: false,
  },
})
