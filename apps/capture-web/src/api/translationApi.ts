/**
 * Records waiting for a translation, and handing one over, from capture-api.
 *
 * Requests go to `/api/...`, which the Vite dev server proxies to Express on
 * port 3001 (see vite.config.ts).
 *
 *   GET  /records/pending-translation?language=   -> PendingTranslation[]
 *   GET  /records?id=<uuid>                        -> the record, or 404
 *   POST /records/submit                           -> the stored translation
 */
import type { RecordParent, SourceRecord } from "@sagas/contracts";

type Fetch = typeof fetch;

/** One record in the list of records waiting for a translation. */
export interface PendingTranslation {
  id: SourceRecord["id"];
  siteId: SourceRecord["siteId"];
  contributorId: SourceRecord["contributorId"];
  language: NonNullable<SourceRecord["language"]>;
  text?: SourceRecord["text"];
  note?: SourceRecord["note"];
  capturedAt?: SourceRecord["capturedAt"];
  createdAt: SourceRecord["createdAt"];
}

/** A record as the translation page reads it, by id. */
export interface TranslatableRecord {
  id: SourceRecord["id"];
  siteId: SourceRecord["siteId"];
  contributorId: SourceRecord["contributorId"];
  language?: SourceRecord["language"];
  text?: SourceRecord["text"];
  note?: SourceRecord["note"];
  capturedAt?: SourceRecord["capturedAt"];
  createdAt: SourceRecord["createdAt"];
  parent?: RecordParent;
}

/** What the translation page found at the id in its URL. */
export type TranslationTarget =
  | { kind: "ready"; record: TranslatableRecord }
  | { kind: "not-found" }
  | { kind: "not-pending"; record: TranslatableRecord };

export interface TranslationApi {
  getPendingTranslations(language?: string): Promise<PendingTranslation[]>;
  getRecord(id: string): Promise<TranslatableRecord | null>;
  getTranslationTarget(id: string): Promise<TranslationTarget>;
  submitTranslation(source: TranslatableRecord, text: string): Promise<void>;
}

/**
 * Placeholder contributor, choices and terms until there are real profiles and
 * terms. The same values the rest of the app uses for now.
 */
const PLACEHOLDER_CONTRIBUTOR = "guest-abc";
const PLACEHOLDER_TERMS_VERSION = "provisional-0.1";
const PLACEHOLDER_CHOICES = {
  rightToShare: true,
  studentAccess: false,
  public: "later",
  location: "remove",
  mentionsPeople: "not_sure",
} as const;

/**
 * The body that hands over a translation of `source`. A translation is a record
 * with a parent: always written in English, by a person.
 */
export function buildTranslationPayload(
  source: Pick<TranslatableRecord, "id" | "siteId">,
  text: string,
  now: Date = new Date(),
) {
  return {
    siteId: source.siteId,
    contributorId: PLACEHOLDER_CONTRIBUTOR,
    text: text.trim(),
    language: "en",
    submission: "submitted",
    media: [],
    parent: { role: "translation", recordId: source.id, method: "human" },
    choices: { ...PLACEHOLDER_CHOICES },
    termsVersion: PLACEHOLDER_TERMS_VERSION,
    createdAt: now.toISOString(),
  } as const;
}

/**
 * Builds the client for the translation pages.
 *
 * @param param0 - `baseUrl`: where requests go (default "/api"). `fetchImpl`:
 *   the function used to make requests (default: the browser's fetch; tests pass a fake).
 */
export function createTranslationClient({
  baseUrl = "/api",
  fetchImpl = (...args: Parameters<Fetch>) => fetch(...args),
}: { baseUrl?: string; fetchImpl?: Fetch } = {}): TranslationApi {
  async function getJson<T>(path: string): Promise<T | null> {
    const response = await fetchImpl(`${baseUrl}${path}`, {
      headers: { accept: "application/json" },
    });
    if (response.status === 404) return null;
    if (!response.ok) {
      throw new Error(
        `Request to ${path} failed with status ${response.status}.`,
      );
    }
    return (await response.json()) as T;
  }

  async function getPendingTranslations(language?: string) {
    const query = language
      ? `?${new URLSearchParams({ language }).toString()}`
      : "";
    return (
      (await getJson<PendingTranslation[]>(
        `/records/pending-translation${query}`,
      )) ?? []
    );
  }

  async function getRecord(id: string) {
    return getJson<TranslatableRecord>(`/records?id=${encodeURIComponent(id)}`);
  }

  return {
    getPendingTranslations,
    getRecord,

    async getTranslationTarget(id) {
      const record = await getRecord(id);
      if (!record) return { kind: "not-found" };
      if (record.parent || !record.language || record.language === "en") {
        return { kind: "not-pending", record };
      }
      const pending = await getPendingTranslations(record.language);
      return pending.some((p) => p.id === record.id)
        ? { kind: "ready", record }
        : { kind: "not-pending", record };
    },

    async submitTranslation(source, text) {
      const response = await fetchImpl(`${baseUrl}/records/submit`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
        },
        body: JSON.stringify(buildTranslationPayload(source, text)),
      });
      if (!response.ok) {
        const detail = await response.text();
        throw new Error(
          `The translation could not be saved (${response.status})${detail ? `: ${detail}` : "."}`,
        );
      }
    },
  };
}

/** The one client the translation pages use. */
export const translationApi = createTranslationClient();
