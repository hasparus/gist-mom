import { YServer } from "y-partyserver";
import * as Y from "yjs";

const STORAGE_KEY = "ydoc-state";

export class GistRoom extends YServer<Env> {
  static override options = { hibernate: true };

  readonly instanceId = crypto.randomUUID();

  private getMeta() {
    return this.document.getMap("meta");
  }

  private getBaseline(): string {
    return (this.getMeta().get("baseline") as string) ?? "";
  }

  private setBaseline(content: string) {
    const meta = this.getMeta();
    meta.set("baseline", content);
    meta.set(
      "commitVersion",
      ((meta.get("commitVersion") as number) || 0) + 1,
    );
  }

  override async onLoad() {
    // Restore Y.Doc state from DO storage
    const stored = await this.ctx.storage.get<ArrayBuffer>(STORAGE_KEY);
    if (stored) {
      Y.applyUpdate(this.document, new Uint8Array(stored));
    }
  }

  override async onSave() {
    // Persist Y.Doc state to DO storage
    const state = Y.encodeStateAsUpdate(this.document);
    await this.ctx.storage.put(STORAGE_KEY, state.buffer);
  }

  override onError(_connection: unknown, _error: unknown) {
    // Network disconnects are retryable — client reconnects automatically
  }

  override async onRequest(request: Request): Promise<Response> {
    const pathname = new URL(request.url).pathname;

    // POST /committed — update baseline after successful commit
    if (request.method === "POST" && pathname.endsWith("/committed")) {
      const content = await request.text();
      this.setBaseline(content);
      return new Response("ok");
    }

    if (request.method === "GET" && pathname.endsWith("/_debug/instance")) {
      return Response.json({ instanceId: this.instanceId });
    }

    if (request.method === "GET" && pathname.endsWith("/content")) {
      const meta = this.getMeta();
      return Response.json({
        content: this.document.getText("content").toString(),
        filename: (meta.get("filename") as string) || "file.md",
        lastCommittedContent: this.getBaseline(),
      });
    }

    if (request.method === "GET" && pathname.endsWith("/meta")) {
      const meta = this.getMeta();
      return Response.json({
        seeded: meta.has("baseline"),
        seededAt: (meta.get("seededAt") as number) ?? 0,
        filename: (meta.get("filename") as string) || "file.md",
        description: (meta.get("description") as string | null) ?? null,
        owner: (meta.get("owner") as string | null) ?? null,
      });
    }

    // POST /seed — populate Y.Doc with initial gist content (only if empty)
    if (request.method === "POST" && pathname.endsWith("/seed")) {
      const { filename, content, description, owner } =
        (await request.json()) as {
          filename: string;
          content: string;
          description: string | null;
          owner: string | null;
        };
      const meta = this.getMeta();
      meta.set("filename", filename);
      meta.set("description", description);
      meta.set("owner", owner);
      meta.set("seededAt", Date.now());

      const ytext = this.document.getText("content");
      if (ytext.length === 0) {
        ytext.insert(0, content);
      }
      if (!meta.has("baseline")) {
        meta.set("baseline", content);
      }
      if (!meta.has("commitVersion")) {
        meta.set("commitVersion", 1);
      }
      return new Response("ok");
    }

    return super.onRequest(request);
  }
}
