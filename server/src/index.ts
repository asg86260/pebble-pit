// The board of times' server: Bun + Hono over one SQLite file, meant to sit
// behind a Cloudflare Tunnel on the owner's machine (README.md). Four routes;
// the rules are times.ts's and the routes app.ts's.

import { makeApp } from "./app";
import { TIMES_RUN_STALE_D } from "../../src/config/times.js";

process.on("unhandledRejection", (reason) => console.error("[unhandledRejection]", reason));
process.on("uncaughtException", (err) => {
  console.error("[uncaughtException]", err);
  process.exit(1);
});

const { app, times } = makeApp();

// Runs that never got a time and stopped pinging are swept once a day.
setInterval(() => {
  const n = times.sweep(Date.now());
  if (n) console.log(`swept ${n} stale run(s) older than ${TIMES_RUN_STALE_D} days`);
}, 86400 * 1000);

const port = Number(process.env.PORT) || 3100;
console.log(`pebble-pit times listening on http://127.0.0.1:${port}`);

export default { port, hostname: process.env.HOST || "127.0.0.1", fetch: app.fetch };
