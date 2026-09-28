// The fighters as they are seen (docs/wave-party.md, "The picture"): each at
// its station, the plain square until its station has a class, and then its
// kit (deep/kits.js) and its class's attack (render/attacks.js) on its own
// clock; the buffs on a fighter, Inspired and Hasted; and what leaves a
// fighter -- arrows, beams, charges, hexes, notes -- on the `shots` layer
// over all of them.
//
// A fighter's clock is its turn: seconds since its attack began. The fight
// keeps it (track FIGHT, deep/classes.js); this file only reads it, through
// `turnOf`, and derives from it the hit-pauses and the held poses round each
// contact (`sauceOf`), so the picture follows the sim's tempo while its
// shapes and motion are the page's.
//
// In the abyss's vocabulary, as every weapon down here was: no glow, no
// alpha, no flash of the frame; a thing is brighter by being drawn on more of
// its cells.

import { now } from '../clock.js';
import { P, DEEP_W, DEEP_SLOTS_DRAWN } from '../config.js';
import { S } from '../state.js';
import { fighterAt } from '../deep/party.js';
import { deepFloor, deepX0 } from '../deep/place.js';
import { ctx } from './ctx.js';
import { inTheDeep } from './crew.js';
import { GREYS, PURPLES, WHITE, BODY, R4, R8, hash, cell, body } from '../deep/kits.js';
import { ATTACKS, REST, liftOf, loopOf, sauceOf, dentsOf, sparksOf, contactTimes } from './attacks.js';
import { hideBot } from './serpent.js';

// The deep's bodies that fight: a pod resident seated at a station (the
// type is CREW's, src/jobs.js).
export const isFighter = w => w.type === 'fighter';   // TYPE.FIGHTER, until merge

// --- the sim's clocks, read ---------------------------------------------------------
// until merge: FIGHT's per-body timers. The seam, as this file reads it:
//   w.turnAt   world ms the current turn's clock started (the page's A0 = 0);
//              null or absent between turns, while the fighter stands guard.
//   w.turnHits seconds after turnAt each of the turn's blows lands in the sim,
//              optional: given, the page's clock is bent to meet them.
//   w.fighting true while the body is at its post and striking.
//   w.inspiredUntil, w.hastedUntil  world ms each buff runs to (the spec's).
// Until FIGHT merges none of these is set, and each fighter runs the page's
// own loop, phased by the body, so every class can be looked at.
function turnOf(w, key, R, c, t) {
  if (w.benchA != null) return w.benchA;                            // the scratch bench's stand-still
  if ('turnAt' in w) {
    if (w.turnAt == null) return null;
    const a = (t * 1000 - w.turnAt) / 1000;
    return w.turnHits ? bend(a, w.turnHits, contactTimes(key, R).map(h => h.at)) : a;
  }
  const loop = loopOf(c);                                          // until merge
  return (t + hash(idOf(w)) * loop) % loop;
}
// The sim's clock bent onto the page's, piece by piece between blows, so a
// blow the sim lands at sim[i] is drawn landing (the page's page[i]): the
// tempo is the game's, the motion between the blows the page's.
function bend(a, sim, page) {
  const n = Math.min(sim.length, page.length);
  if (!n) return a;
  if (a <= sim[0]) return a - sim[0] + page[0];
  for (let i = 0; i < n - 1; i++)
    if (a < sim[i + 1]) return page[i] + (a - sim[i]) * (page[i + 1] - page[i]) / Math.max(1e-6, sim[i + 1] - sim[i]);
  return a - sim[n - 1] + page[n - 1];
}
const idOf = w => [...String(w.uid ?? w.id ?? '')].reduce((h, ch) => h * 31 + ch.charCodeAt(0), 7) % 9973;
const striking = w => ('fighting' in w ? !!w.fighting : S.snatched);   // until merge

// --- who is fighting, this frame ---------------------------------------------------
// The scratch bench (dev only): stand-in bodies at the slots, so every class
// can be shot before the crew seat real ones. Never saved, never stepped.
const bench = [];
function stationsNow() {
  const out = [];
  for (const st of S.stations || []) {
    if (!st.built) continue;
    // until merge: CREW's fighterAt resolves the uid; the body's own station field meanwhile
    const w = fighterAt(st) || (S.workers || []).find(o => isFighter(o) && o.station === st.id);
    if (w && !w.lifted && inTheDeep(w)) out.push({ w, st });
  }
  for (const b of bench) out.push(b);
  return out;
}

let frame = { t: -1, list: [] };
// Every fighter's turn worked out once a frame: the serpent's give and the
// fighters' drawing read the same clock.
function fighters(t) {
  if (frame.t === t) return frame.list;
  const list = [];
  for (const { w, st } of stationsNow()) {
    const key = st.cls && ATTACKS[st.cls] ? st.cls : null, R = st.rung || 0;
    const x = Math.round(w.x) / P, restY = Math.round(w.y) / P;
    const f = { w, st, key, R, x, restY, a: null, a0: null, sauce: null };
    if (key && striking(w)) {
      const c = ATTACKS[key], a0 = turnOf(w, key, R, c, t);
      if (a0 != null && a0 < c.len + 0.8) { f.a0 = a0; f.sauce = sauceOf(c, R, a0, x); f.a = f.sauce.a; }
    }
    list.push(f);
  }
  frame = { t, list };
  return list;
}

