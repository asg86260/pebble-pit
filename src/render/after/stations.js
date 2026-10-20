// The camp's six stations: the saw mill, the chipper, the paper mill and the
// workshop as voted in the second redesign (docs/mocks/act3-stations-r2-2026-10-18:
// the frame saw, the jaws, the vat and line, the shed), matched to the press
// (docs/mocks/act3-stations-2026-10-18, polish-workshop-press.html), and the
// construction shack (docs/mocks/act3-place-2026-10-18/shack.html). Each
// holds to what makes the press read: a closed outline, one moving part the
// eye follows, white cut out of black rather than outlines, level and plumb
// edges (one rod may slant), the body joined to the part, and the product in
// view. Each is drawn on its own frame (kit.js) in the mock's own cells, so
// the numbers below are the mock's: the frame's ground is the mock's `G`, and
// the chipper's frame is turned to face the saw mill.
//
// A station draws its idle pose, or with `work` its working pose at time
// `t`; the worker's body is not drawn here but by the members' layer at the
// pose `workerPose` gives, so the one body standing at the door is the one
// doing the work. With the hand on it (`h`, the station's record in
// after/gestures.js, `gestureView`) the moving part goes where the hand put
// it instead: the wheel at the angle it was spun to and the blade at the
// stroke that angle gives, the jaw chewing while the log is held in, the
// paddle across the vat as far round as it is stirred, the bar as far down
// as it is pulled. Every pose is held: a part moves a whole step at a time.
const TURN = Math.PI / 16;                                 // a held step of a turning part
const turning = h => !!h && (h.grab || Math.abs(h.w || 0) > 0.05);

import { P, GESTURE_WHEEL_LOG, GESTURE_ARM_LOG, GESTURE_ARM_HOLD, AFTER_LINE_SHORT } from '../../config.js';
import { K, W, PALE, MID, DUST, toward, hash, clamp01, silhouette } from './kit.js';
import { signsJoined } from '../../after/press.js';
import { paperPulls } from '../../after/mill.js';

const cyc = (t, T) => { const u = Math.max(0, t), k = Math.floor(u / T); return { ph: u / T - k, since: u - k * T }; };
const FADE = 0.4;
// White cut out of a mass a cell or more, 2 px in from its edge.
const cut = (d, x, y, w, h, tone = W) => d.px(x * P + 2, y * P + 2, w * P - 4, h * P - 4, tone);

