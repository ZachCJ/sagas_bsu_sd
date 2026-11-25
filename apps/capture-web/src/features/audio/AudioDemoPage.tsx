/**
 * Part of the user story "Audio Pause and Playback #74".
 *
 * The /audio-demo/:sampleId page: one recording, one player. One route serves
 * every recording. Today `:sampleId` is "1".."7". Later it will be a record's
 * UUID from capture-api, and this page will not need to change.
 *
 * It looks the recording up with `getAudioSource(id)` and has three states:
 * loading, not found, and the player.
 *
 * Presigned links expire after a few minutes. When the player reports a load
 * error, this page asks `getAudioSource(id)` again for a fresh URL, once, so a
 * file that is actually broken does not retry forever.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router";

import type { AudioSource } from "./getAudioSources";
import AudioPlayer from "./AudioPlayer";
import { getAudioSource } from "./getAudioSources";

import "./audio.css";

/**
 * State of audio source. (More can be added later like when capture-api is finished.)
 *
 * loading - Waiting for getAudioSource(id) to answer
 *
 * not-found - No recording has that id (in this case /audio/demo/#)
 *
 * failed  - Lookup threw and error
 *
 * ready - Found it so show the player
 *
 */
type LoadState =
  | { status: "loading" }
  | { status: "not-found" }
  | { status: "failed" }
  | { status: "ready"; source: AudioSource };

/**
 * Top of the page componet for /audio-demo/:sampleID. reads id from the URL
 * Looks up the recording and traks weather to retry when the file fails.
 *
 * @returns
 */
export default function AudioDemoPage() {
  //Read ID from URL. useParams() from react router. returns the :something/SampleID parts of the route.
  const { sampleId = "" } = useParams();

  //Pages state from LoadState
  const [state, setState] = useState<LoadState>({ status: "loading" });

  // This re-runs the lookup, which is how a fresh URL is requested.
  const [attempt, setAttempt] = useState(0);
  // Retry once per recording, so a broken file does not loop.
  const retried = useRef(false);

  // A different recording starts over: one retry allowed again.
  useEffect(() => {
    retried.current = false;
    setAttempt(0);
  }, [sampleId]);

  //useRef holds value that survives re-renders and chanding it does not cause rerencer.
  //Used as a way to check if this recording has been retried. prevents retrying forevever.
  useEffect(() => {
    let active = true;
    setState({ status: "loading" });
    getAudioSource(sampleId)
      .then((source) => {
        if (!active) return;
        setState(
          source ? { status: "ready", source } : { status: "not-found" },
        );
      })
      .catch(() => {
        if (active) setState({ status: "failed" });
      });
    return () => {
      active = false;
    };
  }, [sampleId, attempt]);

  /**
   * Part of the user story "Audio Pause and Playback #74".
   *
   * Called by the player when its file fails. With local samples a retry gets
   * the same URL. With capture-api it gets a newly signed one.
   */
  const handlePlayerError = useCallback(() => {
    if (retried.current) return;
    retried.current = true;
    setAttempt((n) => n + 1);
  }, []);

  return (
    <main>
      <p>
        <Link to="/audio-demo">← All recordings</Link>
      </p>

      {state.status === "loading" && <p>Loading recording…</p>}

      {state.status === "not-found" && (
        <>
          <h1>Recording not found</h1>
          <p>There is no recording with the id “{sampleId}”.</p>
        </>
      )}

      {state.status === "failed" && (
        <p role="alert">The recording could not be loaded. Try again later.</p>
      )}

      {state.status === "ready" && (
        <>
          <h1>{state.source.title}</h1>
          {/* key forces a fresh player (and fresh <audio>) when the URL changes. */}
          <AudioPlayer
            key={`${state.source.url}#${attempt}`}
            src={state.source.url}
            title={state.source.title}
            durationSeconds={state.source.durationSeconds}
            onError={handlePlayerError}
          />
        </>
      )}
    </main>
  );
}
