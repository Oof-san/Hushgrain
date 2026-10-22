import assert from 'node:assert/strict';
import { createServer } from 'node:http';

process.env.VERCEL = '1';
process.env.DATA_MODE = 'demo';
delete process.env.DATABASE_URL;
delete process.env.DATABASE_AUTH_TOKEN;
const { default: handler } = await import('../api/index.js');
const server = createServer(handler);
await new Promise((resolve) => server.listen(0, '127.0.0.1', resolve));
const origin = `http://127.0.0.1:${server.address().port}`;
try {
  const config = await fetch(`${origin}/api/config`);
  assert.equal(config.status, 200);
  assert.equal((await config.json()).mode, 'demo');
  const storefront = await fetch(`${origin}/api/storefront`);
  assert.equal(storefront.status, 200);
  assert.equal((await storefront.json()).items.length, 13);
  const owner = await fetch(`${origin}/api/owner`);
  assert.equal(owner.status, 401);
  console.log(
    'Built Vercel entry starts in plain Node: config/storefront 200; owner remains protected.',
  );
} finally {
  await new Promise((resolve) => server.close(resolve));
}
