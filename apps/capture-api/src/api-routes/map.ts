import express from "express";

const mapRouter = express.Router();
//import db from "../db"; TODO: Uncomment when first database call is used. 

/**
 * All API routes for this file are prefixed with "/map".
 *   The API calls that associate with map systems should be defined here. 
 *   This one will be complex as it handles many layers of relationships and data.
 *   Keep this file clean and organized for ease of finding endpoints and maintaining the codebase.
 */

////////////////////////////
//  HTTP GET Requests     //
////////////////////////////

mapRouter.get("/health", (_req, res) => {
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
export { mapRouter };