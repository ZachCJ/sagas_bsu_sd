import { TextDecoder } from "node:util";

/**
 * Function to be reused in other file's that will take in
 * a transcript file. Then this will return the text content of the file.
 * Uses a TextDecoder to decode the file bytes into a string.
 * Then return that string as the transcript text.
 *
 * called with import statment.
 *
 * @param fileBytes - The bytes of the transcript file to be parsed.
 * @returns {string} transcript text
 */
export function parseTranscript(fileBytes: Uint8Array): string {
  //fileBytes is name of paramter that contains Unit8Array of bytes.
  const text = new TextDecoder("utf-8", { fatal: true }).decode(fileBytes);

  // Check if the text is empty or only contains whitespace
  if (!text.trim()) {
    throw new Error("Transcript file is empty.");
  }

  return text;
}
