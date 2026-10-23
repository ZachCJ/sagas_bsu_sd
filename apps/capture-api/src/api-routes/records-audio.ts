import express from "express";

// Exported as recordsAudioRouter.
const router = express.Router();
//import db from "../db"; TODO: Uncomment when first database call is used. 

/**
 * All API routes for this file are prefixed with "/records".
 *   All API routes for this file are prefixed with "/audio".
 *   IMPORTANT: This is a subroute of the recordsRouter, which is prefixed with "/records". 
 *     So the full path for this router is "/records/audio".
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
export { router as recordsAudioRouter };
