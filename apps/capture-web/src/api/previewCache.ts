/**
 * Remembers hover previews so moving the mouse back over a node does not
 * fetch it again.
 *
 * It caches the promise rather than the result, so two hovers in quick
 * succession share one request. A failed request is forgotten, so the next
 * hover tries again instead of showing the same error forever.
 *
 * Real image links will be presigned and expire after a few minutes, so the
 * cache also forgets entries after `maxAgeMs`.
 */
import type { NodePreview } from "./types";

export interface PreviewCache {
  get(siteId: string): Promise<NodePreview>;
  clear(): void;
}

/**
 * Builds a cache
 *
 * @param fetchPreview - a function actuylly loads a preview, e.g. `api.getPreview`.
 * @param param1 - Options. `maxAgeMs`: how long an entry lasts (default 4 minutes,
 *   since real image links expire). `now`: the clock, replaceable in tests.
 * @returns A cache with `get(siteId)` and `clear()`.
 */
export function createPreviewCache(
  fetchPreview: (siteId: string) => Promise<NodePreview>,
  { maxAgeMs = 4 * 60 * 1000, now = () => Date.now() } = {},
): PreviewCache {
  const entries = new Map<
    string,
    { promise: Promise<NodePreview>; storedAt: number }
  >();

  return {
    get(siteId) {
      const existing = entries.get(siteId);
      if (existing && now() - existing.storedAt < maxAgeMs)
        return existing.promise;

      const promise = fetchPreview(siteId);
      entries.set(siteId, { promise, storedAt: now() });

      // Forget failures so the next attempt can succeed.
      promise.catch(() => {
        if (entries.get(siteId)?.promise === promise) entries.delete(siteId);
      });

      return promise;
    },
    clear() {
      entries.clear();
    },
  };
}
