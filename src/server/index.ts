import { Hono } from "hono";
import { cors } from "hono/cors";
import { routePartykitRequest } from "partyserver";
import { createAuth } from "./auth";
import { GistRoom } from "./party";
import { createGist, updateGist } from "./github";

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

app.post("/api/gists/:id/commit", async (c) => {
  const token = await getGitHubToken(c.env, c.req.raw.headers);
  if (!token) return c.json({ error: "Not authenticated" }, 401);

  const gistId = c.req.param("id");
  try {
    // Read current content from the DO
    const doId = c.env.GistRoom.idFromName(gistId);
    const stub = c.env.GistRoom.get(doId);
    const contentRes = await stub.fetch(
      new URL(`/parties/gist-room/${gistId}/content`, c.req.url).toString()
    );
    if (!contentRes.ok) return c.json({ error: "Failed to read document" }, 502);
    const { content, filename } = (await contentRes.json()) as {
      content: string;
      filename: string;
    };

    const result = await updateGist(gistId, filename, content, token);
    return c.json(result);
  } catch {
    return c.json({ error: "Commit failed" }, 502);
  }
});

app.post("/api/gists", async (c) => {
  const token = await getGitHubToken(c.env, c.req.raw.headers);
  if (!token) return c.json({ error: "Not authenticated" }, 401);

  try {
    const body = await c.req.json();
    const gist = await createGist(token, {
      filename: body.filename,
      content: body.content,
      description: body.description,
      public: body.public,
    });
    return c.json(gist, 201);
  } catch {
    return c.json({ error: "GitHub API error" }, 502);
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
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);

    // API routes via Hono
    if (url.pathname.startsWith("/api/")) {
      return app.fetch(request, env);
    }

    // party routes (WebSocket + HTTP to DOs)
    const partyResponse = await routePartykitRequest(request, env);
    if (partyResponse) return partyResponse;

    // static assets (Vite-built SPA) with SPA fallback
    const assetResponse = await env.ASSETS.fetch(request);
    if (assetResponse.status === 404) {
      return env.ASSETS.fetch(new URL("/", request.url).toString());
    }
    return assetResponse;
  },
};
