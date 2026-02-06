import { useState, useEffect } from "react";
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
}: {
  gistId: string;
  session: Session;
  showPreview: boolean;
  onCommit: () => void;
}) {
  const [collab, setCollab] = useState<{
    provider: YPartyKitProvider;
    ydoc: Y.Doc;
  } | null>(null);
  const [content, setContent] = useState("");

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

    setCollab({ provider: p, ydoc: doc });
    return () => {
      p.destroy();
      doc.destroy();
    };
  }, [gistId]);

  // Track content for preview
  useEffect(() => {
    if (!collab) return;
    const ytext = collab.ydoc.getText("content");
    const observer = () => setContent(ytext.toString());
    ytext.observe(observer);
    return () => ytext.unobserve(observer);
  }, [collab]);

  return (
    <div className="flex-1 flex overflow-hidden justify-center">
      {!collab ? (
        <div className="p-8 text-muted-foreground">Connecting...</div>
      ) : (
        <>
          <div className="flex-1 overflow-auto max-w-4xl">
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
