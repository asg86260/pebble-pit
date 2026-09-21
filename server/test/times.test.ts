// The board's rules, one a check, against a memory database and a clock
// turned by hand. `bun test` from server/.

import { describe, expect, test } from "bun:test";
import { makeApp } from "../src/app";
import { openTimes } from "../src/times";
import {
  TIMES_PING_S, TIMES_PING_SLACK, TIMES_FLOOR_MS, TIMES_TOP_MAX, TIMES_RUN_STALE_D
} from "../../src/config/times.js";

const MIN = 60_000;
const GAP_CAP = TIMES_PING_S * TIMES_PING_SLACK * 1000;

// A server with a clock and a caller the check owns.
function stand(whoIs = async (_k: string) => null as string | null) {
  let t = 1_000_000_000_000;
  let who = "a";
  const times = openTimes(":memory:");
  const { app } = makeApp({ times, now: () => t, whoIs, ipOf: () => who });
  const req = async (method: string, path: string, body?: unknown) => {
    const r = await app.request(path, {
      method,
      headers: body === undefined ? {} : { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    return { status: r.status, json: (await r.json()) as any };
  };
  return {
    times,
    tick: (ms: number) => { t += ms; },
    now: () => t,
    as: (ip: string) => { who = ip; },
    start: (save: any = { boulderNo: 1 }) => req("POST", "/runs", { save }),
    ping: (id: string) => req("POST", `/runs/${id}/ping`, {}),
    time: (id: string | null, body: any) => req("POST", id ? `/runs/${id}/time` : "/runs/time", body),
    board: (q = "") => req("GET", `/times${q}`),
  };
}

// A save that agrees with the time it goes up with.
const saveFor = (id: string | null, ms: number, more: any = {}) =>
  ({ buriedMs: ms, rescued: true, runId: id, boulderNo: 3, ...more });

// A run played honestly for `ms`: registered, pinged every interval.
async function play(s: ReturnType<typeof stand>, ms: number) {
  const { json: { id } } = await s.start();
  for (let left = ms; left > 0; left -= TIMES_PING_S * 1000) {
    s.tick(TIMES_PING_S * 1000);
    await s.ping(id);
  }
  return id as string;
}

describe("the run", () => {
  test("registering names it, and the clock starts at nought", async () => {
    const s = stand();
    const { status, json } = await s.start();
    expect(status).toBe(200);
    expect(json.id).toMatch(/^[0-9a-f]{32}$/);
  });

  test("a ping adds the gap, capped at the slack", async () => {
    const s = stand();
    const { json: { id } } = await s.start();
    s.tick(30_000);
    expect((await s.ping(id)).json.seen).toBe(30_000);
    s.tick(86400_000);                           // a day away
    expect((await s.ping(id)).json.seen).toBe(30_000 + GAP_CAP);
  });

  test("a ping on a run the board does not know is 404", async () => {
    const s = stand();
    expect((await s.ping("nope")).status).toBe(404);
  });
});

describe("the time", () => {
  test("an honest run is a row with a rank", async () => {
    const s = stand();
    const ms = 10 * MIN;
    const id = await play(s, ms);
    const { status, json } = await s.time(id, { ms, name: "bob", save: saveFor(id, ms) });
    expect(status).toBe(200);
    expect(json).toMatchObject({ id, rank: 1, of: 1 });
  });

  test("shorter than the board watched is refused, less one interval", async () => {
    const s = stand();
    const id = await play(s, 10 * MIN);
    const ms = 10 * MIN - GAP_CAP - 1;
    const r = await s.time(id, { ms, name: "bob", save: saveFor(id, ms) });
    expect(r.status).toBe(422);
    expect(r.json.error).toMatch(/watched/);
  });

  test("longer than the board watched is fine: a dropped network is not held against you", async () => {
    const s = stand();
    const { json: { id } } = await s.start();
    s.tick(MIN); await s.ping(id);              // watched a minute
    const ms = 90 * MIN;                         // played an hour and a half
    const r = await s.time(id, { ms, name: "bob", save: saveFor(id, ms) });
    expect(r.status).toBe(200);
  });

  test("under the floor is refused", async () => {
    const s = stand();
    const { json: { id } } = await s.start();
    const ms = TIMES_FLOOR_MS - 1;
    const r = await s.time(id, { ms, name: "bob", save: saveFor(id, ms) });
    expect(r.status).toBe(422);
    expect(r.json.error).toMatch(/faster/);
  });

  test("a save that disagrees is refused, each way", async () => {
    const s = stand();
    const ms = 10 * MIN;
    const id = await play(s, ms);
    for (const bad of [
      saveFor(id, ms + 1),
      saveFor(id, ms, { rescued: false }),
      saveFor("other", ms),
      saveFor(id, ms, { boulderNo: 0 }),
      null,
    ]) {
      const r = await s.time(id, { ms, name: "bob", save: bad });
      expect(r.status).toBe(422);
    }
  });

  test("a bad name is refused", async () => {
    const s = stand();
    const ms = 10 * MIN;
    const id = await play(s, ms);
    for (const name of ["", "   ", "x".repeat(21), "a\u0000b", 7]) {
      const r = await s.time(id, { ms, name, save: saveFor(id, ms) });
      expect(r.status).toBe(422);
    }
  });

  test("a second time on one run is 409, and an unknown run is 404", async () => {
    const s = stand();
    const ms = 10 * MIN;
    const id = await play(s, ms);
    s.as("b");
    expect((await s.time(id, { ms, name: "bob", save: saveFor(id, ms) })).status).toBe(200);
    s.as("c");
    expect((await s.time(id, { ms, name: "bob", save: saveFor(id, ms) })).status).toBe(409);
    expect((await s.time("nope", { ms, name: "bob", save: saveFor("nope", ms) })).status).toBe(404);
  });

  test("an id-less post (played offline) is minted on the spot with nothing watched", async () => {
    const s = stand();
    const ms = 10 * MIN;
    const r = await s.time(null, { ms, name: "bob", save: saveFor(null, ms) });
    expect(r.status).toBe(200);
    expect(r.json.id).toMatch(/^[0-9a-f]{32}$/);
    const { json } = await s.board(`?top=5&mine=${r.json.id}`);
    expect(json.rows[0].seen).toBe(0);
  });

  test("an itch key that itch knows puts itch's name on the row, badged", async () => {
    const s = stand(async (k) => (k === "good" ? "leafo" : null));
    const ms = 10 * MIN;
    const id = await play(s, ms);
    const r = await s.time(id, { ms, name: "bob", save: saveFor(id, ms), itch: "good" });
    expect(r.status).toBe(200);
    const { json } = await s.board();
    expect(json.rows[0]).toMatchObject({ name: "leafo", itch: 1 });
  });

  test("an itch key itch does not know falls back to the typed name, unbadged", async () => {
    const s = stand(async () => null);
    const ms = 10 * MIN;
    const id = await play(s, ms);
    await s.time(id, { ms, name: "bob", save: saveFor(id, ms), itch: "bad" });
    const { json } = await s.board();
    expect(json.rows[0]).toMatchObject({ name: "bob", itch: 0 });
  });
});

describe("the board", () => {
  test("best first, with the top capped and your own row and rank beside it", async () => {
    const s = stand();
    const ids: string[] = [];
    for (let i = 0; i < 5; i++) {
      s.as(`p${i}`);
      const ms = (20 - i) * MIN;
      const id = await play(s, ms);
      await s.time(id, { ms, name: `p${i}`, save: saveFor(id, ms) });
      ids.push(id);
    }
    const { json } = await s.board(`?top=2&mine=${ids[0]}`);
    expect(json.rows.map((r: any) => r.name)).toEqual(["p4", "p3"]);
    expect(json.mine).toMatchObject({ id: ids[0], rank: 5 });
    expect(json.of).toBe(5);
    const big = await s.board(`?top=${TIMES_TOP_MAX * 10}`);
    expect(big.json.rows.length).toBeLessThanOrEqual(TIMES_TOP_MAX);
  });

  test("a stale run with no time is swept; one with a time stays", async () => {
    const s = stand();
    const { json: { id: dead } } = await s.start();
    s.as("b");
    const ms = 10 * MIN;
    const live = await play(s, ms);
    await s.time(live, { ms, name: "bob", save: saveFor(live, ms) });
    s.tick((TIMES_RUN_STALE_D + 1) * 86400 * 1000);
    expect(s.times.sweep(s.now())).toBe(1);
    expect((await s.ping(dead)).status).toBe(404);
    expect((await s.board()).json.of).toBe(1);
  });
});

describe("the rate limits", () => {
  test("a run and a time ten seconds apart a caller, a ping every half interval", async () => {
    const s = stand();
    expect((await s.start()).status).toBe(200);
    expect((await s.start()).status).toBe(429);
    s.tick(MIN);
    const { status, json: { id } } = await s.start();
    expect(status).toBe(200);
    expect((await s.ping(id)).status).toBe(200);
    expect((await s.ping(id)).status).toBe(429);
    s.tick((TIMES_PING_S * 1000) / 2);
    expect((await s.ping(id)).status).toBe(200);
    // another caller is another clock
    s.as("z");
    expect((await s.start()).status).toBe(200);
  });
});
