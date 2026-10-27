// The camp's stations: the saw mill and the workshop as voted in the second
// redesign (docs/mocks/act3-stations-r2-2026-10-18: the frame saw, the shed),
// matched to the press (docs/mocks/act3-stations-2026-10-18,
// polish-workshop-press.html, the press since cut), the construction shack
// (docs/mocks/act3-place-2026-10-18/shack.html) and the forestry shack. Each
// holds to what made the press read: a closed outline, one moving part the
// eye follows, white cut out of black rather than outlines, level and plumb
// edges (one rod may slant), the body joined to the part, and the product in
// view. Each is drawn on its own frame (kit.js) in the mock's own cells, so
// the numbers below are the mock's: the frame's ground is the mock's `G`.
//
// A station draws its idle pose, or with `work` its working pose at time
// `t`; the worker's body is not drawn here but by the members' layer at the
// pose `workerPose` gives, so the one body standing at the door is the one
// doing the work. With the hand on it (`h`, the station's record in
// after/gestures.js, `gestureView`) the moving part goes where the hand put
// it instead: the wheel at the angle it was spun to and the blade at the
// stroke that angle gives, the hammer on the nail it struck. Every pose is
// held: a part moves a whole step at a time.
const TURN = Math.PI / 16;                                 // a held step of a turning part
const turning = h => !!h && (h.grab || Math.abs(h.w || 0) > 0.05);

import { P, GESTURE_WHEEL_LOG, AFTER_SAW_TEETH, AFTER_ART_SCALE } from '../../config.js';
import { K, W, PALE, MID, hash, silhouette } from './kit.js';
import { stationX0, groundOf } from '../../after/place.js';
import { splitLog, biteOf, linkage, drawRod, drawHead, cellLine } from './splitmock.js';   // MOCK
import { held } from '../../reset.js';

