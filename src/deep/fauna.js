// The deep's creatures (DESIGN.md, "The deep's zones"): who lives where, and
// where each one is at a moment. Everything is read off a creature's seed and
// the clock (a wanderer's way is walked from the clock's start, the same
// every time), so there is nothing to save, and a reader
// other than the drawing -- a meal taken from a zone, a shoal parting round a
// blow -- can ask the same function where a creature is without the drawing.
// A click startles one (`startleFauna`): it plays its own reaction
// (FAUNA_REACT, deep/react.js) over its path, or for the school bolts. The
// moment is kept on the creature for this session only: a save read back
// on the same clock carries on with it, and a new page finds every one home.
// Its handful is shaken loose once a visit (`S.faunaShed`, saved): a
// swimmer's visit is its lap of the deep in its slot, from coming in at one
// end to going out at an end; one living in its zone has had its visit for
// good, and a bolt ends the school's.
//
// In cells: x along from the deep's left end, y down from its ceiling, the
// drawing's top-left.

import { held } from '../reset.js';
import { DEEP_W, DEEP_H, P, FAUNA, FAUNA_ZONES, FAUNA_SPRITES, FAUNA_MOTION, FAUNA_GULPER,
         FAUNA_SIPHON, FAUNA_SCARE, FAUNA_STARTLE, FAUNA_SCALES, FAUNA_REACT, FAUNA_POSES,
         FAUNA_REACT_MOTION, FAUNA_WANDER, FAUNA_TURNS, FAUNA_REFILL } from '../config.js';
import { S, deepBed } from '../state.js';
import { now } from '../clock.js';
import { rand } from '../rng.js';
import { topRow } from '../grid.js';
import { deepTop, deepX0, deepFloor } from './place.js';
import { deepRestTop } from '../view.js';
import { shed } from './scales.js';
import { poseAt, playing, leadOf } from './react.js';

export const COLS = DEEP_W / P, ROWS = DEEP_H / P;

export const unit = n => { const x = Math.sin(n * 127.1 + 3.7) * 43758.5453; return x - Math.floor(x); };
export const unit2 = (a, b) => unit(a * 31.7 + b * 113.3);

export const zoneOf = key => FAUNA_ZONES.find(z => z.key === key);
export const zoneAtRow = y => FAUNA_ZONES.findIndex(z => y < z.to);
// The zone a creature drawn with its top at row `y` is in now, by the middle
// of its drawing: a wanderer takes the dim of whatever water it is crossing.
export const zoneHere = (kind, y) => FAUNA_ZONES[zoneAtRow(y + heightOf(kind) / 2)] || FAUNA_ZONES[FAUNA_ZONES.length - 1];

// The cells a creature's drawing spans, for the floor-dwellers' footing and
// for the drawing's cull.
export const heightOf = kind => kind === 'gulper' ? FAUNA_SPRITES.gulperHead.f[0].length
  : kind === 'siphon' ? 2 : kind === 'school' ? FAUNA_SPRITES.sardine.f[0].length : FAUNA_SPRITES[kind].f[0].length;

// The population, built once off the table: the same creatures in the same
// places on every load. Any row's `n` living in its zone, then the slots the
// swimmers take turns through (FAUNA_TURNS): a slot is not a creature but a
// place in the water, and who swims it is the visit it is on (`visitAt`).
const pick = (v, k) => (Array.isArray(v) ? v[0] + unit(k) * (v[1] - v[0]) : v);
const ROW = Object.fromEntries(FAUNA.map(r => [r.kind, r]));
const ROSTER = FAUNA_TURNS.roster;
export const POPULATION = (() => {
  const out = [];
  let i = 0;
  for (const row of FAUNA) {
    for (let s = 0; s < row.n; s++, i++) {
      out.push({
        kind: row.kind, zone: row.zone, i,
        // its name in the save: the kind and which of them, so a row changed
        // elsewhere in the table leaves its marks where they were
        key: row.kind + s,
        x0: unit(i) * COLS,
        y: row.y ? Math.round(pick(row.y, i + 7)) : null,
        v: pick(row.v, i + 2),
        dir: s % row.flip ? -1 : 1,
        seed: unit(i * 1.7 + 5),
        floor: !!row.floor, low: !!row.low, hop: !!row.hop, wander: false,
        n: row.school ? Math.round(pick(row.school, i + 11)) : 0,
        spread: row.spread || null,
        // a bolt: the second it came (-1 none), where from and which way,
        // the second it is back, and the path it comes back in on
        t0: -1, sx: 0, sy: 0, ddir: 0, dist: 0, back: 0, bx0: 0, bdir: 0, edge: 0,
        // a reaction: the second it was clicked (-1 none)
        r0: -1,
      });
    }
  }
  for (let s = 0; s < FAUNA_TURNS.slots; s++, i++) {
    out.push({ turns: true, slot: s, i, x0: unit(i) * COLS, visits: new Map() });
  }
  return out;
})();
export const SLOTS = POPULATION.filter(c => c.turns);

