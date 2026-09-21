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

Deployed 2026-09-21 on the owner's machine at `https://times.graham-things.com`:
the `pebble-times` Cloudflare Tunnel (`~/.cloudflared/config-pebble.yml`,
its own tunnel beside pirate-ship's and lbs-content's, always run with
`--config`) and two logon-triggered scheduled tasks, `pebble-times-app` and
`pebble-times-tunnel`, each a supervising restart loop in `deploy/`.

```powershell
powershell -ExecutionPolicy Bypass -File server\deploy\register-tasks.ps1   # (re)register; -Remove to drop
Start-ScheduledTask -TaskName pebble-times-app; Start-ScheduledTask -TaskName pebble-times-tunnel
Get-Content server\logs\app.log -Tail 20                                      # and tunnel.log, server-err.log
```

No Cloudflare Access in front: the board is public by design, and the routes
carry their own limits. When the machine is off the board is down, and the
game says so on every surface ("the board is down right now"); a rescue
posted then waits on the save for the next boot.

The game's build reads the hostname from `VITE_TIMES_URL`: the release
workflow takes it from the `TIMES_URL` repository variable, and a local
build from a `.env.local` at the repo root. With no `VITE_TIMES_URL` the
game has no board: no button, no ping, no post.
