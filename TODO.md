# TODO

## P0 — Core

- [ ] Project scaffold — Wrangler config, PartyServer, React SPA entry, build tooling
- [ ] PartyServer + Y.js room — basic document sync between connected clients
- [ ] CodeMirror 6 integration — editor bound to Y.js doc, markdown syntax highlighting
- [ ] GitHub OAuth — login/logout flow, token handling
- [ ] Gist loading — fetch gist content on room init, populate Y.js doc
- [ ] Commit flow — Cmd/Ctrl+S or button saves Y.js state to GitHub Gist API (message: "Update via gist.mom")
- [ ] Markdown preview — toggle between edit and rendered preview
- [ ] Create new gist — from landing page, create via API, redirect to editor

## P1 — Social & Navigation

- [ ] Landing page — list user's gists when logged in, create CTA when not
- [ ] Gist commits — show commit history panel (GET /gists/{id}/commits)
- [ ] Gist forks — show forks list (GET /gists/{id}/forks)
- [ ] Fork gist — fork button (POST /gists/{id}/forks)
- [ ] Star/unstar — star toggle (PUT/DELETE /gists/{id}/star)
- [ ] GitHub link — rightmost navbar icon, opens gist on github.com