// How far along its way a creature has come by `t` seconds: steadily, or for
// the amphipods in dashes and stops.
function run(c, t) {
  if (!c.hop) return t;
  const { dash, step, burst } = FAUNA_MOTION.hop, beat = t * dash + c.seed * 9;
  return Math.floor(beat) * step + Math.min(1, (beat % 1) * burst) * step;
}

// --- a wanderer's way ------------------------------------------------------------
// FAUNA_WANDER: the whole height, on a heading that turns at random. The
// turn at each step answers where it is, so there is no closed form; it is
// walked on a fixed step from the clock's start instead, off a noise keyed by
// the slot and the step, so any moment comes out the same however and
// whenever it is asked for -- a reload on the same clock finds it where it
// was. Play only ever asks a little further on, one step a frame; a moment
// asked for out of order (the smear looks a few frames back) is walked from
// the kept moment before it.
//
// The slots are walked together, because who comes in next depends on who is
// out in the others (FAUNA_TURNS): the walk carries each slot's kind and its
// laps, and a lap ends only at the wrap, out past the deep's end, so a kind
// never changes where it can be seen.
const SPAN = COLS + 2 * FAUNA_MOTION.wrap;
const wrapX = x => { const w = FAUNA_MOTION.wrap; return ((((x + w) % SPAN) + SPAN) % SPAN) - w; };
// One kind's pace, the same every visit.
const paceOf = kind => pick(ROW[kind].v, ROSTER.indexOf(kind) + 2);
// The rows a kind's drawing reaches past its own top and bottom as it swims:
// a school's fish about its middle, a jelly's bob, a siphon's float over it
// and its bells swaying under.
function bandOf(kind) {
  const M = FAUNA_MOTION;
  if (kind === 'school') { const k = Math.ceil(ROW.school.spread[1] / 2 + M.school.bobAmp); return { up: k, down: k }; }
  if (kind === 'jelly') return { up: M.jellyAmp, down: M.jellyAmp };
  if (kind === 'siphon') { const a = Math.ceil(FAUNA_SIPHON.amp); return { up: a, down: a }; }
  return { up: 0, down: 0 };
}
// The top of the water the deep's own frame shows, in rows: its ceiling, or
// over it, where a window taller than the deep shows the water going on up
// (render/fauna.js `drawDeepZones` lays it to the window's top).
// The top it is stretched from is eased: a resized window moves the top of
// the water, and every creature's height is a fraction of the way down from
// it, so reading the new top at once would jump them all. The drawing steps
// `glideWaterTop` once a frame; nothing that does not draw (the node tier)
// does, and reads the top itself. Drawing-side, never saved; the path stays
// a pure function of the seed and the clock.
let easedTop = null; // page: the drawing's eased water top, the window's
export function glideWaterTop(dt) {
  const to = deepRestTop();
  easedTop = easedTop == null ? to : easedTop + (to - easedTop) * (1 - Math.exp(-Math.min(dt, 0.1) / FAUNA_MOTION.topGlide));
}
export const waterTop = () => Math.min(0, Math.floor(((easedTop ?? deepRestTop()) - deepTop()) / P));
// The rows the walk is taken in, top-left of the drawing: from the ceiling's
// row to the floor's clearance. Fixed, so the walk is the same in any window.
const walkLo = kind => FAUNA_WANDER.top + bandOf(kind).up;
// The rows it is seen on: the walk stretched from the top of the water shown
// down to the floor's clearance, so a tall window's water is swum to its top.
export const wanderLo = kind => waterTop() + walkLo(kind);
export const wanderHi = kind => ROWS - FAUNA_MOTION.clear - heightOf(kind) - bandOf(kind).down;
const seenRow = (y, kind) => {
  const lo = walkLo(kind), hi = wanderHi(kind), top = wanderLo(kind);
  return top + (y - lo) * (hi - top) / (hi - lo);
};
// A seeded noise in [0, 1), by slot and step, the same on every load:
// integer hashing, since the steps run to the millions.
function noise(a, n) {
  let h = Math.imul(n | 0, 0x27d4eb2d) ^ Math.imul(a + 1, 0x9e3779b1);
  h = Math.imul(h ^ (h >>> 15), 0x85ebca77);
  h = Math.imul(h ^ (h >>> 13), 0xc2b2ae3d);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}
