/**
 * Part of the user story "Audio Pause and Playback #74".
 *
 * A small audio player: one Play/Pause button, a seek slider and a time
 * readout, wrapped around the browser's own <audio> element. No library.
 *
 * It only needs a URL (`src`). It does not know or care whether that URL is a
 * sample in `public/`, a blob from the in-browser recorder (C1), or a
 * presigned link from capture-api. That is what keeps it reusable.
 *
 * Design notes:
 *   - The button label follows the <audio> element's own `play`, `pause` and
 *     `ended` events rather than a hand-tracked flag. If the browser pauses
 *     playback by itself (the file ends, a phone call comes in), the label is
 *     still right.
 *   - `play()` returns a promise that rejects when playback is not allowed or
 *     the file cannot be played. That rejection is caught and shown.
 *   - A load failure is read from the element's `error` event. In dev a
 *     missing file comes back as index.html with a 200, so the HTTP status
 *     cannot be trusted. The decode failure can.
 *   - `onError` lets the page ask for a fresh URL. Presigned links expire, so
 *     the page re-asks capture-api rather than retrying the same dead link.
 */
import type { ChangeEvent } from "react";
import { useEffect, useRef, useState } from "react";

import "./audio.css";

/**
 * Part of the user story "Audio Pause and Playback #74".
 * What the player needs. Only `src` is required.
 */
export interface AudioPlayerProps {
  /** Any playable URL. Never stored beyond this render. */
  src: string;
  /** Shown above the controls and used in the aria-labels. */
  title?: string;
  /**
   * Length from the server, if it already knows (`mediaRef.durationSeconds`).
   * Only a hint for the readout before the file loads. The file's own length
   * wins once metadata arrives, and the slider stays disabled until then.
   */
  durationSeconds?: number;
  /** Called when the file fails to load or play. Use it to fetch a fresh URL. */
  onError?: () => void;
}

/**
 * Part of the user story "Audio Pause and Playback #74".
 *  Gets number from `<audio>` element/ tag that gives raw seconds like 75.42
 * Turns that number of seconds into the clock style text player shows next to the slider.
 * Seconds as m:ss (or h:mm:ss for long recordings). Unknown or bad values show 0:00.
 *
 * @param totalSeconds - A time in seconds, e.g. the audio element's `currentTime` or `duration`.
 *
 * @returns The time as `m:ss`, or `h:mm:ss` when an hour or longer. Returns `"0:00"` for NaN, Infinity or negative input.
 */
export function formatTime(totalSeconds: number): string {
  //reject bad input.
  if (!Number.isFinite(totalSeconds) || totalSeconds < 0) return "0:00";

  //Drop fractions
  const whole = Math.floor(totalSeconds);
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const seconds = String(whole % 60).padStart(2, "0");
  return hours > 0
    ? `${hours}:${String(minutes).padStart(2, "0")}:${seconds}`
    : `${minutes}:${seconds}`;
}

/**
 * Part of the user story "Audio Pause and Playback #74".
 * The player itself. A Play/Pause button, a seek slider and a time readout
 * around a native <audio> element.
 *
 *
 * @param param0 - @param props - See AudioPlayerProps. Only `src` is required.
 * @returns The player's controls, plus an error message if the file fails.
 */
