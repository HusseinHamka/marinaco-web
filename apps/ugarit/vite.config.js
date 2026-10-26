import { defineConfig } from 'vite';

export default defineConfig({
  base: '/ugarit/',
  server: {
    proxy: {
      '/ugarit/api': { target: 'http://127.0.0.1:4177', changeOrigin: true, rewrite: (p) => p.replace(/^\/ugarit/, '') },
      '/ugarit/uploads': { target: 'http://127.0.0.1:4177', changeOrigin: true, rewrite: (p) => p.replace(/^\/ugarit/, '') },
      '/ugarit/admin': { target: 'http://127.0.0.1:4177', changeOrigin: true, rewrite: (p) => p.replace(/^\/ugarit/, '') },
      '/ugarit/admin.js': { target: 'http://127.0.0.1:4177', changeOrigin: true, rewrite: (p) => p.replace(/^\/ugarit/, '') },
      '/ugarit/admin.css': { target: 'http://127.0.0.1:4177', changeOrigin: true, rewrite: (p) => p.replace(/^\/ugarit/, '') },
      '/ugarit/dishes': { target: 'http://127.0.0.1:4177', changeOrigin: true, rewrite: (p) => p.replace(/^\/ugarit/, '') },
      '/ugarit/categories': { target: 'http://127.0.0.1:4177', changeOrigin: true, rewrite: (p) => p.replace(/^\/ugarit/, '') },
    },
  },
});