// --- the saw mill: through the beams ----------------------------------------------
// Take 2 of docs/mocks/act3-sawmill-2026-10-18: a closed frame like the
// press's, its blade longer than the opening so its ends ride inside a
// three-cell head and a four-cell bed and it fills the frame at every point
// of its stroke; its crosshead rides over the head, and a rod slants up to it
// off a crank by the flywheel's hub, so each turn of the fourteen-cell wheel
// is a stroke. The log comes in from the wheel's side through the teeth and
// leaves as two planks. The body at the wheel turns it by a knob on a stub
// off the rim. Numbers are the mock's, laid ten cells in so the log pile
// stands at the ground's foot.
const MW = { cx: 19, cy: -9, r: 6 }, CRANK = 1.5, KNOB = MW.r + 2, MILL_TURN = Math.PI / 8;
const MILL = { L: 32, R: 47, head: -21, bed: -6, bx: 40, logX0: 27, logLen: 14, body: 7 };
const BARK = [MID, MID, PALE, MID], WOOD = [PALE, W, PALE, PALE], RIP = [0, 1, 2, 3];
function flywheel(d, a) {
  const { cx, cy, r } = MW;
  d.px(cx * P - 3, cy * P, 6, -cy * P, K); d.r(cx - 3, -1, 6, 1, K);       // its post and foot
  for (let y = Math.floor(cy - r - 2); y <= cy + r + 2; y++) for (let x = Math.floor(cx - r - 2); x <= cx + r + 2; x++) {
    const dd = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
    if (dd > r - 1 && dd <= r + 1) d.c(x, y, K);
  }
  for (let k = 0; k < 4; k++) { const q = a + Math.PI / 4 + k * Math.PI / 2; d.line(cx, cy, cx + Math.cos(q) * (r - 0.5), cy + Math.sin(q) * (r - 0.5), 5); }
  d.r(cx - 1.5, cy - 1.5, 3, 3, K);
  const kx = cx + Math.cos(a) * KNOB, ky = cy + Math.sin(a) * KNOB;
  d.line(cx + Math.cos(a) * (r + 0.5), cy + Math.sin(a) * (r + 0.5), kx, ky, 4);   // the knob's stub
  return { kx, ky, pin: { x: cx + Math.cos(a) * CRANK, y: cy + Math.sin(a) * CRANK } };
}
// The blade, plumb: its spine of ink, a grey plate, the rip teeth facing the
// log, riding the stroke so they move with it.
function millBlade(d, x, y0, y1, o) {
  for (let y = y0; y <= y1; y++) {
    const k = RIP[(((y - o) % 4) + 4) % 4];
    d.c(x, y, PALE); d.c(x + 1, y, K);
    if (k) d.r(x - k, y, k, 1, K);
  }
}
// The log: grey bark in an ink rim, its grain cut white; open kerf where the
// teeth stand in it, and two pale planks past the blade.
function millLog(d, x, y, bx) {
  for (let i = 0; i < MILL.logLen; i++) {
    const c = x + i;
    if (c >= bx - 3 && c < bx + 2) { if (c < bx) d.r(c, y, 1, 3, W); continue; }
    if (c < bx) {
      d.r(c, y, 1, 3, K); d.px(c * P, y * P + 2, P, 3 * P - 4, BARK[Math.floor(hash(c - x + 1.3) * BARK.length)]);
      const h = hash(c - x + 0.5), row = h < 0.5 ? 6 : 10;
      d.px(c * P + (h < 0.25 || h > 0.75 ? 0 : 2), y * P + row, h < 0.25 || h > 0.75 ? P : P - 2, 2, W);
    } else {
      d.px(c * P, y * P, P, 8, K); d.px(c * P, y * P + 2, P, 4, WOOD[Math.floor(hash(c - x + 3.1) * WOOD.length)]);
      d.px(c * P, y * P + 10, P, 8, K); d.px(c * P, y * P + 12, P, 4, WOOD[Math.floor(hash(c - x + 4.7) * WOOD.length)]);
    }
  }
}
const SAW_T = 6.4;
// The log's tail along its way at phase ph, a cell a step, and its ink.
function millLogAt(ph, since) {
  const steps = MILL.bx + 2 - MILL.logX0, i = Math.min(steps, Math.floor(ph * (steps + 2)));
  return { x: MILL.logX0 + i, a: since < FADE ? since / FADE : ph > 0.92 ? 1 - (ph - 0.92) / 0.08 : 1 };
}
function mill(d, work, t, h, body = false) {
  const hand = turning(h);
  const a = hand ? Math.round(h.ang / MILL_TURN) * MILL_TURN : work ? Math.floor(t / 0.1) * MILL_TURN : 0;
  const o = Math.round(1.5 + 1.5 * Math.sin(a)), { L, R, head, bed, bx } = MILL;
  const k = flywheel(d, a);
  d.line(k.pin.x, k.pin.y, bx - 2.5, head - 4 + o, 7, W); d.line(k.pin.x, k.pin.y, bx - 2.5, head - 4 + o, 3);   // the rod, in a paper rim
  d.r(L, head, 2, bed - head, K); d.r(R, head, 2, bed - head, K);         // posts
  d.r(L - 1, head, R - L + 4, 3, K);                                      // the head
  d.r(L - 1, bed, R - L + 4, 4, K);                                       // the bed, on legs
  d.r(L, -2, 2, 2, K); d.r(R, -2, 2, 2, K); d.r(L - 1, -1, 3, 1, K); d.r(R, -1, 3, 1, K);
  const ly = bed - 3;
  if (hand && (h.prog || 0) > 0) { const lg = millLogAt((h.prog || 0) / GESTURE_WHEEL_LOG * 0.92, 1); millLog(d, lg.x, ly, bx); }
  else if (work) { const c = cyc(t, SAW_T), lg = millLogAt(c.ph, c.since); d.fade(lg.a, () => millLog(d, lg.x, ly, bx)); }
  millBlade(d, bx, head + 3, bed - 1, o);
  d.r(bx, head - 3 + o, 2, 3 - o, K);                                     // its strap up out of the head
  d.r(bx - 3, head - 5 + o, 6, 2, K); d.px((bx) * P - 2, (head - 4 + o) * P - 2, 4, 4, W);   // the crosshead
  d.px(Math.round(k.pin.x * P) - 3, Math.round(k.pin.y * P) - 3, 6, 6, K); d.px(Math.round(k.pin.x * P) - 1, Math.round(k.pin.y * P) - 1, 2, 2, W);
  // A body at the wheel: its arm to its fist round the knob.
  if (body) {
    const fx = Math.round(k.kx * P) - 7, fy = Math.round(k.ky * P) - 7;
    d.line(MILL.body + 3, -2, k.kx, k.ky, 2);
    d.px(fx, fy, 14, 14, K); d.px(fx + 2, fy + 2, 10, 10, W); d.px(fx + 5, fy + 5, 4, 4, K);
  }
}

// --- the chipper: the jaws and the arm ---------------------------------------------
// docs/mocks/act3-chipper-2026-10-18, the chosen control: the jaws on a tall
// back block with a chute off its top, and a slot-machine arm on a pivot box
// on top of the block, clear of the jaws' mouth (the owner, 2026-10-20: "on
// top of the chipper, not right in front of the mouth"), swinging down over
// the top jaw toward the pile. A log is dragged off the pile into the jaws; the arm is
// pulled down and held, and the top jaw bites at a steady pace, a cell of
// log a bite, its teeth sinking into the wood; let go, the arm springs back
// up a held pose at a time (plumb, half way, level) and the jaws stop. Drawn
// facing right, in the mock's cells laid four to the left; its frame turns
// it to face the saw mill.
const CH = { slot: 22, slotY: -4, log: 6, block: 28, pivot: { x: 29, y: -16 },
             knob: [{ x: 29, y: -22 }, { x: 25, y: -20 }, { x: 23, y: -16 }], body: 10 };
