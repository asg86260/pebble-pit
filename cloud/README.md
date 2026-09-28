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

## Watching it

- **`/stats`**: `curl -H "Authorization: Bearer $STATS_TOKEN" <url>/stats`.
  Today's pushes and bytes against their caps, vaults, and `refused`:
  today's and yesterday's refused requests by status. Each count stops at
  `CLOUD_REFUSALS_COUNTED` (1,000), so a count at it means "at least".
  What to read in it: **403** is a page the worker does not know (a new
  itch host would show here first, and every web player would be locked
  out); **401** is signed-out devices or guessing; **429** caps being met;
  **500** is a fault -- there should be none.
- **Workers Logs** (dashboard → Workers → pebble-cloud → Observability):
  every refused request is one JSON line, `{ refused, route, origin }`, with
  no code and no ip. Filter on `refused = 403` and group by `origin` to see
  which pages were turned away.
- **The daily cron** logs the stats as one line, refusals included
  (`npx wrangler tail` while it runs).

A new migration is applied before the deploy that needs it:
`npx wrangler d1 migrations apply pebble-cloud --remote`, then
`npx wrangler deploy`.
