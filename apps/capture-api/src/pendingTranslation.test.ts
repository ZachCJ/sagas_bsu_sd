/**
 * The list of records waiting for a translation, and the rules for submitting one.
 *
 * Like capture.test.ts, these talk to a running API over HTTP. In one terminal:
 *
 *   pnpm --filter @sagas/capture-api dev
 *
 * and in another:
 *
 *   CAPTURE_API_URL=http://localhost:3001 pnpm --filter @sagas/capture-api test
 *
 * Without CAPTURE_API_URL they're skipped.
 */
import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";

const base = process.env.CAPTURE_API_URL ?? "";

const choices = {
  rightToShare: true,
  studentAccess: false,
  public: "later",
  location: "remove",
  mentionsPeople: "not_sure",
};

// A site id of its own per run, so records left by earlier runs don't get in the way.
const siteId = `pending-translation-test-${randomUUID()}`;

interface Pending {
  id: string;
  language: string;
  capturedAt?: string;
  createdAt: string;
}

function recordBody(overrides: Record<string, unknown>) {
  return {
    siteId,
    contributorId: "guest-abc",
    text: "Gure aitona hemen bizi izan zen.",
    language: "eu",
    submission: "submitted",
    media: [],
    choices,
    termsVersion: "provisional-0.1",
    createdAt: new Date().toISOString(),
    ...overrides,
  };
}

async function submit(body: unknown) {
  return fetch(`${base}/records/submit`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

async function submitRecord(overrides: Record<string, unknown>): Promise<string> {
  const response = await submit(recordBody(overrides));
  expect(response.status).toBe(201);
  const stored = (await response.json()) as { id: string };
  return stored.id;
}

async function translationOf(recordId: string, overrides: Record<string, unknown> = {}) {
  return submit(
    recordBody({
      text: "My grandfather lived here.",
      language: "en",
      parent: { role: "translation", recordId, method: "human" },
      ...overrides,
    }),
  );
}

async function pending(language?: string): Promise<Pending[]> {
  const query = language ? `?language=${language}` : "";
  const response = await fetch(`${base}/records/pending-translation${query}`);
  expect(response.status).toBe(200);
  return (await response.json()) as Pending[];
}

const ids = (list: Pending[]) => list.map((r) => r.id);

describe.skipIf(!base)("pending translations, against a running API", () => {
  let older: string;
  let newer: string;
  let english: string;
  let spanish: string;
  let translated: string;
  let translationId: string;

  beforeAll(async () => {
    older = await submitRecord({
      createdAt: "2026-01-01T12:00:00Z",
      capturedAt: "1962-06-01T00:00:00Z",
    });
    newer = await submitRecord({ createdAt: "2026-02-01T12:00:00Z" });
    english = await submitRecord({ text: "In English already.", language: "en" });
    spanish = await submitRecord({ text: "Mi abuelo vivía aquí.", language: "es" });
    translated = await submitRecord({});

    const response = await translationOf(translated);
    expect(response.status).toBe(201);
    translationId = ((await response.json()) as { id: string }).id;
  });

  it("lists a non-English record under its language", async () => {
    expect(ids(await pending("eu"))).toContain(newer);
  });

  it("leaves English records out", async () => {
    expect(ids(await pending())).not.toContain(english);
  });

  it("leaves a translation itself out", async () => {
    expect(ids(await pending())).not.toContain(translationId);
  });

  it("drops a record once it has a translation", async () => {
    expect(ids(await pending())).not.toContain(translated);
  });

  it("lists newest first", async () => {
    const list = ids(await pending("eu"));
    expect(list.indexOf(newer)).toBeGreaterThanOrEqual(0);
    expect(list.indexOf(newer)).toBeLessThan(list.indexOf(older));
  });

  it("filters by language", async () => {
    const list = ids(await pending("es"));
    expect(list).toContain(spanish);
    expect(list).not.toContain(newer);
  });

  it("includes capturedAt when it is known, and leaves it out when not", async () => {
    const list = await pending("eu");
    expect(list.find((r) => r.id === older)?.capturedAt).toBeTruthy();
    expect(list.find((r) => r.id === newer)?.capturedAt).toBeUndefined();
  });

  it("rejects en and unknown languages", async () => {
    expect((await fetch(`${base}/records/pending-translation?language=en`)).status).toBe(400);
    expect((await fetch(`${base}/records/pending-translation?language=xx`)).status).toBe(400);
  });

  it("rejects a translation with no language", async () => {
    const response = await translationOf(newer, { language: undefined });
    expect(response.status).toBe(400);
  });

  it("rejects a translation of a record that does not exist", async () => {
    const response = await translationOf(randomUUID());
    expect(response.status).toBe(400);
  });

  it("accepts a valid translation", async () => {
    const target = await submitRecord({});
    expect((await translationOf(target)).status).toBe(201);
  });

  it("reads a record by its UUID", async () => {
    const response = await fetch(`${base}/records?id=${older}`);
    expect(response.status).toBe(200);
    const record = (await response.json()) as { language: string; capturedAt?: string };
    expect(record.language).toBe("eu");
    expect(record.capturedAt).toBeTruthy();
  });

  it("answers 404 for an id that isn't a UUID, or a UUID nobody has", async () => {
    expect((await fetch(`${base}/records?id=123`)).status).toBe(404);
    expect((await fetch(`${base}/records?id=${randomUUID()}`)).status).toBe(404);
  });
});
