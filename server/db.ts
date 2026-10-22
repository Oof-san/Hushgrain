import { createClient as createRemoteClient, type Client } from '@libsql/client/web';
import { mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { randomBytes } from 'node:crypto';
import { CAFE_DEFAULTS, CATEGORIES, INITIAL_MENU } from '../shared/catalog';
import { priceOrder, validateTransition, type OrderInput } from '../shared/orders';
import type {
  MenuChanges,
  MenuItem,
  Order,
  Settings,
  SettingsChanges,
  Status,
  Storefront,
} from '../shared/types';
export class CafeDatabase {
  private ready?: Promise<void>;
  constructor(readonly client: Client) {}
  async initialize() {
    this.ready ??= this.seed().catch((error) => {
      this.ready = undefined;
      throw error;
    });
    await this.ready;
  }
  private async seed() {
    await this.client.batch(
      [
        'CREATE TABLE IF NOT EXISTS settings (id INTEGER PRIMARY KEY CHECK (id = 1), data TEXT NOT NULL)',
        'CREATE TABLE IF NOT EXISTS menu (id INTEGER PRIMARY KEY, data TEXT NOT NULL)',
        'CREATE TABLE IF NOT EXISTS orders (reference TEXT PRIMARY KEY, idempotency_key TEXT NOT NULL UNIQUE, data TEXT NOT NULL, created_at TEXT NOT NULL)',
        'CREATE INDEX IF NOT EXISTS orders_by_date ON orders(created_at DESC)',
        {
          sql: 'INSERT OR IGNORE INTO settings (id,data) VALUES (1,?)',
          args: [JSON.stringify(CAFE_DEFAULTS)],
        },
        ...INITIAL_MENU.map((item) => ({
          sql: 'INSERT OR IGNORE INTO menu (id,data) VALUES (?,?)',
          args: [item.id, JSON.stringify(item)],
        })),
      ],
      'write',
    );
  }
  async storefront(): Promise<Storefront> {
    await this.initialize();
    const [settings, menu] = await this.client.batch(
      ['SELECT data FROM settings WHERE id=1', 'SELECT data FROM menu ORDER BY id'],
      'read',
    );
    return {
      settings: JSON.parse(String(settings.rows[0].data)) as Settings,
      categories: CATEGORIES,
      items: menu.rows.map((row) => JSON.parse(String(row.data)) as MenuItem),
    };
  }
  async order(reference: string): Promise<Order | null> {
    await this.initialize();
    const result = await this.client.execute({
      sql: 'SELECT data FROM orders WHERE reference=?',
      args: [reference],
    });
    return result.rows.length ? JSON.parse(String(result.rows[0].data)) : null;
  }
  async createOrder(input: OrderInput): Promise<Order> {
    await this.initialize();
    const tx = await this.client.transaction('write');
    try {
      const existing = await tx.execute({
        sql: 'SELECT data FROM orders WHERE idempotency_key=?',
        args: [input.idempotencyKey],
      });
      if (existing.rows.length) {
        await tx.commit();
        return JSON.parse(String(existing.rows[0].data));
      }
      const settings = await tx.execute('SELECT data FROM settings WHERE id=1');
      const menu = await tx.execute('SELECT data FROM menu ORDER BY id');
      const storefront: Storefront = {
        settings: JSON.parse(String(settings.rows[0].data)),
        items: menu.rows.map((row) => JSON.parse(String(row.data))),
        categories: CATEGORIES,
      };
      const order = priceOrder(
        input,
        storefront,
        `HG-${randomBytes(9).toString('hex').toUpperCase()}`,
      );
      await tx.execute({
        sql: 'INSERT INTO orders(reference,idempotency_key,data,created_at) VALUES (?,?,?,?)',
        args: [order.orderNumber, order.idempotencyKey, JSON.stringify(order), order.createdAt],
      });
      await tx.commit();
      return order;
    } catch (error) {
      await tx.rollback();
      throw error;
    } finally {
      tx.close();
    }
  }
  async dashboard() {
    const storefront = await this.storefront();
    const result = await this.client.execute(
      'SELECT data FROM orders ORDER BY created_at DESC LIMIT 250',
    );
    return {
      ...storefront,
      orders: result.rows.map((row) => JSON.parse(String(row.data)) as Order),
    };
  }
  async updateMenu(id: number, changes: MenuChanges) {
    await this.updateJson('menu', id, changes);
  }
  async updateSettings(changes: SettingsChanges) {
    await this.updateJson('settings', 1, changes);
  }
  private async updateJson(table: 'menu' | 'settings', id: number, changes: object) {
    await this.initialize();
    // Table is a closed union owned by server code. All values are bound parameters.
    const result = await this.client.execute({
      sql: `UPDATE ${table} SET data=json_patch(data,?) WHERE id=?`,
      args: [JSON.stringify(changes), id],
    });
    if (!result.rowsAffected) throw new Error('The requested item does not exist.');
  }
  async updateStatus(reference: string, status: Status) {
    await this.initialize();
    const tx = await this.client.transaction('write');
    try {
      const result = await tx.execute({
        sql: 'SELECT data FROM orders WHERE reference=?',
        args: [reference],
      });
      if (!result.rows.length) throw new Error('Order not found.');
      const order: Order = JSON.parse(String(result.rows[0].data));
      validateTransition(order.status, status);
      await tx.execute({
        sql: 'UPDATE orders SET data=? WHERE reference=?',
        args: [JSON.stringify({ ...order, status }), reference],
      });
      await tx.commit();
    } catch (error) {
      await tx.rollback();
      throw error;
    } finally {
      tx.close();
    }
  }
}
let database: Promise<CafeDatabase> | undefined;
export function getDatabase() {
  return (database ??= (async () => {
    const url = process.env.DATABASE_URL || 'file:./data/hushgrain.db';
    if (process.env.VERCEL && !url.startsWith('libsql://') && !url.startsWith('https://'))
      throw new Error('Live ordering on Vercel requires a remote database.');
    if (url.startsWith('file:') && url !== 'file::memory:')
      await mkdir(dirname(url.slice(5)), { recursive: true });
    // Remote/serverless deployments never load the native SQLite driver on startup.
    const createClient = url.startsWith('file:')
      ? (await import('@libsql/client')).createClient
      : createRemoteClient;
    return new CafeDatabase(createClient({ url, authToken: process.env.DATABASE_AUTH_TOKEN }));
  })().catch((error) => {
    database = undefined;
    throw error;
  }));
}
