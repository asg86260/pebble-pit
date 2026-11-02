// MOCK the-sign-station-polish
// Throwaway review code, never merged: the owner's "start looking at the sign
// station to give it the same polish as the saw mill" (2026-11-01), as two
// options on the review bench for how a sign is made. Today a sign is four
// timber blocks taken off the workshop's pile and a sign set in its rack in
// one call (after/press.js, `joinSign`), the blank on the bench drawn whether
// or not there is timber; here the four blocks are followed through the shed
// as the log is through the saw mill:
//
//   the joiner steps off its stand, walks to the timber pile, lifts four
//   blocks a beat apiece into a square over its head, carries them back and
//   sets them down on the bench as the 4x4 they already are; takes up its
//   hammer and nails them together, stepping along the stand over each nail,
//   two blows a nail (up held, a smear, struck and held); paints them in the
//   sign's slate; lifts the sign, walks it to the rack and sets it down,
//   where the camp's members carry it out.
//
//   a  by hand: the hammer, then a brush down each column, the timber
//      turning slate under the bristles
//   b  through a mangle: the hammer, then the joiner turns a crank and the
//      board is fed under a paint roller, slate past the roller, out toward
//      the rack, as the log is fed through the blade
//
// The real piles at both ends: each block is taken off the bench's timber
// (`takeBlock`) at the lift, keeping its tone, and the sign is put in the
// rack (`setBlock`) at the set-down in the one tone it was painted, so
// nothing changes color or count but at the tool and at a hand-off. The
// workshop's own maker is silenced while the flag is up (after/gestures.js),
// and its joiner is the mock's, drawn here. `globalThis.__signsMock` picks
// the option ('a' | 'b'); a reset puts it away.

import { S } from '../../state.js';
import { P, AFTER_WALK, AFTER_ART_SCALE } from '../../config.js';
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

let M = null; // page: the mock's cycle, stood up by startSignsMock
held('signs-mock', () => { globalThis.__signsMock = null; M = null; });
// for the shot tools: the make's count and its beat
globalThis.__signsMockState = () => (M ? { n: M.n, ph: M.ph, t: M.t } : null);
export const signsMockOn = () => !!globalThis.__signsMock && !!S.after && built('workshop');
const opt = () => globalThis.__signsMock || 'a';

// --- the shed's cells (the workshop's frame: x across, y up off the floor) -------------
// A body's spot is its left column and top row; on the stand its feet are on
// the stand's top (row -9), behind the bench, its nails clear of their feet, as the game's joiner stands.
const STAND_Y = -12;
const SPOT = 13;                            // the joiner's spot on the stand, beside the board
const OFF = 20;                             // the stand's end, where it steps down to the floor
const BOARD = { x: 9, y: -7 };              // the board's top left on the bench: four 2x2 blocks
const SLOTS = [[0, 2], [2, 2], [0, 0], [2, 0]];   // each block's cell in it, laid bottom row first
const REST = { hammer: 20, brush: 17 };     // where each tool lies on the stand, its head's column
const DRUM = { x: 18, y: -8.5, r: 1.5, crank: 2 };  // option b: the paint roller and its crank, on the board's top
const BOARD_OUT = DRUM.x;                   // option b: the board's left column once it is through
const over = col => col - 1;                // the spot standing over a column's middle
const atRest = tool => REST[tool] - 0.5;    // the spot a tool on the stand is reached from
// --- the beats, seconds ---------------------------------------------------------------
const T = { lift: 0.3, set: 0.5, held: 0.2, reach: 0.3, blow: 0.5, up: 0.2, swing: 0.05, strike: 0.18,
            col: 0.45, colHeld: 0.1, raise: 0.4, puff: 0.3, ticks: 0.2, nailIn: 0.15, flush: 0.3, tint: 0.5 };
const SLIDE_V = 4;                          // option b: cells a second the mangle feeds the board
const V = AFTER_WALK / AP;                  // cells a second, every body up here
const SHUFFLE = V / 2;                      // along the stand, a step at a time
const SHANK = [8, 4, 0];                    // a nail's shank standing proud, px, after 0, 1, 2 blows

