# pebble-cloud

The cloud-save worker: every save slot mirrored on a Cloudflare Worker with
D1, behind a secret nobody types. The design is DESIGN.md, "Cloud saves: a
sync code and a worker"; the contract is `docs/wave-cloud.md`. Every number
is in `../src/config/cloud.js`, which the worker imports and wrangler bundles.

- `src/app.js` -- `handle(request, env, now)`, every route.
- `src/sweep.js` -- `sweep(env, now)`, the daily cron.
- `src/worker.js` -- the Worker's `fetch` and `scheduled`.
- `migrations/` -- the schema, as wrangler applies it; `test/d1.mjs` builds
  its in-memory database from the same files.

## Checks

From the repo root: `node --test --test-concurrency=4 cloud/test/routes.test.mjs cloud/test/ceilings.test.mjs cloud/test/pairing.test.mjs`. They run
the real `handle` over `node:sqlite`; nothing needs installing.

## Deploy

1. A Cloudflare account on the **Workers Free plan with no card on file**.
2. `cd cloud && npm install && npx wrangler login`.
3. `npx wrangler d1 create pebble-cloud`; the id into `wrangler.toml`.
4. `npx wrangler d1 migrations apply pebble-cloud --remote`.
5. `npx wrangler secret put STATS_TOKEN` and `npx wrangler secret put
   PAIR_PEPPER` (any long random string). **Never change the pepper**:
   every stored code is hashed with it, so a new one signs every device
   out, and players get back in only with their recovery codes.
6. `npx wrangler deploy`; note the URL.
7. `VITE_CLOUD_URL` set to it in the release workflow's environment, and
   `CLOUD_ON = true` in `src/config/cloud.js`, in one commit.
8. The kill switch, when it is ever needed:
   `npx wrangler deploy --var CLOUD_PAUSED:1`.

Watching it: `curl -H "Authorization: Bearer $STATS_TOKEN" <url>/stats`, and
the cron logs the same line once a day (`npx wrangler tail`).
