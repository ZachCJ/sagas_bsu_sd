import express from "express";

const recordsRouter = express.Router();
import { languageCode, newSourceRecord } from "@sagas/contracts";
import { pool } from "../db";

//Subroutes of Records API
import { recordsVideoRouter } from "./records-video";
import { recordsAudioRouter } from "./records-audio";
import { recordsPhotoRouter } from "./records-photo";

/**
 * All API routes for this file are prefixed with "/records".
 *   The API calls that associate with record systems should be defined here. This 
 *   file will very interconnected with the rest of the API, so keep the code clean and orgainized.
 */

// Subroutes 
recordsRouter.use("/video", recordsVideoRouter);
recordsRouter.use("/audio", recordsAudioRouter);
recordsRouter.use("/photo", recordsPhotoRouter);

/** Record ids are UUIDs (012_uuid_ids.sql). Anything else cannot name a record. */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * What counts as "has content to translate". Written records only for now:
 * the record's own text, or the text of a written file. Audio and photo records
 * get added here later, so the rule lives in one place.
 *
 * A constant SQL fragment, never built from user input.
 */
const WRITTEN_CONTENT = 'coalesce(records."text", written_records.file_data)';

////////////////////////////
//  HTTP GET Requests     //
////////////////////////////

recordsRouter.get("/health", (_req, res) => {
  res.json({ ok: true });
});

/**
 * Records waiting for an English translation, newest first.
 *
 * Derived, not stored. A record is pending when it is a non-English written
 * record, is not itself a transcript or translation, is not a draft, and no
 * record has `parent.role = 'translation'` pointing at it. Any translation
 * clears it from the list.
 *
 * Optional `?language=eu|es|fr` narrows the list. `en` is rejected, because an
 * English record is never pending.
 *
 * Registered before the id handler below so the two never get confused.
 */
recordsRouter.get("/pending-translation", async (req, res) => {
  const { language } = req.query;
  let languageFilter: string | null = null;

  if (language !== undefined) {
    const parsedLanguage = languageCode.safeParse(language);
    if (!parsedLanguage.success || parsedLanguage.data === "en") {
      const allowed = languageCode.options.filter((code) => code !== "en").join(", ");
      res.status(400).json({ error: `language must be one of: ${allowed}.` });
      return;
    }
    languageFilter = parsedLanguage.data;
  }

  const { rows } = await pool.query<Record<string, unknown>>(
    `select records.id,
            records.site_id,
            records.contributor_id,
            records.note,
            ${WRITTEN_CONTENT} as "text",
            records.language,
            records.captured_at,
            records.created_at
       from records
       left join written_records on written_records.record_id = records.id
      where records.language is not null
        and records.language <> 'en'
        and records.parent is null
        and records.submission <> 'draft'
        and ${WRITTEN_CONTENT} is not null
        and ($1::text is null or records.language = $1)
        and not exists (
              select 1
                from records as translations
               where translations.parent->>'role' = 'translation'
                 and translations.parent->>'recordId' = records.id::text
            )
      order by records.created_at desc`,
    [languageFilter],
  );

  res.status(200).json(rows.map(toPendingRecord));
});

/**
 * One record, by `?id=`. Ids are UUIDs (012_uuid_ids.sql), so a missing id or
 * one that isn't a UUID can't name a record and answers 404.
 *
 * The new "choices" variable must be in the format:
 *  "choices": {
 *       "rightToShare": true -,
 *       "studentAccess": true or false,
 *       "public": 'yes' | 'later' | 'no',
 *       "location" 'keep' | 'distance_only' | 'remove',
 *       "mentionsPeople": 'no' | 'living' | 'died' | 'not_sure',
 *   }
 *
 *   in a json form.
 *
 * The new "termsVerions" field must be in the format:
 * "termsVersion": "#"
 *
 * Where '#' is a digit in a json
 */
recordsRouter.get("/", async (req, res) => {
  const { id } = req.query;

  if (typeof id !== "string" || !UUID_PATTERN.test(id)) {
    res.status(404).json({ error: "Record not found." });
    return;
  }

  const { rows } = await pool.query<Record<string, unknown>>(
    `select records.id,
            records.site_id,
            records.contributor_id,
            records.note,
            coalesce(records."text", written_records.file_data) as "text",
            records.language,
            records.captured_at,
            records.submission,
            records.choices,
            records.terms_version,
            records.link,
            records.parent,
            records.collection_id,
            records.created_at
       from records
       left join written_records on written_records.record_id = records.id
      where records.id = $1`, //Note to self (Westley): I probably need to change this '$1'. It's most likely a placeholder
      [id],
  );

  if (rows.length === 0) {
    res.status(404).json({ error: "Record not found." });
    return;
  }

  res.status(200).json(rows[0] ? toRecord(rows[0]) : null);
});

