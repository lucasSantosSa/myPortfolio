import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'
import { defineConfig, type Plugin } from 'vitest/config'
import { cmsDevPlugin } from './vite-cms-plugin.ts'

/** Static hosts like GitHub Pages serve 404.html for unknown paths; make it the app so deep links work. */
const spaFallback = (): Plugin => ({
  name: 'spa-404-fallback',
  apply: 'build',
  closeBundle() {
    const out = path.resolve('dist')
    if (fs.existsSync(path.join(out, 'index.html'))) fs.copyFileSync(path.join(out, 'index.html'), path.join(out, '404.html'))
  },
})

export default defineConfig({
  // BASE_PATH=/myPortfolio/ when serving from a sub-path (GitHub Pages project site)
  base: process.env.BASE_PATH || '/',
  plugins: [react(), tailwindcss(), cmsDevPlugin(), spaFallback()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
})
