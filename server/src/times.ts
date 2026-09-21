// The board of times: the table, the clock the server keeps for every run,
// and the rules a posted time is held to. Pure over a database handle and a
// clock, so the checks run it against a memory database and a clock they
// turn by hand. The routes (index.ts) are a thin skin over this.
// DESIGN.md, "The board of times: a global competition for the rescue".

import { Database } from "bun:sqlite";
// The numbers are the game's own: one file, read by both ends.
import {
  TIMES_PING_S, TIMES_PING_SLACK, TIMES_FLOOR_MS, TIMES_TOP_MAX, TIMES_NAME_MAX, TIMES_RUN_STALE_D
} from "../../src/config/times.js";

export type Row = { id: string; ms: number; seen: number; name: string; at: number; itch: number };
export type Refusal = { status: 404 | 409 | 422; error: string };
export type Save = Record<string, unknown>;

// The cap on what one gap between pings may add: a ping after a day away
// counts as one interval, not a day.
const GAP_CAP_MS = TIMES_PING_S * TIMES_PING_SLACK * 1000;

export function openTimes(path = ":memory:") {
  const db = new Database(path);
  db.exec(`
    create table if not exists runs (
      id      text primary key,
      started integer not null,
      pinged  integer not null,
      seen    integer not null default 0,
      ip      text,
      rock    integer not null default 1,
      ms      integer,
      name    text,
      at      integer,
      itch    integer not null default 0
    );
    create index if not exists runs_ms on runs (ms) where ms is not null;
  `);

  const q = {
    insert: db.prepare("insert into runs (id, started, pinged, seen, ip, rock) values (?, ?, ?, 0, ?, ?)"),
    get: db.prepare("select * from runs where id = ?"),
    ping: db.prepare("update runs set pinged = ?, seen = ? where id = ?"),
    time: db.prepare("update runs set ms = ?, name = ?, at = ?, itch = ? where id = ?"),
    top: db.prepare("select id, ms, seen, name, at, itch from runs where ms is not null order by ms asc, at asc limit ?"),
    rank: db.prepare("select count(*) as n from runs where ms is not null and (ms < ? or (ms = ? and at < ?))"),
    count: db.prepare("select count(*) as n from runs where ms is not null"),
    stale: db.prepare("delete from runs where ms is null and pinged < ?"),
  };

  const mint = () => crypto.randomUUID().replace(/-/g, "");

  // The first rock has landed on somebody: name the run and start its clock.
  function startRun(save: Save | null, ip: string, now: number) {
    const id = mint();
    const rock = typeof save?.boulderNo === "number" ? (save.boulderNo as number) : 1;
    q.insert.run(id, now, now, ip, rock);
    return { id };
  }

  // Still under: the gap since the last ping goes on the clock, capped.
  function ping(id: string, now: number): Refusal | { seen: number } {
    const r = q.get.get(id) as Row & { pinged: number; ms: number | null } | null;
    if (!r) return { status: 404, error: "no such run" };
    if (r.ms != null) return { status: 409, error: "this run is over" };
    const gap = Math.max(0, Math.min(now - r.pinged, GAP_CAP_MS));
    const seen = r.seen + gap;
    q.ping.run(now, seen, id);
    return { seen };
  }

  // A name is one to TIMES_NAME_MAX printable characters after trimming.
  function cleanName(name: unknown): string | null {
    if (typeof name !== "string") return null;
    const s = name.trim();
    if (!s || s.length > TIMES_NAME_MAX) return null;
    if (/[\u0000-\u001f\u007f]/.test(s)) return null;
    return s;
  }

  // The rescue. `id` is null for a run the board never saw start (offline):
  // it is minted here with nothing on its clock, and the row is checked like
  // any other but for the clock. `itchName` is what itch said the key's
  // owner is called, or null.
  function postTime(
    id: string | null, ms: unknown, name: unknown, save: Save | null, itchName: string | null, ip: string, now: number
  ): Refusal | { id: string; rank: number; of: number } {
    let r: (Row & { pinged: number; ms: number | null; rock: number }) | null = null;
    if (id) {
      r = q.get.get(id) as typeof r;
      if (!r) return { status: 404, error: "no such run" };
      if (r.ms != null) return { status: 409, error: "this run already has a time" };
    }
    if (typeof ms !== "number" || !Number.isFinite(ms) || ms <= 0) return { status: 422, error: "no time" };
    // The one rule that is the server's own fact: shorter than it watched,
    // less one interval for the ping that had not landed yet. Only ever this
    // direction -- a run it saw less of is the player's lost proof.
    if (r && ms < r.seen - GAP_CAP_MS) return { status: 422, error: "shorter than the board watched" };
    if (ms < TIMES_FLOOR_MS) return { status: 422, error: "faster than the rescue can be" };
    // The save has to agree with the time it is posted with.
    if (!save || typeof save !== "object") return { status: 422, error: "no save" };
    if (save.buriedMs !== ms) return { status: 422, error: "the save's clock disagrees" };
    if (save.rescued !== true) return { status: 422, error: "the save has no rescue in it" };
    if (r && save.runId !== id) return { status: 422, error: "the save is another run's" };
    if (r && typeof save.boulderNo === "number" && (save.boulderNo as number) < r.rock) return { status: 422, error: "the save is behind the run" };
    const clean = itchName ? cleanName(itchName) : cleanName(name);
    if (!clean) return { status: 422, error: "no name" };

    if (!r) {
      const made = startRun(save, ip, now);
      id = made.id;
    }
    q.time.run(ms, clean, now, itchName ? 1 : 0, id);
    const rank = (q.rank.get(ms, ms, now) as { n: number }).n + 1;
    const of = (q.count.get() as { n: number }).n;
    return { id: id!, rank, of };
  }

  // The board, best first, and one run's own row and rank beside it.
  function board(top: number, mine: string | null) {
    const n = Math.max(1, Math.min(TIMES_TOP_MAX, Math.floor(top) || 0));
    const rows = q.top.all(n) as Row[];
    let own: (Row & { rank: number }) | null = null;
    if (mine) {
      const r = q.get.get(mine) as (Row & { ms: number | null }) | null;
      if (r && r.ms != null) {
        const rank = (q.rank.get(r.ms, r.ms, r.at) as { n: number }).n + 1;
        own = { id: r.id, ms: r.ms, seen: r.seen, name: r.name, at: r.at, itch: r.itch, rank };
      }
    }
    return { rows, mine: own, of: (q.count.get() as { n: number }).n };
  }

  // A run with no time and no ping for TIMES_RUN_STALE_D days is dropped.
  function sweep(now: number) {
    return q.stale.run(now - TIMES_RUN_STALE_D * 86400 * 1000).changes;
  }

  return { db, startRun, ping, postTime, board, sweep, cleanName };
}

export type Times = ReturnType<typeof openTimes>;
