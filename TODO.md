# TODO

## P0 — Core

- [x] Project scaffold — Wrangler config, PartyServer, React SPA entry, build tooling
- [x] PartyServer + Y.js room — basic document sync between connected clients
- [x] CodeMirror 6 integration — editor bound to Y.js doc, markdown syntax highlighting
- [x] GitHub OAuth — login/logout flow, token handling
- [x] Gist loading — fetch gist content on room init, populate Y.js doc
- [x] Commit flow — Cmd/Ctrl+S or button saves Y.js state to GitHub Gist API
- [x] Markdown preview — toggle between edit and rendered preview
- [x] Create new gist — from landing page, create via API, redirect to editor

## P1 — Social & Navigation

- [x] Commit and init Shadcn (is this already done? double check)
  ```
  bunx --bun shadcn@latest create --preset "https://ui.shadcn.com/init?base=radix&style=mira&baseColor=neutral&theme=neutral&iconLibrary=remixicon&font=inter&menuAccent=bold&menuColor=default&radius=small&template=vite&rtl=false" --template vite
  ```
- [x] Sidebar: Show authed user's Gist in the left sidebar. Sidebar should be foldable
  - Use Sidebar (Floating) from Shadcn
- [x] CodeMirror Line numbers must be hidden.
- [x] The app should be `max-w-[800px] mx-auto`. Dropbox Paper style centered UI.
- [x] PresenceAvatars: Show all users in the Yjs session.
- [x] Gist commits — show commit history panel (GET /gists/{id}/commits)
- [ ] Gist forks — show forks list (GET /gists/{id}/forks)
- [ ] Fork gist — fork button (POST /gists/{id}/forks)
- [ ] Star/unstar — star toggle (PUT/DELETE /gists/{id}/star)
- [ ] GitHub link — bottom right icon, opens gist-mom GitHub repo
- [x] Cursor Party — same setup as in ~/workspace/mageworld

Crucial: Add end-to-end tests for all of that.
