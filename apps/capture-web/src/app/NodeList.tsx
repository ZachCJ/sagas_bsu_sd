import { Link } from "react-router";

import type { MapNode } from "../api/types";
import { recordCountLabel, sitePath } from "./format";

interface NodeListProps {
  nodes: MapNode[];
  /** The node whose preview is showing, so it can be highlighted. */
  activeSiteId: string | null;
  /** While true, an empty list means "not loaded yet" rather than "nothing here". */
  loading: boolean;
  onPreview: (node: MapNode) => void;
  onPreviewEnd: () => void;
}

/**
 * The places on the map, as a list of links.
 *
 * A map canvas cannot be reached with a keyboard or read by a screen reader,
 * so this gives the same journey another way. Focusing or hovering an item
 * shows the same popup as hovering its node, and Enter follows the link to the
 * place's records, exactly like clicking the node.
 */
export default function NodeList({
  nodes,
  activeSiteId,
  loading,
  onPreview,
  onPreviewEnd,
}: NodeListProps) {
  // The status line above already says "Loading places…"; do not claim the area is empty.
  if (nodes.length === 0 && loading) return null;

  if (nodes.length === 0) {
    return (
      <p className="story-list__empty">
        No places in this part of the map yet.
      </p>
    );
  }

  //Returns bullet list with one clickable row per place
  return (
    <ul className="story-list" aria-label="Places on the map">
      {nodes.map((node) => (
        <li key={node.siteId}>
          <Link
            to={sitePath(node.siteId)}
            className={
              node.siteId === activeSiteId
                ? "story-list__link is-active"
                : "story-list__link"
            }
            onFocus={() => onPreview(node)}
            onBlur={onPreviewEnd}
            onMouseEnter={() => onPreview(node)}
            onMouseLeave={onPreviewEnd}
          >
            <span className="story-list__name">{node.name}</span>
            <span className="story-list__count">
              {recordCountLabel(node.recordCount)}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
