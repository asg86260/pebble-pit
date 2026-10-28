// The saw mill as a machine a log is followed through (DESIGN.md, "Act 3's
// goods are blocks, and bodies carry every one", "The saw mill"; the voted
// mock, branch mock-log-split). Nothing in it appears, changes or vanishes
// but at the blade: the sawyer lifts the top log off the log pile, carries
// it round and sets it down on the bed; the wheel, walked by the sawyer or
// dragged by the hand, drives the blade a stroke a turn and the bed carries
// the log into it; each column the blade eats comes out the far side as one
// 2x2 timber block that rides the bed out, slides down the chute and drops
// onto the timber mound, and the last column is the kerf, a grain a
// down-stroke falling under the blade onto the heap at the saw's foot.
//
// Everything in the machine is the act's state (`S.after.saw`, saved): the
// wheel's turn, the log on the bed and how far it is through the blade, the
// blocks on their way out, the grains in the air and the sawyer's trip, so a
// reload stands the machine back exactly where it was. Each count changes
// only at a hand-off: the log pile at the lift, the timber mound when a
// block lands on it (`setBlock`), the heap when a grain lands on it. The
// heap is a plot of grains like the act's piles (after/piles.js): the count
// is its cells, stood up from the count when read and never saved.
//
// Two doors turn the wheel and one eats the log: `turnWheel`, called by the
// hand (after/gestures.js) and by the sawyer's walk (`stepMill`). A member
// at the mill's post (after/bodies.js) still asks `workAfter('mill')` on its
// clock, and that only answers whether the sawyer is at work (work.js,
// `millWorked`); it never cuts.

import { S } from '../state.js';
import { P, AFTER_MILL, AFTER_LOG_TIMBER, AFTER_KERF_GRAINS, AFTER_BLOCK, AFTER_TIP_LOAD, AFTER_SWEEP_WAIT_S, AFTER_SPILL_S,
         AFTER_PUT_S, AFTER_WALK, AFTER_HEAP_SETTLE_S } from '../config.js';
import { bladeLogs, heapBrim, built } from './levels.js';
import { secs } from './util.js';
import { heapMid, groundOf, stationX0, floorAt, AP } from './place.js';
import { takeBlock, setBlock, pileRoom, plotOf } from './piles.js';
import { layGood } from './grove.js';
import { addGrain, put, at, topRow, bottomY, settleSome, count, colOf } from '../grid.js';

const M = AFTER_MILL, F = M.frame, LOG = AFTER_BLOCK.log, PLANK = AFTER_BLOCK.plank;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const EPS = 1e-6;
// The mill drawing's cells in the world.
const wx = c => stationX0('mill') + c * AP;
const wy = r => groundOf('mill') + r * AP;
const cx = x => (x - stationX0('mill')) / AP;
const cy = y => (y - groundOf('mill')) / AP;

// The machine's state, made the first time it is asked (a save from before
// it reads back as none).
const blankSaw = () => ({ turn: 0, hi: 0, sk: 0, sf: 0, driving: false, handAt: null, bed: null, out: [], dust: [], trip: null,
                          hitAt: null, setAt: null, n: 0, landed: 0, grains: 0, busyAt: null });
export const saw = () => S.after.saw || (S.after.saw = blankSaw());

// --- the heap ----------------------------------------------------------------------------
// The heap is at its brim while nobody has tipped it: the saw stops. The
// brim is the heap's `pile` on the one station table (after/stations.js), so
// the pile-full mark, its hover and its cursor are the yard's
// (render/pilemarks.js, input.js).
export const heapFull = () => !!S.after && S.after.stock.sawdust >= heapBrim();

// The row's key, and the box the shared mark is placed from: `pileMarkAt`
// hangs a pile row's mark five cells above its ground's top, so the box's top
// is ten cells under the saw mill's floor to hang it five under the heap.
export const HEAP_PILE = 'after-sawdust';
export const heapMarkBox = () => ({ x: heapMid() - P, y: groundOf('mill') + P * 10, w: P * 2, h: P * 2 });

