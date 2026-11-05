import express from "express";

import { mediaRef } from "@sagas/contracts";
import { pool } from "../db";

// Exported as recordsPhotoRouter.
const router = express.Router();
//import db from "../db"; TODO: Uncomment when first database call is used. 

/**
 * All API routes for this file are prefixed with "/records".
 *   All API routes for this file are prefixed with "/photo".
 *   IMPORTANT: This is a subroute of the recordsRouter, which is prefixed with "/records". 
 *     So the full path for this router is "/records/photo".
 *   The API calls that associate with record photos should be defined here. 
 */

////////////////////////////
//  HTTP GET Requests     //
////////////////////////////

router.get("/health", (_req, res) => {
  res.json({ ok: true });
});

////////////////////////////
//  HTTP POST Requests    //
////////////////////////////

router.post("/upload", async (req, res) => {
  const parsed = mediaRef.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.flatten() });
    return;
  }

  const photo = parsed.data;
  
  const { rows } = await pool.query(
    `insert into image_records 
     (id, record_id, kind, storageKey, contentType, byteSize, checksum, originalFilename, processing, processingError, width, height, capturedAt, createdAt)
     values ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
     returning *`,
    [
      photo.id,
      photo.recordId,
      photo.kind,
      photo.storageKey,
      photo.contentType,
      photo.byteSize,
      photo.checksum,
      photo.originalFilename,
      photo.processing,
      photo.processingError,
      photo.width,
      photo.height,
      photo.capturedAt,
      photo.createdAt,
    ],);

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
export { router as recordsPhotoRouter};
