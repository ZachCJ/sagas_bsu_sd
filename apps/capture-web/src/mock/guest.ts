/**
 * Guest id: a random id generated the first time somebody visits and kept in
 * browser storage. There are no logins. The id only grants permission to edit
 * the location of records this browser created.
 *
 * A browser cannot write a text file, so localStorage is the local store.
 * Clearing browser data creates a new guest, as described in
 * docs/START-CONTENT-LAYER.md.
 */

//newID generates a random UUID. Also works over plain http:// by IP address.
import { newId } from "./newId";

//name of the ID saved under local storage. works like a small dictornary of text keys and values for site.
const GUEST_ID_KEY = "sagas.guestId";

/**
 * Returns this browser's guest id, creating and saving one on first use.
 */
export function getGuestId(): string {
  const existing = localStorage.getItem(GUEST_ID_KEY);
  if (existing) return existing;

  const id = newId();
  localStorage.setItem(GUEST_ID_KEY, id);
  return id;
}
