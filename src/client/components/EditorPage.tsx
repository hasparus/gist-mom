import { useState, useEffect, useRef } from "react";
import YPartyKitProvider from "y-partyserver/provider";
import * as Y from "yjs";
import { Editor } from "./Editor";
import { Preview } from "./Preview";
import { signIn } from "../lib/auth-client";
import type { Session } from "../lib/types";

function randomColor() {
  const colors = [
    "#30bced",
    "#6eeb83",
    "#ffbc42",
    "#ecd444",
    "#ee6352",
    "#9ac2c9",
    "#8acb88",
    "#1be7ff",
  ];
  return colors[Math.floor(Math.random() * colors.length)]!;
}

export function EditorPage({
  gistId,
  session,
  showPreview,
  onCommit,
  onDirtyChange,
}: {
  gistId: string;
  session: Session;
  showPreview: boolean;
  onCommit: () => void;
  onDirtyChange: (dirty: boolean) => void;
}) {
  const [collab, setCollab] = useState<{
    provider: YPartyKitProvider;
    ydoc: Y.Doc;
  } | null>(null);
  const [content, setContent] = useState("");
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [seeded, setSeeded] = useState(false);
  const baselineRef = useRef<string | null>(null);

  // Fetch gist via API (seeds DO + validates access)
  useEffect(() => {
    const ac = new AbortController();
    setFetchError(null);
    setSeeded(false);
    fetch(`/api/gists/${gistId}`, {
      credentials: "include",
      signal: ac.signal,
    }).then(
      async (res) => {
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setFetchError(
            (body as { error?: string }).error ||
              `Failed to load gist (${res.status})`
          );
        } else {
          setSeeded(true);
        }
      },
      (err) => {
        if (!ac.signal.aborted) setFetchError(String(err));
      }
    );
    return () => ac.abort();
  }, [gistId]);

  // Connect WebSocket only after the DO has been seeded
  useEffect(() => {
    if (!seeded) return;

    const doc = new Y.Doc();
    const p = new YPartyKitProvider(window.location.host, gistId, doc, {
      connect: true,
      party: "gist-room",
    });

    const color = randomColor();
    p.awareness.setLocalStateField("user", {
      name: session?.user?.name || "Anonymous",
      color,
      colorLight: color + "33",
    });

    setCollab({ provider: p, ydoc: doc });
    return () => {
      p.destroy();
      doc.destroy();
      setCollab(null);
      baselineRef.current = null;
      onDirtyChange(false);
    };
  }, [gistId, seeded]);

  // When commitVersion changes (local or remote commit), reset baseline
  useEffect(() => {
    if (!collab) return;
    const meta = collab.ydoc.getMap("meta");
    const observer = () => {
      if (typeof meta.get("commitVersion") === "number") {
        baselineRef.current = collab.ydoc.getText("content").toString();
        onDirtyChange(false);
      }
    };
    meta.observe(observer);
    // Check initial value (may already be set from sync)
    observer();
    return () => meta.unobserve(observer);
  }, [collab, onDirtyChange]);

  // Track content for preview + dirty state
  useEffect(() => {
    if (!collab) return;
    const ytext = collab.ydoc.getText("content");
    const observer = () => {
      const current = ytext.toString();
      setContent(current);
      if (baselineRef.current !== null) {
        onDirtyChange(current !== baselineRef.current);
      }
    };
    ytext.observe(observer);
    return () => ytext.unobserve(observer);
  }, [collab, onDirtyChange]);

  if (fetchError) {
    const isRateLimit = fetchError.includes("403");
    return (
      <div className="flex-1 flex overflow-hidden justify-center">
        <div className="max-w-4xl w-full px-4 pt-4 space-y-2">
          <p className="text-destructive font-medium">
            Could not load this gist
          </p>
          <p className="text-sm text-muted-foreground">{fetchError}</p>
          {isRateLimit && !session && (
            <>
              <p className="text-sm text-muted-foreground">
                GitHub rate-limits unauthenticated API requests. Sign in to fix
                this.
              </p>
              <button
                className="inline-flex items-center gap-2 rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-sm font-medium hover:bg-primary/90"
                onClick={() => signIn.social({ provider: "github" })}
              >
                Sign in with GitHub
              </button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden justify-center">
      {!collab ? (
        <div className="max-w-4xl w-full px-4 pt-4 text-muted-foreground">Connecting...</div>
      ) : (
        <>
          <div className="flex-1 overflow-auto max-w-4xl px-0.5 xl:resize-x xl:min-w-[32rem]">
            <Editor
              ytext={collab.ydoc.getText("content")}
              awareness={collab.provider.awareness}
              onCommit={onCommit}
            />
          </div>
          {showPreview && (
            <div className="flex-1 overflow-auto border-l border-border max-w-4xl">
              <Preview content={content} />
            </div>
          )}
        </>
      )}
    </div>
  );
}
