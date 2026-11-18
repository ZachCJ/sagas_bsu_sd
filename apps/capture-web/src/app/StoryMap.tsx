import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { useNavigate } from "react-router";

import type { Bounds, MapApi, MapNode } from "../api/types";
import { debounce, nodesToGeoJSON } from "../api/geo";
import { mapApi as defaultApi, usingMockData } from "../api/mapApi";
import { createPreviewCache } from "../api/previewCache";
import { sitePath } from "./format";
import NodeList from "./NodeList";
import {
  buildPopupContent,
  buildPopupError,
  buildPopupLoading,
  popupModel,
} from "./popupContent";

/** Boise, [longitude, latitude]. Same starting point as LocationMap. */
const CENTER: [number, number] = [-116.20331, 43.61533];
const ZOOM = 13;

/** Used to load the list when there is no map to read bounds from. */
const FALLBACK_BOUNDS: Bounds = {
  west: -116.26,
  south: 43.58,
  east: -116.15,
  north: 43.65,
};

const SOURCE_ID = "story-nodes";
const LAYER_ID = "story-nodes-circles";

type Status = "loading" | "ready" | "error";

interface StoryMapProps {
  /** Where data comes from. Defaults to the app-wide client; tests can pass their own. */
  api?: MapApi;
}

/**
 * The story map: one node per place that has records.
 *
 * Hovering a node shows a popup with up to two of its images. Clicking it opens
 * the place's records page. The list beside the map offers the same journey for
 * keyboard and screen reader users.
 *
 * Nodes are drawn as a GeoJSON circle layer rather than one DOM marker each,
 * so the map stays fast as the number of places grows. They are refetched for
 * the visible area whenever the map stops moving.
 */
