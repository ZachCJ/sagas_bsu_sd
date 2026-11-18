// Commented out along with the location picker below. Uncomment all three to bring it back.
// import { useState } from "react";

// import LocationMap from "./LocationMap";
// import MapErrorBoundary from "./MapErrorBoundary";
import StoryMap from "./StoryMap";
import { Link } from "react-router";

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

  return (
    <main>
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
