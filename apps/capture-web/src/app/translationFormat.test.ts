import { describe, expect, it } from "vitest";

import { languageCode } from "@sagas/contracts";

import {
  FILTER_LANGUAGES,
  languageLabel,
  parseLanguageFilter,
  pendingTranslationsPath,
  previewText,
  translationPath,
} from "./translationFormat";

describe("languageLabel", () => {
  it("names every language in the contract, with its code", () => {
    expect(languageLabel("en")).toBe("English (en)");
    expect(languageLabel("eu")).toBe("Basque (eu)");
    expect(languageLabel("es")).toBe("Spanish (es)");
    expect(languageLabel("fr")).toBe("French (fr)");
    for (const code of languageCode.options) {
      expect(languageLabel(code)).toMatch(new RegExp(`\\(${code}\\)$`));
    }
  });

  it("shows an unknown code as given", () => {
    expect(languageLabel("xx")).toBe("xx");
  });
});

describe("FILTER_LANGUAGES", () => {
  it("is every contract language except English", () => {
    expect(FILTER_LANGUAGES).not.toContain("en");
    expect(FILTER_LANGUAGES).toEqual(
      languageCode.options.filter((code) => code !== "en"),
    );
  });
});

describe("parseLanguageFilter", () => {
  it("keeps a language the list can filter by", () => {
    expect(parseLanguageFilter("eu")).toBe("eu");
  });

  it("treats missing, English and unknown values as all languages", () => {
    expect(parseLanguageFilter(null)).toBeUndefined();
    expect(parseLanguageFilter("")).toBeUndefined();
    expect(parseLanguageFilter("en")).toBeUndefined();
    expect(parseLanguageFilter("xx")).toBeUndefined();
  });
});

describe("paths", () => {
  it("builds the pending list path, with and without a filter", () => {
    expect(pendingTranslationsPath()).toBe("/translations");
    expect(pendingTranslationsPath("eu")).toBe("/translations?language=eu");
  });

  it("encodes the record id in the translation path", () => {
    expect(translationPath("a/b")).toBe("/translations/a%2Fb");
  });
});

describe("previewText", () => {
  it("keeps short text as it is, trimmed", () => {
    expect(previewText("  Kaixo  ")).toBe("Kaixo");
  });

  it("cuts long text and marks the cut", () => {
    expect(previewText("abcdefghij", 4)).toBe("abcd…");
  });

  it("returns an empty string for no text", () => {
    expect(previewText(undefined)).toBe("");
  });
});
