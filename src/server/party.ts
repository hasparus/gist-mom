import { YjsDocument } from "y-partyserver";
import * as Y from "yjs";
import { fetchGist } from "./github";

const STORAGE_KEY = "ydoc-state";

export class GistRoom extends YjsDocument<Env> {
  private gistMeta: { filename: string } | null = null;

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

  override async onStart() {
    await super.onStart(); // calls onLoad()

    const gistId = this.name;
    try {
      const gist = await fetchGist(gistId);
      const files = Object.values(gist.files);
      if (files.length > 0) {
        const file = files[0]!;
        this.gistMeta = { filename: file.filename };
        const ytext = this.document.getText("content");
        if (ytext.length === 0) {
          ytext.insert(0, file.content);
        }
      }
    } catch (e) {
      console.error("Failed to load gist:", e);
    }
  }

  override async onRequest(request: Request): Promise<Response> {
    const pathname = new URL(request.url).pathname;

    if (request.method === "GET" && pathname.endsWith("/content")) {
      return Response.json({
        content: this.document.getText("content").toString(),
        filename: this.gistMeta?.filename || "file.md",
      });
    }

    return super.onRequest(request);
  }
}