const ARM_BITE = [0, 1, 2, 4, 4, 4, 2, 1], BITE_S = 0.7, ARM_KERF = 3, ARM_CUT = 6;
// The arm's held pose off how far it is pulled.
const armPose = k => (k >= GESTURE_ARM_HOLD ? 2 : k >= 0.3 ? 1 : 0);
function chTooth(d, x, row, dir) {
  const steps = [[0, 6], [1, 4], [2, 2]], y0 = row * P, yOf = i => (dir > 0 ? y0 + i * 2 : y0 + P - (i + 1) * 2);
  steps.forEach(([o, w], i) => d.px(x * P + o - 2, yOf(i) - (dir > 0 ? 0 : 2), w + 4, 4, W));
  steps.forEach(([o, w], i) => d.px(x * P + o, yOf(i), w, 2, K));
}
function chLog(d, x, len) {
  const y = CH.slotY * P;
  d.px(x * P - 2, y - 2, len * P + 4, 2 * P + 4, W);
  d.px(x * P, y, len * P, 2 * P, K); d.px(x * P + 2, y + 2, P - 2, 2 * P - 4, PALE);
}
function chArm(d, p) {
  const pv = CH.pivot, k = CH.knob[p];
  if (p === 0) d.r(pv.x, k.y + 1, 1, pv.y - k.y, K);
  else if (p === 2) d.r(k.x + 1, pv.y, pv.x - k.x, 1, K);
  else { const x0 = (pv.x + 0.5) * P, y0 = (pv.y + 0.5) * P, y1 = (k.y + 0.5) * P; for (let y = y1; y < y0; y++) d.px(x0 - (y0 - y) - 4, y, 8, 1, K); }
  const x = (k.x - 1) * P, y = (k.y - 1) * P;                 // the ball, its corners cut, a glint
  d.px(x, y, 3 * P, 3 * P, K);
  [[0, 0], [3 * P - 3, 0], [0, 3 * P - 3], [3 * P - 3, 3 * P - 3]].filter((c, i) => !(p === 1 && i === 3)).forEach(([cx, cy]) => d.px(x + cx, y + cy, 3, 3, W));
  d.px(x + 4, y + 4, 4, 2, W); d.px(x + 4, y + 6, 2, 2, W);
  d.r(pv.x - 2, pv.y + 1, 5, 1, K);                           // its mount on the block's top
  d.r(pv.x - 1, pv.y - 1, 3, 3, K);                           // the pivot box, a white ring round its pin
  d.px(pv.x * P - 2, pv.y * P - 2, P + 4, P + 4, W); d.px(pv.x * P, pv.y * P, P, P, K);
}
function chipper(d, work, t, h) {
  // By hand: the arm where it is pulled, the log in the jaws as far as it
  // is fed, the jaws biting while it is held down. At a post: the arm held
  // level and the jaws biting through the log on the feeder's clock.
  const hand = !!h && (h.log === 'in' || h.arm || h.k > 0);
  const pose = hand ? armPose(h.k) : work ? 2 : 0;
  const biting = hand ? h.hold && h.log === 'in' : work;
  const logIn = hand ? h.log === 'in' : work;
  const fed = hand ? (h.prog || 0) / GESTURE_ARM_LOG : work ? cyc(t, CHIP_T).ph : 0;
  const cuts = Math.min(CH.log - 1, Math.floor(fed * CH.log));
  const idx = biting ? Math.floor((t % BITE_S) / BITE_S * ARM_BITE.length) : -1, jy = -13 + (idx >= 0 ? ARM_BITE[idx] : 0);
  d.r(CH.block, -15, 6, 15, K);                               // the back block
  d.px((CH.block + 1) * P + 2, -6 * P, 4 * P - 4, 2, W); d.px((CH.block + 1) * P + 2, -4 * P, 4 * P - 4, 2, W);
  d.r(18, -1, 10, 1, K);                                      // the bottom jaw
  d.r(19, jy, 9, 4, K); d.r(18, jy - 1, 1, 3, K);             // the top jaw and its lip
  d.px(20 * P, (jy + 1) * P + 2, 6 * P, 2, W);                // its band, cut white
  d.px(CH.block * P - 2, (jy + 2) * P - 2, 4, 4, W);          // the hinge pin
  if (logIn) {
    chLog(d, CH.slot + cuts, CH.log - cuts);
    d.px(CH.block * P, CH.slotY * P - 2, 2, 2 * P + 4, K);
    if (idx > ARM_KERF && idx < ARM_CUT) {                    // the cell at the mouth breaking up
      d.px((CH.block - 1) * P, CH.slotY * P, P, 2 * P, W);
      for (let j = 0; j < 6; j++) for (let i = 0; i < 3; i++) {
        const q = hash(i * 7 + j * 13 + cuts * 31 + idx);
        if (q > 0.3) d.px((CH.block - 1) * P + i * 2, CH.slotY * P + j * 2, 2, 2, q > 0.75 ? K : q > 0.5 ? MID : PALE);
      }
    }
  }
  for (let i = 0; i < 5; i++) chTooth(d, 18 + i * 2, -2, -1);
  for (let i = 0; i < 5; i++) chTooth(d, 19 + i * 2, jy + 4, 1);
  d.px(CH.block * P, -6 * P, 2, 5 * P, K);
  d.r(31, -18, 2, 3, K); d.r(31, -19, 7, 2, K); d.r(36, -17, 2, 2, K); d.r(35, -15, 4, 1, K);   // the chute
  chArm(d, pose);
  // The chips: dashes falling a cell every tenth of a second from the chute
  // while the jaws bite.
  if (!biting) return;
  const step = Math.floor(t * 10) % 12;
  for (let j = 0; j < 8; j++) {
    const y = -14 + step - j * 2;
    if (y < -14 || y > -3) continue;
    d.r(36 + (j % 2), y, 1, 2, DUST[j % DUST.length]);
  }
}
const CHIP_T = 4.2;