// The heap's plot, a grain a cell, under the bed between the legs, kept per
// act state (a read save is a new one, and its heap is stood up afresh).
const HEAPS = new WeakMap(); // cache: each act state's heap plot, stood up from its count
export function heapPlot() {
  const a = S.after;
  let b = HEAPS.get(a);
  if (!b) {
    const h = M.heap;
    b = { x: wx(h.x), y: groundOf('mill') - h.rows * AP, cols: h.cols, rows: h.rows, p: AP, grid: new Uint8Array(h.cols * h.rows),
          n: 0, awake: null, awakeOf: null, awakeN: 0, awakeList: null, repose: false, t: 0 };
    HEAPS.set(a, b);
  }
  // A count moved by a door outside the machine (a grant) stands the heap to
  // it, settled at once: nothing of the machine's own moves it so.
  const want = Math.min(Math.max(0, Math.floor(+a.stock.sawdust || 0)), b.cols * b.rows);
  let have = count(b);
  while (have < want && addGrain(b, wx(F.bx) + AP / 2, undefined, grainTone(b), true)) { have++; while (settleSome(b, b.cols * b.rows)) { /* to rest */ } }
  while (have > want && takeTop(b)) have--;
  return b;
}
// A grain's value names it, a byte's worth (the grid's cells): the drawing
// picks its tone off it (render/after/stations.js), so it keeps it as it rolls.
const grainTone = b => 1 + ((b.seq = (b.seq || 0) + 1) % 255);
function takeTop(b) {
  let col = -1, hi = -1;
  for (let c = 0; c < b.cols; c++) { const r = topRow(b, c); if (r > hi) { hi = r; col = c; } }
  if (col < 0) return false;
  put(b, col, hi, 0);
  return true;
}

// --- the stroke --------------------------------------------------------------------------
// A turn of the wheel is a stroke. Over a turn, the bed carries the log in
// only while the blade comes down, from G0 to G1 of the turn (the voted
// mock's bite and punch: the log still while the blade rises, then driven in
// as it is slammed down), and the stroke lands at G1, the blade at its foot.
const G0 = 0.08, G1 = 0.5;
// The sawyer's walk over a stroke, its time f to the turn g: a short step
// that lifts the blade off the bottom, the heave that slams it down, a held
// beat at the foot, then the walk back up (the mock's punch).
const walkG = f => (f < 0.15 ? G0 * (f / 0.15) : f < 0.3 ? G0 + (G1 - G0) * ((f - 0.15) / 0.15) ** 2 : f < 0.55 ? G1 : G1 + (1 - G1) * (f - 0.55) / 0.45);
const walkF = g => (g < G0 ? 0.15 * g / G0 : g < G1 ? 0.15 + 0.15 * Math.sqrt((g - G0) / (G1 - G0)) : g <= G1 + EPS ? 0.3 : 0.55 + 0.45 * (g - G1) / (1 - G1));

// The log on the bed: `at` its left column as it was set down, carried right
// by the strokes; the blade eats what has passed its column. `k` the stroke
// whose down-swing feeds it next, `f` how far that one has fed, `d` the cells
// it carries the log, `to` where it leaves the log; `cut` blocks and `dust`
// grains made of it so far.
const eatenOf = bed => clamp(bed.at + LOG - F.bx, 0, LOG);
const colAt = bed => Math.min(LOG - 1, Math.floor(eatenOf(bed) + EPS));
const kerf = col => col >= AFTER_LOG_TIMBER;
function newBed(at, hi) { return { at, k: Math.floor(hi - G0) + 1, f: 0, d: 0, from: at, to: at, cut: 0, dust: 0 }; }

