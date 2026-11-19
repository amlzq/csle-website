import { resolve } from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        home: resolve(__dirname, 'index.html'),
        docs: resolve(__dirname, 'docs/index.html'),
      },
    },
  },
});
