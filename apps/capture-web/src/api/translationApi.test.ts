// Tests the translation client without capture-api running, using a fake fetch
// that records what the client asked for.

import { describe, expect, it, vi } from "vitest";

import { newSourceRecord } from "@sagas/contracts";

import type { PendingTranslation, TranslatableRecord } from "./translationApi";
import {
  buildTranslationPayload,
  createTranslationClient,
} from "./translationApi";

type Answer = { status: number; body?: unknown };

/** A fake fetch that gives the answers in order, one per call. */
function fakeFetch(...answers: Answer[]) {
  let call = 0;
  return vi.fn<typeof fetch>(() => {
    const answer = answers[Math.min(call, answers.length - 1)] ?? { status: 500 };
    call += 1;
    const body =
      answer.body === undefined
        ? null
        : typeof answer.body === "string"
          ? answer.body
          : JSON.stringify(answer.body);
    return Promise.resolve(
      new Response(body, {
        status: answer.status,
        headers: { "content-type": "application/json" },
      }),
    );
  });
}

function calledUrl(fetchImpl: ReturnType<typeof fakeFetch>, n = 0): string {
  const input = fetchImpl.mock.calls[n]?.[0];
  if (typeof input !== "string")
    throw new Error("fetch was not called with a string URL.");
  return input;
}

const ID = "6f1c2a3e-1b2c-4d5e-8f90-123456789abc";

const basque: TranslatableRecord = {
  id: ID,
  siteId: "site-001",
  contributorId: "guest-abc",
  language: "eu",
  text: "Gure aitona hemen bizi izan zen.",
  createdAt: "2026-02-01T12:00:00.000Z",
};

const pendingBasque: PendingTranslation = {
  id: ID,
  siteId: "site-001",
  contributorId: "guest-abc",
  language: "eu",
  text: basque.text,
  createdAt: basque.createdAt,
};

describe("translation client", () => {
  it("asks for every pending record when no language is given", async () => {
    const fetchImpl = fakeFetch({ status: 200, body: [] });
    await createTranslationClient({ fetchImpl }).getPendingTranslations();
    expect(calledUrl(fetchImpl)).toBe("/api/records/pending-translation");
  });

  it("passes the language as a query parameter", async () => {
    const fetchImpl = fakeFetch({ status: 200, body: [pendingBasque] });
    const list = await createTranslationClient({
      fetchImpl,
    }).getPendingTranslations("eu");
    expect(calledUrl(fetchImpl)).toBe(
      "/api/records/pending-translation?language=eu",
    );
    expect(list).toEqual([pendingBasque]);
  });

  it("reads a record by id, encoding the id", async () => {
    const fetchImpl = fakeFetch({ status: 200, body: basque });
    const record = await createTranslationClient({ fetchImpl }).getRecord(
      "a/b c",
    );
    expect(calledUrl(fetchImpl)).toBe("/api/records?id=a%2Fb%20c");
    expect(record).toEqual(basque);
  });

  it("returns null for a record that does not exist", async () => {
    const api = createTranslationClient({ fetchImpl: fakeFetch({ status: 404 }) });
    expect(await api.getRecord(ID)).toBeNull();
  });

  it("throws when the server fails", async () => {
    const api = createTranslationClient({
      fetchImpl: fakeFetch({ status: 500, body: { error: "boom" } }),
    });
    await expect(api.getPendingTranslations()).rejects.toThrow(/500/);
  });

  describe("translation target", () => {
    it("is not found when the record does not exist", async () => {
      const api = createTranslationClient({ fetchImpl: fakeFetch({ status: 404 }) });
      expect(await api.getTranslationTarget(ID)).toEqual({ kind: "not-found" });
    });

    it("is ready when the record is in the pending list for its language", async () => {
      const fetchImpl = fakeFetch(
        { status: 200, body: basque },
        { status: 200, body: [pendingBasque] },
      );
      const target = await createTranslationClient({
        fetchImpl,
      }).getTranslationTarget(ID);
      expect(target).toEqual({ kind: "ready", record: basque });
      expect(calledUrl(fetchImpl, 1)).toBe(
        "/api/records/pending-translation?language=eu",
      );
    });

    it("is not pending once the record has a translation", async () => {
      const api = createTranslationClient({
        fetchImpl: fakeFetch({ status: 200, body: basque }, { status: 200, body: [] }),
      });
      expect((await api.getTranslationTarget(ID)).kind).toBe("not-pending");
    });

    it("is not pending for an English record", async () => {
      const fetchImpl = fakeFetch({ status: 200, body: { ...basque, language: "en" } });
      const api = createTranslationClient({ fetchImpl });
      expect((await api.getTranslationTarget(ID)).kind).toBe("not-pending");
      expect(fetchImpl).toHaveBeenCalledTimes(1);
    });

    it("is not pending for a record with no language", async () => {
      const { language: _language, ...noLanguage } = basque;
      const api = createTranslationClient({
        fetchImpl: fakeFetch({ status: 200, body: noLanguage }),
      });
      expect((await api.getTranslationTarget(ID)).kind).toBe("not-pending");
    });

    it("is not pending for a record that is itself a translation", async () => {
      const api = createTranslationClient({
        fetchImpl: fakeFetch({
          status: 200,
          body: {
            ...basque,
            parent: { role: "translation", recordId: ID, method: "human" },
          },
        }),
      });
      expect((await api.getTranslationTarget(ID)).kind).toBe("not-pending");
    });
  });

  it("posts a translation to /records/submit", async () => {
    const fetchImpl = fakeFetch({ status: 201, body: { id: "new" } });
    await createTranslationClient({ fetchImpl }).submitTranslation(
      basque,
      "  My grandfather lived here.  ",
    );

    expect(calledUrl(fetchImpl)).toBe("/api/records/submit");
    const init = fetchImpl.mock.calls[0]?.[1];
    expect(init?.method).toBe("POST");
    const body = JSON.parse(String(init?.body)) as Record<string, unknown>;
    expect(body).toMatchObject({
      siteId: "site-001",
      text: "My grandfather lived here.",
      language: "en",
      parent: { role: "translation", recordId: ID, method: "human" },
    });
  });

  it("surfaces the server's message when a translation is refused", async () => {
    const api = createTranslationClient({
      fetchImpl: fakeFetch({
        status: 400,
        body: { error: "The record being translated does not exist." },
      }),
    });
    await expect(api.submitTranslation(basque, "Text")).rejects.toThrow(
      /400.*does not exist/,
    );
  });
});

describe("translation payload", () => {
  const now = new Date("2026-11-15T10:00:00.000Z");

  it("is always an English, human translation of the source record", () => {
    expect(buildTranslationPayload(basque, " My grandfather lived here. ", now)).toEqual({
      siteId: "site-001",
      contributorId: "guest-abc",
      text: "My grandfather lived here.",
      language: "en",
      submission: "submitted",
      media: [],
      parent: { role: "translation", recordId: ID, method: "human" },
      choices: {
        rightToShare: true,
        studentAccess: false,
        public: "later",
        location: "remove",
        mentionsPeople: "not_sure",
      },
      termsVersion: "provisional-0.1",
      createdAt: "2026-11-15T10:00:00.000Z",
    });
  });

  it("is a valid record by the contract", () => {
    const result = newSourceRecord.safeParse(
      buildTranslationPayload(basque, "My grandfather lived here.", now),
    );
    expect(result.success).toBe(true);
  });
});
