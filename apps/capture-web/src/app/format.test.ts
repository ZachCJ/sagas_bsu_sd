// Tests the three display helpers in format.ts that turn raw data into text people
//can read.

import { describe, expect, it } from "vitest";

import { formatDate, recordCountLabel, sitePath } from "./format";

describe("recordCountLabel", () => {
  it("uses singular and plural", () => {
    expect(recordCountLabel(0)).toBe("0 records");
    expect(recordCountLabel(1)).toBe("1 record");
    expect(recordCountLabel(3)).toBe("3 records");
  });
});

describe("formatDate", () => {
  it("formats a full timestamp", () => {
    expect(formatDate("2026-09-07T12:00:00Z", "en-US")).toBe(
      "September 7, 2026",
    );
  });

  it("shows partial dates as given instead of inventing a day", () => {
    expect(formatDate("1962", "en-US")).toBe("1962");
    expect(formatDate("1962-06", "en-US")).toBe("1962-06");
  });

  it("returns undefined for no date", () => {
    expect(formatDate(undefined)).toBeUndefined();
  });
});

describe("sitePath", () => {
  it("builds the records page path and encodes the id", () => {
    expect(sitePath("hays-1114")).toBe("/sites/hays-1114");
    expect(sitePath("a/b c")).toBe("/sites/a%2Fb%20c");
  });
});
