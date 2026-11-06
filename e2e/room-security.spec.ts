import { expect, test } from "@playwright/test";
import * as encoding from "lib0/encoding";
import * as syncProtocol from "y-protocols/sync";
import * as Y from "yjs";

function openSocket(url: string): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const socket = new WebSocket(url);
    socket.onopen = () => resolve(socket);
    socket.onerror = () => reject(new Error(`Failed to connect to ${url}`));
  });
}

test("public controls are forbidden while anonymous collaboration and room reads still work", async ({
  request,
  baseURL,
}) => {
  const gistId = `security-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  const room = `/parties/gist-room/${gistId}`;
  const headers = {
    "x-partykit-room": gistId,
    "x-partykit-namespace": "gist-room",
    "x-internal": "true",
  };
  for (const path of ["/seed", "/nested/seed", "/committed"]) {
    const response = await request.post(`${room}${path}`, {
      headers,
      data: {
        filename: "B.md",
        content: "attack",
        owner: "attacker",
        description: null,
      },
    });
    expect(response.status()).toBe(403);
  }

  const socket = await openSocket(`${baseURL!.replace(/^http/, "ws")}${room}`);
  const doc = new Y.Doc();
  try {
    doc.getText("content").insert(0, "Anonymous text edit");
    const meta = doc.getMap("meta");
    meta.set("filename", "B.md");
    meta.set("baseline", "forged");
    meta.set("seededAt", Date.now() + 99999999);
    const encoder = encoding.createEncoder();
    encoding.writeVarUint(encoder, 0);
    syncProtocol.writeUpdate(encoder, Y.encodeStateAsUpdate(doc));
    socket.send(encoding.toUint8Array(encoder));

    await expect
      .poll(async () => {
        const response = await request.get(`${room}/content`);
        expect(response.ok()).toBe(true);
        return response.json();
      })
      .toEqual({
        content: "Anonymous text edit",
        filename: null,
        lastCommittedContent: null,
      });
    const metadata = await request.get(`${room}/meta`);
    expect(await metadata.json()).toMatchObject({
      seeded: false,
      seededAt: 0,
      filename: null,
    });
    const debug = await request.get(`${room}/_debug/instance`);
    expect((await debug.json()).instanceId).toEqual(expect.any(String));
    const commit = await request.post(`/api/gists/${gistId}/commit`);
    expect(commit.status()).toBe(401);
  } finally {
    socket.close();
    doc.destroy();
  }
});
