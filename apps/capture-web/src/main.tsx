import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
//BrowserRouter keeps the page in sync with the address bar, so /sites/:siteId can be bookmarked.
import { BrowserRouter } from "react-router";

import "mapbox-gl/dist/mapbox-gl.css";
//import Page from "./app/page";

import "./app/globals.css";

//App holds the routes; the homepage is now the "/" route. See src/app/App.tsx.
import App from "./app/App";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error('Missing root element: expected an element with id "root".');
}

//Starts react app in HTML element whose id is root.
createRoot(rootElement).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
);
