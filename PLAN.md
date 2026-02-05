# gist.mom — Collaborative Gist Editor

## Overview

Real-time collaborative markdown editor backed by GitHub Gists. Edit locally or together, commit when ready. Built on PartyKit (Cloudflare) with Y.js CRDT sync.

**URL:** `gist.mom/{user}/{gist_id}`

## Tech Stack

- **Runtime:** Cloudflare Workers + Durable Objects (Wrangler + PartyServer, not partykit CLI)
- **Collab:** Y.js + y-partyserver
- **Editor:** CodeMirror 6 (`@codemirror/view`, `@codemirror/state`, `@codemirror/lang-markdown`) + `y-codemirror.next`
- **Cursors:** Y.js awareness protocol (cursor-party style, ref: cursor-party.hasparus.partykit.dev)
- **Frontend:** React, TypeScript
- **Auth:** GitHub OAuth (via Cloudflare Worker or PartyServer — whichever is simpler)
- **Tests:** Playwright e2e
- **Fonts:** Monaspace Neon, EB Garamond, Drafting Mono (self-hosted, lazy-loaded)

## Architecture

```
┌─────────────┐     WebSocket      ┌──────────────────┐      REST       ┌────────────┐
│  React SPA  │ ◄────────────────► │  PartyServer DO  │ ◄─────────────► │ GitHub API │
│ (CodeMirror) │                    │  (Y.js doc)      │                 │  (Gists)   │
└─────────────┘                    └──────────────────┘                 └────────────┘
```

### PartyServer Responsibilities
- Hosts Y.js document per gist (room = `{gist_id}`)
- On first connection: fetches gist content from GitHub API, initializes Y.js doc
- On commit: applies Y.js doc state as gist update via GitHub API (using user's OAuth token)
- Broadcasts cursor positions (awareness protocol)
- Handles auth state (who can edit)

### Auth Flow
1. User clicks "Sign in with GitHub"
2. Redirect to GitHub OAuth (scopes: `gist`)
3. Callback exchanges code for token
4. Token stored client-side (httpOnly cookie or encrypted in localStorage)
5. Token sent to PartyServer on connection for authenticated operations

### Data Flow — Editing & Committing
1. Client connects to PartyServer room for gist ID
2. PartyServer loads gist content from GitHub API (or from cached Y.js state if room is warm)
3. Users edit collaboratively via Y.js sync
4. Edits are transient (not saved to GitHub) until explicit commit
5. **Commit** (button or Cmd/Ctrl+S): PartyServer sends PATCH to GitHub Gists API with current doc state, message = "Update via gist.mom"
6. After commit, Y.js doc continues from committed state

## MVP Features

### P0 — Core
- [ ] **View gist** — navigate to `/{user}/{gist_id}`, render first file's content
- [ ] **Edit gist** — CodeMirror 6 editor with markdown syntax highlighting
- [ ] **Real-time collab** — Y.js sync via PartyServer, multiple cursors
- [ ] **Commit** — save current state to GitHub Gist (button + Cmd/Ctrl+S), message: "Update via gist.mom"
- [ ] **GitHub OAuth** — login required to edit, viewing is public
- [ ] **Markdown preview** — toggle between edit and preview modes
- [ ] **Create new gist** — from landing page, creates gist via API then redirects to editor

### P1 — Social & Navigation
- [ ] **Landing page** — if logged in, show user's gists list; if not, show create CTA
- [ ] **Gist commits** — show commit history panel (GET /gists/{id}/commits)
- [ ] **Gist forks** — show forks list (GET /gists/{id}/forks)
- [ ] **Fork gist** — fork button (POST /gists/{id}/forks)
- [ ] **Star/unstar** — star toggle (PUT/DELETE /gists/{id}/star)
- [ ] **GitHub link** — rightmost navbar icon, opens gist on github.com

### P2 — Polish
- [ ] **Font switcher** — Aa button in navbar cycles: Monaspace Neon → EB Garamond → Drafting Mono
- [ ] **AI commit messages** — generate message from diff via LLM
- [ ] **Multi-file gists** — tab bar for files within a gist

## UI Layout

```
┌──────────────────────────────────────────────────────┐
│  gist.mom          [Edit|Preview] [Commit]  [Aa] [⌂] │  ← navbar
├──────────────────────────────────────────────────────┤
│                                                      │
│                 CodeMirror Editor                     │
│                   (or Preview)                       │
│                                                      │
│                                                      │
└──────────────────────────────────────────────────────┘
```

- **Top-left:** "gist.mom" (link to landing)
- **Top-right (L→R):** Edit/Preview toggle, Commit button, Aa font switcher, GitHub external link icon
- **Commit button:** disabled if not logged in or no changes since last commit
- **Design:** Minimal. Think mak.ink meets Dropbox Paper. Lots of whitespace, content-focused.

## Key Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Single file MVP | Yes | Multi-file gists deferred to P2 |
| Commit message | Static "Update via gist.mom" | AI-generated deferred to P2 |
| Editor | CodeMirror 6 | Mobile-friendly, lighter, y-codemirror.next for Y.js. Ref: ~/workspace/graphql-org for CM6 patterns |
| Preview | Toggle (not split) | Cleaner minimal design |
| Collab | Y.js from day one | Core value prop, not optional |
| Deploy | Cloudflare via Wrangler | PartyServer on Durable Objects (not partykit CLI) |
| URL scheme | `/{user}/{gist_id}` | Mirrors GitHub convention |

## MVP Build Order

1. **Project scaffold** — Wrangler project with PartyServer, React SPA, build tooling
2. **PartyServer + Y.js room** — basic doc sync between clients
3. **CodeMirror integration** — editor bound to Y.js doc, markdown mode
4. **GitHub OAuth** — login/logout flow
5. **Gist loading** — fetch gist content on room init, populate Y.js doc
6. **Commit flow** — save Y.js state back to GitHub Gist API
7. **Markdown preview** — toggle mode with rendered markdown
8. **Create gist** — new gist creation from landing page
9. **Landing page** — list user's gists when logged in
10. **Navbar + design** — fonts, GitHub link, Aa switcher, polish
11. **Playwright tests** — e2e for core flows

## Open Questions

- ~~Domain:~~ Resolved — purchased.
- ~~Rate limiting:~~ Resolved — prompt anonymous users to log in when rate limited.
- ~~Conflict resolution:~~ Resolved — LWW for MVP. Collab users share Y.js state so conflicts are unlikely; diff/merge deferred.
- ~~Mobile: Monaco has limited mobile support.~~ Resolved — switched to CodeMirror 6.
