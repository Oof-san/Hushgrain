import { useEffect, useState, type FormEvent } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Clock3,
  Coffee,
  LayoutDashboard,
  LockKeyhole,
  LogOut,
  RefreshCw,
  Settings2,
  ShoppingBag,
  Sparkles,
  UtensilsCrossed,
} from 'lucide-react';
import { Link } from 'wouter';
import {
  money,
  queryClient,
  request,
  resetDemo,
  updateMenu,
  updateSettings,
  updateStatus,
  useConfig,
  useDashboard,
} from './data';
import { useCart, useToast } from './state';
import { Modal } from './components';
import type { MenuChanges, MenuItem } from '../../shared/types';
import { STATUSES } from '../../shared/types';
export default function Owner() {
  const { data: config } = useConfig();
  const toast = useToast();
  const cart = useCart();
  const auth = useQuery({
    queryKey: ['auth'],
    queryFn: () => request<{ authenticated: boolean }>('/api/auth'),
    enabled: config?.mode === 'live',
    retry: false,
  });
  const allowed = config?.mode === 'demo' || Boolean(auth.data?.authenticated);
  const dashboard = useDashboard(allowed);
  const data = dashboard.data;
  const [tab, setTab] = useState<'orders' | 'menu' | 'settings'>('orders');
  const [filter, setFilter] = useState('active');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');
  const [confirmReset, setConfirmReset] = useState(false);
  async function action(key: string, work: () => Promise<unknown>, message: string) {
    if (busy) return;
    setBusy(key);
    setError('');
    try {
      await work();
      toast(message);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Please try again.');
    } finally {
      setBusy('');
    }
  }
  const login = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const password = new FormData(event.currentTarget).get('password');
    await action(
      'login',
      async () => {
        await request('/api/auth/login', { method: 'POST', body: JSON.stringify({ password }) });
        await queryClient.invalidateQueries({ queryKey: ['auth'] });
      },
      'Welcome back to the counter.',
    );
  };
  const logout = () =>
    action(
      'logout',
      async () => {
        await request('/api/auth/logout', { method: 'POST' });
        queryClient.removeQueries({ queryKey: ['dashboard'] });
        await queryClient.invalidateQueries({ queryKey: ['auth'] });
      },
      'You’re signed out.',
    );
  if (!allowed)
    return (
      <main id="main" tabIndex={-1} className="wrap owner-login">
        <div className="login-card">
          <LockKeyhole size={30} strokeWidth={1.2} />
          <p className="eyebrow">BEHIND THE COUNTER</p>
          <h1>
            A little care
            <br />
            <em>behind the scenes.</em>
          </h1>
          {auth.isPending && config?.mode === 'live' ? (
            <p>Checking your access…</p>
          ) : !config?.ownerConfigured ? (
            <p>
              Owner access hasn’t been set up yet. Please contact the person who manages this café
              installation.
            </p>
          ) : (
            <form onSubmit={login}>
              <label className="field">
                <span>Owner password</span>
                <input
                  type="password"
                  name="password"
                  required
                  maxLength={256}
                  autoComplete="current-password"
                />
              </label>
              {error && (
                <p role="alert" className="form-error">
                  {error}
                </p>
              )}
              <button className="button full-width" disabled={Boolean(busy)}>
                Open the workspace <ArrowRight size={17} />
              </button>
            </form>
          )}
          <Link className="text-link" href="/">
            Back to the café <ArrowUpRight size={15} />
          </Link>
        </div>
      </main>
    );
  const active = data?.orders.filter((order) => order.status !== 'completed') || [];
  const today = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
  const sales =
    data?.orders
      .filter(
        (order) =>
          order.status === 'completed' &&
          new Date(order.createdAt).toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' }) ===
            today,
      )
      .reduce((sum, order) => sum + order.subtotalCents, 0) || 0;
  const orders =
    data?.orders.filter(
      (order) =>
        filter === 'all' ||
        (filter === 'active' ? order.status !== 'completed' : order.status === 'completed'),
    ) || [];
  return (
    <main id="main" tabIndex={-1} className="workspace-page">
      <div className="wrap">
        <div className="workspace-heading">
          <div>
            <p className="eyebrow">HUSHGRAIN / BEHIND THE COUNTER</p>
            <h1>
              A good day,
              <br className="mobile-break" /> <em>in the making.</em>
            </h1>
            <p>The orders, the little details, and everything in between.</p>
          </div>
          <div className="workspace-heading-actions">
            <span className={`service-pill ${data?.settings.orderOpen ? 'is-open' : ''}`}>
              <span />
              {data?.settings.orderOpen ? 'Accepting orders' : 'Orders paused'}
            </span>
            {config?.mode === 'live' && (
              <button
                className="icon-button"
                aria-label="Sign out"
                onClick={logout}
                disabled={Boolean(busy)}
              >
                <LogOut size={18} />
              </button>
            )}
          </div>
        </div>
        {config?.mode === 'demo' && (
          <div className="demo-notice workspace-demo">
            <Sparkles size={18} />
            <p>
              <strong>Your own little café sandbox.</strong> Try advancing orders, editing the menu,
              or changing the atmosphere. Changes stay in this browser.
            </p>
            <button className="text-link" onClick={() => setConfirmReset(true)}>
              Reset demo <RefreshCw size={14} />
            </button>
          </div>
        )}
        <div className="workspace-tabs" role="group" aria-label="Workspace sections">
          <button aria-pressed={tab === 'orders'} onClick={() => setTab('orders')}>
            <LayoutDashboard size={16} />
            The counter <span>{active.length}</span>
          </button>
          <button aria-pressed={tab === 'menu'} onClick={() => setTab('menu')}>
            <UtensilsCrossed size={16} />
            The menu
          </button>
          <button aria-pressed={tab === 'settings'} onClick={() => setTab('settings')}>
            <Settings2 size={16} />
            The little details
          </button>
        </div>
        {error && (
          <p role="alert" className="form-error">
            {error}
          </p>
        )}
        {dashboard.isPending ? (
          <p className="empty-state">Opening the counter…</p>
        ) : dashboard.error ? (
          <div className="error-panel">
            <p role="alert">{dashboard.error.message}</p>
            <button className="button" onClick={() => dashboard.refetch()}>
              Try again
            </button>
          </div>
        ) : (
          data && (
            <>
              {tab === 'orders' && (
                <>
                  <div className="metrics">
                    <div>
                      <ShoppingBag size={20} strokeWidth={1.3} />
                      <p>AT THE COUNTER</p>
                      <strong>{active.length.toString().padStart(2, '0')}</strong>
                      <span>orders to make a little better</span>
                    </div>
                    <div>
                      <CheckCircle2 size={20} strokeWidth={1.3} />
                      <p>COMPLETED SALES TODAY</p>
                      <strong>{money(sales)}</strong>
                      <span>
                        {config?.mode === 'demo'
                          ? 'Demo totals · Philippine time'
                          : 'Pay at counter · Philippine time'}
                      </span>
                    </div>
                    <div>
                      <Clock3 size={20} strokeWidth={1.3} />
                      <p>PICKUP ESTIMATE</p>
                      <strong>
                        {data.settings.pickupMinutes}
                        <small> min</small>
                      </strong>
                      <span>a little good, coming right up</span>
                    </div>
                  </div>
                  <section className="workspace-panel">
                    <div className="panel-heading">
                      <div>
                        <h2>The order board.</h2>
                        <p>
                          <span className="green-dot" /> Updates every few seconds
                        </p>
                      </div>
                      <label className="sort-select">
                        <span className="sr-only">Filter orders</span>
                        <select value={filter} onChange={(event) => setFilter(event.target.value)}>
                          <option value="active">At the counter</option>
                          <option value="completed">Completed</option>
                          <option value="all">All orders</option>
                        </select>
                      </label>
                    </div>
                    {orders.length ? (
                      <div className="order-board">
                        {orders.map((order) => {
                          const nextStatus = STATUSES[STATUSES.indexOf(order.status) + 1];
                          return (
                            <article className="board-order" key={order.orderNumber}>
                              <div className="board-order-main">
                                <div className="row">
                                  <span className={`status status-${order.status}`}>
                                    {order.status}
                                  </span>
                                  <span className="fine-print">
                                    {new Date(order.createdAt).toLocaleTimeString('en-PH', {
                                      hour: '2-digit',
                                      minute: '2-digit',
                                      timeZone: 'Asia/Manila',
                                    })}
                                  </span>
                                </div>
                                <h3>{order.customerName}</h3>
                                <p className="fine-print">
                                  {order.orderType === 'pickup'
                                    ? 'Pickup'
                                    : `Dine-in · ${order.dineInInfo}`}
                                </p>
                                <code>{order.orderNumber}</code>
                              </div>
                              <div className="board-order-items">
                                {order.items.map((item) => (
                                  <p key={item.menuItemId}>
                                    <strong>{item.quantity}×</strong> {item.itemName}
                                    {item.specialInstructions && (
                                      <small>{item.specialInstructions}</small>
                                    )}
                                  </p>
                                ))}
                                {order.notes && (
                                  <div className="order-note">Note: {order.notes}</div>
                                )}
                                {config?.mode === 'live' && (
                                  <p className="fine-print">Contact: {order.phone}</p>
                                )}
                              </div>
                              <div className="board-order-action">
                                <strong>{money(order.subtotalCents)}</strong>
                                {nextStatus ? (
                                  <button
                                    className="button button-small"
                                    disabled={Boolean(busy)}
                                    onClick={() =>
                                      action(
                                        order.orderNumber,
                                        () =>
                                          updateStatus(order.orderNumber, nextStatus, config!.mode),
                                        `Order marked ${nextStatus}.`,
                                      )
                                    }
                                  >
                                    {busy === order.orderNumber
                                      ? 'Updating…'
                                      : nextStatus === 'preparing'
                                        ? 'Start preparing'
                                        : nextStatus === 'ready'
                                          ? 'Mark as ready'
                                          : 'Complete order'}
                                    <ArrowRight size={14} />
                                  </button>
                                ) : (
                                  <span className="completed-label">
                                    <Check size={15} /> A good moment, enjoyed.
                                  </span>
                                )}
                              </div>
                            </article>
                          );
                        })}
                      </div>
                    ) : (
                      <div className="empty-state">
                        <Coffee size={30} strokeWidth={1.2} />
                        <h3>A quiet little moment.</h3>
                        <p>
                          {filter === 'completed'
                            ? 'Completed orders will appear here.'
                            : 'New orders will find their way here.'}
                        </p>
                      </div>
                    )}
                  </section>
                </>
              )}
              {tab === 'menu' && (
                <section className="workspace-panel">
                  <div className="panel-heading">
                    <div>
                      <h2>A menu, thoughtfully kept.</h2>
                      <p>Keep the good things fresh, available, and priced just right.</p>
                    </div>
                    <span className="eyebrow">{data.items.length} ITEMS</span>
                  </div>
                  <div className="admin-menu-list">
                    {data.items.map((item) => (
                      <MenuEditor
                        item={item}
                        busy={Boolean(busy)}
                        key={item.id}
                        onSave={(changes) =>
                          action(
                            `menu-${item.id}`,
                            () => updateMenu(item.id, changes, config!.mode),
                            'Menu updated. A little better already.',
                          )
                        }
                      />
                    ))}
                  </div>
                </section>
              )}
              {tab === 'settings' && (
                <div className="settings-grid">
                  <section className="workspace-panel settings-panel">
                    <p className="eyebrow">THE PACE OF YOUR DAY</p>
                    <h2>A little room to adjust.</h2>
                    <label className="toggle-row">
                      <span>
                        <strong>Accept online orders</strong>
                        <small>A warm welcome, or a short pause.</small>
                      </span>
                      <input
                        type="checkbox"
                        className="switch"
                        checked={data.settings.orderOpen}
                        disabled={Boolean(busy)}
                        onChange={(event) =>
                          action(
                            'open',
                            () => updateSettings({ orderOpen: event.target.checked }, config!.mode),
                            'Ordering status updated.',
                          )
                        }
                      />
                    </label>
                    <Estimate
                      label="Pickup estimate"
                      value={data.settings.pickupMinutes}
                      busy={Boolean(busy)}
                      save={(value) =>
                        action(
                          'pickup',
                          () => updateSettings({ pickupMinutes: value }, config!.mode),
                          'Pickup estimate updated.',
                        )
                      }
                    />
                    <Estimate
                      label="Dine-in estimate"
                      value={data.settings.dineInMinutes}
                      busy={Boolean(busy)}
                      save={(value) =>
                        action(
                          'dine-in',
                          () => updateSettings({ dineInMinutes: value }, config!.mode),
                          'Dine-in estimate updated.',
                        )
                      }
                    />
                  </section>
                  <section className="workspace-panel settings-panel">
                    <p className="eyebrow">SET THE ATMOSPHERE</p>
                    <h2>Same café. A new feeling.</h2>
                    <p className="muted">Choose the palette that feels like your kind of day.</p>
                    <div className="theme-options">
                      {(
                        [
                          {
                            id: 'espresso',
                            name: 'Oat & Espresso',
                            note: 'Warm ivory. Quiet walnut.',
                          },
                          {
                            id: 'olive',
                            name: 'Sage & Linen',
                            note: 'Soft greens. A slower pace.',
                          },
                          {
                            id: 'midnight',
                            name: 'After Hours',
                            note: 'Deep espresso. Golden light.',
                          },
                        ] as const
                      ).map((theme) => (
                        <button
                          className={`theme-option theme-swatch-${theme.id}`}
                          key={theme.id}
                          disabled={Boolean(busy)}
                          aria-pressed={data.settings.activeTheme === theme.id}
                          onClick={() =>
                            action(
                              'theme',
                              () => updateSettings({ activeTheme: theme.id }, config!.mode),
                              'A new atmosphere, just like that.',
                            )
                          }
                        >
                          <span className="theme-swatches">
                            <i />
                            <i />
                            <i />
                          </span>
                          <strong>{theme.name}</strong>
                          <small>{theme.note}</small>
                          {data.settings.activeTheme === theme.id && (
                            <span className="theme-selected">
                              <Check size={12} /> Current atmosphere
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </section>
                </div>
              )}
            </>
          )
        )}
        {confirmReset && (
          <Modal title="A fresh start?" onClose={() => setConfirmReset(false)}>
            <div className="prose">
              <p>
                This resets your demo orders, menu edits, café settings, and tray in this browser.
                The original sample café will be ready to explore again.
              </p>
              <button
                className="button full-width"
                onClick={() => {
                  resetDemo();
                  cart.clear();
                  setConfirmReset(false);
                  toast('A fresh little start. The demo has been reset.');
                }}
              >
                Reset this demo <RefreshCw size={16} />
              </button>
            </div>
          </Modal>
        )}
      </div>
    </main>
  );
}
function MenuEditor({
  item,
  busy,
  onSave,
}: {
  item: MenuItem;
  busy: boolean;
  onSave: (changes: MenuChanges) => Promise<void>;
}) {
  const [name, setName] = useState(item.name);
  const [price, setPrice] = useState(String(item.priceCents / 100));
  const [error, setError] = useState('');
  useEffect(() => {
    setName(item.name);
    setPrice(String(item.priceCents / 100));
  }, [item.name, item.priceCents]);
  return (
    <form
      className="admin-menu-row"
      onSubmit={(event) => {
        event.preventDefault();
        const priceCents = Math.round(Number(price) * 100);
        if (
          name.trim().length < 2 ||
          !Number.isFinite(priceCents) ||
          priceCents < 100 ||
          priceCents > 10000000
        ) {
          setError('Enter a name and a price between ₱1 and ₱100,000.');
          return;
        }
        setError('');
        void onSave({ name: name.trim(), priceCents });
      }}
    >
      <img src={item.imageUrl} alt="" width="60" height="70" />
      <label className="field">
        <span className="sr-only">Name for {item.name}</span>
        <input
          aria-label={`Name for ${item.name}`}
          required
          minLength={2}
          maxLength={100}
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
      </label>
      <label className="price-field">
        <span>₱</span>
        <span className="sr-only">Price for {item.name}</span>
        <input
          type="number"
          required
          min="1"
          max="100000"
          step="0.01"
          value={price}
          onChange={(event) => setPrice(event.target.value)}
        />
      </label>
      <label className="admin-check">
        <input
          type="checkbox"
          checked={item.isAvailable}
          disabled={busy}
          onChange={(event) => void onSave({ isAvailable: event.target.checked })}
        />
        Available
      </label>
      <label className="admin-check">
        <input
          type="checkbox"
          checked={item.isFeatured}
          disabled={busy}
          onChange={(event) => void onSave({ isFeatured: event.target.checked })}
        />
        Featured
      </label>
      <button className="button button-small" disabled={busy} type="submit">
        Save <Check size={13} />
      </button>
      {error && (
        <p className="form-error" role="alert">
          {error}
        </p>
      )}
    </form>
  );
}
function Estimate({
  label,
  value,
  busy,
  save,
}: {
  label: string;
  value: number;
  busy: boolean;
  save: (value: number) => Promise<void>;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return (
    <form
      className="estimate-form"
      onSubmit={(event) => {
        event.preventDefault();
        if (Number.isInteger(draft) && draft >= 1 && draft <= 180) void save(draft);
      }}
    >
      <label className="field">
        <span>
          {label} <small>in minutes</small>
        </span>
        <input
          type="number"
          required
          min={1}
          max={180}
          value={draft}
          onChange={(event) => setDraft(Number(event.target.value))}
        />
      </label>
      <button type="submit" className="button button-small" disabled={busy}>
        Save <Check size={14} />
      </button>
    </form>
  );
}
