// The fighters as they are seen (docs/wave-party.md, "The picture"): each at
// its station, the plain square until its station has a class, and then its
// kit (deep/kits.js) and its class's attack (render/attacks.js); the buffs
// on a fighter, Inspired and Hasted; its pip row; and what leaves a fighter
// -- arrows, palms, hexes, daggers, charges, the beam, notes -- on the
// `shots` layer over all of them.
//
// The fight keeps the clocks (track FIGHT, deep/classes.js): each body's
// `pose` is the move in hand -- its wind-up's start, its contact, its
// follow-through's end -- and `shots` (deep/arms.js) is everything in the
// water. The page plays a class as a turn of several moves; here each of the
// fight's moves is its own stretch of the page (`SEGMENTS`), and the fight's
// clock is bent onto it: the contact on the page lands on the sim's contact,
// the wind-up and the follow-through play at the page's pace when there is
// room between two moves and quicker when there is not. The hit-pause and
// the held poses round a contact (`sauceOf`) are the drawing's alone: the
// sim does not freeze. So the tempo and the places are the game's, and the
// shapes and the motion the page's.
//
// In the abyss's vocabulary, as every weapon down here was: no glow, no
// alpha, no flash of the frame; a thing is brighter by being drawn on more of
// its cells.

import { now } from '../clock.js';
import { P, DEEP_W, DEEP_SURFACE, DRAW_POSE, DRAW_ROOM_S, DRAW_LOWER_S, LAND_FX_S, CLASSES,
         IDLE_STEP_S, IDLE_HOP_S, IDLE_SETTLE_S } from '../config.js';
import { TYPE } from '../jobs.js';
import { S } from '../state.js';
import { fighterAt } from '../deep/party.js';
import * as fight from '../deep/arms.js';
import { deepFloor, deepTop, deepX0, slotX } from '../deep/place.js';
import { ctx } from './ctx.js';
import { inTheDeep } from './crew.js';
import { GREYS, PURPLES, WHITE, BODY, R4, R8, hash, lerp, ease, cell, ring, body, pips, dagger, charge,
         blades } from '../deep/kits.js';
import { ATTACKS, SEGMENTS, REST, liftOf, loopOf, sauceOf, dentsOf, sparksOf, starAt, speedLines,
         streakAt, MOTE_TONES } from './attacks.js';
import { hideBot } from './serpent.js';

// The deep's bodies that fight: a pod resident seated at a station.
export const isFighter = w => w.type === TYPE.FIGHTER;
const MELEE = new Set(['brawler', 'sword', 'martial']);

// --- who is fighting, this frame ---------------------------------------------------
// The scratch bench (dev only): stand-in bodies at the slots, so every class
// can be shot without a fight standing. Never saved, never stepped.
const bench = [];
function stationsNow() {
  const out = [];
  for (const st of S.stations || []) {
    if (!st.built) continue;
    const w = fighterAt(st);
    if (w && !w.lifted && inTheDeep(w)) out.push({ w, st });
  }
  for (const b of bench) out.push(b);
  return out;
}
const stationOfBody = w => (S.stations || []).find(st => st.id === w?.station) ||
                           bench.find(b => b.w === w)?.st || null;

