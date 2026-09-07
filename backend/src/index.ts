import express from "express";
import { createRootApp } from "./expressApp";
import { settings } from "./config";

// Vercel's Express framework preset auto-detects this file by scanning for
// a canonical entrypoint name (index/app/server, optionally under src/) that
// imports the "express" package and either exports the app as a default
// export or calls .listen() — this must be the ONLY such candidate file, or
// detection picks the wrong one. See backend/src/expressApp.ts for the
// actual app assembly (kept under a non-canonical name on purpose).
void express;

const app = createRootApp();

app.listen(settings.port, () => {
  console.log(`Regale Hotels API listening on http://127.0.0.1:${settings.port}`);
});
