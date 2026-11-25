import { afterEach, describe, expect, it, vi } from "vitest";

import { newId } from "./newId";

const UUID =
  /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("newId", () => {
  it("returns a UUID", () => {
    expect(newId()).toMatch(UUID);
  });

  it("still works where crypto.randomUUID is missing (plain http)", () => {
    vi.stubGlobal("crypto", {
      getRandomValues: globalThis.crypto.getRandomValues.bind(
        globalThis.crypto,
      ),
    });
    const first = newId();
    expect(first).toMatch(UUID);
    expect(newId()).not.toBe(first);
  });
});
