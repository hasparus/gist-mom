import { useEffect, useRef, useCallback } from "react";
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

    // Tell CM to remeasure when container is resized (CSS resize handle or window)
    const ro = new ResizeObserver(() => {
      viewRef.current?.requestMeasure();
    });
    ro.observe(ref.current);

    return () => {
      ro.disconnect();
      viewRef.current?.destroy();
    };
  }, [ytext, awareness]);

  const onDragHandle = useCallback((e: React.PointerEvent) => {
    const container = ref.current?.parentElement;
    if (!container) return;
    e.preventDefault();
    const startX = e.clientX;
    const startW = container.getBoundingClientRect().width;
    const handle = e.currentTarget as HTMLElement;
    handle.setPointerCapture(e.pointerId);
    handle.dataset.dragging = "";

    const onMove = (ev: PointerEvent) => {
      const w = Math.max(320, startW + ev.clientX - startX);
      container.style.width = `${w}px`;
      container.style.maxWidth = "none";
      container.style.flex = "none";
      viewRef.current?.requestMeasure();
    };
    const onUp = () => {
      handle.removeEventListener("pointermove", onMove);
      handle.removeEventListener("pointerup", onUp);
      delete handle.dataset.dragging;
    };
    handle.addEventListener("pointermove", onMove);
    handle.addEventListener("pointerup", onUp);
  }, []);

  const onResetWidth = useCallback(() => {
    const container = ref.current?.parentElement;
    if (!container) return;
    container.style.width = "";
    container.style.maxWidth = "";
    container.style.flex = "";
    viewRef.current?.requestMeasure();
  }, []);

  return (
    <div ref={ref} className="relative h-full [&_.cm-editor]:h-full">
      <div
        onPointerDown={onDragHandle}
        onDoubleClick={onResetWidth}
        className="hidden xl:block absolute right-0 top-0 bottom-0 w-3 cursor-col-resize z-10 border-r border-dashed border-border hover:border-solid hover:border-r-2 data-[dragging]:border-solid data-[dragging]:border-r-2"
      />
    </div>
  );
}
