//Tests the real capture-api clent without needing capture-api to be running. does that with
// fake fetch so it checks the requests the client would send and how it handles the answers.

import { describe, expect, it, vi } from "vitest";

import type { NodePreview } from "./types";
import { createHttpClient } from "./httpClient";

/** A fake fetch that answers with the given status and body, and records the URLs asked for. */
function fakeFetch(status: number, body: unknown = null) {
  return vi.fn<typeof fetch>(() =>
    Promise.resolve(
      new Response(body === null ? null : JSON.stringify(body), {
        status,
        headers: { "content-type": "application/json" },
      }),
    ),
  );
}

function calledUrl(fetchImpl: ReturnType<typeof fakeFetch>): string {
  const input = fetchImpl.mock.calls[0]?.[0];
  // The client always passes a string path; anything else is a test failure.
  if (typeof input !== "string")
    throw new Error("fetch was not called with a string URL.");
  return input;
}

describe("http client", () => {
  it("asks for nodes with the bounds as query parameters", async () => {
    const fetchImpl = fakeFetch(200, []);
    const api = createHttpClient({ fetchImpl });

    await api.getNodes({
      west: -116.3,
      south: 43.5,
      east: -116.1,
      north: 43.7,
    });

    const url = new URL(calledUrl(fetchImpl), "http://localhost");
    expect(url.pathname).toBe("/api/map/nodes");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      west: "-116.3",
      south: "43.5",
      east: "-116.1",
      north: "43.7",
    });
  });

  it("returns the nodes the server sends", async () => {
    const nodes = [
      { siteId: "a", name: "A", coordinates: [-116.2, 43.6], recordCount: 1 },
    ];
    const api = createHttpClient({ fetchImpl: fakeFetch(200, nodes) });
    expect(
      await api.getNodes({ west: -117, south: 43, east: -116, north: 44 }),
    ).toEqual(nodes);
  });

  it("encodes the site id in preview and records paths", async () => {
    const preview: NodePreview = { siteId: "a/b", name: "A", images: [] };
    const fetchImpl = fakeFetch(200, preview);
    const api = createHttpClient({ fetchImpl });

    await api.getPreview("a/b");
    expect(calledUrl(fetchImpl)).toBe("/api/map/nodes/a%2Fb/preview");

    fetchImpl.mockClear();
    await api.getSiteRecords("a/b");
    expect(calledUrl(fetchImpl)).toBe("/api/sites/a%2Fb/records");
  });

  it("keeps at most two preview images even if the server sends more", async () => {
    const images = [1, 2, 3].map((n) => ({
      id: `m${n}`,
      url: `/x${n}.jpg`,
      alt: `Photo ${n}`,
    }));
    const api = createHttpClient({
      fetchImpl: fakeFetch(200, { siteId: "a", name: "A", images }),
    });
    expect((await api.getPreview("a")).images.map((image) => image.id)).toEqual(
      ["m1", "m2"],
    );
  });

  it("returns null for records of a site that does not exist", async () => {
    const api = createHttpClient({ fetchImpl: fakeFetch(404) });
    expect(await api.getSiteRecords("nowhere")).toBeNull();
  });

  it("rejects a preview for a site that does not exist", async () => {
    const api = createHttpClient({ fetchImpl: fakeFetch(404) });
    await expect(api.getPreview("nowhere")).rejects.toThrow();
  });

  it("throws when the server fails", async () => {
    const api = createHttpClient({
      fetchImpl: fakeFetch(500, { error: "Something failed on the server." }),
    });
    await expect(
      api.getNodes({ west: 0, south: 0, east: 1, north: 1 }),
    ).rejects.toThrow(/500/);
  });
});
