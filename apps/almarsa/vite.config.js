import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [react()],
  base: '/almarsa/',
  server: {
    port: 5174,
    strictPort: true,
    proxy: {
      '/almarsa/api': { target: 'http://localhost:3000', changeOrigin: true, rewrite: (p) => p.replace(/^\/almarsa/, '') },
      '/almarsa/uploads': { target: 'http://localhost:3000', changeOrigin: true, rewrite: (p) => p.replace(/^\/almarsa/, '') },
      '/almarsa/menu-images': { target: 'http://localhost:3000', changeOrigin: true, rewrite: (p) => p.replace(/^\/almarsa/, '') },
    },
  },
});
