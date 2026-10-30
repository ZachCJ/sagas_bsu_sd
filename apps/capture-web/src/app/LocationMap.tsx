import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

/**
 * Defines props (Properties) Location map expects.
 */
interface LocationMapProps {
  onLocationSelect: (coordinates: [number, number]) => void;
}

/**
 *Declares and exports the Location Map React componet to be used elsewhere in the application.
 *
 * @param param0 - Props for the LocationMap component, including a callback function to handle location selection.
 * @returns A React component that renders a Mapbox map and allows users to select a location by clicking on the map.
 */
export default function LocationMap({ onLocationSelect }: LocationMapProps) {
  //Ref to the div that will contain the map.
  const containerRef = useRef<HTMLDivElement | null>(null);
  //Reads mapbox pulic token Vite exposes as import.meta.env.VITE_MAPBOX_TOKEN.
  const token = import.meta.env.VITE_MAPBOX_TOKEN;

  //Checks both the containerRef and token are defined before initializing the map.
  useEffect(() => {
    if (!containerRef.current || !token) return;

    //Mapbox token from Vite envirorment variable.
    mapboxgl.accessToken = token;

    //Creates a new mapbox map instance with the specified container, style, center, and zoom level.
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-116.20331, 43.61533],
      zoom: 12,
    });

    const marker = new mapboxgl.Marker();

    //Resets info above when the user clicks on the map, and calls the onLocationSelect callback with the selected coordinates.
    //Meaning when the user interacts with the map, the selected location is captured and passed to the parent component for further processing.
    map.on("click", ({ lngLat }) => {
      const coordinates: [number, number] = [lngLat.lng, lngLat.lat];
      marker.setLngLat(coordinates).addTo(map);
      onLocationSelect(coordinates);
    });

    return () => map.remove();
  }, [onLocationSelect, token]);

  if (!token) return <p>Map unavailable: Mapbox token is missing.</p>;

  return (
    <div
      ref={containerRef}
      className="mapbox-map"
      aria-label="Select a location on the map"
    />
  );
}
