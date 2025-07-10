import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/coomono/', // This assumes the repository will be named "coomono"
  server: {
    port: 3000,
    host: true, // Listen on all addresses, including LAN and public addresses
    open: true, // Automatically open the browser
    proxy: {
      // Proxy for coomer.su API
      '/coomer-api': {
        target: 'https://coomer.su/api/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/coomer-api/, ''),
      },
      // Proxy for kemono.su API
      '/kemono-api': {
        target: 'https://kemono.su/api/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/kemono-api/, ''),
      },
      // Proxy for image server
      '/img-proxy': {
        target: 'https://img.coomer.su',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/img-proxy/, ''),
      }
    }
  }
});
