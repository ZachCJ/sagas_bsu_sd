/**
 * The story map's data, served from the dummy files in `src/mocks/`. Particularly mapData.ts
 *
 * Behaves like the real client will: async, bounds-filtered, at most two
 * preview images. A small delay makes loading states visible during
 * development; tests pass `delayMs: 0`.
 *
 * turns each mockSite into shapes UI expects: a map node, hover previw and a site page.
 *
 * When capture-api is ready it will send those shapes directly and this interface file can be deleted.
 */
import type { MockSite } from "../mocks/mapData";
import type { MapApi, MapNode } from "./types";
import { mockSites } from "../mocks/mapData";
import { isInBounds } from "./geo";
import { MAX_PREVIEW_IMAGES } from "./types";

/**
 *Builds the client that serves dummy data from src/mocks/mapData.ts.
 *
 * @param param0 - Options. `sites`: the places to serve (default: mockSites). `delayMs`: fake network delay in ms (default 150; tests use 0).
 * @returns A MapApi with getNodes, getPreview and getSiteRecords.
 */
export function createMockClient({
  sites = mockSites,
  delayMs = 150,
}: { sites?: MockSite[]; delayMs?: number } = {}): MapApi {
  const wait = <T>(value: T) =>
    new Promise<T>((resolve) => setTimeout(() => resolve(value), delayMs));

  //Turns dummy place into a node
  const toNode = (site: MockSite): MapNode => ({
    siteId: site.siteId,
    name: site.name,
    coordinates: site.coordinates,
    recordCount: site.records.length,
  });

  const find = (siteId: string) => sites.find((site) => site.siteId === siteId);

  //Turns every place into a node and keeps only those inside visable area using siInBounds
  return {
    getNodes(bounds) {
      return wait(sites.map(toNode).filter((node) => isInBounds(node, bounds)));
    },

    //Finds place, collects images from all of its records, keeps first 2 and returns them with name
    async getPreview(siteId) {
      const site = find(siteId);
      if (!site) throw new Error(`No site with id "${siteId}".`);
      const images = site.records
        .flatMap((record) => record.images)
        .slice(0, MAX_PREVIEW_IMAGES);
      return wait({ siteId: site.siteId, name: site.name, images });
    },

    //Returns places name, address and records or null if no palce has that id.
    getSiteRecords(siteId) {
      const site = find(siteId);
      //Returns value after DelaysMS.
      return wait(
        site
          ? {
              siteId: site.siteId,
              name: site.name,
              address: site.address,
              records: site.records,
            }
          : null,
      );
    },
  };
}
