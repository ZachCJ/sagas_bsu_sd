/**
 * The shapes the story map works with.
 *
 * These are what the front end expects to receive, whether the data comes from
 * the dummy files in `src/mocks/` or, later, from capture-api. Field types are
 * borrowed from `@sagas/contracts` wherever one exists, so a change to the
 * contract shows up here as a type error rather than a silent mismatch.
 *
 * `import type` only: nothing from the contracts package ends up in the bundle.
 */
import type { MediaRef, Site, SourceRecord } from "@sagas/contracts";

/** [longitude, latitude]. GeoJSON order, same as the contract. See docs/GIS.md. */
export type Coordinates = Site["coordinates"];

/** The part of the map currently on screen, in degrees. */
export interface Bounds {
  west: number;
  south: number;
  east: number;
  north: number;
}

/** One node on the map. A node is a place (a site), not a single photo. */
export interface MapNode {
  siteId: Site["id"];
  name: Site["name"];
  coordinates: Coordinates;
  /** How many records are attached to this place. */
  recordCount: number;
}

/**
 * An image ready to show.
 *
 * `url` is a link the browser can load right now. From the real API this will
 * be a short-lived presigned link, so it is never stored or cached for long.
 */
export interface DisplayImage {
  id: MediaRef["id"];
  url: string;
  /** Describes the image for people who cannot see it. Always required. */
  alt: string;
}

/** What the hover popup shows: the place, and at most two of its images. */
export interface NodePreview {
  siteId: Site["id"];
  name: Site["name"];
  images: DisplayImage[];
}

/** One record as the site page shows it. */
export interface SiteRecordSummary {
  id: SourceRecord["id"];
  text?: SourceRecord["text"];
  note?: SourceRecord["note"];
  language?: SourceRecord["language"];
  capturedAt?: SourceRecord["capturedAt"];
  createdAt: SourceRecord["createdAt"];
  images: DisplayImage[];
}

/** Everything the site page needs. */
export interface SiteRecords {
  siteId: Site["id"];
  name: Site["name"];
  address?: Site["address"];
  records: SiteRecordSummary[];
}

/**
 * The seam between the UI and the data.
 *
 * Components only ever talk to this interface. The mock and the real client
 * both implement it, so switching between them changes nothing in the UI.
 */
export interface MapApi {
  /** Nodes inside the given bounds. */
  getNodes(bounds: Bounds): Promise<MapNode[]>;
  /** The hover preview for one node. */
  getPreview(siteId: string): Promise<NodePreview>;
  /** The records for one place, or `null` when the place does not exist. */
  getSiteRecords(siteId: string): Promise<SiteRecords | null>;
}

/** Most images a preview shows. The user story asks for one or two. */
export const MAX_PREVIEW_IMAGES = 2;
