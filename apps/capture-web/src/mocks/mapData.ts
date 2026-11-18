/**
 * Record Map Locations #76
 *
 * Dummy data for the story map. TEMPORARY until capture-api's endpoints exist.
 *
 * This stands in for capture-api until its map and site endpoints exist. When
 * they do, set VITE_USE_MOCK_DATA=false and this file stops being used. Delete
 * it once nothing needs it.
 *
 * The places, names and coordinates are copied from the fixture sites in
 * `packages/fixtures/fixtures/` so the map lands where the real data will.
 * They are copied rather than imported because the fixtures package is not a
 * capture-web dependency. Coordinates are [longitude, latitude].
 *
 * The records and images are invented. The images are placeholder drawings in
 * `public/placeholders/`.
 *
 * The sites are deliberately unalike, so every state of the UI gets exercised:
 * several images (the preview shows only two), exactly one image, and no
 * images at all.
 */
import type {
  Coordinates,
  DisplayImage,
  SiteRecordSummary,
} from "../api/types";

/**
 * Lets other files use the interface. used by MocClient.ts to read dummy data
 */
export interface MockSite {
  siteId: string;
  name: string;
  address: string;
  coordinates: Coordinates;
  records: SiteRecordSummary[];
}

/** A placeholder image. Ids are unique per use so lists render cleanly. */
function placeholder(id: string, file: string, alt: string): DisplayImage {
  return { id, url: `/placeholders/${file}`, alt };
}

export const mockSites: MockSite[] = [
  {
    siteId: "anduiza-hotel-fronton",
    name: "Anduiza Hotel and Fronton",
    address: "620 W Grove St",
    coordinates: [-116.20331, 43.61533],
    records: [
      {
        id: "mock-rec-001",
        text: "My great-grandmother cooked in the boarding house kitchen.",
        language: "en",
        createdAt: "2026-09-07T12:00:00Z",
        images: [
          placeholder(
            "mock-img-001",
            "hotel.svg",
            "Placeholder drawing of a brick hotel",
          ),
        ],
      },
      {
        id: "mock-rec-002",
        note: "The fronton wall, taken from the street.",
        capturedAt: "1962-06-01",
        createdAt: "2026-09-08T09:30:00Z",
        images: [
          placeholder(
            "mock-img-002",
            "handball-court.svg",
            "Placeholder drawing of a handball court wall",
          ),
        ],
      },
      {
        id: "mock-rec-003",
        note: "A page from the boarding house register.",
        createdAt: "2026-09-10T15:45:00Z",
        images: [
          placeholder(
            "mock-img-003",
            "register-page.svg",
            "Placeholder drawing of a register page",
          ),
        ],
      },
    ],
  },
  {
    siteId: "gaskells-lunch-counter",
    name: "Gaskell's Lunch Counter",
    address: "9th and Bannock",
    coordinates: [-116.20087, 43.61759],
    records: [
      {
        id: "mock-rec-004",
        text: "We got pie here every Friday after school.",
        language: "en",
        createdAt: "2026-09-12T18:00:00Z",
        images: [
          placeholder(
            "mock-img-004",
            "diner.svg",
            "Placeholder drawing of a lunch counter",
          ),
          placeholder(
            "mock-img-005",
            "storefront.svg",
            "Placeholder drawing of the diner from outside",
          ),
        ],
      },
    ],
  },
  {
    siteId: "corner-shop",
    name: "The corner shop",
    address: "N 4th St and W Main St",
    coordinates: [-116.2016, 43.6149],
    records: [
      {
        id: "mock-rec-005",
        note: "The shop front, around 1950.",
        createdAt: "2026-09-14T10:00:00Z",
        images: [
          placeholder(
            "mock-img-006",
            "storefront.svg",
            "Placeholder drawing of a storefront",
          ),
        ],
      },
    ],
  },
  {
    siteId: "hays-1114",
    name: "1114 Hays Street",
    address: "1114 Hays St",
    coordinates: [-116.20644, 43.62211],
    records: [
      {
        // A written record with no files, so the preview has no images.
        id: "mock-rec-006",
        text: "Vasile fixed shoes out of the front room for thirty years.",
        language: "en",
        createdAt: "2026-09-15T11:20:00Z",
        images: [],
      },
    ],
  },
  {
    siteId: "hays-1116",
    name: "1116 Hays Street",
    address: "1116 Hays St",
    coordinates: [-116.2063, 43.62216],
    records: [
      {
        id: "mock-rec-007",
        note: "The bakery with the blue door.",
        createdAt: "2026-09-16T08:10:00Z",
        images: [
          placeholder(
            "mock-img-007",
            "house.svg",
            "Placeholder drawing of a house with a blue door",
          ),
        ],
      },
      {
        // Not in English. The record is complete as it is.
        id: "mock-rec-008",
        text: "Mi abuela compraba el pan aquí todas las mañanas.",
        language: "es",
        createdAt: "2026-09-17T08:10:00Z",
        images: [],
      },
    ],
  },
  {
    siteId: "hoefer-bench",
    name: "The Hoefer bench",
    address: "Greenbelt path, near the Americana bridge",
    coordinates: [-116.21402, 43.60338],
    records: [
      {
        id: "mock-rec-009",
        note: "The green bench by the cottonwoods.",
        createdAt: "2026-09-18T17:00:00Z",
        images: [
          placeholder(
            "mock-img-008",
            "bench.svg",
            "Placeholder drawing of a green bench under trees",
          ),
        ],
      },
    ],
  },
];
