import path from 'path';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [],
  build: {
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
        pdf: path.resolve(__dirname, 'pdf_viewer.html'),
      },
    },
  },
  server: {
    port: 3000,
    host: '0.0.0.0',
    hmr: true,
  },
});
