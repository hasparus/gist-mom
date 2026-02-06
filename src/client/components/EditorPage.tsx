import { useState, useEffect, useRef } from "react";
import YPartyKitProvider from "y-partyserver/provider";
import * as Y from "yjs";
import { Editor } from "./Editor";
import { Preview } from "./Preview";
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
  const baselineRef = useRef<string | null>(null);

  useEffect(() => {
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

    // Capture baseline content after initial sync
    const onSync = (synced: boolean) => {
      if (synced && baselineRef.current === null) {
        baselineRef.current = doc.getText("content").toString();
      }
    };
    p.on("sync", onSync);

    setCollab({ provider: p, ydoc: doc });
    return () => {
      p.off("sync", onSync);
      p.destroy();
      doc.destroy();
      baselineRef.current = null;
      onDirtyChange(false);
    };
  }, [gistId]);

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

  return (
    <div className="flex-1 flex overflow-hidden justify-center">
      {!collab ? (
        <div className="p-8 text-muted-foreground">Connecting...</div>
      ) : (
        <>
          <div className="flex-1 overflow-auto max-w-4xl px-0.5">
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