const fresh = () => ({ ph: 'wait', t: 0, n: 0, jx: SPOT, wFrom: SPOT, wTo: SPOT, wDur: 0, held: [], laid: [null, null, null, null],
                       nails: [0, 0, 0, 0], nailAt: [null, null, null, null], flushAt: [null, null, null, null], tool: null, blow: 0, col: 0, paint: 0, slide: 0,
                       sign: null, signV: cellOf('sign'), prevV: null, tintAt: -1e9, setAt: null, path: null, from: null });
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
// beside the rack, toward the shed, so the sign is swung down onto it clear of the body
const rackCol = () => cx(dropSpot('signs').at) - 2 - 3;
// Off the stand to the floor at column c and back.
const down = (from, c) => { const f = floorTop(c); return [[from, STAND_Y], [OFF, STAND_Y], [OFF, f], [c, f]]; };

// The board's left column now: on the bench where it was set, fed toward the rack by the mangle.
const boardX = () => BOARD.x + M.slide;
// A block of the board painted: by the brush, down its column as far as the
// bristles have come; by the mangle, once its column's middle is past the roller.
function painted(col, row) {
  if (opt() === 'b') return boardX() + col + 0.5 > DRUM.x;
  const p = M.paint, c = Math.floor(p);
  return col < c || (col === c && row < (p - c) * 4);
}

