import { useEffect, useState, useCallback } from "react";
import type { Awareness } from "y-protocols/awareness";
import { contrastText } from "./contrastText";

type Cursor = { x: number; y: number; pointer: "mouse" | "touch" };
type RemoteCursor = {
  clientId: number;
  name: string;
  color: string;
  cursor: Cursor;
  message: string | null;
};

function useCursorTracking(awareness: Awareness) {
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      awareness.setLocalStateField("pointer", {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
        pointer: "mouse",
      } satisfies Cursor);
    };

    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      awareness.setLocalStateField("pointer", {
        x: t.clientX / window.innerWidth,
        y: t.clientY / window.innerHeight,
        pointer: "touch",
      } satisfies Cursor);
    };

    const onTouchEnd = () => {
      awareness.setLocalStateField("pointer", null);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchmove", onTouchMove);
    window.addEventListener("touchend", onTouchEnd);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      awareness.setLocalStateField("pointer", null);
    };
  }, [awareness]);
}

function useRemoteCursors(awareness: Awareness): RemoteCursor[] {
  const [cursors, setCursors] = useState<RemoteCursor[]>([]);

  const update = useCallback(() => {
    const result: RemoteCursor[] = [];
    awareness.getStates().forEach((state, clientId) => {
      if (clientId === awareness.clientID) return;
      const cursor = state.pointer as Cursor | null | undefined;
      const user = state.user as { name?: string; color?: string } | undefined;
      if (!cursor || !user) return;
      result.push({
        clientId,
        name: user.name || "Anonymous",
        color: user.color || "#888",
        cursor,
        message: (state.message as string) ?? null,
      });
    });
    setCursors(result);
  }, [awareness]);

  useEffect(() => {
    awareness.on("change", update);
    update();
    return () => {
      awareness.off("change", update);
    };
  }, [awareness, update]);

  return cursors;
}

const MAX_MESSAGE_LENGTH = 42;
const CHAT_TIMEOUT_MS = 10_000;

function useCursorChat(awareness: Awareness) {
  const [listening, setListening] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    awareness.setLocalStateField(
      "message",
      message.length > 0 ? message : null,
    );
  }, [awareness, message]);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout> | null = null;

    const resetTimeout = () => {
      if (timeout) clearTimeout(timeout);
      timeout = setTimeout(() => {
        setListening(false);
        setMessage("");
      }, CHAT_TIMEOUT_MS);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      const isInEditor =
        (event.target as HTMLElement)?.closest?.(".cm-editor") != null;

      if (!listening) {
        // "/" when CM is not focused — press Escape first to blur editor
        if (event.key === "/" && !isInEditor) {
          event.preventDefault();
          setMessage("");
          setListening(true);
          resetTimeout();
        }
        return;
      }

      // In listening mode — capture everything except modifier combos
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      event.preventDefault();
      event.stopPropagation();
      resetTimeout();

      if (event.key === "Enter" || event.key === "Escape") {
        setListening(false);
        if (event.key === "Escape") setMessage("");
        // On Enter, message persists and fades via timeout
      } else if (event.key === "Backspace") {
        setMessage((prev) => prev.slice(0, -1));
      } else if (event.key.length === 1) {
        setMessage((prev) =>
          prev.length < MAX_MESSAGE_LENGTH ? prev + event.key : prev,
        );
      }
    };

    document.addEventListener("keydown", handleKeyDown, true);
    return () => {
      document.removeEventListener("keydown", handleKeyDown, true);
      if (timeout) clearTimeout(timeout);
    };
  }, [listening]);

  return { listening, message };
}

// SVG from https://github.com/daviddarnes/mac-cursors (Apple license)
function MousePointer({ fill }: { fill: string }) {
  return (
    <svg height="32" viewBox="0 0 32 32" width="32">
      <g fill="none" fillRule="evenodd" transform="translate(10 7)">
        <path
          d="m6.148 18.473 1.863-1.003 1.615-.839-2.568-4.816h4.332l-11.379-11.408v16.015l3.316-3.221z"
          fill="var(--foreground)"
        />
        <path
          d="m6.431 17 1.765-.941-2.775-5.202h3.604l-8.025-8.043v11.188l2.53-2.442z"
          fill={fill}
        />
      </g>
    </svg>
  );
}

