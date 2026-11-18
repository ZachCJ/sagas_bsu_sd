import { describe, expect, it, vi } from "vitest";

import type { NodePreview } from "./types";
import { createPreviewCache } from "./previewCache";

const preview = (siteId: string): NodePreview => ({ siteId, name: siteId, images: [] });

describe("createPreviewCache", () => {
  it("fetches a preview once and then reuses it", async () => {
    const fetchPreview = vi.fn((siteId: string) => Promise.resolve(preview(siteId)));
    const cache = createPreviewCache(fetchPreview);

    await cache.get("a");
    await cache.get("a");
    expect(fetchPreview).toHaveBeenCalledTimes(1);
  });

  it("shares one request between hovers that overlap", async () => {
    const fetchPreview = vi.fn((siteId: string) => Promise.resolve(preview(siteId)));
    const cache = createPreviewCache(fetchPreview);

    const [first, second] = await Promise.all([cache.get("a"), cache.get("a")]);
    expect(first).toBe(second);
    expect(fetchPreview).toHaveBeenCalledTimes(1);
  });

  it("keeps sites separate", async () => {
    const fetchPreview = vi.fn((siteId: string) => Promise.resolve(preview(siteId)));
    const cache = createPreviewCache(fetchPreview);

    expect((await cache.get("a")).siteId).toBe("a");
    expect((await cache.get("b")).siteId).toBe("b");
    expect(fetchPreview).toHaveBeenCalledTimes(2);
  });

  it("forgets a failed request so the next hover retries", async () => {
    const fetchPreview = vi
      .fn<(siteId: string) => Promise<NodePreview>>()
      .mockRejectedValueOnce(new Error("offline"))
      .mockResolvedValueOnce(preview("a"));
    const cache = createPreviewCache(fetchPreview);

    await expect(cache.get("a")).rejects.toThrow("offline");
    await expect(cache.get("a")).resolves.toEqual(preview("a"));
    expect(fetchPreview).toHaveBeenCalledTimes(2);
  });

  it("refetches after entries expire, because real image links expire", async () => {
    let time = 0;
    const fetchPreview = vi.fn((siteId: string) => Promise.resolve(preview(siteId)));
    const cache = createPreviewCache(fetchPreview, { maxAgeMs: 1000, now: () => time });

    await cache.get("a");
    time = 999;
    await cache.get("a");
    expect(fetchPreview).toHaveBeenCalledTimes(1);

    time = 1000;
    await cache.get("a");
    expect(fetchPreview).toHaveBeenCalledTimes(2);
  });
});