// --- the fight's clock, bent onto the page's ---------------------------------------
// What the drawing remembers of a body between frames: the move before the
// one in hand, and how many it has made, for the side a fist or a blade
// comes from.
const MEM = new WeakMap();
function memOf(w) {
  let m = MEM.get(w);
  if (!m) MEM.set(w, m = { at: null, prev: null, n: 0 });
  const p = w.pose;
  if (p && p.at !== m.at) { m.prev = m.cur || null; m.cur = { move: p.move, hit: p.hit }; m.at = p.at; m.n++; }
  return m;
}
// The move after the one in hand, as the fight will choose it (deep/classes.js),
// and when its contact will be: its wind-up starts when it is due (`w.next`).
function nextOf(key, w, p) {
  const full = w.pipsMax > 0 && (w.pips || 0) >= w.pipsMax, last = w.pipsMax > 0 && (w.pips || 0) === w.pipsMax - 1;
  const move = { brawler: last ? 'haymaker' : 'punch', sword: p.move, monk: full ? 'chi' : 'palm',
                 martial: full ? 'finisher' : 'thrust', ranger: last ? 'aimed' : 'shoot', assassin: 'stab',
                 sapper: 'throw', hexer: 'hex', mage: p.move === 'beam' ? 'finish' : 'beam', bard: 'sing' }[key];
  const windup = (move === 'beam' ? 0 : (w.windup ?? CLASSES[key].windup ?? 0)) * 1000;
  const due = key === 'mage' && p.move === 'beam' ? p.end : w.next;
  return due > p.at ? { move, hit: due + windup } : null;
}
// A segment's wind-up, from the fight's stance straight after another move
// or from a standing start.
const startOf = (sg, prev, hit) => (sg.mid != null && prev && hit - prev.hit < DRAW_ROOM_S * 1000 ? sg.mid : sg.from);

// The page's raw clock for a body now, and the stretch of the page it is
// on; null standing guard or at rest.
function pageOf(key, w, R, T) {
  const p = w.pose;
  if (!p || !SEGMENTS[key]) return null;
  const m = memOf(w), side = m.n % 2 ? 1 : -1;
  const segOf = move => SEGMENTS[key](move, R, { side, twice: p.twice });
  const sg = segOf(p.move);
  // the Bard's song runs on for as long as she sings, a phrase at a time
  if (sg.loop) return { sg, a0: ((T - p.at) / 1000) % sg.to };
  // the Mage's beam is held as long as the fight holds it, however long that is
  if (sg.held && T >= p.hit && T < p.end) return { sg, a0: sg.hit + (T - p.hit) / (p.end - p.hit) * (sg.to - sg.hit) };
  const prev = m.prev && m.prev.hit < p.hit ? m.prev : null;
  if (T < p.hit) {
    const from = startOf(sg, prev, p.hit), W = sg.hit - from;
    const pg = prev ? segOf(prev.move) : null, F = pg ? pg.to - pg.hit : 0;
    const k = prev ? Math.min(1, (p.hit - prev.hit) / 1000 / (F + W)) : 1;
    return { sg, a0: Math.max(from, sg.hit - (p.hit - T) / 1000 / k) };
  }
  const nx = nextOf(key, w, p), ng = nx ? segOf(nx.move) : null;
  const W = ng ? ng.hit - startOf(ng, p, nx.hit) : 0, F = sg.to - sg.hit;
  const k = nx ? Math.min(1, (nx.hit - p.hit) / 1000 / (F + W)) : 1;
  const a = sg.hit + (T - p.hit) / 1000 / k;
  if (a <= sg.to) return { sg, a0: a };
  if (ng && T >= nx.hit - W / k * 1000) return { sg: ng, a0: Math.max(startOf(ng, p, nx.hit), ng.hit - (nx.hit - T) / 1000 / k) };
  // between moves: the fight's stance, or back to rest once it is long idle;
  // `idle` is the seconds since the follow-through settled
  if (w.goal !== 'fight' && w.goal !== 'sing') return null;
  const idle = (T - p.hit - F * k * 1000) / 1000;
  if (sg.off && (!nx || nx.hit - T > DRAW_LOWER_S * 1000)) return { sg, a0: Math.min(sg.off, sg.to + idle), idle };
  return { sg, a0: sg.to, idle };
}

// Where a fighter stands between two moves, in cells off its spot: a step
// forward and one back, and a melee fighter's hop as each step lands.
function idleAt(key, s) {
  if (s == null || s < IDLE_SETTLE_S) return [0, 0];
  const u = s - IDLE_SETTLE_S, step = u % (IDLE_STEP_S * 2) < IDLE_STEP_S ? 0 : 1;
  return [step, CLASSES[key].melee && u % IDLE_STEP_S < IDLE_HOP_S ? -1 : 0];
}

