import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
export default defineConfig({
  plugins: [react()],
  root: fileURLToPath(new URL('./client', import.meta.url)),
  build: { outDir: '../dist/public', emptyOutDir: true },
  server: { host: '127.0.0.1' },
});
