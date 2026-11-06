import { YServer } from "y-partyserver";
import * as Y from "yjs";

const STORAGE_KEY = "ydoc-state";
const TRUSTED_META_KEY = "trusted-gist-meta";

interface TrustedGistMeta {
  filename: string;
  baseline: string;
  seededAt: number;
  description: string | null;
  owner: string | null;
}

export class GistRoom extends YServer<Env> {
  static override options = { hibernate: true };

  readonly instanceId = crypto.randomUUID();

  private trustedMeta?: TrustedGistMeta;
  private hasStoredDocument = false;

  private getMeta() {
    return this.document.getMap("meta");
  }

  private setBaseline(content: string) {
    const meta = this.getMeta();
    meta.set("baseline", content);
    const commitVersion: unknown = meta.get("commitVersion");
    meta.set(
      "commitVersion",
      typeof commitVersion === "number" &&
        Number.isSafeInteger(commitVersion) &&
        commitVersion >= 0 &&
        commitVersion < Number.MAX_SAFE_INTEGER
        ? commitVersion + 1
        : 1,
    );
  }

  override async onLoad() {
    // Restore Y.Doc state from DO storage
    const [stored, trustedMeta] = await Promise.all([
      this.ctx.storage.get<ArrayBuffer>(STORAGE_KEY),
      this.ctx.storage.get<TrustedGistMeta>(TRUSTED_META_KEY),
    ]);
    this.trustedMeta = trustedMeta;
    this.hasStoredDocument = !!stored;
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
      if (!this.trustedMeta) {
        return new Response("Room is not initialized", { status: 409 });
      }
      const content = await request.text();
      const trustedMeta = { ...this.trustedMeta, baseline: content };
      await this.ctx.storage.put(TRUSTED_META_KEY, trustedMeta);
      this.trustedMeta = trustedMeta;
      this.setBaseline(content);
      return new Response("ok");
    }

    if (request.method === "GET" && pathname.endsWith("/_debug/instance")) {
      return Response.json({ instanceId: this.instanceId });
    }

    if (request.method === "GET" && pathname.endsWith("/content")) {
      return Response.json({
        content: this.document.getText("content").toString(),
        filename: this.trustedMeta?.filename ?? null,
        lastCommittedContent: this.trustedMeta?.baseline ?? null,
      });
    }

    if (request.method === "GET" && pathname.endsWith("/meta")) {
      return Response.json({
        seeded: !!this.trustedMeta,
        seededAt: this.trustedMeta?.seededAt ?? 0,
        filename: this.trustedMeta?.filename ?? null,
        description: this.trustedMeta?.description ?? null,
        owner: this.trustedMeta?.owner ?? null,
      });
    }

    if (request.method === "POST" && pathname.endsWith("/seed")) {
      if (this.trustedMeta) return new Response("ok");
      const { filename, content, description, owner } =
        (await request.json()) as {
          filename: string;
          content: string;
          description: string | null;
          owner: string | null;
        };
      return this.ctx.blockConcurrencyWhile(async () => {
        if (this.trustedMeta) return new Response("ok");
        const trustedMeta = {
          filename,
          baseline: content,
          description,
          owner,
          seededAt: Date.now(),
        };
        const meta = this.getMeta();
        meta.set("filename", filename);
        meta.set("description", description);
        meta.set("owner", owner);
        meta.set("seededAt", trustedMeta.seededAt);

        const ytext = this.document.getText("content");
        if (!this.hasStoredDocument && ytext.length === 0) {
          ytext.insert(0, content);
        }
        this.setBaseline(content);
        await this.ctx.storage.put({
          [TRUSTED_META_KEY]: trustedMeta,
          [STORAGE_KEY]: Y.encodeStateAsUpdate(this.document).buffer,
        });
        this.trustedMeta = trustedMeta;
        return new Response("ok");
      });
    }

    return super.onRequest(request);
  }
}
