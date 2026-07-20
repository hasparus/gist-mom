import { expect, test } from "@playwright/test";
import * as encoding from "lib0/encoding";
import * as syncProtocol from "y-protocols/sync";
import * as Y from "yjs";

function openSocket(url: string): Promise<WebSocket> {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(url);
    ws.binaryType = "arraybuffer";
    ws.onopen = () => resolve(ws);
    ws.onerror = () => reject(new Error(`failed to connect to ${url}`));
  });
}

function encodeTextInsert(text: string): Uint8Array {
  const doc = new Y.Doc();
  doc.getText("content").insert(0, text);
  const encoder = encoding.createEncoder();
  encoding.writeVarUint(encoder, 0);
  syncProtocol.writeUpdate(encoder, Y.encodeStateAsUpdate(doc));
  return encoding.toUint8Array(encoder);
}

test("room survives hibernation eviction with sockets attached", async () => {
  test.skip(
    test.info().project.name !== "chromium",
    "runtime behavior, browser-independent — run once",
  );
  test.setTimeout(90_000);

  const baseURL =
    test.info().project.use.baseURL ?? "http://localhost:1999";
  const room = `evict-${Date.now()}`;
  const base = `${baseURL}/parties/gist-room/${room}`;
  const wsUrl = base.replace(/^http/, "ws");

  const getInstance = async () => {
    const res = await fetch(`${base}/_debug/instance`);
    const body = (await res.json()) as { instanceId: string };
    return body.instanceId;
  };

  const ws1 = await openSocket(wsUrl);
  const ws2 = await openSocket(wsUrl);

  const idBefore = await getInstance();

  await new Promise((r) => setTimeout(r, 30_000));

  const idAfter = await getInstance();
  expect(
    idAfter,
    "DO was not evicted during idle — hibernation inactive",
  ).not.toBe(idBefore);

  await new Promise((r) => setTimeout(r, 500));
  const received: Uint8Array[] = [];
  ws2.onmessage = (e) => received.push(new Uint8Array(e.data as ArrayBuffer));

  ws1.send(encodeTextInsert("survived eviction"));

  await expect
    .poll(
      async () => {
        const res = await fetch(`${base}/content`);
        const body = (await res.json()) as { content: string };
        return body.content;
      },
      { timeout: 10_000 },
    )
    .toContain("survived eviction");

  await expect
    .poll(
      () =>
        received.some((frame) =>
          Buffer.from(frame).includes("survived eviction"),
        ),
      {
        timeout: 10_000,
        message: "update was not broadcast to the second socket after wake",
      },
    )
    .toBe(true);

  ws1.close();
  ws2.close();
});
