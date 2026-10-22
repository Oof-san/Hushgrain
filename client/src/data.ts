import { QueryClient, useQuery } from '@tanstack/react-query';
import { CAFE_DEFAULTS, CATEGORIES, INITIAL_MENU } from '../../shared/catalog';
import {
  menuChangesSchema,
  priceOrder,
  publicOrder,
  settingsChangesSchema,
  validateTransition,
  type OrderInput,
} from '../../shared/orders';
import type {
  MenuChanges,
  Order,
  PublicOrder,
  SettingsChanges,
  Status,
  Storefront,
} from '../../shared/types';
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, staleTime: 15_000, refetchOnWindowFocus: false },
    mutations: { retry: false },
  },
});
export type Config = { mode: 'demo' | 'live'; ownerConfigured: boolean };
export async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
    credentials: 'same-origin',
  });
  const body = await response.json();
  if (!response.ok)
    throw new Error(body.error || 'We couldn’t complete that request. Please try again.');
  return body as T;
}
export function useConfig() {
  return useQuery({
    queryKey: ['config'],
    queryFn: () => request<Config>('/api/config'),
    staleTime: Infinity,
  });
}
type DemoState = { version: 2; storefront: Storefront; orders: Order[] };
const DEMO_KEY = 'hushgrain-sandbox-v2';
function initialDemo(): DemoState {
  const storefront = structuredClone({
    settings: CAFE_DEFAULTS,
    categories: CATEGORIES,
    items: INITIAL_MENU,
  });
  const seed: Order[] = ['Alex', 'Sam', 'Jamie'].map((customerName, i) => ({
    ...priceOrder(
      {
        customerName,
        phone: '09000000000',
        email: '',
        orderType: i === 1 ? 'dine_in' : 'pickup',
        dineInInfo: i === 1 ? 'Table 04' : '',
        notes: '',
        idempotencyKey: crypto.randomUUID(),
        items: [{ menuItemId: i + 1, quantity: i === 2 ? 2 : 1, specialInstructions: '' }],
      },
      storefront,
      `HG-DEMO-00${i + 1}`,
    ),
    status: i === 0 ? 'received' : i === 1 ? 'preparing' : 'ready',
    createdAt: new Date(Date.now() - (i + 1) * 180_000).toISOString(),
  }));
  return { version: 2, storefront, orders: seed };
}
let memory: DemoState | undefined;
function demo(): DemoState {
  try {
    const stored = localStorage.getItem(DEMO_KEY);
    if (stored) {
      const parsed: DemoState = JSON.parse(stored);
      if (
        parsed.version === 2 &&
        Array.isArray(parsed.orders) &&
        Array.isArray(parsed.storefront?.items)
      )
        return parsed;
    }
  } catch {
    /* Browser storage can be unavailable. Keep this session usable in memory. */
  }
  memory ??= initialDemo();
  return structuredClone(memory);
}
function save(state: DemoState) {
  memory = state;
  try {
    localStorage.setItem(DEMO_KEY, JSON.stringify(state));
  } catch {
    /* In-memory fallback. */
  }
}
export function resetDemo() {
  const state = initialDemo();
  save(state);
  void queryClient.invalidateQueries();
}
export function useStorefront() {
  const { data: config } = useConfig();
  return useQuery({
    queryKey: ['storefront', config?.mode],
    queryFn: () =>
      config?.mode === 'demo'
        ? Promise.resolve(demo().storefront)
        : request<Storefront>('/api/storefront'),
    enabled: Boolean(config),
    refetchInterval: 20_000,
  });
}
export function useOrder(reference: string) {
  const { data: config } = useConfig();
  return useQuery({
    queryKey: ['order', config?.mode, reference],
    enabled: Boolean(config && reference),
    refetchInterval: 5000,
    queryFn: async (): Promise<PublicOrder> => {
      if (config?.mode === 'live') return request(`/api/orders/${encodeURIComponent(reference)}`);
      const order = demo().orders.find((order) => order.orderNumber === reference);
      if (!order)
        throw new Error('We couldn’t find that order. Check your reference and try again.');
      return publicOrder(order);
    },
  });
}
export function useDashboard(enabled: boolean) {
  const { data: config } = useConfig();
  return useQuery({
    queryKey: ['dashboard', config?.mode],
    enabled: enabled && Boolean(config),
    refetchInterval: 5000,
    queryFn: () =>
      config?.mode === 'demo'
        ? Promise.resolve({ ...demo().storefront, orders: demo().orders })
        : request<Storefront & { orders: Order[] }>('/api/owner'),
  });
}
export async function placeOrder(input: OrderInput, mode: Config['mode']): Promise<PublicOrder> {
  if (mode === 'live')
    return request('/api/orders', { method: 'POST', body: JSON.stringify(input) });
  const state = demo();
  const existing = state.orders.find((order) => order.idempotencyKey === input.idempotencyKey);
  if (existing) return publicOrder(existing);
  const number = `HG-${crypto.randomUUID().replaceAll('-', '').slice(0, 18).toUpperCase()}`;
  const order = priceOrder(input, state.storefront, number);
  state.orders.unshift(order);
  save(state);
  return publicOrder(order);
}
export async function updateMenu(id: number, changes: MenuChanges, mode: Config['mode']) {
  const parsed = menuChangesSchema.parse(changes);
  if (mode === 'live')
    await request(`/api/owner/menu/${id}`, { method: 'PATCH', body: JSON.stringify(parsed) });
  else {
    const state = demo();
    state.storefront.items = state.storefront.items.map((item) =>
      item.id === id ? { ...item, ...parsed } : item,
    );
    save(state);
  }
  await queryClient.invalidateQueries({ queryKey: ['storefront'] });
  await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
}
export async function updateSettings(changes: SettingsChanges, mode: Config['mode']) {
  const parsed = settingsChangesSchema.parse(changes);
  if (mode === 'live')
    await request('/api/owner/settings', { method: 'PATCH', body: JSON.stringify(parsed) });
  else {
    const state = demo();
    Object.assign(state.storefront.settings, parsed);
    save(state);
  }
  await queryClient.invalidateQueries({ queryKey: ['storefront'] });
  await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
}
export async function updateStatus(reference: string, status: Status, mode: Config['mode']) {
  if (mode === 'live')
    await request(`/api/owner/orders/${reference}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  else {
    const state = demo();
    const order = state.orders.find((order) => order.orderNumber === reference);
    if (!order) throw new Error('Order not found.');
    validateTransition(order.status, status);
    order.status = status;
    save(state);
  }
  await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
  await queryClient.invalidateQueries({ queryKey: ['order'] });
}
export function money(cents: number) {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
    maximumFractionDigits: cents % 100 ? 2 : 0,
  }).format(cents / 100);
}
