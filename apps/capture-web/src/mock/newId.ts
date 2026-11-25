/**
 * Returns a random UUID (version 4).
 *
 * `crypto.randomUUID()` only exists in secure contexts (HTTPS or localhost).
 * The dev server is reachable over plain http by IP address, where it is
 * undefined, so fall back to `crypto.getRandomValues()`, which works anywhere.
 */
export function newId(): string {
  //Easy way to get a UUId.
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  //Creates 16 random bytes which is the raw matieral for UUID
  const bytes = crypto.getRandomValues(new Uint8Array(16));

  // Set the version (4) and variant bits.
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;

  //Turns 16 random bytes into one string of 32 hex characters
  const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join(
    "",
  );

  //Splits 32 hex characters inot standard UUID layout 8-4-4-4-12, with dashes between the groups.
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
