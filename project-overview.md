# Try the Look. — Runway (Full-Stack)

## Overview

A full-stack web application recreating the **"Try the Look."** Nike streetwear runway experience. A Node.js 24 backend (`node:http` + built-in `node:sqlite`) serves the interactive frontend, manages anonymous `rw_sid` session cookies, validates product/variant selections, persists each visitor's styling bag in SQLite (`data/runway.db`), and exports formatted outfit shortlists (`runway-outfit-shortlist.txt`). The frontend renders the `<runway-section>` custom element with 3D Ring (desktop) and Classic diagonal (mobile) physics, FLIP lightbox pins, and real-time bag synchronization.

## Goals

1. Provide real server-backed styling bag persistence (`SQLite` + HTTP API) with zero external npm dependencies.
2. Preserve 100% visual, typography, token, physics, and accessibility fidelity of the Runway experience across desktop and mobile.
3. Keep the codebase minimal, readable, and fully covered by `node --test` integration tests.

## Core User Flow

1. Browser loads `/` from `server.js`; the frontend fetches `/api/catalog` and `/api/bag` to hydrate the session's styling bag count.
2. User explores the 6 runway looks via 3D Ring drag/fling, ticks, arrows, keyboard, or 5-second autoplay.
3. User opens the "View look" FLIP lightbox to inspect numbered product pins and jump to pieces in the "In this look" panel.
4. User selects sizes (inline on desktop, portaled bottom sheet on mobile) and sends `POST /api/bag/items` for single pieces or full-look bundles (`$492.30`), persisted to SQLite.
5. User opens `#bag-dialog` to review items, remove pieces (`DELETE /api/bag/items/:id`), visit original demo links, or download `/api/bag/export` (`runway-outfit-shortlist.txt`).

## Features

### Backend (`server.js` + `node:sqlite`)

- `GET /api/health`, `GET /api/catalog`, `GET /api/bag`, `POST /api/bag/items`, `DELETE /api/bag/items/:id`, `GET /api/bag/export`.
- `HttpOnly; SameSite=Lax` session cookie (`rw_sid`), strict server-side variant/quantity validation, and SQLite persistence.

### Frontend (`public/index.html`)

- `<runway-section>` Web Component with 3D Ring & Mobile Classic springs, canvas feet alignment, `Drag`/`View` inertia cursor, FLIP lightbox, and full `prefers-reduced-motion` support.

## Scope

### In Scope

- Full-stack Node.js 24 + SQLite server, REST API, session persistence, shortlist export, automated tests, and responsive Runway UI.

### Out of Scope

- Live payment processing, user accounts/passwords, or external cloud hosting/deployment.

## Success Criteria

1. `npm test` passes all API validation, SQLite persistence, and shortlist export tests.
2. `npm start` serves the app on `http://localhost:3000` (configurable via `PORT`), persisting bag items across full page reloads.
3. All 6 looks, 8 products, variant IDs, and interactive UI states match the specification.