// --- the scratch bench's loop ---------------------------------------------------------
// The bench's bodies are never stepped, so each plays the page's turn on a
// loop of its own, phased by the body, so every class can be looked at.
const idOf = w => [...String(w.uid ?? w.id ?? '')].reduce((h, ch) => h * 31 + ch.charCodeAt(0), 7) % 9973;
function loopClock(w, c, t) {
  if (w.benchA != null) return w.benchA;                            // the bench's stand-still
  const loop = loopOf(c);
  return (t + hash(idOf(w)) * loop) % loop;
}

let frame = { t: -1, list: [] };
// Every fighter worked out once a frame: the serpent's give and the
// fighters' drawing read the same clock.
function fighters(t) {
  if (frame.t === t) return frame.list;
  const list = [];
  for (const { w, st } of stationsNow()) {
    const key = st.cls && ATTACKS[st.cls] ? st.cls : null, R = st.rung || 0;
    const x = Math.round(w.x) / P, restY = Math.round(w.y) / P;
    const f = { w, st, key, R, x, restY, a: null, a0: null, sauce: null, c: null, sim: 'pose' in w, dx: 0, dy: 0 };
    if (key && f.sim) {
      const pg = pageOf(key, w, R, t * 1000);
      if (pg) { f.c = pg.sg.c; f.a0 = pg.a0; f.melee = MELEE.has(key) || pg.sg.c === ATTACKS.mage; [f.dx, f.dy] = idleAt(key, pg.idle); }
    } else if (key && S.snatched) {
      const c = ATTACKS[key], a0 = loopClock(w, c, t);
      if (a0 < c.len + 0.8) { f.c = c; f.a0 = a0; f.melee = true; }
    }
    // the Mage's ticks and her blow land where her beam does, five cells off her on the page
    const hx = key === 'mage' && f.sim && (w.beam || w.pose) ? Math.round((w.beam ? w.beam.tx : w.pose.x) / P) + 5 : x;
    if (f.c) { f.sauce = sauceOf(f.c, R, f.a0, hx); f.a = f.sauce.a; }
    list.push(f);
  }
  landings(t * 1000);
  frame = { t, list };
  return list;
}

// --- the shots, as the fight flies them -----------------------------------------------
// The fight's `shots` (deep/arms.js), and what the drawing keeps of each one
// that has landed, for the ring, the stuck arrow, the blast or the dagger's
// way home. A shot gone from the list between two frames has landed where
// it last was.
const inWater = () => (Array.isArray(fight.shots) ? fight.shots : []);
let seen = new Map(), landed = [], seenAt = -Infinity;
function landings(T) {
  const next = new Map();
  for (const s of inWater()) next.set(s, { kind: s.kind, x: s.x, y: s.y, by: s.by, stuck: s.stuck });
  // one frame to the next only: a deep not drawn a while has no landings to show
  if (T - seenAt < LAND_FX_S * 1000)
    for (const [s, last] of seen) if (!next.has(s)) landed.push({ ...last, at: T, R: stationOfBody(last.by)?.rung || 0 });
  seen = next;
  seenAt = T;
  landed = landed.filter(l => T - l.at < LAND_FX_S * 1000);
}
const LAND_K = { arrow: 0.2, aimed: 0.8, palm: 0.3, chi: 0.7, hex: 0.15, dagger: 0.3, charge: 0.6 };
const landK = l => (l.kind === 'charge' && R4(l.R) ? 0.9 : l.kind === 'hex' && R8(l.R) ? 0.45 : LAND_K[l.kind] || 0.3);

