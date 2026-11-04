// MOCK the-sign-station-polish
// MOCK the-sign-station-by-hand  (its ways of shaping the planks: signhand.js, under 'b4')
// Throwaway review code, never merged: the owner's "start looking at the sign
// station to give it the same polish as the saw mill" (2026-11-01), round 2
// on the owner's pick A (2026-11-02: "the resource pile should be on the left
// of the shack ... i dont like the brushing or second stage of the animation.
// lets have it just change shape slightly after each nail gets hammered in.
// shaping into the flag"). Today a sign is four timber blocks taken off the
// workshop's pile and a sign set in its rack in one call (after/press.js,
// `joinSign`); here the four blocks are followed through the shed as the log
// is through the saw mill:
//
//   the joiner steps off its stand on the timber's side (left of the shed,
//   after/art.js), lifts four blocks a beat apiece into a square over its
//   head, carries them back and sets them down on the bench as the 4x4 they
//   are; takes up its hammer and drives four nails, stepping along the stand
//   over each, two blows a nail (up held, a smear, struck and held). On each
//   nail's second blow the piece takes one step of shape, its cells moving
//   whole on the held impact: the pole shoots up, then the cloth climbs it a
//   row a blow, and on the last the piece is the flag, in the sign's slate
//   with its fist; it lifts the flag, carries it at its side to the rack and
//   stands it there, where the camp's members carry it out the same.
//
// The made, racked and carried sign are one drawing (`flag`, handed to the
// ground's and the loads' drawing through `globalThis.__signsFlag`). The
// real piles at both ends: each block is taken off the bench's timber at the
// lift, keeping its tone, and the flag put in the rack at the set-down in the
// one tone it took. The workshop's own maker is silenced while the flag is
// up (after/gestures.js), and its joiner is the mock's, drawn here.
// `globalThis.__signsMock` is the option; a reset puts it away.

import { S } from '../../state.js';
import { P, GREY, AFTER_WALK, AFTER_ART_SCALE } from '../../config.js';
import { held } from '../../reset.js';
import { ctx } from '../ctx.js';
import { K, W, PALE, MID, frame, inView, clamp01 } from './kit.js';
import { goodColor } from './piles.js';
import { stationX0, groundOf, floorAt, pileMid, AP } from '../../after/place.js';
import { takeBlock, setBlock, pileCount, pileRoom, topBlock, dropSpot } from '../../after/piles.js';
import { colX, rowY } from '../../after/ground.js';
import { built } from '../../after/levels.js';
import { cellOf } from '../../grid.js';
import { source, sink } from '../../flow.js';
import { shaper } from './signhand.js'; // MOCK the-sign-station-by-hand

let M = null; // page: the mock's cycle, stood up by startSignsMock
held('signs-mock', () => { globalThis.__signsMock = null; M = null; });
// for the shot tools: the make's count and its beat
globalThis.__signsMockState = () => (M ? { n: M.n, ph: M.ph, t: M.t, step: M.step } : null);
export const signsMockOn = () => !!globalThis.__signsMock && !!S.after && built('workshop');

// --- the flag: the sign, made, racked and carried ---------------------------------------
// Four cells across and seven up, the box its sixteen cells end in: the pole
// its left column whole, the cloth the three cells right of its top three
// rows, a paper fist cut out of the cloth. `foot` the y its pole stands on.
const FLAG = { w: 4, h: 7, cloth: 3 };
// The fist on a cloth three cells square, a third of a cell a bit with a bit
// of cloth round it: the crowd's flags' fist (SKY_FLAG.fist) drawn smaller.
const FIST = ['.X.X.X.', 'XXXXXXX', 'XXXXXXX', 'XXXXXX.', '.XXXX..', '.XXXX..', '.XXXX..'];
function flag(x, foot, v, z = 1) {
  const u = AP * z, b = 2 * z, top = foot - FLAG.h * u, cx = x + u, m = (FLAG.cloth * u - FIST.length * b) / 2;
  ctx.fillStyle = goodColor('sign', v);
  ctx.fillRect(Math.round(x), Math.round(top), u, FLAG.h * u);
  ctx.fillRect(Math.round(cx), Math.round(top), FLAG.cloth * u, FLAG.cloth * u);
  ctx.fillStyle = GREY[W];
  FIST.forEach((row, j) => [...row].forEach((ch, i) => { if (ch === 'X') ctx.fillRect(Math.round(cx + m + i * b), Math.round(top + m + j * b), b, b); }));
}
// The ground's and the loads' way in: a sign drawn as the flag while the mock is up.
globalThis.__signsFlag = (x, foot, v) => { if (!globalThis.__signsMock) return false; flag(x, foot, v); return true; };

// --- the shed's cells (the workshop's frame: x across, y up off the floor) -------------
// A body's spot is its left column and top row; on the stand its feet are on
// the stand's top (row -9), behind the bench, as the game's joiner stands.
const STAND_Y = -12;
const SPOT = 10;                            // the joiner's spot on the stand, beside the piece
const ENDS = { left: 8, right: 20 };        // the stand's ends, where it steps down to the floor
// the flag's box's top left on the bench, its four columns centered in the
// shed's opening (columns 8 to 22: the owner, 2026-11-03, "the center of the shack")
const BOX = { x: 13.5, y: -9 };
const SQUARE_ROW = 3;                       // the square of four blocks: the box's bottom four rows
const SLOTS = [[0, 2], [2, 2], [0, 0], [2, 0]];   // each block's cell in the square, laid bottom row first
// Each nail's second blow moves the cells of one row of the square's right
// three columns: the first to the pole's top, each after up the pole by three
// rows (the cloth climbing it), the last leaving it the flag.
const SHAPE = [{ from: 6, pole: true }, { from: 5, to: 2 }, { from: 4, to: 1 }, { from: 3, to: 0 }];
// Where each nail goes in, on the piece as it then stands: [column, row] of the box.
const NAILS_AT = [[0, 4], [1, 3], [2, 2], [3, 1]];
const REST = 20;                            // where the hammer lies on the stand, its head's column
const over = col => col - 1;                // the spot standing over a column's middle
// --- the beats, seconds ---------------------------------------------------------------
const T = { lift: 0.3, set: 0.5, held: 0.2, reach: 0.3, blow: 0.55, up: 0.2, swing: 0.05, strike: 0.2,
            raise: 0.45, puff: 0.3, ticks: 0.2, nailIn: 0.12, nailOut: 0.3, stand: 0.35 };
