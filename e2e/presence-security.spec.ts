import { expect, test as base } from "@playwright/test";
import type { Page } from "@playwright/test";
import * as decoding from "lib0/decoding";
import { ephemeralGistId, mockGistRoutes } from "./fixtures";

type PresenceFixture = {
  page: Page;
  send: (state: Record<string, unknown>) => Promise<void>;
};

const test = base.extend<{ presence: PresenceFixture }>({
  presence: async ({ page, browser }, use) => {
    const gistId = ephemeralGistId();
    const received = new Map<number, unknown>();
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    page.on("websocket", (socket) => {
      socket.on("framereceived", ({ payload }) => {
        if (typeof payload === "string") return;
        const frame = decoding.createDecoder(new Uint8Array(payload));
        if (decoding.readVarUint(frame) !== 1) return;
        const update = decoding.createDecoder(decoding.readVarUint8Array(frame));
        const count = decoding.readVarUint(update);
        for (let i = 0; i < count; i++) {
          const id = decoding.readVarUint(update);
          decoding.readVarUint(update);
          received.set(id, JSON.parse(decoding.readVarString(update)));
        }
      });
    });
    await mockGistRoutes(page, gistId);
    await page.goto(`/hasparus/${gistId}`);
    await expect(page.getByRole("textbox")).toBeEditable({ timeout: 15_000 });

    const context = await browser.newContext();
    try {
      const sender = await context.newPage();
      await sender.goto("/");
      const peers = await sender.evaluateHandle(async (room) => {
        const providerUrl = "/node_modules/.vite/deps/y-partyserver_provider.js";
        const yjsUrl = "/node_modules/.vite/deps/yjs.js";
        const { default: Provider } = await import(providerUrl);
        const { Doc } = await import(yjsUrl);
        const doc = new Doc();
        const healthyDoc = new Doc();
        const provider = new Provider(location.host, room, doc, { party: "gist-room" });
        const healthy = new Provider(location.host, room, healthyDoc, { party: "gist-room" });
        await Promise.all([provider, healthy].map((peer) => new Promise<void>((resolve) => {
          if (peer.synced) resolve();
          else peer.on("sync", (synced: boolean) => { if (synced) resolve(); });
        })));
        healthy.awareness.setLocalState({
          user: { name: "Healthy peer", color: "#6eeb83" },
          pointer: { x: 0.7, y: 0.5, pointer: "mouse" },
        });
        return { provider, healthy, doc, healthyDoc };
      }, gistId);
      const clientId = await peers.evaluate(({ provider }) => provider.awareness.clientID as number);
      await expect(page.getByLabel("Healthy peer", { exact: true })).toBeVisible();
      await expect(page.getByText("Healthy peer", { exact: true })).toBeVisible();
      await use({
        page,
        send: async (state) => {
          await peers.evaluate(({ provider }, value) => provider.awareness.setLocalState(value), state);
          await expect.poll(() => received.get(clientId)).toEqual(state);
        },
      });
      await peers.evaluate(({ provider, healthy, doc, healthyDoc }) => {
        provider.destroy();
        healthy.destroy();
        doc.destroy();
        healthyDoc.destroy();
      });
      expect(errors).toEqual([]);
    } finally {
      await context.close();
    }
  },
});

async function expectResponsive(page: Page) {
  await expect(page.getByLabel("Healthy peer", { exact: true })).toBeVisible();
  await expect(page.getByText("Healthy peer", { exact: true })).toBeVisible();
  const editor = page.getByRole("textbox");
  await editor.fill("still editable after malformed presence");
  await expect(editor).toHaveText("still editable after malformed presence");
  await page.getByRole("button", { name: "Preview", exact: true }).click();
  await expect(page.getByRole("paragraph").filter({ hasText: "still editable after malformed presence" })).toBeVisible();
}

test("malformed avatar-only metadata cannot crash the editor", async ({ presence: { page, send } }) => {
  await send({ user: { name: { unexpected: "object" }, color: 123, image: {} } });
  await expect(page.getByLabel("Anonymous", { exact: true })).toBeVisible();
  await expectResponsive(page);
});

test("malformed cursor metadata and chat are normalized while valid chat still works", async ({ presence: { page, send } }) => {
  const pointer = { x: 0.25, y: 0.4, pointer: "mouse" };
  await send({ user: { name: "Bad color peer", color: 123 }, pointer });
  await expect(page.getByText("Bad color peer", { exact: true })).toBeVisible();
  await send({ user: { name: { bad: true }, color: "#30bced" }, pointer });
  await expect(page.getByText("Anonymous", { exact: true })).toBeVisible();

  const user = { name: "Chat peer", color: "#30bced" };
  for (const message of [{ bad: true }, ["not", "text"], 123, true]) {
    await send({ user, pointer, message });
    await expect(page.getByText("Chat peer", { exact: true })).toBeVisible();
  }
  await send({ user, pointer, message: "m".repeat(100) });
  await expect(page.getByText("m".repeat(42), { exact: true })).toBeVisible();
  await send({ user, pointer: { ...pointer, pointer: "touch" }, message: "hello from a valid peer" });
  await expect(page.getByText("hello from a valid peer", { exact: true })).toBeVisible();
  await expectResponsive(page);
});

test("malformed pointers are dropped without losing avatars or healthy peers", async ({ presence: { page, send } }) => {
  const user = { name: "Pointer peer", color: "#ffbc42" };
  const pointer = { x: 0.3, y: 0.4, pointer: "mouse" };
  for (const malformed of [
    { ...pointer, x: "0.3" },
    { ...pointer, y: 2 },
    { ...pointer, x: -1 },
    { ...pointer, pointer: "pen" },
    { ...pointer, pointer: {} },
    true,
    [],
  ]) {
    await send({ user, pointer });
    await expect(page.getByText("Pointer peer", { exact: true })).toBeVisible();
    await send({ user, pointer: malformed });
    await expect(page.getByLabel("Pointer peer", { exact: true })).toBeVisible();
    await expect(page.getByText("Pointer peer", { exact: true })).toHaveCount(0);
  }
  await expectResponsive(page);
});
