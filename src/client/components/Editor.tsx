import { useEffect, useRef } from "react";
import { EditorView } from "codemirror";
import { EditorState } from "@codemirror/state";
import {
  keymap,
  highlightSpecialChars,
  drawSelection,
  dropCursor,
  rectangularSelection,
  crosshairCursor,
} from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import {
  bracketMatching,
  foldKeymap,
  indentOnInput,
} from "@codemirror/language";
import {
  autocompletion,
  closeBrackets,
  closeBracketsKeymap,
  completionKeymap,
} from "@codemirror/autocomplete";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import { markdown } from "@codemirror/lang-markdown";
import { yCollab, yUndoManagerKeymap } from "y-codemirror.next";
import { codeMirrorTheme } from "./codemirror-theme";
import type * as Y from "yjs";
import type { Awareness } from "y-protocols/awareness";

// basicSetup minus lineNumbers and highlightActiveLine
const minimalSetup = [
  highlightSpecialChars(),
  history(),
  drawSelection(),
  dropCursor(),
  EditorState.allowMultipleSelections.of(true),
  indentOnInput(),
  codeMirrorTheme,
  bracketMatching(),
  closeBrackets(),
  autocompletion(),
  rectangularSelection(),
  crosshairCursor(),
  highlightSelectionMatches(),
  keymap.of([
    ...closeBracketsKeymap,
    ...defaultKeymap,
    ...searchKeymap,
    ...historyKeymap,
    ...foldKeymap,
    ...completionKeymap,
  ]),
];

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
        minimalSetup,
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

  return <div ref={ref} className="h-full [&_.cm-editor]:h-full" />;
}
