<img width="1199" height="861" alt="image" src="https://github.com/user-attachments/assets/07d4565a-a18f-49a7-8713-079e4254129d" />

# [gist.mom](https://gist.mom)

Collaborative editor for GitHub Gists. Edit together in real time, commit when you're ready.

Open any gist at `gist.mom/{user}/{gist_id}` — or sign in to create a new one.

## Features

- **Real-time collaboration** — multiple cursors, live presence avatars, CRDT sync via [Y.js](https://yjs.dev)
- **CodeMirror 6** editor with markdown highlighting
- **Markdown preview** toggle
- **Commit to GitHub** with Cmd/Ctrl+S or the commit button
- **Gist sidebar** — browse your gists without leaving the editor
- **Revision history** — see past commits for any gist

## Stack

[Cloudflare Workers](https://workers.cloudflare.com) + Durable Objects, [PartyServer](https://github.com/threepointone/partyserver), [Hono](https://hono.dev), React 19, TypeScript, [Playwright](https://playwright.dev) e2e tests.

## Development

```bash
bun install
bun run dev        # start dev server on :1999
bun run typecheck  # type check
bun run test:e2e   # run Playwright tests
```
