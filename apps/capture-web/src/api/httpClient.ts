/**
 * The story map's data, from capture-api.
 *
 * The endpoints are what the front end expects capture-api to provide. They do
 * not exist yet; the shapes are written up in apps/capture-web/README.md for
 * whoever builds them. Requests go to `/api/...`, which the Vite dev server
 * proxies to Express on port 3001 (see vite.config.ts).
 *
 *   GET /map/nodes?west=&south=&east=&north=   -> MapNode[]
 *   GET /map/nodes/:siteId/preview             -> NodePreview
 *   GET /sites/:siteId/records                 -> SiteRecords, or 404
 */
import type { MapApi, MapNode, NodePreview, SiteRecords } from "./types";
import { MAX_PREVIEW_IMAGES } from "./types";

type Fetch = typeof fetch;

/**
 * Builds the client that loads story map data from capture-api.. 
 * 
 * @param param0 -  Options. `baseUrl`: where requests go (default "/api", which the Vite dev server proxies to Express on port 3001). 
 * `fetchImpl`: the function used to make requests (default: the browser's fetch; tests pass a fake).
 * @returns A MapApi with getNodes, getPreview and getSiteRecords.

 */
export function createHttpClient({
  baseUrl = "/api",
  fetchImpl = (...args: Parameters<Fetch>) => fetch(...args),
  // Decides the base url to put in front of every request path
}: { baseUrl?: string; fetchImpl?: Fetch } = {}): MapApi {
  //takes in a path like /map/nodes and returns eventually an object with the HTTP Status and body
  async function getJson<T>(
    path: string,
  ): Promise<{ status: number; body: T | null }> {
    const response = await fetchImpl(`${baseUrl}${path}`, {
      headers: { accept: "application/json" },
    });
    if (response.status === 404) return { status: 404, body: null };
    if (!response.ok) {
      throw new Error(
        `Request to ${path} failed with status ${response.status}.`,
      );
    }
    return { status: response.status, body: (await response.json()) as T };
  }

  return {
    async getNodes(bounds) {
      const query = new URLSearchParams({
        west: String(bounds.west),
        south: String(bounds.south),
        east: String(bounds.east),
        north: String(bounds.north),
      });
      const { body } = await getJson<MapNode[]>(
        `/map/nodes?${query.toString()}`,
      );
      return body ?? [];
    },

    /**
     * Loads the hover popup data for one place from capture-api.
     *
     * @param siteId - The place being hovered or focused.
     * @returns The place's id, name and at most two images.
     */
    async getPreview(siteId) {
      const { body } = await getJson<NodePreview>(
        `/map/nodes/${encodeURIComponent(siteId)}/preview`,
      );
      if (!body) throw new Error(`No site with id "${siteId}".`);
      // The server should already limit this; do not rely on it.
      return { ...body, images: body.images.slice(0, MAX_PREVIEW_IMAGES) };
    },

    /**
     * Asks capture-api for all the records at one place.
     *
     * @param siteId - The place's id, from the page URL.
     * @returns The place's name, address and records, or null if the place does not exist (404).
     */
    async getSiteRecords(siteId) {
      const { body } = await getJson<SiteRecords>(
        `/sites/${encodeURIComponent(siteId)}/records`,
      );
      return body;
    },
  };
}