////////////////////////////
//  HTTP POST Requests    //
////////////////////////////

/**
 * Submit a record.
 *
 * Three steps, and they are the three steps in every endpoint you will write.
 *
 * 1. Validate against the contract. `newSourceRecord` is a record as it
 *    arrives, without an id. `safeParse` returns a result rather than
 *    throwing, so the failure path is ordinary code. Never trust a request body.
 * 2. Write it, using $1 $2 $3 placeholders. The values go to Postgres
 *    separately from the query text, so nothing a person typed is ever read as
 *    SQL. Do not build a query by joining strings, ever, even when it looks
 *    harmless. This is the one rule in this file that is not a preference.
 * 3. Return what was stored, with 201 because something was created.
 *
 * The database makes the id, as a UUID (012_uuid_ids.sql), because whoever
 * stores a record decides its id. So the insert leaves `id` out and reads it
 * back from `returning`. The client still sends `createdAt`; whether the server
 * should set that as well is a design question, and it's yours.
 */
recordsRouter.post('/submit', async (req, res) => {
    const parsed = newSourceRecord.safeParse(req.body);

    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
    }

    const record = parsed.data;

    // A translation needs a language, and a record it translates that exists.
    // A `claimId` is stored as it arrives, because claims live in another
    // layer's database.
    if (record.parent?.role === 'translation') {
        if (!record.language) {
            res.status(400).json({ error: 'A translation needs a language.' });
            return;
        }

        const parentId = record.parent.recordId;
        if (parentId !== undefined) {
            const missingParent = { error: 'The record being translated does not exist.' };
            if (!UUID_PATTERN.test(parentId)) {
                res.status(400).json(missingParent);
                return;
            }
            const existing = await pool.query('select 1 from records where id = $1', [parentId]);
            if (existing.rows.length === 0) {
                res.status(400).json(missingParent);
                return;
            }
        }
    }

    const { rows } = await pool.query<Record<string, unknown>>(
        `insert into records
         (site_id, contributor_id, note, "text", language, captured_at, submission,
          choices, terms_version, link, parent, collection_id, created_at)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
             returning *`,
        [
            record.siteId,
            record.contributorId,
            record.note ?? null,
            record.text ?? null,
            record.language ?? null,
            record.capturedAt ?? null,
            record.submission,
            record.choices,
            record.termsVersion,
            record.link ?? null,
            record.parent ?? null,
            record.collectionId ?? null,
            record.createdAt,
        ],
    );

    res.status(201).json(rows[0] ? toRecord(rows[0]) : null);
});

////////////////////////////
//  HTTP PUT Requests     //
////////////////////////////



////////////////////////////
//  HTTP PATCH Requests   //
////////////////////////////



////////////////////////////
//  HTTP DELETE Requests  //
////////////////////////////


////////////////////////////
//  Helper Functions      //
////////////////////////////

/**
 * A database row back into the contract's shape.
 *
 * Postgres hands back `site_id`, nulls and dates as Date objects. The contract
 * is the agreed shape of a record, so the API answers in it and the row is
 * translated on the way out. `media` is empty because this endpoint
 * only takes written records so far; when files arrive, they get read from
 * their own table here.
 */
function toRecord(row: Record<string, unknown>) {
    const date = (v: unknown) => (v instanceof Date ? v.toISOString() : (v as string | null) ?? undefined);
    return {
        id: row.id as string,
        siteId: row.site_id as string,
        contributorId: row.contributor_id as string,
        note: (row.note as string | null) ?? undefined,
        text: (row.text as string | null) ?? undefined,
        language: (row.language as string | null) ?? undefined,
        capturedAt: date(row.captured_at),
        submission: row.submission as string,
        media: [],
        link: (row.link as Record<string, unknown> | null) ?? undefined,
        parent: (row.parent as Record<string, unknown> | null) ?? undefined,
        collectionId: (row.collection_id as string | null) ?? undefined,
        choices: row.choices as Record<string, unknown>,
        termsVersion: row.terms_version as string,
        createdAt: date(row.created_at),
    };
}

/**
 * A row from the pending-translation query, in the contract's field names.
 * Only what the list needs, plus `capturedAt` when it is known.
 */
function toPendingRecord(row: Record<string, unknown>) {
    const date = (v: unknown) => (v instanceof Date ? v.toISOString() : (v as string | null) ?? undefined);
    return {
        id: String(row.id),
        siteId: row.site_id as string,
        contributorId: row.contributor_id as string,
        language: row.language as string,
        text: (row.text as string | null) ?? undefined,
        note: (row.note as string | null) ?? undefined,
        capturedAt: date(row.captured_at),
        createdAt: date(row.created_at),
    };
}

/**
 * DO NOT REMOVE THIS EXPORT. It links this page to index.ts for API routing. Removing this will disconnect this file.
 */
export { recordsRouter };
