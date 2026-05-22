import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite' 

export default defineConfig({
  define: {
    global: 'window',
  },
  plugins: [
    react(),
    tailwindcss(), 
  ],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.tsx'],
    globals: false,
    coverage: {
      exclude: ['src/modules/authentication/Config/**'],
    },
  },
})