// The coil's give under every contact (render/serpent.js): a melee fighter's
// off its move's page, a shot's where it landed.
export function dentsNow(t) {
  const out = [];
  for (const f of fighters(t)) if (f.sauce && f.melee) out.push(...dentsOf(f.sauce, t, f.a0));
  for (const l of landed) out.push({ x: l.x / P, k: landK(l), t0: l.at / 1000 });
  return out;
}
// The highest rung any Hexer stands at: her capstone brightens Held.
export function hexerRung() {
  let r = -1;
  for (const f of fighters(now() / 1000)) if (f.key === 'hexer') r = Math.max(r, f.R);
  return r;
}

// --- the buffs on a fighter ------------------------------------------------------------
// Inspired: a chevron of the purples bobbing over the head; two at Anthem;
// both the brightest with a white apex each at the capstone. Hasted: short
// streaks running back off the body's side.
function chevron(cx, cy, tone) { cell(ctx, cx, cy + 1, tone); cell(ctx, cx + 1, cy, tone); cell(ctx, cx + 2, cy + 1, tone); }
function paintInspired(t, x, y, lv) {
  const bob = Math.floor(t * 2.5) % 2;
  chevron(x, y - 5 - bob, PURPLES[11]);
  if (lv > 1) chevron(x, y - 8 - bob, lv > 2 ? PURPLES[11] : PURPLES[9]);
  if (lv > 2) { cell(ctx, x + 1, y - 5 - bob, WHITE); cell(ctx, x + 1, y - 8 - bob, WHITE); }
}
function paintHasted(t, x, y) {
  for (let r = 0; r < 3; r++) {
    const a = (t * 3 + r * 0.37) % 1, sx = x - 2 - Math.floor(a * 4);
    cell(ctx, sx, y + r, GREYS[[11, 10, 8, 6][Math.floor(a * 4)]]);
  }
}
// The buffs the fight keeps on the body; Inspired as strong as the best
// Bard's rung. Until merge, as the page lays them.
function buffsOf(f, list, t) {
  const tms = t * 1000, w = f.w;
  if ('inspiredUntil' in w || 'hastedUntil' in w || f.sim) {
    const bards = list.filter(o => o.key === 'bard').map(o => o.R), top = bards.length ? Math.max(...bards) : 0;
    return { inspired: (w.inspiredUntil || 0) > tms ? (R8(top) ? 3 : R4(top) ? 2 : 1) : 0, hasted: (w.hastedUntil || 0) > tms };
  }
  let inspired = 0, hasted = false;
  for (const o of list) {
    if (o === f || o.a == null) continue;
    if (o.key === 'bard' && o.a >= 1.2 && o.a < (R8(o.R) ? 6 : 3.4)) inspired = Math.max(inspired, R8(o.R) ? 3 : R4(o.R) ? 2 : 1);
    if (o.key === 'martial' && R8(o.R) && o.a >= ATTACKS.martial.plan(o.R).fin) hasted = true;
  }
  return { inspired, hasted };
}

// --- the layers --------------------------------------------------------------------
let queued = [];
export function drawFighters() {
  const t = now() / 1000, list = fighters(t);
  queued = [];
  // A fighter still coming down the shaft is in the liquid over the deep's
  // surface and not drawn, as every swimmer is (render/deep.js).
  const cut = deepTop() + DEEP_SURFACE + P;
  ctx.save();
  ctx.beginPath();
  ctx.rect(deepX0() - P * 16, cut, DEEP_W + P * 32, deepFloor() - cut + P * 8);
  ctx.clip();
  for (const f of list) {
    let at = [f.x + f.dx, f.restY + f.dy];
    if (!f.key) body(f.x, f.restY);             // a base fighter: the plain square, standing guard
    else if (f.c) {
      const w = f.w, beam = f.sim && w.beam;
      const api = {
        restY: f.restY + f.dy, kick: f.sauce.kick, placed: f.sim, sim: f.sim,
        pips: f.sim && w.pipsMax > 0 ? w.pips || 0 : null,
        aim: beam ? { x: beam.tx / P, y: beam.ty / P } : f.sim && w.pose ? { x: w.pose.x / P, y: w.pose.y / P } : null,
        width: beam && R4(f.R) ? beam.width : null,
        away: i => awayOf(f, i),
        others: list.filter(o => o !== f).map(o => ({ x: o.x, y: o.restY - liftOf(o.key, o.R) })),
        shot: fn => queued.push(fn),
        at: (x, y) => { at = [x, y]; },
      };
      // the held star under the fighter, so the fist or blade reads on top of it
      if (f.melee) sparksOf(ctx, f.sauce, t, f.a0);
      f.c.draw(ctx, t, f.a, api, f.R, f.x + f.dx);
    } else {
      at = [f.x, f.restY - liftOf(f.key, f.R)];
      REST[f.key](ctx, at[0], at[1], f.R, t);
    }
    // the fight's pip row: lit white, all of it on the move it builds to
    if (f.sim && f.w.pipsMax > 0) pips(ctx, at[0], at[1], f.w.pips || 0, f.w.pipsMax, f.w.pose?.big && t * 1000 < f.w.pose.end ? 1 : 0);
    const b = buffsOf(f, list, t);
    if (b.inspired) paintInspired(t, at[0], at[1], b.inspired);
    if (b.hasted) paintHasted(t, at[0], at[1]);
  }
  ctx.restore();
  ctx.fillStyle = '#000';
}

