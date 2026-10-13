// The deep's creatures (DESIGN.md, "The deep's zones"): who lives where, and
// where each one is at a moment. Everything is read off a creature's seed and
// the clock, so there is nothing to step and nothing to save, and a reader
// other than the drawing -- a meal taken from a zone, a shoal parting round a
// blow -- can ask the same function where a creature is without the drawing.
// A click startles one (`startleFauna`): the moment and the way it bolts are
// kept on the creature for this session only, and a reload finds every one
// home.
//
// In cells: x along from the deep's left end, y down from its ceiling, the
// drawing's top-left.

import { DEEP_W, DEEP_H, P, FAUNA, FAUNA_ZONES, FAUNA_SPRITES, FAUNA_MOTION, FAUNA_GULPER,
         FAUNA_SIPHON, FAUNA_SCARE, FAUNA_STARTLE, FAUNA_SCALES } from '../config.js';
import { deepBed } from '../state.js';
import { now } from '../clock.js';
import { rand } from '../rng.js';
import { topRow } from '../grid.js';
import { deepTop, deepX0, deepFloor } from './place.js';
import { shed } from './scales.js';

export const COLS = DEEP_W / P, ROWS = DEEP_H / P;

export const unit = n => { const x = Math.sin(n * 127.1 + 3.7) * 43758.5453; return x - Math.floor(x); };
export const unit2 = (a, b) => unit(a * 31.7 + b * 113.3);

export const zoneOf = key => FAUNA_ZONES.find(z => z.key === key);
export const zoneAtRow = y => FAUNA_ZONES.findIndex(z => y < z.to);

// The cells a creature's drawing spans, for the floor-dwellers' footing and
// for the drawing's cull.
export const heightOf = kind => kind === 'gulper' ? FAUNA_SPRITES.gulperHead.f[0].length
  : kind === 'siphon' ? 2 : kind === 'school' ? FAUNA_SPRITES.sardine.f[0].length : FAUNA_SPRITES[kind].f[0].length;

// The population, built once off the table: the same creatures in the same
// places on every load.
const pick = (v, k) => (Array.isArray(v) ? v[0] + unit(k) * (v[1] - v[0]) : v);
export const POPULATION = (() => {
  const out = [];
  let i = 0;
  for (const row of FAUNA) {
    for (let s = 0; s < row.n; s++, i++) {
      out.push({
        kind: row.kind, zone: row.zone, i,
        x0: unit(i) * COLS,
        y: row.y ? Math.round(pick(row.y, i + 7)) : null,
        v: pick(row.v, i + 2),
        dir: s % row.flip ? -1 : 1,
        seed: unit(i * 1.7 + 5),
        floor: !!row.floor, low: !!row.low, hop: !!row.hop,
        n: row.school ? Math.round(pick(row.school, i + 11)) : 0,
        spread: row.spread || null,
        // a startle: the second it came (-1 none), where from and which way,
        // the second it is back, and the path it comes back in on
        t0: -1, sx: 0, sy: 0, ddir: 0, dist: 0, back: 0, bx0: 0, bdir: 0, edge: 0,
      });
    }
  }
  return out;
})();

// How far along its way a creature has come by `t` seconds: steadily, or for
// the amphipods in dashes and stops.
function run(c, t) {
  if (!c.hop) return t;
  const { dash, step, burst } = FAUNA_MOTION.hop, beat = t * dash + c.seed * 9;
  return Math.floor(beat) * step + Math.min(1, (beat % 1) * burst) * step;
}

// --- scares ---------------------------------------------------------------------
// The recent frights, each a point of the deep (cells), the second it
// happened, and how much of the push it carries. A creature's place is still
// a function of its seed, the clock and this list; the list is picture only,
// kept by whoever draws the deep and never saved.
export const SCARES = [];
export function addScare(x, y, t, power = 1, list = SCARES) {
  list.push({ x, y, t, power });
  const over = list.length - FAUNA_SCARE.keep;
  if (over > 0) list.splice(0, over);
}
export const clearScares = (list = SCARES) => { list.length = 0; };

// How far a scare is thrown out and held at `age` seconds: up over `rise`,
// down over `fall`, on the stepped clock so it moves a held pose at a time.
export function scareEnvelope(age) {
  const K = FAUNA_SCARE;
  if (age < 0 || age >= K.rise + K.fall) return 0;
  const a = Math.floor(age * K.rate) / K.rate;
  return a < K.rise ? a / K.rise : 1 - (a - K.rise) / K.fall;
}

