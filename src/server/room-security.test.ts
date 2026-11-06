/// <reference types="bun" />
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  mock,
  spyOn,
  test,
} from "bun:test";
import * as Y from "yjs";

mock.module("cloudflare:workers", () => ({
  env: {},
  DurableObject: class {
    constructor(
      public ctx: DurableObjectState,
      public env: Env,
    ) {}
  },
}));
mock.module("./auth", () => ({
  createAuth: () => ({
    api: {
      getSession: async ({ headers }: { headers: Headers }) => {
        const user = headers.get("x-test-user");
        return user ? { user: { id: user } } : null;
      },
    },
  }),
}));

const { GistRoom, default: worker } = await import("./index");

const gistId = "two-file-gist";
const originalContent = "GitHub file A";
const gist = {
  id: gistId,
  description: "Verified gist",
  owner: { login: "owner" },
  files: {
    "A.md": { filename: "A.md", content: originalContent },
    "B.md": { filename: "B.md", content: "Do not overwrite B" },
  },
};

type Patch = {
  authorization: string | null;
  files: Record<string, { content: string }>;
};
let patches: Patch[];
let getStatus: number;
let githubGist: typeof gist;

beforeEach(() => {
  patches = [];
  getStatus = 200;
  githubGist = structuredClone(gist);
  spyOn(globalThis, "fetch").mockImplementation((async (input, init) => {
    const request = new Request(input, init);
    if (request.method === "POST") {
      expect(request.url).toBe("https://api.github.com/gists");
      expect(request.headers.get("Authorization")).toBe("Bearer owner-token");
      return Response.json(githubGist);
    }
    expect(request.url).toBe(`https://api.github.com/gists/${gistId}`);
    if (request.method === "PATCH") {
      const { files } = (await request.json()) as { files: Patch["files"] };
      const authorization = request.headers.get("Authorization");
      patches.push({ authorization, files });
      return authorization === "Bearer owner-token"
        ? Response.json({ saved: true })
        : new Response(null, { status: 404 });
    }
    expect(request.method).toBe("GET");
    return getStatus === 200
      ? Response.json(githubGist)
      : new Response(null, { status: getStatus });
  }) as typeof fetch);
});

afterEach(() => mock.restore());

class MemoryStorage {
  values = new Map<string, unknown>();

  async get<T>(key: string): Promise<T | undefined> {
    return structuredClone(this.values.get(key)) as T | undefined;
  }

  async put(key: string | Record<string, unknown>, value?: unknown) {
    for (const [name, entry] of typeof key === "string"
      ? [[key, value]]
      : Object.entries(key)) {
      this.values.set(name as string, structuredClone(entry));
    }
  }
}

function createHarness(legacyDoc?: Y.Doc) {
  const storage = new MemoryStorage();
  if (legacyDoc) {
    storage.values.set("ydoc-state", Y.encodeStateAsUpdate(legacyDoc).buffer);
  }
  const ctx = {
    id: { name: gistId },
    storage,
    getWebSockets: () => [],
    blockConcurrencyWhile: async (callback: () => Promise<unknown>) =>
      callback(),
  } as unknown as DurableObjectState;
  let room: InstanceType<typeof GistRoom>;
  const env = {
    GistRoom: {
      idFromName: (name: string) => {
        expect(name).toBe(gistId);
        return name;
      },
      get: () => ({
        fetch: (input: RequestInfo | URL, init?: RequestInit) =>
          room.fetch(new Request(input, init)),
      }),
    },
    DATABASE: {
      prepare: () => ({
        bind: (user: string) => ({
          first: async () => ({ accessToken: `${user}-token` }),
        }),
      }),
    },
    ASSETS: { fetch: () => new Response("static") },
  } as unknown as Env;
  room = new GistRoom(ctx, env);

  const request = (path: string, init?: RequestInit, user?: string) => {
    const headers = new Headers(init?.headers);
    if (user) headers.set("x-test-user", user);
    return worker.fetch(
      new Request(`https://gist.mom${path}`, { ...init, headers }),
      env,
      {} as ExecutionContext,
    );
  };
  const roomRequest = (path: string, init?: RequestInit) =>
    request(`/parties/gist-room/${gistId}${path}`, init);

  return {
    get room() {
      return room;
    },
    request,
    roomRequest,
    readGist: (user = "owner") =>
      request(`/api/gists/${gistId}`, undefined, user),
    commit: (user?: string) =>
      request(`/api/gists/${gistId}/commit`, { method: "POST" }, user),
    content: async () =>
      (await roomRequest("/content")).json() as Promise<{
        content: string;
        filename: string | null;
        lastCommittedContent: string | null;
      }>,
    meta: async () =>
      (await roomRequest("/meta")).json() as Promise<{
        seeded: boolean;
        seededAt: number;
        filename: string | null;
        owner: string | null;
      }>,
    reload: () => {
      room = new GistRoom(ctx, env);
    },
  };
}

