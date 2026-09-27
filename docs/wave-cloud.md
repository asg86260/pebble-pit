# Wave: cloud saves -- a sync code, a pairing code and a worker

**Status: DRAFT 2026-09-27, the design signed; awaiting the owner's sign-off
on this spec's "Decided here". Once signed, this document is canon.
Subagents: do not redesign; implement.** Where a number, a name, a route or a status code is
written here, use it. Where this document is silent, DESIGN.md "Cloud saves:
a sync code and a worker" decides. If something turns out to be impossible,
say so in the report rather than inventing a different feature.

## What is being built, in one paragraph

Every save slot gets a copy in the cloud, on a Cloudflare Worker with D1,
behind a hundred-bit secret that nobody types. The local store stays exactly
what play reads and the autosave writes; the cloud is pulled once at boot
(three seconds at most) and pushed in the background, at most once a minute
and only when the yard has moved. A second device joins with a six-character
pairing code that works once and dies in ten minutes; the secret itself is
shown only as a recovery code on the settings pages. Two new saved fields,
`yardId` and `playedS`, decide which of two copies is newer, and two
different yards are never overwritten without the player choosing. Every
way the mirror can grow has a ceiling the worker enforces itself, and every
refusal leaves the yard saving locally as if the cloud were down. The title
page's foot bar carries the cloud line (mock A1).

## What is being optimized

**No refusal, outage or bug in the cloud can cost a yard.** Where scope has
to give, give on the polish of a line of text, never on that, never on the
worker's ceilings, never on a save from before this wave.

## House rules (CLAUDE.md, not optional)

`config.js` owns every number and `state.js` every fact that changes; every
new field on `S` goes in one of state.js's three lists. Comments say why, in
the register of `air.js` or `save.js`. American English. Black and white.
Hover and panel text is one short line. Buy it like a player: the node
check drives the same functions the buttons call, and the browser group
clicks the real footnote. The game gains no dependency: the worker is its
own package in `cloud/` with no runtime dependencies at all (plain module
Workers, no Hono), and `wrangler` is that package's only dev dependency.

## Decided here (the design left these open)

1. **A vault has an id apart from its secret.** Slots and pairings hang off
   `vaults.id`; the secret's hash is a column on the vault, so a new
   recovery code is one row updated and the slots stay where they are.
2. **The worker's code and the game's numbers are shared.** The worker
   imports `src/config/cloud.js` by relative path; wrangler bundles it. No
   number is written twice.
3. **One contract, no fake.** The worker exports `handle(request, env,
   now)`; its tests and the game's node tests both run the real `handle`
   against `node:sqlite` through a small D1 adapter (`cloud/test/d1.mjs`,
   `prepare/bind/first/all/run` and `env.DB.batch`). The node yard's
   `fetch` is stubbed to call `handle` in-process. A fake worker would be a
   second copy of the contract to drift.
4. **The client runs on a pump, not a timer it owns.** `cloud.js` exports
   `pump(nowMs)` that does whatever is due; the browser calls it from one
   `setInterval` of `CLOUD_PUMP_MS`, and the node checks call it with their
   own clock. No check sleeps.
5. **The ip is stored hashed.** Rate-limit rows key on
   `sha256(ip + utc day)`, from `CF-Connecting-IP`. No raw ip is written.
