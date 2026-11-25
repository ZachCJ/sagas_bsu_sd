/**
 * Part of the user story "Audio Pause and Playback #74".
 *
 * The /audio-demo page: a list of recordings, each linking to its own page at
 * /audio-demo/:sampleId. It reads from `getAudioSources()`, so when that
 * function starts calling capture-api, this page lists real records without
 * any change here.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router";

import type { AudioSource } from "./getAudioSources";
import { getAudioSources } from "./getAudioSources";

import "./audio.css";

/**
 * Function to display a list of pages for the audio for testing purposes. Can be
 * Removed when other elements of the API are fleshed out.
 *
 * @returns test page.
 */
export default function AudioListPage() {
  // null means still loading. An empty list means loaded with nothing in it.
  const [sources, setSources] = useState<AudioSource[] | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    // Ignore a late answer if the page was left before it arrived.
    let active = true;
    getAudioSources()
      .then((list) => {
        if (active) setSources(list);
      })
      .catch(() => {
        if (active) setFailed(true);
      });
    return () => {
      active = false;
    };
  }, []);

  return (
    <main>
      <h1>Audio demo</h1>
      <p>Pick a recording to play, pause and scrub.</p>

      {failed && <p role="alert">The recordings could not be loaded.</p>}
      {!failed && sources === null && <p>Loading recordings…</p>}
      {sources?.length === 0 && <p>There are no recordings yet.</p>}

      {sources && sources.length > 0 && (
        <ul className="audio-list">
          {sources.map((source) => (
            <li key={source.id}>
              {/* encodeURIComponent so future UUIDs or odd ids stay valid in the path. */}
              <Link to={`/audio-demo/${encodeURIComponent(source.id)}`}>
                {source.title}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