const V = AFTER_WALK / AP;                  // cells a second, every body up here
const SHUFFLE = V / 2;                      // along the stand, a step at a time

const square = () => SLOTS.flatMap(([sx, sy], i) => [[0, 0], [1, 0], [0, 1], [1, 1]].map(([q, r]) => ({ i, col: sx + q, row: SQUARE_ROW + sy + r })));
const fresh = () => ({ ph: 'wait', t: 0, n: 0, jx: SPOT, wFrom: SPOT, wTo: SPOT, wDur: 0, held: [], laid: null, cells: square(), step: 0,
                       nails: [0, 0, 0, 0], nailAt: [null, null, null, null], inAt: [null, null, null, null], hammer: false, blow: 0,
                       sign: null, signV: cellOf('sign'), setAt: null, path: null, from: null });
const ease = u => u * u * (3 - 2 * u);
const lenOf = pts => pts.slice(1).reduce((n, p, i) => n + Math.hypot(p[0] - pts[i][0], p[1] - pts[i][1]), 0);
function along(pts, dist) {
  for (let i = 1; i < pts.length; i++) {
    const [x0, y0] = pts[i - 1], [x1, y1] = pts[i], l = Math.hypot(x1 - x0, y1 - y0);
    if (dist <= l || i === pts.length - 1) { const k = l ? clamp01(dist / l) : 1; return { x: x0 + (x1 - x0) * k, y: y0 + (y1 - y0) * k }; }
    dist -= l;
  }
  return { x: pts[0][0], y: pts[0][1] };
}
// World and frame cells.
const x0 = () => stationX0('workshop');
const cx = x => (x - x0()) / AP;
const cy = y => (y - groundOf('workshop')) / AP;
const floorTop = col => cy(floorAt(x0() + (col + 1.5) * AP)) - 3;   // a body's top row standing on the floor at col
const pileCol = what => cx(pileMid('workshop', what)) - 1.5;
// beside the rack on the shed's side, so the flag held at its side stands over its slot
const rackCol = () => cx(dropSpot('signs').at) - FLAG.w / 2 - 3;
// Off the stand to the floor at column c, by the stand's end on c's side.
const down = (from, c) => { const e = c < from ? ENDS.left : ENDS.right, f = floorTop(c); return [[from, STAND_Y], [e, STAND_Y], [e, f], [c, f]]; };
// The flag held at a body's side by its pole: its box's top left, the pole's foot at the body's.
const atSide = j => ({ x: j.x + 3, y: j.y + 3 - FLAG.h });

// The piece's next shape: one row of the square's right three columns moved whole.
function shapeStep(k) {
  const s = SHAPE[k], row = M.cells.filter(c => c.row === s.from && c.col >= 1).sort((a, b) => a.col - b.col);
  row.forEach((c, n) => { if (s.pole) { c.col = 0; c.row = n; } else c.row = s.to; });
  M.step = k + 1;
}