// The whole cells a creature standing at (x, y) is pushed by every scare in
// `list` at `t`: straight away from each point, most near it, none beyond its
// reach. `floor` creatures go sideways only; `scale` is one fish's share.
export function scareOffset(x, y, t, floor = false, scale = 1, list = SCARES) {
  const K = FAUNA_SCARE;
  let ox = 0, oy = 0;
  for (const s of list) {
    const e = scareEnvelope(t - s.t);
    if (e <= 0) continue;
    const reach = s.power > 1 ? K.break.reach : K.lash.reach, push = s.power > 1 ? K.break.push : K.lash.push;
    const dx = x - s.x, dy = y - s.y, d = Math.hypot(dx, dy);
    if (d >= reach) continue;
    const amp = push * (1 - d / reach) * e * scale * (floor ? K.floorK : 1);
    const run = Math.max(d, K.core);   // through the point itself the push eases to nothing and back out, never flips
    ox += amp * dx / run;
    if (!floor) oy += amp * K.lift * dy / run;
  }
  return { x: Math.round(ox), y: Math.round(oy) };
}

// The row the ground stands at under column `col` of the deep: the scales
// heaped on the floor, or the floor itself.
export function floorRowAt(col) {
  const b = deepBed;
  let top = deepFloor();
  if (b.grid) {
    const c = Math.floor((deepX0() + col * P - b.x) / b.p);
    if (c >= 0 && c < b.cols) top -= (topRow(b, c) + 1) * b.p;
  }
  return (top - deepTop()) / P;
}

// Where creature `c` is at `t` seconds, and which way it faces. `floorRow(x)`
// is the row its ground stands at under column x (the scales heap on the
// floor), the deep's floor when nobody says. A school is left whole here: its
// fish are scared one at a time (`scareOffset`), where the drawing places
// them. Startled, it is on its bolt until it is back, then on the path it
// came back in on.
export function faunaAt(c, t, floorRow = () => ROWS, scares = SCARES) {
  const M = FAUNA_MOTION, span = COLS + 2 * M.wrap;
  const startled = c.t0 >= 0 && t >= c.t0;
  if (startled && t < c.back) return boltAt(c, t, floorRow);
  const dir = startled ? c.bdir : c.dir;
  let x = ((((startled ? c.bx0 : c.x0) + dir * c.v * run(c, t)) % span) + span) % span - M.wrap;
  // One that never swims walks back from the end to its own spot.
  if (startled && !c.v) {
    const K = FAUNA_STARTLE, went = Math.round(Math.floor((t - c.back) * K.rate) / K.rate * K.walkIn);
    if (went < Math.abs(x - c.edge)) x = c.edge + dir * went;
  }
  const col = Math.round(x);
  let y;
  if (c.floor) y = floorRow(col + 2) - heightOf(c.kind);
  else if (c.low) y = floorRow(col + 3) - M.low.up + Math.round(Math.sin(t * M.low.bob + c.seed * 9) * M.low.amp);
  else {
    const jelly = c.kind === 'jelly';
    y = c.y + Math.round(Math.sin(t * (jelly ? M.jellyBob : M.bob) + c.seed * 11) * (jelly ? M.jellyAmp : M.amp));
    y = Math.min(y, floorRow(col) - M.clear);
  }
  if (c.kind === 'school' || !scares.length) return { x, y, dir };
  const o = scareOffset(x, y, t, c.floor, 1, scares);
  if (c.floor) return { x: x + o.x, y, dir };
  const ny = Math.max(0, y + o.y);
  return { x: x + o.x, y: c.low ? Math.min(ny, floorRow(col) - heightOf(c.kind)) : Math.min(ny, floorRow(col) - M.clear), dir };
}

// --- a startle -------------------------------------------------------------------
// Bolting for the nearer end of the deep: whole cells, a held pose at a time,
// along its own row or along the ground, and held just past the end until it
// is back -- where the path it comes back in on starts, so nothing jumps.
export const bolting = (c, t) => c.t0 >= 0 && t >= c.t0 && t < c.back;
function boltAt(c, t, floorRow) {
  const K = FAUNA_STARTLE, M = FAUNA_MOTION;
  const went = Math.min(c.dist, Math.round(K.pace * Math.floor((t - c.t0) * K.rate) / K.rate));
  const x = c.sx + c.ddir * went, col = Math.round(x);
  const y = c.floor ? floorRow(col + 2) - heightOf(c.kind)
    : c.low ? floorRow(col + 3) - M.low.up
    : Math.max(0, Math.min(c.sy, floorRow(col) - M.clear));
  return { x, y, dir: c.ddir };
}

// The cells a creature at `p` is drawn over, [l, r) by [top, bot), for the
// click, and the spot (x, y) its handful is shaken from.
function boxOf(c, p) {
  const { x, y, dir } = p;
  if (c.kind === 'school') {
    const w = widthOf('sardine'), h = heightOf('school'), sx = c.spread[0] / 2 + 1, sy = c.spread[1] / 2 + 1;
    return { l: x - sx, r: x + sx + w, top: y - sy, bot: y + sy + h, x: x + w / 2, y: y + h / 2 };
  }
  if (c.kind === 'siphon') {
    const n = FAUNA_SIPHON.bells, a = Math.ceil(FAUNA_SIPHON.amp);
    return { l: dir > 0 ? x - n + 1 : x - 1, r: dir > 0 ? x + 2 : x + n, top: y - 1 - a, bot: y + 2 + a, x: x + 0.5, y };
  }
  if (c.kind === 'gulper') {
    const hw = widthOf('gulperHead'), h = heightOf('gulper'), tail = FAUNA_GULPER.tail;
    return { l: dir > 0 ? x - tail : x, r: dir > 0 ? x + hw : x + hw + tail, top: y, bot: y + h + FAUNA_GULPER.amp,
             x: x + hw / 2, y: y + h / 2 };
  }
  const w = widthOf(c.kind), h = heightOf(c.kind);
  return { l: x, r: x + w, top: y, bot: y + h, x: x + w / 2, y: y + h / 2 };
}

