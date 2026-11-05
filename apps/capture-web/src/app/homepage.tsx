import { useState } from "react";

import LocationMap from "./LocationMap";

/**
 * Declares and exports the Homepage React component.
 *
 * @returns A React component that renders the homepage, including a location map and a display of selected coordinates.
 */
export default function Homepage() {
  // State to hold the selected coordinates from the LocationMap component.
  const [coordinates, setCoordinates] = useState<[number, number] | null>(null);

  return (
    <main>
      <section>
        <h2>Select a Location</h2>
        <LocationMap onLocationSelect={setCoordinates} />
        <p aria-live="polite">
          {coordinates
            ? `Selected: ${coordinates[1].toFixed(5)}, ${coordinates[0].toFixed(5)}`
            : "Click the map to place a pin."}
        </p>
      </section>
    </main>
  );
}
