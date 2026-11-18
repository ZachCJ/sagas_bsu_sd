/**
 * The one place that decides where the story map's data comes from.
 *
 * Dummy data is the default, because capture-api's map endpoints do not exist
 * yet. To use the real API:
 *
 *   VITE_USE_MOCK_DATA=false pnpm --filter @sagas/capture-web dev
 *
 * Components import `mapApi` and never know which one they got.
 */
import type { MapApi } from "./types";
import { createHttpClient } from "./httpClient";
import { createMockClient } from "./mockClient";

/**
 * Decides weather ot not to use mock data. True unless the flag is explicitly "false".
 *
 * @param flag - enviorment variable to control what data to use
 * @returns true to use dummy data; false (only when the flag is "false",
 *   any capitalisation or spacing) to use capture-api.
 */
export function shouldUseMockData(flag: string | undefined): boolean {
  return flag?.trim().toLowerCase() !== "false";
}

export const usingMockData = shouldUseMockData(
  import.meta.env.VITE_USE_MOCK_DATA,
);

//creates the one data client the whole app uses, and picks which kind based on the VITE_USE_MOCK_DATA setting.
export const mapApi: MapApi = usingMockData
  ? createMockClient()
  : createHttpClient();
