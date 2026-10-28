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
// it instead: the hammer on the nail it struck. The saw mill is drawn off
// its machine (after/mill.js) alone, whoever turns it.

import { P, GREY, AFTER_SAW_TEETH, AFTER_ART_SCALE, AFTER_MILL, AFTER_SPILL_S } from '../../config.js';
import { K, W, PALE, MID, DUST, hash, silhouette } from './kit.js';
import { held } from '../../reset.js';
import { ctx } from '../ctx.js';
import { goodBlock } from './piles.js';
import { wheelAngle, millView, sawyerPose } from '../../after/mill.js';
import { at } from '../../grid.js';

// White cut out of a mass a cell or more, 2 px in from its edge.
const cut = (d, x, y, w, h, tone = W) => d.px(x * P + 2, y * P + 2, w * P - 4, h * P - 4, tone);

// --- the saw mill: a log followed through the machine -----------------------------
// The voted mock (branch mock-log-split): a closed frame, its blade longer
// than the opening so its ends ride inside the head and the bed; a rocker
// beam on a post over the head, its short end on the crosshead and its long
// end on a rod off the flywheel's crank, so each turn of the wheel is a
// stroke; the sawyer walking the wheel at its foot. Bars a cell thick, pins
// a two-cell square round a cell of paper, and every moving part laid at its
// true position. The numbers are the machine's (config, AFTER_MILL), the sim
// and the drawing reading the one table.
const MW = AFTER_MILL.wheel, FR = AFTER_MILL.frame, BM = AFTER_MILL.beam;
const { L, R, head, bed, bx } = FR, LEGS = bed + FR.bedRows;
const LOG = 4, PL = 2, S1 = P * AFTER_ART_SCALE;
const clampN = (v, a, b) => Math.max(a, Math.min(b, v));
// The treadwheel: its post and foot, its rim two cells deep, four spokes
// and the hub; no handle, the sawyer's walking inside turns it.
function flywheel(d, a) {
  const { cx, cy, r } = MW;
  d.px(cx * P - 3, cy * P, 6, -cy * P, K); d.r(cx - 3, -1, 6, 1, K);       // its post and foot
  for (let y = Math.floor(cy - r - 2); y <= cy + r + 2; y++) for (let x = Math.floor(cx - r - 2); x <= cx + r + 2; x++) {
    const dd = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
    if (dd > r - 1 && dd <= r + 1) d.c(x, y, K);
  }
  for (let k = 0; k < 4; k++) { const q = a + Math.PI / 4 + k * Math.PI / 2; d.line(cx, cy, cx + Math.cos(q) * (r - 0.5), cy + Math.sin(q) * (r - 0.5), 5); }
  d.r(cx - 1.5, cy - 1.5, 3, 3, K);
}
// A pin: two cells of ink round one of paper, centered on the joint.
const eye = (d, x, y) => { d.px(x * P - P, y * P - P, 2 * P, 2 * P, K); d.px(x * P - P / 2, y * P - P / 2, P, P, W); };
// A bar a cell thick in a paper rim, laid at its true position.
const bar = (d, x0, y0, x1, y1) => { d.line(x0, y0, x1, y1, P + 4, W); d.line(x0, y0, x1, y1, P, K); };
// The rocker at wheel angle `a`: the crank pin, the beam's long end `q` on the
// rod and its short end `end` on the crosshead. The rod keeps the length it
// has with the beam level and the pin at the hub, so the beam takes the
// angle that puts `q` that far from the pin: of the two that do, the one
// nearest level, so it never flips.
const PV = { x: BM.x, y: BM.y }, ROD = Math.hypot(PV.x - BM.long - MW.cx, PV.y - MW.cy);
function rocker(a) {
  const pin = { x: MW.cx + Math.cos(a) * MW.crank, y: MW.cy + Math.sin(a) * MW.crank };
  const Dx = PV.x - pin.x, Dy = PV.y - pin.y, Dl = Math.hypot(Dx, Dy);
  const c = clampN((Dl * Dl + BM.long * BM.long - ROD * ROD) / (2 * BM.long * Dl), -1, 1), phi = Math.atan2(Dy, Dx);
  const wrap = t => Math.atan2(Math.sin(t), Math.cos(t)), t1 = wrap(phi + Math.acos(c)), t2 = wrap(phi - Math.acos(c));
  const th = Math.abs(t1) < Math.abs(t2) ? t1 : t2;
  return { pin, q: { x: PV.x - Math.cos(th) * BM.long, y: PV.y - Math.sin(th) * BM.long }, end: { x: PV.x + Math.cos(th) * BM.short, y: PV.y + Math.sin(th) * BM.short } };
}
// The beam's short end's travel over a whole turn, read off the linkage once:
// the blade's stroke is laid over it, so the teeth move as far as the beam does.
const TRAVEL = (() => { let lo = Infinity, hi = -Infinity; for (let k = 0; k < 256; k++) { const y = rocker(k / 256 * 2 * Math.PI).end.y; lo = Math.min(lo, y); hi = Math.max(hi, y); } return { lo, hi }; })();
const strokeOf = lk => (lk.end.y - TRAVEL.lo) / (TRAVEL.hi - TRAVEL.lo) * BM.stroke;
// The blade, plumb: its spine of ink and a grey plate through the opening,
// the rip teeth facing the log riding the stroke `o` (rows, at its true
// position), every other row a tooth.
function millBlade(d, x, y0, y1, o) {
  for (let y = y0; y <= y1; y++) { d.c(x, y, PALE); d.c(x + 1, y, K); }
  const per = AFTER_SAW_TEETH.length, g = P / AFTER_ART_SCALE;
  for (let k = -per; k <= y1 - y0 + per; k += per) for (let q = 0; q < per; q++) {
    const w = AFTER_SAW_TEETH[q], ty = y0 + k + q + (o % per);
    const a = Math.max(y0, ty), b = Math.min(y1 + 1, ty + 1);
    if (w && b > a) d.px(x * P - w * g, a * P, w * g, (b - a) * P, K);
  }
}
// A block of one good laid at a point of the frame (its top left, cells),
// on whole pixels at its true position.
function blockOn(d, x, y, kind) { const p = d.world(x, y); goodBlock(Math.round(p.x), Math.round(p.y), kind); }
// A good's block cut short, `w` cells of its width: the log in the blade,
// the timber block growing out of it.
function partBlock(d, x, y, w, z, tone, seam) {
  if (w <= 0) return;
  const p = d.world(x, y), X = Math.round(p.x), Y = Math.round(p.y), pw = Math.round(w * S1), pz = z * S1;
  ctx.fillStyle = GREY[seam]; ctx.fillRect(X, Y, pw, pz);
  ctx.fillStyle = GREY[tone]; ctx.fillRect(X, Y, pw - 1, pz - 1);
}
// The burst of chips off the kerf at a stroke's foot, thrown either side and
// falling, gone in AFTER_MILL.chips_s.
function chips(d, age, seed) {
  const life = AFTER_MILL.chips_s;
  if (age < 0 || age > life) return;
  d.fade(1 - age / life, () => {
    for (let i = 0; i < 14; i++) {
      const side = i % 2 ? 1 : -1, sp = 6 + hash(seed * 9.1 + i) * 12, up = 9 + hash(seed * 3.7 + i) * 8;
      d.px((bx + 1 + side * (1 + age * sp)) * P, (bed - 3 + (i % 4) * 0.6 - age * up + age * age * 45) * P, P, P, i < 5 ? MID : PALE);
    }
  });
}
// The puff off both ends of a log set down on the bed.
function puff(d, x, age) {
  const k = age / AFTER_MILL.puff;
  if (k < 0 || k >= 1) return;
  d.fade(1 - k, () => { for (const sx of [-1 - k, LOG + k]) d.px((x + sx) * P, (bed - 1 - k) * P, P, P, MID); });
}
// The heap under the bed, a grain a cell where the sand rules have it, each
// grain its own tone of the sawdust's (`v`, set as it lands).
function heapOn(d, b) {
  const x0 = AFTER_MILL.heap.x;
  for (let c = 0; c < b.cols; c++) for (let r = 0; r < b.rows; r++) {
    const v = at(b, c, r);
    if (v) d.c(x0 + c, -1 - r, DUST[(v - 1) % DUST.length]);
  }
}
function mill(d, work, t, h, body = false) {
  const live = !d.sinking && millView();
  const a = live ? wheelAngle() : Math.PI / 2, lk = rocker(a), o = strokeOf(lk);
  flywheel(d, a);
  // the crank arm off the hub, the rod up to the beam's long end, the beam
  // on its post off the head
  d.line(MW.cx, MW.cy, lk.pin.x, lk.pin.y, P, K);
  bar(d, lk.pin.x, lk.pin.y, lk.q.x, lk.q.y);
  d.r(PV.x - 0.5, PV.y, 1, head - PV.y, K);
  bar(d, lk.q.x, lk.q.y, lk.end.x, lk.end.y);
  eye(d, PV.x, PV.y); eye(d, lk.q.x, lk.q.y); eye(d, lk.pin.x, lk.pin.y);
  d.r(L, head, 2, bed - head, K); d.r(R, head, 2, bed - head, K);         // posts
  d.r(L - 1, head, R - L + 4, 3, K);                                      // the head
  d.r(L - 1, bed, FR.end - L + 1, FR.bedRows, K);                         // the bed, plain black
  d.r(bx, bed, 1, FR.bedRows, W);                                         // the kerf's slot under the blade
  d.r(L, LEGS, 2, -1 - LEGS, K); d.r(R, LEGS, 2, -1 - LEGS, K);           // its legs
  d.r(L - 1, -1, 3, 1, K); d.r(R, -1, 3, 1, K);
  // the chute off the bed's end, a cell thick under the blocks' feet
  const C = AFTER_MILL.chute, sl = (C.y1 - C.y0) / (C.x1 - C.x0);
  d.line(C.x0, C.y0 + 0.5, C.x1 + 1, C.y1 + sl + 0.5, P, K);
  // the heap's whole room is the mill's, for its backing and footprint
  if (d.sinking) { const H = AFTER_MILL.heap; d.r(H.x, -H.rows, H.cols, H.rows, K); }
  if (live) {
    heapOn(d, live.heap);
    // a tip's grains dropping out through the hatch, gone under the floor
    for (const s of live.spills) d.fade(1 - s.age / AFTER_SPILL_S, () => d.px(s.c * P, (-1 - s.r + 0.5 * AFTER_MILL.fall * s.age * s.age) * P, P, P, MID));
    // the log on the bed: up to the blade it lies whole; in it, it is eaten
    // from its right end and the block it is becoming grows past the blade
    if (live.log) {
      const lg = live.log;
      partBlock(d, lg.x, bed - LOG, Math.min(lg.x + LOG, bx) - lg.x, LOG, MID, K);
      partBlock(d, bx + 2, bed - PL, PL * live.grow, PL, PALE, MID);
    }
    for (const b of live.out) blockOn(d, b.x - PL / 2, b.y - PL, 'plank');
    for (const g of live.dust) d.px(g.x * P, g.y * P, P, P, MID);
    if (live.hitAt != null) chips(d, t - live.hitAt, Math.floor(live.hitAt * 7));
    if (live.setAt != null) puff(d, AFTER_MILL.seat.x, t - live.setAt);
  }
  millBlade(d, bx, head + 3, bed - 1, o);
  // the crosshead on the beam's short end, its strap down into the head
  const top = lk.end.y;
  d.r(bx, top + 2, 2, Math.max(0, head - top - 2), K);
  d.r(bx - 3, top, 6, 2, K);
  eye(d, lk.end.x, lk.end.y);
  // the sawyer's feet on the wheel's rim as it walks, and the log in its
  // hands on its way to the bed
  const pose = live && body ? sawyerPose() : null;
  if (pose && pose.wheel) { const fx = Math.floor(pose.x) + (pose.step ? 0 : 1); d.r(fx, -4, 1, 1, K); d.r(fx + 2, -4, 1, 1, K); }
  if (pose && pose.log) blockOn(d, pose.log.x, pose.log.y, 'log');
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

// Each station's paper backing (kit.js, `silhouette`), read off its idle
// drawing once: the moving parts swing inside it, and what they carry is
// solid ink of its own.
const BACKS = {};
export const backOf = key => BACKS[key] || (BACKS[key] = silhouette(d => DRAW[key](d, false, 0, null)));

// Where the worker at a working station stands and how, in its frame's
// cells: its left column and top row, a lean in px, and whether it squats.
// Idle, it stands at the same spot unleaning. The sawyer is wherever its
// machine has it (after/mill.js, `sawyerPose`): stepping in the wheel, or out
// fetching a log to the bed, at its true position.
export function workerPose(key, work, t) {
  if (key === 'mill') { const p = sawyerPose(); return p && { x: p.x, y: p.y, dx: 0 }; }
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