// --- the cycle ----------------------------------------------------------------------
export function startSignsMock(o) {
  // a swap mid-make: what the joiner had is put back where it came from
  if (M) {
    const blocks = [...M.held, ...(M.laid || [])];
    if (M.from) blocks.push(M.from.v);
    if (M.sign != null || M.step > 0) { if (setBlock('signs', null, M.signV)) source('sign', 1, 'signsmock'); }
    else for (const v of blocks.filter(v => v != null)) if (setBlock('benchtimber', null, v)) source('plank', 1, 'signsmock');
  }
  globalThis.__signsMock = o;
  M = fresh();
  if (handMode()) Object.assign(M, { ph: 'hand', laid: [null, null, null, null], hand: freshHand() });
  if (M.hand) M.hand.sh = shaper()?.init() || null;   // MOCK the-sign-station-by-hand
}
function go(ph, to = M.jx) {
  M.ph = ph; M.t = 0;
  // every beat on the stand begins with the joiner stepping along it to where it works
  M.wFrom = M.jx; M.wTo = to; M.wDur = Math.abs(to - M.jx) / SHUFFLE;
}
// The beat's own time, once the step along the stand is done (negative while stepping).
const own = () => M.t - M.wDur;
const stepped = () => { if (own() >= 0) M.jx = M.wTo; return own() >= 0; };
// One frame of the make, on the act's clock (scenes.js puts it on STEPS).
export function stepSignsMock(c) {
  if (!M || !signsMockOn()) return;
  M.t += Math.max(0, c.dt) / 1000;
  // the timber mound kept stocked for the haulers while it is off the window
  const tm = pileMid('mill', 'timber');
  if (pileCount('timber') < 8 && !inView(tm - AP * 12, AP * 24)) for (let k = 0; k < 4; k++) if (setBlock('timber')) source('plank', 1, 'signsmock');
  if (handMode()) { stepHand(Math.max(0, c.dt) / 1000); return; }
  const ph = M.ph;
  if (ph === 'wait') { if (pileCount('benchtimber') >= 4) { M.path = down(SPOT, pileCol('benchtimber')); go('out'); } return; }
  if (ph === 'out' || ph === 'back' || ph === 'rack' || ph === 'home') {
    if (M.t * V < lenOf(M.path)) return;
    if (ph === 'out') go('lift');
    else if (ph === 'back') { M.jx = SPOT; go('lay'); }
    else if (ph === 'rack') go('set');
    else {
      M.n++; M.jx = SPOT; M.signV = cellOf('sign'); M.cells = square(); M.step = 0;
      M.nails = [0, 0, 0, 0]; M.nailAt = [null, null, null, null]; M.inAt = [null, null, null, null]; M.blow = 0;
      go('wait');
    }
    return;
  }
  if (ph === 'lift') {
    // a block a beat off the top of the pile, into the square over the head
    if (M.held.length < 4 && M.from == null) {
      const u = topBlock('benchtimber');
      const v = u && takeBlock('benchtimber', colX(u.c0) + u.z * AP / 2);
      if (!v) { M.t = 0; return; }
      sink('plank', 1, 'sign');   // in the mock's hands, outside every count, until it is a sign
      M.from = { x: cx(colX(u.c0)), y: cy(rowY(u.r0 + u.z)), v };
      M.t = 0;
    }
    if (M.from && M.t >= T.lift) {
      M.held.push(M.from.v); M.from = null; M.t = 0;
      if (M.held.length === 4) { M.path = down(SPOT, pileCol('benchtimber')).reverse(); go('back'); }
    }
    return;
  }
  if (ph === 'lay') {
    // the square swung down onto the bench and held there, a puff off its ends
    if (M.t >= T.set - T.held && M.held.length) { M.laid = [...M.held]; M.held = []; M.setAt = S.after.t; }
    if (M.t >= T.set) { M.hammer = true; go('take', over(REST + 0.5)); }
    return;
  }
  if (ph === 'take' || ph === 'put') {
    if (!stepped() || own() < T.reach) return;
    if (ph === 'take') { M.blow = 0; go('nail', over(BOX.x + NAILS_AT[0][0])); }
    else { M.hammer = false; go('raise', SPOT); }
    return;
  }
  if (ph === 'nail') {
    // eight blows, two a nail, stepping over each nail first: up and held,
    // the swing a smear, struck and held; the second drives it in and the
    // piece takes its next shape on that held impact
    if (!stepped()) return;
    const k = Math.floor(M.blow / 2), s = own();
    if (M.nailAt[k] == null) M.nailAt[k] = S.after.t;
    if (s >= T.up + T.swing && M.nails[k] < 1 + (M.blow % 2)) {
      M.nails[k] = 1 + (M.blow % 2);
      if (M.nails[k] === 2) { M.inAt[k] = S.after.t; shapeStep(k); }
    }
    if (s >= T.blow) {
      M.blow++;
      if (M.blow >= 8) go('put', over(REST + 0.5));
      else go('nail', over(BOX.x + NAILS_AT[Math.floor(M.blow / 2)][0]));
    }
    return;
  }
  if (ph === 'raise') {
    if (!stepped() || own() < T.raise) return;
    M.sign = M.signV; M.laid = null;
    M.path = down(M.jx, rackCol());
    go('rack');
    return;
  }
  if (ph === 'set') {
    // stood in the rack: let down onto its slot, held a beat, let go
    if (M.t >= T.set - T.held && M.sign != null) {
      if (pileRoom('signs') <= 0) { M.t = T.set - T.held - 1e-6; return; }   // the rack full: held till it has room
      if (setBlock('signs', dropSpot('signs').at, M.sign)) source('sign', 1, 'workshop');
      M.sign = null;
    }
    if (M.t >= T.set) { const p = M.path[M.path.length - 1]; M.path = down(SPOT, p[0]).reverse(); go('home'); }
  }
}

// Where the joiner stands: its left column and top row, a bob in px, squat;
// on the stand, stepping along it at its true position.
function joinerAt() {
  const ph = M.ph;
  if (M.path && (ph === 'out' || ph === 'back' || ph === 'rack' || ph === 'home')) {
    const d = M.t * V, p = along(M.path, d);
    return { ...p, dy: lenOf(M.path) > d && Math.floor(d * 2) % 2 ? -1 : 0 };
  }
  if (ph === 'lift' || ph === 'set') {
    const p = M.path[M.path.length - 1];
    return { x: p[0], y: p[1], dy: ph === 'set' && M.t > T.set - T.held ? 1 : 0 };
  }
  const s = own();
  if (s < 0) {
    const k = M.t / M.wDur, x = M.wFrom + (M.wTo - M.wFrom) * k;
    return { x, y: STAND_Y, dy: Math.floor(Math.abs(x - M.wFrom) * 2) % 2 ? -1 : 0 };
  }
  const at = { x: M.wTo, y: STAND_Y };
  if (ph === 'take' || ph === 'put') { const k = Math.sin(clamp01(s / T.reach) * Math.PI); return { ...at, squat: k > 0.4 }; }
  if (ph === 'nail') { const q = s - T.up - T.swing; return { ...at, dy: q >= 0 && q < T.strike ? 1 : 0 }; }
  return at;
}

