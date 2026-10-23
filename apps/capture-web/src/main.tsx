import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import Page from "./app/page";

import "./app/globals.css";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error('Missing root element: expected an element with id "root".');
}

createRoot(rootElement).render(
  <StrictMode>
    <Page />
  </StrictMode>,
);
