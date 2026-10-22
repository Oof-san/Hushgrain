import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'wouter';
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  Coffee,
  Leaf,
  Menu,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
  X,
} from 'lucide-react';
import { money, useConfig, useStorefront } from './data';
import { useCart, useToast } from './state';
import type { MenuItem, PublicOrder } from '../../shared/types';
import { STATUSES } from '../../shared/types';
export function Grain({ className = '' }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 42" fill="none" aria-hidden="true">
      <path d="M16 39V5" stroke="currentColor" strokeWidth="1.4" />
      <path
        d="M16 29C7 29 4 22 5 18c7 0 11 5 11 11Zm0-10C8 18 7 12 8 8c6 1 8 6 8 11Zm0 10c9 0 12-7 11-11-7 0-11 5-11 11Zm0-10c8-1 9-7 8-11-6 1-8 6-8 11ZM16 11c-4-4-4-7 0-10 4 3 4 6 0 10Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
    </svg>
  );
}
export function Wordmark({ large = false }: { large?: boolean }) {
  return (
    <span className={`wordmark ${large ? 'wordmark-large' : ''}`}>
      <Grain />
      hushgrain<span className="brand-dot">.</span>
    </span>
  );
}
export function BrandLink({
  large = false,
  onNavigate,
}: {
  large?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <HomeSectionLink section="hero" label="Hushgrain home" onNavigate={onNavigate}>
      <Wordmark large={large} />
    </HomeSectionLink>
  );
}
export function HomeSectionLink({
  section,
  label,
  children,
  onNavigate,
  className,
}: {
  section: string;
  label?: string;
  children: ReactNode;
  onNavigate?: () => void;
  className?: string;
}) {
  const [location] = useLocation();
  return (
    <Link
      href={`/#${section}`}
      aria-label={label}
      className={className}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        onNavigate?.();
        if (location === '/') {
          event.preventDefault();
          document.getElementById(section)?.scrollIntoView({
            behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches
              ? 'instant'
              : 'smooth',
          });
        }
      }}
    >
      {children}
    </Link>
  );
}
export function ButtonLink({
  href,
  children,
  light = false,
  className = '',
}: {
  href: string;
  children: ReactNode;
  light?: boolean;
  className?: string;
}) {
  return (
    <Link href={href} className={`button ${light ? 'button-light' : ''} ${className}`}>
      {children}
      <ArrowUpRight size={17} />
    </Link>
  );
}
export function TextLink({ href, children }: { href: string; children: ReactNode }) {
  if (href.startsWith('/#'))
    return (
      <HomeSectionLink section={href.slice(2)} className="text-link">
        {children}
        <ArrowUpRight size={17} />
      </HomeSectionLink>
    );
  return (
    <Link className="text-link" href={href}>
      {children}
      <ArrowUpRight size={17} />
    </Link>
  );
}
export function Modal({
  title,
  children,
  onClose,
  className = '',
}: {
  title: string;
  children: ReactNode;
  onClose: () => void;
  className?: string;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const id = useId();
  useEffect(() => {
    const element = ref.current!;
    const previous = document.activeElement as HTMLElement | null;
    element.showModal();
    const before = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      element.close();
      document.body.style.overflow = before;
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={id}
      className={`modal ${className}`}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="modal-inner">
        <div className="modal-top">
          <h2 id={id}>{title}</h2>
          <button type="button" className="icon-button" aria-label="Close dialog" onClick={onClose}>
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </dialog>
  );
}
export function Loading({ error, retry }: { error?: string; retry?: () => void }) {
  return (
    <main id="main" className="loading-screen">
      <Grain />
      <h1>{error ? 'A brief pause.' : 'Something good is brewing.'}</h1>
      <p>{error || 'Making a little room for your day.'}</p>
      {retry && (
        <button className="button" onClick={retry}>
          Try again <ArrowRight size={16} />
        </button>
      )}
    </main>
  );
}
export function Shell({ children }: { children: ReactNode }) {
  const [location] = useLocation();
  const [nav, setNav] = useState(false);
  const [tray, setTray] = useState(false);
  const [about, setAbout] = useState(false);
  const cart = useCart();
  const { data } = useStorefront();
  const { data: config } = useConfig();
  useEffect(() => {
    setNav(false);
    setTray(false);
  }, [location]);
  return (
    <div className={`site theme-${data?.settings.activeTheme || 'espresso'}`}>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <div className="topline">
        <span>Good coffee. A softer pace.</span>
        {config?.mode === 'demo' ? (
          <button onClick={() => setAbout(true)}>
            A café concept, made to explore <ArrowUpRight size={12} />
          </button>
        ) : (
          <span>Legazpi Village, Makati</span>
        )}
      </div>
      <header className="header">
        <div className="nav-wrap">
          <BrandLink onNavigate={() => setNav(false)} />
          <nav aria-label="Main navigation" className="desktop-nav">
            <Link href="/menu" aria-current={location === '/menu' ? 'page' : undefined}>
              The menu
            </Link>
            <HomeSectionLink section="our-story" onNavigate={() => setNav(false)}>
              Our story
            </HomeSectionLink>
            <HomeSectionLink section="visit" onNavigate={() => setNav(false)}>
              Find your corner
            </HomeSectionLink>
            <Link href="/track" aria-current={location === '/track' ? 'page' : undefined}>
              Track an order
            </Link>
          </nav>
          <div className="nav-actions">
            <button
              className="tray-button"
              onClick={() => setTray(true)}
              aria-label={`Open your tray, ${cart.count} items`}
            >
              <ShoppingBag size={17} />
              <span>Your tray</span>
              <b>{cart.count}</b>
            </button>
            <button
              className="icon-button mobile-toggle"
              onClick={() => setNav(!nav)}
              aria-label={nav ? 'Close navigation' : 'Open navigation'}
              aria-expanded={nav}
              aria-controls="mobile-nav"
            >
              {nav ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
        {nav && (
          <nav id="mobile-nav" className="mobile-nav" aria-label="Mobile navigation">
            <Link href="/menu">
              The menu <ArrowUpRight size={16} />
            </Link>
            <HomeSectionLink section="our-story" onNavigate={() => setNav(false)}>
              Our story <ArrowUpRight size={16} />
            </HomeSectionLink>
            <HomeSectionLink section="visit" onNavigate={() => setNav(false)}>
              Find your corner <ArrowUpRight size={16} />
            </HomeSectionLink>
            <Link href="/track">
              Track an order <ArrowUpRight size={16} />
            </Link>
          </nav>
        )}
      </header>
      {data && !data.settings.orderOpen && (
        <div className="notice">
          Online ordering is taking a pause. Browse the menu and come back soon.
        </div>
      )}
      {children}
      <footer className="footer">
        <div className="wrap footer-top">
          <div>
            <p className="eyebrow">THERE’S ALWAYS ROOM FOR ONE MORE</p>
            <h2>
              See you at
              <br />
              <em>the usual?</em>
            </h2>
            <ButtonLink href="/menu" light>
              Find your favourite
            </ButtonLink>
          </div>
          <div className="footer-links">
            <div>
              <span className="eyebrow">COME ON IN</span>
              <Link href="/menu">The menu</Link>
              <HomeSectionLink section="our-story" onNavigate={() => setNav(false)}>
                Our story
              </HomeSectionLink>
              <HomeSectionLink section="visit" onNavigate={() => setNav(false)}>
                Visit the café
              </HomeSectionLink>
            </div>
            <div>
              <span className="eyebrow">MAKE YOURSELF AT HOME</span>
              <Link href="/track">Track an order</Link>
              <Link href="/owner">
                Owner workspace <ArrowUpRight size={13} />
              </Link>
              <button onClick={() => setAbout(true)}>About this project</button>
            </div>
          </div>
        </div>
        <div className="wrap footer-bottom">
          <BrandLink large onNavigate={() => setNav(false)} />
          <div>
            <span>© {new Date().getFullYear()} Hushgrain</span>
            <span>
              {config?.mode === 'demo'
                ? 'Independent café concept · Portfolio demo'
                : 'Good coffee. A softer pace.'}
            </span>
          </div>
        </div>
      </footer>
      {tray && <CartModal onClose={() => setTray(false)} />}
      {about && (
        <Modal title="A little about Hushgrain." onClose={() => setAbout(false)}>
          <div className="prose">
            <p>
              Hushgrain is an independent café concept built as an interactive portfolio project.
              The café, address, menu, and imagery are part of the concept.
            </p>
            <p>
              {config?.mode === 'demo'
                ? 'You’re exploring the sandbox. Orders and menu changes stay in this browser. No order reaches a real café and no payment is collected. Use sample contact details at checkout.'
                : 'This installation is configured for live ordering. Orders are saved to the café database.'}
            </p>
            <p>
              Try building a tray, checking out, tracking your order, and managing the counter in
              the owner workspace.
            </p>
            <ButtonLink href="/owner">Explore the workspace</ButtonLink>
          </div>
        </Modal>
      )}
    </div>
  );
}
function CartModal({ onClose }: { onClose: () => void }) {
  const { data } = useStorefront();
  const cart = useCart();
  const selected = cart.lines
    .map((line) => ({ line, item: data?.items.find((item) => item.id === line.menuItemId) }))
    .filter((entry): entry is { line: (typeof cart.lines)[number]; item: MenuItem } =>
      Boolean(entry.item),
    );
  const total = selected.reduce((sum, { item, line }) => sum + item.priceCents * line.quantity, 0);
  return (
    <Modal title="Your little pick-me-up." onClose={onClose} className="cart-modal">
      <p className="muted">
        {cart.count
          ? `${cart.count} good thing${cart.count === 1 ? '' : 's'} in your tray.`
          : 'Something good belongs here.'}
      </p>
      {!selected.length ? (
        <div className="empty-state">
          <Coffee size={36} strokeWidth={1} />
          <h3>A moment, waiting to happen.</h3>
          <p>Start with a coffee. See where it takes you.</p>
          <ButtonLink href="/menu">Explore the menu</ButtonLink>
        </div>
      ) : (
        <>
          <div className="cart-lines">
            {selected.map(({ item, line }) => (
              <div className="cart-line" key={item.id}>
                <img src={item.imageUrl} alt="" width="80" height="90" />
                <div className="cart-line-body">
                  <div className="row">
                    <h3>{item.name}</h3>
                    <button
                      className="icon-button"
                      aria-label={`Remove ${item.name}`}
                      onClick={() => cart.quantity(item.id, 0)}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                  <p>
                    {money(item.priceCents)}
                    {!item.isAvailable && <strong className="error-text"> · Sold out</strong>}
                  </p>
                  <Quantity
                    name={item.name}
                    value={line.quantity}
                    set={(quantity) => cart.quantity(item.id, quantity)}
                  />
                  <label className="cart-note">
                    <span className="sr-only">Special instructions for {item.name}</span>
                    <input
                      maxLength={300}
                      placeholder="Any special requests?"
                      value={line.specialInstructions}
                      onChange={(event) => cart.instructions(item.id, event.target.value)}
                    />
                  </label>
                </div>
              </div>
            ))}
          </div>
          <div className="cart-total row">
            <span>Subtotal</span>
            <strong>{money(total)}</strong>
          </div>
          <ButtonLink href="/checkout" className="full-width">
            Continue to checkout
          </ButtonLink>
          <p className="fine-print center">Pickup or dine-in · Pay at the counter</p>
        </>
      )}
    </Modal>
  );
}
export function Quantity({
  name,
  value,
  set,
}: {
  name: string;
  value: number;
  set: (value: number) => void;
}) {
  return (
    <div className="quantity">
      <button type="button" aria-label={`Decrease ${name} quantity`} onClick={() => set(value - 1)}>
        <Minus size={13} />
      </button>
      <span aria-live="polite">{value}</span>
      <button
        type="button"
        aria-label={`Increase ${name} quantity`}
        disabled={value >= 12}
        onClick={() => set(value + 1)}
      >
        <Plus size={13} />
      </button>
    </div>
  );
}
export function ProductCard({ item, compact = false }: { item: MenuItem; compact?: boolean }) {
  const [details, setDetails] = useState(false);
  const cart = useCart();
  const toast = useToast();
  const { data } = useStorefront();
  const inTray = cart.lines.find((line) => line.menuItemId === item.id)?.quantity || 0;
  const add = () => {
    if (inTray >= 12) {
      toast('You can add up to 12 of each item.');
      return;
    }
    cart.add(item.id);
    toast(`${item.name} added to your tray.`);
  };
  const canAdd = item.isAvailable && Boolean(data?.settings.orderOpen);
  return (
    <article className={`product-card ${compact ? 'compact' : ''}`}>
      <div className="product-image">
        <button
          className="product-detail-trigger"
          onClick={() => setDetails(true)}
          aria-label={`View ${item.name} details`}
        >
          <img src={item.imageUrl} alt={item.name} loading="lazy" width="600" height="640" />
        </button>
        <span className="product-badge">
          {!item.isAvailable ? 'Back soon' : item.tags[0] || 'House favourite'}
        </span>
        <button
          className="product-add"
          onClick={add}
          aria-label={`Add ${item.name} to tray`}
          disabled={!canAdd || inTray >= 12}
        >
          <Plus size={20} strokeWidth={1.5} />
        </button>
      </div>
      <div className="product-caption">
        <div className="row">
          <h3>
            <button onClick={() => setDetails(true)}>{item.name}</button>
          </h3>
          <span>{money(item.priceCents)}</span>
        </div>
        {!compact && <p>{item.description}</p>}
        <span className="product-category">
          {CATEGORIES.find((category) => category.id === item.categoryId)?.name}
        </span>
      </div>
      {details && (
        <Modal title={item.name} onClose={() => setDetails(false)} className="product-modal">
          <img className="detail-image" src={item.imageUrl} alt={item.name} />
          <p className="prose">{item.description}</p>
          <div className="dietary">
            <p>
              <Leaf size={16} />
              <span>
                <strong>Dietary</strong>
                {item.dietaryNotes}
              </span>
            </p>
            <p>
              <Coffee size={16} />
              <span>
                <strong>Allergens</strong>
                {item.allergenNotes}
              </span>
            </p>
          </div>
          <p className="fine-print">
            Prepared in a shared kitchen. Please speak to the team about severe allergies.
          </p>
          <button className="button full-width" disabled={!canAdd || inTray >= 12} onClick={add}>
            {!item.isAvailable
              ? 'Back on the menu soon'
              : !data?.settings.orderOpen
                ? 'Ordering is paused'
                : `Add to your tray · ${money(item.priceCents)}`}
            <Plus size={17} />
          </button>
        </Modal>
      )}
    </article>
  );
}
import { CATEGORIES } from '../../shared/catalog';
export function Timeline({ order }: { order: PublicOrder }) {
  const current = STATUSES.indexOf(order.status);
  return (
    <ol className="timeline" aria-label={`Order status: ${order.status}`}>
      {STATUSES.map((status, index) => (
        <li
          key={status}
          className={index <= current ? 'done' : ''}
          aria-current={index === current ? 'step' : undefined}
        >
          <span>{index < current ? <Check size={14} /> : index + 1}</span>
          <div>
            <strong>
              {status === 'received'
                ? 'Received'
                : status === 'preparing'
                  ? 'Preparing'
                  : status === 'ready'
                    ? 'Ready for you'
                    : 'Enjoyed'}
            </strong>
            <p>
              {
                [
                  'Your order is at the counter.',
                  'A little care in every cup.',
                  order.orderType === 'pickup'
                    ? 'Come collect your good moment.'
                    : 'Coming to your table.',
                  'Thank you for slowing down with us.',
                ][index]
              }
            </p>
          </div>
        </li>
      ))}
    </ol>
  );
}
export function OrderSummary({ order }: { order: PublicOrder }) {
  return (
    <div className="order-summary">
      <p className="eyebrow">YOUR ORDER</p>
      {order.items.map((item) => (
        <div className="row" key={item.menuItemId}>
          <span>
            {item.quantity} × {item.itemName}
          </span>
          <span>{money(item.quantity * item.priceCents)}</span>
        </div>
      ))}
      <div className="row total">
        <strong>Total · Pay at the counter</strong>
        <strong>{money(order.subtotalCents)}</strong>
      </div>
    </div>
  );
}
export function ScrollManager() {
  const [location] = useLocation();
  useEffect(() => {
    const titles: Record<string, string> = {
      '/': 'Good coffee. A softer pace.',
      '/menu': 'The all-day menu',
      '/checkout': 'Your good moment',
      '/track': 'Track your order',
      '/owner': 'The owner workspace',
    };
    document.title = `Hushgrain — ${titles[location] || 'Your order'}`;
    if (window.location.hash) {
      requestAnimationFrame(() =>
        document.getElementById(window.location.hash.slice(1))?.scrollIntoView(),
      );
    } else {
      window.scrollTo({ top: 0, behavior: 'instant' });
      document.querySelector<HTMLElement>('main')?.focus({ preventScroll: true });
    }
  }, [location]);
  return null;
}