// --- the paper mill: the vat and the line -------------------------------------------
// docs/mocks/act3-papermill-2026-10-18, all five steps: the pulp thickens as
// it is stirred; a full batch, the pulper hauls the mould up out of the vat
// on its cord and the wet sheet is pegged on the line; it dries from the wet
// grey to paper a held step at a time, swaying in the gusts down the line; a
// second worker at the far end lifts each dry sheet off on a peel and lays it
// on the stack. With the bigger vat the mould lifts two sheets; with the
// drying line the line runs eight sheets long instead of four.
//
// What is on the line is this session's drawing: the batch is the sim's (a
// sheet counted on the pull, mill.js), and the line plays each pull out from
// the moment it was made (mill.js, `paperPulls`). A sheet is on the line a
// few seconds after its count.
const PADDLE_MID = 18, PADDLE_REACH = 3, SURFACE = -7, LINE_Y = -18, SHEET_TOP = -16, MOULD_REST = -6;
const LIFT_N = MOULD_REST - SHEET_TOP, SLOT0 = 14, SLOT_W = 5, PEEL_UNDER = (SHEET_TOP + 3) * P;
const PT = { slide: 0.1, lift: 0.09, hang: 0.35, peg: 0.25, lower: 0.05, peelUp: 0.06, unpeg: 0.25, peelDown: 0.06, land: 0.3, sway: 0.3 };
const DRY_S = 16, WET = MID, STIR_T = 0.3, PADDLE_X = [15, 18, 21, 18];
export const lineOf = slots => { const LAST = SLOT0 + SLOT_W * (slots - 1); return { LAST, stackX: LAST, peelX: LAST + 4, loftX: LAST + 5, postR: LAST + 9, lineX1: LAST + 10 }; };
// The line's record: the pull and the loft hand, each on its held steps.
let line = null;
function lineRec(t) {
  if (!line || t < line.t) line = { t, seen: -Infinity, pul: { st: 'stir', k: 0, tm: 0 }, sheets: [], loft: { st: 'rest', y: 0, tm: 0, carry: null, target: null }, queue: 0 };
  return line;
}
// Played on in steps of a twentieth of a second, however long since the
// last frame, so a clock turned fast plays it out the same.
function stepLine(t, moulds, slots) {
  const L = lineRec(t);
  for (const at of paperPulls()) if (at > L.seen) { L.queue += 1; L.seen = at; }   // a pull made: its sheet to go on the line
  L.t = Math.max(L.t, t - 30);                                 // a long while off screen: the last half minute of it
  let out = null;
  for (let u = Math.min(t, L.t + 0.05); ; u = Math.min(t, u + 0.05)) { out = stepLineTo(L, u, moulds, slots); if (u >= t) break; }
  return out;
}
function stepLineTo(L, t, moulds, slots) {
  const dt = t - L.t, G = lineOf(slots), pu = L.pul, lo = L.loft;
  L.t = t;
  const hangEnd = SLOT0 + SLOT_W * moulds, dryOf = q => clamp01((t - q.born) / DRY_S);
  pu.tm += dt;
  if (pu.st === 'stir') {
    const taken = L.sheets.some(q => q.x < hangEnd), endFree = !L.sheets.some(q => q.x >= G.LAST);
    if (taken && endFree) { pu.st = 'slide'; pu.k = 0; pu.tm = 0; }
    else if (L.queue > 0 && !taken) { pu.st = 'lift'; pu.k = 0; pu.tm = 0; L.queue -= 1; }
  } else if (pu.st === 'slide') {
    while (pu.tm >= PT.slide && pu.st === 'slide') { pu.tm -= PT.slide; for (const q of L.sheets) q.x++; if (++pu.k === SLOT_W) { pu.st = 'stir'; pu.tm = 0; } }
  } else if (pu.st === 'lift') {
    while (pu.tm >= PT.lift && pu.st === 'lift') {
      pu.tm -= PT.lift;
      if (++pu.k === LIFT_N) { pu.st = 'hang'; pu.tm = 0; for (let i = 0; i < moulds; i++) L.sheets.push({ x: SLOT0 + SLOT_W * i, born: t, peg: 0, fresh: true }); }
    }
  } else if (pu.st === 'hang') {
    for (const q of L.sheets) if (q.fresh) q.peg = clamp01(pu.tm / PT.peg);
    if (pu.tm >= PT.hang) { pu.st = 'lower'; pu.k = LIFT_N; pu.tm = 0; for (const q of L.sheets) { q.fresh = false; q.peg = 1; } }
  } else if (pu.st === 'lower') {
    while (pu.tm >= PT.lower && pu.st === 'lower') { pu.tm -= PT.lower; if (--pu.k === 0) { pu.st = 'stir'; pu.tm = 0; } }
  }
  L.sheets = L.sheets.filter(q => q.x <= G.LAST);              // a line shortened drops nothing it never had
  const rest = -2 - 3 * 3 - 3;
  lo.tm += dt;
  if (lo.st === 'rest') {
    lo.y = rest;
    const q = L.sheets.find(z => z.x === G.LAST && !z.fresh && dryOf(z) >= 1);
    if (q && pu.st !== 'slide') { lo.st = 'up'; lo.tm = 0; lo.target = q; }
  } else if (lo.st === 'up') {
    while (lo.tm >= PT.peelUp && lo.st === 'up') { lo.tm -= PT.peelUp; lo.y = Math.max(PEEL_UNDER, lo.y - P); if (lo.y === PEEL_UNDER) { lo.st = 'unpeg'; lo.tm = 0; } }
  } else if (lo.st === 'unpeg') {
    lo.target.peg = 1 - clamp01(lo.tm / PT.unpeg);
    if (lo.tm >= PT.unpeg) { L.sheets = L.sheets.filter(z => z !== lo.target); lo.target = null; lo.carry = { a: 1 }; lo.st = 'down'; lo.tm = 0; }
  } else if (lo.st === 'down') {
    while (lo.tm >= PT.peelDown && lo.st === 'down') { lo.tm -= PT.peelDown; lo.y = Math.min(rest, lo.y + P); if (lo.y === rest) { lo.st = 'land'; lo.tm = 0; } }
  } else if (lo.st === 'land') {
    lo.carry.a = 1 - clamp01(lo.tm / PT.land);
    if (lo.tm >= PT.land) { lo.carry = null; lo.st = 'rest'; lo.tm = 0; }
  }
  return { L, G, dryOf };
}
// A gust down the line on a held clock: a sheet's bottom row kicked a whole
// cell, a wet one only at a gust's peak, a dry one at most gusts.
function leanOf(q, t, dry) {
  if (q.fresh || q.peg < 1) return 0;
  const tq = Math.floor(t / PT.sway) * PT.sway;
  const g = Math.sin(tq * 1.1 - q.x * 0.09) + 0.55 * Math.sin(tq * 2.7 + 1.3 - q.x * 0.05);
  const v = g * (0.35 + 0.65 * dry);
  return Math.abs(v) > 0.45 ? Math.sign(v) : 0;
}
// A sheet four cells by three, drying from the mid grey through the pale to
// paper, its bottom row pooled and dry last; a lean kicks the bottom row a cell.
function wetSheet(d, x, top, dry, bot = 0) {
  const off = [0, 0, bot], w = 4 * P, fill = toward(WET, W, dry), pool = toward(WET, W, (dry - 0.4) / 0.6);
  for (let r = 0; r < 3; r++) d.px((x + off[r]) * P, (top + r) * P, w, P, K);
  for (let r = 0; r < 3; r++) d.px((x + off[r]) * P + 2, (top + r) * P + (r === 0 ? 2 : 0), w - 4, P - (r === 0 ? 2 : 0) - (r === 2 ? 2 : 0), r === 2 ? pool : fill);
  if (bot) { const a0 = x * P + 2, b0 = (x + bot) * P + 2, Y = (top + 2) * P; d.px(Math.min(a0, b0), Y - 2, P, 2, K); d.px(Math.max(a0, b0) + w - 4 - P, Y, P, 2, K); }
}
const pegs = (d, x, top, a) => d.fade(a, () => { d.px(x * P + 3, (top - 1) * P, 3, P + 2, K); d.px((x + 4) * P - 6, (top - 1) * P, 3, P + 2, K); });
function mould(d, top, moulds, full) {
  const x0 = SLOT0 - 1, x1 = SLOT0 + SLOT_W * moulds - 1, cx = (x0 + x1 + 1) / 2;
  d.px(cx * P - 1, (LINE_Y + 1) * P, 2, (top - 1 - LINE_Y - 1) * P, K);
  if (full) for (let i = 0; i < moulds; i++) wetSheet(d, SLOT0 + SLOT_W * i, top, 0);
  for (let i = 0; i <= moulds; i++) d.px((x0 + SLOT_W * i) * P, (top - 1) * P, P, 4 * P + 2, K);
  d.px(x0 * P, (top - 1) * P, (x1 - x0 + 1) * P, 3, K);
  d.px(x0 * P, (top + 3) * P, (x1 - x0 + 1) * P, 2, K);
}
function vat(d, fill) {
  d.r(10, -10, 4, 1, K); d.r(24, -10, 4, 1, K);             // the rim's lips
  d.r(11, -9, 2, 8, K); d.r(25, -9, 2, 8, K);               // walls
  d.r(12, -2, 14, 1, K);                                    // floor
  d.r(11, -1, 3, 1, K); d.r(24, -1, 3, 1, K);               // feet
  // The pulp: thin after a pull, paper flecked pale, each cell thickening on
  // its own as the batch fills to pale flecked mid.
  for (let j = 0; j < 5; j++) for (let i = 0; i < 12; i++) {
    const hh = hash((13 + i) * 5.1 + j * 9.3), hh2 = hash((13 + i) * 2.7 + j * 4.1);
    d.c(13 + i, SURFACE + j, toward(hh < 0.45 ? W : PALE, hh2 < 0.6 ? PALE : MID, (fill - hh * 0.6) / 0.4));
  }
}
function crest(d, x, dir) {
  const c = dir > 0 ? x + 2 : x - 3, tr = dir > 0 ? x - 3 : x + 2;
  if (c >= 13 && c + 2 <= 25) d.r(c, SURFACE - 1, 2, 1, PALE);
  if (tr >= 13 && tr + 2 <= 25) d.r(tr, SURFACE, 2, 1, W);
}
// The pulper's lean, off what the pull is doing.
let pulperLean = 0;
function papermill(d, work, t, h, body = false, at = {}) {
  const moulds = at.moulds || 1, slots = at.slots || AFTER_LINE_SHORT, G = lineOf(slots);
  const hand = turning(h);
  const st = d.sinking ? { L: { pul: { st: 'stir', k: 0 }, sheets: [], loft: { y: -14, carry: null } }, dryOf: () => 1 } : stepLine(t, moulds, slots);
  const { L } = st, pu = L.pul, lo = L.loft;
  d.r(5, -9, 4, 9, K);                                      // the step
  for (let y = -8; y < 0; y += 2) d.px(5 * P + 3, y * P + 1, 4 * P - 6, 2, W);
  vat(d, at.fill || 0);
  d.r(10, LINE_Y + 1, 1, -10 - LINE_Y - 1, K);              // the left post, off the vat's lip
  d.r(G.postR, LINE_Y + 1, 1, -LINE_Y - 2, K); d.r(G.postR - 1, -1, 3, 1, K);   // the far post and its foot
  d.r(9, LINE_Y, G.lineX1 - 9, 1, K);                       // the line
  d.r(9, LINE_Y - 1, 2, 2, K); d.px(9 * P + 5, (LINE_Y - 1) * P + 5, 2, 2, W);  // the pulley
  d.px(9 * P + 1, (LINE_Y + 1) * P, 2, (-11 - LINE_Y - 1) * P, K);              // its cord to the pulper's hand
  // The paddle: on the hand's circle, the pulper's four poses, or stood by.
  let px = 21, dir = 0, held = false;
  if (hand) { px = Math.max(15, Math.min(21, Math.round(PADDLE_MID + PADDLE_REACH * Math.cos(h.ang)))); dir = -Math.sin(h.ang) * h.w >= 0 ? 1 : -1; held = true; }
  else if (work && pu.st === 'stir') { const k = Math.floor(t / STIR_T) % 4; px = PADDLE_X[k]; dir = k < 2 ? 1 : -1; held = true; }
  if (held) {
    crest(d, px, dir);
    if (pu.st === 'stir') d.px(9 * P, -12 * P + 1, (px - 9) * P + 3, 4, K);
    else d.px((px - 1) * P + 2, -12 * P + 1, 2 * P, 4, K);
    d.px(px * P, -12 * P + 1, 4, 7 * P, K); d.r(px - 0.5, -5, 2, 3, K);
  } else { d.px(22 * P, -12 * P + 1, 4, 7 * P, K); d.r(21.5, -5, 2, 3, K); d.px(21 * P + 2, -12 * P + 1, 2 * P, 4, K); }
  const mt = MOULD_REST - pu.k, front = pu.st === 'lift' || pu.st === 'hang';
  for (const q of L.sheets) {
    const dry = q === lo.target && lo.st === 'unpeg' ? 1 : st.dryOf(q);
    wetSheet(d, q.x, SHEET_TOP, dry, q === lo.target ? 0 : leanOf(q, t, dry)); pegs(d, q.x, SHEET_TOP, q.peg);
  }
  if (front) mould(d, mt, moulds, pu.st === 'lift');
  else { const ex = d.px; d.px = (x, y, w, h, tone) => { const top = Math.min(y + h, SURFACE * P); if (top > y) ex(x, y, w, top - y, tone); }; mould(d, mt, moulds, false); d.px = ex; }
  // The far end: the peel's head and its pole to the loft hand, a dry sheet
  // carried down on it to the stack (the stack is the paper pile, piles.js).
  d.px(G.stackX * P, lo.y, 5 * P, 3, K);
  d.px(G.peelX * P + 1, lo.y, 4, -2 * P - lo.y, K);
  if (lo.carry) d.fade(lo.carry.a, () => wetSheet(d, G.stackX, (lo.y - 3 * P) / P, 1));
  d.body(G.loftX, -3, lo.st === 'up' || lo.st === 'down' ? -1 : 0);
  pulperLean = pu.st === 'lift' ? (pu.k % 2 ? -2 : -4) : pu.st === 'hang' ? -3 : pu.st === 'lower' ? -1 : held ? Math.round((px - 15) / 2) : 0;
}

