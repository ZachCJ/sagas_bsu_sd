import express from "express";

const sitesRouter = express.Router();
//import db from "../db"; TODO: Uncomment when first database call is used. 

/**
 * All API routes for this file are prefixed with "/sites".
 *   The API calls that associate with sites should be defined here.
 *   Keep this file clean and organized for ease of finding endpoints and maintaining the codebase.
 */

////////////////////////////
//  HTTP GET Requests     //
////////////////////////////

sitesRouter.get("/health", (_req, res) => {
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
export { sitesRouter };