// Whether the stroke about to begin can go: the heap full stops the saw, a
// new column of timber waits for room on the mound for a whole cut (as the
// pile-full mark says: after/piles.js, `pileFull`), the kerf for room on the
// heap. Carrying the log up to the blade always can.
function stalled(s, bed) {
  if (heapFull()) return true;
  if (bed.at + LOG < F.bx - EPS) return false;
  const e = eatenOf(bed), col = colAt(bed);
  if (!kerf(col)) return e - col < EPS && pileRoom('timber') - s.out.length < AFTER_LOG_TIMBER;
  return S.after.stock.sawdust + s.dust.length >= heapBrim();
}
// How far the stroke about to begin carries the log: up to the blade in whole
// strokes of at most `approach`, or a column's share, the mill's second blade
// taking twice the bite, never past the column's end.
function strokeD(bed) {
  const gap = F.bx - LOG - bed.at;
  if (gap > EPS) return gap / Math.ceil(gap / M.approach - EPS);
  const col = colAt(bed), e = eatenOf(bed);
  return Math.min(col + 1 - e, bladeLogs() / M.strokes[col]);
}
// A stroke landing: whatever the blade finished comes off the far side.
function land(s, bed, hand) {
  bed.at = bed.to;
  const e0 = clamp(bed.from + LOG - F.bx, 0, LOG), e = eatenOf(bed);
  s.n++;
  if (e > e0 + EPS) {
    s.hitAt = S.after.t;
    if (hand) S.after.workAt.mill = S.after.t;
    const col = Math.min(LOG - 1, Math.floor(e0 + EPS));
    if (!kerf(col)) { if (e >= col + 1 - EPS) { s.out.push({ a: 0 }); bed.cut++; } }
    else for (let k = Math.round((e - e0) * AFTER_KERF_GRAINS); k > 0; k--) { s.dust.push({ a: 0 }); bed.dust++; }
  }
  if (e >= LOG - EPS) s.bed = null;
}
// The bed fed as far as the wheel's furthest turn `h`: false if the next
// stroke cannot go, so the wheel stops at its top.
function feedTo(s, h, hand) {
  while (s.bed) {
    // a hair short of the foot is the foot: the turn's sum of frames never lands on it exactly
    const bed = s.bed, u = (h - bed.k - G0) / (G1 - G0), f1 = u > 1 - 1e-9 ? 1 : clamp(u, 0, 1);
    if (f1 <= bed.f) return true;
    if (bed.f === 0) {
      if (stalled(s, bed)) return false;
      bed.d = strokeD(bed); bed.from = bed.at; bed.to = bed.at + bed.d;
    }
    bed.at += bed.d * (f1 - bed.f); bed.f = f1;
    if (f1 < 1) return true;
    land(s, bed, hand);
    bed.k++; bed.f = 0;
  }
  return true;
}

// The wheel turned `d` turns, by the hand or the sawyer's walk: how far it
// went. Back, it goes freely and feeds nothing; forward past its furthest it
// feeds the bed, and with a log waiting on a stopped saw it goes no further
// than the top of its stroke.
export function turnWheel(d, hand = false) {
  if (!S.after || !built('mill') || !d) return 0;
  const s = saw(), from = s.turn;
  let to = from + d;
  if (to > s.hi) {
    if (s.bed && !feedTo(s, to, hand)) to = Math.max(from, Math.min(to, s.bed.k + G0));
    s.hi = Math.max(s.hi, to);
  }
  s.turn = to;
  if (hand) s.handAt = S.after.t;
  return to - from;
}
// The wheel's angle, radians: the crank pin at its foot at a turn's start,
// so the blade is up, and at its top half a turn on, the blade at its foot.
export const wheelAngle = () => (S.after ? Math.PI / 2 + saw().turn * 2 * Math.PI : Math.PI / 2);
// How many strokes have landed, ever: the hand work counts its motions by it.
export const strokesLanded = () => (S.after ? saw().n : 0);
// Timber blocks landed on the mound off the chute, and grains on the heap, ever.
export const millLanded = () => (S.after ? saw().landed : 0);
export const grainsLanded = () => (S.after ? saw().grains || 0 : 0);
const handTurning = s => s.handAt != null && S.after.t - s.handAt < 0.15;

