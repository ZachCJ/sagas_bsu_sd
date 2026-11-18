import { defineConfig } from "vitest/config";

/**
 * Test settings for capture-web.
 *
 * Kept separate from vite.config.ts on purpose: that file loads the React
 * plugin for Vite 8, and Vitest runs on its own Vite version.
 *
 * Tests run in Node with no browser environment (no jsdom), so they cover the
 * logic: the API clients, bounds and GeoJSON helpers, the preview cache, and
 * what the popup decides to show. Rendering and keyboard behaviour are checked
 * by hand in the browser. See the README.
 */
export default defineConfig({
  test: {
    include: ["src/**/*.test.ts"],
    environment: "node",
  },
});
