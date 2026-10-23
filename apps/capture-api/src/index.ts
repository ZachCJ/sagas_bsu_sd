/**
 * One endpoint, end to end.
 *
 * This exists because the gap between "I can write a function" and "I can build
 * an app" is mostly not knowing how the pieces connect. So here is the whole
 * path, once, at its narrowest: a request arrives, the contract validates it, a
 * row is written, a response goes back. Everything else you build this semester
 * is this shape, widened.
 *
 *   pnpm --filter @sagas/capture-api migrate
 *   pnpm --filter @sagas/capture-api dev
 *
 * Then, from another terminal:
 *
 *   curl -X POST http://localhost:3001/records \
 *     -H 'content-type: application/json' \
 *     -d '{
 *       "id": "rec-100",
 *       "siteId": "site-001",
 *       "contributorId": "guest-abc",
 *       "text": "My great-grandmother cooked in the boarding house kitchen.",
 *       "language": "en",
 *       "submission": "submitted",
 *       "media": [],
 *       "createdAt": "2026-09-07T12:00:00Z"
 *     }'
 */
import express from "express";

//import { sourceRecord } from "@sagas/contracts";
//import { pool } from "./db";

/**
 * Initializing routing bases for sections of the API.
 */
import { recordsRouter } from "./api-routes/records";
import { sitesRouter } from "./api-routes/sites";
import { mapRouter } from "./api-routes/map";

const app = express();

// Without this, req.body is undefined and it is not obvious why.
app.use(express.json());

/**
 * API routes for sections of the API. Each section has its own file for organization and maintainability.
 */
app.use("/records", recordsRouter);
app.use("/sites", sitesRouter);
app.use("/map", mapRouter);

/**
 * Checks whether the API is up and running from the root of the API.
 */
app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

/**
 * Anything a handler throws lands here.
 *
 * Express 5 forwards a rejected promise from an async handler to this
 * automatically. In Express 4 it did not, and a handler that threw would hang
 * the request forever with no error anywhere. That difference is most of why
 * this project is on 5.
 */

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Something failed on the server.' });
});

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => {
  console.log(`capture-api listening on http://localhost:${port}`);
});