// --- the log onto the bed ----------------------------------------------------------------
// A log thrown by the hand (after/piles.js, AFTER_PLOTS.land: `ch` a chip,
// its x, y a block's middle): set down on an empty bed where it comes down
// onto it, its middle over the bed's seat. True once it is down.
export function bedLand(ch) {
  if (ch.kind !== 'log' || !S.after || !built('mill')) return false;
  const s = saw(), x = cx(ch.x), foot = cy(ch.y) + LOG / 2;
  if (foot < F.bed || foot > F.bed + F.bedRows || ch.vy <= 0 || x < F.L - 1 || x > F.end) return false;
  // Anywhere else on the bed's top, or onto a log already there, it knocks
  // off it rather than falling through, and comes down off an end.
  if (s.bed || held(s) || x < M.seat.land[0] || x > M.seat.land[1]) {
    ch.y = wy(F.bed - LOG / 2); ch.vy = -Math.abs(ch.vy) * 0.3;
    ch.vx = (x < F.bx ? -1 : 1) * Math.max(Math.abs(ch.vx), 1);
    return false;
  }
  s.bed = newBed(x - LOG / 2, s.hi);
  s.setAt = S.after.t;
  return true;
}

// --- the sawyer --------------------------------------------------------------------------
// The sawyer in the wheel walks it; with the bed bare and a log on the pile
// the saw can cut, it steps out at the wheel's side, lifts the top log off
// the pile, carries it round to the bed, sets it down with weight and goes
// back in. Its path, in the drawing's cells (its body's left column and top
// row): `out` from the wheel to the pile, `carry` to the bed, `back` into
// the wheel; `lift` and `set` stand still while the log moves.
const PO = M.pose, V = AFTER_WALK / AP;
const PATHS = {
  out: [[PO.wheel.x, PO.wheel.y], [PO.side, PO.wheel.y], [PO.side, -3], [PO.pile, -3]],
  carry: [[PO.pile, -3], [PO.bed, -3]],
  back: [[PO.bed, -3], [PO.side, -3], [PO.side, PO.wheel.y], [PO.wheel.x, PO.wheel.y]]
};
const lenOf = pts => pts.slice(1).reduce((n, p, i) => n + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0);
function along(pts, dist) {
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], l = Math.hypot(x1 - x0, y1 - y0);
    if (dist <= l || i === pts.length - 1) { const k = l ? clamp(dist / l, 0, 1) : 1; return { x: x0 + (x1 - x0) * k, y: y0 + (y1 - y0) * k }; }
    dist -= l;
  }
  return { x: pts[0][0], y: pts[0][1] };
}
const DUR = { out: lenOf(PATHS.out) / V, lift: AFTER_PUT_S, carry: lenOf(PATHS.carry) / V, set: M.set_s, back: lenOf(PATHS.back) / V };
const NEXT = { out: 'lift', lift: 'carry', carry: 'set', set: 'back', back: null };
// Whether the sawyer has a log in its hands: lifted, carried, or swung over
// the bed and not yet down on it.
const held = s => !!s.trip && (s.trip.ph === 'carry' || (s.trip.ph === 'lift' && s.trip.log) || (s.trip.ph === 'set' && !s.trip.down));
export const sawyerHolds = () => !!S.after && held(saw());
// Where a log goes by hand, while nobody is at the saw to carry one and its
// bed is bare with logs on the pile: the world point over the bed's seat a
// log let go there lands on (the ghost hand shows the sweep before the
// wheel: render/aftercues.js). Null otherwise.
export function bedWants() {
  if (!S.after || !built('mill') || S.after.stock.logs <= 0) return null;
  const s = saw();
  if (s.bed || s.trip || S.after.bodies.some(b => b.at === 'mill')) return null;
  return { x: wx(M.seat.x + LOG / 2), y: wy(F.bed - LOG / 2) };
}
// Over the sawyer's head: the log's top left, the body's at (x, y).
const overhead = (x, y) => ({ x: x + 1.5 - LOG / 2, y: y - LOG });
const SEAT = { x: M.seat.x, y: F.bed - LOG };
// The log swung from overhead onto the bed's seat, u of the way: up clear of
// the frame, over, and down onto it.
function swung(u) {
  const o = overhead(PO.bed, -3), top = SEAT.y - 1;
  const pts = [[o.x, o.y], [o.x, top], [SEAT.x, top], [SEAT.x, SEAT.y]];
  return along(pts, u * lenOf(pts));
}
const ease = u => u * u * (3 - 2 * u);