// Whether a fighter's `i`th hand is empty: its charge or its dagger away in
// the water, or landed a beat ago and not yet back.
function awayOf(f, i) {
  const mine = inWater().filter(s => s.by === f.w).length;
  const late = landed.filter(l => l.by === f.w && now() - l.at < 500).length;
  if (f.key === 'assassin') {
    const m = MEM.get(f.w), hand = m && m.n % 2 && blades(0, f.R).length > 1 ? 1 : 0;
    return (mine + late) > 0 && i === hand;
  }
  return i < mine + late;
}

export function drawShots() {
  const t = now(), R = s => stationOfBody(s.by)?.rung || 0;
  // what the fight has in the water, each as the page draws it
  for (const s of inWater()) {
    const x = Math.round(s.x / P - 0.5), bot = hideBot(x) + 1, y = Math.min(s.y / P, bot), r = R(s);
    const k = s.fly ? Math.min(1, (t - s.at) / s.fly) : 0;
    if (s.kind === 'arrow' || s.kind === 'aimed') {
      const pu = s.kind === 'aimed';
      cell(ctx, x, y, pu ? PURPLES[11] : WHITE); cell(ctx, x, y + 1, pu ? PURPLES[10] : GREYS[10]); cell(ctx, x, y + 2, pu ? PURPLES[8] : GREYS[8]);
      speedLines(ctx, x, y + 1, 2, 3, pu && R8(r));
      if (pu && R8(r)) { cell(ctx, x, y + 3, PURPLES[7]); cell(ctx, x, y + 4, PURPLES[5]); }
    } else if (s.kind === 'palm' || s.kind === 'chi') {
      const half = (s.kind === 'chi' ? 2 : 1) + Math.round(k ** 1.6 * 2);
      for (let dx = -half; dx <= half; dx++) cell(ctx, x + dx, y, Math.abs(dx) === half ? PURPLES[8] : PURPLES[11]);
    } else if (s.kind === 'hex') {
      // a stream of motes, each a beat behind the one before, along the way it came
      const n = R8(r) ? 9 : 5, x0 = s.x0 / P - 0.5, y0 = s.y0 / P;
      for (let m = 0; m < n; m++) {
        const q = Math.max(0, k - m * 0.5 / n) ** 1.5;
        if (q <= 0) continue;
        const cx = lerp(x0, x, q) + [-1, 1, 0, -2, 2, -1, 1, 0, 0][m], cy = Math.min(lerp(y0, y, q), bot);
        cell(ctx, cx, cy, PURPLES[11]); cell(ctx, cx, cy + 1, PURPLES[7]);
      }
    } else if (s.kind === 'dagger') {
      // point first up to the hide, spinning whole at the capstone; the pose
      // before it bites, a held streak down to where it left her
      const gy = Math.min(y, bot + 3);
      if (s.fly && s.at + s.fly - t < DRAW_POSE * 1000) {
        streakAt(ctx, x, gy - 3, Math.max(gy + 1, s.y0 / P), R8(r) ? PURPLES[11] : WHITE, R8(r));
        speedLines(ctx, x, gy, 2, 3, R8(r));
      } else dagger(ctx, x, gy, r, R8(r) ? k * Math.PI * 2 : 0);
    } else if (s.kind === 'charge') {
      if (!s.stuck) { charge(ctx, x, y, t / 1000, r, true); continue; }
      // stuck under the belly: squashed flat for the pose it sticks, its light
      // ticking faster as it runs down
      const blowAt = s.pair ? s.pair.blowAt : s.blowAt, u = t - (s.stuckAt || t);
      if (u < DRAW_POSE * 1000) { ctx.fillStyle = GREYS[9]; ctx.fillRect(Math.round((x - 1.5) * P), Math.round(bot * P), 4 * P, P); }
      else charge(ctx, x, bot, t / 1000, r, false);
      const rate = 3 + 8 * Math.max(0, Math.min(1, u / Math.max(1, blowAt - (s.stuckAt || t))));
      cell(ctx, x, bot + 2, Math.floor(t / 1000 * rate) % 2 ? WHITE : GREYS[6]);
    }
  }
  // and what has landed, a beat on
  for (const l of landed) {
    const e = (t - l.at) / 1000, x = Math.round(l.x / P - 0.5), bot = hideBot(x) + 1, r = l.R, k = landK(l);
    starAt(ctx, t / 1000, l.at / 1000, x, bot, k, R8(r) && l.kind !== 'arrow' ? { purple: true } : {});
    if (l.kind === 'arrow' || l.kind === 'aimed') {
      const pu = l.kind === 'aimed';
      if (e < 0.9) { const tone = pu ? PURPLES[e < 0.4 ? 9 : 6] : GREYS[e < 0.4 ? 9 : 6]; cell(ctx, x, bot, tone); cell(ctx, x, bot + 1, tone); }
      if (pu && e < 0.45) ring(ctx, x, bot - 1, 1 + e * 14, R8(r) ? (e < 0.2 ? PURPLES[11] : PURPLES[8]) : e < 0.2 ? WHITE : GREYS[7], 2);
    } else if (l.kind === 'palm' || l.kind === 'chi') {
      if (e < 0.5) ring(ctx, x, bot - 1, 1 + e * (l.kind === 'chi' ? 12 : 8), [PURPLES[11], PURPLES[9], PURPLES[7], PURPLES[5]][Math.floor(e / 0.125)], 2);
    } else if (l.kind === 'hex') {
      if (e < 0.8) ring(ctx, x, bot - 1, 1 + e * (R8(r) ? 14 : 8), MOTE_TONES[Math.floor(e / 0.2)], 2);
    } else if (l.kind === 'dagger') {
      // home again, the way it went
      const f = frame.list.find(o => o.w === l.by);
      if (f && e < 0.3) dagger(ctx, x, lerp(bot + 3, f.restY, ease(e / 0.3)), r, R8(r) ? (1 + e / 0.3) * Math.PI * 2 : 0);
    } else if (l.kind === 'charge') {
      // the blast: a ring, and at the capstone the abyss's -- a white core a
      // pose, and purple debris thrown up and falling
      const big = R4(r), pu = R8(r), floor = deepFloor() / P;
      if (e < 0.45) ring(ctx, x, bot - 1, 1 + e * (big ? 22 : 12), pu ? (e < 0.15 ? PURPLES[11] : e < 0.3 ? PURPLES[9] : PURPLES[7]) : e < 0.15 ? WHITE : e < 0.3 ? GREYS[9] : GREYS[6]);
      if (pu && e < DRAW_POSE) { cell(ctx, x, bot - 1, WHITE); cell(ctx, x - 1, bot - 1, PURPLES[11]); cell(ctx, x + 1, bot - 1, PURPLES[11]); cell(ctx, x, bot - 2, PURPLES[11]); }
      if (pu && e < 1.2) for (let j = 0; j < 10; j++) {
        const ang = -Math.PI * (0.05 + 0.9 * hash(j * 13 + x)), sp = 14 * (0.5 + hash(j + 7 * x));
        const dx = x + Math.cos(ang) * sp * e, dy = bot - 1 + Math.sin(ang) * sp * e + 9 * e * e;
        if (dy < floor) cell(ctx, dx, dy, PURPLES[[11, 10, 9, 7, 5][Math.min(4, Math.floor(e / 0.24))]]);
      }
    }
  }
  // then what the fighters queued: the page's own, where the fight has none
  for (const fn of queued) fn();
  queued = [];
  ctx.fillStyle = '#000';
}

