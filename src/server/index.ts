import { Hono } from "hono";
import { cors } from "hono/cors";
import { routePartykitRequest } from "partyserver";
import { createAuth } from "./auth";
import { GistRoom } from "./party";
import {
  createGist,
  fetchGist,
  fetchGistCommits,
  GitHubApiError,
  updateGist,
} from "./github";

export { GistRoom };

const app = new Hono<{ Bindings: Env }>();

app.use(
  "/api/**",
  cors({
    origin: (origin) => origin || "",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["POST", "GET", "OPTIONS"],
    credentials: true,
  })
);

app.all("/api/auth/*", async (c) => {
  const auth = createAuth(c.env);
  return auth.handler(c.req.raw);
});

async function getGitHubToken(env: Env, headers: Headers) {
  const auth = createAuth(env);
  const session = await auth.api.getSession({ headers });
  if (!session) return null;
  const row = await env.DATABASE.prepare(
    "SELECT accessToken FROM account WHERE userId = ? AND providerId = 'github' LIMIT 1"
  )
    .bind(session.user.id)
    .first<{ accessToken: string }>();
  return row?.accessToken ?? null;
}

function getGistRoomStub(env: Env, gistId: string) {
  const doId = env.GistRoom.idFromName(gistId);
  const stub = env.GistRoom.get(doId);
  return {
    fetch(path: string, init?: RequestInit) {
      const headers = new Headers(init?.headers);
      headers.set("x-partykit-room", gistId);
      headers.set("x-partykit-namespace", "gist-room");
      return stub.fetch(`https://dummy${path}`, { ...init, headers });
    },
  };
}

function seedRoom(
  env: Env,
  gistId: string,
  file: { filename: string; content: string }
) {
  return getGistRoomStub(env, gistId).fetch("/seed", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ filename: file.filename, content: file.content }),
  });
}

app.get("/api/gists/:id", async (c) => {
  const token = await getGitHubToken(c.env, c.req.raw.headers);
  const gistId = c.req.param("id");

  try {
    const gist = await fetchGist(gistId, token ?? undefined);
    const file = Object.values(gist.files)[0];
    if (file) {
      await seedRoom(c.env, gistId, file);
    }
    return c.json({
      id: gist.id,
      description: gist.description,
      owner: gist.owner,
      files: Object.fromEntries(
        Object.entries(gist.files).map(([k, v]) => [
          k,
          { filename: v.filename },
        ])
      ),
    });
  } catch (e) {
    if (e instanceof GitHubApiError) {
      if (e.status === 404) {
        const contentRes = await getGistRoomStub(c.env, gistId)
          .fetch("/content")
          .catch(() => null);
        if (contentRes?.ok) {
          const { filename, seeded } = (await contentRes.json()) as {
            filename: string;
            seeded: boolean;
          };
          if (seeded) {
            return c.json({
              id: gistId,
              description: null,
              owner: null,
              files: { [filename]: { filename } },
            });
          }
        }
      }
      return c.json({ error: e.message }, e.status as 403 | 404);
    }
    const msg = e instanceof Error ? e.message : String(e);
    console.error("GET /api/gists/:id error:", msg);
    return c.json({ error: msg }, 502);
  }
});

app.get("/api/gists/:id/commits", async (c) => {
  const token = await getGitHubToken(c.env, c.req.raw.headers);
  const gistId = c.req.param("id");
  try {
    const commits = await fetchGistCommits(gistId, token ?? undefined);
    return c.json(commits);
  } catch (e) {
    if (e instanceof GitHubApiError) {
      return c.json({ error: e.message }, e.status as 403 | 404);
    }
    return c.json({ error: "GitHub API error" }, 502);
  }
});

