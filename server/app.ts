import 'dotenv/config';
import express, { type ErrorRequestHandler } from 'express';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { z, ZodError } from 'zod';
import { getDatabase } from './db';
import { authConfigured, createSession, isOwner, SESSION_COOKIE, verifyPassword } from './auth';
import { CAFE_DEFAULTS, CATEGORIES, INITIAL_MENU } from '../shared/catalog';
import {
  menuChangesSchema,
  orderSchema,
  publicOrder,
  settingsChangesSchema,
} from '../shared/orders';
import { STATUSES } from '../shared/types';
export const app = express();
app.disable('x-powered-by');
if (process.env.VERCEL) app.set('trust proxy', 1);
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '32kb' }));
app.use('/api', (_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store');
  next();
});
app.use(
  '/api',
  rateLimit({ windowMs: 60_000, limit: 180, standardHeaders: 'draft-8', legacyHeaders: false }),
);
// Reject browser mutations initiated from another site. Exact origin may be pinned in production.
app.use('/api', (req, res, next) => {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const expected = process.env.APP_ORIGIN || `${req.protocol}://${req.get('host')}`;
  if (
    (req.headers.origin && req.headers.origin !== expected) ||
    req.headers['sec-fetch-site'] === 'cross-site'
  ) {
    res.status(403).json({ error: 'Request origin is not allowed.' });
    return;
  }
  next();
});
const live = () => process.env.DATA_MODE === 'live';
app.get('/api/config', (_req, res) => {
  res.json({ mode: live() ? 'live' : 'demo', ownerConfigured: authConfigured() });
});
app.get('/api/storefront', async (_req, res) => {
  res.json(
    live()
      ? await (await getDatabase()).storefront()
      : { settings: CAFE_DEFAULTS, categories: CATEGORIES, items: INITIAL_MENU },
  );
});
app.get('/api/auth', async (req, res) => {
  res.json({ authenticated: await isOwner(req) });
});
app.post(
  '/api/auth/login',
  rateLimit({ windowMs: 15 * 60_000, limit: 8, standardHeaders: 'draft-8', legacyHeaders: false }),
  async (req, res) => {
    if (!live() || !authConfigured()) {
      res.status(503).json({ error: 'Owner access has not been configured.' });
      return;
    }
    const { password } = z.object({ password: z.string().min(1).max(256) }).parse(req.body);
    if (!(await verifyPassword(password))) {
      res.status(401).json({ error: 'The password is incorrect.' });
      return;
    }
    res.cookie(SESSION_COOKIE, await createSession(), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL),
      sameSite: 'strict',
      path: '/',
      maxAge: 8 * 60 * 60_000,
    });
    res.json({ authenticated: true });
  },
);
app.post('/api/auth/logout', (_req, res) => {
  res.clearCookie(SESSION_COOKIE, {
    path: '/',
    sameSite: 'strict',
    secure: process.env.NODE_ENV === 'production' || Boolean(process.env.VERCEL),
    httpOnly: true,
  });
  res.json({ success: true });
});
app.use('/api/orders', (_req, res, next) => {
  if (!live()) {
    res.status(409).json({ error: 'Portfolio orders are saved only in your browser.' });
    return;
  }
  next();
});
app.post(
  '/api/orders',
  rateLimit({ windowMs: 60_000, limit: 10, standardHeaders: 'draft-8', legacyHeaders: false }),
  async (req, res) => {
    const order = await (await getDatabase()).createOrder(orderSchema.parse(req.body));
    res.status(201).json(publicOrder(order));
  },
);
app.get('/api/orders/:reference', async (req, res) => {
  const reference = z
    .string()
    .regex(/^HG-[A-F0-9]{18}$/)
    .parse(req.params.reference);
  const order = await (await getDatabase()).order(reference);
  if (!order) {
    res
      .status(404)
      .json({ error: 'We couldn’t find that order. Check your reference and try again.' });
    return;
  }
  res.json(publicOrder(order));
});
app.use('/api/owner', async (req, res, next) => {
  if (!live() || !(await isOwner(req))) {
    res.status(401).json({ error: 'Please sign in to the owner workspace.' });
    return;
  }
  next();
});
app.get('/api/owner', async (_req, res) => {
  res.json(await (await getDatabase()).dashboard());
});
app.patch('/api/owner/menu/:id', async (req, res) => {
  const id = z.coerce.number().int().positive().parse(req.params.id);
  await (await getDatabase()).updateMenu(id, menuChangesSchema.parse(req.body));
  res.json({ success: true });
});
app.patch('/api/owner/settings', async (req, res) => {
  await (await getDatabase()).updateSettings(settingsChangesSchema.parse(req.body));
  res.json({ success: true });
});
app.patch('/api/owner/orders/:reference', async (req, res) => {
  const { status } = z.object({ status: z.enum(STATUSES) }).parse(req.body);
  await (await getDatabase()).updateStatus(String(req.params.reference), status);
  res.json({ success: true });
});
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'API endpoint not found.' });
});
const errors: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof ZodError) {
    res.status(400).json({ error: error.issues[0]?.message || 'Please check your input.' });
    return;
  }
  if (error instanceof SyntaxError) {
    res.status(400).json({ error: 'Invalid request.' });
    return;
  }
  const userErrors = [
    'Online ordering',
    'An item in',
    'Please combine',
    'Orders must',
    'Order not found',
    'The requested item',
  ];
  if (error instanceof Error && userErrors.some((prefix) => error.message.startsWith(prefix))) {
    res.status(409).json({ error: error.message });
    return;
  }
  console.error('[API]', error instanceof Error ? error.message : 'Unknown error');
  res
    .status(503)
    .json({ error: 'The café connection is temporarily unavailable. Please try again.' });
};
app.use(errors);
export default app;
