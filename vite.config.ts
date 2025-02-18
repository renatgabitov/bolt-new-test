import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  server: {
    proxy: {
      '/youtube': {
        target: 'https://server.theyoutubetool.com',
        changeOrigin: true,
      },
      '/ai': {
        target: 'https://server.theyoutubetool.com',
        changeOrigin: true,
      }
    }
  }
});