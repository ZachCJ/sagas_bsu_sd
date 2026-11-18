import { describe, expect, it } from "vitest";

import { mockSites } from "../mocks/mapData";
import { createMockClient } from "./mockClient";
import { MAX_PREVIEW_IMAGES } from "./types";

const api = createMockClient({ delayMs: 0 });
const everywhere = { west: -180, south: -90, east: 180, north: 90 };

describe("mock client", () => {
  it("returns a node for every dummy site when the whole world is in view", async () => {
    const nodes = await api.getNodes(everywhere);
    expect(nodes.map((node) => node.siteId).sort()).toEqual(mockSites.map((site) => site.siteId).sort());
  });

  it("only returns nodes inside the bounds", async () => {
    // A small box around the two Hays Street sites only.
    const nodes = await api.getNodes({ west: -116.207, south: 43.622, east: -116.206, north: 43.6223 });
    expect(nodes.map((node) => node.siteId).sort()).toEqual(["hays-1114", "hays-1116"]);
  });

  it("returns nothing for an empty area", async () => {
    expect(await api.getNodes({ west: 0, south: 0, east: 1, north: 1 })).toEqual([]);
  });

  it("counts each site's records", async () => {
    const nodes = await api.getNodes(everywhere);
    for (const site of mockSites) {
      expect(nodes.find((node) => node.siteId === site.siteId)?.recordCount).toBe(site.records.length);
    }
  });

  it("returns at most two preview images, even for a site with more", async () => {
    const preview = await api.getPreview("anduiza-hotel-fronton");
    expect(preview.images).toHaveLength(MAX_PREVIEW_IMAGES);
  });

  it("returns one image for a site with one, and none for a site with none", async () => {
    expect((await api.getPreview("corner-shop")).images).toHaveLength(1);
    expect((await api.getPreview("hays-1114")).images).toHaveLength(0);
  });

  it("gives every preview image alt text and a placeholder url", async () => {
    for (const site of mockSites) {
      const { images } = await api.getPreview(site.siteId);
      for (const image of images) {
        expect(image.alt.trim()).not.toBe("");
        expect(image.url).toMatch(/^\/placeholders\/.+\.svg$/);
      }
    }
  });

  it("rejects a preview for an unknown site", async () => {
    await expect(api.getPreview("nowhere")).rejects.toThrow();
  });

  it("returns the records for a site", async () => {
    const site = await api.getSiteRecords("hays-1116");
    expect(site?.name).toBe("1116 Hays Street");
    expect(site?.records.map((record) => record.id)).toEqual(["mock-rec-007", "mock-rec-008"]);
  });

  it("returns null for an unknown site", async () => {
    expect(await api.getSiteRecords("nowhere")).toBeNull();
  });
});
