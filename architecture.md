# Architecture Context

## Stack

| Layer | Technology | Role |
| --- | --- | --- |
| Runtime & Server | Node.js 24 (`node:http`, `node:fs`, `node:crypto`) | Serves static frontend and JSON/export REST API with zero external npm dependencies |
| Database | SQLite via built-in `node:sqlite` (`DatabaseSync`) | Persists per-session styling bag items (`data/runway.db`) |
| Frontend | Plain HTML5, CSS3, Vanilla JS (`public/index.html`) | `<runway-section>` custom element, 3D Ring & Mobile Classic physics, FLIP lightbox, styling bag UI |
| Session State | `HttpOnly; SameSite=Lax` cookie (`rw_sid`) | Anonymous browser session identifier scoping SQLite `bag_items` rows |
| Assets | Remote CDN (`https://reel-ref-try-the-look.vercel.app/assets/`) + embedded `Inter 600` woff2 | Transparent WebP model cut-outs, product thumbnails, Nike SVG logo, inline base64 nav font |

## System Boundaries

- `server.js` — Node HTTP server, SQLite initialization/queries, `CATALOG` validation, session cookie handling, `/api/*` route handlers, and static serving of `public/index.html`.
- `public/index.html` — Client UI (`<header>`, `<main>` with `<runway-section>`, `<dialog id="bag-dialog">`, `#bag-status`, deferred/bottom script) wired to `/api/*`.
- `data/runway.db` — Local SQLite database file (gitignored, created automatically on startup).
- `tests/server.test.js` — Node built-in test runner (`node --test`) verifying API validation, SQLite persistence, and shortlist export.
- `https://reel-ref-try-the-look.vercel.app/assets/` — Read-only external image host; assets are never re-hosted locally.
- `https://nike-makknzjs.myshopify.com/` — External Shopify demo store target for product and navigation links.

## Storage Model

- **SQLite (`data/runway.db`)**:
  - Table `bag_items`: `(session_id TEXT NOT NULL, variant_id INTEGER NOT NULL, quantity INTEGER NOT NULL CHECK (quantity BETWEEN 1 AND 20), updated_at TEXT NOT NULL, PRIMARY KEY (session_id, variant_id))`.
  - Max `50` distinct variant rows enforced per `session_id`; quantities clamped `1..20`.
- **Catalog (`CATALOG` in `server.js`)**:
  - Served at `GET /api/catalog` (`{ source, looks, items }`) and used server-side to validate every `variant_id` before writing to SQLite and to compute shortlist exports.

## Auth and Access Model

- Anonymous cookie-based sessions (`rw_sid`, UUID v4, `HttpOnly; SameSite=Lax; Path=/`); no user login or payment checkout is collected.
- All `POST /api/bag/items` payloads are validated server-side against `CATALOG` (`a === true`, safe integer IDs, `quantity` `1..20`, max `50` items per session).
- Outbound product links rendered in `#bag-dialog` enforce `new URL(url).hostname === 'nike-makknzjs.myshopify.com'`.

## Invariants

1. **Zero external npm dependencies & zero frontend frameworks**: Backend uses Node 24 built-ins only (`node:http`, `node:sqlite`, `node:crypto`, `node:fs`); frontend uses plain HTML/CSS/JS and `customElements.define('runway-section', ...)`.
2. **Server-side trust boundary**: Variant availability, quantity limits (`1..20`), row caps (`50`), and shortlist totals are validated on the server before mutating SQLite.
3. **Exact DOM, visual, and physics fidelity**: Exact `<body>` element order, Shopify Horizon & `--rw-*` tokens, 6 looks, non-sequential model mappings (`1, 5, 4, 6, 3, 2`), 8 products, variant IDs, `Nikey | Password: 1` vendor line, `S, L, M, XL` option order, `$547.00` / `$492.30` bundle math, and `K=95` spring physics remain verbatim.
4. **Full lifecycle & accessibility compliance**: All observers, timers, rAF loops, listeners, and `.rw-sheet-host` portals clean up in `disconnectedCallback`; `prefers-reduced-motion: reduce` disables autoplay, springs, FLIP, sweeps, and transitions.
