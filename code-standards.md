# Code Standards

## General

- **Minimalism first (Ponytail rules)**: Solve the full-stack requirement with the smallest complete code using Node 24 built-ins (`node:http`, `node:sqlite`, `node:crypto`, `node:fs`) and plain HTML/CSS/JS. Never add external frameworks or npm dependencies for things the platform provides natively.
- **Separation of concerns**: `server.js` owns HTTP routing, session cookies, catalog validation, and SQLite persistence; `public/index.html` owns `<runway-section>` stage physics, DOM UI, and `/api/*` client calls.
- **Exact specification fidelity**: Never alter product names, vendor strings (`Nikey | Password: 1`), option ordering (`S, L, M, XL`), variant IDs, prices, or CSS physics/timing values.

## Full-Stack Website Build & API Routes

- **REST API endpoints**:
  - `GET /api/health` — Returns `200 { ok: true }`.
  - `GET /api/catalog` — Returns validated `CATALOG` JSON (`{ source, looks, items }`).
  - `GET /api/bag` — Returns `{ items: [{ id, quantity }] }` for the `rw_sid` session cookie.
  - `POST /api/bag/items` — Validates JSON body (`items` array, non-empty, safe-integer `id` matching an available variant, integer `quantity` `1..20`, max `50` entries per session) before writing to SQLite; returns `400` on invalid input and `200 { items }` on success.
  - `DELETE /api/bag/items/:id` — Validates numeric `id`, deletes row scoped to `rw_sid`, returns `200 { items }`.
  - `GET /api/bag/export` — Streams `runway-outfit-shortlist.txt` (`text/plain; charset=utf-8`) generated from SQLite rows + `CATALOG`.
- **Body & security boundaries**: Enforce max JSON body size (16 KB) on `POST`, validate UUID `rw_sid` cookies, use parameterized SQLite queries (`?`) exclusively, and never store secrets or tokens in source files or `.git`.

## Frontend JavaScript & Web Components

- **Custom element registration**: Register `RunwaySection` with `customElements.define('runway-section', RunwaySection)`.
- **Resource & listener cleanup**: Cancel rAFs and timers, disconnect observers, remove global listeners, and dock/remove `.rw-sheet-host` in `disconnectedCallback()`.
- **Defensive boundary handling**:
  - Validate `/api/catalog` and `/api/bag` responses before updating UI; show `data-msg-error` if a request fails.
  - Enforce `new URL(item.url).hostname === 'nike-makknzjs.myshopify.com'` before rendering bag links.
  - Guard offscreen `<canvas>` `getImageData` feet detection with `crossOrigin="anonymous"` and `try/catch`.
  - Build dynamic bag rows via `document.createElement` and `textContent`.

## Styling & Accessibility

- **Token-driven styles**: Use `--rw-*` and Horizon tokens consistently across desktop, mobile, and `.rw-sheet-host`.
- **Explicit `[hidden]` & reduced motion**: Enforce `[hidden] { display: none !important; }` and full `@media (prefers-reduced-motion: reduce)` parity.
- **ARIA & focus**: Maintain `tabindex="0"` carousel stage, `aria-live="polite"` status regions, `aria-current`, `aria-pressed`, `aria-expanded`/`aria-controls`, and `:focus-visible` outlines.

## File Organization

- `server.js` — Full-stack Node.js HTTP + SQLite server (`createServer` exported for tests).
- `public/index.html` — Standalone frontend served by `server.js`.
- `tests/server.test.js` — Automated API & SQLite persistence tests (`npm test`).
- `package.json` — Scripts (`start`, `test`) with zero third-party dependencies.
- `AGENTS.md`, `.agents/` — Ponytail rules and workspace skills.
- `architecture.md`, `ui-context.md`, `code-standards.md`, `ai-workflow-rules.md`, `project-overview.md`, `progress-tracker.md` — Project specifications and living documentation.
