//This file a temporary test file to use for practicing vitest testing

//Import the write libraries and your desired functions from your desired Javascript file
import { expect, test } from "vitest";

import { addsum } from "../src/newsum.js";

//Example test using Javascript
test("adds 1 + 2 to equal 3", () => {
  expect(addsum(1, 2)).toBe(3);
});

// //Example of a test failing
// test('adds 1 + 3 to equal 4', () => {
//   expect(addsum(1, 3).toBe(5)) //Should fail when running the test.sh script because 1 + 3 equals 5, and does not equal 5
// })