// Where the sawyer stands and what it holds: its body's left column and top
// row, its step in the wheel, and the log's top left if it has one.
export function sawyerPose() {
  if (!S.after) return null;
  const s = saw(), tr = s.trip;
  if (!tr) {
    const a = wheelAngle(), step = Math.floor(a / (Math.PI / 4)) & 1;
    return { x: PO.wheel.x, y: PO.wheel.y - (step ? 2 / P : 0), step, wheel: true, log: null };
  }
  if (tr.ph === 'out' || tr.ph === 'carry' || tr.ph === 'back') {
    const p = along(PATHS[tr.ph], tr.t * V);
    return { ...p, step: 0, wheel: false, log: tr.ph === 'carry' ? overhead(p.x, p.y) : null };
  }
  if (tr.ph === 'lift') {
    const o = overhead(PO.pile, -3), k = ease(clamp(tr.t / DUR.lift, 0, 1));
    return { x: PO.pile, y: -3, step: 0, wheel: false, log: tr.log ? { x: tr.log.x + (o.x - tr.log.x) * k, y: tr.log.y + (o.y - tr.log.y) * k } : null };
  }
  const swing = DUR.set - M.held, u = clamp(tr.t / swing, 0, 1);
  return { x: PO.bed, y: -3, step: 0, wheel: false, log: tr.down ? null : swung(ease(u)) };
}

// The top log of the log pile, in the drawing's cells, and its column's
// world x: where a lift takes it from.
function topLog() {
  const b = plotOf('logs');
  let col = -1, hi = -1;
  for (let c = 0; c < b.cols; c++) { const r = topRow(b, c); if (r > hi) { hi = r; col = c; } }
  if (col < 0) return null;
  return { x: cx(b.x + col * b.p), y: cy(bottomY(b) - (hi + 1) * b.p), at: b.x + col * b.p + b.p / 2 };
}
// Whether the sawyer should go for a log: the bed bare, one on the pile, and
// a saw that could cut it.
const wantLog = s => !s.bed && S.after.stock.logs > 0 && !heapFull() && pileRoom('timber') - s.out.length >= AFTER_LOG_TIMBER;

function stepSawyer(s, dt) {
  // the first body through the mill's door (after/bodies.js, `atStation`)
  const w = S.after.bodies.find(b => b.at === 'mill');
  if (!w) {
    // Gone off its post with a log in its hands: it is laid on the floor
    // where it was, for a gatherer to carry home (bodies.js, `gather`).
    if (held(s)) { const p = sawyerPose(); layGood('log', wx(p.log.x), floorAt(wx(p.log.x) + AP)); }
    s.trip = null; s.driving = false;
    return;
  }
  let tr = s.trip;
  if (!tr) {
    if (wantLog(s)) { s.trip = tr = { ph: 'out', t: 0 }; s.driving = false; }
    else { walkWheel(s, dt); return; }
  }
  s.busyAt = S.after.t;
  // The set-down waits, the log held where it is, while the bed is taken (a
  // log the hand threw there).
  if (tr.ph === 'set' && !tr.down && s.bed) return;
  tr.t += dt;
  if (tr.ph === 'lift' && tr.log == null && tr.t >= 0) {
    const top = topLog();
    tr.log = top && takeBlock('logs', top.at) ? { x: top.x, y: top.y } : false;
    if (!tr.log) { s.trip = { ph: 'back', t: 0 }; return; }
  }
  if (tr.ph === 'set' && !tr.down && tr.t >= DUR.set - M.held) {
    tr.down = true;
    s.bed = newBed(SEAT.x, s.hi);
    s.setAt = S.after.t;
  }
  if (tr.t >= DUR[tr.ph]) {
    const next = NEXT[tr.ph];
    s.trip = next ? { ph: next, t: tr.t - DUR[tr.ph], log: next === 'lift' ? null : undefined } : null;
  }
}
// The sawyer in the wheel walks it a stroke at a time while there is a log
// on the bed and the hand is not turning it; it stands still while the saw
// waits on a full pile.
function walkWheel(s, dt) {
  if (!s.bed || handTurning(s)) { s.driving = false; return; }
  if (!s.driving) { s.sk = Math.floor(s.turn); s.sf = walkF(s.turn - s.sk); s.driving = true; }
  s.sf += dt / M.stroke_s;
  while (s.sf >= 1) { s.sf -= 1; s.sk++; }
  const want = s.sk + walkG(s.sf) - s.turn;
  const went = want > 0 ? turnWheel(want) : 0;
  if (went < want - EPS) s.driving = false;
  else s.busyAt = S.after.t;
}

