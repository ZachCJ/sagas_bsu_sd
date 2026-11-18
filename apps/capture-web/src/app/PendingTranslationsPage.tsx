import { useEffect, useState } from "react";
import type { ChangeEvent } from "react";
import { Link, useSearchParams } from "react-router";

import type { PendingTranslation, TranslationApi } from "../api/translationApi";
import { translationApi as defaultApi } from "../api/translationApi";
import { formatDate } from "./format";
import {
  FILTER_LANGUAGES,
  languageLabel,
  parseLanguageFilter,
  previewText,
  translationPath,
} from "./translationFormat";

type State =
  | { kind: "loading" }
  | { kind: "ready"; records: PendingTranslation[] }
  | { kind: "error" };

interface PendingTranslationsPageProps {
  api?: TranslationApi;
}

/**
 * Records waiting for a translation, newest first, filterable by language.
 * The filter lives in the URL (`?language=eu`), so Back and shared links keep it.
 *
 * @param param0 - where the page gets its data
 * @returns The list, or a loading, empty or error message.
 */
export default function PendingTranslationsPage({
  api = defaultApi,
}: PendingTranslationsPageProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const language = parseLanguageFilter(searchParams.get("language"));
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ kind: "loading" });
    api
      .getPendingTranslations(language)
      .then((records) => {
        if (!cancelled) setState({ kind: "ready", records });
      })
      .catch(() => {
        if (!cancelled) setState({ kind: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [api, language]);

  function handleLanguageChange(event: ChangeEvent<HTMLSelectElement>) {
    const next = new URLSearchParams(searchParams);
    if (event.currentTarget.value) {
      next.set("language", event.currentTarget.value);
    } else {
      next.delete("language");
    }
    setSearchParams(next);
  }

  return (
    <main className="site-page">
      <p>
        <Link to="/">← Back to the map</Link>
      </p>

      <h1>Records waiting for a translation</h1>

      <p>
        <label htmlFor="translation-language">Language </label>
        <select
          id="translation-language"
          value={language ?? ""}
          onChange={handleLanguageChange}
        >
          <option value="">All languages</option>
          {FILTER_LANGUAGES.map((code) => (
            <option key={code} value={code}>
              {languageLabel(code)}
            </option>
          ))}
        </select>
      </p>

      {state.kind === "loading" && <p role="status">Loading records…</p>}

      {state.kind === "error" && (
        <p role="alert">
          The records waiting for a translation could not be loaded. Please try
          again.
        </p>
      )}

      {state.kind === "ready" &&
        (state.records.length === 0 ? (
          <p>No records are waiting for a translation.</p>
        ) : (
          <ol className="translation-list">
            {state.records.map((record) => {
              const captured = formatDate(record.capturedAt);
              const shared = formatDate(record.createdAt);
              return (
                <li key={record.id} className="translation-item">
                  <article>
                    <p className="translation-item__language">
                      {languageLabel(record.language)}
                    </p>
                    {/* `lang` lets screen readers pronounce text that is not in English. */}
                    <p className="translation-item__text" lang={record.language}>
                      {previewText(record.text ?? record.note)}
                    </p>
                    <p className="translation-item__meta">
                      {captured && <>From {captured}. </>}
                      {shared && <>Shared {shared}.</>}
                    </p>
                    <p>
                      <Link
                        className="translation-item__action"
                        to={translationPath(record.id)}
                        state={{ listSearch: searchParams.toString() }}
                      >
                        Give a translation
                      </Link>
                    </p>
                  </article>
                </li>
              );
            })}
          </ol>
        ))}
    </main>
  );
}
