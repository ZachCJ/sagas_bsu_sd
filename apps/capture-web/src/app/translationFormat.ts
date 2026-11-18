/** Display and path helpers for the translation pages. Pure, so they are easy to test. */
import { languageCode } from "@sagas/contracts";
import type { LanguageCode } from "@sagas/contracts";

/** What each language code is called, for people reading the page. */
export const LANGUAGE_NAMES: Record<LanguageCode, string> = {
  en: "English",
  eu: "Basque",
  es: "Spanish",
  fr: "French",
};

/**
 * A language for people to read, with its code: "Basque (eu)".
 *
 * @param code - An ISO 639-1 code. One the app doesn't know is shown as given.
 */
export function languageLabel(code: string | undefined): string {
  if (!code) return "Unknown language";
  const name = (LANGUAGE_NAMES as Record<string, string | undefined>)[code];
  return name ? `${name} (${code})` : code;
}

/** The languages the list can be filtered by. English records never wait for a translation. */
export const FILTER_LANGUAGES: LanguageCode[] = languageCode.options.filter(
  (code) => code !== "en",
);

/**
 * The language filter from the URL, if it is one the list can filter by.
 *
 * @returns A non-English language code, or undefined for "all languages".
 */
export function parseLanguageFilter(
  value: string | null,
): LanguageCode | undefined {
  if (!value) return undefined;
  return FILTER_LANGUAGES.find((code) => code === value);
}

/** The path of the pending list, with its language filter when there is one. */
export function pendingTranslationsPath(language?: string): string {
  return language
    ? `/translations?${new URLSearchParams({ language }).toString()}`
    : "/translations";
}

/** The path of the page for translating one record. Ids are encoded, never trusted as path segments. */
export function translationPath(recordId: string): string {
  return `/translations/${encodeURIComponent(recordId)}`;
}

/** The start of a record's text, short enough for a list. */
export function previewText(text: string | undefined, max = 160): string {
  const trimmed = (text ?? "").trim();
  if (trimmed.length <= max) return trimmed;
  return `${trimmed.slice(0, max).trimEnd()}…`;
}
