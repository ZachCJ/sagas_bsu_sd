import { beforeEach, describe, expect, it, vi } from "vitest";

import { getGuestId } from "./guest";
import {
  createRecord,
  getRecord,
  searchRecords,
  updateRecordLocation,
} from "./recordStore";

beforeEach(() => {
  const store = new Map<string, string>();
  vi.stubGlobal("localStorage", {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
    removeItem: (key: string) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  });
});

describe("getGuestId", () => {
  it("creates an id once and reuses it", () => {
    const first = getGuestId();
    expect(first).toMatch(/^[0-9a-f-]{36}$/);
    expect(getGuestId()).toBe(first);
    expect(localStorage.getItem("sagas.guestId")).toBe(first);
  });
});

describe("createRecord / getRecord", () => {
  it("stores a record owned by the current guest", () => {
    const created = createRecord({
      name: "Corner shop",
      address: " 4th and Main ",
    });
    const found = getRecord(created.id);
    expect(found).toEqual(created);
    expect(found?.address).toBe("4th and Main");
    expect(found?.contributorId).toBe(getGuestId());
  });

  it("stores no address when it is blank", () => {
    const created = createRecord({ name: "No place", address: "   " });
    expect(getRecord(created.id)?.address).toBeUndefined();
  });

  it("returns undefined for an unknown id", () => {
    expect(getRecord("nope")).toBeUndefined();
  });

  it("survives corrupt stored data", () => {
    localStorage.setItem("sagas.mockRecords", "{not json");
    expect(searchRecords("x")).toEqual([]);
    expect(createRecord({ name: "Fresh" }).name).toBe("Fresh");
  });
});

describe("searchRecords", () => {
  it("matches the address, ignoring case and whitespace", () => {
    const shop = createRecord({
      name: "Shop",
      address: "123 Main Street, Boise",
    });
    createRecord({ name: "Depot", address: "9 Front Street" });
    expect(searchRecords("  main st ").map((r) => r.id)).toEqual([shop.id]);
  });

  it("does not match on the record name", () => {
    createRecord({ name: "Main Street Shop", address: "9 Front Street" });
    expect(searchRecords("main")).toEqual([]);
  });

  it("never matches records with no address", () => {
    createRecord({ name: "Main" });
    expect(searchRecords("main")).toEqual([]);
  });

  it("returns nothing for an empty query", () => {
    createRecord({ name: "Shop", address: "Main" });
    expect(searchRecords("   ")).toEqual([]);
  });
});

describe("updateRecordLocation", () => {
  it("lets the owner set the address", () => {
    const record = createRecord({ name: "Shop" });
    const result = updateRecordLocation(record.id, "1 Main", getGuestId());
    expect(result.ok).toBe(true);
    expect(getRecord(record.id)?.address).toBe("1 Main");
  });

  it("refuses a different guest", () => {
    const record = createRecord({ name: "Shop", address: "1 Main" });
    const result = updateRecordLocation(record.id, "2 Elm", "someone-else");
    expect(result).toEqual({ ok: false, reason: "not_owner" });
    expect(getRecord(record.id)?.address).toBe("1 Main");
  });

  it("reports an unknown record", () => {
    expect(updateRecordLocation("nope", "x", getGuestId())).toEqual({
      ok: false,
      reason: "not_found",
    });
  });
});