// A row anywhere in the water a kind swims, by a unit number: where a slot
// sets out and where each kind after it comes in (the owner, 2026-10-15: "the
// creatures should be totally random in their height band where they spawn").
const anyRow = (kind, u) => Math.round(walkLo(kind) + u * (wanderHi(kind) - walkLo(kind)));
// Bound first for the nearer edge, so one setting out in the middle has swum
// the whole height by the time it has crossed it twice.
const goalOf = (kind, y) => (y < (walkLo(kind) + wanderHi(kind)) / 2 ? -1 : 1);
// Every slot at the clock's start: the roster's first kinds, in order, and
// `next` the last of them handed out. The clock starts again with every page,
// so where they set out is where a reload finds them.
function turnsStart() {
  const K = FAUNA_WANDER;
  const s = SLOTS.map((c, k) => {
    const kind = ROSTER[k % ROSTER.length], dir = c.i % 2 ? -1 : 1;
    const y = anyRow(kind, unit(c.i + 7));
    return { x: wrapX(c.x0), y, th: dir > 0 ? K.start : Math.PI - K.start, om: 0, face: dir, lap: 0, kind, goal: goalOf(kind, y) };
  });
  return { s, next: (SLOTS.length - 1) % ROSTER.length };
}
// One slot a step on from `a`, the `n`th, and whether it went out past an end.
function slotStep(c, a, n) {
  const K = FAUNA_WANDER, h = K.step, lo = walkLo(a.kind), hi = wanderHi(a.kind), v = paceOf(a.kind);
  let om = a.om + (noise(c.i, n) - 0.5) * 2 * K.jitter * h;
  om = Math.max(-K.turn, Math.min(K.turn, om * (1 - K.damp * h)));
  let turn = om;
  const cos = Math.cos(a.th), sin = Math.sin(a.th), down = cos >= 0 ? 1 : -1;
  const nearTop = (lo + K.edge - a.y) / K.edge, nearBot = (a.y - (hi - K.edge)) / K.edge;
  if (nearTop > 0 && sin < K.facing) turn += down * K.shove * Math.min(1, nearTop);
  if (nearBot > 0 && sin > -K.facing) turn -= down * K.shove * Math.min(1, nearBot);
  // bound for the far edge, turned gently toward a slope of `aim` that way,
  // and for the other once within `edge` of it
  const goal = nearBot > 0 ? -1 : nearTop > 0 ? 1 : a.goal;
  turn += down * K.seek * Math.max(-1, Math.min(1, (goal * K.aim - sin) / K.aim));
  if (sin > K.steep) turn -= down * K.level;
  if (sin < -K.steep) turn += down * K.level;
  const th = a.th + turn * h, cc = Math.cos(th), raw = a.x + cc * v * h, w = FAUNA_MOTION.wrap;
  return { x: wrapX(raw), y: Math.max(lo, Math.min(hi, a.y + Math.sin(th) * v * h)), th, om,
           face: cc > K.face ? 1 : cc < -K.face ? -1 : a.face, lap: a.lap, kind: a.kind, goal, inAt: a.inAt,
           out: raw < -w || raw >= COLS + w };
}
// The kind slot `k` takes next: the roster's next after the last handed out
// that is neither out in another slot nor the one leaving, so no two slots
// ever show the same kind and the roster goes round.
function nextKind(s, k, next) {
  for (let j = 1; j <= ROSTER.length; j++) {
    const at = (next + j) % ROSTER.length, cand = ROSTER[at];
    if (cand !== s[k].kind && !s.some((o, m) => m !== k && !o.gone && o.kind === cand)) return { kind: cand, next: at };
  }
  return { kind: s[k].kind, next };
}
// How far a kind's drawing reaches either side of its x, facing `dir`, and
// the gap kept between it and the glass as it comes in: a school's fish
// drift about their places, so theirs is that drift wider.
export const spanOf = (kind, dir) => boxOf({ kind, spread: ROW[kind].spread }, { x: 0, y: 0, dir });
const offOf = kind => FAUNA_REFILL.off + (kind === 'school' ? Math.ceil(FAUNA_MOTION.school.driftAmp) : 0);
// Every slot a step on. One gone out past an end starts its next lap as the
// next kind, somewhere new in the height (out past the end, where nobody sees
// it change). A slot whose swimmer the serpent has taken (`gone`) stands
// still and unseen until the meal lets its next kind in (`holdSlot`), which
// swims in from just off one side of the glass (FAUNA_REFILL), its step kept
// as `inAt`.
function turnsStep(w, n) {
  let next = w.next;
  const s = w.s.map((a, k) => (a.gone ? a : slotStep(SLOTS[k], a, n)));
  for (let k = 0; k < s.length; k++) {
    if (!s[k].out || s[k].gone) continue;
    const got = nextKind(s, k, next);
    next = got.next;
    const y = anyRow(got.kind, noise(SLOTS[k].i + 90, n));
    s[k] = { ...s[k], kind: got.kind, lap: s[k].lap + 1, y, goal: goalOf(got.kind, y), inAt: undefined };
  }
  const ev = EATS.get(n + 1);
  if (ev) for (const e of ev) {
    const k = e.slot;
    if (e.eat) { s[k] = { ...s[k], gone: true }; continue; }
    if (!s[k].gone) continue;
    // the next kind, just off the side of the glass the meal named, its
    // whole drawing out of sight, heading in at its own pace
    const got = nextKind(s, k, next), dir = e.dir, K = FAUNA_WANDER;
    next = got.next;
    const y = anyRow(got.kind, noise(SLOTS[k].i + 90, n)), span = spanOf(got.kind, dir), off = offOf(got.kind);
    const x = dir > 0 ? e.l - span.r - off : e.r - span.l + off;
    s[k] = { x, y, th: dir > 0 ? K.start : Math.PI - K.start, om: 0, face: dir,
             lap: s[k].lap + 1, kind: got.kind, goal: goalOf(got.kind, y), inAt: n + 1 };
  }
  return { s, next };
}
// The walk: the moment at step `n`, walked from the nearest moment kept. Only
// the last `held` kept moments stay (and the start), so a yard left running
// for days holds a few dozen moments rather than one every `keep` seconds of
// it; a moment asked for before them is walked again from the start, which
// comes out the same.
let WALK = null; // held: the walk so far (`forgetWalk`)
// The meal's holds on the slots, by the step they fall on: `eat` takes the
// slot's swimmer out of the walk, the other lets its next kind in. They are
// the walk's only input besides the seeds, kept and dropped with it.
const EATS = new Map();
// A new page, as far as the walk goes: nothing walked yet (for the checks).
export const forgetWalk = () => { WALK = null; EATS.clear(); };
held('deep-walk', forgetWalk);
// The meal takes slot `slot`'s swimmer at `t` seconds (`eat`), or lets the
// slot's next kind in: from the next step on, from just off the `side` (-1
// left, 1 right) of the glass `at` ({ l, r }, the deep's cells it spans).
// Anything walked past that step is walked again from the kept moment before it.
export function holdSlot(slot, t, eat, at = null, side = 1) {
  const m = Math.floor(Math.max(0, t) / FAUNA_WANDER.step) + 1;
  if (!EATS.has(m)) EATS.set(m, []);
  const g = at || { l: 0, r: COLS };
  EATS.get(m).push(eat ? { slot, eat } : { slot, eat, l: g.l, r: g.r, dir: side > 0 ? -1 : 1 });
  const w = WALK;
  if (!w || w.n < m) return;
  const per = Math.round(FAUNA_WANDER.keep / FAUNA_WANDER.step);
  let k = 0;
  for (const key of w.kept.keys()) if (key * per < m && key > k) k = key;
  for (const key of [...w.kept.keys()]) if (key * per >= m) w.kept.delete(key);
  w.n = k * per; w.s = w.kept.get(k);
}
// Whether slot `slot`'s swimmer is in the serpent's keeping at `t`.
export const slotGone = (slot, t) => wanderAt(SLOTS[slot], t).gone;
function turnsState(n) {
  const per = Math.round(FAUNA_WANDER.keep / FAUNA_WANDER.step);
  let w = WALK;
  if (!w) { const s0 = turnsStart(); w = WALK = { kept: new Map([[0, s0]]), n: 0, s: s0 }; }
  if (n < w.n) {
    let k = 0;
    for (const key of w.kept.keys()) if (key * per <= n && key > k) k = key;
    w.n = k * per; w.s = w.kept.get(k);
  }
  while (w.n < n) {
    w.s = turnsStep(w.s, w.n);
    w.n++;
    if (w.n % per === 0 && !w.kept.has(w.n / per)) {
      w.kept.set(w.n / per, w.s);
      if (w.kept.size > FAUNA_WANDER.held + 1) {
        let oldest = Infinity;
        for (const key of w.kept.keys()) if (key > 0 && key < oldest) oldest = key;
        w.kept.delete(oldest);
      }
    }
  }
  return w.s;
}
// How long ago a slot's swimmer was let in after a meal, in seconds, or
// Infinity for one that came in on its lap.
const sinceIn = (a, t) => (a.inAt == null ? Infinity : t - a.inAt * FAUNA_WANDER.step);
// Where a slot's swimmer is at `t` seconds, between its two steps either
// side, so it glides rather than ticks; across the wrap, out past the ends,
// it takes the later, its new lap and kind with it.
export function wanderAt(c, t) {
  const f = Math.max(0, t) / FAUNA_WANDER.step, n = Math.floor(f), w = turnsState(n), k = f - n;
  const a = w.s[c.slot], b = turnsStep(w, n).s[c.slot];
  if (b.lap !== a.lap || Math.abs(b.x - a.x) > COLS / 2)
    return { x: b.x, y: seenRow(b.y, b.kind), dir: b.face, lap: b.lap, kind: b.kind, gone: !!b.gone, since: sinceIn(b, t) };
  return { x: a.x + (b.x - a.x) * k, y: seenRow(a.y + (b.y - a.y) * k, a.kind), dir: a.face, lap: a.lap, kind: a.kind,
           gone: !!(a.gone || b.gone), since: sinceIn(a, t) };
}

