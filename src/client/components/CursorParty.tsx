import { useEffect, useState, useCallback } from "react";
import type { Awareness } from "y-protocols/awareness";
import { contrastText } from "./contrastText";

type Cursor = { x: number; y: number; pointer: "mouse" | "touch" };
type RemoteCursor = {
  clientId: number;
  name: string;
  color: string;
  cursor: Cursor;
};

function useCursorTracking(awareness: Awareness) {
  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      awareness.setLocalStateField("cursor", {
        x: e.clientX / window.innerWidth,
        y: e.clientY / window.innerHeight,
        pointer: "mouse",
      } satisfies Cursor);
    };

    const onTouchMove = (e: TouchEvent) => {
      const t = e.touches[0];
      if (!t) return;
      awareness.setLocalStateField("cursor", {
        x: t.clientX / window.innerWidth,
        y: t.clientY / window.innerHeight,
        pointer: "touch",
      } satisfies Cursor);
    };

    const onTouchEnd = () => {
      awareness.setLocalStateField("cursor", null);
    };

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("touchmove", onTouchMove);
    window.addEventListener("touchend", onTouchEnd);

    return () => {
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      awareness.setLocalStateField("cursor", null);
    };
  }, [awareness]);
}

function useRemoteCursors(awareness: Awareness): RemoteCursor[] {
  const [cursors, setCursors] = useState<RemoteCursor[]>([]);

  const update = useCallback(() => {
    const result: RemoteCursor[] = [];
    awareness.getStates().forEach((state, clientId) => {
      if (clientId === awareness.clientID) return;
      const cursor = state.cursor as Cursor | null | undefined;
      const user = state.user as { name?: string; color?: string } | undefined;
      if (!cursor || !user) return;
      result.push({
        clientId,
        name: user.name || "Anonymous",
        color: user.color || "#888",
        cursor,
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

export function CursorParty({ awareness }: { awareness: Awareness }) {
  useCursorTracking(awareness);
  const cursors = useRemoteCursors(awareness);

  if (cursors.length === 0) return null;

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
            }}
          >
            <MousePointer fill={c.color} />
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
          </div>
        );
      })}
    </div>
  );
}
