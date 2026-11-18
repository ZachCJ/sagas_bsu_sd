import { describe, expect, it } from "vitest";

import { shouldUseMockData } from "./mapApi";

describe("shouldUseMockData", () => {
  it("uses dummy data by default", () => {
    expect(shouldUseMockData(undefined)).toBe(true);
    expect(shouldUseMockData("")).toBe(true);
    expect(shouldUseMockData("true")).toBe(true);
  });

  it("uses the real API only when the flag is explicitly false", () => {
    expect(shouldUseMockData("false")).toBe(false);
    expect(shouldUseMockData(" FALSE ")).toBe(false);
  });
});