// --- the cycle ----------------------------------------------------------------------
export function startSignsMock(o) {
  // a swap mid-make: what the joiner had is put back where it came from
  if (M) {
    const blocks = [...M.held, ...M.laid.filter(v => v != null)];
    if (M.from) blocks.push(M.from.v);
    if (M.sign != null || M.paint > 0 || M.slide > 0) { if (setBlock('signs', null, M.signV)) source('sign', 1, 'signsmock'); }
    else for (const v of blocks) if (setBlock('benchtimber', null, v)) source('plank', 1, 'signsmock');
  }
  globalThis.__signsMock = o;
  M = fresh();
}
function go(ph, to = M.jx) {
  M.ph = ph; M.t = 0;
  // every beat on the stand begins with the joiner stepping along it to where it works
  M.wFrom = M.jx; M.wTo = to; M.wDur = Math.abs(to - M.jx) / SHUFFLE;
}
// The beat's own time, once the step along the stand is done (negative while stepping).
const own = () => M.t - M.wDur;
const stepped = () => { if (own() >= 0) M.jx = M.wTo; return own() >= 0; };
function nextAfterHammer() { M.tool = null; if (opt() === 'a') { M.tool = 'brush'; go('take', atRest('brush')); } else go('crank', SPOT); }
// One frame of the make, on the act's clock (scenes.js puts it on STEPS).
export function stepSignsMock(c) {
  if (!M || !signsMockOn()) return;
  M.t += Math.max(0, c.dt) / 1000;
  // the timber mound kept stocked for the haulers while it is off the window
  const tm = pileMid('mill', 'timber');
  if (pileCount('timber') < 8 && !inView(tm - AP * 12, AP * 24)) for (let k = 0; k < 4; k++) if (setBlock('timber')) source('plank', 1, 'signsmock');
  const ph = M.ph;
  if (ph === 'wait') { if (pileCount('benchtimber') >= 4) { M.path = down(SPOT, pileCol('benchtimber')); go('out'); } return; }
  if (ph === 'out' || ph === 'back' || ph === 'rack' || ph === 'home') {
    if (M.t * V < lenOf(M.path)) return;
    if (ph === 'out') go('lift');
    else if (ph === 'back') { M.jx = SPOT; go('lay'); }
    else if (ph === 'rack') go('set');
    else {
      M.n++; M.jx = SPOT; M.prevV = M.signV; M.signV = cellOf('sign'); M.tintAt = S.after.t;
      M.nails = [0, 0, 0, 0]; M.nailAt = [null, null, null, null]; M.flushAt = [null, null, null, null]; M.paint = 0; M.slide = 0; M.col = 0; M.blow = 0;
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
    if (M.t >= T.set) { M.tool = 'hammer'; go('take', atRest('hammer')); }
    return;
  }
  if (ph === 'take' || ph === 'put') {
    if (!stepped() || own() < T.reach) return;
    if (ph === 'take' && M.tool === 'hammer') { M.blow = 0; go('nail', over(boardX())); }
    else if (ph === 'take') { M.col = 0; go('paint', over(boardX())); }
    else if (M.tool === 'hammer') nextAfterHammer();
    else { M.tool = null; go('raise', over(boardX() + 1.5)); }
    return;
  }
  if (ph === 'nail') {
    // eight blows, two a nail, stepping over each nail first: up and held,
    // the swing a smear, struck and held
    if (!stepped()) return;
    const k = Math.floor(M.blow / 2), s = own();
    if (M.nailAt[k] == null) M.nailAt[k] = S.after.t;
    if (s >= T.up + T.swing && M.nails[k] < 1 + (M.blow % 2)) { M.nails[k] = 1 + (M.blow % 2); if (M.nails[k] === 2) M.flushAt[k] = S.after.t; }
    if (s >= T.blow) {
      M.blow++;
      if (M.blow >= 8) go('put', atRest('hammer'));
      else go('nail', over(boardX() + Math.floor(M.blow / 2)));
    }
    return;
  }
  if (ph === 'paint') {
    // each column top to bottom, stepping over it first, held a beat at its foot
    if (!stepped()) return;
    const s = own();
    M.paint = Math.max(M.paint, M.col + Math.min(1, s / T.col));
    if (s >= T.col + T.colHeld) {
      M.col++;
      if (M.col >= 4) { M.paint = 4; go('put', atRest('brush')); }
      else go('paint', over(boardX() + M.col));
    }
    return;
  }
  if (ph === 'crank') {
    if (!stepped()) return;
    M.slide = Math.min(BOARD_OUT - BOARD.x, own() * SLIDE_V);
    if (M.slide >= BOARD_OUT - BOARD.x) go('raise', over(boardX() + 1.5));
    return;
  }
  if (ph === 'raise') {
    if (!stepped() || own() < T.raise) return;
    M.sign = M.signV; M.laid = [null, null, null, null];
    M.path = down(M.jx, rackCol());
    go('rack');
    return;
  }
  if (ph === 'set') {
    if (M.t >= T.set - T.held && M.sign != null) {
      if (pileRoom('signs') <= 0) { M.t = T.set - T.held - 1e-6; return; }   // the rack full: held till it has room
      if (setBlock('signs', dropSpot('signs').at, M.sign)) source('sign', 1, 'workshop');
      M.sign = null;
    }
    if (M.t >= T.set) { const p = M.path[M.path.length - 1]; M.path = [...down(SPOT, p[0])].reverse(); go('home'); }
  }
}

// Where the joiner stands: its left column and top row, a lean and a bob in
// px, squat; on the stand, stepping along it at its true position.
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
  if (ph === 'crank') return { ...at, dx: Math.round(Math.cos(M.slide / DRUM.r)) };
  return at;
}

