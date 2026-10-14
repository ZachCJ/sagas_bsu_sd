import express from "express";

const recordsRouter = express.Router();
//import db from "../db"; TODO: Uncomment when first database call is used. 

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