6. **Keepalive has a size cap.** A `pagehide` push goes with `keepalive`
   only when the gzipped blob is under `CLOUD_KEEPALIVE_MAX` (64 kb, the
   browser's cap); a larger one waits for the next boot's push.
7. **Where cloud is off by build.** `CLOUD_ON` false, or `VITE_CLOUD_URL`
   empty, or the page is the title's demo frame, the scene bench, or a
   staged yard: `cloud.js` does nothing at all, and the foot bar shows no
   cloud line. The wave lands with `CLOUD_ON = false`; the owner flips it
   after the worker is deployed (see "Deploy").
8. **The format guard reads `saveV`.** A pushed slot carries `SAVE_V`. A
   cloud slot whose `saveV` is above this build's is neither taken nor
   pushed over; the status says `newer on another device: update to take
   it`.

## The contract (canon for both ends)

### Codes

Crockford base 32, `0123456789ABCDEFGHJKMNPQRSTVWXYZ`, drawn from
`crypto.getRandomValues`. Input is normalized before use: uppercase, `O` to
`0`, `I` and `L` to `1`, dashes and spaces dropped.

- **Secret**: `CLOUD_SECRET_LEN` (20) characters, shown
  `PEBBLE-XXXX-XXXX-XXXX-XXXX-XXXX`; the prefix is dropped on input.
- **Pairing code**: `CLOUD_PAIR_LEN` (6) characters, shown `XXX-XXX`.

The worker stores a hash of each, hex, never the code: `sha256(secret)` for
a secret, and `sha256(env.PAIR_PEPPER + pair)` for a pairing code, where
`PAIR_PEPPER` is a worker secret. A pairing code is only thirty bits, so an
unpeppered hash in a leaked database could be reversed in seconds; with the
pepper, the database alone gives nothing.

**How a claim hands back the secret.** The worker keeps only the secret's
hash, so it cannot give back a secret it never stored. A pairing therefore
carries it for its ten minutes: `POST /pairings` is called with the secret
as bearer, and the pairing row keeps it encrypted, `AES-GCM` under the key
`sha256(env.PAIR_PEPPER + '/key/' + pair)`, with its `iv`. The claim derives
the key from the pair it was given, decrypts, deletes the row, and answers
with the vault's own secret. The secret is at rest only while a pairing is
live, and only under a key that neither the database nor the pair alone
yields.

### Schema (`cloud/schema.sql`, applied by `wrangler d1 migrations`)

```sql
CREATE TABLE vaults  (id TEXT PRIMARY KEY, hash TEXT UNIQUE NOT NULL,
                      created INTEGER NOT NULL, seen INTEGER NOT NULL,
                      pushed INTEGER NOT NULL DEFAULT 0,
                      day TEXT NOT NULL DEFAULT '', day_writes INTEGER NOT NULL DEFAULT 0);
CREATE TABLE slots   (vault TEXT NOT NULL, n INTEGER NOT NULL, rev INTEGER NOT NULL,
                      yard_id TEXT NOT NULL, played_s INTEGER NOT NULL, save_v INTEGER NOT NULL,
                      size INTEGER NOT NULL, at INTEGER NOT NULL, body BLOB NOT NULL,
                      PRIMARY KEY (vault, n));
CREATE TABLE pairings(hash TEXT PRIMARY KEY, vault TEXT UNIQUE NOT NULL, expires INTEGER NOT NULL,
                      wrapped BLOB NOT NULL, iv BLOB NOT NULL);
CREATE TABLE limits  (key TEXT PRIMARY KEY, until INTEGER NOT NULL, n INTEGER NOT NULL);
CREATE TABLE totals  (id INTEGER PRIMARY KEY CHECK (id = 1), bytes INTEGER NOT NULL,
                      day TEXT NOT NULL, writes INTEGER NOT NULL,
                      fail_hour INTEGER NOT NULL, fails INTEGER NOT NULL);
INSERT INTO totals VALUES (1, 0, '', 0, 0, 0);
```

A cleared slot is a row with an empty `body` and `size` 0, never a deleted
row.

### Routes

Every route answers `503` with `Retry-After: 86400` and touches nothing when
`env.CLOUD_PAUSED === '1'`. `Authorization: Bearer <secret>` is read on the
routes marked *auth*; an unknown secret is `401`. Every response carries
open CORS (`*`, methods `GET, POST, PUT, DELETE`, headers `authorization,
content-type, if-match, x-yard-id, x-played-s, x-save-v`). Times are ms.

| route | answers |
|---|---|
| `POST /vaults` | `201 { code }`. `429 { retryS }` past `CLOUD_MINTS_IP_DAY` (3) for the ip today. |
| `GET /slots` *auth* | `200 { slots: [m1, m2, m3] }`, each `null` or `{ rev, yardId, playedS, saveV, size, at }`. Sets `seen` at most once a day. |
| `GET /slots/:n` *auth* | `200`, the gzipped body, `content-type: application/gzip`, `x-rev`. `404` for no row. |
| `PUT /slots/:n` *auth* | Headers `if-match` (the base rev, `0` for none), `x-yard-id`, `x-played-s`, `x-save-v`; body the gzipped blob (empty for a cleared slot). In this order: `413` over `CLOUD_BLOB_MAX`; `429 { retryS }` within `CLOUD_PUSH_FLOOR_S` of the slot's `at`; `429 { retryS }` past `CLOUD_VAULT_DAY_WRITES` for the code today; `503` with `Retry-After` to midnight UTC past `CLOUD_DAY_WRITES` today; `412 { slot }` (the meta, as `GET /slots` gives it) when the row's rev is not `if-match`; `507` when `totals.bytes` less the old size plus the new would pass `CLOUD_BYTES_MAX`; else one `batch` of the slot row (rev + 1), the vault's day count and `pushed`, and the totals, and `200 { rev }`. |
| `POST /pairings` *auth* | Deletes the vault's live pairing, writes a new one, `200 { pair, expiresS: CLOUD_PAIR_S }`. |
| `POST /pairings/claim` `{ pair }` | `429 { retryS }` past `CLOUD_PAIR_TRIES` wrong claims from the ip in `CLOUD_PAIR_TRIES_S`, or past `CLOUD_PAIR_FAILS_HOUR` wrong claims across the worker this hour. A live pairing is deleted and answered `200 { code }`, the vault's secret (above). Anything else `404`, counted as a wrong claim. |
| `POST /vaults/me/rotate` *auth* | A new secret for the same vault, `200 { code }`; the old one is `401` from now. |
| `DELETE /vaults/me` *auth* | The vault, its slots and pairing deleted, bytes subtracted, `204`. |
| `GET /stats` | `Authorization: Bearer <env.STATS_TOKEN>`, else `401`. `200 { day, writes, capWrites, bytes, capBytes, vaults }`. |
| `GET /health` | `200 { ok: true }`. |

### The daily cron (`scheduled`)

Deletes vaults with `pushed = 0` older than `CLOUD_EMPTY_D` (7) days and any
vault unseen for `CLOUD_STALE_D` (180), subtracting their slots' bytes;
deletes expired pairings and `limits` rows past `until`; logs one line,
`cloud: <day> writes <n>/<cap> bytes <n>/<cap> vaults <n>`.

## The numbers -- `src/config/cloud.js` (owner: SYNC; the worker reads it)

```js
export const CLOUD_ON = false;           // flipped by the owner after deploy
export const CLOUD_URL = (CLOUD_ON && typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_CLOUD_URL) || '';
export const CLOUD_BOOT_MS = 3000;
export const CLOUD_TIMEOUT_MS = 5000;
export const CLOUD_PUMP_MS = 5000;
export const CLOUD_PUSH_S = 60;
export const CLOUD_PUSH_FLOOR_S = 30;
export const CLOUD_PUSH_HOUR_MAX = 90;
export const CLOUD_BACKOFF_MAX_S = 1800;
export const CLOUD_KEEPALIVE_MAX = 65536;
export const CLOUD_BLOB_MAX = 262144;
export const CLOUD_BYTES_MAX = 1073741824;
export const CLOUD_MINTS_IP_DAY = 3;
export const CLOUD_EMPTY_D = 7;
export const CLOUD_STALE_D = 180;
export const CLOUD_VAULT_DAY_WRITES = 1500;
export const CLOUD_DAY_WRITES = 25000;
export const CLOUD_SECRET_LEN = 20;
export const CLOUD_PAIR_LEN = 6;
export const CLOUD_PAIR_S = 600;
export const CLOUD_PAIR_TRIES = 5;
export const CLOUD_PAIR_TRIES_S = 600;
export const CLOUD_PAIR_FAILS_HOUR = 1000;
```

Each with a one-line why above it, in the register of `config/times.js`.
Re-exported from the `config.js` barrel in one block.

## The game side (owner: SYNC)

### State and the save

- `S.yardId` (string) and `S.playedS` (number), both in `SAVED`. `yardId` is
  minted in the new-game path of `persist.js` from `crypto.getRandomValues`
  (never the seeded `rng.js`: two seeded yards would share an id).
  `playedS` grows by the frame's `dt` in one `STEPS` entry (`game.js`,
  additive), never on a staged yard.
