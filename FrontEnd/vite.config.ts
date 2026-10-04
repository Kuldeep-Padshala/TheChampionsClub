import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  optimizeDeps: {
    include: ['lucide-react', 'framer-motion', 'axios', 'lenis', 'react-router-dom', 'react-hot-toast'],
  },
})