// --- the drawing ----------------------------------------------------------------------
const cut = (d, x, y, w, h, tone = W) => d.px(x * P + 2, y * P + 2, w * P - 4, h * P - 4, tone);
// The shed, roof A, as the game draws it (render/after/stations.js), the pips
// over the door the nails as driven.
function shed(d) {
  d.r(5, -18, 21, 1, K);
  d.px(5 * P, -17 * P - 2, 21 * P, 2, W);
  d.r(7, -19, 17, 1, K); d.r(9, -20, 13, 1, K); d.r(11, -21, 9, 1, K); d.r(13, -22, 5, 1, K);
  d.r(6, -17, 19, 17, K); d.r(8, -16, 15, 16, W);
  cut(d, 10, -20, 11, 2);
  const cw = 11 * P, gap = 8, pw = 6, px0 = 10 * P + Math.round((cw - (4 * pw + 3 * gap)) / 2), py0 = -20 * P + Math.round((2 * P - pw) / 2);
  M.nails.forEach((n, i) => {
    const x = px0 + i * (pw + gap);
    d.px(x, py0, pw, pw, K);
    if (n === 0) d.px(x + 1, py0 + 1, pw - 2, pw - 2, W); else if (n === 1) d.px(x + 1, py0 + 1, pw - 2, 2, W);
  });
  // the stand the joiner works on, paper read by its pale slats, behind the bench
  d.r(8, -9, 15, 9, W);
  for (const y of [-8, -6, -4]) d.px(8 * P + 2, y * P + 2, 15 * P - 4, 2, PALE);
  d.px(8 * P, -9 * P, 15 * P, 2, K);
  // the bench, its top two rows, on two legs
  d.r(8, -3, 15, 2, K); d.r(9, -1, 2, 1, K); d.r(20, -1, 2, 1, K);
}
// A tool lying on the stand (its head's top left in px, the handle toward
// the shed's middle), or hung head down from the hand.
function hammerAt(d, hx, hy, lying) {
  if (lying) { d.px(hx, hy, P, P, K); d.px(hx + P, hy + 2, P + P / 2, 2, K); return; }
  d.px(hx - 2, hy, P + 4, P - 2, K);
}
function brushAt(d, hx, hy, lying, tone) {
  if (lying) { d.px(hx, hy + 1, P - 2, P - 2, tone); d.px(hx + P - 2, hy + 1, 2, P - 2, K); d.px(hx + P, hy + 2, P + P / 2, 2, K); return; }
  d.px(hx, hy, P, 2, K); d.px(hx, hy + 2, P, P - 2, tone);
}
// The sign's slate, eased in on a new cycle's tone (fade, never pop).
function paint(d, fn) {
  const k = clamp01((S.after.t - M.tintAt) / T.tint);
  if (k < 1 && M.prevV != null) fn(goodColor('sign', M.prevV));
  d.fade(M.prevV == null ? 1 : k, () => fn(goodColor('sign', M.signV)));
}
const fillCell = (d, x, y, w, h, tone) => { const p = d.world(x, y); ctx.fillStyle = tone; ctx.fillRect(Math.round(p.x), Math.round(p.y), Math.round(w * AP), Math.round(h * AP)); };
// The board on the bench: each block's cells in its plank tone, or slate where painted.
function boardCells(d, bx, by) {
  M.laid.forEach((v, i) => {
    if (v == null) return;
    const [sx, sy] = SLOTS[i];
    for (let r = 0; r < 2; r++) for (let q = 0; q < 2; q++) {
      const col = sx + q, row = sy + r;
      fillCell(d, bx + col, by + row, 1, 1, painted(col, row) ? goodColor('sign', M.signV) : goodColor('plank', v));
    }
  });
}
// The nails along the board's top, a column each, standing proud until
// driven; a nail driven flush is in the board, its head eased out with the
// blow's ticks, so the sign carried is the plain 4x4 the rack holds.
function nails(d, bx, by) {
  M.nails.forEach((n, i) => {
    if (M.nailAt[i] == null) return;
    const sh = SHANK[n], top = by * P - sh - 2, x = (bx + i) * P;
    const a = clamp01((S.after.t - M.nailAt[i]) / T.nailIn) * (M.flushAt[i] == null ? 1 : 1 - clamp01((S.after.t - M.flushAt[i]) / T.flush));
    if (a > 0) d.fade(a, () => {
      if (sh) d.px(x + 2, top + 2, 2, sh, K);
      d.px(x + 1, top, P - 2, 2, K);
    });
  });
}
const crankAngle = () => M.slide / DRUM.r + Math.PI;
const knob = () => ({ x: DRUM.x + Math.cos(crankAngle()) * DRUM.crank, y: DRUM.y + Math.sin(crankAngle()) * DRUM.crank });
function mangle(d) {
  d.px(DRUM.x * P - 2, DRUM.y * P, 4, (-3 - DRUM.y) * P, K);                 // its post off the bench, behind the board
  // the drum, an ink rim round the slate it lays, a notch of paper turning in it
  const z = 2 * DRUM.r * P, dx0 = (DRUM.x - DRUM.r) * P, dy0 = (DRUM.y - DRUM.r) * P;
  d.px(dx0, dy0, z, z, K);
  paint(d, tone => d.px(dx0 + 2, dy0 + 2, z - 4, z - 4, tone));
  const a = crankAngle() - Math.PI;
  d.px(Math.round((DRUM.x + Math.cos(a) * 0.8) * P - 2), Math.round((DRUM.y + Math.sin(a) * 0.8) * P - 2), 4, 4, W);
  // the crank off the hub, its knob at its true position
  const k = knob();
  d.line(DRUM.x, DRUM.y, k.x, k.y, 2, K);
  d.px(DRUM.x * P - 2, DRUM.y * P - 2, 4, 4, K);
  d.px(Math.round(k.x * P - 3), Math.round(k.y * P - 3), 6, 6, K);
}
function puff(d, bx, age) {
  const k = age / T.puff;
  if (k < 0 || k >= 1) return;
  d.fade(1 - k, () => { for (const sx of [-1 - k, 4 + k]) d.px((bx + sx) * P, (BOARD.y + 3 - k) * P, P, P, MID); });
}
// The station's own pass: the shed, the tools lying, the machine, the board.
export function drawSignsMock(d) {
  if (!M) return;
  shed(d);
  if (opt() === 'b') mangle(d);
  if (M.tool !== 'hammer') hammerAt(d, REST.hammer * P, -10 * P, true);
  if (opt() === 'a' && M.tool !== 'brush') paint(d, tone => brushAt(d, REST.brush * P, -10 * P, true, tone));
  // (the board lifted off the bench is the members' pass's from the lift's first frame)
  if (M.laid.some(v => v != null) && !(M.ph === 'raise' && own() >= 0)) { boardCells(d, boardX(), BOARD.y); nails(d, boardX(), BOARD.y); }
  if (M.setAt != null) puff(d, BOARD.x, S.after.t - M.setAt);
}
// The members' pass: the joiner, what it carries, the tool in its hand.
export function drawSignsMockJoiner() {
  if (!M || !signsMockOn()) return;
  const d = frame(x0(), groundOf('workshop'), 0, null, AFTER_ART_SCALE);
  const j = joinerAt();
  // the square of blocks over the head, a block coming up off the pile into it
  const sq = at => ({ x: at.x + 1.5 - 2, y: at.y - 4 });
  if (M.ph === 'lay' && M.held.length) {
    const u = ease(clamp01(M.t / (T.set - T.held))), o = sq(j), top = BOARD.y - 1;
    const pts = [[o.x, o.y], [o.x, Math.min(o.y, top)], [BOARD.x, Math.min(o.y, top)], [BOARD.x, BOARD.y]];
    const p = along(pts, u * lenOf(pts));
    M.held.forEach((v, k) => fillCell(d, p.x + SLOTS[k][0], p.y + SLOTS[k][1], 2, 2, goodColor('plank', v)));
  } else M.held.forEach((v, k) => { const o = sq(j); fillCell(d, o.x + SLOTS[k][0], o.y + SLOTS[k][1], 2, 2, goodColor('plank', v)); });
  if (M.ph === 'lift' && M.from) {
    const o = sq(j), k = M.held.length, u = ease(clamp01(M.t / T.lift));
    const to = { x: o.x + SLOTS[k][0], y: o.y + SLOTS[k][1] };
    fillCell(d, M.from.x + (to.x - M.from.x) * u, M.from.y + (to.y - M.from.y) * u, 2, 2, goodColor('plank', M.from.v));
  }
  // the sign: lifted off the bench, carried, swung down onto the rack
  if (M.ph === 'raise' && own() >= 0) {
    const o = sq(j), u = ease(clamp01(own() / T.raise)), bx = boardX();
    const pts = [[bx, BOARD.y], [bx, Math.min(o.y, BOARD.y - 1)], [o.x, o.y]];
    const p = along(pts, u * lenOf(pts));
    fillCell(d, p.x, p.y, 4, 4, goodColor('sign', M.signV));
    nails(d, p.x, p.y);
  } else if (M.sign != null) {
    let p = sq(j);
    if (M.ph === 'set') {
      const ds = dropSpot('signs'), to = { x: cx(ds.at) - 2, y: cy(ds.top) - 4 }, u = ease(clamp01(M.t / (T.set - T.held)));
      p = { x: p.x + (to.x - p.x) * u, y: p.y + (to.y - p.y) * u };
    }
    fillCell(d, p.x, p.y, 4, 4, goodColor('sign', M.sign));
    nails(d, p.x, p.y);
  }
  d.body(j.x, j.y, j.dx || 0, j.dy || 0, !!j.squat);
  // the hand: a cell in from the body's side, at its middle row
  const hl = { x: j.x * P + (j.dx || 0) + 2, y: (j.y + 1.5) * P + (j.dy || 0) }, hr = { x: hl.x + 3 * P - 4, y: hl.y };
  if (M.tool && (M.ph === 'take' || M.ph === 'put')) {
    // a tool taken up off the stand or laid back on it, between its rest and the hand
    const s = own(), k = s < 0 ? 0 : ease(clamp01(s / T.reach)), u = M.ph === 'take' ? k : 1 - k;
    const rx = REST[M.tool] * P, ry = -10 * P, hx = rx + (hl.x - rx) * u, hy = ry + (hl.y - ry) * u;
    if (M.tool === 'hammer') hammerAt(d, hx, hy, u < 0.5);
    else paint(d, tone => brushAt(d, hx, hy, u < 0.5, tone));
    return;
  }
  if (M.tool === 'hammer') {
    // stepping to the nail, it hangs from the hand; at the nail, held up, a
    // smear, struck plumb on the nail's head and held
    const k = Math.floor(M.blow / 2), s = own(), nx = (boardX() + k) * P, headY = BOARD.y * P - SHANK[M.nails[k]] - 2;
    if (s < 0) { hammerAt(d, hl.x - P / 2, hl.y + 2, false); d.line(hl.x / P, hl.y / P, hl.x / P, (hl.y + 2) / P, 2, K); return; }
    const pose = s < T.up ? 'up' : s < T.up + T.swing ? 'swing' : s < T.up + T.swing + T.strike ? 'strike' : 'up';
    const upY = (STAND_Y - 3) * P;
    const head = pose === 'strike' ? { x: nx, y: headY - (P - 2) } : { x: nx - P, y: upY };
    if (pose === 'swing') d.fade(0.4, () => { hammerAt(d, nx - P, upY, false); hammerAt(d, nx - P / 2, (upY + headY) / 2, false); });
    else hammerAt(d, head.x, head.y, false);
    d.line(hl.x / P, hl.y / P, (head.x + P / 2) / P, (head.y + P / 2) / P, 2, K);   // the handle, hand to head
    if (pose === 'strike') d.fade(1 - (s - T.up - T.swing) / T.ticks, () => { d.px(nx - 5, headY - 2, 3, 2, K); d.px(nx + P + 2, headY - 2, 3, 2, K); });
    return;
  }
  if (M.tool === 'brush') {
    let bx = hl.x - P / 2, by = hl.y + 2;
    if (M.ph === 'paint' && own() >= 0) {
      const dn = Math.min(1, own() / T.col);
      bx = (boardX() + M.col) * P; by = (BOARD.y + 3.4 * dn) * P - 2;
    }
    paint(d, tone => brushAt(d, bx, by, false, tone));
    d.line(hl.x / P, hl.y / P, (bx + P / 2) / P, by / P, 2, K);
    return;
  }
  if (M.ph === 'crank' && own() >= -0.05) { const k = knob(); d.line(hr.x / P, hr.y / P, k.x, k.y, 2, K); }
}
