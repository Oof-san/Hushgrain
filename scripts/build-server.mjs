import { build } from 'esbuild';

await build({
  entryPoints: { api: 'server/app.ts', server: 'server/start.ts' },
  outdir: 'dist',
  bundle: true,
  platform: 'node',
  target: 'node24',
  packages: 'external',
  format: 'esm',
  logLevel: 'info',
});
