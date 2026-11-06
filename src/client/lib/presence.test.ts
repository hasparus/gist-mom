/// <reference types="bun" />
import { describe, expect, test } from "bun:test";
import { parsePresence } from "./presence";

const user = { name: "Alice", color: "#30bced", image: "https://example.com/avatar.png" };
const pointer = { x: 0.25, y: 0.75, pointer: "mouse" };

describe("parsePresence", () => {
  test("preserves valid users, mouse/touch cursors and chat without mutating input", () => {
    for (const kind of ["mouse", "touch"] as const) {
      const state = Object.freeze({
        user: Object.freeze({ ...user }),
        pointer: Object.freeze({ ...pointer, pointer: kind }),
        message: "hello",
      });
      const result = parsePresence(state);
      expect(result).toEqual({ user, cursor: state.pointer, message: "hello" });
      expect(result.user).not.toBe(state.user);
      expect(result.cursor).not.toBe(state.pointer);
    }
  });

  test("accepts six-digit generated hex colors, including uppercase", () => {
    for (const color of ["#30bced", "#6eeb83", "#ffbc42", "#ecd444", "#ee6352", "#9ac2c9", "#8acb88", "#1be7ff", "#ABCDEF"]) {
      expect(parsePresence({ user: { ...user, color } }).user?.color).toBe(color);
    }
  });

  test("normalizes malformed avatar-only metadata", () => {
    expect(parsePresence({ user: { name: { bad: true }, color: 123, image: {} } })).toEqual({
      user: { name: "Anonymous", color: "#888888", image: null },
      cursor: null,
      message: null,
    });
    for (const name of [undefined, null, "", "   ", 123, true, [], {}]) {
      expect(parsePresence({ user: { ...user, name } }).user?.name).toBe("Anonymous");
    }
    for (const color of [undefined, null, 123, true, [], {}, "#888", "#12345678", "red", "#gggggg", "#123456;display:none"]) {
      expect(parsePresence({ user: { ...user, color } }).user?.color).toBe("#888888");
    }
    for (const image of [undefined, null, 123, true, [], {}]) {
      expect(parsePresence({ user: { ...user, image } }).user?.image).toBeNull();
    }
  });

  test("bounds names and messages and rejects non-string chat", () => {
    const result = parsePresence({ user: { ...user, name: "n".repeat(200) }, message: "m".repeat(100) });
    expect(result.user?.name).toBe("n".repeat(128));
    expect(result.message).toBe("m".repeat(42));
    for (const message of [undefined, null, "", 123, true, [], { text: "bad" }]) {
      expect(parsePresence({ user, pointer, message }).message).toBeNull();
    }
  });

  test("drops malformed pointers independently of valid peers and chat", () => {
    const invalid = [
      undefined, null, false, 1, "mouse", [],
      {}, { ...pointer, pointer: "pen" }, { ...pointer, pointer: {} },
      ...["x", "y"].flatMap((axis) =>
        [undefined, null, "0.5", true, {}, NaN, Infinity, -Infinity, -0.1, 1.1].map((value) => ({ ...pointer, [axis]: value })),
      ),
    ];
    for (const badPointer of invalid) {
      expect(parsePresence({ user, pointer: badPointer, message: "hello" })).toEqual({
        user, cursor: null, message: "hello",
      });
    }
    expect(parsePresence({ user, pointer: { x: 0, y: 1, pointer: "touch" } }).cursor).toEqual({ x: 0, y: 1, pointer: "touch" });
  });

  test("handles absent or non-record states and users", () => {
    for (const value of [undefined, null, false, 42, "bad", []]) {
      expect(parsePresence(value)).toEqual({ user: null, cursor: null, message: null });
      expect(parsePresence({ user: value }).user).toBeNull();
    }
    expect(parsePresence({ user: {} }).user).toEqual({ name: "Anonymous", color: "#888888", image: null });
  });
});
