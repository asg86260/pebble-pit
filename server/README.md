# The board of times

The one board everybody's rescue clock goes on (DESIGN.md, "The board of
times: a global competition for the rescue"). Bun + Hono over one SQLite
file, the pirate ship's shape: it runs on the owner's machine behind a
Cloudflare Tunnel, and the game -- on itch and on the desk -- talks to it
over the tunnel's hostname.

The numbers are the game's own: `src/config/times.js` is read by both ends,
so the ping interval, the floor and the name length are one fact.

## Routes

| route | who calls it | what it does |
|---|---|---|
| `POST /runs` `{ save }` | the game, at the first rock | names the run and starts the server's clock; replies `{ id }` |
| `POST /runs/:id/ping` | the game, every `TIMES_PING_S` while the sqwife is under | adds the gap since the last ping, capped at `TIMES_PING_SLACK` intervals |
| `POST /runs/:id/time` `{ ms, name, save, itch }` | the game, at the rescue | the row, or a refusal (below) |
| `POST /runs/time` | the same, for a run the board never saw start (offline) | mints the id now, with nothing watched |
| `GET /times?top=N&mine=<id>` | the sheet and the landing page | `{ rows, mine, of }`, best first |
| `GET /health` | uptime checks | `{ ok: true }` |

A time is refused, in this order: an unknown run (`404`); a run that already
has a time (`409`); a time shorter than the server watched, less one
interval (`422`); under `TIMES_FLOOR_MS` (`422`); a save whose `buriedMs`,
`rescued`, `runId` or `boulderNo` disagrees (`422`); a name that is not one
to `TIMES_NAME_MAX` printable characters (`422`). Per ip: a run and a time
ten seconds apart, a ping every half interval (`429`); a refused time hands
the turn back.

`itch` is the key the itch desktop app puts in a launched game's environment
(`ITCHIO_API_KEY`); with one, the server asks `itch.io/api/1/jwt/me` whose it
is and puts that name on the row, badged. The key is never stored.

## Running

```powershell
cd server
bun install
bun run dev                       # 127.0.0.1:3100, times.sqlite beside it, restarts on edit
bun run --bun test ./test/times.test.ts
```

`PORT`, `HOST` and `TIMES_DB` (the SQLite path) are the environment; nothing
else is. Runs with no time and no ping for `TIMES_RUN_STALE_D` days are swept
once a day.

## Deploying

The same as the pirate ship's `deploy/`: `cloudflared tunnel create
pebble-times`, route a hostname to it, point the tunnel's `config.yml` at
`http://127.0.0.1:3100`, and run the server under a supervising scheduled
task (copy `run-app.ps1` and `run-tunnel.ps1` from there; change the root,
the port and the mutex name). No Cloudflare Access in front: the board is
public by design, and the routes carry their own limits.

Then the game's build needs the hostname: `VITE_TIMES_URL=https://<host>` in
the environment of `vite build` (a `.env.local` at the repo root works for a
local build; the release workflow wants it as a repository variable). With
no `VITE_TIMES_URL` the game has no board: no button, no ping, no post.
