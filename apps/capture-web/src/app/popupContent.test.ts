import { describe, expect, it } from "vitest";

import type { NodePreview } from "../api/types";
import { popupModel } from "./popupContent";

const image = (n: number) => ({ id: `m${n}`, url: `/placeholders/${n}.svg`, alt: `Photo ${n}` });

describe("popupModel", () => {
  it("shows at most two images", () => {
    const preview: NodePreview = { siteId: "a", name: "A", images: [image(1), image(2), image(3)] };
    expect(popupModel(preview).images.map((i) => i.id)).toEqual(["m1", "m2"]);
  });

  it("shows one image when there is one", () => {
    const preview: NodePreview = { siteId: "a", name: "A", images: [image(1)] };
    const model = popupModel(preview);
    expect(model.images).toHaveLength(1);
    expect(model.emptyMessage).toBeUndefined();
  });

  it("says so when a place has no photos", () => {
    const model = popupModel({ siteId: "a", name: "A", images: [] });
    expect(model.images).toEqual([]);
    expect(model.emptyMessage).toBe("No photos here yet.");
  });

  it("uses the place name as the title and the record count as the subtitle", () => {
    const model = popupModel({ siteId: "a", name: "Gaskell's Lunch Counter", images: [] }, 2);
    expect(model.title).toBe("Gaskell's Lunch Counter");
    expect(model.subtitle).toBe("2 records");
    expect(model.hint).toMatch(/click/i);
  });
});
