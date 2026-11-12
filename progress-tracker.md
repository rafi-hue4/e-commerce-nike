# Progress Tracker

Update this file after every meaningful implementation change.

## Current Phase

- Complete (Full-stack Node.js 24 + SQLite application, Ponytail setup, test suite, and Git staging complete).

## Current Goal

- Maintain fidelity across the `<runway-section>` frontend and Node.js 24 + SQLite API; optionally configure a remote Git repository when the user provides a clean, rotated token via Git Credential Manager or environment config.

## Completed

- Installed Ponytail (`AGENTS.md`, `.agents/rules/ponytail.md`, `.agents/skills/ponytail*`).
- Updated `architecture.md`, `ui-context.md`, `code-standards.md`, `ai-workflow-rules.md`, `project-overview.md`, and `progress-tracker.md` for the full-stack Node.js 24 + SQLite application.
- Created `.gitignore`, `package.json`, `server.js`, `public/index.html`, and `tests/server.test.js`.
- Verified JS syntax (`node --check` on `server.js` and `public/index.html`), ran `npm test` (8/8 passing), and verified live `node server.js` health + headless Edge `--dump-dom` hydration.
- Initialized Git (`git init`) and staged workspace files (`git add .`) with `data/*.db*` and `.env*` excluded.

## In Progress

- None.

## Next Up

- Run `npm start` (`node server.js`) to interact with the full-stack app at `http://localhost:3000`, and rotate the GitHub PAT shared in chat before adding any remote.

## Open Questions

- None.

## Architecture Decisions

- **Node.js 24 native stack (`node:http` + `node:sqlite`)**: Chosen per Ponytail minimalism and user approval — provides real SQLite persistence, REST endpoints, and session cookies with zero third-party npm packages.
- **Session cookie (`rw_sid`)**: Anonymous `HttpOnly; SameSite=Lax` UUID cookie scopes `bag_items` rows in `data/runway.db` without requiring user registration.

## Session Notes

- Never commit `.env*` or `data/*.db*`; remind user to revoke the GitHub PAT pasted in chat.
