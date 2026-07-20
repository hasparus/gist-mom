import { useState, useEffect } from "react";
import YPartyKitProvider from "y-partyserver/provider";
import * as Y from "yjs";
import { Editor } from "./Editor";
import { Preview } from "./Preview";
import { CursorParty } from "./CursorParty";
import { signIn } from "../lib/auth-client";
import { Button } from "./ui/button";
import type { Session } from "../lib/types";
import type { Peer } from "./PresenceAvatars";

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
  onPeersChange,
}: {
  gistId: string;
  session: Session;
  showPreview: boolean;
  onCommit: () => void;
  onDirtyChange: (dirty: boolean) => void;
  onPeersChange: (peers: Peer[]) => void;
}) {
  const [collab, setCollab] = useState<{
    provider: YPartyKitProvider;
    ydoc: Y.Doc;
  } | null>(null);
  const [content, setContent] = useState("");
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [seeded, setSeeded] = useState(false);


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
      image: session?.user?.image || null,
    });

    setCollab({ provider: p, ydoc: doc });
    return () => {
      p.destroy();
      doc.destroy();
      setCollab(null);
      onDirtyChange(false);
    };
  }, [gistId, seeded]);

  // Track dirty state: compare content to baseline stored in Y.Doc meta
  useEffect(() => {
    if (!collab) return;
    const meta = collab.ydoc.getMap("meta");
    const ytext = collab.ydoc.getText("content");

    const check = () => {
      const current = ytext.toString();
      setContent(current);
      const baseline = meta.get("baseline") as string | undefined;
      if (baseline !== undefined) {
        onDirtyChange(current !== baseline);
      }
    };

    ytext.observe(check);
    meta.observe(check);
    check();
    return () => {
      ytext.unobserve(check);
      meta.unobserve(check);
    };
  }, [collab, onDirtyChange]);

  // Report connected peers to parent
  useEffect(() => {
    if (!collab) {
      onPeersChange([]);
      return;
    }
    const awareness = collab.provider.awareness;
    const report = () => {
      const peers: Peer[] = [];
      awareness.getStates().forEach((state, clientId) => {
        if (clientId === awareness.clientID) return;
        const user = state.user as
          | { name?: string; color?: string; image?: string | null }
          | undefined;
        if (!user) return;
        peers.push({
          name: user.name || "Anonymous",
          color: user.color || "#888",
          image: user.image,
        });
      });
      onPeersChange(peers);
    };
    awareness.on("change", report);
    report();
    return () => {
      awareness.off("change", report);
    };
  }, [collab, onPeersChange]);

  if (fetchError) {
    const isRateLimit = fetchError.includes("403");
    return (
      <div className="flex-1 flex overflow-hidden justify-center">
        <div className="max-w-4xl w-full px-4 pt-4 space-y-2">
          <p className="text-destructive font-medium" role="alert">
            <span aria-hidden="true">&#x26A0;&#xFE0F; </span>Could not load this gist
          </p>
          <p className="text-sm text-muted-foreground">{fetchError}</p>
          {isRateLimit && !session && (
            <>
              <p className="text-sm text-muted-foreground">
                GitHub rate-limits unauthenticated API requests. Sign in to fix
                this.
              </p>
              <Button
                size="sm"
                onClick={() => signIn.social({ provider: "github" })}
              >
                Sign in with GitHub
              </Button>
            </>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden justify-center">
      {!collab ? (
        <div role="status" aria-live="polite" className="max-w-4xl w-full pl-2 pr-4 pt-4 text-sm text-muted-foreground">Connecting...</div>
      ) : (
        <>
          <div className={`flex-1 overflow-auto max-w-4xl px-0.5${showPreview ? " max-sm:hidden" : ""}`}>
            <Editor
              ytext={collab.ydoc.getText("content")}
              awareness={collab.provider.awareness}
              onCommit={onCommit}
            />
          </div>
          {showPreview && (
            <div className="flex-1 overflow-auto sm:border-l border-border max-w-4xl">
              <Preview content={content} />
            </div>
          )}
          <CursorParty awareness={collab.provider.awareness} />
        </>
      )}
    </div>
  );
}
