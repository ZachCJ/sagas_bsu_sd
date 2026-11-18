/**
 * What goes inside the hover popup.
 *
 * Mapbox popups take a DOM element rather than a React tree, so this builds
 * one. It uses `textContent` and `createElement`, never HTML strings, so a
 * site name or alt text can never be read as markup.
 *
 * `popupModel` is the decision about what to show and is pure. `buildPopup*`
 * turns that into elements.
 */
import type { DisplayImage, NodePreview } from "../api/types";
import { MAX_PREVIEW_IMAGES } from "../api/types";
import { recordCountLabel } from "./format";

//Describes the popup
export interface PopupModel {
  title: string;
  subtitle?: string;
  images: DisplayImage[];
  emptyMessage?: string;
  hint: string;
}

/**
 * Decides what the hover popup should show for one place. Takes preview data and returns
 * plain description of the popups contents. Doesnt draw anything.
 *
 * @param preview -  The place's name and images, from getPreview.
 * @param recordCount - How many records the place has; omit to leave out the count line.
 * @returns The popup's title, subtitle, up to two images, an empty message if there are no images, and the click hint.
 */
export function popupModel(
  preview: NodePreview,
  recordCount?: number,
): PopupModel {
  const images = preview.images.slice(0, MAX_PREVIEW_IMAGES);
  return {
    title: preview.name,
    subtitle:
      recordCount === undefined ? undefined : recordCountLabel(recordCount),
    images,
    emptyMessage: images.length === 0 ? "No photos here yet." : undefined,
    hint: "Click to see the stories from this place.",
  };
}

/**
 * Creates the outer box of the hover popup with the place name at the top.
 * The three popup builders (buildPopupContent, buildPopupLoading and buildPopupError) all start from it,
 * then add their own lines below the title.
 *
 * @param doc - The web pages document used to create elements.
 * @param title - the text for the heading, which is the place name.
 * @returns an HTMLDivElement, a <div> holding the title, ready for more content.
 */
function container(doc: Document, title: string): HTMLDivElement {
  const root = doc.createElement("div");
  root.className = "story-popup";
  const heading = doc.createElement("strong");
  heading.className = "story-popup__title";
  heading.textContent = title;
  root.append(heading);
  return root;
}

/**
 * Creates a line of text for the hover popup in a <p> tag. with a CSS class applied.
 *
 * @param doc - The pages document used to create the element.
 * @param className - The clss class to control how the line looks
 * @param text - The words to show.
 * @returns  an HTMLParagraphElement, the finished <p>.
 */
function line(
  doc: Document,
  className: string,
  text: string,
): HTMLParagraphElement {
  const p = doc.createElement("p");
  p.className = className;
  p.textContent = text;
  return p;
}

/**
 * Builds the finished hover popup from a PopupModel() function.
 *
 * @param model - What to show, from popupModel().
 * @param doc The document to create elements in (defaults to `document`).
 * @returns The popup content
 */
export function buildPopupContent(
  model: PopupModel,
  doc: Document = document,
): HTMLElement {
  const root = container(doc, model.title);
  if (model.subtitle)
    root.append(line(doc, "story-popup__meta", model.subtitle));

  if (model.images.length > 0) {
    const row = doc.createElement("div");
    row.className = "story-popup__images";
    for (const image of model.images) {
      const img = doc.createElement("img");
      img.src = image.url;
      img.alt = image.alt;
      img.width = 120;
      img.height = 90;
      img.loading = "lazy";
      row.append(img);
    }
    root.append(row);
  } else if (model.emptyMessage) {
    root.append(line(doc, "story-popup__empty", model.emptyMessage));
  }

  root.append(line(doc, "story-popup__hint", model.hint));
  return root;
}

/**
 * Builds the popup shown while a place's photos are loading.
 *
 * @param title - The locations name.
 * @param doc - the HTML document
 * @returns The popup content: the place name and "Loading photos…".
 */
export function buildPopupLoading(
  title: string,
  doc: Document = document,
): HTMLElement {
  const root = container(doc, title);
  root.append(line(doc, "story-popup__meta", "Loading photos…"));
  return root;
}

/**
 * Builds the popup shown when a place's photos fail to load.
 *
 * @param title - The locations name
 * @param doc - The document to create elements in (defaults to `document`).
 * @returns The popup content: the place name and "Photos could not be loaded."
 */
export function buildPopupError(
  title: string,
  doc: Document = document,
): HTMLElement {
  const root = container(doc, title);
  root.append(line(doc, "story-popup__empty", "Photos could not be loaded."));
  return root;
}