// `posed` is the pose each station drew its hand-worked part in this frame,
// which the ghost of its motion takes hold of (`grips`, render/aftercues.js).
const posed = {};

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
const BARK = [MID, MID, PALE, MID], WOOD = [PALE, W, PALE, PALE];
// The teeth's reach out of the blade, in the drawing's cells: the log's kerf.
const BITE = Math.ceil(Math.max(...AFTER_SAW_TEETH) / AFTER_ART_SCALE);
// The wheel at angle `a`.
const wheelAt = a => { const { cx, cy } = MW; return { kx: cx + Math.cos(a) * KNOB, ky: cy + Math.sin(a) * KNOB, pin: { x: cx + Math.cos(a) * CRANK, y: cy + Math.sin(a) * CRANK } }; };
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
}
const crankPin = (d, pin) => { d.px(Math.round(pin.x * P) - 3, Math.round(pin.y * P) - 3, 6, 6, K); d.px(Math.round(pin.x * P) - 1, Math.round(pin.y * P) - 1, 2, 2, W); };
// The blade, plumb: its spine of ink, a grey plate, the rip teeth facing the
// log, riding the stroke so they move with it. The teeth are laid on the
// world's grid, a grid cell a row (config, AFTER_SAW_TEETH): `per` rows to a
// drawing cell, each `g` of the drawing's px, so they stay as fine as the
// grid allows at any scale of the art.
function millBlade(d, x, y0, y1, o) {
  const per = AFTER_ART_SCALE, g = P / per, n = AFTER_SAW_TEETH.length;
  for (let y = y0; y <= y1; y++) {
    d.c(x, y, PALE); d.c(x + 1, y, K);
    for (let q = 0; q < per; q++) {
      const k = AFTER_SAW_TEETH[(((per * (y - o) + q) % n) + n) % n];
      if (k) d.px(x * P - k * g, y * P + q * g, k * g, g, K);
    }
  }
}
// The log: grey bark in an ink rim, its grain cut white; open kerf where the
// teeth stand in it, and two pale planks past the blade.
function millLog(d, x, y, bx) {
  for (let i = 0; i < MILL.logLen; i++) {
    const c = x + i;
    if (c >= bx - BITE && c < bx + 2) { if (c < bx) d.r(c, y, 1, 3, W); continue; }
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
  const sp = globalThis.__splitStyle, mb = sp && sp[0] === 'C' && !hand && work ? biteOf(cyc(t, SAW_T).ph, sp) : null;   // MOCK: the bite drives the wheel
  const a = mb ? mb.a : hand ? Math.round(h.ang / MILL_TURN) * MILL_TURN : work ? Math.floor(t / 0.1) * MILL_TURN : 0;
  const { L, R, head, bed, bx } = MILL;
  const lk = mb && sp.length === 2 && 'ABC'.includes(sp[1]) ? linkage(sp, a, MW, head, bx) : null;   // MOCK: the bar, three ways
  const o = lk ? Math.min(3, lk.o) : Math.round(1.5 + 1.5 * Math.sin(a));
  posed.mill = { a };
  const k = wheelAt(a);
  // MOCK: a smear trailing the knob through the down-stroke, fading behind it
  if (mb && mb.smear) for (let s = 1; s <= 3; s++) { const q0 = wheelAt(a - s * MILL_TURN), q1 = wheelAt(a - (s - 1) * MILL_TURN); d.fade(0.75 - s * 0.2, () => cellLine(d, q0.kx, q0.ky, q1.kx, q1.ky, PALE)); }
  flywheel(d, a);
  // The rod, in a paper rim, off the crank pin.
  if (lk) drawRod(d, lk);   // MOCK
  else { d.line(k.pin.x, k.pin.y, bx - 2.5, head - 4 + o, 7, W); d.line(k.pin.x, k.pin.y, bx - 2.5, head - 4 + o, 3); }
  d.r(L, head, 2, bed - head, K); d.r(R, head, 2, bed - head, K);         // posts
  d.r(L - 1, head, R - L + 4, 3, K);                                      // the head
  d.r(L - 1, bed, R - L + 4, 4, K);                                       // the bed, on legs
  d.r(L, -2, 2, 2, K); d.r(R, -2, 2, 2, K); d.r(L - 1, -1, 3, 1, K); d.r(R, -1, 3, 1, K);
  const ly = bed - 3;
  if (globalThis.__splitStyle) splitLog(d, globalThis.__splitStyle, hand ? (h.prog || 0) / GESTURE_WHEEL_LOG * 0.78 : work ? cyc(t, SAW_T).ph : 0, bed, bx, SAW_T);   // MOCK
  else if (hand && (h.prog || 0) > 0) { const lg = millLogAt((h.prog || 0) / GESTURE_WHEEL_LOG * 0.92, 1); millLog(d, lg.x, ly, bx); }
  else if (work) { const c = cyc(t, SAW_T), lg = millLogAt(c.ph, c.since); d.fade(lg.a, () => millLog(d, lg.x, ly, bx)); }
  millBlade(d, bx, head + 3, bed - 1, o);
  if (lk) drawHead(d, lk);   // MOCK
  else {
  d.r(bx, head - 3 + o, 2, 3 - o, K);                                     // its strap up out of the head
  d.r(bx - 3, head - 5 + o, 6, 2, K); d.px((bx) * P - 2, (head - 4 + o) * P - 2, 4, 4, W);   // the crosshead
  crankPin(d, k.pin);
  }
  // A body at the wheel: its arm to its fist round the knob.
  if (body) {
    const fx = Math.round(k.kx * P) - 7, fy = Math.round(k.ky * P) - 7;
    d.line(MILL.body + 3, -2, k.kx, k.ky, 2);
    d.px(fx, fy, 14, 14, K); d.px(fx + 2, fy + 2, 10, 10, W); d.px(fx + 5, fy + 5, 4, 4, K);
  }
}

// --- the workshop: the shed, roof A ------------------------------------------------
// docs/mocks/act3-workshop-2026-10-18, roof A, the clean gable: one even
// stair to a five-cell ridge, the eaves a cell past each wall with a white
// trim under them, and a sign over the door holding four pips, one a nail
// (a ring raised, half filled half in, solid flush). Inside, the joiner on a
// pale stand behind the bench, the blank edge-on with its four nails, and
// the hammer in held poses: up, a smear for the swing, and plumb on the nail
// struck. A finished sign is a good on the rack outside (render/after.js,
// `signRack`), fading on there: no body is posted to walk it out.
const NAILS = [9, 12, 15, 18], BOARD = { x: 8, w: 12, row: -6, h: 2 }, JY = -11, REST_X = 12, SHANK = [9, 4, 0];
const BLANKS_X = 40, PILE_CAP = 4;
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
function workshop(d, work, t, h, body = false, at = {}) {
  const nails = h ? h.nails : [0, 0, 0, 0];
  roofA(d);
  pips(d, nails);
  d.r(9, -8, 14, 8, W);                                       // the stand, paper and edgeless, read by its pale slats
  for (const y of [-7, -5, -3]) d.px(9 * P + 2, y * P + 2, 14 * P - 4, 2, PALE);
  d.r(8, -4, 13, 2, K); d.r(9, -2, 2, 2, K); d.r(17, -2, 2, 2, K);   // the bench
  nailed(d, BOARD.x, BOARD.row * P, nails);                  // the blank on the bench, its nails as driven
  // The hammer, on the nail last struck.
  const k = h && h.hit != null ? h.hit : null, s2 = h ? t - h.strike : 9;
  const jx = k != null && s2 < 2 ? NAILS[k] + 2 : REST_X;
  const pose = k != null && s2 < SW_T ? 'swing' : k != null && s2 < SW_T + ST_T ? 'strike' : 'up';
  wsHammer(d, pose, jx + 1, pose === 'strike' ? nailHeadY(BOARD.row * P, nails[k] || 2) : 0);
  if (pose === 'strike') d.fade(1 - (s2 - SW_T) / ST_T, () => { const c = NAILS[k], hy = nailHeadY(BOARD.row * P, nails[k] || 2); d.px(c * P - 5, hy - 4, 3, 2, K); d.px(c * P - 4, hy - 9, 2, 3, K); d.px(c * P + P + 2, hy - 4, 3, 2, K); });
  wsLastJx = jx;
  // The blanks, as many as there is timber for, edge-on.
  const blanks = Math.min(PILE_CAP, at.blanks || 0);
  for (let i = 0; i < blanks; i++) wsBoard(d, BLANKS_X, (-2 - 2 * i) * P);
}
let wsLastJx = REST_X;   // held: the hammer's column as last drawn
held('after-stations-drawn', () => { wsLastJx = REST_X; });

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

export const DRAW = { mill, workshop, shack, forestry };

// Where the hand takes each hand-worked part, world px, in the pose its
// station drew it in this frame (`posed`), for the ghost of its motion
// (render/aftercues.js): the wheel's hub, its knob and the knob's reach.
export function grips(key) {
  const q = posed[key];
  if (!q) return null;
  const x0 = stationX0(key), fl = groundOf(key), A = AFTER_ART_SCALE, w = (x, y) => ({ x: x0 + x * P * A, y: fl + y * P * A });
  if (key === 'mill') { const k = wheelAt(q.a); return { hub: w(MW.cx, MW.cy), reach: KNOB * P * A, knob: w(k.kx, k.ky) }; }
  return null;
}

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
  if (key === 'workshop') return { x: wsLastJx - 1, y: JY, dx: 0 };
  return null;
}

// The glyphs over each station while it works (placeholders, the mocks':
// nobody has drawn them yet), eight by eight.
export const GLYPHS = {
  grove:     ['...##...', '..####..', '.######.', '.######.', '..####..', '...##...', '...##...', '..####..'],
  mill:      ['..#..#..', '.######.', '########', '###..###', '###..###', '########', '.######.', '..#..#..'],
  workshop:  ['########', '#......#', '#.####.#', '#......#', '########', '...##...', '...##...', '...##...']
};
