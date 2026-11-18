/** Display helpers for the story map. Pure, so they are easy to test. */

/**
 * Shows how many contributions a place has with correct grammar. 1 means record, 3 means records
 *  Also helps render the place list, the hover popup and the site page.
 *
 * @param count - number representing
 * @returns string with count and record vs records
 */
export function recordCountLabel(count: number): string {
  return `${count} ${count === 1 ? "record" : "records"}`;
}

/**
 * A date for people to read.
 *
 * Full timestamps are formatted. Partial dates like "1962" or "1962-06" are
 * how somebody remembers something, so they are shown as given rather than
 * being invented into a precise day.
 */
export function formatDate(
  value: string | undefined,
  locale?: string,
): string | undefined {
  if (!value) return undefined;
  if (!/^\d{4}-\d{2}-\d{2}/.test(value)) return value;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(date);
}

/**
 * The path/web address of a place's records page. Id's are encoded, never trusted as path segments.
 *
 * @param siteId - Address/location of record
 * @returns string containing URL built from places id
 */
export function sitePath(siteId: string): string {
  return `/sites/${encodeURIComponent(siteId)}`;
}
