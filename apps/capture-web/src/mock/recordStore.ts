import { getGuestId } from "./guest";
import { newId } from "./newId";

/**
 * Mock record storage, kept in localStorage until capture-api is ready.
 * This module is the single swap point: when the real API exists, replace the
 * bodies of these functions and leave the pages alone.
 *
 * The address is a plain string on purpose. The contract's `capturedLocation`
 * holds coordinates and has no free-text address, and this stub does not
 * geocode.
 */
export interface MockRecord {
  id: string;
  name: string;
  address?: string;
  /** Guest id of the browser that created the record. */
  contributorId: string;
  createdAt: string;
}

//All records stored together as one JSON string under this key
const RECORDS_KEY = "sagas.mockRecords";

/**
 * Reads all records. Missing or corrupt data gives an empty list.
 *
 * @returns Every saved record, or an empty list if none are saved or the saved data cannot be read.
 */
function readRecords(): MockRecord[] {
  try {
    const parsed: unknown = JSON.parse(
      //Return saved text for "sagas.mockrecords" or null if nothing wa ssaved
      localStorage.getItem(RECORDS_KEY) ?? "[]",
    );
    return Array.isArray(parsed) ? (parsed as MockRecord[]) : [];
  } catch {
    return [];
  }
}

/**
 * Saves the full list of records, replacing whatever was stored before.
 *
 * @param records - Every record to keep. Anything left out is gone.
 */
function writeRecords(records: MockRecord[]): void {
  //Saves stringafied record under "sagas.mockRecords"
  localStorage.setItem(RECORDS_KEY, JSON.stringify(records));
}

/**
 * Creates a record owned by the current guest and saves it. The address is
 * trimmed, and a blank address is stored as no address. The name is trimmed
 * but not checked here: the create page requires one.
 *
 * @param input - The record's name and its optional address.
 * @returns The saved record, including its new id.
 */
export function createRecord(input: {
  name: string;
  address?: string;
}): MockRecord {
  const address = input.address?.trim();
  const record: MockRecord = {
    id: newId(),
    name: input.name.trim(),
    ...(address ? { address } : {}),
    contributorId: getGuestId(),
    createdAt: new Date().toISOString(),
  };
  writeRecords([...readRecords(), record]);
  return record;
}

/**
 * Looks up one record by its id.
 *
 * @param id - The record's id, usually taken from the `/records/:id` URL.
 * @returns The record, or `undefined` if no saved record has that id.
 */
export function getRecord(id: string): MockRecord | undefined {
  return readRecords().find((record) => record.id === id);
}

/**
 * True when the given guest created the record.
 *
 * @param record - The record to check.
 * @param guestId - The guest id to compare, usually this browser's from `getGuestId()`.
 * @returns true` if `guestId` matches the record's `contributorId`.
 */
export function isOwner(record: MockRecord, guestId: string): boolean {
  return record.contributorId === guestId;
}

/**
 * Sets a record's address. Refused unless the guest owns the record.
 * The address is trimmed, and a blank address removes the location.
 * Ownership is a stub check; the real one belongs in capture-api.
 *
 *
 * @param id - The record to change.
 * @param address - The new address. Blank removes the location.
 * @param guestId - Who is asking, usually this browser's from `getGuestId()`.
 * @returns `{ ok: true, record }` with the updated record, or `{ ok: false, reason }` where reason is `"not_found"` or `"not_owner"`.
 */
export function updateRecordLocation(
  id: string,
  address: string,
  guestId: string,
):
  //Return type
  | { ok: true; record: MockRecord }
  | { ok: false; reason: "not_found" | "not_owner" } {
  const records = readRecords();
  //Returns records position in list or -1 is no match
  const index = records.findIndex((record) => record.id === id);
  const current = records[index];
  if (!current) return { ok: false, reason: "not_found" };
  if (!isOwner(current, guestId)) return { ok: false, reason: "not_owner" };

  const trimmed = address.trim();
  const updated: MockRecord = { ...current };
  if (trimmed) {
    updated.address = trimmed;
  } else {
    delete updated.address;
  }
  records[index] = updated;
  writeRecords(records);
  return { ok: true, record: updated };
}

/**
 * Finds records whose address contains the query, ignoring case and
 * surrounding whitespace. An empty query returns nothing, and records with no
 * address never match.
 *
 * @param query
 * @returns
 */
export function searchRecords(query: string): MockRecord[] {
  const needle = query.trim().toLowerCase();
  if (!needle) return [];
  return readRecords().filter((record) =>
    record.address?.toLowerCase().includes(needle),
  );
}
