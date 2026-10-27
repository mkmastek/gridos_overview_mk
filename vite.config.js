import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// The deliverable is ONE dist/index.html that opens by double-click (file://).
// vite-plugin-singlefile inlines all JS and CSS into that file.
export default defineConfig({
  base: './',
  plugins: [viteSingleFile()],
  build: {
    target: 'es2020',
    cssCodeSplit: false,
    assetsInlineLimit: 100_000_000,
    chunkSizeWarningLimit: 3000,
  },
  server: {
    port: 5173,
    strictPort: false,
  },
});
