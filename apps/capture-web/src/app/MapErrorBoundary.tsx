import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";

interface MapErrorBoundaryProps {
  children: ReactNode;
  /** What to show instead when the map inside fails. */
  fallback: ReactNode;
}

interface MapErrorBoundaryState {
  failed: boolean;
}

/**
 * Keeps one broken map from blanking the whole page.
 *
 * Mapbox throws when the browser cannot start WebGL, which happens in remote
 * desktops and VMs. React unmounts everything when a component throws, so
 * without this a map failure takes the rest of the homepage down with it.
 *
 * Error boundaries still have to be class components in React 19.
 */
export default class MapErrorBoundary extends Component<MapErrorBoundaryProps, MapErrorBoundaryState> {
  override state: MapErrorBoundaryState = { failed: false };

  static getDerivedStateFromError(): MapErrorBoundaryState {
    return { failed: true };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("A map failed to load.", error, info.componentStack);
  }

  override render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}
