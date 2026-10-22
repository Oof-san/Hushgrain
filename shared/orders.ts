import { z } from 'zod';
import type { Order, PublicOrder, Storefront, Status } from './types';
import { STATUSES } from './types';
export const orderSchema = z
  .object({
    customerName: z.string().trim().min(2, 'Please enter your name.').max(100),
    phone: z
      .string()
      .trim()
      .regex(/^[+\d\s()-]{7,30}$/, 'Please enter a valid phone number.'),
    email: z.union([z.email(), z.literal('')]).default(''),
    orderType: z.enum(['pickup', 'dine_in']),
    dineInInfo: z.string().trim().max(100).default(''),
    notes: z.string().trim().max(500).default(''),
    idempotencyKey: z.uuid(),
    items: z
      .array(
        z.object({
          menuItemId: z.number().int().positive(),
          quantity: z.number().int().min(1).max(12),
          specialInstructions: z.string().trim().max(300).default(''),
        }),
      )
      .min(1)
      .max(30),
  })
  .refine((input) => input.orderType !== 'dine_in' || input.dineInInfo.length > 0, {
    message: 'Please enter your table number.',
    path: ['dineInInfo'],
  });
export type OrderInput = z.infer<typeof orderSchema>;
export function priceOrder(raw: unknown, storefront: Storefront, number: string): Order {
  const input = orderSchema.parse(raw);
  if (!storefront.settings.orderOpen)
    throw new Error('Online ordering is paused. Please try again later.');
  if (new Set(input.items.map((line) => line.menuItemId)).size !== input.items.length)
    throw new Error('Please combine duplicate items in your tray.');
  const items = input.items.map((line) => {
    const item = storefront.items.find((item) => item.id === line.menuItemId);
    if (!item?.isAvailable)
      throw new Error('An item in your tray is no longer available. Please review your order.');
    return { ...line, itemName: item.name, priceCents: item.priceCents };
  });
  return {
    ...input,
    dineInInfo: input.orderType === 'dine_in' ? input.dineInInfo : '',
    items,
    orderNumber: number,
    status: 'received',
    createdAt: new Date().toISOString(),
    subtotalCents: items.reduce((sum, line) => sum + line.priceCents * line.quantity, 0),
    estimatedMinutes:
      input.orderType === 'pickup'
        ? storefront.settings.pickupMinutes
        : storefront.settings.dineInMinutes,
  };
}
export function publicOrder(order: Order): PublicOrder {
  const { orderNumber, orderType, status, subtotalCents, createdAt, estimatedMinutes, items } =
    order;
  return {
    orderNumber,
    orderType,
    status,
    subtotalCents,
    createdAt,
    estimatedMinutes,
    items: items.map(({ specialInstructions: _private, ...line }) => line),
  };
}
export function validateTransition(from: Status, to: Status) {
  if (STATUSES.indexOf(to) !== STATUSES.indexOf(from) + 1)
    throw new Error('Orders must move forward one stage at a time.');
}
export const menuChangesSchema = z
  .object({
    name: z.string().trim().min(2).max(100).optional(),
    priceCents: z.number().int().min(100).max(10000000).optional(),
    isAvailable: z.boolean().optional(),
    isFeatured: z.boolean().optional(),
  })
  .strict();
export const settingsChangesSchema = z
  .object({
    orderOpen: z.boolean().optional(),
    pickupMinutes: z.number().int().min(1).max(180).optional(),
    dineInMinutes: z.number().int().min(1).max(180).optional(),
    activeTheme: z.enum(['espresso', 'olive', 'midnight']).optional(),
  })
  .strict();
