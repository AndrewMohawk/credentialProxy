import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../dist/public',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html')
      }
    }
  },
  server: {
    port: 3456,
    proxy: {
      '/api': {
        target: 'http://localhost:4242',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path
      }
    }
  }
}); 