// --- the workshop: the shed, roof A ------------------------------------------------
// docs/mocks/act3-workshop-2026-10-18, roof A, the clean gable: one even
// stair to a five-cell ridge, the eaves a cell past each wall with a white
// trim under them, and a sign over the door holding four pips, one a nail
// (a ring raised, half filled half in, solid flush). Inside, the joiner on a
// pale stand behind the bench, the blank edge-on with its four nails, and
// the hammer in held poses: up, a smear for the swing, and plumb on the nail
// struck. A finished sign is slid onto the carrier's head and walked out to
// the pile of signs, and a blank fetched back from the blanks.
const NAILS = [9, 12, 15, 18], BOARD = { x: 8, w: 12, row: -6, h: 2 }, JY = -11, REST_X = 12, SHANK = [9, 4, 0];
const SIGNS_X = 27, BLANKS_X = 40, PILE_CAP = 4, CAR = { wait: 25, at: 20 };
const SW_T = 0.06, ST_T = 0.14;
const nailHeadY = (ypx, n) => ypx - SHANK[n] - 3;
function roofA(d) {
  d.r(5, -18, 21, 1, K);
  d.px(5 * P, -17 * P - 2, 21 * P, 2, W);                     // the trim under the eaves
  d.r(7, -19, 17, 1, K); d.r(9, -20, 13, 1, K); d.r(11, -21, 9, 1, K); d.r(13, -22, 5, 1, K);
  d.r(6, -17, 19, 17, K); d.r(8, -16, 15, 16, W);             // walls and the open front
  cut(d, 10, -20, 11, 2);                                     // the sign over the door
}
function pips(d, nails) {
  const cw = 11 * P, gap = 8, pw = 6, x0 = 10 * P + Math.round((cw - (4 * pw + 3 * gap)) / 2), y0 = -20 * P + Math.round((2 * P - pw) / 2);
  nails.forEach((n, i) => {
    const x = x0 + i * (pw + gap);
    d.px(x, y0, pw, pw, K);
    if (n === 0) d.px(x + 1, y0 + 1, pw - 2, pw - 2, W); else if (n === 1) d.px(x + 1, y0 + 1, pw - 2, 2, W);
  });
}
// A board edge-on: two cells deep, its rim, pale face and mid grain.
function wsBoard(d, x, ypx, w = BOARD.w) {
  d.px(x * P, ypx, w * P, BOARD.h * P, K); d.px(x * P + 2, ypx + 2, w * P - 4, BOARD.h * P - 4, PALE);
  d.px(x * P + 2, ypx + 5, w * P - 4, 2, MID);
}
function wsNail(d, col, ypx, n) { const sh = SHANK[n]; if (sh) d.px(col * P + 2, ypx - sh, 2, sh, K); d.px(col * P - 1, ypx - sh - 3, P + 2, 3, K); }
const nailed = (d, x, ypx, nails) => { wsBoard(d, x, ypx); NAILS.forEach((c, i) => wsNail(d, x - BOARD.x + c, ypx, nails[i])); };
function wsHammer(d, pose, bx, hy, by = JY * P) {
  const hand = bx * P;
  if (pose === 'up') { d.px(hand - 4, by, 4, 12, K); d.px(hand - 7, by - 6, 10, 6, K); }
  else if (pose === 'swing') { d.px(hand - 7, by - 6, 10, 6, PALE); d.px(hand - 12, by + 2, 8, 8, PALE); d.px(hand - 6, by + 8, 6, 4, PALE); }
  else { const top = hy - 10; d.px(hand - 2 * P, top, P, 10, K); d.px(hand - P, top + 3, P, 4, K); }
}
// The carrier's walk with a sign, by seconds since it was joined: in from
// its spot to the bench, the board slid onto its head, out to the signs and
// laid on, on to the blanks and one lifted, back, slid onto the bench, home.
// Keyframes [t, carrier x, board x, board row, where the board is].
const CARRY = (() => {
  const k = [], step = 0.06; let t = 0.35, x = CAR.wait;
  const walk = (to, board) => { while (x !== to) { x += Math.sign(to - x); t += step; k.push([t, x, board === 'head' ? x - 4 : null, -5, board]); } };
  k.push([0, x, BOARD.x, BOARD.row, 'bench'], [t, x, BOARD.x, BOARD.row, 'bench']);
  walk(CAR.at, 'bench');
  for (let bx = BOARD.x; bx < x - 4; bx++) { t += step; k.push([t, x, bx + 1, BOARD.row, 'bench']); }
  t += step; k.push([t, x, x - 4, -5, 'head']);
  walk(SIGNS_X + 4, 'head');
  t += step * 3; k.push([t, x, null, null, 'laid']);
  walk(BLANKS_X + 4, null);
  t += step * 3; k.push([t, x, x - 4, -5, 'head']);
  walk(CAR.at, 'head');
  for (let bx = x - 4; bx > BOARD.x; bx--) { t += step; k.push([t, x, bx - 1, BOARD.row, 'bench']); }
  walk(CAR.wait, null);
  return k;
})();
const carryAt = since => CARRY.reduce((a, f) => (f[0] <= since ? f : a), CARRY[0]);
const CARRY_S = CARRY[CARRY.length - 1][0];
function workshop(d, work, t, h, body = false, at = {}) {
  const nails = h ? h.nails : [0, 0, 0, 0];
  roofA(d);
  pips(d, nails);
  d.r(9, -8, 14, 8, W);                                       // the stand, paper and edgeless, read by its pale slats
  for (const y of [-7, -5, -3]) d.px(9 * P + 2, y * P + 2, 14 * P - 4, 2, PALE);
  d.r(8, -4, 13, 2, K); d.r(9, -2, 2, 2, K); d.r(17, -2, 2, 2, K);   // the bench
  // The carrier, while it walks a sign out: the board where it has it.
  const joined = signsJoined(), last = joined.length ? joined[joined.length - 1] : -1e9, since = t - last;
  const f = since >= 0 && since < CARRY_S ? carryAt(since) : null;
  if (!f || f[4] === 'bench' && f[2] === BOARD.x) nailed(d, BOARD.x, BOARD.row * P, f && since > 0.35 && f[0] < CARRY_S / 2 ? [2, 2, 2, 2] : nails);
  else if (f[4] === 'bench') nailed(d, f[2], BOARD.row * P, f[0] < CARRY_S / 2 ? [2, 2, 2, 2] : [0, 0, 0, 0]);
  // The hammer, on the nail last struck.
  const k = h && h.hit != null ? h.hit : null, s2 = h ? t - h.strike : 9;
  const jx = k != null && s2 < 2 ? NAILS[k] + 2 : REST_X;
  const pose = k != null && s2 < SW_T ? 'swing' : k != null && s2 < SW_T + ST_T ? 'strike' : 'up';
  wsHammer(d, pose, jx + 1, pose === 'strike' ? nailHeadY(BOARD.row * P, nails[k] || 2) : 0);
  if (pose === 'strike') d.fade(1 - (s2 - SW_T) / ST_T, () => { const c = NAILS[k], hy = nailHeadY(BOARD.row * P, nails[k] || 2); d.px(c * P - 5, hy - 4, 3, 2, K); d.px(c * P - 4, hy - 9, 2, 3, K); d.px(c * P + P + 2, hy - 4, 3, 2, K); });
  wsLastJx = jx;
  // The carrier and what it carries, over the walls once it is outside.
  const cx = f ? f[1] : CAR.wait;
  d.body(cx, -3);
  if (f && f[4] === 'head') nailed(d, f[2], f[3] * P, f[0] < CARRY_S / 2 ? [2, 2, 2, 2] : [0, 0, 0, 0]);
  // The blanks, as many as there is timber for, edge-on.
  const blanks = Math.min(PILE_CAP, at.blanks || 0);
  for (let i = 0; i < blanks; i++) wsBoard(d, BLANKS_X, (-2 - 2 * i) * P);
}
let wsLastJx = REST_X;

