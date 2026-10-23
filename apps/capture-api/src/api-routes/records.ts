import express from "express";

const recordsRouter = express.Router();
import { newSourceRecord } from "@sagas/contracts";
import { pool } from "../db";
import { randomUUID } from 'node:crypto';

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

////////////////////////////
//  HTTP GET Requests     //
////////////////////////////

recordsRouter.get("/health", (_req, res) => {
  res.json({ ok: true });
});

////////////////////////////
//  HTTP POST Requests    //
////////////////////////////

/**
 * Submit a record.
 * Three steps, and they are the three steps in every endpoint you will write.
 *
 *
 * 1. Validate against the contract. `newSourceRecord` is a record as it
 *    arrives, without an id. `safeParse` returns a result rather than
 * 2. Write it, using $1 $2 $3 placeholders. The values go to Postgres
 *    throwing, so the failure path is ordinary code. Never trust a request body.
 *    separately from the query text, so nothing a person typed is ever read as
 *    SQL. Do not build a query by joining strings, ever, even when it looks
 *    harmless. This is the one rule in this file that is not a preference.
 * 3. Return what was stored, with 201 because something was created.
 *
 * The server makes the id, because whoever stores a record decides its id.
 * Here it's a random UUID made in code, which fits the `text` id column in
 * 001_records.sql. Letting the database generate it instead is a fine choice
 * too. The client still sends `createdAt`; whether the server should set that
 * as well is a design question, and it's yours.
 */
recordsRouter.post('/records', async (req, res) => {
    const parsed = newSourceRecord.safeParse(req.body);

    if (!parsed.success) {
        res.status(400).json({ error: parsed.error.flatten() });
        return;
    }

    const record = { ...parsed.data, id: randomUUID() };

    const { rows } = await pool.query<Record<string, unknown>>(
        `insert into records
           (id, site_id, contributor_id, note, "text", language, captured_at, submission, created_at)
         values ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         returning *`,
        [
            record.id,
            record.siteId,
            record.contributorId,
            record.note ?? null,
            record.text ?? null,
            record.language ?? null,
            record.capturedAt ?? null,
            record.submission,
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
        text: (row.text as string | null) ?? undefined,
        note: (row.note as string | null) ?? undefined,
        language: (row.language as string | null) ?? undefined,
        capturedAt: date(row.captured_at),
        media: [],
        submission: row.submission as string,
        createdAt: date(row.created_at),
    };
}

/**
 * DO NOT REMOVE THIS EXPORT. It links this page to index.ts for API routing. Removing this will disconnect this file.
 */
export { recordsRouter };