// --- the scratch bench (dev only) ------------------------------------------------------
// `__kitBench([{ cls, rung, slot, a, gap }])` stands a stand-in fighter at
// each slot, drawn and never stepped: `a` holds its turn's clock still at a
// moment (for a shot beside the page at the same moment), `gap` stands it
// that many cells under the coil's belly, as the fight swims a melee
// fighter up. `__kitBench()` clears it.
if (import.meta.env?.DEV) {
  globalThis.__kitBench = (list = []) => {
    bench.length = 0;
    list.forEach((o, i) => {
      const slot = o.slot ?? i;
      const cx = o.x != null ? o.x : Math.round(slotX(slot) / P) - 1;
      const floor = Math.floor(deepFloor() / P);
      const y = o.gap != null ? hideBot(cx) + o.gap : floor - BODY - (o.up || 0);
      const w = { uid: 'bench' + i, x: cx * P, y: y * P, benchA: o.a ?? null };
      bench.push({ w, st: { id: 'bench' + i, kind: o.kind || 'altar', built: true, cls: o.cls || null, rung: o.rung || 0 } });
    });
    frame.t = -1;
    return bench.length;
  };
  // A whole party stood up for a look, without the crew: stations at slots
  // (`built: false` a scaffold), a stand-in fighter at each built one,
  // statuses on the serpent for `s` seconds, fangs at [a share of the deep
  // across, cells over the floor].
  globalThis.__kitParty = ({ stations = [], statuses = {}, fangs = [], seenFang = false } = {}) => {
    S.stations = stations.map((o, i) => ({ id: 'k' + i, kind: o.kind, slot: o.slot ?? i, built: o.built !== false,
                                           cls: o.cls || null, rung: o.rung || 0, paid: [], fighter: null }));
    const t = now();
    S.statuses = Object.fromEntries(Object.entries(statuses).map(([k, s]) => [k, { until: t + s * 1000, k: 1 }]));
    S.fangsLoose = fangs.map(([f, up]) => ({ x: deepX0() + f * DEEP_W, y: deepFloor() - up * P, rest: up === 0 }));
    if (seenFang) { S.seenFang = true; S.fangs = S.fangs || 1; }
    globalThis.__kitBench(stations.map((o, i) => ({ ...o, slot: o.slot ?? i })).filter(o => o.built !== false));
    return S.stations.length;
  };
  // A bench body, to hand it the fight's fields (`pose`, `next`, `pips`) by hand.
  globalThis.__kitBody = i => { frame.t = -1; return bench[i]?.w || null; };
  globalThis.__kitNow = () => now();
  // Where the bench's bodies stand and how the deep's camera frames them, for a crop.
  globalThis.__kitView = () => ({ camX: S.camX, camY: S.camY, zoom: S.zoom, dpr: S.dpr, viewW: S.viewW, viewH: S.viewH,
                                  cells: bench.map(b => ({ x: b.w.x / P, y: b.w.y / P, bot: hideBot(Math.round(b.w.x / P) + 1) })) });
}
