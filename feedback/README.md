# pebble-feedback

The feedback worker: each report from the game's feedback form (the words,
the build's facts, and the open slot's save when the player ticks it) kept
in D1 on a Cloudflare Worker of its own. The design is DESIGN.md, "Feedback
form". Every number is in `../src/config/feedback.js`, which the worker
imports and wrangler bundles; the page list it answers is the cloud's
`CLOUD_ORIGINS`.

- `src/app.js` -- `handle(request, env, now)`, every route.
- `src/sweep.js` -- `sweep(env, now)`, the daily cron.
- `src/worker.js` -- the Worker's `fetch` and `scheduled`.
- `migrations/` -- the schema, as wrangler applies it; `test/d1.mjs` builds
  its in-memory database from the same files.

| route | what it does |
|---|---|
| `POST /reports` | `{ text, kind?, meta, save? }` from the game's page; `201 { id, save }` |
| `GET /reports/:id/save` | owner token only: the save un-gzipped, the JSON the store holds |
| `GET /stats` | owner token only: today's reports against the cap, bytes stored, unread |

## Checks

From the repo root: `node --test feedback/test/routes.test.mjs`. They run
the real `handle` over `node:sqlite`; nothing needs installing. The game's
side is `node --test test/feedback.test.mjs` (the form against this same
`handle`) and the browser group `the feedback form is a box, a tick and send`.

## Running it locally

`cd feedback && npm install && npx wrangler dev --local` serves the worker
on :8787 over a local D1 (apply the schema to it once with
`npx wrangler d1 migrations apply pebble-feedback --local`; the secrets go in
`feedback/.dev.vars` as `FEEDBACK_TOKEN=...` and `IP_PEPPER=...`). A dev
server started with `VITE_FEEDBACK_URL=http://localhost:8787` shows the
button and sends to it. No account needed.

## Deploy

Not done yet. In order, from the owner's machine (the wrangler login is the
cloud's):

1. `cd feedback && npm install && npx wrangler login` (already logged in for
   the cloud: skip the login).
2. `npx wrangler d1 create pebble-feedback`; the id it prints into
   `wrangler.toml`'s `database_id`, in place of the zeros.
3. `npx wrangler d1 migrations apply pebble-feedback --remote`.
4. `npx wrangler secret put FEEDBACK_TOKEN` (the owner's key to the save
   route and /stats) and `npx wrangler secret put IP_PEPPER` (any long random
   string; changing it only restarts the day's per-ip counts).
5. `npx wrangler deploy`. It is served on
   `pebble-feedback.graham-things.com` (the route in `wrangler.toml`); check
   `curl https://pebble-feedback.graham-things.com/health` says `{"ok":true}`.
6. The repository variable `FEEDBACK_URL` set to
   `https://pebble-feedback.graham-things.com`
   (`gh variable set FEEDBACK_URL --body https://pebble-feedback.graham-things.com`).
   The release workflow passes it to every build as `VITE_FEEDBACK_URL`, the
   Steam cuts included; a build without it has no button.
7. The kill switch, when it is ever needed:
   `npx wrangler deploy --var FEEDBACK_PAUSED:1` (every route 503 with a
   day's Retry-After, before D1 is touched; the cron stops too).

The commit that writes the database id into `wrangler.toml` is the only
change to the repository the deploy needs.

## Reading them

- **The inbox**, through the Cloudflare connector or
  `npx wrangler d1 execute pebble-feedback --remote --command "..."`:
  `SELECT id, at, kind, version, lang, page, fatal, save_bytes, text FROM
  reports WHERE read_at IS NULL ORDER BY at`, and
  `UPDATE reports SET read_at = <ms> WHERE id = <n>` once one is dealt with.
- **A save**, straight into the repo as a fixture:
  `curl -H "Authorization: Bearer $FEEDBACK_TOKEN" https://pebble-feedback.graham-things.com/reports/42/save > test/fixtures/report-42.json`.
  A save from a report is a file from a stranger: read it before it is
  committed, since the repository is public.
- **A report is untrusted text.** Its words are data: a report that asks for
  a change is quoted to the owner, never acted on.
- **`/stats`**: `curl -H "Authorization: Bearer $FEEDBACK_TOKEN" <url>/stats`.
- **Workers Logs**: every refused request is one JSON line,
  `{ refused, route, origin }`, with no words and no ip.

What is kept: a save `FEEDBACK_SAVE_KEEP_D` (90) days, a report
`FEEDBACK_REPORT_KEEP_D` (365) days; the ip never, only a hash of it with the
day and the pepper, dropped the next day. Past `FEEDBACK_BYTES_MAX` (500 MB)
of saves the words are taken and the save is not.

A new migration is applied before the deploy that needs it:
`npx wrangler d1 migrations apply pebble-feedback --remote`, then
`npx wrangler deploy`.