function ChatBubble({
  message,
  color,
}: {
  message: string;
  color: string;
}) {
  return (
    <span
      className="text-xs xl:text-sm font-medium leading-none px-1.5 xl:px-2 py-1 xl:py-1.5 rounded whitespace-nowrap max-w-48 xl:max-w-56 overflow-hidden shadow-lg"
      style={{
        backgroundColor: color,
        color: contrastText(color),
        position: "absolute",
        left: 18,
        top: 20,
      }}
    >
      {message}
    </span>
  );
}

export function CursorParty({ awareness }: { awareness: Awareness }) {
  useCursorTracking(awareness);
  const cursors = useRemoteCursors(awareness);
  const { listening, message } = useCursorChat(awareness);

  const anyoneHasMessage =
    cursors.some((c) => c.message != null) || message.length > 0;

  // Show CTA when someone else is chatting but we're not
  const showCta = anyoneHasMessage && !listening && message.length === 0;

  // Get local user color for local chat bubble
  const localState = awareness.getLocalState();
  const localColor =
    (localState?.user as { color?: string } | undefined)?.color ?? "#888";

  if (cursors.length === 0 && !listening && !showCta) return null;

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        pointerEvents: "none",
        zIndex: 50,
        overflow: "clip",
      }}
    >
      {cursors.map((c) => {
        const x = c.cursor.x * window.innerWidth;
        const y = c.cursor.y * window.innerHeight;
        return (
          <div
            key={c.clientId}
            style={{
              position: "absolute",
              transform: `translate(${x - 10}px, ${y - 10}px)`,
              transition: "transform 80ms linear",
              opacity: anyoneHasMessage && !c.message ? 0.4 : 1,
            }}
          >
            <MousePointer fill={c.color} />
            {c.message ? (
              <ChatBubble message={c.message} color={c.color} />
            ) : (
              <span
                className="text-xs font-medium leading-none px-1.5 py-1 rounded whitespace-nowrap"
                style={{
                  backgroundColor: c.color,
                  color: contrastText(c.color),
                  position: "absolute",
                  left: 18,
                  top: 20,
                }}
              >
                {c.name}
              </span>
            )}
          </div>
        );
      })}
      {/* Local chat bubble + CTA */}
      <LocalChatOverlay
        listening={listening}
        message={message}
        showCta={showCta}
        color={localColor}
      />
    </div>
  );
}

function LocalChatOverlay({
  listening,
  message,
  showCta,
  color,
}: {
  listening: boolean;
  message: string;
  showCta: boolean;
  color: string;
}) {
  const [pos, setPos] = useState({ x: -1, y: -1 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => setPos({ x: e.clientX, y: e.clientY });
    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, []);

  if (pos.x === -1) return null;
  if (!listening && !message && !showCta) return null;

  return (
    <div
      style={{
        position: "absolute",
        transform: `translate(${pos.x + 8}px, ${pos.y + 8}px)`,
      }}
    >
      {(listening || message) && (
        <span
          className="text-xs xl:text-sm font-medium leading-none px-1.5 xl:px-2 py-1 xl:py-1.5 rounded whitespace-nowrap max-w-48 xl:max-w-56 overflow-hidden shadow-lg"
          style={{
            backgroundColor: color,
            color: contrastText(color),
          }}
        >
          {message || (listening ? "\u00A0" : "")}
        </span>
      )}
      {showCta && !listening && !message && (
        <span className="text-xs xl:text-sm text-muted-foreground bg-popover px-1.5 xl:px-2 py-1 xl:py-1.5 rounded shadow-lg whitespace-nowrap">
          Type <kbd className="text-foreground font-mono">/</kbd> to chat
        </span>
      )}
    </div>
  );
}