// --- the press: a screw and a platen in a frame -----------------------------------
// The platen, the screw, the bar and its handle all ride one number, the drop
// in whole cells: the bar comes down and the platen comes down with it.
const PR = { postL: 10, postR: 22, headY: -14, scX: 15, scW: 3, plX: 12, plW: 9, sheetY: -4, bodyX: 26 };
const PR_SEQ = [0, 0, 1, 2, 2, 2, 1, 0], PRESS_T = 2.8;
const prDrop = (work, t) => (work ? PR_SEQ[Math.floor(cyc(t, PRESS_T).ph * 8)] : 0);
function press(d, work, t, h) {
  const drop = h && h.k > 0.01 ? Math.round(h.k * 2) : prDrop(work, t);
  d.r(PR.postL, -3, PR.postR - PR.postL + 1, 2, K);                 // the bed,
  d.r(PR.plX, PR.sheetY, PR.plW, 1, K); d.px(PR.plX * P + 2, PR.sheetY * P + 2, PR.plW * P - 4, P - 4, W);   // the sheet on it
  const plY = -8 + drop, scTop = plY - 10;
  d.r(PR.scX, scTop, PR.scW, 10, K);                                // the screw, its threads a white slant every cell and a half
  for (let j = 1; j < 9; j += 1.5) {
    const y0 = (scTop + j) * P;
    for (let i = 2; i < PR.scW * P - 2; i++) d.px(PR.scX * P + i, Math.round(y0 - i / 3), 1, 2, W);
  }
  d.r(PR.scX - 1, scTop - 1, PR.scW + 2, 1, K);                     // its cap
  d.r(PR.postL, PR.headY, 1, -3 - PR.headY, K); d.r(PR.postR, PR.headY, 1, -3 - PR.headY, K);
  d.r(PR.postL - 1, -1, 2, 1, K); d.r(PR.postR, -1, 2, 1, K);
  d.r(PR.postL - 1, PR.headY, PR.postR - PR.postL + 3, 2, K);       // the head
  d.r(PR.plX, plY, PR.plW, 2, K);                                   // the platen, wide and two deep
  // The bar through the screw out past the post, a white key where it
  // crosses the post; the handle down from its end to a knob at the hand.
  const barY = plY - 3, bx0 = PR.scX - 1, bx1 = PR.bodyX;
  d.px(PR.postR * P - 2, barY * P - 2, P + 4, P + 4, W);
  d.r(bx0, barY, bx1 - bx0, 1, K);
  const knobY = drop === 2 ? -4 : -5;
  d.line(bx1 - 1.25, barY + 1, bx1 - 1.25, knobY, 3, K, false);
  d.r(bx1 - 2, knobY, 2, 2, K);
  d.r(PR.bodyX, -1, 3, 1, K);                                       // the step
}

