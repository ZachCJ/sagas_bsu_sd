//Run file with pnpm --filter @sagas/capture-api exec vitest run src/parser.test.ts

//'describe' typically groups related tests, 'it' defines individual tests,
// 'expect' checks result matches intention
import { describe, expect, it } from "vitest";

import { parseTranscript } from "./parser";

/**
 *used to group tests for the parseTranscript function.
 *Each test checks a specific behavior of the function, such as decoding text,
 *handling empty input, and rejecting invalid UTF-8.
 *Point of tests is to mimic reading contents of a text file.
 */
describe("parseTranscript", () => {
  //Starts group of tests for the parseTranscript function
  it("decodes text and preserves line breaks", () => {
    //TextEndoder encodes a string into a Uint8Array, which is then passed to the parseTranscript function.

    const bytes = new TextEncoder().encode("First line\nSecond line");

    //Checks if the function correctly decodes the text and preserves line breaks like it would in a text document.
    //textDecoder interpreats bytes as UTF-8 and returns the original string, which is then checked against the expected output.
    expect(parseTranscript(bytes)).toBe("First line\nSecond line");
  });

  it("rejects empty or whitespace-only text", () => {
    //Creates a instance of text encoder with an  empty string.
    const bytes = new TextEncoder().encode(" \n ");

    expect(() => parseTranscript(bytes)).toThrow("Transcript file is empty.");
  });

  it("rejects invalid UTF-8", () => {
    //Creates an improper input for the parseTranscript funciton.
    const invalidUtf8 = new Uint8Array([0xff]);

    expect(() => parseTranscript(invalidUtf8)).toThrow();
  });
});