// The creature a slot holds at `t`: one of its own for every lap, so a new
// kind coming in is a new visit with a handful of its own to drop, and a
// click's reaction or bolt is kept on the visit it was made on. Its pace,
// seed and school are read off its kind and lap, the same on every load.
// A few visits are kept: the one play is on, and the ones a look back finds.
const VISITS_KEPT = 4;
export function visitAt(c, t) {
  if (!c.turns) return c;
  const w = wanderAt(c, t);
  let v = c.visits.get(w.lap);
  if (v && v.kind === w.kind) return v;
  const row = ROW[w.kind], k = c.i * 1.7 + w.lap * 3.1;
  v = {
    kind: w.kind, zone: row.zone, i: c.i, home: c, lap: w.lap,
    key: `${w.kind}@${c.slot}.${w.lap}`,
    v: paceOf(w.kind), seed: unit(k + 5),
    floor: false, low: false, hop: false, wander: true,
    n: row.school ? Math.round(pick(row.school, k + 11)) : 0,
    spread: row.spread || null,
    t0: -1, sx: 0, sy: 0, ddir: 0, dist: 0, back: 0, bx0: 0, bdir: 0, edge: 0,
    r0: -1,
  };
  c.visits.set(w.lap, v);
  if (c.visits.size > VISITS_KEPT) {
    let oldest = Infinity;
    for (const key of c.visits.keys()) if (key !== w.lap && key < oldest) oldest = key;
    c.visits.delete(oldest);
  }
  return v;
}
// Whether a creature is in the serpent's keeping (deep/meals.js): not drawn,
// not clicked; the meal draws it in its orb.
export const eatenNow = (c, t) => !!c.wander && wanderAt(c.home, t).gone;
// Whether a creature is a newcomer let into an eaten slot within the last
// FAUNA_REFILL.grace seconds: the meal passes it over for any other.
export const newcomer = (c, t) => !!c.wander && wanderAt(c.home, t).since < FAUNA_REFILL.grace;
// Every creature out at `t`, a slot's by its visit.
export const faunaOut = (t = now() / 1000) => POPULATION.map(c => visitAt(c, t));
// The first second from `from` on, in steps of `every`, that a slot holds
// `kind` at least `inset` cells inside the deep's ends, or null within
// `within` seconds: for the scenes, which want one kind on the deep and
// would otherwise wait out the turns frame by frame.
export function faunaWhen(kind, from, { every = 0.5, inset = 0, within = 3600 } = {}) {
  for (let t = from; t < from + within; t += every)
    for (const c of SLOTS) { const w = wanderAt(c, t); if (w.kind === kind && w.x > inset && w.x < COLS - inset) return t; }
  return null;
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
  const M = FAUNA_MOTION, span = SPAN;
  c = visitAt(c, t);
  if (bolting(c, t)) return boltAt(c, t, floorRow);
  const startled = c.t0 >= 0 && t >= c.t0;
  if (c.wander) {
    // A slot's way; a jelly bobs on it at its own slow pace, inside the rows its kind keeps.
    // The bob is the jelly's band, so it is not kept off the floor twice.
    const jelly = c.kind === 'jelly', w = wanderAt(c.home, t), x = w.x;
    const floorY = floorRow(Math.round(x)) - M.clear - heightOf(c.kind) - bandOf(c.kind).down + (jelly ? M.jellyAmp : 0);
    const bob = jelly ? Math.sin(t * M.jellyBob + c.seed * 11) * M.jellyAmp : 0;
    // `|| 0`: a row rounded up to the ceiling from just over it is -0, which a scare's sum is not
    const y = Math.min(Math.round(w.y + bob), floorY) || 0;
    if (!scares.length) return { x, y, dir: w.dir };
    const o = scareOffset(x, y, t, false, 1, scares);
    return { x: x + o.x, y: Math.max(waterTop(), Math.min(y + o.y, floorY)), dir: w.dir };
  }
  const dir = startled ? c.bdir : c.dir;
  // One that never swims stands on its own spot, well inside the deep: the
  // wrap's shift is only for those that come back round.
  const x = c.v ? ((((startled ? c.bx0 : c.x0) + dir * c.v * run(c, t)) % span) + span) % span - M.wrap
    : M.stand + c.x0 / COLS * (COLS - 2 * M.stand);
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
// Bolting for the nearer end of the deep: turned to face it and held a beat
// where it was clicked, then whole cells at the frame rate, gathering speed, along its
// own row or along the ground, and held just past the end until it is back
// -- where the path it comes back in on starts, so nothing jumps. A slot's
// swimmer is held out there for the rest of its lap: its visit is over, and
// the next kind comes in when the lap ends.
export const bolting = (c, t) => c.t0 >= 0 && t >= c.t0 && (c.wander ? wanderAt(c.home, t).lap === c.lap : t < c.back);
const holdOf = c => FAUNA_REACT[c.kind].hold || 0;
function boltAt(c, t, floorRow) {
  const K = FAUNA_STARTLE, M = FAUNA_MOTION;
  const off = Math.max(0, t - c.t0 - holdOf(c)), ramp = FAUNA_REACT_MOTION.ramp;
  const ran = off < ramp ? K.pace * off * off / (2 * ramp) : K.pace * (off - ramp / 2);
  const went = Math.min(c.dist, Math.round(ran));
  const x = c.sx + c.ddir * went, col = Math.round(x);
  const y = c.floor ? floorRow(col + 2) - heightOf(c.kind)
    : c.low ? floorRow(col + 3) - M.low.up
    : Math.max(c.wander ? waterTop() : 0, Math.min(c.sy, floorRow(col) - M.clear));
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

// --- a reaction ------------------------------------------------------------------
export const reactionOf = kind => FAUNA_REACT[kind];
export const reacting = (c, t) => playing(FAUNA_REACT[c.kind], c.r0, t);
// Mid-reaction or mid-bolt: not there to be clicked again until it is done.
export const busy = (c, t) => bolting(c, t) || reacting(c, t);

// Where creature `c` is drawn at `t`: its path (`faunaAt`) with its
// reaction's pose over it, the frame clock `ft` its drawing turns on, the
// pose itself (`r`, null when it is not reacting) and the row its path
// stands on (`by`), where silt is kicked up.
export function faunaPose(c, t, floorRow = floorRowAt) {
  c = visitAt(c, t);
  const p = faunaAt(c, t, floorRow);
  if (bolting(c, t)) return { ...p, by: p.y, ft: c.t0 + (t - c.t0) * FAUNA_STARTLE.quick, r: null };
  if (!reacting(c, t)) return { ...p, by: p.y, ft: t + (c.lead || 0), r: null };
  const r = poseAt(FAUNA_REACT[c.kind], t - c.r0);
  const y = p.y + r.dy;
  return { x: p.x + p.dir * r.dx, y: c.floor ? y : Math.max(c.wander ? waterTop() : 0, y), dir: r.turn ? -p.dir : p.dir,
           by: p.y, ft: t + (c.lead0 || 0) + r.gain, r };
}

// The creature a click at world (wx, wy) lands on, within the bird's reach,
// the nearest if several: one mid-reaction or bolting is not there to be
// caught again until it is done.
export function faunaUnder(wx, wy, t = now() / 1000) {
  const cx = (wx - deepX0()) / P, cy = (wy - deepTop()) / P, R = FAUNA_STARTLE.reach;
  if (cx < 0 || cx > COLS || cy < waterTop() || cy > ROWS) return null;
  let best = null, near = Infinity;
  for (const c of faunaOut(t)) {
    if (busy(c, t) || eatenNow(c, t)) continue;
    const b = boxOf(c, faunaAt(c, t, floorRowAt));
    const d = Math.max(b.l - cx, 0, cx - b.r, b.top - cy, cy - b.bot);
    if (d <= R && d < near) { near = d; best = c; }
  }
  return best;
}
export const overFauna = (wx, wy) => !!faunaUnder(wx, wy);

// Every creature in world pixels, the spot a click on it would shake its
// handful from: for the checks and the scenes, which have to aim at one.
// `cx`, `cy` are where it is drawn, its reaction's pose and all.
export function faunaReport(t = now() / 1000) {
  return faunaOut(t).map(c => {
    const p = faunaPose(c, t), b = boxOf(c, p);
    // a slot's swimmer: which slot, and which lap of it, its visit
    return { kind: c.kind, zone: zoneHere(c.kind, p.y).key, home: c.zone, i: c.i, key: c.key,
             slot: c.home ? c.home.slot : null, lap: c.home ? c.lap : null, x: deepX0() + b.x * P, y: deepTop() + b.y * P,
             cx: p.x, cy: p.y, dir: p.dir, pose: p.r ? p.r.pose ?? null : null,
             // what the reaction holds besides its place, so a check can see one that only changes its drawing
             held: p.r ? [p.r.pose, p.r.turn, p.r.spacing, p.r.amp, p.r.lights, p.r.halo, p.r.vflip].join() : null,
             bolting: bolting(c, t), reacting: reacting(c, t), eaten: eatenNow(c, t), inside: b.r > 0 && b.l < COLS };
  });
}

// A click on a creature: it plays its reaction, and the first click of its
// visit shakes loose the bird's handful, which sinks as loose scales for the
// gatherers; the school bolts for the nearer end of the deep, to come back in
// there a while after, a new visit. True if one was there.
export function startleFauna(wx, wy) {
  const t = now() / 1000, c = faunaUnder(wx, wy, t);
  if (!c) return false;
  const p = faunaAt(c, t, floorRowAt), b = boxOf(c, p);
  if (!faunaShed(c)) {
    shed(deepX0() + b.x * P, deepTop() + b.y * P, FAUNA_SCALES);
    // A resident's bolt is its visit's end, so it is not marked; a slot's
    // visit is its lap. Only the visits out now are kept, so the list stays
    // as short as the deep's population.
    const out = new Set(faunaOut(t).map(o => o.key));
    if (c.wander || !FAUNA_REACT[c.kind].bolt) S.faunaShed = [...(S.faunaShed || []).filter(k => out.has(k)), c.key];
  }
  if (FAUNA_REACT[c.kind].bolt) bolt(c, t, p, b);
  else { c.r0 = t; c.lead0 = c.lead || 0; c.lead = c.lead0 + leadOf(FAUNA_REACT[c.kind]); }
  return true;
}
// Whether creature `c` has shaken its handful loose this visit.
export const faunaShed = c => (S.faunaShed || []).includes(c.key);
function bolt(c, t, p, b) {
  const K = FAUNA_STARTLE, M = FAUNA_MOTION;
  // Out past the end by its whole reach and short of the wrap, so the path
  // it comes back in on starts where the bolt left it.
  const out = Math.min(reachOf(c) + 1, M.wrap - 1);
  c.t0 = t; c.sx = Math.round(p.x); c.sy = p.y;
  c.ddir = b.x < COLS / 2 ? -1 : 1;
  c.edge = c.ddir < 0 ? -out : COLS + out;
  c.dist = Math.abs(c.edge - c.sx);
  // a slot's swimmer is away until its lap ends (`bolting`)
  c.back = c.wander ? Infinity : t + holdOf(c) + c.dist / K.pace + FAUNA_REACT_MOTION.ramp / 2 + K.away[0] + rand() * (K.away[1] - K.away[0]);
  c.bdir = -c.ddir;
  if (!c.wander) c.bx0 = c.edge + M.wrap - c.bdir * c.v * run(c, c.back);
}

// Every creature home, unstartled: a new game.
export function resetFauna() {
  forgetWalk();                         // and the meals' holds on the slots with it
  for (const c of POPULATION) {
    if (c.turns) c.visits.clear();      // every visit comes again fresh
    else { c.t0 = -1; c.r0 = -1; c.lead = c.lead0 = 0; }
  }
}
// A save read back on the clock that wrote it: a reaction or a bolt under
// way carries on where it was, so nothing jumps; one dated after the clock
// (a clock that went back) is dropped.
export function settleFauna(t = now() / 1000) {
  for (const c of POPULATION.flatMap(o => (o.turns ? [...o.visits.values()] : [o]))) {
    if (c.t0 > t) c.t0 = -1;
    if (c.r0 > t) c.r0 = -1;
  }
}

// The cells a pose's drawing is set in from its box, mirrored when it faces
// back (`FAUNA_POSES` `at`), and its width.
export function poseInset(kind, pose, dir) {
  const P0 = typeof pose === 'string' ? FAUNA_POSES[pose] : null;
  if (!P0) return { x: 0, y: 0 };
  const full = widthOf(kind), w = P0.rows ? P0.rows[0].length : P0.cols[1] - P0.cols[0];
  const at = P0.at || [0, 0];
  return { x: dir > 0 ? at[0] : full - w - at[0], y: at[1] };
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
export const widthOf = key => FAUNA_SPRITES[key].f[0][0].length;
export const reachOf = c => c.kind === 'siphon' ? FAUNA_SIPHON.bells + 1
  : c.kind === 'gulper' ? FAUNA_GULPER.tail + widthOf('gulperHead')
  : c.kind === 'school' ? Math.ceil(c.spread[0] / 2 + FAUNA_MOTION.school.driftAmp) + widthOf('sardine')
  : widthOf(c.kind);