// --- the drawing ----------------------------------------------------------------------
const cut = (d, x, y, w, h, tone = W) => d.px(x * P + 2, y * P + 2, w * P - 4, h * P - 4, tone);
// The shed, roof A, as the game draws it (render/after/stations.js), the pips
// over the door the nails as driven.
function shed(d, stand = true) {
  d.r(5, -18, 21, 1, K);
  d.px(5 * P, -17 * P - 2, 21 * P, 2, W);
  d.r(7, -19, 17, 1, K); d.r(9, -20, 13, 1, K); d.r(11, -21, 9, 1, K); d.r(13, -22, 5, 1, K);
  d.r(6, -17, 19, 17, K); d.r(8, -16, 15, 16, W);
  cut(d, 10, -20, 11, 2);
  const cw = 11 * P, gap = 8, pw = 6, px0 = 10 * P + Math.round((cw - (4 * pw + 3 * gap)) / 2), py0 = -20 * P + Math.round((2 * P - pw) / 2);
  if (!shaper()) M.nails.forEach((n, i) => {   // MOCK the-sign-station-by-hand  (no nails: the panel stands blank)
    const x = px0 + i * (pw + gap);
    d.px(x, py0, pw, pw, K);
    if (n === 0) d.px(x + 1, py0 + 1, pw - 2, pw - 2, W); else if (n === 1) d.px(x + 1, py0 + 1, pw - 2, 2, W);
  });
  // the stand the joiner works on, paper read by its pale slats, behind the bench
  if (stand) {
  d.r(8, -9, 15, 9, W);
  for (const y of [-8, -6, -4]) d.px(8 * P + 2, y * P + 2, 15 * P - 4, 2, PALE);
  d.px(8 * P, -9 * P, 15 * P, 2, K);
  }
  // the bench, low, its top a row, on two legs
  d.r(8, -2, 15, 1, K); d.r(9, -1, 2, 1, K); d.r(20, -1, 2, 1, K);
}
// The hammer lying on the stand (its head's top left in px, the handle
// toward the shed's middle), or hung head down from the hand.
function hammerAt(d, hx, hy, lying, z = 1) {
  if (lying) { d.px(hx, hy, P * z, P * z, K); d.px(hx + P * z, hy + 2 * z, 1.5 * P * z, 2 * z, K); return; }
  d.px(hx - 2 * z, hy, (P + 4) * z, (P - 2) * z, K);
}
const fillCell = (d, x, y, w, h, tone) => { const p = d.world(x, y); ctx.fillStyle = tone; ctx.fillRect(Math.round(p.x), Math.round(p.y), Math.round(w * AP), Math.round(h * AP)); };
// The piece on the bench, box top left at (bx, by): each cell where the last
// blow put it, in its block's tone; the flag once the last nail is in.
function piece(d, bx, by, z = 1, skip = () => false) {
  if (M.step >= SHAPE.length) { const p = d.world(bx, by + FLAG.h * z); flag(p.x, p.y, M.signV, z); return; }
  for (const c of M.cells) if (M.laid[c.i] != null && !skip(c.i)) fillCell(d, bx + c.col * z, by + c.row * z, z, z, goodColor('plank', M.laid[c.i]));
}
// The nails: a head standing on the piece once set, half in after a blow,
// and eased into the piece after the second (the piece's shape is the mark
// that it went in).
function nails(d, bx, by, sc = 1) {
  M.nails.forEach((n, i) => {
    if (M.nailAt[i] == null) return;
    const [col, row] = NAILS_AT[i], a = clamp01((S.after.t - M.nailAt[i]) / T.nailIn) * (M.inAt[i] == null ? 1 : 1 - clamp01((S.after.t - M.inAt[i]) / T.nailOut));
    if (a <= 0) return;
    const z = (n === 0 ? 4 : 2) * sc, x = (bx + (col + 0.5) * sc) * P - z / 2, y = (by + (row + 0.5) * sc) * P - z / 2;
    d.fade(a, () => d.px(x, y, z, z, K));
  });
}
function puff(d, age, z = 1, box = BOX) {
  const k = age / T.puff;
  if (k < 0 || k >= 1) return;
  d.fade(1 - k, () => { for (const sx of [-1 - k, 4 * z + k]) d.px((box.x + sx) * P, (box.y + FLAG.h * z - 1 - k) * P, P, P, MID); });
}
// The station's own pass: the shed, the hammer lying, the piece on the bench.
export function drawSignsMock(d) {
  if (!M) return;
  shed(d, !big());
  if (handMode()) { drawHandBench(d); return; }
  if (!M.hammer) hammerAt(d, REST * P, -10 * P, true);
  // (the piece lifted off the bench is the members' pass's from the lift's first frame)
  if (M.laid && !(M.ph === 'raise' && own() >= 0)) { piece(d, BOX.x, BOX.y); nails(d, BOX.x, BOX.y); }
  if (M.setAt != null) puff(d, S.after.t - M.setAt);
}
// The members' pass: the joiner, what it carries, the hammer in its hand.
export function drawSignsMockJoiner() {
  if (!M || !signsMockOn()) return;
  if (handMode()) { drawHandTools(); return; }
  const d = frame(x0(), groundOf('workshop'), 0, null, AFTER_ART_SCALE);
  const j = joinerAt();
  // the square of blocks over the head, a block coming up off the pile into it
  const sq = at => ({ x: at.x + 1.5 - 2, y: at.y - 4 });
  const sqTo = { x: BOX.x, y: BOX.y + SQUARE_ROW };
  if (M.ph === 'lay' && M.held.length) {
    const u = ease(clamp01(M.t / (T.set - T.held))), o = sq(j), top = sqTo.y - 1;
    const pts = [[o.x, o.y], [o.x, Math.min(o.y, top)], [sqTo.x, Math.min(o.y, top)], [sqTo.x, sqTo.y]];
    const p = along(pts, u * lenOf(pts));
    M.held.forEach((v, k) => fillCell(d, p.x + SLOTS[k][0], p.y + SLOTS[k][1], 2, 2, goodColor('plank', v)));
  } else M.held.forEach((v, k) => { const o = sq(j); fillCell(d, o.x + SLOTS[k][0], o.y + SLOTS[k][1], 2, 2, goodColor('plank', v)); });
  if (M.ph === 'lift' && M.from) {
    const o = sq(j), k = M.held.length, u = ease(clamp01(M.t / T.lift));
    const to = { x: o.x + SLOTS[k][0], y: o.y + SLOTS[k][1] };
    fillCell(d, M.from.x + (to.x - M.from.x) * u, M.from.y + (to.y - M.from.y) * u, 2, 2, goodColor('plank', M.from.v));
  }
  d.body(j.x, j.y, 0, j.dy || 0, !!j.squat);
  // the flag: lifted off the bench to the joiner's side, carried, stood in the rack
  if (M.ph === 'raise' && own() >= 0) {
    const o = atSide(j), u = ease(clamp01(own() / T.raise)), top = Math.min(o.y, BOX.y) - 0;
    const pts = [[BOX.x, BOX.y], [BOX.x, top], [o.x, o.y]];
    const p = along(pts, u * lenOf(pts)), w = d.world(p.x, p.y + FLAG.h);
    flag(w.x, w.y, M.signV);
  } else if (M.sign != null) {
    let p = atSide(j);
    if (M.ph === 'set') {
      const ds = dropSpot('signs'), to = { x: cx(ds.at) - FLAG.w / 2, y: cy(ds.top) - FLAG.h }, u = ease(clamp01(M.t / (T.set - T.held)));
      p = { x: p.x + (to.x - p.x) * u, y: p.y + (to.y - p.y) * u };
    }
    const w = d.world(p.x, p.y + FLAG.h);
    flag(w.x, w.y, M.sign);
  }
  // the hand: a cell in from the body's side, at its middle row
  const hl = { x: j.x * P + 2, y: (j.y + 1.5) * P + (j.dy || 0) };
  if (M.hammer && (M.ph === 'take' || M.ph === 'put')) {
    // the hammer taken up off the stand or laid back on it, between its rest and the hand
    const s = own(), k = s < 0 ? 0 : ease(clamp01(s / T.reach)), u = M.ph === 'take' ? k : 1 - k;
    const rx = REST * P, ry = -10 * P;
    hammerAt(d, rx + (hl.x - rx) * u, ry + (hl.y - ry) * u, u < 0.5);
    return;
  }
  if (M.hammer && M.ph === 'nail') {
    // stepping to the nail it hangs from the hand; at the nail, held up, a
    // smear, struck on the nail and held
    const k = Math.floor(M.blow / 2), s = own(), [col, row] = NAILS_AT[k];
    const nx = (BOX.x + col) * P, ny = (BOX.y + row) * P;
    if (s < 0) { hammerAt(d, hl.x - P / 2, hl.y + 2, false); return; }
    const pose = s < T.up ? 'up' : s < T.up + T.swing ? 'swing' : s < T.up + T.swing + T.strike ? 'strike' : 'up';
    const upY = (STAND_Y - 3) * P;
    const head = pose === 'strike' ? { x: nx, y: ny } : { x: nx - P, y: upY };
    if (pose === 'swing') d.fade(0.4, () => { hammerAt(d, nx - P, upY, false); hammerAt(d, nx - P / 2, (upY + ny) / 2, false); });
    else hammerAt(d, head.x, head.y, false);
    d.line(hl.x / P, hl.y / P, (head.x + P / 2) / P, (head.y + P / 2) / P, 2, K);   // the handle, hand to head
    if (pose === 'strike') d.fade(1 - (s - T.up - T.swing) / T.ticks, () => { d.px(nx - 6, ny + 1, 3, 2, K); d.px(nx + P + 3, ny + 1, 3, 2, K); });
  }
}