// --- out of the machine ------------------------------------------------------------------
// A cut block's way out, by its age: riding the bed from the blade to its
// end, down the chute quickening, then off its foot onto the timber mound's
// middle column, where the mound's sand rules take it (after/piles.js). Its
// bottom middle, in the drawing's cells, and whether it is down.
const CH = M.chute, RIDE0 = F.bx + 2 + PLANK / 2, RIDE_S = (CH.x0 - RIDE0) / CH.ride;
function moundTop() {
  const b = plotOf('timber'), c = b.cols >> 1;
  return { x: cx(b.x + c * b.p + b.p / 2), y: cy(bottomY(b) - (topRow(b, c) + 1) * b.p), at: b.x + c * b.p + b.p / 2 };
}
export function blockAt(age) {
  if (age < RIDE_S) return { x: RIDE0 + age * CH.ride, y: F.bed };
  age -= RIDE_S;
  if (age < CH.slide) { const k = (age / CH.slide) ** 1.5; return { x: CH.x0 + (CH.x1 - CH.x0) * k, y: CH.y0 + (CH.y1 - CH.y0) * k }; }
  age -= CH.slide;
  const u = clamp(age / CH.toss, 0, 1), t = moundTop();
  // a toss off the chute's foot: over the higher of where it leaves and
  // where it lands, so it never cuts through the mound's side
  const peak = Math.min(CH.y1, t.y) - PLANK / 2, mx = (CH.x1 + t.x) / 2;
  const x = (1 - u) ** 2 * CH.x1 + 2 * u * (1 - u) * mx + u * u * t.x, y = (1 - u) ** 2 * CH.y1 + 2 * u * (1 - u) * peak + u * u * t.y;
  return { x, y, down: u >= 1 };
}
// A grain in the air under the blade, by its age: its top left, and whether
// it has come down on the heap.
export function grainAt(age) {
  const y = F.bed - 1 + 0.5 * M.fall * age * age, b = heapPlot(), c = colOf(b, wx(F.bx) + AP / 2);
  const top = -(topRow(b, c) + 2);
  return { x: F.bx, y: Math.min(y, top), down: y >= top };
}

function stepOut(s, dt) {
  for (let i = 0; i < s.out.length; i++) {
    const o = s.out[i];
    o.a += dt;
    if (!blockAt(o.a).down) continue;
    // On the mound's middle column; a mound filled meanwhile (by the hand)
    // lets it fall past onto the floor beside it.
    const t = moundTop();
    if (!setBlock('timber', t.at)) layGood('plank', Math.round((t.at - PLANK * AP / 2) / P) * P, floorAt(t.at));
    s.landed++;
    s.out.splice(i--, 1);
  }
  const b = heapPlot();
  for (let i = 0; i < s.dust.length; i++) {
    const g = s.dust[i];
    g.a += dt;
    if (!grainAt(g.a).down) continue;
    addGrain(b, wx(F.bx) + AP / 2, undefined, grainTone(b), true);
    S.after.stock.sawdust += 1;
    s.grains = (s.grains || 0) + 1;
    s.dust.splice(i--, 1);
  }
}

