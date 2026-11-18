import { useEffect, useState } from "react";
import { Link, useParams } from "react-router";

import type { MapApi, SiteRecords } from "../api/types";
import { mapApi as defaultApi } from "../api/mapApi";
import { formatDate, recordCountLabel } from "./format";

type State =
  | { kind: "loading" }
  | { kind: "ready"; site: SiteRecords }
  | { kind: "not-found" }
  | { kind: "error" };

interface SiteRecordsPageProps {
  api?: MapApi;
}

/**
 * Everything recorded at one place. This is where clicking a map node goes.
 *
 * @param param0 - where page gets its data
 * @returns The page for the place in the URL depding on its state: a loading, not-found or error message, or that place's records.
 */
export default function SiteRecordsPage({
  api = defaultApi,
}: SiteRecordsPageProps) {
  const { siteId = "" } = useParams();
  const [state, setState] = useState<State>({ kind: "loading" });

  useEffect(() => {
    let cancelled = false;
    setState({ kind: "loading" });
    api
      .getSiteRecords(siteId)
      .then((site) => {
        if (!cancelled)
          setState(site ? { kind: "ready", site } : { kind: "not-found" });
      })
      .catch(() => {
        if (!cancelled) setState({ kind: "error" });
      });
    return () => {
      cancelled = true;
    };
  }, [api, siteId]);

  return (
    <main className="site-page">
      <p>
        <Link to="/">← Back to the map</Link>
      </p>

      {state.kind === "loading" && <p role="status">Loading stories…</p>}

      {state.kind === "not-found" && (
        <>
          <h1>Place not found</h1>
          <p>There is no place with this address on the map.</p>
        </>
      )}

      {state.kind === "error" && (
        <>
          <h1>Something went wrong</h1>
          <p role="alert">
            The stories for this place could not be loaded. Please try again.
          </p>
        </>
      )}

      {state.kind === "ready" && (
        <>
          <h1>{state.site.name}</h1>
          <p className="site-page__meta">
            {state.site.address ? `${state.site.address} · ` : ""}
            {recordCountLabel(state.site.records.length)}
          </p>

          {state.site.records.length === 0 ? (
            <p>No stories have been shared about this place yet.</p>
          ) : (
            <ol className="site-records">
              {state.site.records.map((record) => {
                const captured = formatDate(record.capturedAt);
                const shared = formatDate(record.createdAt);
                return (
                  <li key={record.id} className="site-record">
                    <article>
                      {record.text && (
                        // `lang` lets screen readers pronounce text that is not in English.
                        <p className="site-record__text" lang={record.language}>
                          {record.text}
                        </p>
                      )}
                      {record.note && (
                        <p className="site-record__note">{record.note}</p>
                      )}

                      {record.images.length > 0 && (
                        <div className="site-record__images">
                          {record.images.map((image) => (
                            <img
                              key={image.id}
                              src={image.url}
                              alt={image.alt}
                              width={240}
                              height={180}
                            />
                          ))}
                        </div>
                      )}

                      <p className="site-record__dates">
                        {captured && <>From {captured}. </>}
                        {shared && <>Shared {shared}.</>}
                      </p>
                    </article>
                  </li>
                );
              })}
            </ol>
          )}
        </>
      )}
    </main>
  );
}