- Migration `src/migrations/2026-09-28-cloud.js`, `v` = the `SAVE_V` at
  build time plus one (7 today; 8 if the party wave lands first), `says:
  null`: `yardId` minted where missing, `playedS` 0 where missing.
- save.js: `boulder-clicker/cloud` joins `OURS()` (primed into IndexedDB like
  the slots). New exports, each a thin use of what is there:
  `writeSlot(n, raw)` (any slot, web or desk), `savePrevOf(n, raw)`, and
  `onSaved(fn)`, called with the slot after every write that took. No other
  save.js behavior changes.

### `src/cloud.js`

The only module that talks to the worker. Its state is one JSON blob under
`boulder-clicker/cloud`: `{ secret, base: {n: rev}, pushed: {n: playedS},
at }`. Exports:

- `cloudReady()` -- configured, not demo, bench or staged.
- `cloudBoot()` -- after `primeStore`, before `restore`, in `main.js` and
  `title.js`. `GET /slots` with `CLOUD_BOOT_MS`; per slot the rules of
  DESIGN.md "The sync" (same yard and higher `playedS` in the cloud: fetch,
  `isSave`, local to `savePrevOf`, `writeSlot`; different yards: add to
  `conflicts()`; newer `saveV`: mark). Resolves on time whatever the
  network does.