// --- the construction shack: B's cut-out with C's mallet --------------------------
// One black mass, a lid a cell proud each side, the mallet cut white out of
// the front (a head ten cells wide, four tall, its corners cut a cell, on a
// two-by-three handle), the four-cell way in on the handle's axis. A
// cut-out: nothing on it moves.
const SHACK = [
  '##############',
  ' ############ ',
  ' ###......### ',
  ' #..........# ',
  ' #..........# ',
  ' ##........## ',
  ' #####..##### ',
  ' #####..##### ',
  ' #####..##### ',
  ' ############ ',
  ' ####....#### ',
  ' ####....#### ',
  ' ####....#### ',
  ' ####....#### '
];
function shack(d) {
  SHACK.forEach((row, j) => [...row].forEach((ch, i) => {
    if (ch === '#') d.c(i, j - SHACK.length, K); else if (ch === '.') d.c(i, j - SHACK.length, W);
  }));
}

// --- the forestry shack: the grove's, in front of its trees ---------------------------
// A log cabin (the owner's pick of two, 2026-10-20): a stepped gable over
// walls of laid logs, a door and a window. '#' ink, 'm' mid, '.' paper, ' '
// open, sixteen cells by thirteen, its box's left edge eight cells into its
// ground (after/art.js), the logs' pile on its grove side. A cut-out: nothing
// on it moves.
const FORESTRY = [
  '       ##       ',
  '     ######     ',
  '   ##########   ',
  ' ############## ',
  '################',
  ' #mmmmmmmmmmmm# ',
  ' #............# ',
  ' #mmm####mmmmm# ',
  ' #...#..#.###.# ',
  ' #mmm#..#m#.#m# ',
  ' #...#..#.###.# ',
  ' #mmm#..#mmmmm# ',
  ' #####..####### ',
];
const FOREST_X = 8;
function forestry(d) {
  const rows = FORESTRY;
  rows.forEach((row, j) => [...row].forEach((ch, i) => {
    const tone = ch === '#' ? K : ch === 'm' ? MID : ch === '.' ? W : null;
    if (tone != null) d.c(FOREST_X + i, j - rows.length, tone);
  }));
}