export default function AudioPlayer({
  src,
  title,
  durationSeconds,
  onError,
}: AudioPlayerProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Mirrors of the <audio> element's state, updated only from its events.
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  // While the user drags the slider, `timeupdate` must not move the thumb
  // back under their finger. `dragTime` holds the dragged position until release.
  const [dragTime, setDragTime] = useState<number | null>(null);

  // Keep the latest onError without re-subscribing listeners each render.
  const onErrorRef = useRef(onError);
  useEffect(() => {
    onErrorRef.current = onError;
  }, [onError]);

  // A new src is a new recording: reset everything that described the old one.
  useEffect(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(null);
    setError(null);
    setDragTime(null);
  }, [src]);

  // Subscribe to the element's own events. This is the single source of truth.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onEnded = () => setIsPlaying(false);
    const onTimeUpdate = () => setCurrentTime(audio.currentTime);

    const onLoadedMetadata = () => {
      // Some files report Infinity until fully read. Treat that as unknown.
      setDuration(Number.isFinite(audio.duration) ? audio.duration : null);
    };
    const onDurationChange = onLoadedMetadata;

    //called if the file fails so the page can fetch a fresh url.
    const onLoadError = () => {
      setIsPlaying(false);
      setError("This recording could not be loaded.");
      onErrorRef.current?.();
    };

    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("error", onLoadError);

    return () => {
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("error", onLoadError);
    };
  }, [src]);

  /**
   * Part of the user story "Audio Pause and Playback #74".
   * The one button. Pausing keeps `currentTime`, so pressing it again resumes
   * from the same spot.
   *
   * @returns A promise that settles once playback has started or failed. The button label is updated by the audio
   * element's events, not here.
   */
  async function togglePlayback() {
    const audio = audioRef.current;
    if (!audio) return;

    if (audio.paused) {
      try {
        //Clears old error message before trying again.
        setError(null);
        await audio.play();
      } catch (err) {
        // Interrupted by a quick pause or a new src: not a real failure.
        if (err instanceof DOMException && err.name === "AbortError") return;
        setError("Playback could not start.");
      }
    } else {
      audio.pause();
    }
  }

  /**
   * Part of the user story "Audio Pause and Playback #74".
   *
   * Runs whenever the slider moved (drag, click on the track, or arrow keys).
   * Seeking happens onevery change so keyboard users get immediate feedback,
   * and `dragTime`  keeps the thumb steady until the element catches up.
   *
   * @param event - The slider's change event. Its value is the new position in seconds
   */
  function onSeek(event: ChangeEvent<HTMLInputElement>) {
    //Get the audio element and the new postion
    const audio = audioRef.current;
    const next = Number(event.currentTarget.value);

    //Rember where your dragging while seeking
    setDragTime(next);

    //Checks skips to see if thelement isnt on the page yet.
    if (audio) {
      audio.currentTime = next;
      setCurrentTime(next);
    }
  }

  /** Releasing the slider hands the thumb back to `timeupdate`. */
  function endSeek() {
    setDragTime(null);
  }

  const label = title ?? "recording";
  const canSeek = duration !== null && duration > 0;
  const shownTime = dragTime ?? currentTime;
  const shownDuration = duration ?? durationSeconds ?? null;

  return (
    <div className="audio-player">
      {title && <p className="audio-player__title">{title}</p>}

      {/* preload="metadata" fetches only enough to learn the length, not the whole file. */}
      <audio ref={audioRef} src={src} preload="metadata" />

      <div className="audio-player__controls">
        <button
          type="button"
          className="audio-player__toggle"
          onClick={togglePlayback}
          aria-label={`${isPlaying ? "Pause" : "Play"} ${label}`}
        >
          {isPlaying ? "Pause" : "Play"}
        </button>

        <input
          type="range"
          className="audio-player__seek"
          min={0}
          max={canSeek ? duration : 0}
          step="any"
          value={canSeek ? Math.min(shownTime, duration) : 0}
          onChange={onSeek}
          onPointerUp={endSeek}
          onKeyUp={endSeek}
          onBlur={endSeek}
          disabled={!canSeek}
          aria-label={`Seek in ${label}`}
          aria-valuetext={`${formatTime(shownTime)} of ${formatTime(shownDuration ?? 0)}`}
        />

        <span className="audio-player__time" aria-hidden="true">
          {formatTime(shownTime)} /{" "}
          {shownDuration === null ? "--:--" : formatTime(shownDuration)}
        </span>
      </div>

      {error && (
        <p className="audio-player__error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