// --- tipping the heap --------------------------------------------------------------------
// The grains of a tip falling through the hatch: this session's drawing only,
// a load already gone.
const spills = [];
export const airSpills = () => spills;
export const forgetSpills = () => { spills.length = 0; };
// A load off the heap through the hatch in the floor under it: the grains
// over the hatch drop out from the bottom, then those beside it, and the heap
// slumps into the gap by the sand rules. What was taken.
export function tipSawdust() {
  const a = S.after, st = a.stock;
  if (st.sawdust <= 0) return 0;
  const b = heapPlot(), h0 = M.heap.hatch - M.heap.x, n = Math.min(AFTER_TIP_LOAD, st.sawdust);
  let k = 0;
  for (let d = 0; k < n && d < b.cols; d++) {
    for (const c of [h0 - d, h0 + 1 + d]) {
      if (c < 0 || c >= b.cols) continue;
      for (let r = 0; k < n && r < b.rows; r++) if (at(b, c, r)) { put(b, c, r, 0); spills.push({ c: M.heap.x + c, r, age: 0 }); k++; }
    }
  }
  st.sawdust -= n;
  a.tipAt = a.t;
  return n;
}

// A sawyer tips once the heap has stood at its brim AFTER_SWEEP_WAIT_S, so the
// stopped saw and its mark are seen first.
export const sweepDue = () => heapFull() && S.after.brimAt != null && S.after.t - S.after.brimAt >= AFTER_SWEEP_WAIT_S;

// The cuts that used to fall out of the saw's side (render/after/drop.js):
// none now, every block rides out of the machine on its own way.
export const sawDrops = () => [];

// One frame of the saw mill: the sawyer, the blocks and grains on their way,
// the heap's sand and its clock, and the falling grains of a tip.
export function stepMill(c) {
  const a = S.after, dt = secs(c);
  if (!heapFull()) a.brimAt = null;
  else if (a.brimAt == null) a.brimAt = a.t;
  for (let i = spills.length - 1; i >= 0; i--) if ((spills[i].age += dt) > AFTER_SPILL_S) spills.splice(i, 1);
  if (!built('mill') || dt <= 0) return;
  const s = saw();
  stepSawyer(s, dt);
  stepOut(s, dt);
  const b = heapPlot();
  if (!b.awakeN) b.t = 0;
  else for (b.t += dt; b.t >= AFTER_HEAP_SETTLE_S; b.t -= AFTER_HEAP_SETTLE_S) settleSome(b, b.cols * b.rows);
}

// Whether the sawyer is at its work now, walking the wheel or on its way with
// a log: what a member at the mill's post is asked on its clock (work.js).
export const millWorked = () => !!S.after && S.after.saw != null && S.after.saw.busyAt != null && S.after.t - S.after.saw.busyAt < 0.5;

// --- for the drawing (render/after/stations.js) ------------------------------------------
// The machine as it stands this frame, in the drawing's cells: the log on
// the bed (its left column and how much of it the blade has eaten), the
// block growing past the blade, the kerf in the teeth not yet spat out as
// grains (cells), the blocks and grains on their way out, and when the last
// stroke landed and the last log was set down.
export function millView() {
  if (!S.after) return null;
  const s = saw(), bed = s.bed;
  let log = null, grow = 0, teeth = 0;
  if (bed) {
    const e = eatenOf(bed), col = Math.min(LOG - 1, Math.floor(e + EPS));
    log = { x: bed.at, left: LOG - e, eaten: e };
    if (!kerf(col) && e > col + EPS) grow = e - col;
    if (kerf(col)) teeth = (e - AFTER_LOG_TIMBER) * AFTER_KERF_GRAINS - bed.dust;
  }
  return { log, grow, teeth, out: s.out.map(o => blockAt(o.a)), dust: s.dust.map(g => grainAt(g.a)), hitAt: s.hitAt, setAt: s.setAt,
           heap: heapPlot(), spills };
}