export const DRAW = { mill, chipper, papermill, workshop, press, shack, forestry };

// Each station's paper backing (kit.js, `silhouette`), read off its idle
// drawing once: the moving parts swing inside it, and what they carry is
// solid ink of its own.
const BACKS = {};
export const backOf = key => BACKS[key] || (BACKS[key] = silhouette(d => DRAW[key](d, false, 0, null)));

// Where the worker at a working station stands and how, in its frame's
// cells: its left column and top row, a lean in px, and whether it squats.
// Idle, it stands at the same spot unleaning.
export function workerPose(key, work, t) {
  if (key === 'mill') return { x: MILL.body, y: -3, dx: 0 };
  if (key === 'chipper') return { x: CH.body - 1, y: -3, dx: 0 };
  if (key === 'papermill') return { x: 6, y: -12, dx: pulperLean * 2 };
  if (key === 'workshop') return { x: wsLastJx - 1, y: JY, dx: 0 };
  if (key === 'press') return { x: PR.bodyX, y: -4, dx: 0, squat: prDrop(work, t) === 2 };
  return null;
}

// The glyphs over each station while it works (placeholders, the mocks':
// nobody has drawn them yet), eight by eight.
export const GLYPHS = {
  grove:     ['...##...', '..####..', '.######.', '.######.', '..####..', '...##...', '...##...', '..####..'],
  mill:      ['..#..#..', '.######.', '########', '###..###', '###..###', '########', '.######.', '..#..#..'],
  chipper:   ['########', '#......#', '.#....#.', '..#..#..', '..####..', '..####..', '..#..#..', '..#..#..'],
  papermill: ['........', '#......#', '#......#', '#.####.#', '########', '########', '.######.', '.#....#.'],
  workshop:  ['########', '#......#', '#.####.#', '#......#', '########', '...##...', '...##...', '...##...'],
  press:     ['########', '.#....#.', '.#.##.#.', '.#.##.#.', '.#.##.#.', '.######.', '.#....#.', '########']
};
