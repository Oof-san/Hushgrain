# Hushgrain

**Good coffee. A softer pace.**

An independent café concept with an editorial storefront, a complete ordering journey, and an owner workspace. Built for a portfolio, with an optional live ordering backend. The café identity, address, and photography are illustrative.

## Run locally

Use Node.js 24 LTS and npm.

```sh
npm ci
npm run dev
```

Open http://localhost:3000. The default is a **browser-local demo**. No account, database, API key, payment service, or platform-specific runtime is required. Each visitor gets their own sandbox. Use fictional contact details.

The logo in both the header and footer returns to the home hero. It also works when the visitor is already on the home page.

## Explore the demo

1. Browse `/menu`. Filter by category, search, choose vegan options, or sort by price.
2. Open an item for dietary and allergen details. Add it to your tray and add special instructions.
3. Check out for pickup or dine-in. Dine-in requires a table number.
4. Keep the order reference on the confirmation screen. Track it at `/track`.
5. Open `/owner`. Advance the same order through Received → Preparing → Ready → Completed.
6. Edit a menu item, price, availability, or featured status. Pause ordering, adjust estimates, or choose one of three palettes. Changes are reflected in the storefront.
7. Reset the demo from the owner workspace for a clean start.

Demo state and the tray persist in this browser. Another device or browser has a separate sandbox. If browser storage is blocked, the current session remains usable in memory, but reload persistence is unavailable. Nothing is sent to a real café. No payment is collected and no confirmation email is sent.

## Live ordering

Copy `.env.example` to `.env`, set `DATA_MODE=live`, and restart the server. A local SQLite database is created automatically at `data/hushgrain.db`. Tables and starter content initialize idempotently, and subsequent starts preserve edits and orders.

Generate an owner password hash and session secret:

```sh
npm run password:hash
```

The script prompts in your local terminal; the password is visible there. Put the generated `ADMIN_PASSWORD_HASH` and `ADMIN_SESSION_SECRET` values in `.env`. Use a password of at least 12 characters. Owner access remains locked until both are configured. There is no default owner password. Secrets are used only by the server; never prefix them with `VITE_`.

Set `APP_ORIGIN` to the exact origin where the app runs, such as `http://localhost:3000`. For Vercel, use the final HTTPS deployment origin.

The live API validates inputs, calculates prices from the server catalog, rejects unavailable items, and creates orders inside database transactions. A unique idempotency key prevents repeated submissions from creating duplicate orders. Public tracking contains the ordered items and status, and excludes names, contact information, private notes, and special instructions. Treat the long order reference as a private tracking link.

Authentication uses a scrypt password hash, a signed eight-hour session, and an HttpOnly SameSite=Strict cookie. Origin checks and per-process rate limits protect mutations. Multi-instance production deployments should also configure rate limits at the hosting edge, since process-local counters are not shared across instances. Resetting or rotating the session secret invalidates existing sessions.

The app uses counter payment. Payments, refunds, email/SMS notifications, customer accounts, delivery routing, and multi-staff permissions are not implemented.

## Build and verify

```sh
npm run check
npm test
npm run build
npm start
```

`npm start` serves the built frontend and API together. `npm run preview` previews only the Vite frontend and does **not** serve the API; use `npm start` for a complete production preview.

Browser tests use Playwright. On Windows, installed Edge is selected by default. On other systems, install Chromium with `npx playwright install chromium`. Set `PLAYWRIGHT_CHANNEL=chromium` to use Chromium on Windows too.

```sh
npm run test:e2e
npm run format:check
```

The tests cover the two checkout paths, persistence, tracking, owner operations, filters, modal dismissal, themes, 320/390/768/1440px layouts, missing images, and automated WCAG A/AA checks. Automated accessibility checks do not replace an assistive-technology review.

## Project structure

| Path                        | Responsibility                                                      |
| --------------------------- | ------------------------------------------------------------------- |
| `client/src/pages.tsx`      | Home, menu, checkout, confirmation, tracking, and 404               |
| `client/src/components.tsx` | Navigation, logo links, product cards, dialogs, tray, and timelines |
| `client/src/Owner.tsx`      | Owner workspace, sign-in, menu and service controls                 |
| `client/src/data.ts`        | API access, query cache, and isolated demo data                     |
| `client/src/state.tsx`      | Validated saved tray and notifications                              |
| `client/src/styles.css`     | Responsive design system and three palettes                         |
| `shared/catalog.ts`         | Concept café settings and the 13-item starter menu                  |
| `shared/orders.ts`          | Shared validation and order pricing rules                           |
| `server/db.ts`              | SQLite/Turso persistence and transactional operations               |
| `server/auth.ts`            | Independent owner authentication                                    |
| `server/app.ts`             | Express API, authorization, origin checks, and rate limits          |
| `api/index.js`              | Vercel function entry point                                         |
| `client/public/images`      | All 17 optimized, locally served photographs                        |

Catalog IDs are derived from the seed order. Preserve existing seed positions once a live database exists; append new items or use an explicit data migration rather than reordering seeds. SQLite stores catalog and order snapshots as JSON within indexed tables. The previous MySQL schema is not compatible; this is a fresh installation, not an automatic migration of existing customer records.

All fonts are served locally through Fontsource packages. All artwork is generated and shipped with the source; see [ARTWORK.md](ARTWORK.md). The only external visitor link is an optional Google Maps search. The app does not embed a map or use a Maps API key.

## GitHub and Vercel

See [DEPLOYMENT.md](DEPLOYMENT.md) for the prepared deployment settings. This folder is the repository root. The repository is Oof-san/Hushgrain and the deployed domain is hushgrain.vercel.app.

## Stack

React 19, Vite 8, TypeScript 7, Express 5, TanStack Query, Zod, libSQL/Turso, jose, Lucide, Vitest, Playwright, and axe-core. Exact verified versions are in `package-lock.json`.

The portfolio build embeds demo mode and does not call the server API. DATA_MODE=live must be set before building and running a live installation. Run npm run test:deployment after npm run build to verify the bundled Vercel function entry.