// The coil's give under every contact of every fighter's turn (render/serpent.js).
export function dentsNow(t) {
  const out = [];
  for (const f of fighters(t)) if (f.sauce) out.push(...dentsOf(f.sauce, t, f.a0));
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
// until merge: the buffs as the page lays them, off the Bard's song and the
// Martial Artist's capstone finisher, where the sim keeps none of its own.
function buffsOf(f, list, t) {
  const tms = t * 1000, w = f.w;
  if ('inspiredUntil' in w || 'hastedUntil' in w) {
    const bards = list.filter(o => o.key === 'bard').map(o => o.R);
    const lv = bards.length ? (Math.max(...bards) >= 8 ? 3 : Math.max(...bards) >= 4 ? 2 : 1) : 1;
    return { inspired: (w.inspiredUntil || 0) > tms ? lv : 0, hasted: (w.hastedUntil || 0) > tms };
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
let shots = [];
export function drawFighters() {
  const t = now() / 1000, list = fighters(t);
  shots = [];
  for (const f of list) {
    let at = [f.x, f.restY];
    if (!f.key) body(f.x, f.restY);             // a base fighter: the plain square, standing guard
    else {
      const c = ATTACKS[f.key];
      const api = {
        restY: f.restY, kick: f.sauce ? f.sauce.kick : 0,
        others: list.filter(o => o !== f).map(o => ({ x: o.x, y: o.restY - liftOf(o.key, o.R) })),
        shot: fn => shots.push(fn),
        at: (x, y) => { at = [x, y]; },
      };
      if (f.a != null && f.a < c.len) {
        // the held star under the fighter, so the fist or blade reads on top of it
        sparksOf(ctx, f.sauce, t, f.a0);
        c.draw(ctx, t, f.a, api, f.R, f.x);
      } else {
        at = [f.x, f.restY - liftOf(f.key, f.R)];
        REST[f.key](ctx, at[0], at[1], f.R, t);
      }
    }
    const b = buffsOf(f, list, t);
    if (b.inspired) paintInspired(t, at[0], at[1], b.inspired);
    if (b.hasted) paintHasted(t, at[0], at[1]);
  }
  ctx.fillStyle = '#000';
}

export function drawShots() {
  for (const fn of shots) fn();
  shots = [];
  ctx.fillStyle = '#000';
}

// --- the scratch bench (dev only) ------------------------------------------------------
// `__kitBench([{ cls, rung, slot, a, gap }])` stands a stand-in fighter at
// each slot, drawn and never stepped: `a` holds its turn's clock still at a
// moment (for a shot beside the page at the same moment), `gap` stands it
// that many cells under the coil's belly, as the fight swims a melee
// fighter up. `__kitBench()` clears it. Until the party's scenes land
// (track STATE), this is how the drawing is looked at.
if (import.meta.env?.DEV) {
  globalThis.__kitBench = (list = []) => {
    bench.length = 0;
    list.forEach((o, i) => {
      const slot = o.slot ?? i, at = DEEP_SLOTS_DRAWN[slot % DEEP_SLOTS_DRAWN.length];
      const cx = o.x != null ? o.x : Math.round((deepX0() + at * DEEP_W) / P) - 1;
      const floor = Math.floor(deepFloor() / P);
      const y = o.gap != null ? hideBot(cx) + o.gap : floor - BODY - (o.up || 0);
      const w = { uid: 'bench' + i, x: cx * P, y: y * P, benchA: o.a ?? null };
      bench.push({ w, st: { id: 'bench' + i, kind: o.kind || 'altar', built: true, cls: o.cls || null, rung: o.rung || 0 } });
    });
    frame.t = -1;
    return bench.length;
  };
  // A whole party stood up for a look, until STATE's `__party` lands:
  // stations at slots (`built: false` a scaffold), a stand-in fighter at each
  // built one, statuses on the serpent for `s` seconds, fangs loose at
  // [a share of the deep across, cells over the floor].
  globalThis.__kitParty = ({ stations = [], statuses = {}, fangs = [], seenFang = false } = {}) => {
    S.stations = stations.map((o, i) => ({ id: 'k' + i, kind: o.kind, slot: o.slot ?? i, built: o.built !== false,
                                           cls: o.cls || null, rung: o.rung || 0, paid: [], fighter: null }));
    const t = now();
    S.statuses = Object.fromEntries(Object.entries(statuses).map(([k, s]) => [k, { until: t + s * 1000, k: 1 }]));
    S.fangsLoose = fangs.map(([f, up]) => ({ x: deepX0() + f * DEEP_W, y: deepFloor() - up * P }));
    if (seenFang) { S.seenFang = true; S.fangs = S.fangs || 1; }
    globalThis.__kitBench(stations.map((o, i) => ({ ...o, slot: o.slot ?? i })).filter(o => o.built !== false));
    return S.stations.length;
  };
  // Where the bench's bodies stand and how the deep's camera frames them, for a crop.
  globalThis.__kitView = () => ({ camX: S.camX, camY: S.camY, zoom: S.zoom, dpr: S.dpr, viewW: S.viewW, viewH: S.viewH,
                                  cells: bench.map(b => ({ x: b.w.x / P, y: b.w.y / P, bot: hideBot(Math.round(b.w.x / P) + 1) })) });
}