function peerUpdate(
  room: InstanceType<typeof GistRoom>,
  edit: (doc: Y.Doc) => void,
) {
  const peer = new Y.Doc();
  Y.applyUpdate(peer, Y.encodeStateAsUpdate(room.document));
  const before = Y.encodeStateVector(peer);
  edit(peer);
  Y.applyUpdate(room.document, Y.encodeStateAsUpdate(peer, before));
  peer.destroy();
}

function replaceText(doc: Y.Doc, content: string) {
  const text = doc.getText("content");
  text.delete(0, text.length);
  text.insert(0, content);
}

describe("trusted gist save destination", () => {
  for (const timing of ["before seed", "legacy storage", "after seed"]) {
    test(`non-coercible commitVersion ${timing} cannot prevent trusted initialization or saving`, async () => {
      const poison = { toString: null, valueOf: null };
      const content = "Collaborative edit survives poisoned counter";
      const legacy = timing === "legacy storage" ? new Y.Doc() : undefined;
      if (legacy) {
        replaceText(legacy, content);
        legacy.getMap("meta").set("commitVersion", poison);
        legacy.getMap("meta").set("filename", "B.md");
      }
      const h = createHarness(legacy);
      legacy?.destroy();
      expect((await h.meta()).seeded).toBe(false);
      if (timing === "before seed") {
        peerUpdate(h.room, (doc) => {
          replaceText(doc, content);
          doc.getMap("meta").set("commitVersion", poison);
          doc.getMap("meta").set("filename", "B.md");
        });
      }
      expect((await h.readGist()).status).toBe(200);
      expect(await h.meta()).toMatchObject({ seeded: true, filename: "A.md" });
      expect((await h.content()).lastCommittedContent).toBe(originalContent);
      if (timing === "after seed") {
        peerUpdate(h.room, (doc) => {
          replaceText(doc, content);
          doc.getMap("meta").set("commitVersion", poison);
          doc.getMap("meta").set("filename", "B.md");
        });
      } else {
        expect(h.room.document.getMap("meta").get("commitVersion")).toBe(1);
      }
      await h.room.onSave();
      h.reload();
      expect((await h.commit("owner")).status).toBe(200);
      expect(patches).toEqual([
        {
          authorization: "Bearer owner-token",
          files: { "A.md": { content } },
        },
      ]);
      expect(h.room.document.getMap("meta").get("commitVersion")).toBe(
        timing === "after seed" ? 1 : 2,
      );
      expect(h.room.document.getMap("meta").get("baseline")).toBe(content);
      h.reload();
      expect(await h.content()).toEqual({
        content,
        filename: "A.md",
        lastCommittedContent: content,
      });
      expect((await h.commit("owner")).status).toBe(409);
      expect(patches).toHaveLength(1);
    });
  }

  test.each([
    [0, 1],
    [1, 2],
    [Number.MAX_SAFE_INTEGER - 1, Number.MAX_SAFE_INTEGER],
    [Number.MAX_SAFE_INTEGER, 1],
    [Number.MAX_SAFE_INTEGER + 1, 1],
    [-1, 1],
    [1.5, 1],
    [NaN, 1],
    [Infinity, 1],
    [-Infinity, 1],
    ["2", 1],
    [null, 1],
    [true, 1],
    [{}, 1],
  ])("commitVersion %p advances safely to %p", async (version, expected) => {
    const h = createHarness();
    await h.readGist();
    peerUpdate(h.room, (doc) => {
      replaceText(doc, "Updated content");
      doc.getMap("meta").set("commitVersion", version);
    });
    expect((await h.commit("owner")).status).toBe(200);
    expect(h.room.document.getMap("meta").get("commitVersion")).toBe(expected);
  });

  test("CRDT metadata cannot redirect the actual GitHub PATCH from A to B", async () => {
    const h = createHarness();
    expect((await h.readGist()).status).toBe(200);
    peerUpdate(h.room, (doc) => {
      replaceText(doc, "Collaborative edit");
      const meta = doc.getMap("meta");
      meta.set("filename", "B.md");
      meta.set("baseline", "Forged baseline");
      meta.set("owner", "attacker");
      meta.set("seededAt", Date.now() + 99999999);
    });
    await h.room.onSave();
    h.reload();
    expect((await h.commit("owner")).status).toBe(200);
    expect(patches).toEqual([
      {
        authorization: "Bearer owner-token",
        files: { "A.md": { content: "Collaborative edit" } },
      },
    ]);
    expect((await h.content()).lastCommittedContent).toBe("Collaborative edit");
    expect((await h.meta()).owner).toBe("owner");
    peerUpdate(h.room, (doc) =>
      doc.getMap("meta").set("baseline", "Forged again"),
    );
    expect((await h.commit("owner")).status).toBe(409);
    expect(patches).toHaveLength(1);
  });

  test("public reseed and committed requests cannot change the PATCH destination or baseline", async () => {
    const h = createHarness();
    expect((await h.readGist()).status).toBe(200);
    peerUpdate(h.room, (doc) => replaceText(doc, "Owner saves this edit"));
    const headers = {
      "x-partykit-room": gistId,
      "x-partykit-namespace": "gist-room",
      "x-internal": "true",
    };
    for (const path of ["/seed", "/nested/seed", "/committed"]) {
      expect(
        (
          await h.roomRequest(path, {
            method: "POST",
            headers,
            body: path.endsWith("seed")
              ? JSON.stringify({
                  filename: "B.md",
                  content: "attack",
                  description: null,
                  owner: "attacker",
                })
              : "Owner saves this edit",
          })
        ).status,
      ).toBe(403);
    }
    expect(
      (
        await h.roomRequest("/seed", {
          method: "POST",
          headers: { ...headers, Upgrade: "websocket" },
          body: JSON.stringify({ filename: "B.md", content: "attack" }),
        })
      ).status,
    ).toBe(403);
    expect((await h.commit("owner")).status).toBe(200);
    expect(patches[0]?.files).toEqual({
      "A.md": { content: "Owner saves this edit" },
    });
  });

  test("anonymous commits are 401 and non-owner PATCH denial does not advance the baseline", async () => {
    const h = createHarness();
    await h.readGist();
    peerUpdate(h.room, (doc) =>
      replaceText(doc, "Anonymous collaborative edit"),
    );
    expect((await h.commit()).status).toBe(401);
    expect(patches).toHaveLength(0);
    expect((await h.commit("other")).status).toBe(403);
    expect(patches).toEqual([
      {
        authorization: "Bearer other-token",
        files: { "A.md": { content: "Anonymous collaborative edit" } },
      },
    ]);
    expect((await h.content()).lastCommittedContent).toBe(originalContent);
  });

  test("repeated verified seeds preserve cleared text, pinned filename, baseline and timestamp across reload", async () => {
    const h = createHarness();
    const now = spyOn(Date, "now").mockReturnValue(1000000);
    await h.readGist();
    const initialMeta = await h.meta();
    peerUpdate(h.room, (doc) => replaceText(doc, ""));
    await h.room.onSave();
    h.reload();
    now.mockReturnValue(1060000);
    githubGist.files = {
      "B.md": gist.files["B.md"],
      "A.md": { filename: "A.md", content: "Upstream changed" },
    };
    expect((await h.readGist()).status).toBe(200);
    expect(await h.meta()).toEqual(initialMeta);
    expect(await h.content()).toEqual({
      content: "",
      filename: "A.md",
      lastCommittedContent: originalContent,
    });
    expect((await h.commit("owner")).status).toBe(200);
    expect(patches[0]?.files).toEqual({ "A.md": { content: "" } });
    h.reload();
    expect((await h.content()).lastCommittedContent).toBe("");
    expect((await h.commit("owner")).status).toBe(409);
  });

  for (const content of ["Existing edits", ""]) {
    test(`legacy document ${JSON.stringify(content)} fails closed until verified migration`, async () => {
      const legacy = new Y.Doc();
      replaceText(legacy, content);
      const meta = legacy.getMap("meta");
      meta.set("filename", "B.md");
      meta.set("baseline", "forged baseline");
      meta.set("seededAt", Date.now());
      const h = createHarness(legacy);
      expect((await h.commit("owner")).status).toBe(502);
      expect(patches).toHaveLength(0);
      expect((await h.meta()).seeded).toBe(false);
      getStatus = 404;
      expect((await h.readGist()).status).toBe(404);
      getStatus = 200;
      expect((await h.readGist()).status).toBe(200);
      expect(await h.content()).toEqual({
        content,
        filename: "A.md",
        lastCommittedContent: originalContent,
      });
      expect((await h.commit("owner")).status).toBe(200);
      expect(patches[0]?.files).toEqual({ "A.md": { content } });
      legacy.destroy();
    });
  }

  test("new-gist read-lag fallback expires from the trusted first-seed clock despite reseeds and CRDT forgery", async () => {
    const h = createHarness();
    const seededAt = 1000000;
    const now = spyOn(Date, "now").mockReturnValue(seededAt);
    expect(
      (
        await h.request(
          "/api/gists",
          {
            method: "POST",
            body: JSON.stringify({ public: false }),
          },
          "owner",
        )
      ).status,
    ).toBe(201);
    now.mockReturnValue(seededAt + 299999);
    await h.readGist();
    peerUpdate(h.room, (doc) => {
      const meta = doc.getMap("meta");
      meta.set("seededAt", seededAt + 99999999);
      meta.set("owner", "attacker");
      meta.set("filename", "B.md");
      meta.delete("baseline");
    });
    await h.room.onSave();
    h.reload();
    getStatus = 404;
    const fallback = await h.readGist();
    expect(fallback.status).toBe(200);
    expect(await fallback.json()).toMatchObject({
      owner: { login: "owner" },
      files: { "A.md": { filename: "A.md" } },
    });
    expect((await h.request(`/api/gists/${gistId}`)).status).toBe(404);
    now.mockReturnValue(seededAt + 300001);
    expect((await h.readGist()).status).toBe(404);
    expect(patches).toHaveLength(0);
  });
});
