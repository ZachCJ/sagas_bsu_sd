// Commented out along with the location picker below. Uncomment all three to bring it back.
// import { useState } from "react";

// import LocationMap from "./LocationMap";
// import MapErrorBoundary from "./MapErrorBoundary";

//Commented out for locationaddtion commit
//import { Link } from "react-router";

import type { SubmitEvent } from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router";

import StoryMap from "./StoryMap";

import "../features/audio/audio.css";

/**
 * Declares and exports the Homepage React component.
 *
 * @returns A React component that renders the homepage: the story map of where records come from.
 * The location picker is commented out for now so there is only one map on the page.
 */
export default function Homepage() {
  // State to hold the selected coordinates from the LocationMap component.
  // Commented out with the location picker below.
  // const [coordinates, setCoordinates] = useState<[number, number] | null>(null);

  const navigate = useNavigate();
  const [searchText, setSearchText] = useState("");

  /**
   * Opens the search page for the text in the homepage search box.
   *
   * The text is trimmed and URL-encoded and sent as `?q=`, so the results page can be reloaded or bookmarked.
   * An empty search opens `/search` with no query, which shows the prompt to type an address. Search
   * matches the address only.
   *
   * @param event The form's submit event. Its default action, reloading the page, is cancelled so the app can navigate instead.
   */
  function handleSearch(event: SubmitEvent<HTMLFormElement>) {
    //prevents default behavior of reloading current URL
    event.preventDefault();
    //removes whitespace
    const q = searchText.trim();
    void navigate(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  }

  return (
    <main>
      <nav aria-label="Records">
        <Link to="/records/new">Add a record</Link>
        <form onSubmit={handleSearch} role="search">
          <label htmlFor="home-search">Search by address</label>{" "}
          <input
            id="home-search"
            value={searchText}
            onChange={(event) => setSearchText(event.currentTarget.value)}
          />{" "}
          <button type="submit">Search</button>
        </form>
      </nav>

      <nav className="audio-test-nav" aria-label="Test pages">
        <Link to="/audio-demo">AudioPageTest</Link>
      </nav>
      <section aria-labelledby="story-map-heading">
        <h2 id="story-map-heading">Where the stories come from</h2>
        <p>
          Hover over a place to see its photos. Click it to read its stories.
        </p>
        <StoryMap />
      </section>

      <p>
        <Link to="/translations">Records waiting for a translation</Link>
      </p>

      {/*
        Location picker, commented out so the homepage shows one map.
        To bring it back, uncomment this section, the imports at the top of
        this file, and the `coordinates` state above.

      <section>
        <h2>Select a Location</h2>
        {/* If the picker's map cannot start (e.g. no WebGL), show a message instead of blanking the page. *\/}
        <MapErrorBoundary
          fallback={
            <p>
              Map unavailable: this browser could not start the map (WebGL may
              be turned off).
            </p>
          }
        >
          <LocationMap onLocationSelect={setCoordinates} />
        </MapErrorBoundary>
        <p aria-live="polite">
          {coordinates
            ? `Selected: ${coordinates[1].toFixed(5)}, ${coordinates[0].toFixed(5)}`
            : "Click the map to place a pin."}
        </p>
      </section>
      */}
    </main>
  );
}
