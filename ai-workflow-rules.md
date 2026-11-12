# AI Workflow Rules

## Approach

Build and maintain this full-stack website against `architecture.md`, `ui-context.md`, `code-standards.md`, `project-overview.md`, and `AGENTS.md` (Ponytail lazy senior dev rules). Prefer the smallest complete solution using Node 24 built-ins (`node:http`, `node:sqlite`) and plain HTML/CSS/JS.

## Scoping Rules

- Work in focused, verifiable increments (backend API + SQLite store, frontend integration, automated tests, browser verification).
- Never introduce frameworks, bundlers, or external packages when native Node or Web APIs already solve the problem cleanly.
- Keep exact DOM structure, CSS tokens, look/product/variant data, and physics constants intact.

## Security & Credentials

- Never store API keys, GitHub PATs, `.env` files, or `data/*.db` files in version control (`.gitignore` must exclude `.env*` and `data/*.db*`).
- Validate all client inputs on `server.js` boundaries before touching SQLite.

## Protected Assets & Contracts

Do not alter or re-host:

- External asset URLs under `https://reel-ref-try-the-look.vercel.app/assets/`
- External Shopify product/page URLs under `https://nike-makknzjs.myshopify.com/`
- Exact `data-*` attributes, variant IDs, and look/product names

## Keeping Docs in Sync

Update the relevant `.md` file whenever API routes, SQLite schema, CSS tokens, or project scope change.

## Before Marking Any Unit Complete

1. `npm test` (`node --test tests/*.test.js`) passes with all API & SQLite persistence assertions green.
2. `node server.js` starts cleanly and serves `public/index.html` with zero uncaught errors.
3. End-to-end UI flows (carousel, lightbox, size picker, bag add/remove/export, session reload persistence) work against the live server.
4. `progress-tracker.md` reflects the completed work.
