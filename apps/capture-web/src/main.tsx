import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "mapbox-gl/dist/mapbox-gl.css";
//import Page from "./app/page";

import "./app/globals.css";

import Homepage from "./app/homepage";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error('Missing root element: expected an element with id "root".');
}

//Starts react app in HTML element whose id is root.
createRoot(rootElement).render(
  <StrictMode>
    <Homepage />
  </StrictMode>,
);
