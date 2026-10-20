import express from "express";

const recordsRouter = express.Router();
import { sourceRecord } from "@sagas/contracts";
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

////////////////////////////
//  HTTP GET Requests     //
////////////////////////////

recordsRouter.get("/health", (_req, res) => {
  res.json({ ok: true });
});

////////////////////////////
//  HTTP POST Requests    //
////////////////////////////

recordsRouter.post('/', async (req, res) => {
  const parsed = sourceRecord.safeParse(req.body);
  //Change to have postgres manage the ID values, the site_id and contributor_id will need to be passed via query params or headers.

  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const record = parsed.data;

  const { rows } = await pool.query(
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

  res.status(201).json(rows[0] ?? null);
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


/**
 * DO NOT REMOVE THIS EXPORT. It links this page to index.ts for API routing. Removing this will disconnect this file.
 */
export { recordsRouter };
