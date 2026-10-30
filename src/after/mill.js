// The saw mill as a machine a log is followed through (DESIGN.md, "Act 3's
// goods are blocks, and bodies carry every one", "The saw mill"; the voted
// mock, branch mock-log-split). Nothing in it appears, changes or vanishes
// but at the blade: the sawyer lifts the top log off the log pile, carries
// it round and sets it down on the bed; the wheel, walked by the sawyer or
// dragged by the hand, drives the blade a stroke a turn and the bed carries
// the log into it; each column the blade eats comes out the far side as one
// 2x2 timber block that rides the bed out, slides down the chute and drops
// onto the timber mound: a log of four columns saws into four blocks and
// nothing else (the owner, 2026-10-29: no sawdust).
//
// Everything in the machine is the act's state (`S.after.saw`, saved): the
// wheel's turn, the log on the bed and how far it is through the blade, the
// blocks on their way out and the sawyer's trip, so a reload stands the
// machine back exactly where it was. Each count changes only at a hand-off:
// the log pile at the lift, the timber mound when a block lands on it
// (`setBlock`).
//
// Two doors turn the wheel and one eats the log: `turnWheel`, called by the
// hand (after/gestures.js) and by the sawyer's walk (`stepMill`). A member
// at the mill's post (after/bodies.js) still asks `workAfter('mill')` on its
// clock, and that only answers whether the sawyer is at work (work.js,
// `millWorked`); it never cuts.

import { S } from '../state.js';
import { source, sink } from '../flow.js';
import { P, AFTER_MILL, AFTER_LOG_TIMBER, AFTER_BLOCK, AFTER_PUT_S, AFTER_WALK } from '../config.js';
import { bladeLogs, built } from './levels.js';
import { secs } from './util.js';
import { groundOf, stationX0, floorAt, AP } from './place.js';
import { takeBlock, setBlock, pileRoom, pileCount, topBlock, dropSpot } from './piles.js';
import { colX, rowY } from './ground.js';
import { layGood } from './grove.js';
import { cellOf, kindOf } from '../grid.js';

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
const blankSaw = () => ({ turn: 0, hi: 0, sk: 0, sf: 0, driving: false, handAt: null, bed: null, out: [], trip: null,
                          hitAt: null, setAt: null, n: 0, landed: 0, busyAt: null });
export const saw = () => S.after.saw || (S.after.saw = blankSaw());

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
// it carries the log, `to` where it leaves the log; `cut` blocks made of it
// so far.
const eatenOf = bed => clamp(bed.at + LOG - F.bx, 0, LOG);
const colAt = bed => Math.min(LOG - 1, Math.floor(eatenOf(bed) + EPS));
function newBed(at, hi, v) { return { at, k: Math.floor(hi - G0) + 1, f: 0, d: 0, from: at, to: at, cut: 0, v: kindOf(v) && kindOf(v).key === 'log' ? v : cellOf('log') }; }
const plankV = (bed, col) => ((bed.pv = bed.pv || [])[col] ??= cellOf('plank'));

// Whether the stroke about to begin can go: a new log waits for room on the
// mound for a whole cut (as the pile-full mark says: after/piles.js,
// `pileFull`), and each column after it for the blocks it has left to make.
// Carrying the log up to the blade always can.
function stalled(s, bed) {
  if (bed.at + LOG < F.bx - EPS) return false;
  const e = eatenOf(bed), col = colAt(bed);
  return e - col < EPS && pileRoom('timber') - s.out.length < AFTER_LOG_TIMBER - col;
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
    if (e >= col + 1 - EPS) { s.out.push({ a: 0, v: plankV(bed, col) }); bed.cut++; source('plank', 1, 'saw'); }
  }
  if (e >= LOG - EPS) { s.bed = null; sink('log', 1, 'saw'); }
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
// Timber blocks landed on the mound off the chute, ever.
export const millLanded = () => (S.after ? saw().landed : 0);
const handTurning = s => s.handAt != null && S.after.t - s.handAt < 0.15;