// --- the hand's way: the manual work (rounds 3 and 4, the owner, 2026-11-03:
// "lets also look at the manual work now"; on B3, "the landing zone for the
// timber needs to be upped ... a stronger dashed outline for each one ...
// the station is just a bit too small and detailed") -----------------------------------
// The player makes a sign at the workshop the way it makes timber at the saw
// mill: by the one hand and the one gesture system. Nobody at the bench:
//
//   the planks come as the mill's log does (after/mill.js, `bedLand`): a
//   press and hold on the timber pile sweeps blocks into the hand
//   (hands.js), and a block let go anywhere over the shed, or near it, is
//   caught (after/piles.js, AFTER_LANDING, `__signsBenchLand`) and settles
//   into the square's next slot, each empty slot drawn as a dashed outline
//   that comes up bold while a plank is in the hand;
//   the hammer is the workshop's gesture (after/gestures.js, DEFS.workshop,
//   handed to `__signsHand` while the mock is up): taken where it lies and
//   brought down on the next nail, whose spot is a dashed target; fast drives
//   it home in one, slower half, the second blow shaping the piece a row as
//   the joiner's does; let go, it drops where it is;
//   the flag made, a press on it takes it into the hand (`holdUnit`, as the
//   stump comes into it), and let go over the rack it lands there by the
//   ground's own landing.
//
//   b3      the bench as the shed has it
//   b3big   the bench work at twice the size: the stand gone, the piece, its
//           slots, its nails and the hammer drawn two cells a cell, so the
//           square fills the shed's opening (a plank grows into its slot as
//           it settles, and the made flag is the rack's size again once in
//           the hand)
// No label shows over the bench while it is worked (input.js asks `quiet`).
import { holdUnit, heldGoods } from '../../hands.js';
import { toScreen } from '../../world.js';
function handMode() { return /^b/.test(globalThis.__signsMock || ''); }
const big = () => globalThis.__signsMock === 'b3big' || globalThis.__signsMock === 'b4';
const Z = () => (big() ? 2 : 1);
// The piece's box in the hand's bench: its four columns centered in the
// shed's opening, standing on the bench's top (row -2).
const HB = () => ({ x: 15.5 - 2 * Z(), y: -2 - FLAG.h * Z() });
const HAND = { vMin: 90, vFlush: 380, catch: [5, 26], fly: 0.18, ease: 0.25, faint: 0.4, dash: 3, gap: 2 };
// Where the hammer lies at first: on the stand's top (b3), or stood on its
// head-up end at the bench's right end (b3big, the stand gone).
const restOf = () => (big() ? { x: 20.5, y: -7, up: true } : { x: REST, y: -10, up: false });
const freshHand = () => ({ strikeAt: -9, strikeK: null, uses: 0, oa: [0, 0, 0, 0], na: 0, fly: [null, null, null, null],
                           hm: { held: false, ...restOf(), vy: 0, px: 0, py: 0, off: 0, hy: null, stuck: false, fall: null } });
