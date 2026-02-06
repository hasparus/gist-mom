import { useEffect, useRef } from "react";
import { EditorView, basicSetup } from "codemirror";
import { EditorState } from "@codemirror/state";
import { keymap } from "@codemirror/view";
import { markdown } from "@codemirror/lang-markdown";
import { yCollab, yUndoManagerKeymap } from "y-codemirror.next";
import type * as Y from "yjs";
import type { Awareness } from "y-protocols/awareness";

interface EditorProps {
  ytext: Y.Text;
  awareness: Awareness;
  onCommit: () => void;
}

export function Editor({ ytext, awareness, onCommit }: EditorProps) {
  const ref = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);
  const onCommitRef = useRef(onCommit);
  onCommitRef.current = onCommit;

  useEffect(() => {
    if (!ref.current) return;

    const state = EditorState.create({
      doc: ytext.toString(),
      extensions: [
        basicSetup,
        markdown(),
        EditorView.lineWrapping,
        keymap.of([
          ...yUndoManagerKeymap,
          {
            key: "Mod-s",
            run: () => {
              onCommitRef.current();
              return true;
            },
          },
        ]),
        yCollab(ytext, awareness),
      ],
    });

    viewRef.current = new EditorView({ state, parent: ref.current });

    return () => {
      viewRef.current?.destroy();
    };
  }, [ytext, awareness]);

  return <div ref={ref} style={{ height: "100%" }} />;
}
