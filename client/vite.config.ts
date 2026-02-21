import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: '../web',
    emptyOutDir: true,
  },
  server: {
    proxy: {
      '/api': `http://localhost:${process.env.KLPGIT_PORT || 4219}`,
      '/ws': {
        target: `ws://localhost:${process.env.KLPGIT_PORT || 4219}`,
        ws: true,
      },
    },
  },
});
