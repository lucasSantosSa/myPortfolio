import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'
import { cmsDevPlugin } from './vite-cms-plugin.ts'

export default defineConfig({
  plugins: [react(), tailwindcss(), cmsDevPlugin()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
  },
})
