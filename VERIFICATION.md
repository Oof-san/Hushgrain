# Verification

Verified locally on 22 October 2026 with Node.js 24.19.0.

## Vercel startup fix — 2.0.1

The deployed `/api/config`, `/api/index`, and `/api/storefront` returned HTTP 500 `FUNCTION_INVOCATION_FAILED`. The demo frontend previously depended on the configuration endpoint, so that server crash prevented the storefront from rendering.

The demo build now embeds its mode and makes no API requests. The optional Vercel API uses a plain JavaScript entry pointing at the bundled Node 24 output; remote deployments load the web database driver rather than eagerly loading native SQLite. A live build still requires its live API and never silently becomes a sandbox.

Verification after this fix: 14 unit/API/database tests passed; the built Vercel entry booted in plain Node with the Vercel environment enabled; and three targeted browser scenarios passed, including complete demo checkout with all API routes blocked, pickup/status progression, and dine-in checkout. Strict TypeScript and formatting checks passed. Hosted behavior must be rechecked after the new commit deploys.

## Original overhaul verification

- TypeScript strict checking, including unused variables and parameters: passed.
- Production frontend and Node server build: passed.
- Built-server smoke checks: home, menu, tracking, owner, runtime configuration, and both hero images returned HTTP 200 with the expected content types.
- 11 backend and database tests: passed.
- 10 browser scenarios: passed across the full and focused reruns after fixes.
- Responsive checks at 320, 390, 768, and 1440px: passed, including absence of horizontal overflow and broken images.
- Automated axe WCAG A/AA checks: passed for home, menu, tracking, owner orders/menu/settings, the two alternate workspace palettes, and the populated pickup checkout.
- Formatting: passed.
- npm dependency audit: zero known vulnerabilities in the audited lockfile.
- Source and lockfile scan for the removed vendor runtime, service endpoints, tokens, and old brand: no matches in application code or dependency files.

The browser checks cover menu filters and search, dietary details and Escape dismissal, pickup and dine-in checkout, saved orders after reload, private instructions in the owner view, tracked status changes, menu edits, sold-out items, ordering pause, palette persistence, sandbox reset, mobile navigation, and logo-to-hero navigation. Both screenshot review and automated checks were used. Accessibility automation is not a claim of comprehensive compliance or an assistive-technology audit.

The local SQL adapter and live API were exercised with isolated SQLite databases. Remote Turso connectivity, Vercel routing, and hosted authentication require deployment credentials and have not yet been verified on a hosted installation.

Current principal versions: React/React DOM 19.3.1, Vite 8.3.5, TypeScript 7.0.2, Express 5.3.0, TanStack Query 5.104.5, libSQL client 0.18.0, Zod 4.6.7, Vitest 5.0.5, and Playwright 1.64.1. Node type definitions are intentionally aligned to the supported Node 24 runtime rather than the newest Node 26 definitions.
