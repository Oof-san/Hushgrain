import type { CAFE_DEFAULTS, INITIAL_MENU, CATEGORIES } from './catalog';
export type Settings = Omit<typeof CAFE_DEFAULTS, 'activeTheme'> & {
  activeTheme: 'espresso' | 'olive' | 'midnight';
};
export type MenuItem = (typeof INITIAL_MENU)[number];
export type Category = (typeof CATEGORIES)[number];
export type Storefront = { settings: Settings; items: MenuItem[]; categories: Category[] };
export type CartLine = { menuItemId: number; quantity: number; specialInstructions: string };
export const STATUSES = ['received', 'preparing', 'ready', 'completed'] as const;
export type Status = (typeof STATUSES)[number];
export type OrderLine = {
  menuItemId: number;
  itemName: string;
  priceCents: number;
  quantity: number;
  specialInstructions: string;
};
export type Order = {
  orderNumber: string;
  customerName: string;
  phone: string;
  email: string;
  orderType: 'pickup' | 'dine_in';
  dineInInfo: string;
  notes: string;
  status: Status;
  subtotalCents: number;
  createdAt: string;
  estimatedMinutes: number;
  items: OrderLine[];
  idempotencyKey: string;
};
export type PublicOrder = Omit<
  Order,
  'phone' | 'email' | 'customerName' | 'notes' | 'idempotencyKey' | 'dineInInfo' | 'items'
> & { items: Omit<OrderLine, 'specialInstructions'>[] };
export type MenuChanges = Partial<
  Pick<MenuItem, 'name' | 'priceCents' | 'isAvailable' | 'isFeatured'>
>;
export type SettingsChanges = Partial<
  Pick<Settings, 'orderOpen' | 'pickupMinutes' | 'dineInMinutes' | 'activeTheme'>
>;