const wsFrame = () => frame(x0(), groundOf('workshop'), 0, null, AFTER_ART_SCALE);
const laidN = () => (M.laid || []).filter(v => v != null).length;
// The next nail: once the square is whole, the first not driven home.
const nextNail = () => (!shaper() && laidN() === 4 && M.step < SHAPE.length ? M.nails.findIndex(n => n < 2) : -1);
const nailW = k => { const [col, row] = NAILS_AT[k], b = HB(), z = Z(); return wsFrame().world(b.x + (col + 0.5) * z, b.y + (row + 0.5) * z); };
const slotCell = k => { const [sx, sy] = SLOTS[k], b = HB(), z = Z(); return { x: b.x + sx * z, y: b.y + (SQUARE_ROW + sy) * z, w: 2 * z }; };
const flagMid = () => { const b = HB(), z = Z(); return wsFrame().world(b.x + FLAG.w * z / 2, b.y + FLAG.h * z / 2); };
const inFlag = (x, y) => { const d = wsFrame(), b = HB(), z = Z(), a = d.world(b.x, b.y), e = d.world(b.x + FLAG.w * z, b.y + FLAG.h * z); return x >= a.x - AP && x <= e.x + AP && y >= a.y - AP && y <= e.y; };
// The hammer's head, world middle: where it lies or stands, or hung from the grip.
function restHead(hm) { const d = wsFrame(), z = Z(); return hm.up ? d.world(hm.x + (P + 4) * z / (2 * P), hm.y + (P - 2) * z / (2 * P)) : d.world(hm.x + z / 2, hm.y + z / 2); }
function headOf(hm) { if (!hm.held) return restHead(hm); return { x: hm.px, y: hm.hy ?? hm.py + hm.off }; }
function blow(k, n) {
  const t = S.after.t, h = M.hand;
  M.nails[k] = Math.min(2, M.nails[k] + n);
  h.strikeAt = t; h.strikeK = k; h.uses++;
  if (M.nails[k] === 2) { M.inAt[k] = t; shapeStep(k); }
}
function benchReset() {
  M.laid = [null, null, null, null]; M.cells = square(); M.step = 0; M.hand.fly = [null, null, null, null];
  M.nails = [0, 0, 0, 0]; M.nailAt = [null, null, null, null]; M.inAt = [null, null, null, null];
  M.prevV = M.signV; M.signV = cellOf('sign'); M.tintAt = S.after.t; M.n++;
  M.hand.sh = shaper()?.init() || null;   // MOCK the-sign-station-by-hand
}
function stepHand(dt) {
  const h = M.hand, hm = h.hm, t = S.after.t, k = nextNail();
  if (k >= 0 && M.nailAt[k] == null) M.nailAt[k] = t;   // the next nail set standing, faded on
  // the outlines' ink: bold with a plank in the hand, faint while the square
  // waits, gone once filled; the nail's target bold with the hammer held
  const plank = heldGoods()?.kind === 'plank', r = dt / HAND.ease;
  // (the hand's ways, signhand.js: only the next slot comes up bold, so the order the parts go in reads)
  const nextSlot = shaper() ? M.laid.findIndex(v => v == null) : -1;   // MOCK the-sign-station-by-hand
  h.oa = h.oa.map((a, i) => { const want = M.laid[i] != null || M.step > 0 ? 0 : plank && (nextSlot < 0 || i === nextSlot) ? 1 : HAND.faint; return a + Math.max(-r, Math.min(r, want - a)); });
  const nw = k >= 0 ? (hm.held ? 1 : HAND.faint) : 0;
  h.na += Math.max(-r, Math.min(r, nw - h.na));
  // MOCK the-sign-station-by-hand: the way's own motion
  const sh = shaper();
  if (sh) { sh.step(dt); return; }
  if (hm.held) {
    // the head hangs from the grip, at its true position; brought down on the
    // nail it strikes, as hard as it came, and rests there till lifted
    const want = hm.py + hm.off, prev = hm.hy ?? want;
    let y = want;
    if (k >= 0) {
      const n = nailW(k), top = n.y - AP * Z() / 2;
      const over = Math.abs(hm.px - n.x) < AP * 1.2 * Z();
      if (hm.stuck && (!over || want < top - AP)) hm.stuck = false;
      if (over && !hm.stuck && prev < top && want >= top) {
        const vy = (want - prev) / Math.max(dt, 1e-3);
        if (vy >= HAND.vMin) { blow(k, vy >= HAND.vFlush ? 2 : 1); hm.stuck = true; }
      }
      if (over && (hm.stuck || want >= top)) y = Math.min(want, top);
    }
    hm.vy = (y - prev) / Math.max(dt, 1e-3); hm.hy = y;
  } else if (hm.fall) {
    // let go: it drops onto what is under it, under the grains' gravity
    hm.fall.v += 900 * dt; hm.fall.y = Math.min(hm.fall.to, hm.fall.y + hm.fall.v * dt);
    if (hm.fall.y >= hm.fall.to) hm.fall = null;
  }
}
const SIGNS_HAND = {
  grab(x, y) {
    if (!M || !handMode() || !signsMockOn()) return null;
    if (M.step >= SHAPE.length && inFlag(x, y)) return 'flag';
    if (shaper()) return laidN() === 4 && M.step < SHAPE.length ? shaper().grab(x, y) : null;   // MOCK the-sign-station-by-hand
    const hd = headOf(M.hand.hm);
    return !M.hand.hm.fall && Math.hypot(x - hd.x, y - hd.y) < AP * 2 * Z() ? 'hammer' : null;
  },
  down(what, x, y) {
    const h = M.hand;
    if (what === 'flag') {
      const m = holdUnit(M.signV, flagMid());
      if (!m) return 'tap';
      source('sign', 1, 'workshop');
      benchReset();
      return 'tap';
    }
    if (shaper()) return shaper().down(what, x, y);   // MOCK the-sign-station-by-hand
    // taken where it is pressed: the head stays where it was under the hand, nothing jumps
    if (what === 'hammer') { const hd = headOf(h.hm); Object.assign(h.hm, { held: true, up: false, px: x, py: y, off: hd.y - y, hy: hd.y, stuck: false, fall: null }); return true; }
    return 'tap';
  },
  move(x, y) { if (shaper()) { shaper().move?.(x, y); return; } const hm = M.hand.hm; if (hm.held) { hm.px = x; hm.py = y; } },
  up(x, y) {
    if (shaper()) { shaper().up?.(x, y); return; }   // MOCK the-sign-station-by-hand
    const hm = M.hand.hm;
    if (!hm.held) return;
    // b3: laid where it is let go, on the stand under it, kept inside the shed;
    // b3big: dropped, it comes down at the bench's end clear of the piece and
    // stands there head up, where it was first
    const hd = headOf(hm), z = Z();
    if (big()) {
      const r = restOf(), col = Math.max(r.x - 1, Math.min(r.x, cx(hd.x) - 0.8 * z));
      Object.assign(hm, { held: false, up: true, x: col, y: r.y, hy: null, stuck: false });
    } else {
      const col = Math.max(8, Math.min(23 - 2.5 * z, cx(hd.x) - z / 2));
      Object.assign(hm, { held: false, up: false, x: col, y: restOf().y, hy: null, stuck: false });
    }
    const to = restHead(hm);
    hm.fall = { x0: hd.x, y: hd.y, x1: to.x, y0: hd.y, to: to.y, v: 0 };
  },
  step() { /* the frame is the mock's own STEPS entry (scenes.js) */ },
  takeUses() { const n = M && M.hand ? M.hand.uses : 0; if (M && M.hand) M.hand.uses = 0; return n; },
  // No label over the bench while it is worked: a good or the hammer in the
  // hand, or the pointer over the shed's opening (act 3's rule).
  quiet(x, y) {
    if (!M || !handMode() || !signsMockOn()) return false;
    if (heldGoods() || M.hand.hm.held || shaper()?.busy()) return true;
    const c = cx(x), r = cy(y);
    return c >= 6 && c <= 25 && r >= -22 && r <= 0;
  },
  // the ghost hand, acting out what is next, `u` of its loop
  cue(u) {
    if (!M || !handMode() || !signsMockOn()) return null;
    const arc = (a, b, k, lift) => ({ x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k - Math.sin(k * Math.PI) * lift });
    const bench = benchAt();
    if (M.step >= SHAPE.length) { const r = dropSpot('signs'); return { ...arc(flagMid(), { x: r.at, y: r.top - AP * 5 }, Math.min(1, u * 1.4), AP * 4), pose: 'grab' }; }
    if (laidN() < 4) {
      const u0 = topBlock('benchtimber');
      if (!u0) return null;
      const from = { x: colX(u0.c0) + u0.z * AP / 2, y: rowY(u0.r0 + u0.z) + AP };
      return { ...arc(from, bench, Math.min(1, u * 1.4), AP * 5), pose: 'grab' };
    }
    if (shaper()) return shaper().cue(u);   // MOCK the-sign-station-by-hand
    const k = nextNail();
    if (k < 0) return null;
    const n = nailW(k), r = headOf(M.hand.hm);
    if (u < 0.3) return { x: r.x, y: r.y, pose: 'grab' };
    const k2 = Math.min(1, (u - 0.3) / 0.5), top = { x: n.x, y: n.y - AP * 5 * Z() };
    const p = k2 < 0.7 ? arc(r, top, k2 / 0.7, AP * 2) : { x: n.x, y: top.y + (n.y - top.y) * ((k2 - 0.7) / 0.3) };
    return { ...p, pose: 'grab' };
  }
};
globalThis.__signsHand = SIGNS_HAND;
// The middle of the square's empty slots, in the world: where a plank goes.
function benchAt() { if (shaper()?.benchAt) return shaper().benchAt(); const b = HB(), z = Z(); return wsFrame().world(b.x + 2 * z, b.y + (SQUARE_ROW + 1) * z); }
// The shot tools' real pointer drawn as the demo cursor (render/aftercues.js, `demoHand`,
// handed over by the scene), where the page put the pointer.
globalThis.__signsPointer = pose => { const h = globalThis.__demoHand; if (h && S.mouse) Object.assign(h, { x: S.mouse.x, y: S.mouse.y, pose }); };
// A block let go over the shed or near it (after/piles.js, AFTER_LANDING):
// caught once its foot comes down to the next slot's floor, wherever it is
// across the shed, and settling into that slot from where it was caught.
// True once caught.
globalThis.__signsBenchLand = ch => {
  if (!M || !handMode() || !signsMockOn() || ch.kind !== 'plank' || M.step > 0) return false;
  const k = M.laid.findIndex(v => v == null);
  if (k < 0) return false;
  const x = cx(ch.x), foot = cy(ch.y) + 1, s = slotOf(k);
  if (x < HAND.catch[0] || x > HAND.catch[1] || foot < s.y + Math.min(s.w, s.h)) return false;
  M.laid[k] = ch.s; M.setAt = S.after.t;
  M.hand.fly[k] = { x: x - 1, y: foot - 2, at: S.after.t };
  sink('plank', 1, 'sign');
  shaper()?.landed?.();   // MOCK the-sign-station-by-hand
  return true;
};
// Where to put a pointer for a step, on the glass: the shot tools' real pointer.
globalThis.__signsAt = what => {
  if (!M) return null;
  let w = null;
  if (what === 'pile') { const u = topBlock('benchtimber'); w = u && { x: colX(u.c0) + u.z * AP / 2, y: rowY(u.r0 + u.z) + AP }; }
  else if (what === 'bench') w = benchAt();
  else if (what === 'nail') { const k = nextNail(); w = k >= 0 && nailW(k); }
  else if (what === 'hammer') w = headOf(M.hand.hm);
  else if (what === 'flag') w = flagMid();
  else if (what === 'part' || what === 'track') w = shaper()?.at(what);   // MOCK the-sign-station-by-hand
  else if (what === 'rack') { const r = dropSpot('signs'); w = { x: r.at, y: r.top - AP * 5 }; }
  if (!w) return null;
  const sc = toScreen(w.x, w.y);
  return { x: sc.x, y: sc.y, wx: w.x, wy: w.y, laid: laidN(), step: M.step, nails: [...M.nails], next: nextNail(), n: M.n };
};
// --- the hand's drawing ------------------------------------------------------------------
// A dashed outline round a box of cells, its dashes `th` px thick: the
// shared dashed language of a closed station's outline, bolder, for a spot
// the hand is to put something.
function dashBox(d, x, y, w, h, th) {
  const X = x * P, Y = y * P, Wd = w * P, Ht = h * P, on = HAND.dash * th / 2 + 1, per = on + HAND.gap * th / 2;
  for (let s = 0; s < Wd; s += per) { const l = Math.min(on, Wd - s); d.px(X + s, Y, l, th, K); d.px(X + s, Y + Ht - th, l, th, K); }
  for (let s = 0; s < Ht; s += per) { const l = Math.min(on, Ht - s); d.px(X, Y + s, th, l, K); d.px(X + Wd - th, Y + s, th, l, K); }
}
// The hammer stood on its handle's foot, head up (b3big's rest).
function hammerUp(d, x, y, z) {
  d.px(x * P, y * P, (P + 4) * z, (P - 2) * z, K);
  d.px(x * P + ((P + 4) * z) / 2 - z, y * P + (P - 2) * z, 2 * z, 2 * P * z, K);
}
function drawHandBench(d) {
  const h = M.hand, b = HB(), z = Z(), t = S.after.t, th = 2 * z;
  // the empty slots, dashed, eased in and out
  h.oa.forEach((a, k) => { if (a > 0.01) { const s = slotOf(k); d.fade(a, () => dashBox(d, s.x, s.y, s.w, s.h, th)); } });
  if (shaper()) { shaper().under?.(d); drawShaped(d); return; }   // MOCK the-sign-station-by-hand
  const flying = i => h.fly[i] && t - h.fly[i].at < HAND.fly;
  if (laidN()) { piece(d, b.x, b.y, z, flying); nails(d, b.x, b.y, z); }
  // a plank caught settling into its slot from where it was caught, growing
  // to the bench's size as it goes (b3big)
  h.fly.forEach((f, i) => {
    if (!f || t - f.at >= HAND.fly || M.laid[i] == null) return;
    const u = ease((t - f.at) / HAND.fly), s = slotCell(i), w = 2 + (s.w - 2) * u;
    fillCell(d, f.x + (s.x - f.x) * u, f.y + (s.y - f.y) * u, w, w, goodColor('plank', M.laid[i]));
  });
  // the next nail's spot, a dashed target round it
  const k = nextNail();
  if (k >= 0 && h.na > 0.01) { const [col, row] = NAILS_AT[k], q = 0.5 * z; d.fade(h.na, () => dashBox(d, b.x + col * z - q, b.y + row * z - q, z + 2 * q, z + 2 * q, Math.max(2, z + 1))); }
  const hm = h.hm;
  if (!hm.held && !hm.fall) { if (hm.up) hammerUp(d, hm.x, hm.y, z); else hammerAt(d, hm.x * P, hm.y * P, true, z); }
  if (M.setAt != null) puff(d, t - M.setAt, z, b);
}
// Over everything but the cues: the hammer in the hand, and a blow's ticks.
function drawHandTools() {
  if (shaper()) { shaper().drawTop?.(); return; }   // MOCK the-sign-station-by-hand  (its indicator, over the members)
  const d = wsFrame(), h = M.hand, t = S.after.t, z = Z(), b = HB();
  const ws = (x, y) => ({ x: cx(x) * P, y: cy(y) * P });   // a world point in the frame's px
  const hm = h.hm;
  if (hm.held) {
    // one rigid hammer: its handle a fixed length up and out off the head
    const hd = ws(hm.px, hm.hy ?? hm.py + hm.off);
    hammerAt(d, hd.x - P * z / 2, hd.y - (P - 2) * z / 2, false, z);
    d.line(hd.x / P, hd.y / P, hd.x / P + 1.5 * z, hd.y / P - 2 * z, 2 * z, K);
  } else if (hm.fall) {
    // falling at its true position, drifting to where it comes to rest
    const f = hm.fall, k = f.to > f.y0 ? clamp01((f.y - f.y0) / (f.to - f.y0)) : 1, wx = f.x0 + (f.x1 - f.x0) * k;
    if (hm.up) hammerUp(d, cx(wx) - (P + 4) * z / (2 * P), cy(f.y) - (P - 2) * z / (2 * P), z);
    else hammerAt(d, hm.x * P, cy(f.y) * P - P * z / 2, true, z);
  }
  if (h.strikeK != null && t - h.strikeAt <= T.ticks) {
    const [col, row] = NAILS_AT[h.strikeK], nx = (b.x + col * z) * P, ny = (b.y + row * z) * P;
    d.fade(1 - (t - h.strikeAt) / T.ticks, () => { d.px(nx - 6 * z, ny + z, 3 * z, 2 * z, K); d.px(nx + (P + 3) * z, ny + z, 3 * z, 2 * z, K); });
  }
}

