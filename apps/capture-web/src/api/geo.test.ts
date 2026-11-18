import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { MapNode } from "./types";
import { debounce, isInBounds, nodesToGeoJSON } from "./geo";

const boise: MapNode = {
  siteId: "anduiza-hotel-fronton",
  name: "Anduiza Hotel and Fronton",
  coordinates: [-116.20331, 43.61533],
  recordCount: 3,
};

const aroundBoise = { west: -116.3, south: 43.5, east: -116.1, north: 43.7 };

describe("isInBounds", () => {
  it("includes a node inside the bounds", () => {
    expect(isInBounds(boise, aroundBoise)).toBe(true);
  });

  it("excludes a node outside the bounds", () => {
    expect(isInBounds(boise, { west: -100, south: 40, east: -99, north: 41 })).toBe(false);
  });

  it("reads coordinates as [longitude, latitude], not the other way round", () => {
    const swapped: MapNode = { ...boise, coordinates: [43.61533, -116.20331] };
    expect(isInBounds(swapped, aroundBoise)).toBe(false);
  });

  it("includes nodes exactly on the edge", () => {
    expect(isInBounds(boise, { west: -116.20331, south: 43.61533, east: -116.2, north: 43.62 })).toBe(true);
  });
});

describe("nodesToGeoJSON", () => {
  it("keeps [longitude, latitude] order and carries the node's properties", () => {
    const collection = nodesToGeoJSON([boise]);
    expect(collection.type).toBe("FeatureCollection");
    expect(collection.features).toHaveLength(1);

    const [feature] = collection.features;
    expect(feature?.geometry).toEqual({ type: "Point", coordinates: [-116.20331, 43.61533] });
    expect(feature?.properties).toEqual({
      siteId: "anduiza-hotel-fronton",
      name: "Anduiza Hotel and Fronton",
      recordCount: 3,
    });
    expect(feature?.id).toBe("anduiza-hotel-fronton");
  });

  it("returns an empty collection for no nodes", () => {
    expect(nodesToGeoJSON([]).features).toEqual([]);
  });
});

describe("debounce", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("calls once, with the last arguments, after things go quiet", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 250);

    debounced(1);
    debounced(2);
    debounced(3);
    vi.advanceTimersByTime(249);
    expect(fn).not.toHaveBeenCalled();

    vi.advanceTimersByTime(1);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(fn).toHaveBeenCalledWith(3);
  });

  it("drops a pending call when cancelled", () => {
    const fn = vi.fn();
    const debounced = debounce(fn, 250);

    debounced();
    debounced.cancel();
    vi.advanceTimersByTime(1000);
    expect(fn).not.toHaveBeenCalled();
  });
});
