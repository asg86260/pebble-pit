// The deep's creatures (DESIGN.md, "The deep's zones"): who lives where, and
// where each one is at a moment. Everything is read off a creature's seed and
// the clock, so there is nothing to step and nothing to save, and a reader
// other than the drawing -- a meal taken from a zone, a shoal parting round a
// blow -- can ask the same function where a creature is without the drawing.
//
// In cells: x along from the deep's left end, y down from its ceiling, the
// drawing's top-left.

import { DEEP_W, DEEP_H, P, FAUNA, FAUNA_ZONES, FAUNA_SPRITES, FAUNA_MOTION, FAUNA_GULPER,
         FAUNA_SIPHON, FAUNA_SCARE } from '../config.js';

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

// Where creature `c` is at `t` seconds. `floorRow(x)` is the row its ground
// stands at under column x (the scales heap on the floor), the deep's floor
// when nobody says. A school is left whole here: its fish are scared one at
// a time (`scareOffset`), where the drawing places them.
export function faunaAt(c, t, floorRow = () => ROWS, scares = SCARES) {
  const M = FAUNA_MOTION, span = COLS + 2 * M.wrap;
  const x = ((c.x0 + c.dir * c.v * run(c, t)) % span + span) % span - M.wrap;
  const col = Math.round(x);
  let y;
  if (c.floor) y = floorRow(col + 2) - heightOf(c.kind);
  else if (c.low) y = floorRow(col + 3) - M.low.up + Math.round(Math.sin(t * M.low.bob + c.seed * 9) * M.low.amp);
  else {
    const jelly = c.kind === 'jelly';
    y = c.y + Math.round(Math.sin(t * (jelly ? M.jellyBob : M.bob) + c.seed * 11) * (jelly ? M.jellyAmp : M.amp));
    y = Math.min(y, floorRow(col) - M.clear);
  }
  if (c.kind === 'school' || !scares.length) return { x, y };
  const o = scareOffset(x, y, t, c.floor, 1, scares);
  if (c.floor) return { x: x + o.x, y };
  const ny = Math.max(0, y + o.y);
  return { x: x + o.x, y: c.low ? Math.min(ny, floorRow(col) - heightOf(c.kind)) : Math.min(ny, floorRow(col) - M.clear) };
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
