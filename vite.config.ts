import 'dotenv/config';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'node:url';
const dataMode = process.env.DATA_MODE || 'demo';
if (dataMode !== 'demo' && dataMode !== 'live') {
  throw new Error('DATA_MODE must be demo or live.');
}
export default defineConfig({
  define: { __CAFE_MODE__: JSON.stringify(dataMode) },
  plugins: [react()],
  root: fileURLToPath(new URL('./client', import.meta.url)),
  build: { outDir: '../dist/public', emptyOutDir: true },
  server: { host: '127.0.0.1' },
});