// MOCK the-sign-station-by-hand: what signhand.js shapes with, and its bench
const slotOf = k => { const s = shaper()?.slot?.(k) || slotCell(k); return { h: s.w, ...s }; };
function drawShaped(d) {
  const h = M.hand, t = S.after.t, sh = shaper();
  if (!sh.slot) {
    // the square's planks settling into their slots, as the hammer's bench has them
    const flying = i => h.fly[i] && t - h.fly[i].at < HAND.fly;
    const b = HB(), z = Z();
    if (laidN() < 4) {
      for (const c of M.cells) if (M.laid[c.i] != null && !flying(c.i)) fillCell(d, b.x + c.col * z, b.y + c.row * z, z, z, goodColor('plank', M.laid[c.i]));
      h.fly.forEach((f, i) => {
        if (!f || t - f.at >= HAND.fly || M.laid[i] == null) return;
        const u = ease((t - f.at) / HAND.fly), s = slotCell(i), w = 2 + (s.w - 2) * u;
        fillCell(d, f.x + (s.x - f.x) * u, f.y + (s.y - f.y) * u, w, w, goodColor('plank', M.laid[i]));
      });
    } else if (h.fly.some((f, i) => flying(i))) {
      for (const c of M.cells) if (!flying(c.i)) fillCell(d, b.x + c.col * z, b.y + c.row * z, z, z, goodColor('plank', M.laid[c.i]));
      h.fly.forEach((f, i) => {
        if (!flying(i)) return;
        const u = ease((t - f.at) / HAND.fly), s = slotCell(i), w = 2 + (s.w - 2) * u;
        fillCell(d, f.x + (s.x - f.x) * u, f.y + (s.y - f.y) * u, w, w, goodColor('plank', M.laid[i]));
      });
    } else sh.draw(d);
  } else sh.draw(d);
  if (M.setAt != null) puff(d, t - M.setAt, Z(), HB());
}
export const signsM = () => M;
export { wsFrame, HB, FLAG, flag, fillCell, x0 };
