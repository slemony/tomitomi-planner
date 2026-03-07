import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Base URL for GitHub Pages: https://slemony.github.io/tomitomi-planner/
  base: '/tomitomi-planner/',
  build: {
    outDir: 'dist',
  },
})