export default function StoryMap({ api = defaultApi }: StoryMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const popupRef = useRef<mapboxgl.Popup | null>(null);
  /** The site whose preview should be showing. Guards against slow, stale responses. */
  const activeRef = useRef<string | null>(null);
  /** Counts requests so only the latest one updates the map. */
  const requestRef = useRef(0);
  const nodesRef = useRef<MapNode[]>([]);

  const [nodes, setNodes] = useState<MapNode[]>([]);
  const [status, setStatus] = useState<Status>("loading");
  const [activeSiteId, setActiveSiteId] = useState<string | null>(null);
  const [announcement, setAnnouncement] = useState("");
  /** True when Mapbox could not start, usually because the browser has WebGL turned off. */
  const [mapFailed, setMapFailed] = useState(false);

  const navigate = useNavigate();
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  const token = import.meta.env.VITE_MAPBOX_TOKEN;
  const previews = useMemo(
    () => createPreviewCache((siteId) => api.getPreview(siteId)),
    [api],
  );

  /** Fetch nodes for an area and draw them. */
  const loadNodes = useCallback(
    async (bounds: Bounds) => {
      const request = ++requestRef.current;
      setStatus("loading");
      try {
        const found = await api.getNodes(bounds);
        if (request !== requestRef.current) return;
        nodesRef.current = found;
        setNodes(found);
        setStatus("ready");
        const source =
          mapRef.current?.getSource<mapboxgl.GeoJSONSource>(SOURCE_ID);
        source?.setData(nodesToGeoJSON(found));
      } catch {
        if (request !== requestRef.current) return;
        setStatus("error");
      }
    },
    [api],
  );

  /** Show the popup for a node, loading its images if they are not cached. */
  const showPreview = useCallback(
    (node: MapNode, { announce = false } = {}) => {
      activeRef.current = node.siteId;
      setActiveSiteId(node.siteId);

      const map = mapRef.current;
      const popup = popupRef.current;
      if (map && popup) {
        popup
          .setLngLat(node.coordinates)
          .setDOMContent(buildPopupLoading(node.name))
          .addTo(map);
      }

      previews
        .get(node.siteId)
        .then((preview) => {
          if (activeRef.current !== node.siteId) return;
          const model = popupModel(preview, node.recordCount);
          popupRef.current?.setDOMContent(buildPopupContent(model));
          if (announce) {
            const photos =
              model.images.length === 1
                ? "1 photo"
                : `${model.images.length} photos`;
            setAnnouncement(
              `${node.name}: ${model.subtitle ?? ""}, ${photos}.`,
            );
          }
        })
        .catch(() => {
          if (activeRef.current !== node.siteId) return;
          popupRef.current?.setDOMContent(buildPopupError(node.name));
          if (announce)
            setAnnouncement(`${node.name}: photos could not be loaded.`);
        });
    },
    [previews],
  );

  const hidePreview = useCallback(() => {
    activeRef.current = null;
    setActiveSiteId(null);
    popupRef.current?.remove();
  }, []);

  // Set up the map once. Without a token there is no map, but the list still works.
  useEffect(() => {
    if (!token || !containerRef.current) {
      void loadNodes(FALLBACK_BOUNDS);
      return;
    }

    mapboxgl.accessToken = token;
    let map: mapboxgl.Map;
    try {
      map = new mapboxgl.Map({
        container: containerRef.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: CENTER,
        zoom: ZOOM,
      });
    } catch {
      // Mapbox throws when WebGL is unavailable, which is common in remote
      // desktops and VMs. Without this the whole page goes blank. Keep the
      // list of places working instead.
      setMapFailed(true);
      void loadNodes(FALLBACK_BOUNDS);
      return;
    }
    mapRef.current = map;
    popupRef.current = new mapboxgl.Popup({
      closeButton: false,
      closeOnClick: false,
      offset: 14,
      maxWidth: "280px",
    });

    const readBounds = (): Bounds => {
      const b = map.getBounds();
      return {
        west: b.getWest(),
        south: b.getSouth(),
        east: b.getEast(),
        north: b.getNorth(),
      };
    };
    const reload = debounce(() => void loadNodes(readBounds()), 250);

    // Mapbox's feature type builds on the global GeoJSON types, which pnpm's
    // strict layout does not expose to this app. Read only the one field needed,
    // and check it is a string before using it.
    const nodeFromEvent = (
      event: mapboxgl.MapMouseEvent,
    ): MapNode | undefined => {
      const feature = event.features?.[0] as
        { properties?: { siteId?: unknown } | null } | undefined;
      const siteId = feature?.properties?.siteId;
      if (typeof siteId !== "string") return undefined;
      return nodesRef.current.find((node) => node.siteId === siteId);
    };

    map.on("load", () => {
      map.addSource(SOURCE_ID, {
        type: "geojson",
        data: nodesToGeoJSON(nodesRef.current),
      });
      map.addLayer({
        id: LAYER_ID,
        type: "circle",
        source: SOURCE_ID,
        paint: {
          // Bigger circles for places with more records, within limits.
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["get", "recordCount"],
            1,
            9,
            10,
            18,
          ],
          "circle-color": "#b5462f",
          "circle-opacity": 0.85,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });
      void loadNodes(readBounds());
    });

    map.on("moveend", reload);

    map.on("mouseenter", LAYER_ID, (event) => {
      map.getCanvas().style.cursor = "pointer";
      const node = nodeFromEvent(event);
      if (node) showPreview(node);
    });

    map.on("mouseleave", LAYER_ID, () => {
      map.getCanvas().style.cursor = "";
      hidePreview();
    });

    map.on("click", LAYER_ID, (event) => {
      const node = nodeFromEvent(event);
      if (node) void navigateRef.current(sitePath(node.siteId));
    });

    return () => {
      reload.cancel();
      popupRef.current?.remove();
      popupRef.current = null;
      mapRef.current = null;
      map.remove();
    };
  }, [token, loadNodes, showPreview, hidePreview]);

  const statusMessage =
    status === "loading"
      ? "Loading places…"
      : status === "error"
        ? "Places could not be loaded. Try moving the map to retry."
        : `${nodes.length} ${nodes.length === 1 ? "place" : "places"} shown.`;

  return (
    <div className="story-map">
      {!token ? (
        <p>
          Map unavailable: Mapbox token is missing. The places are listed below.
        </p>
      ) : mapFailed ? (
        <p>
          Map unavailable: this browser could not start the map (WebGL may be
          turned off). The places are listed below.
        </p>
      ) : (
        <div
          ref={containerRef}
          className="story-map__canvas"
          role="region"
          aria-label="Map of places with stories. Use the list of places to explore with a keyboard."
        />
      )}

      <div className="story-map__side">
        <p className="story-map__status" role="status" aria-live="polite">
          {statusMessage}
          {usingMockData ? " (Sample data.)" : ""}
        </p>
        <NodeList
          nodes={nodes}
          activeSiteId={activeSiteId}
          loading={status === "loading"}
          onPreview={(node) => showPreview(node, { announce: true })}
          onPreviewEnd={hidePreview}
        />
        <p className="visually-hidden" aria-live="polite">
          {announcement}
        </p>
      </div>
    </div>
  );
}