// --- the log onto the bed ----------------------------------------------------------------
// A log thrown by the hand (after/piles.js, AFTER_LANDING: `ch` a chip,
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
  s.bed = newBed(x - LOG / 2, s.hi, ch.s);
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
  if (!S.after || !built('mill') || pileCount('logs') <= 0) return null;
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
  const u = topBlock('logs');
  if (!u) return null;
  return { x: cx(colX(u.c0)), y: cy(rowY(u.r0 + u.z)), at: colX(u.c0) + u.z * AP / 2 };
}
// Whether the sawyer should go for a log: the bed bare, one on the pile, and
// a saw that could cut it.
const wantLog = s => !s.bed && pileCount('logs') > 0 && pileRoom('timber') - s.out.length >= AFTER_LOG_TIMBER;

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
    const got = top && takeBlock('logs', top.at);
    tr.log = got ? { x: top.x, y: top.y } : false; tr.v = got;
    if (!tr.log) { s.trip = { ph: 'back', t: 0 }; return; }
  }
  if (tr.ph === 'set' && !tr.down && tr.t >= DUR.set - M.held) {
    tr.down = true;
    s.bed = newBed(SEAT.x, s.hi, tr.v);
    s.setAt = S.after.t;
  }
  if (tr.t >= DUR[tr.ph]) {
    const next = NEXT[tr.ph];
    s.trip = next ? { ph: next, t: tr.t - DUR[tr.ph], log: next === 'lift' ? null : undefined, v: next === 'lift' ? undefined : tr.v } : null;
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
// near column (after/piles.js, `dropCol`), where the mound's sand rules take
// it. Its bottom middle, in the drawing's cells, and whether it is down.
const CH = M.chute, RIDE0 = F.bx + 2 + PLANK / 2, RIDE_S = (CH.x0 - RIDE0) / CH.ride;
// Off the chute's foot it keeps the speed across it slid off with (the slide
// quickens as k = u^1.5), falling under the grains' gravity: the time to the
// mound's near column, and the drop the fall needs to come down on its top.
const EXIT_VX = 1.5 * (CH.x1 - CH.x0) / CH.slide;
function moundTop() {
  const d = dropSpot('timber');
  return { x: cx(d.at), y: cy(d.top), at: d.at };
}
export function blockAt(age) {
  if (age < RIDE_S) return { x: RIDE0 + age * CH.ride, y: F.bed };
  age -= RIDE_S;
  if (age < CH.slide) { const k = (age / CH.slide) ** 1.5; return { x: CH.x0 + (CH.x1 - CH.x0) * k, y: CH.y0 + (CH.y1 - CH.y0) * k }; }
  age -= CH.slide;
  const t = moundTop(), T = (t.x - CH.x1) / EXIT_VX, a = Math.min(age, T);
  const vy = (t.y - CH.y1 - 0.5 * M.fall * T * T) / T;
  return { x: CH.x1 + EXIT_VX * a, y: CH.y1 + vy * a + 0.5 * M.fall * a * a, down: age >= T };
}
function stepOut(s, dt) {
  for (let i = 0; i < s.out.length; i++) {
    const o = s.out[i];
    o.a += dt;
    if (!blockAt(o.a).down) continue;
    // On the mound's middle column; a mound filled meanwhile (by the hand)
    // lets it fall past onto the floor beside it.
    const t = moundTop();
    if (!setBlock('timber', t.at, o.v)) layGood('plank', Math.round((t.at - PLANK * AP / 2) / P) * P, floorAt(t.at), o.v);
    s.landed++;
    s.out.splice(i--, 1);
  }
}

// One frame of the saw mill: the sawyer and the blocks on their way.
export function stepMill(c) {
  const dt = secs(c);
  if (!built('mill') || dt <= 0) return;
  const s = saw();
  stepSawyer(s, dt);
  stepOut(s, dt);
}

// Whether the sawyer is at its work now, walking the wheel or on its way with
// a log: what a member at the mill's post is asked on its clock (work.js).
export const millWorked = () => !!S.after && S.after.saw != null && S.after.saw.busyAt != null && S.after.t - S.after.saw.busyAt < 0.5;

// --- for the drawing (render/after/stations.js) ------------------------------------------
// The machine as it stands this frame, in the drawing's cells: the log on
// the bed (its left column and how much of it the blade has eaten), the
// block growing past the blade, the blocks on their way out, and when the
// last stroke landed and the last log was set down.
export function millView() {
  if (!S.after) return null;
  const s = saw(), bed = s.bed;
  let log = null, grow = 0;
  if (bed) {
    const e = eatenOf(bed), col = Math.min(LOG - 1, Math.floor(e + EPS));
    log = { x: bed.at, left: LOG - e, eaten: e, v: bed.v, pv: plankV(bed, col) };
    if (e > col + EPS) grow = e - col;
  }
  return { log, grow, out: s.out.map(o => ({ ...blockAt(o.a), v: o.v })),
           hitAt: s.hitAt, setAt: s.setAt, hv: s.trip ? s.trip.v : undefined };
}
