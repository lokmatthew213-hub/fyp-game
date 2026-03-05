import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      '/api/poe': {
        target: 'https://api.poe.com/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/poe/, ''),
      },
    },
  },
})
