import { beforeEach, afterEach, describe, expect, it } from 'vitest';
import { createClient } from '@libsql/client';
import { CafeDatabase } from '../server/db';
import { publicOrder } from '../shared/orders';
let database: CafeDatabase;
const input = (extra = {}) => ({
  customerName: 'Alex Demo',
  phone: '09000000000',
  email: 'alex@example.com',
  orderType: 'pickup' as const,
  dineInInfo: '',
  notes: 'Test order',
  idempotencyKey: crypto.randomUUID(),
  items: [
    { menuItemId: 1, quantity: 2, specialInstructions: 'Oat milk please' },
    { menuItemId: 7, quantity: 1, specialInstructions: '' },
  ],
  ...extra,
});
beforeEach(() => {
  database = new CafeDatabase(createClient({ url: 'file::memory:' }));
});
afterEach(() => database.client.close());
describe('independent ordering database', () => {
  it('starts from an empty database and preserves menu edits across initialization', async () => {
    const storefront = await database.storefront();
    expect(storefront.items).toHaveLength(13);
    await database.updateMenu(1, { name: 'Updated Flat White', priceCents: 19950 });
    await database.initialize();
    expect((await database.storefront()).items[0].priceCents).toBe(19950);
  });
  it('calculates totals from server prices and stores an atomic complete order', async () => {
    const order = await database.createOrder(input());
    expect(order.subtotalCents).toBe(52000);
    expect(order.items).toHaveLength(2);
    expect(order.orderNumber).toMatch(/^HG-[A-F0-9]{18}$/);
    expect(await database.order(order.orderNumber)).toEqual(order);
  });
  it('returns one order for duplicate submissions using the same idempotency key', async () => {
    const data = input();
    const first = await database.createOrder(data);
    const second = await database.createOrder(data);
    expect(first.orderNumber).toBe(second.orderNumber);
    expect((await database.dashboard()).orders).toHaveLength(1);
  });
  it('rejects unavailable items and paused ordering without partial records', async () => {
    await database.updateMenu(1, { isAvailable: false });
    await expect(database.createOrder(input())).rejects.toThrow('no longer available');
    expect((await database.dashboard()).orders).toHaveLength(0);
    await database.updateMenu(1, { isAvailable: true });
    await database.updateSettings({ orderOpen: false });
    await expect(database.createOrder(input())).rejects.toThrow('paused');
  });
  it('rejects duplicate lines and invalid quantities and requires a dine-in table', async () => {
    const data = input();
    await expect(
      database.createOrder(input({ items: [data.items[0], data.items[0]] })),
    ).rejects.toThrow('duplicate');
    await expect(
      database.createOrder(input({ items: [{ menuItemId: 1, quantity: 13 }] })),
    ).rejects.toThrow();
    await expect(
      database.createOrder(input({ orderType: 'dine_in', dineInInfo: '' })),
    ).rejects.toThrow('table number');
  });
  it('advances statuses one step at a time and rejects stale updates', async () => {
    const order = await database.createOrder(input());
    await expect(database.updateStatus(order.orderNumber, 'completed')).rejects.toThrow(
      'one stage',
    );
    await database.updateStatus(order.orderNumber, 'preparing');
    await expect(database.updateStatus(order.orderNumber, 'preparing')).rejects.toThrow(
      'one stage',
    );
    await database.updateStatus(order.orderNumber, 'ready');
    await database.updateStatus(order.orderNumber, 'completed');
    expect((await database.order(order.orderNumber))?.status).toBe('completed');
  });
  it('omits customer contact and private instructions from public tracking', async () => {
    const data = publicOrder(await database.createOrder(input()));
    expect(data).not.toHaveProperty('phone');
    expect(data).not.toHaveProperty('email');
    expect(data).not.toHaveProperty('customerName');
    expect(data).not.toHaveProperty('notes');
    expect(data).not.toHaveProperty('idempotencyKey');
    expect(data.items[0]).not.toHaveProperty('specialInstructions');
  });
});