- `pump(nowMs)` -- one push a dirty slot at most every `CLOUD_PUSH_S`, only
  when its `playedS` moved or it was cleared; the backoff (doubling, capped
  at `CLOUD_BACKOFF_MAX_S`, `Retry-After` obeyed), the hour cap, and the
  per-slot stops for `413`, `507` and `412`-behind.
- `flush()` -- the `pagehide` / desk-close push, keepalive under the cap.
- `startCloud()`, `makePair()`, `claimPair(pair)`, `useRecovery(code)`,
  `rotate()`, `stopCloud()` -- the buttons' verbs. The two that link run
  `cloudBoot`'s comparison at once and fill `conflicts()`.
- `conflicts()` -> `[{ n, here, cloud }]` (the two blobs' lines as
  `slotLabels` writes them) and `choose(n, 'here' | 'cloud')`.
- `takeCloud(n)`, `keepHere(n)` -- the answers to a `412` from a device
  ahead.
- `cloudStatus()` -> `{ state, at, pair }`, `state` one of `off`, `ok`,
  `offline`, `behind`, `newer`, `big`, `full`, `paused`, `conflict`.
- `setCloudUrl(url)`, `setCloudFetch(fn)` -- for checks; hooks.js gains
  `__cloudUrl` and `__cloudFetch` (additive, beside `__timesUrl`).

`gzip` is `CompressionStream('gzip')`, present in every browser the game
runs in, in Electron and in node.

## The face (owner: FACE)

