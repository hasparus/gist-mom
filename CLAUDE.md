# gist.mom

Collaborative editor for GitHub Gists. Real-time multiplayer via Y.js + PartyServer on Cloudflare.

## Tech Stack

- **Runtime:** Cloudflare Workers + Durable Objects (Wrangler + PartyServer)
- **Editor:** CodeMirror 6 + y-codemirror.next (Y.js binding)
- **Collab:** Y.js + y-partyserver
- **Frontend:** React, TypeScript
- **Auth:** GitHub OAuth (scope: `gist`)
- **Tests:** Playwright e2e
- **Package manager:** Bun

## Project Structure

- `src/` — application code
- `e2e/` — Playwright end-to-end tests
- `PLAN.md` — full spec and architecture
- `TODO.md` — current task list

## Commands

- `bun run dev` — start dev server (Wrangler)
- `bun run test:e2e` — run Playwright tests
- `bun run test:e2e:ui` — Playwright UI mode
- `bun run typecheck` — TypeScript check

## Conventions

- Use `bunx` not `npx`.

## Rules

- Read PLAN.md before making architectural decisions.
- Read TODO.md for current tasks. Mark items done when complete.
- Run Playwright tests after changes to verify nothing broke.
- Do NOT deploy or push to remote.
- Keep code simple. Minimal abstractions.
- Commit progress with descriptive messages after completing a task.
