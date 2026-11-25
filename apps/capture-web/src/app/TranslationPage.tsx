import type { SubmitEvent } from "react";
import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router";

import type { TranslatableRecord, TranslationApi } from "../api/translationApi";
import { translationApi as defaultApi } from "../api/translationApi";
import { formatDate } from "./format";
import { languageLabel } from "./translationFormat";

type State =
  | { kind: "loading" }
  | { kind: "ready"; record: TranslatableRecord }
  | { kind: "not-found" }
  | { kind: "not-pending" }
  | { kind: "error" };

interface TranslationPageProps {
  api?: TranslationApi;
}

/** The list's filter, carried over from the link that opened this page. */
function returnPathFrom(state: unknown): string {
  const listSearch =
    typeof state === "object" && state !== null && "listSearch" in state
      ? state.listSearch
      : undefined;
  return typeof listSearch === "string" && listSearch
    ? `/translations?${listSearch}`
    : "/translations";
}

/**
 * Give a translation of one record. The record comes from the id in the URL,
 * so a direct link works.
 *
 * @param param0 - where the page gets its data
 * @returns The original and a form, or a loading, not-found, not-pending or error message.
 */
export default function TranslationPage({
  api = defaultApi,
}: TranslationPageProps) {
  const { recordId = "" } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const returnPath = returnPathFrom(location.state);

  const [state, setState] = useState<State>({ kind: "loading" });
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let cancelled = false;
    setState({ kind: "loading" });
    api
      .getTranslationTarget(recordId)
      .then((target) => {
        if (cancelled) return;
        if (target.kind === "ready") {
          setState({ kind: "ready", record: target.record });
        } else {
          setState({ kind: target.kind });
        }
      })
      .catch(() => {
        if (!cancelled) setState({ kind: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [api, recordId]);

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state.kind !== "ready" || submitting) return;

    const translation = text.trim();
    if (!translation) {
      setMessage("Please enter a translation first.");
      return;
    }

    setSubmitting(true);
    setMessage("");
    try {
      await api.submitTranslation(state.record, translation);
      void navigate(returnPath);
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "The translation could not be saved.",
      );
      setSubmitting(false);
    }
  }

  return (
    <main className="site-page">
      <p>
        <Link to={returnPath}>← Back to the list</Link>
      </p>

      {state.kind === "loading" && <p role="status">Loading the record…</p>}

      {state.kind === "not-found" && (
        <>
          <h1>Record not found</h1>
          <p>There is no record at this address.</p>
        </>
      )}

      {state.kind === "not-pending" && (
        <>
          <h1>Nothing to translate</h1>
          <p>This record is not waiting for a translation.</p>
          <p>
            <Link to={returnPath}>See the records that are</Link>
          </p>
        </>
      )}

      {state.kind === "error" && (
        <>
          <h1>Something went wrong</h1>
          <p role="alert">The record could not be loaded. Please try again.</p>
        </>
      )}

      {state.kind === "ready" && (
        <>
          <h1>Give a translation</h1>
          <article className="translation-item">
            <p className="translation-item__language">
              {languageLabel(state.record.language)}
            </p>
            {/* `lang` lets screen readers pronounce text that is not in English. */}
            <p className="translation-item__text" lang={state.record.language}>
              {state.record.text ?? state.record.note}
            </p>
            {formatDate(state.record.capturedAt) && (
              <p className="translation-item__meta">
                From {formatDate(state.record.capturedAt)}.
              </p>
            )}
          </article>

          <form className="translation-form" onSubmit={handleSubmit}>
            <label htmlFor="translation-text">Translation</label>
            <textarea
              id="translation-text"
              name="translation"
              rows={10}
              value={text}
              onChange={(event) => setText(event.currentTarget.value)}
            />
            <button type="submit" disabled={submitting}>
              {submitting ? "Submitting…" : "Submit translation"}
            </button>
          </form>

          {message && <p role="alert">{message}</p>}
        </>
      )}
    </main>
  );
}
