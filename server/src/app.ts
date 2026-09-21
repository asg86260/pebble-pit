// The routes: a thin skin over times.ts, built by a function so the checks
// can stand one over a memory database with a clock and an itch they own.

import { Hono } from "hono";
import { cors } from "hono/cors";
import { openTimes, type Times } from "./times";
import { itchWhoIs, type WhoIs } from "./itch";
import { TIMES_PING_S, TIMES_SHOWN } from "../../src/config/times.js";

export type Deps = {
  times?: Times;
  now?: () => number;
  whoIs?: WhoIs;
  // What names the caller for the rate limit: the tunnel's header, else the
  // socket. Handed in so a check can be three callers.
  ipOf?: (c: any) => string;
};

// One caller may do each thing this often, in ms. All in memory: a restart
// forgives everybody, which is fine. A caller is an ip, and an ip can be a
// whole school behind one router, so a run and a time are seconds apart, not
// minutes: the limit is against a flood, not a player.
const LIMIT = {
  run: 10_000,
  ping: (TIMES_PING_S * 1000) / 2,
  time: 10_000,
};

export function makeApp(deps: Deps = {}) {
  const times = deps.times ?? openTimes(process.env.TIMES_DB || "times.sqlite");
  const now = deps.now ?? (() => Date.now());
  const whoIs = deps.whoIs ?? itchWhoIs;
  const ipOf = deps.ipOf ?? ((c) => c.req.header("cf-connecting-ip") || c.req.header("x-forwarded-for") || "?");

  const last = new Map<string, number>();
  const limited = (c: any, what: keyof typeof LIMIT) => {
    const k = `${what}:${ipOf(c)}`;
    const t = now();
    const was = last.get(k) || 0;
    if (t - was < LIMIT[what]) return true;
    last.set(k, t);
    return false;
  };
  // A post the rules refused hands the caller's turn back: a mistyped name
  // is not a minute's wait.
  const refund = (c: any, what: keyof typeof LIMIT) => last.delete(`${what}:${ipOf(c)}`);

  const app = new Hono();
  // The game is on itch and on the desk, never on this origin.
  app.use("*", cors({ origin: "*", allowMethods: ["GET", "POST"], allowHeaders: ["content-type"] }));

  const body = async (c: any): Promise<Record<string, unknown>> => {
    try { return (await c.req.json()) ?? {}; } catch { return {}; }
  };
  const saveOf = (b: Record<string, unknown>) => {
    const raw = b.save;
    if (typeof raw === "string") { try { return JSON.parse(raw); } catch { return null; } }
    return raw && typeof raw === "object" ? (raw as Record<string, unknown>) : null;
  };

  app.get("/health", (c) => c.json({ ok: true }));

  app.post("/runs", async (c) => {
    if (limited(c, "run")) return c.json({ error: "too many runs" }, 429);
    const b = await body(c);
    return c.json(times.startRun(saveOf(b), ipOf(c), now()));
  });

  app.post("/runs/:id/ping", (c) => {
    if (limited(c, "ping")) return c.json({ error: "too many pings" }, 429);
    const r = times.ping(c.req.param("id"), now());
    if ("error" in r) return c.json(r, r.status);
    return c.json(r);
  });

  const postTime = async (c: any, id: string | null) => {
    if (limited(c, "time")) return c.json({ error: "too many times" }, 429);
    const b = await body(c);
    const itchName = typeof b.itch === "string" && b.itch ? await whoIs(b.itch) : null;
    const r = times.postTime(id, b.ms, b.name, saveOf(b), itchName, ipOf(c), now());
    if ("error" in r) { refund(c, "time"); return c.json(r, r.status); }
    return c.json(r);
  };
  app.post("/runs/time", (c) => postTime(c, null));
  app.post("/runs/:id/time", (c) => postTime(c, c.req.param("id")));

  app.get("/times", (c) => {
    const top = Number(c.req.query("top")) || TIMES_SHOWN;
    const mine = c.req.query("mine") || null;
    return c.json(times.board(top, mine));
  });

  return { app, times };
}