- **The foot bar** (`index.html`, `title.js`, `title.css` additive block):
  `<span id="cloud" class="cloud"></span>` after `#build`, drawn exactly as
  A1 of `docs/mocks/cloud-footnote-2026-09-27.html`. The lines, all
  lowercase in source, uppercased by the bar's CSS:
  - off: `cloud · off · enter a code`
  - ok: `■ cloud · saved 2 min ago · link a device` (the time from
    `since()` in slots.js)
  - pairing: `link code K7Q-94M 9:41 · done`, counting down, back to ok at
    zero
  - entering: an input (`···-···`), `link`, `cancel`; a wrong code says
    `that code didn't work` in `#said`
  - offline: `cloud · not saved: offline`; behind: `cloud · newer on
    another device`; newer: `cloud · update to take the newer save`; big:
    `cloud · too big for the cloud`; full: `cloud · the cloud is full`;
    paused: `cloud · paused`; conflict: `cloud · choose a yard` (opens the
    conflict pane).
- **`src/cloudsheet.js`**, `showCloud(el, say)`, drawn in the title
  column's settings pane and on the held sheet's saves page, the way
  `showSlots` serves both: off: *keep my yards in the cloud* (then the
  recovery code, once, with *copy* and `write this down: it brings your
  yards back on a new device`) and *use a recovery code*; on: the status
  line, *show recovery code*, *new recovery code* (armed, like reset),
  *stop*.
- **The conflict pane**: one row a slot, two buttons, `this device · <line>`
  and `cloud · <line>`.
- **In play**, `behind` raises one notice (`notices.js`) pointing at the
  sheet, whose saves page carries *take it* and *keep this one*.

## Tracks and ownership

| track | owns | tests it writes |
|---|---|---|
| **WORKER** | `cloud/**` (new: `package.json`, `wrangler.toml`, `schema.sql`, `src/app.js` with `handle`, `src/worker.js` with `fetch` and `scheduled`, `test/d1.mjs`, `test/*.test.mjs`, `README.md`) | `cloud/test/routes.test.mjs`, `cloud/test/ceilings.test.mjs`, `cloud/test/pairing.test.mjs` |
| **SYNC** | `src/cloud.js` (new), `src/config/cloud.js` (new), `src/save.js`, `src/persist.js`, `src/migrations/2026-09-28-cloud.js` (new) + its line in `index.js`, `src/config/saves.js`, `src/state.js`, `src/hooks.js` (additive), `src/verify.js` (one rule) | `test/cloud-sync.test.mjs`, `test/cloud-limits.test.mjs`, `test/cloud-size.test.mjs` |
| **FACE** | `src/cloudsheet.js` (new), `src/title.js`, `index.html`, `src/title.css`, `src/settings.js`, `play.html` (the saves page only), `src/selftest/cloud.js` (new) | browser group `cloud` |

Shared, additive-only, one block at the end under a comment naming the
track: `src/config.js` (SYNC), `src/game.js` STEPS (SYNC), `src/main.js`
(SYNC: the `cloudBoot` call after `primeStore` and the `pump` interval and
`flush` listener; nothing else), `src/notices.js` (FACE), `src/selftest.js`
(FACE, one import and one entry), `DESIGN.md`, `TODO.md`, `CHANGELOG.md`
(the orchestrator, at merge).

**Order of work.** A skeleton commit on `wave-cloud` first: `src/config/
cloud.js` complete, `cloud/test/d1.mjs` complete, `cloud/src/app.js` with
`handle` answering `501` on every route, and `src/cloud.js` with every
export above as a stub. Then the three tracks run in parallel; SYNC's node
checks go green as WORKER's routes land, so SYNC merges WORKER's branch in
before its final run.

## Checks

- **`cloud/test/*.test.mjs`** (WORKER, `node --test` in `cloud/`, against
  `handle` and `d1.mjs`): every route's happy path; the conditional PUT
  under two writers (one `200`, one `412`); no secret or pairing code
  anywhere in the database in the clear, and `pairings.hash` changes with
  `PAIR_PEPPER`; the claim returns the vault's secret once and `404`s the
  second time, after `CLOUD_PAIR_S`, and after a newer pairing; every
  ceiling in the PUT's order (`413`, the floor, the code's day cap, the
  worker's day cap, `507`); mints past the ip cap; both claim caps;
  `CLOUD_PAUSED` answering `503` before any statement runs (the adapter
  counts them); the cron's sweeps and its byte subtraction; `rotate` makes
  the old secret `401`.
