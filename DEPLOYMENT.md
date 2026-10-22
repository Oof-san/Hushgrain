# GitHub and Vercel handoff

Repository: [Oof-san/Hushgrain](https://github.com/Oof-san/Hushgrain). Production domain: [hushgrain.vercel.app](https://hushgrain.vercel.app).

## Repository

Create a repository using the contents of **this `hushgrain` folder** as its root, not the parent chat directory. Include `package-lock.json`, local artwork, the `api` directory, and `vercel.json`.

Exclude `node_modules`, `dist`, `data`, `.env`, `.vercel`, browser profiles, and test results. These are already ignored. `.env.example` contains no credentials and belongs in source control.

## Portfolio deployment

Import the repository into Vercel with:

| Setting          | Value           |
| ---------------- | --------------- |
| Framework preset | Vite            |
| Root directory   | Repository root |
| Node.js          | 24.x            |
| Install command  | `npm ci`        |
| Build command    | `npm run build` |
| Output directory | `dist/public`   |

The checked-in `vercel.json` supplies the build/output settings, API rewrites, SPA routing, asset caching, and security headers. The build bundles the Express API into `dist/api.js`. The plain JavaScript entry `api/index.js` exports that bundle as a Node function; it does not start a persistent listener. Project TypeScript imports are resolved before Vercel executes the bundle. The separate `server/start.ts` is for ordinary Node hosting and local production previews.

Leave `DATA_MODE` unset or set it to `demo`. The public portfolio makes no API requests and requires no database or owner credentials. Its ordering experience stays available on static hosting or during a function outage. Demo editing privileges are confined to the visitor’s own browser storage.

## Live café deployment

Provision a **remote Turso/libSQL database**. Local filesystem databases cannot provide durable Vercel storage; the app rejects file-backed databases in live Vercel mode.

Add these server environment variables in the Vercel project:

| Variable               | Value                                                          |
| ---------------------- | -------------------------------------------------------------- |
| `DATA_MODE`            | `live`                                                         |
| `DATABASE_URL`         | The remote `libsql://…` database URL                           |
| `DATABASE_AUTH_TOKEN`  | Database access token                                          |
| `ADMIN_PASSWORD_HASH`  | Output from `npm run password:hash`                            |
| `ADMIN_SESSION_SECRET` | At least 32 random characters; the helper generates this       |
| `APP_ORIGIN`           | Exact HTTPS origin of the deployed app, with no trailing slash |

Use separate databases and secrets for previews and production. Redeploy after changing environment variables. Each preview origin must match its `APP_ORIGIN`; otherwise browser mutations are intentionally rejected. Set the final production domain before relying on the owner workspace.

The schema and starter catalog initialize automatically on the first live request. No customer data from an older installation is imported. Back up an existing database separately before any migration work.

Before accepting actual customer orders, replace the illustrative address, opening hours, contact details, and food claims in `shared/catalog.ts` with verified business information. Default hours are content, not a scheduled opening/closing engine: the owner’s ordering switch controls acceptance. Customer details are stored in the live database, so set business retention and access practices appropriate to your operation.

## Post-deployment verification

Check the home page and all 17 image URLs, reload `/menu`, `/track`, and `/owner` directly, and confirm that `/api/config` returns the intended mode. In a portfolio deployment, try a demo order and confirm it is visible only in that browser. In a live deployment, sign in, place a controlled test order, advance its status, and confirm persistence after a fresh session.

The local build, SQL adapter, and API are tested. Remote credentials, Vercel routing, and the deployed domain must still be verified on the actual hosted deployment.

Official references used when preparing this configuration: [Vite on Vercel](https://vercel.com/docs/frameworks/frontend/vite), [Vercel Node.js versions](https://vercel.com/docs/functions/runtimes/node-js/node-js-versions), and [Turso TypeScript SDK](https://docs.turso.tech/sdk/ts/quickstart).

## Build mode and API verification

DATA_MODE is both a build-time and runtime setting. Rebuild and redeploy after changing it. A live build deliberately refuses to fall back to demo mode. After building, run npm run test:deployment to exercise the exact bundled Vercel entry in plain Node.