app.post("/api/gists/:id/commit", async (c) => {
  const token = await getGitHubToken(c.env, c.req.raw.headers);
  if (!token) return c.json({ error: "Not authenticated" }, 401);

  const gistId = c.req.param("id");
  try {
    const room = getGistRoomStub(c.env, gistId);
    const contentRes = await room.fetch("/content");
    if (!contentRes.ok) return c.json({ error: "Failed to read document" }, 502);
    const { content, filename, lastCommittedContent } =
      (await contentRes.json()) as {
        content: string;
        filename: string;
        lastCommittedContent: string;
      };

    if (content === lastCommittedContent) {
      return c.json({ error: "No changes to commit" }, 409);
    }

    const result = await updateGist(gistId, filename, content, token);

    await room.fetch("/committed", { method: "POST", body: content });

    return c.json(result);
  } catch (e) {
    if (e instanceof GitHubApiError && e.status === 404) {
      return c.json(
        { error: "You don't have permission to edit this gist" },
        403,
      );
    }
    return c.json({ error: "Commit failed" }, 502);
  }
});

app.post("/api/gists", async (c) => {
  const token = await getGitHubToken(c.env, c.req.raw.headers);
  if (!token) return c.json({ error: "Not authenticated" }, 401);

  const body: unknown = await c.req.json().catch(() => null);
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return c.json({ error: "Invalid request body" }, 400);
  }
  const { filename, content, description, public: isPublic } =
    body as Record<string, unknown>;
  const badString = (v: unknown) => v !== undefined && typeof v !== "string";
  if (
    badString(filename) ||
    badString(content) ||
    badString(description) ||
    (isPublic !== undefined && typeof isPublic !== "boolean")
  ) {
    return c.json({ error: "Invalid request body" }, 400);
  }

  try {
    const gist = await createGist(token, {
      filename: filename as string | undefined,
      content: content as string | undefined,
      description: description as string | undefined,
      public: isPublic === true,
    });
    const file = Object.values(gist.files)[0];
    if (file) {
      await seedRoom(c.env, gist.id, file).catch((e) => {
        console.error("POST /api/gists seed error:", e);
      });
    }
    return c.json(
      {
        id: gist.id,
        description: gist.description,
        owner: gist.owner,
        files: Object.fromEntries(
          Object.entries(gist.files).map(([k, v]) => [
            k,
            { filename: v.filename },
          ])
        ),
      },
      201
    );
  } catch {
    return c.json({ error: "GitHub API error" }, 502);
  }
});

app.get("/api/stars", async (c) => {
  const cacheUrl = new URL(c.req.url);
  const cache = (caches as unknown as { default: Cache }).default;
  const cached = await cache.match(cacheUrl);
  if (cached) return cached;

  try {
    const fetchHeaders: Record<string, string> = {
      Accept: "application/vnd.github+json",
      "User-Agent": "gist.mom",
    };
    if (c.env.GITHUB_STARS_TOKEN) {
      fetchHeaders.Authorization = `Bearer ${c.env.GITHUB_STARS_TOKEN}`;
    }
    const res = await fetch(
      "https://api.github.com/repos/hasparus/gist-mom",
      { headers: fetchHeaders }
    );
    if (!res.ok) return c.json({ stars: null }, 502);
    const data = (await res.json()) as { stargazers_count?: number };
    const stars = data.stargazers_count ?? 0;
    const body = JSON.stringify({ stars });
    const headers = {
      "Content-Type": "application/json",
      "Cache-Control": "public, max-age=3600",
    };
    c.executionCtx.waitUntil(
      cache.put(cacheUrl, new Response(body, { headers }))
    );
    return new Response(body, { headers });
  } catch (e) {
    console.error("GET /api/stars error:", e);
    return c.json({ stars: null }, 502);
  }
});

app.get("/api/gists", async (c) => {
  const token = await getGitHubToken(c.env, c.req.raw.headers);
  if (!token) return c.json({ error: "Not authenticated" }, 401);

  try {
    const res = await fetch("https://api.github.com/gists", {
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/vnd.github+json",
        "User-Agent": "gist.mom",
      },
    });
    return new Response(res.body, {
      status: res.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch {
    return c.json({ error: "GitHub API error" }, 502);
  }
});

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext) {
    const url = new URL(request.url);

    // API routes via Hono
    if (url.pathname.startsWith("/api/")) {
      return app.fetch(request, env, ctx);
    }

    // party routes (WebSocket + HTTP to DOs)
    const partyResponse = await routePartykitRequest(request, env);
    if (partyResponse) return partyResponse;

    // static assets (Vite-built SPA) — SPA fallback handled by wrangler.toml
    return env.ASSETS.fetch(request);
  },
};