// The creature a click at world (wx, wy) lands on, within the bird's reach,
// the nearest if several: one already bolting is not there to be caught.
export function faunaUnder(wx, wy, t = now() / 1000) {
  const cx = (wx - deepX0()) / P, cy = (wy - deepTop()) / P, R = FAUNA_STARTLE.reach;
  if (cx < 0 || cx > COLS || cy < 0 || cy > ROWS) return null;
  let best = null, near = Infinity;
  for (const c of POPULATION) {
    if (bolting(c, t)) continue;
    const b = boxOf(c, faunaAt(c, t, floorRowAt));
    const d = Math.max(b.l - cx, 0, cx - b.r, b.top - cy, cy - b.bot);
    if (d <= R && d < near) { near = d; best = c; }
  }
  return best;
}
export const overFauna = (wx, wy) => !!faunaUnder(wx, wy);

// Every creature in world pixels, the spot a click on it would shake its
// handful from: for the checks and the scenes, which have to aim at one.
export function faunaReport(t = now() / 1000) {
  return POPULATION.map(c => {
    const p = faunaAt(c, t, floorRowAt), b = boxOf(c, p);
    return { kind: c.kind, zone: c.zone, i: c.i, x: deepX0() + b.x * P, y: deepTop() + b.y * P,
             cx: p.x, cy: p.y, bolting: bolting(c, t), inside: b.r > 0 && b.l < COLS };
  });
}

// A click on a creature: it shakes loose the bird's handful, which sinks as
// loose scales for the gatherers, and bolts for the nearer end of the deep,
// to come back in there a while after. True if one was there.
export function startleFauna(wx, wy) {
  const t = now() / 1000, c = faunaUnder(wx, wy, t);
  if (!c) return false;
  const K = FAUNA_STARTLE, M = FAUNA_MOTION, span = COLS + 2 * M.wrap;
  const p = faunaAt(c, t, floorRowAt), b = boxOf(c, p);
  shed(deepX0() + b.x * P, deepTop() + b.y * P, FAUNA_SCALES);
  // Out past the end by its whole reach and short of the wrap, so the path
  // it comes back in on starts where the bolt left it.
  const out = Math.min(reachOf(c) + 1, M.wrap - 1);
  c.t0 = t; c.sx = Math.round(p.x); c.sy = p.y;
  c.ddir = b.x < COLS / 2 ? -1 : 1;
  c.edge = c.ddir < 0 ? -out : COLS + out;
  c.dist = Math.abs(c.edge - c.sx);
  c.back = t + Math.ceil(c.dist / K.pace * K.rate) / K.rate + K.away[0] + rand() * (K.away[1] - K.away[0]);
  if (c.v) {
    c.bdir = -c.ddir;
    c.bx0 = c.edge + M.wrap - c.bdir * c.v * run(c, c.back);
  } else {
    // its own spot, which it walks back to
    const home = ((c.x0 % span) + span) % span - M.wrap;
    c.bdir = home >= c.edge ? 1 : -1;
    c.bx0 = c.x0;
  }
  return true;
}

// Every creature home, unstartled: a new game, a save read back.
export function resetFauna() {
  for (const c of POPULATION) c.t0 = -1;
}

// A school's members about its middle, each with a seed of its own.
export function schoolAt(c, m, t) {
  const S = FAUNA_MOTION.school;
  return {
    dx: Math.round((unit(m + c.seed * 50) - 0.5) * c.spread[0] + Math.sin(t * S.drift + m) * S.driftAmp),
    dy: Math.round((unit(m * 3 + c.seed * 70) - 0.5) * c.spread[1] + Math.sin(t * S.bob + m * 1.7) * S.bobAmp),
    seed: c.seed + m * S.seedStep,
  };
}

// The frame a drawing is on at `t`, on its own held clock.
export const frameOf = (key, seed, t) => {
  const s = FAUNA_SPRITES[key];
  return Math.floor(t * s.fps + seed * 10) % s.f.length;
};

// How wide a creature reaches either side of its x, for the cull.
const widthOf = key => FAUNA_SPRITES[key].f[0][0].length;
export const reachOf = c => c.kind === 'siphon' ? FAUNA_SIPHON.bells + 1
  : c.kind === 'gulper' ? FAUNA_GULPER.tail + widthOf('gulperHead')
  : c.kind === 'school' ? Math.ceil(c.spread[0] / 2 + FAUNA_MOTION.school.driftAmp) + widthOf('sardine')
  : widthOf(c.kind);
