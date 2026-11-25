/**
 * Part of the user story "Audio Pause and Playback #74".
 *
 * Where the audio demo gets its recordings from. This file is the ONE place to
 * change when capture-api can serve real recordings. Nothing else in
 * `src/features/audio/` needs to know where a URL came from.
 *
 * Today: seven sample files in `apps/capture-web/public/` (Sample1.mp3 ..
 * Sample7.mp3). Vite serves `public/` from the site root, so `/Sample3.mp3`
 * is a valid URL in dev and in a build.
 *
 * Later (capture-api swap point), `getAudioSource(id)` would roughly:
 *   1. `fetch("/api/records/<id>")`. Vite proxies `/api/*` to Express on port
 *      3001 and strips the prefix (see vite.config.ts).
 *   2. Find the audio entry in the record's `media` list (`kind: "audio"`).
 *   3. Ask capture-api for a presigned GET URL for that entry's `storageKey`.
 *   4. Return `{ id, title, url, durationSeconds }`, where `durationSeconds`
 *      comes from the contract's `mediaRef.durationSeconds`.
 * `getAudioSources()` would list the audio records the same way.
 *
 * Rules to keep when swapping:
 *   - Never store the URL (state outside the current render, localStorage, a
 *     database). Presigned links expire after a few minutes. Ask again when a
 *     link stops working. AudioDemoPage already re-calls `getAudioSource(id)`
 *     when playback fails.
 *   - Ids are strings, because capture-api ids are UUIDs.
 */

/**
 * Part of the user story "Audio Pause and Playback #74".
 * One playable recording.
 *
 * `durationSeconds` mirrors `mediaRef.durationSeconds` in `@sagas/contracts`.
 * It is optional. The player works without it and reads the real length from
 * the file once it loads.
 */
export interface AudioSource {
  id: string;
  title: string;
  url: string;
  durationSeconds?: number;
}

/** How many sample files exist in `public/` (Sample1.mp3 .. Sample7.mp3). */
const SAMPLE_COUNT = 7;

/** Builds the local sample list from a number range, so no names are hard-coded. */
const LOCAL_SAMPLES: AudioSource[] = Array.from(
  { length: SAMPLE_COUNT },
  (_, i) => {
    const n = i + 1;
    return { id: String(n), title: `Sample ${n}`, url: `/Sample${n}.mp3` };
  },
);

/**
 * Part of the user story "Audio Pause and Playback #74".
 *
 * Every recording the demo can list. Returns a Promise from the start so a
 * real network call (`async` + `await fetch(...)`) can replace the body
 * without changing any caller.
 *
 * @returns A promise of every recording, as `AudioSource` objects ({ id, title, url }).
 */
export function getAudioSources(): Promise<AudioSource[]> {
  return Promise.resolve(LOCAL_SAMPLES);
}

/**
 * Part of the user story "Audio Pause and Playback #74".
 *
 * Looks up one recording by id, or `undefined` when there is no such recording.
 * Returns a Promise for the same reason as `getAudioSources`.
 *
 *
 * @param id - The recording's id from the URL, e.g. "3" today or a UUID from capture-api later.
 * @returns A promise of the matching AudioSource, or `undefined` if no recording has that id.
 */
export function getAudioSource(id: string): Promise<AudioSource | undefined> {
  //Decides what to play on /audio-demo/:sampleId
  return Promise.resolve(LOCAL_SAMPLES.find((sample) => sample.id === id));
}