- **`test/cloud-sync.test.mjs`** (SYNC, node yard, fetch into `handle`):
  `startCloud()` pushes the open yard; a second store `claimPair`s and boots
  it; `useRecovery` does the same with no other device; the higher
  `playedS` wins both ways; a `412` on a device that is behind stops its
  pushes and `keepHere` / `takeCloud` each do what they say; two different
  yards land in `conflicts()` and neither is overwritten until `choose`; a
  cleared slot stays cleared on the other device; a cloud blob that fails
  `isSave` is never written; a newer `saveV` is neither taken nor pushed
  over; a dead fetch boots the local yard inside `CLOUD_BOOT_MS`; an old save
  from `test/fixtures/` gets a `yardId` and `playedS` 0 on load.
- **`test/cloud-limits.test.mjs`** (SYNC): an autosave at sixty a second
  for ten game minutes sends ten pushes; a yard that does not move sends
  none; `429` and `503` double the wait and obey `Retry-After`; `413`,
  `507` and the hour cap each stop pushing while the local save keeps
  writing (`S.unsaved` stays false).
- **`test/cloud-size.test.mjs`** (SYNC): `quarry-crossing.json` gzipped is
  under a quarter of `CLOUD_BLOB_MAX`.
- **`verify.js`** (SYNC): `S.playedS` is finite, at least 0, and never
  lower than on the frame before.
- **Browser group `cloud`** (FACE, `src/selftest/cloud.js`; the page cannot
  reach `handle`, so `__cloudFetch` answers from a scripted list): the foot bar shows nothing with cloud unset;
  *link a device* shows a code and it counts down; *enter a code* with a
  good code links and with a bad one says so; the conflict pane's buttons
  call `choose`; the settings pane's *keep my yards in the cloud* shows the
  recovery code once.
- `test/persist-roundtrip.test.mjs` covers the two fields unasked.

Run only these files, `--test-concurrency=4`, in the foreground. **No full
suites** in the wave; the orchestrator runs both tiers once on main after
the merge.

## Deploy (the owner, after the merge; WORKER writes it into `cloud/README.md`)

1. A Cloudflare account on the **Workers Free plan with no card on file**.
2. `cd cloud && npm install && npx wrangler login`.
3. `npx wrangler d1 create pebble-cloud`; the id into `wrangler.toml`.
4. `npx wrangler d1 migrations apply pebble-cloud --remote`.
5. `npx wrangler secret put STATS_TOKEN` and `npx wrangler secret put
   PAIR_PEPPER` (any long random string; changing it kills live pairings
   and nothing else).
6. `npx wrangler deploy`; note the URL.
7. `VITE_CLOUD_URL` set to it in the release workflow's environment, and
   `CLOUD_ON = true` in `src/config/cloud.js`, in one commit.
8. The kill switch, when it is ever needed:
   `npx wrangler deploy --var CLOUD_PAUSED:1`.

## Worktrees and reports

As CLAUDE.md "Waves": `Agent({ isolation: "worktree" })`, first command
`git fetch origin && git reset --hard origin/wave-cloud && git switch -c
cloud-<track>`. Vite ports WORKER 5321 (it needs none unless it checks the
page), SYNC 5322, FACE 5323; `CDP_PORT` 9321, 9322, 9323; never 5183 or
5184; headless; tear every server down. Tests in the foreground. Push the
track branch as you go. Report: deliverables one line each, files touched,
the **pasted** test output, shot paths (FACE: the title page in each foot
bar state), what you had to decide, and what you think is wrong with this
document.

## Open, for the owner

1. **The worker's hostname.** `workers.dev` works as is; a
   `saves.graham-things.com` route is one line in `wrangler.toml` once
   chosen.
2. **The numbers** are first guesses, all in `src/config/cloud.js`.
