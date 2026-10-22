import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { createServer, type Server } from 'node:http';
import { scryptSync } from 'node:crypto';
import app from '../server/app';
let server: Server;
let origin: string;
beforeAll(async () => {
  process.env.DATA_MODE = 'live';
  process.env.DATABASE_URL = 'file::memory:';
  process.env.ADMIN_SESSION_SECRET = 'test-only-secret-with-more-than-thirty-two-characters';
  process.env.ADMIN_PASSWORD_HASH = `scrypt:test-salt:${scryptSync('test-password-12345', 'test-salt', 64).toString('hex')}`;
  server = createServer(app);
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  origin = `http://127.0.0.1:${(server.address() as { port: number }).port}`;
  process.env.APP_ORIGIN = origin;
});
afterAll(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
});
describe('live API boundary', () => {
  it('allows the storefront without authentication and prevents owner reads and writes', async () => {
    expect((await fetch(`${origin}/api/storefront`)).status).toBe(200);
    expect((await fetch(`${origin}/api/owner`)).status).toBe(401);
    expect(
      (
        await fetch(`${origin}/api/owner/settings`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: '{"orderOpen":false}',
        })
      ).status,
    ).toBe(401);
  });
  it('blocks cross-origin mutations', async () => {
    const response = await fetch(`${origin}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: 'https://another-site.example' },
      body: '{"password":"test-password-12345"}',
    });
    expect(response.status).toBe(403);
  });
  it('uses an HttpOnly session, protects private records, and clears it on logout', async () => {
    const wrong = await fetch(`${origin}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{"password":"wrong"}',
    });
    expect(wrong.status).toBe(401);
    const login = await fetch(`${origin}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Origin: origin },
      body: '{"password":"test-password-12345"}',
    });
    expect(login.status).toBe(200);
    const setCookie = login.headers.get('set-cookie')!;
    expect(setCookie).toContain('HttpOnly');
    expect(setCookie).toContain('SameSite=Strict');
    const cookie = setCookie.split(';')[0];
    expect((await fetch(`${origin}/api/owner`, { headers: { Cookie: cookie } })).status).toBe(200);
    const logout = await fetch(`${origin}/api/auth/logout`, {
      method: 'POST',
      headers: { Cookie: cookie },
    });
    expect(logout.headers.get('set-cookie')).toContain('Expires=Thu, 01 Jan 1970');
  });
  it('rejects invalid order input and strips untrusted client prices', async () => {
    const bad = await fetch(`${origin}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}',
    });
    expect(bad.status).toBe(400);
    const response = await fetch(`${origin}/api/orders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: 'Demo Alex',
        phone: '09000000000',
        orderType: 'pickup',
        idempotencyKey: crypto.randomUUID(),
        items: [{ menuItemId: 1, quantity: 1, priceCents: 1 }],
      }),
    });
    expect(response.status).toBe(201);
    const order = await response.json();
    expect(order.subtotalCents).toBe(18000);
    expect(order).not.toHaveProperty('phone');
    const track = await fetch(`${origin}/api/orders/${order.orderNumber}`);
    expect(track.status).toBe(200);
    expect(await track.json()).not.toHaveProperty('customerName');
  });
});
