import { createRootApp } from "./app";

// Vercel service entrypoint: export the Express app itself (a
// (req, res, next) => void handler) rather than calling app.listen(),
// mirroring how app/main.py exposed its ASGI `app` object for Vercel
// to wrap instead of calling uvicorn.run() itself.
export default createRootApp();
