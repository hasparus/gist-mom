export const MAX_MESSAGE_LENGTH = 42;
const MAX_NAME_LENGTH = 128;
const HEX_COLOR = /^#[0-9a-f]{6}$/i;

export type PresenceUser = {
  name: string;
  color: string;
  image: string | null;
};

export type Cursor = { x: number; y: number; pointer: "mouse" | "touch" };

function record(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function coordinate(value: unknown): value is number {
  return (
    typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= 1
  );
}

export function parsePresence(value: unknown): {
  user: PresenceUser | null;
  cursor: Cursor | null;
  message: string | null;
} {
  const state = record(value);
  const user = record(state?.user);
  const pointer = record(state?.pointer);
  return {
    user: user
      ? {
          name:
            typeof user.name === "string" && user.name.trim().length > 0
              ? user.name.slice(0, MAX_NAME_LENGTH)
              : "Anonymous",
          color:
            typeof user.color === "string" && HEX_COLOR.test(user.color)
              ? user.color
              : "#888888",
          image: typeof user.image === "string" ? user.image : null,
        }
      : null,
    cursor:
      pointer && coordinate(pointer.x) && coordinate(pointer.y) &&
      (pointer.pointer === "mouse" || pointer.pointer === "touch")
        ? { x: pointer.x, y: pointer.y, pointer: pointer.pointer }
        : null,
    message:
      typeof state?.message === "string" && state.message.length > 0
        ? state.message.slice(0, MAX_MESSAGE_LENGTH)
        : null,
  };
}
