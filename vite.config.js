import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      // Proxy requests to the backend API to avoid CORS issues
      '/ask': {
        target: 'http://127.0.0.1:8000', // Your backend URL
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/ask/, ''), // Optional path rewriting if needed
      },
    },
  },
});
