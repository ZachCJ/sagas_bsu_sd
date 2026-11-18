//bring routing from react router.
import { Link, Route, Routes } from "react-router";

import Homepage from "./homepage";
import SiteRecordsPage from "./SiteRecordsPage";
import PendingTranslationsPage from "./PendingTranslationsPage";
import TranslationPage from "./TranslationPage";

/**
 * Can be thought of as the app's pages or table of contents. Decides which page to
 * show based on URL in address bar.
 *
 *   /                 the homepage: the story map
 *   /sites/:siteId    every record at one place, reached by clicking a node
 *   /translations     records waiting for a translation, filterable by ?language=
 *   /translations/:recordId   give a translation of one record
 *
 * The router itself is set up in main.tsx.
 */
export default function App() {
  return (
    // From Current URL shows first Route that matches.

    <Routes>
      <Route path="/" element={<Homepage />} />
      <Route path="/sites/:siteId" element={<SiteRecordsPage />} />
      <Route path="/translations" element={<PendingTranslationsPage />} />
      <Route path="/translations/:recordId" element={<TranslationPage />} />
      <Route
        // Catches every other address and shows "Page not found"
        path="*"
        element={
          <main>
            <h1>Page not found</h1>
            <p>
              {/* Works like an href */}
              <Link to="/">Go to the map</Link>
            </p>
          </main>
        }
      />
    </Routes>
  );
}
