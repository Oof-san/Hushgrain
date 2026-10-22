import { useMemo, useState, type FormEvent } from 'react';
import { Link, useLocation } from 'wouter';
import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  Check,
  CheckCircle2,
  Clock3,
  Coffee,
  Copy,
  Leaf,
  MapPin,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Store,
  X,
} from 'lucide-react';
import {
  ButtonLink,
  Grain,
  OrderSummary,
  ProductCard,
  Quantity,
  TextLink,
  Timeline,
} from './components';
import { money, placeOrder, queryClient, useConfig, useOrder, useStorefront } from './data';
import { useCart, useToast } from './state';
import { orderSchema } from '../../shared/orders';
export function Home() {
  const { data } = useStorefront();
  const favourites = (data?.items || [])
    .filter((item) => item.isFeatured && item.isAvailable)
    .slice(0, 4);
  return (
    <main id="main" tabIndex={-1}>
      <section id="hero" className="hero">
        <div className="hero-copy">
          <p className="eyebrow">
            <span className="tiny-star">✳</span> YOUR DAILY DOSE OF SLOW
          </p>
          <h1>
            A <em>softer</em>
            <br />
            kind of
            <br />
            everyday<span>.</span>
          </h1>
          <p className="hero-description">
            Considered coffee. Oven-warm bakes.
            <br />A little space to just be.
          </p>
          <div className="hero-actions">
            <ButtonLink href="/menu">Find your favourite</ButtonLink>
            <a
              href="#house-favourites"
              className="round-link"
              aria-label="Discover our house favourites"
            >
              <ArrowDown size={18} />
            </a>
          </div>
          <div className="hero-footnote">
            <span className="green-dot" />
            <span>
              BREWING DAILY
              <br />
              <b>7:00 AM — 8:00 PM</b>
            </span>
            <span className="hero-footnote-line" />
            <span>
              GOOD MORNINGS.
              <br />
              <b>GREAT AFTERNOONS.</b>
            </span>
          </div>
        </div>
        <div className="hero-visual">
          <picture>
            <source media="(max-width: 700px)" srcSet="/images/hero-mobile.webp" />
            <img
              src="/images/hero.webp"
              alt="Leaf latte art and a warm butter croissant on a sunlit walnut table"
              fetchPriority="high"
              width="1536"
              height="1024"
            />
          </picture>
          <div className="hero-photo-label">
            <span>THE LITTLE THINGS, DONE WELL.</span>
            <span>01 / The morning ritual</span>
          </div>
          <div className="hero-stamp">
            <Grain />
            <span>
              COFFEE • BAKES
              <br />& GOOD COMPANY
            </span>
          </div>
        </div>
      </section>
      <div className="ritual-strip">
        <div>
          <Coffee strokeWidth={1.3} />
          <span>
            Carefully poured.<small>Every cup, a little considered.</small>
          </span>
        </div>
        <div>
          <ShoppingBag strokeWidth={1.3} />
          <span>
            Your pace, your place.<small>Pickup or make yourself at home.</small>
          </span>
        </div>
        <div>
          <Leaf strokeWidth={1.3} />
          <span>
            Simple things. Better.<small>Freshly baked. Made with care.</small>
          </span>
        </div>
      </div>
      <section className="wrap section favourites" id="house-favourites">
        <div className="section-heading">
          <div>
            <p className="eyebrow">01 / THE HOUSE FAVOURITES</p>
            <h2>
              Good things,
              <br />
              <em>worth slowing down for.</em>
            </h2>
          </div>
          <div>
            <p>
              The familiar. The unexpected.
              <br />
              The reason you’ll come back.
            </p>
            <TextLink href="/menu">Explore the full menu</TextLink>
          </div>
        </div>
        <div className="product-grid favourites-grid">
          {favourites.map((item) => (
            <ProductCard item={item} key={item.id} compact />
          ))}
        </div>
        <div className="section-caption">
          <span>A little sweet. A little savoury. Entirely your kind of day.</span>
          <span>
            MADE FRESH, ENJOYED SLOWLY <ArrowRight size={13} />
          </span>
        </div>
      </section>
      <section className="story-section" id="our-story">
        <div className="story-photo">
          <img
            src="/images/interior.webp"
            alt="A quiet sunlit café with warm walnut furniture, an espresso counter, and leafy plants"
            loading="lazy"
            width="1536"
            height="1024"
          />
          <span className="photo-note">A CORNER OF THE CITY, AT YOUR PACE.</span>
        </div>
        <div className="story-copy">
          <p className="eyebrow">02 / A PLACE TO EXHALE</p>
          <h2>
            The city can wait.
            <br />
            <em>Stay a little.</em>
          </h2>
          <p>
            We believe a good café is more than a very good cup of coffee. It’s a familiar face. A
            sunlit table. That first bite of something still warm from the oven.
          </p>
          <p>
            Hushgrain is our little invitation to slow down. Thoughtful coffee, uncomplicated food,
            and room for whatever the day brings.
          </p>
          <div className="story-signoff">
            <Grain />
            <span>
              Made with care.
              <br />
              <em>Always served with a little warmth.</em>
            </span>
          </div>
          <TextLink href="/#visit">Find your corner</TextLink>
        </div>
      </section>
      <section className="seasonal-section">
        <div className="wrap seasonal-inner">
          <div className="seasonal-copy">
            <p className="eyebrow">A BRIGHTER KIND OF COFFEE BREAK</p>
            <h2>
              A little sunshine,
              <br />
              <em>on the rocks.</em>
            </h2>
            <p>
              Meet our Citrus Tonic Espresso. Sparkling citrus, a clean espresso float, and the kind
              of lift your afternoon was waiting for.
            </p>
            <ButtonLink href="/menu?category=cold-crafted" light>
              Meet your afternoon ritual
            </ButtonLink>
            <span className="seasonal-note">BRIGHT. BUBBLY. BEAUTIFULLY BALANCED.</span>
          </div>
          <div className="seasonal-photo">
            <img
              src="/images/citrus-tonic-espresso.webp"
              alt="Golden sparkling citrus tonic espresso with an orange peel garnish over ice"
              loading="lazy"
              width="1024"
              height="1024"
            />
            <span className="seasonal-tag">
              A HOUSE
              <br />
              <em>favourite.</em>
            </span>
          </div>
        </div>
      </section>
      <section className="wrap section visit-section" id="visit">
        <div className="visit-copy">
          <p className="eyebrow">03 / YOUR USUAL CORNER</p>
          <h2>
            Somewhere
            <br />
            <em>to call your own.</em>
          </h2>
          <p>
            Bring a book, bring a friend, or just bring yourself. There’s a little breathing room
            here for everyone.
          </p>
          <div className="visit-info">
            <div>
              <MapPin size={20} strokeWidth={1.4} />
              <p>
                <strong>In the neighbourhood</strong>
                {data?.settings.address}
              </p>
            </div>
            <div>
              <Clock3 size={20} strokeWidth={1.4} />
              <p>
                <strong>For early starts & slow afternoons</strong>Every day · 7:00 AM – 8:00 PM
              </p>
            </div>
          </div>
          <a
            className="text-link"
            href="https://www.google.com/maps/search/?api=1&query=Legazpi+Village+Makati"
            target="_blank"
            rel="noreferrer"
          >
            Explore Legazpi Village <ArrowUpRight size={17} />
          </a>
          <p className="fine-print visit-concept">
            A café concept set in Legazpi Village. Address and space are illustrative.
          </p>
        </div>
        <div className="visit-photo">
          <img
            src="/images/exterior.webp"
            alt="A leafy neighbourhood café entrance with a walnut door and inviting outdoor seating"
            loading="lazy"
            width="1024"
            height="1024"
          />
          <span className="visit-photo-tag">
            <Grain />
            <span>
              COME AS YOU ARE.
              <br />
              STAY AS LONG AS YOU LIKE.
            </span>
          </span>
        </div>
      </section>
    </main>
  );
}
export function MenuPage() {
  const { data } = useStorefront();
  const initialCategory = new URLSearchParams(window.location.search).get('category') || 'all';
  const [category, setCategory] = useState(initialCategory);
  const [search, setSearch] = useState('');
  const [vegan, setVegan] = useState(false);
  const [sort, setSort] = useState('house');
  const shown = useMemo(() => {
    const categoryId = data?.categories.find((entry) => entry.slug === category)?.id;
    const result = (data?.items || []).filter(
      (item) =>
        (!categoryId || item.categoryId === categoryId) &&
        (!vegan || item.tags.includes('vegan')) &&
        `${item.name} ${item.description}`.toLowerCase().includes(search.toLowerCase().trim()),
    );
    return sort === 'low'
      ? result.sort((a, b) => a.priceCents - b.priceCents)
      : sort === 'high'
        ? result.sort((a, b) => b.priceCents - a.priceCents)
        : result;
  }, [data, category, search, vegan, sort]);
  return (
    <main id="main" tabIndex={-1}>
      <section className="menu-hero wrap">
        <div>
          <p className="eyebrow">GOOD TASTE, AT YOUR OWN PACE</p>
          <h1>
            Find your
            <br />
            <em>kind of good.</em>
          </h1>
          <p>
            Your first cup. Your favourite bite.
            <br />
            Made for the moments in between.
          </p>
        </div>
        <div className="menu-hero-photo">
          <img
            src="/images/house-flat-white.webp"
            alt="Our house flat white, poured with care"
            width="600"
            height="600"
          />
          <span className="eyebrow">SMALL RITUALS. BIG FEELINGS.</span>
        </div>
      </section>
      <section className="wrap menu-section">
        <div className="menu-controls">
          <div className="category-tabs" role="group" aria-label="Menu categories">
            <button aria-pressed={category === 'all'} onClick={() => setCategory('all')}>
              All good things
            </button>
            {data?.categories.map((entry) => (
              <button
                key={entry.id}
                aria-pressed={category === entry.slug}
                onClick={() => setCategory(entry.slug)}
              >
                {entry.name}
              </button>
            ))}
          </div>
          <div className="menu-tools">
            <label className="search-field">
              <Search size={17} />
              <span className="sr-only">Search the menu</span>
              <input
                type="search"
                placeholder="Find a little something…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </label>
            <label className="vegan-toggle">
              <input
                type="checkbox"
                checked={vegan}
                onChange={(event) => setVegan(event.target.checked)}
              />
              <Leaf size={14} />
              Vegan options
            </label>
            <label className="sort-select">
              <span className="sr-only">Sort menu items</span>
              <select value={sort} onChange={(event) => setSort(event.target.value)}>
                <option value="house">House selection</option>
                <option value="low">Price: low to high</option>
                <option value="high">Price: high to low</option>
              </select>
            </label>
          </div>
        </div>
        <div className="menu-results-row">
          <p className="eyebrow" aria-live="polite">
            {shown.length} GOOD THING{shown.length === 1 ? '' : 'S'} TO CHOOSE FROM
          </p>
          <span>Made fresh. All day.</span>
        </div>
        {shown.length ? (
          <div className="product-grid menu-grid">
            {shown.map((item) => (
              <ProductCard item={item} key={item.id} />
            ))}
          </div>
        ) : (
          <div className="empty-state">
            <Search size={30} strokeWidth={1} />
            <h2>No match, this time.</h2>
            <p>Try another search or explore all the good things.</p>
            <button
              className="button"
              onClick={() => {
                setSearch('');
                setCategory('all');
                setVegan(false);
              }}
            >
              Show the full menu <ArrowRight size={16} />
            </button>
          </div>
        )}
        <div className="menu-bottom-note">
          <Leaf size={20} strokeWidth={1.3} />
          <p>
            A little something for everyone.
            <span>Plant-based options available. Tap any item for ingredients and allergens.</span>
          </p>
        </div>
      </section>
    </main>
  );
}
export function Checkout() {
  const { data } = useStorefront();
  const { data: config } = useConfig();
  const cart = useCart();
  const [, navigate] = useLocation();
  const [type, setType] = useState<'pickup' | 'dine_in'>('pickup');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [idempotencyKey] = useState(() => crypto.randomUUID());
  const selected = cart.lines.map((line) => ({
    line,
    item: data?.items.find((item) => item.id === line.menuItemId),
  }));
  const unavailable = selected.some(({ item }) => !item?.isAvailable);
  const subtotal = selected.reduce(
    (total, { item, line }) => total + (item?.priceCents || 0) * line.quantity,
    0,
  );
  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (busy || !cart.lines.length || unavailable || !config) return;
    const fields = Object.fromEntries(new FormData(event.currentTarget));
    const parsed = orderSchema.safeParse({
      ...fields,
      orderType: type,
      items: cart.lines,
      idempotencyKey,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0].message);
      return;
    }
    setBusy(true);
    setError('');
    try {
      const order = await placeOrder(parsed.data, config.mode);
      queryClient.setQueryData(['order', config.mode, order.orderNumber], order);
      await queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      cart.clear();
      navigate(`/confirmation/${order.orderNumber}`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Please try again.');
      setBusy(false);
    }
  };
  if (!cart.lines.length)
    return (
      <main id="main" tabIndex={-1} className="wrap section">
        <div className="empty-state">
          <ShoppingBag size={44} strokeWidth={1} />
          <p className="eyebrow">ROOM FOR SOMETHING GOOD</p>
          <h1>Your tray is waiting.</h1>
          <p>Let’s find your first little pick-me-up.</p>
          <ButtonLink href="/menu">Explore the menu</ButtonLink>
        </div>
      </main>
    );
  return (
    <main id="main" tabIndex={-1} className="wrap checkout-page">
      <Link className="back-link" href="/menu">
        <ArrowLeft size={15} /> Back to the good things
      </Link>
      <div className="checkout-heading">
        <p className="eyebrow">ALMOST TIME TO SLOW DOWN</p>
        <h1>
          Your good moment,
          <br />
          <em>made to order.</em>
        </h1>
      </div>
      {config?.mode === 'demo' && (
        <div className="demo-notice">
          <Sparkles size={18} />
          <p>
            <strong>You’re trying the Hushgrain demo.</strong> Use sample details. Your order stays
            in this browser; no café is notified and no payment is taken.
          </p>
        </div>
      )}
      <div className="checkout-grid">
        <form onSubmit={submit} className="checkout-form">
          <fieldset>
            <legend>
              <span>01</span> How would you like it?
            </legend>
            <div className="fulfillment-options">
              <button
                type="button"
                aria-pressed={type === 'pickup'}
                onClick={() => setType('pickup')}
              >
                <ShoppingBag size={22} strokeWidth={1.3} />
                <strong>Take a little good with you</strong>
                <span>Pickup · About {data?.settings.pickupMinutes} min</span>
                {type === 'pickup' && <Check size={15} className="selected-check" />}
              </button>
              <button
                type="button"
                aria-pressed={type === 'dine_in'}
                onClick={() => setType('dine_in')}
              >
                <Store size={22} strokeWidth={1.3} />
                <strong>Make yourself at home</strong>
                <span>Dine-in · About {data?.settings.dineInMinutes} min</span>
                {type === 'dine_in' && <Check size={15} className="selected-check" />}
              </button>
            </div>
            {type === 'dine_in' && (
              <label className="field">
                <span>Your table number</span>
                <input name="dineInInfo" required maxLength={100} placeholder="e.g. Table 04" />
              </label>
            )}
          </fieldset>
          <fieldset>
            <legend>
              <span>02</span> A name for your cup.
            </legend>
            <label className="field">
              <span>Your name</span>
              <input
                name="customerName"
                autoComplete="given-name"
                required
                minLength={2}
                maxLength={100}
                placeholder={
                  config?.mode === 'demo' ? 'e.g. Alex Demo' : 'What should we call you?'
                }
              />
            </label>
            <div className="form-columns">
              <label className="field">
                <span>Phone number</span>
                <input
                  name="phone"
                  type="tel"
                  autoComplete="tel"
                  required
                  minLength={7}
                  maxLength={30}
                  placeholder="09XX XXX XXXX"
                />
              </label>
              <label className="field">
                <span>
                  Email <small>optional</small>
                </span>
                <input
                  name="email"
                  type="email"
                  autoComplete="email"
                  maxLength={200}
                  placeholder="you@example.com"
                />
              </label>
            </div>
            <label className="field">
              <span>
                Anything we should know? <small>optional</small>
              </span>
              <textarea
                name="notes"
                maxLength={500}
                rows={3}
                placeholder="A special request, an allergy, a little note…"
              />
            </label>
          </fieldset>
          <div className="checkout-payment">
            <ShieldCheck size={22} strokeWidth={1.4} />
            <p>
              <strong>A good old-fashioned counter payment.</strong>Pay when you pick up, or before
              you leave. Your total is inclusive of menu prices; no extra service or delivery fees.
            </p>
          </div>
          {error && (
            <p className="form-error" role="alert">
              {error}
            </p>
          )}
          {unavailable && (
            <p className="form-error" role="alert">
              An item is sold out. Remove it from your tray before continuing.
            </p>
          )}
          <button
            className="button full-width"
            disabled={busy || unavailable || !data?.settings.orderOpen}
            type="submit"
          >
            {busy
              ? 'Sending your good moment…'
              : config?.mode === 'demo'
                ? `Place demo order · ${money(subtotal)}`
                : `Place order · ${money(subtotal)}`}
            <ArrowUpRight size={18} />
          </button>
          <p className="fine-print center">We’ll make it with care. You enjoy it at your pace.</p>
        </form>
        <aside className="checkout-review">
          <div className="row">
            <h2>Your little selection.</h2>
            <span className="eyebrow">{cart.count} ITEMS</span>
          </div>
          {selected.map(({ item, line }) => (
            <div className="review-line" key={line.menuItemId}>
              <img src={item?.imageUrl} alt="" width="74" height="82" />
              <div>
                <div className="row">
                  <h3>{item?.name || 'Unavailable item'}</h3>
                  <button
                    className="icon-button"
                    onClick={() => cart.quantity(line.menuItemId, 0)}
                    aria-label={`Remove ${item?.name || 'unavailable item'}`}
                  >
                    <X size={15} />
                  </button>
                </div>
                <p>
                  {money(item?.priceCents || 0)}
                  {!item?.isAvailable && <span className="error-text"> · Sold out</span>}
                </p>
                <Quantity
                  name={item?.name || 'item'}
                  value={line.quantity}
                  set={(quantity) => cart.quantity(line.menuItemId, quantity)}
                />
                {line.specialInstructions && (
                  <p className="fine-print">{line.specialInstructions}</p>
                )}
              </div>
            </div>
          ))}
          <div className="review-total row">
            <span>Total</span>
            <strong>{money(subtotal)}</strong>
          </div>
          <div className="review-location">
            <MapPin size={18} />
            <p>
              <strong>Your neighbourhood corner.</strong>
              {data?.settings.address}
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
export function Confirmation({ params }: { params: { reference: string } }) {
  const { data: order, isPending, error, refetch } = useOrder(params.reference);
  const { data: config } = useConfig();
  const toast = useToast();
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(params.reference);
      toast('Order reference copied.');
    } catch {
      toast('Select the order reference to copy it.');
    }
  };
  return (
    <main id="main" tabIndex={-1} className="wrap order-page">
      <div className="order-intro">
        <span className="success-mark">
          <CheckCircle2 size={26} strokeWidth={1.2} />
        </span>
        <p className="eyebrow">
          {config?.mode === 'demo' ? 'YOUR DEMO ORDER IS IN' : 'YOUR ORDER IS IN'}
        </p>
        <h1>
          Good things
          <br />
          <em>are on their way.</em>
        </h1>
        <p>One less thing to rush. A little more to look forward to.</p>
      </div>
      {isPending ? (
        <p className="center">Finding your good moment…</p>
      ) : error ? (
        <div className="error-panel">
          <p role="alert">{error.message}</p>
          <button className="button" onClick={() => refetch()}>
            Try again
          </button>
        </div>
      ) : (
        order && (
          <div className="order-card">
            <div className="order-card-top">
              <div>
                <p className="eyebrow">KEEP THIS LITTLE REFERENCE</p>
                <button className="reference-copy" onClick={copy}>
                  {order.orderNumber}
                  <Copy size={15} />
                </button>
              </div>
              <span className="eta">
                <Clock3 size={16} />
                {order.status === 'ready'
                  ? 'Ready for you'
                  : order.status === 'completed'
                    ? 'Enjoy your day'
                    : `About ${order.estimatedMinutes} minutes`}
              </span>
            </div>
            <Timeline order={order} />
            <OrderSummary order={order} />
            <p className="fine-print">
              {config?.mode === 'demo'
                ? 'Sandbox order. Move it through the stages in the owner workspace.'
                : 'Estimates are approximate. This page updates as the café prepares your order.'}
            </p>
          </div>
        )
      )}
      <div className="order-actions">
        <ButtonLink href={`/track?order=${encodeURIComponent(params.reference)}`}>
          Track your order
        </ButtonLink>
        {config?.mode === 'demo' && <TextLink href="/owner">Try the owner workspace</TextLink>}
      </div>
    </main>
  );
}
export function Track() {
  const initial = new URLSearchParams(window.location.search).get('order') || '';
  const [draft, setDraft] = useState(initial);
  const [reference, setReference] = useState(initial);
  const { data: config } = useConfig();
  const { data: order, isFetching, error } = useOrder(reference);
  const submit = (event: FormEvent) => {
    event.preventDefault();
    setReference(draft.trim().toUpperCase());
  };
  return (
    <main id="main" tabIndex={-1} className="wrap track-page">
      <div className="track-top">
        <div className="track-heading">
          <p className="eyebrow">FROM OUR COUNTER TO YOUR CORNER</p>
          <h1>
            A little closer
            <br />
            <em>to your cup.</em>
          </h1>
          <p>Pop in your order reference. We’ll take it from here.</p>
          <form className="track-form" onSubmit={submit}>
            <label>
              <span className="sr-only">Order reference</span>
              <input
                required
                maxLength={40}
                minLength={5}
                placeholder="HG-YOUR-ORDER-REFERENCE"
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                autoCapitalize="characters"
                spellCheck={false}
              />
            </label>
            <button className="button" type="submit">
              Find my order <ArrowRight size={17} />
            </button>
          </form>
          <p className="fine-print">You’ll find the reference on your order confirmation screen.</p>
          {config?.mode === 'demo' && (
            <button
              className="text-link demo-sample"
              onClick={() => {
                setDraft('HG-DEMO-001');
                setReference('HG-DEMO-001');
              }}
            >
              Just looking? Try a sample order <ArrowUpRight size={15} />
            </button>
          )}
        </div>
        <div className="track-photo">
          <img
            src="/images/house-flat-white.webp"
            alt="A latte with leaf art, ready for a slower moment"
            width="600"
            height="600"
          />
          <span>
            <Grain /> GOOD THINGS TAKE A LITTLE CARE.
          </span>
        </div>
      </div>
      {reference && (
        <div className="tracking-result" aria-live="polite">
          {isFetching && !order ? (
            <p>Checking the counter…</p>
          ) : error ? (
            <div className="error-panel">
              <Search size={24} />
              <h2>Let’s take another look.</h2>
              <p role="alert">{error.message}</p>
            </div>
          ) : (
            order && (
              <div className="order-card">
                <div className="order-card-top">
                  <div>
                    <p className="eyebrow">
                      {order.orderType === 'pickup' ? 'YOUR PICKUP ORDER' : 'YOUR TABLE ORDER'}
                    </p>
                    <p className="reference-copy">{order.orderNumber}</p>
                  </div>
                  <span className={`status status-${order.status}`}>{order.status}</span>
                </div>
                <h2 className="tracking-title">
                  {order.status === 'ready'
                    ? 'Ready when you are.'
                    : order.status === 'completed'
                      ? 'Here’s to a good day.'
                      : 'A little care is underway.'}
                </h2>
                <Timeline order={order} />
                <OrderSummary order={order} />
                {config?.mode === 'demo' && (
                  <p className="fine-print">
                    Demo status changes when you advance the order in the{' '}
                    <Link href="/owner">owner workspace</Link>.
                  </p>
                )}
              </div>
            )
          )}
        </div>
      )}
    </main>
  );
}
export function NotFound() {
  return (
    <main id="main" tabIndex={-1} className="wrap section">
      <div className="empty-state">
        <Coffee size={40} strokeWidth={1} />
        <p className="eyebrow">404 / A LITTLE OFF THE MENU</p>
        <h1>Let’s find your way back.</h1>
        <p>There’s a good cup waiting on the other side.</p>
        <ButtonLink href="/">Back to Hushgrain</ButtonLink>
      </div>
    </main>
  );
}
