/**
 * Small pure helpers for the story map.
 *
 * They live outside the components so they can be tested without a browser or
 * a Mapbox canvas.
 */
import type { Bounds, MapNode } from "./types";

/**
 *  Whether a node is inside the bounds or the area that is currently on screen.
 *
 * Coordinates are [longitude, latitude], so index 0 is compared with west/east
 * and index 1 with south/north. Swapping these fails silently; see docs/GIS.md.
 * Bounds that cross the antimeridian are not handled, and nothing in this
 * project is near it.
 *
 * @param node - The place to check; [longitude, latitude].
 * @param bounds - The rectangle to check against (west/east longitudes, south/north latitudes).
 * @returns - true if the place is inside the rectangle or on its edge.
 */
export function isInBounds(node: MapNode, bounds: Bounds): boolean {
  const [lng, lat] = node.coordinates;
  return (
    lng >= bounds.west &&
    lng <= bounds.east &&
    lat >= bounds.south &&
    lat <= bounds.north
  );
}

/** The properties each GeoJSON feature carries, read back on hover and click. */
export interface NodeFeatureProperties {
  // GeoJSON properties are an open key/value bag, so this keeps the type
  // assignable to what Mapbox's setData expects.
  [key: string]: string | number;
  siteId: string;
  name: string;
  recordCount: number;
}

/** A GeoJSON point feature for one node. Structurally what Mapbox accepts. */
export interface NodeFeature {
  type: "Feature";
  id: string;
  geometry: { type: "Point"; coordinates: [number, number] };
  properties: NodeFeatureProperties;
}

export interface NodeFeatureCollection {
  type: "FeatureCollection";
  features: NodeFeature[];
}

/**
 * Nodes as a GeoJSON FeatureCollection, which is what a Mapbox source takes.
 *
 * Coordinates are passed through untouched: GeoJSON is longitude first, the
 * same as the contract, so there is nothing to convert.
 *
 * @param nodes - The places to draw.
 * @returns A GeoJSON FeatureCollection with one Point feature per place, carrying its siteId, name and recordCount as properties.
 */
export function nodesToGeoJSON(nodes: MapNode[]): NodeFeatureCollection {
  return {
    type: "FeatureCollection",
    features: nodes.map((node) => ({
      type: "Feature",
      id: node.siteId,
      geometry: {
        type: "Point",
        coordinates: [node.coordinates[0], node.coordinates[1]],
      },
      properties: {
        siteId: node.siteId,
        name: node.name,
        recordCount: node.recordCount,
      },
    })),
  };
}

/**
 * Delay a call until things go quiet for `waitMs`.
 *
 * Used so panning the map fires one request when it stops, rather than one per
 * frame. `cancel` drops a pending call, for when the map is torn down.
 */
export function debounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  waitMs: number,
) {
  let timer: ReturnType<typeof setTimeout> | undefined;

  const debounced = (...args: Args) => {
    if (timer !== undefined) clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      fn(...args);
    }, waitMs);
  };

  debounced.cancel = () => {
    if (timer !== undefined) clearTimeout(timer);
    timer = undefined;
  };

  return debounced;
}
