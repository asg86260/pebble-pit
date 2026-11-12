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

// REVIEW act-3-the-cabin-built
// MOCK faith8
import { P, AFTER_SAW_TEETH, AFTER_ART_SCALE, AFTER_MILL, AFTER_CABIN_SMOKE, AFTER_SHRINE_MOTES, AFTER_SHRINE_SAUCE, AFTER_SHRINE_FULL, AFTER_SHRINE_FEEL, AFTER_SHRINE_HEART, AFTER_SHRINE_LOOKS, AFTER_COIN_LIFE_S, AFTER_LINE_DARK } from '../../config.js';
import { K, W, PALE, MID, hash, silhouette, backing, clamp01, square } from './kit.js';
import { ART } from '../../after/art.js';
import { CABIN } from '../../after/cabin.js';
import { DOORWAY } from '../../after/doorway.js';
import { held } from '../../reset.js';
import { ctx } from '../ctx.js';
import { ringCells } from '../cellring.js';
import { faith } from '../../after/faith.js';
import { prayerRung, prayerRaise, prayerMult } from '../../after/levels.js';   // REVIEW faith18
import { progressOf } from '../../works.js';
import { withRise } from '../rise.js';
import { S } from '../../state.js';
import { darkPage, raw } from '../../ink.js';
import { coinAt } from '../aftercoins.js';
import { goodBlock, goodColor } from './piles.js';
import { wheelAngle, millView, sawyerPose } from '../../after/mill.js';

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
function blockOn(d, x, y, kind, v) { const p = d.world(x, y); goodBlock(Math.round(p.x), Math.round(p.y), kind, v); }
// A good's block cut short, `w` cells of its width, in its own unit's tone: the
// log in the blade, the timber block growing out of it.
function partBlock(d, x, y, w, z, kind, v) { if (w <= 0) return; const p = d.world(x, y); ctx.fillStyle = goodColor(kind, v); ctx.fillRect(Math.round(p.x), Math.round(p.y), Math.round(w * S1), z * S1); }
// The burst of chips off the cut at a stroke's foot, thrown either side and
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
  d.r(L, LEGS, 2, -1 - LEGS, K); d.r(R, LEGS, 2, -1 - LEGS, K);           // its legs
  d.r(L - 1, -1, 3, 1, K); d.r(R, -1, 3, 1, K);
  // the chute off the bed's end, a cell thick under the blocks' feet
  const C = AFTER_MILL.chute, sl = (C.y1 - C.y0) / (C.x1 - C.x0);
  d.line(C.x0, C.y0 + 0.5, C.x1 + 1, C.y1 + sl + 0.5, P, K);
  if (live) {
    // the log on the bed: up to the blade it lies whole; in it, it is eaten
    // from its right end and the block it is becoming grows past the blade
    if (live.log) {
      const lg = live.log;
      partBlock(d, lg.x, bed - LOG, Math.min(lg.x + LOG, bx) - lg.x, LOG, 'log', lg.v);
      partBlock(d, bx + 2, bed - PL, PL * live.grow, PL, 'plank', lg.pv);
    }
    for (const b of live.out) blockOn(d, b.x - PL / 2, b.y - PL, 'plank', b.v);
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
  if (pose && pose.log) blockOn(d, pose.log.x, pose.log.y, 'log', live.hv);
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
// two-by-three handle), the stations' way in (`wayIn`) on the handle's
// axis, its left column SHACK_WAY. A cut-out: nothing on it moves.
// The way in a station cut from one ink mass is entered by (after/doorway.js),
// its left column `x` in the frame's cells: paper, square-topped, open to the floor.
const wayIn = (d, x) => d.r(x, -DOORWAY.h, DOORWAY.w, DOORWAY.h, W);
const SHACK_WAY = 5;
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
  ' ############ ',
  ' ############ ',
  ' ############ ',
  ' ############ '
];
function shack(d) {
  SHACK.forEach((row, j) => [...row].forEach((ch, i) => {
    if (ch === '#') d.c(i, j - SHACK.length, K); else if (ch === '.') d.c(i, j - SHACK.length, W);
  }));
  wayIn(d, SHACK_WAY);
}

// --- the forestry shack: the grove's, in front of its trees ---------------------------
// The stump house (the owner's pick C, 2026-10-30, "lets drop the small tree
// on top"; its mock render/after/cabinmock.js on branch a3-review-both): a
// giant sawn stump hollowed into a house, one ink mass on a flare of roots,
// its bark's seams and its windows cut out of it in paper, the stations' way
// in for its door (the owner, 2026-10-30: "use the default doorway"), the cut face
// edge-on in the pale with its rings in the mid, a shelf fungus on the bark,
// and a stovepipe whose smoke is the one thing on it that moves. The parts
// are after/cabin.js's, the house's own cells (i across, h up off the floor),
// which the camp's plan takes its box off. The shack's frame is turned
// (after/art.js), as the mock's was, so the stovepipe stands on the grove's
// side.
const CAB_X = ART.forestry.box[0];
function cabinBrush(d) {
  const px = (x, y, w, h, tone) => d.px(x, y, w, h, tone);
  return {
    px, fade: d.fade, sinking: d.sinking,
    box: ([i, h, w, n], tone = K) => px((CAB_X + i) * P, -(h + n) * P, w * P, n * P, tone),
    // paper (or a tone) cut out of the mass, 2 px in from its cells' edges
    cut: ([i, h, w, n], tone = W) => px((CAB_X + i) * P + 2, -(h + n) * P + 2, w * P - 4, n * P - 4, tone)
  };
}
// The stovepipe's smoke (config, AFTER_CABIN_SMOKE): puffs off the cap's top,
// each rising and drifting at its true position, fading in and out and from
// the mid grey to the pale. Not part of the house's ground, so never drawn
// into its silhouette.
function cabinSmoke(b, t) {
  if (b.sinking) return;
  const C = AFTER_CABIN_SMOKE, [ci, ch, cw, cn] = CABIN.cap;
  risePuffs(b, t, C, C.puffs, CAB_X + ci + cw / 2 - C.size / 2, ch + cn);
}
// MOCK faith8
// `n` puffs off (x0, y0), in cells, as the config `C` has them: each rising
// and drifting at its true position, in and out by fading and from the mid
// grey to the pale. `share` of them show, the last one fading in rather than
// appearing; the stump house's smoke is all of them, and the shrine's motes
// the ones its faith has earned.
function risePuffs(b, t, C, n, x0, y0, share = 1) {
  for (let k = 0; k < n; k++) {
    const w = clamp01(share * n - k);
    if (w <= 0) continue;
    const u = C.once ? t / C.life : ((t / C.life + k / n) % 1 + 1) % 1;
    if (u < 0 || u >= 1) continue;
    const ez = C.ease ? ease3 : v => v;
    const a = ez(Math.min(1, u * C.fadeIn)) * ez(1 - u) * C.peak * w;
    const way = C.path ? C.path(u, k, n) : null;
    const x = way ? x0 + way[0] : x0 + (C.spread ? (hash(k * 3.7 + (C.seed || 0)) - 0.5) * C.spread : 0) + u * C.drift + Math.sin(t * C.swayRate + k * C.swayPhase) * C.sway, y = way ? y0 + way[1] : y0 + u * C.rise;
    const f = clamp01((u - C.greyAt) / C.greyFade + 0.5);
    const [t0, t1] = (C.tones || ['mid', 'pale']).map(n => ({ ink: K, mid: MID, pale: PALE })[n]);
    const puff = tone => () => b.px(x * P, -(y + C.size) * P, C.size * P, C.size * P, tone);
    if (f < 1) b.fade(a * (1 - f), puff(t0));
    if (f > 0) b.fade(a * f, puff(t1));
  }
}
function forestry(d, work, t) {
  const b = cabinBrush(d), H = CABIN;
  for (const p of [...H.mass, ...H.fungus, H.pipe, H.cap]) b.box(p);
  for (const [i, h, n] of H.seams) b.cut([i, h, 1, n]);
  b.cut(H.face, PALE);
  const [, fh, , fn] = H.face;
  for (const i of H.rings) b.px((CAB_X + i) * P, -(fh + fn) * P + 2, 2, fn * P - 4, MID);
  wayIn(d, CAB_X + H.door);
  for (const p of [...H.round, H.small]) b.box(p, W);
  b.box([...H.cross, 1, 1]);
  cabinSmoke(b, t || 0);
}

// --- the shrine: a gable with an arch cut in it ---------------------------------------
// MOCK faith8
// One ink mass like the shack and the stump house: a pointed gable on a step,
// a pointed arch cut out of it in paper, a cross on the apex, the faithful
// kneeling either side (the frame's own squat body). Over the cross floats
// the faith ring, the air filter's dial's cell ring (render/cellring.js),
// `fill` of it inked clockwise from the top, each cell fading in as its turn
// comes, with motes off it as the stump house's smoke rises (`risePuffs`).
// `SHRINE.mode` says what more it does, all of it read off the act's clock:
//   fly   prayers rise off the kneelers and arc into the ring's tip, the
//         yard's coin arc (aftercoins.js, `coinAt`); the tip glints as each lands
//   turn  a glint travels the inked arc
//   click the ring full, then emptied: the arc unwinds and the faith streams
//         off the tip to the counter in the corner on the same coin arc,
//         motes bursting outward
// Nothing here pops: everything comes and goes by opacity.
export const SHRINE = { mode: 'fill', fill: 0, folk: 0, t0: 0, pray: null, shake: false, stream: false, feel: null, loop: false };   // MOCK faith13
// MOCK faith12
// The faithful at prayer: the frame's own body (kit.js `body`), whole, never
// squashed or sheared, moved as one piece at its true position, eased.
// `SHRINE.pray` picks the movement and when each follower goes:
//   hop  a small hop as the prayer leaves, still between
// Prayer times are read off the same cycle as the movement, so one beat is both.
const PRAY = {
  hop: { T: 5.4, launch: 0.3, off: k => hash(k * 4.1 + 3) * 5.4 }
};
const FEET_Y = -4;                                    // cells: the body's own row, a cell up out of the ground's dip
// where the whole body is, in px off its rest place: dx toward the shrine, dy down
function folkAt(kind, k, tl) {
  const { T, off } = PRAY[kind], u = (((tl - off(k)) % T) + T) % T;
  const e = u - PRAY.hop.launch;
  return { dx: 0, dy: e > 0 && e < 0.6 ? -P * 1.5 * Math.sin(Math.PI * e / 0.6) : 0 };
}
function folk(d, n) {
  const kind = SHRINE.pray, tl = Math.max(0, (S.after.t || 0) - SHRINE.t0);
  for (let i = 0; i < n; i++) {
    const face = i < n / 2 ? 1 : -1, p = folkAt(kind, i, tl);
    d.body(kneelX(i, n), FEET_Y, p.dx * face, p.dy, false);
  }
}

const SH = { x: 13, w: 19, wall: 12, niche: [3, 15] };
const SA = AFTER_SHRINE_SAUCE;
// A ring two cells thick, laid out once as a mask: the cells whose middle lies
// between `inner` and `outer` cells off the hub.
function makeRing(size, inner, outer) {
  const h = (size - 1) / 2;
  const mask = Array.from({ length: size }, (_, j) =>
    Array.from({ length: size }, (_, i) => (Math.hypot(i - h, j - h) >= inner && Math.hypot(i - h, j - h) <= outer ? '#' : '.')).join(''));
  // clockwise from the top
  const cells = ringCells(mask, -Math.PI / 2, Math.PI * 2).sort((p, q) => p.share - q.share);
  return { mask, cells, size };
}
const RING = makeRing(19, 7.5, 9.6);
const FAITH_AT = { x: 0, gap: 2 };          // the ring's left off the shrine's left, and the cells it floats clear over the look standing
// What is not yet inked is the ink itself, faint: so it reads as the ink's own
// ghost on either page (the ink is the page's light tone in the dark), where a
// fixed pale or mid would vanish on one of them.
const FAITH_GHOST = { track: 0.28, trackDark: 0.1 };   // in the dark the page's ink is its light tone, so the unfilled track goes much fainter to leave the inked arc the brightest thing
const ease3 = k => k * k * (3 - 2 * k);
const easeOut = k => 1 - (1 - k) * (1 - k);

const clickLoop = () => SA.click.hold + SA.click.press + SA.click.unwind + SA.click.empty + SA.click.refill;
// How full the faith is at the scene's time `tl`, 0..1, by mode.
function faithAt(tl) {
  if (SHRINE.mode === 'fill') {
    // REVIEW faith18: each prayer adds the prayer ladder's multiple of faith,
    // so the ring fills that many times faster (after/levels.js, `prayerMult`)
    const rise = (SA.fillRise - SA.fillDrop) / prayerMult(), w = tl % (rise + SA.fillDrop);
    return w < rise ? SA.fillFrom + (SA.fillTo - SA.fillFrom) * w / rise
      : SA.fillTo - (SA.fillTo - SA.fillFrom) * ease3((w - rise) / SA.fillDrop);
  }
  if (SHRINE.mode === 'click') {
    const c = SA.click, w = tl % clickLoop(), t1 = c.hold + c.press, t2 = t1 + c.unwind, t3 = t2 + c.empty;
    if (w < t1) return 1;
    if (w < t2) return 1 - ease3((w - t1) / c.unwind);
    if (w < t3) return 0;
    return ease3((w - t3) / c.refill);
  }
  return SHRINE.mode === 'full' ? 1 : SHRINE.fill;
}

// The ring: its track, then the inked share (`f`), each cell fading in by
// the fraction of it the fill has reached, so the tip advances smoothly.
function ringAt(d, R, rx, ry, f, solid) {
  d.fade(darkPage ? FAITH_GHOST.trackDark : FAITH_GHOST.track, () => { for (const { i, j } of R.cells) d.c(rx + i, ry + j, K); });
  R.cells.forEach(({ i, j }, k) => {
    const w = solid ? 1 : ease3(clamp01(f * R.cells.length - k));
    if (w > 0) d.fade(w, () => d.c(rx + i, ry + j, darkPage ? raw(AFTER_LINE_DARK) : K));
  });
}
const cellWorld = (d, rx, ry, c) => ({ x: d.ox + (rx + c.i + 0.5) * P, y: d.oy + (ry + c.j + 0.5) * P });
const tipIndex = f => Math.min(RING.cells.length - 1, Math.max(0, Math.floor(f * RING.cells.length)));
const kneelX = (i, n) => { const left = i < n / 2, j = left ? i : i - Math.ceil(n / 2); return left ? 1 + j * 4 : SH.x + SH.w + 3 + j * 4; };
// A prayer: the yard's coin arc (aftercoins.js, `coinAt`) from a kneeler to
// the ring's tip, at its true position, with a short trail fading behind it;
// at the tip it is taken in, or at full it is turned away outward and fades.
function prayer(d, rx, ry, ts, tl, from, tip, bounce) {
  const life = AFTER_COIN_LIFE_S, s = tl - ts, m = { v: 1, x0: from.x, y0: from.y, tx: tip.x, ty: tip.y, at: ts };
  const hub = { x: d.ox + (rx + 9.5) * P, y: d.oy + (ry + 9.5) * P };
  const at = q => {
    const e = q - ts;
    if (e < 0) return null;
    if (e < life) { const c = coinAt(m, q); return c && { x: c.x, y: c.y, a: ease3(clamp01(e / 0.5)) * (bounce ? 1 : ease3(clamp01((life - e) / 0.35))) }; }
    if (!bounce || e >= life + SA.bounce.s) return null;
    const u = (e - life) / SA.bounce.s, dx = tip.x - hub.x, dy = tip.y - hub.y, len = Math.hypot(dx, dy) || 1;
    return { x: tip.x + dx / len * SA.bounce.r * P * easeOut(u), y: tip.y + dy / len * SA.bounce.r * P * easeOut(u), a: 1 - ease3(u) };
  };
  SA.trail.forEach((lag, i) => {
    const q = at(tl - lag);
    if (q) d.fade(q.a * 0.5 / (i + 1), () => d.px(q.x - d.ox - P * (1 - 0.2 * i), q.y - d.oy - P * (1 - 0.2 * i), P * (2 - 0.4 * i), P * (2 - 0.4 * i), K));
  });
  const q = at(tl);
  if (q) d.fade(q.a, () => d.px(q.x - d.ox - P, q.y - d.oy - P, P * 2, P * 2, K));
  return s;
}
// The glint a landing leaves on the tip cell: a plus two cells an arm, its
// arms fainter outward, easing in and out over `glintS`.
function glint(d, rx, ry, c, g) {
  const a = ease3(clamp01(g / 0.3)) * ease3(clamp01((1 - g) / 0.7));
  d.fade(a, () => d.c(rx + c.i, ry + c.j, K));
  for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
    d.fade(a * 0.8, () => d.c(rx + c.i + dx, ry + c.j + dy, K));
    d.fade(a * 0.4, () => d.c(rx + c.i + dx * 2, ry + c.j + dy * 2, K));
  }
}

// MOCK faith14
// What the full ring is doing at the scene's time `tl` in feel `name`: its
// tremor off rest in cells (tx, ty), its scale, and the bursts of motes
// begun (the start time of each, with its size). Smooth sums of sines under
// an envelope, never a pose.
function feelAt(name, tl, gate) {
  if (AFTER_SHRINE_HEART[name]) return heartAt(AFTER_SHRINE_HEART[name], tl, gate);
  const F = AFTER_SHRINE_FEEL, E = F[name], ph = tl % E.every, m = Math.floor(tl / E.every);
  let env = E.base * gate, pulse = 0;
  const bursts = [];
  for (const b of E.beats) {
    const up = clamp01((ph - (b.at - b.rise)) / b.rise), down = clamp01((b.at + b.fall - ph) / b.fall);
    const e = ph < b.at ? Math.pow(up, b.curve) : ease3(down);
    env = Math.max(env, e * b.amp * gate);
    pulse = Math.max(pulse, ease3(clamp01(1 - Math.abs(ph - b.at) / (F.win / 2))) * b.pulse * gate);
    bursts.push({ tb: ph - b.at, seed: m * 7 + b.at * 13, n: b.shed });
  }
  const w = tl * Math.PI * 2;
  return { tx: env * Math.sin(w * F.hz[0]), ty: env * F.ySeen * Math.sin(w * F.hz[1] + 1), sc: 1 + pulse, bursts };
}
// MOCK faith15
// The heartbeat (config, AFTER_SHRINE_HEART): the same shape as `feelAt`'s, but
// the tremor, swell and motes all follow each beat's own envelope, a quick
// rise and a slower ease back, and a beat strays from the mean by a seeded hash.
function heartAt(E, tl, gate) {
  const V = E.vary, cyc = m => E.every * (1 + (E.breathe ? E.breathe * Math.sin(Math.PI * 2 * m / E.breatheEvery) : 0));
  let start = 0, m = 0;
  while (start + cyc(m) <= tl) { start += cyc(m); m++; }
  const ph = tl - start, str = (c, bi) => 1 + (hash(c * 3.1 + bi * 7.7 + 1) - 0.5) * 2 * V.str;
  let tx = 0, ty = 0, pulse = 0;
  E.beats.forEach((b, bi) => {
    const up = clamp01((ph - (b.at - b.rise)) / b.rise), down = clamp01((b.at + b.fall - ph) / b.fall);
    const e = ph < b.at ? ease3(up) : Math.pow(down, 1.6), s = str(m, bi) * gate, w = Math.PI * 2 * (ph - (b.at - b.rise));
    tx += e * b.amp * s * E.tremorScale * Math.sin(w * E.hz[0]);
    ty += e * b.amp * s * E.tremorScale * E.ySeen * Math.sin(w * E.hz[1] + 1);
    pulse = Math.max(pulse, e * b.pulse * s * E.pulseScale);
  });
  const bursts = [];
  for (const c of m > 0 ? [m, m - 1] : [m]) {
    const cs = c === m ? start : start - cyc(c);
    E.beats.forEach((b, bi) => bursts.push({ tb: tl - cs - b.at, seed: c * 7 + bi * 13, n: Math.round(b.shed * (1 + (hash(c * 5.3 + bi * 2.9 + 2) - 0.5) * 2 * V.shed)), vary: V }));
  }
  return { tx, ty, sc: 1 + pulse, bursts, B: E.burst };
}
// the spawn of a mote off a ring cell: the cell, then outward from the hub and a little up
function offRing(life, seed, out, up, pad = 0, V = null) {
  return (u, k, n) => {
    const c = RING.cells[Math.floor(hash(k * 5.1 + seed) * RING.cells.length)], hx = c.i - 9, hy = 9 - c.j, len = Math.hypot(hx, hy) || 1, e = easeOut(u);
    // MOCK faith15: each mote its own speed, heading and lift, by hash
    const r = q => (hash(k * q + seed + 9) - 0.5) * 2, sp = V ? 1 + r(2.3) * V.speed : 1, an = V ? r(4.7) * V.ang : 0, ul = V ? 1 + r(6.1) * V.up : 1;
    const ux = hx / len, uy = hy / len, dx = ux * Math.cos(an) - uy * Math.sin(an), dy = ux * Math.sin(an) + uy * Math.cos(an);
    return [hx + dx * out * sp * e, hy + dy * out * sp * e + up * ul * u + pad];
  };
}
// REVIEW faith18
// The shrine's looks by prayer rung, a function each of (r, run), cells off
// the shrine's left and the floor: `r(x, y, w, h, tone)` a rect, `run(y, a, b,
// tone)` a row from cell a to b. Flat squares, ink and paper: a wayside cross
// on a step, an altar with its cross, a chapel, the chapel with a bell tower,
// the church.
const cross = (r, x, top, h, barAt) => { r(x, top, 1, h); r(x - 1, top + barAt, 3, 1); };
const LOOKS = [
  // a wayside cross on a step
  (r, run) => { run(-1, 7, 11); run(-2, 8, 10); cross(r, 9, -11, 9, 2); },
  // a small altar with its cross
  (r, run) => { run(-1, 4, 14); run(-2, 5, 13); r(6, -7, 7, 5); cross(r, 9, -11, 4, 1); },
  // a chapel: a small gable, a door cut in it, a cross on the apex
  (r, run) => {
    run(-1, 1, 17); run(-2, 1, 17); r(3, -9, 13, 7);
    for (let k = 1; k <= 6; k++) run(-9 - k, 3 + k, 15 - k);
    cross(r, 9, -18, 3, 1); r(8, -6, 3, 4, W);
  },
  // the chapel with a bell tower beside it
  (r, run) => {
    run(-1, 0, 18); run(-2, 0, 18); r(1, -9, 12, 7);
    for (let k = 1; k <= 5; k++) run(-9 - k, 1 + k, 12 - k);
    r(5, -6, 3, 4, W);
    r(13, -17, 5, 15); r(14, -14, 3, 3, W); r(15, -13, 1, 2);
    run(-18, 13, 17); run(-19, 14, 16); run(-20, 15, 15); cross(r, 15, -23, 3, 1);
  },
  // the church: a gable on a step, a pointed arch cut in it, the cross on the apex
  (r, run) => {
    run(-1, 0, 18); run(-2, 0, 18);
    r(0, -12, 19, 10);
    for (let k = 1; k <= 9; k++) run(-12 - k, k, 18 - k);
    r(9, -24, 1, 3); r(8, -23, 3, 1);
    for (let y = 3; y <= 9; y++) run(-y, 3, 15, W);
    for (let k = 1; k <= 6; k++) run(-9 - k, 3 + k, 15 - k, W);
  }
];
const TOP = LOOKS.length - 1;
// The look standing at the scene's time `tl`, the one fading out behind it,
// and the next going up on the yard's works:
//   n     the look standing, whole
//   from  the look it replaced, fading out `fade` (1 to 0) once the new one
//         stands, or null
//   up    the next look and how far its work is along (`p`, 0..1), or null
//   top   the cells the ring rides over: the standing look's, or as far as
//         the rising one has been laid, whichever is higher
// A review scene's loop (`SHRINE.loop`) steps through the five on its own
// clock, each whole, the last fading out as the next stands.
function lookNow(tl) {
  const L = AFTER_SHRINE_LOOKS, tops = L.tops;
  let n, from = null, fade = 0, up = null;
  if (SHRINE.loop) {
    n = Math.floor(tl / L.hold) % LOOKS.length;
    from = tl < L.hold ? null : (n + TOP) % LOOKS.length;
    fade = 1 - clamp01((tl % L.hold) / L.fade);
  } else {
    n = Math.min(TOP, prayerRung());
    const at = S.after?.upAt?.['after-prayer'];
    if (n > 0 && at != null) { from = n - 1; fade = 1 - clamp01((S.after.t - at) / L.fade); }
    const w = prayerRaise();
    if (w && n < TOP) up = { n: n + 1, p: progressOf(w) };
  }
  if (fade <= 0) from = null;
  const top = up ? Math.max(tops[n], tops[up.n] * up.p) : tops[n];
  return { n, from, fade, up, top };
}
// A look laid on the frame, at `alpha`.
function drawLook(d, x0, fn, alpha = 1) {
  const r = (x, y, w, h, tone = K) => d.r(x0 + x, y, w, h, tone);
  d.fade(alpha, () => fn(r, (y, a, b, tone = K) => r(a, y, b - a + 1, 1, tone)));
}
// Each look's paper backing (kit.js, `silhouette`), read once a look; the
// station's backing is the look standing now (`backOf`).
const LOOK_BACKS = [];
const lookBack = n => LOOK_BACKS[n] || (LOOK_BACKS[n] = silhouette(d => drawLook(d, SH.x, LOOKS[n])));
const shrineBack = () => lookBack(lookNow(Math.max(0, (S.after?.t || 0) - SHRINE.t0)).n);
// The shrine's looks: the one fading out, the one standing, and the next as
// far as its builders have laid it, a course at a time from the floor up
// (render/rise.js, `withRise`, the clip every building on the works goes up
// through), its own paper laid under it so it stands in front of the old.
function drawLooks(d, x0, LK) {
  if (LK.from != null) drawLook(d, x0, LOOKS[LK.from], LK.fade);
  drawLook(d, x0, LOOKS[LK.n]);
  if (!LK.up || d.sinking) return;
  const tops = AFTER_SHRINE_LOOKS.tops;
  withRise('after-shrine-look', d.ox + x0 * P, d.oy, SH.w * P, tops[LK.up.n] * P, () => {
    backing(d, lookBack(LK.up.n));
    drawLook(d, x0, LOOKS[LK.up.n]);
  });
}
function shrine(d, work, t) {
  const x0 = SH.x;
  const tl = Math.max(0, (t || 0) - SHRINE.t0), live = SHRINE.mode !== 'ring';
  // REVIEW faith18: the look the prayer rung stands at, and the next as far as the builders have it
  const LK = lookNow(tl);
  drawLooks(d, x0, LK);
  // the faith ring: its face in paper, no rim round it
  const f = clamp01(faithAt(tl)), N = RING.cells.length;
  // MOCK faith13: at full the ring jumps through the config's poses, whole cells, held, then rests; one piece, so its cells, glint and prayers all follow
  const FU = AFTER_SHRINE_FULL;
  let sx = 0, sy = 0;
  if (SHRINE.shake && f >= 0.999) {
    const ph = tl % FU.shake.every, k = Math.floor(ph / FU.shake.hold);
    if (k < FU.shake.poses.length) [sx, sy] = FU.shake.poses[k];
  }
  // REVIEW faith18: the ring two cells over whatever look stands or is laid, whole cells plus a fraction the ring's own move carries
  const ryExact = -(LK.top + FAITH_AT.gap + RING.size) + sy, ryInt = Math.floor(ryExact), frac = ryExact - ryInt;
  const rx = x0 + FAITH_AT.x + sx, ry = ryInt;
  // MOCK faith14: the feel's tremor and swell, drawn by moving the ring as one piece
  const FL = SHRINE.feel && !d.sinking ? feelAt(SHRINE.feel, tl, clamp01((f - 0.97) / 0.03)) : null;
  if (FL) FL.ty += frac;
  // nothing paper in or round it: the sky and clouds run right up to the ring, and a backing read off this drawing (`silhouette`) holds no ring either
  const hubPx = { x: d.ox + (rx + 9.5) * P, y: d.oy + (ry + 9.5) * P };
  // MOCK faith16: where the ring stands, for the click cue, the cursor and the tip
  if (!d.sinking) { faith.box = { x: d.ox + (x0 + FAITH_AT.x) * P, y: d.oy + ryExact * P, w: RING.size * P, h: RING.size * P }; faith.full = f >= 0.999; }
  // REVIEW faith18: without the feel, the ring still rides its true height as a look rises under it
  const move = fn => {
    if (!FL && !frac) { fn(); return; }
    ctx.save();
    if (FL) {
      ctx.translate(hubPx.x + Math.round(FL.tx * P), hubPx.y + Math.round(FL.ty * P));
      ctx.scale(FL.sc, FL.sc);
      ctx.translate(-hubPx.x, -hubPx.y);
    } else ctx.translate(0, Math.round(frac * P));
    fn();
    ctx.restore();
  };
  // MOCK faith14: swollen, the cells overlap by a pixel so scaling leaves no seam between them
  const dd = FL && FL.sc > 1.001 ? { ...d, c: (x, y, tone) => d.px(x * P - 1, y * P - 1, P + 2, P + 2, tone) } : d;
  if (!d.sinking) move(() => ringAt(dd, RING, rx, ry, f, false));
  const c = SA.click, w = tl % clickLoop(), t1 = c.hold + c.press, t2 = t1 + c.unwind;
  if (!d.sinking) {
    const C = AFTER_SHRINE_MOTES, hubX = rx + 9, hubUp = -ry - 9.5;
    // the rising motes, as many as the ring is full
    if (!FL) {
    risePuffs(d, t || 0, C, C.puffs, rx + 9, -ry + 0.5, f);
    risePuffs(d, t || 0, { ...C, ...C.big }, C.big.puffs, rx + 9, -ry + 0.5, clamp01((f - 0.4) / 0.6));
    } else {   // MOCK faith14: every mote leaves a ring cell
      const M = AFTER_SHRINE_FEEL.motes, B = FL.B || AFTER_SHRINE_FEEL.burst, ox = rx + 9 + FL.tx, oy = -ry - 10 - FL.ty;
      risePuffs(d, t || 0, { ...M, path: offRing(M.life, 3, M.out, M.up) }, M.puffs, ox, oy, f);
      for (const bu of FL.bursts) if (bu.tb >= 0 && bu.tb < B.life)
        risePuffs(d, bu.tb, { ...B, once: true, path: offRing(B.life, bu.seed, B.out, B.up, 0, bu.vary) }, bu.n, ox, oy, 1);
    }
    if (SHRINE.stream) {   // MOCK faith13
      const ST = { ...C, ...FU.stream }, sh = clamp01((f - 0.9) / 0.1);
      risePuffs(d, t || 0, ST, ST.puffs, rx + 9 - sx, -ry + 0.5 + sy, sh);
      risePuffs(d, t || 0, { ...ST, ...FU.stream.big }, FU.stream.big.puffs, rx + 9 - sx, -ry + 0.5 + sy, sh);
    }
    // the glint travelling the inked arc, eased in and out along it, and over its leading and trailing edge
    const lit = f * N, u = (tl / SA.turnS) % 1, g = u * (lit + SA.glintCells), env = ease3(clamp01(Math.min(u, 1 - u) * 4));
    RING.cells.forEach(({ i, j }, k) => {
      const dr = g - k, tail = dr >= -1 && dr < SA.glintCells ? ease3(dr < 0 ? 1 + dr : 1 - dr / SA.glintCells) : 0;
      if (tail > 0 && k < lit) move(() => d.fade(tail * env * SA.glintInk * clamp01(lit - k), () => d.c(rx + i, ry + j, W)));
    });
    // the prayers: one sets out from a kneeler every `flyEvery`, but not while it is being emptied
    const every = SA.flyEvery, life = AFTER_COIN_LIFE_S, n = SHRINE.folk || 1, tail = life + SA.bounce.s + 0.4;
    if (SHRINE.pray) {
      const PR = PRAY[SHRINE.pray];
      for (let kn = 0; kn < n; kn++) {
        const o = PR.off(kn) + PR.launch;
        for (let m = Math.max(0, Math.ceil((tl - tail - o) / PR.T)); o + m * PR.T <= tl; m++) {
          const ts = o + m * PR.T, land = ts + life, p = folkAt(SHRINE.pray, kn, ts);
          const fl = faithAt(land), tc = RING.cells[tipIndex(fl)], tip = cellWorld(d, rx, ry, tc);
          const face = kn < n / 2 ? 1 : -1;
          prayer(d, rx, ry, ts, tl, { x: d.ox + (kneelX(kn, n) + 1.5) * P + p.dx * face, y: d.oy + FEET_Y * P + p.dy - 2 }, tip, fl >= 0.999);
          const gl = (tl - land) / SA.glintS;
          if (gl >= 0 && gl < 1) glint(d, rx, ry, tc, gl);
        }
      }
    } else
    for (let q = Math.max(0, Math.floor((tl - tail) / every)); q <= Math.floor(tl / every); q++) {
      const ts = q * every, land = ts + life, kn = q % n, lw = land % clickLoop();
      if (SHRINE.mode === 'click' && ts % clickLoop() >= c.hold && ts % clickLoop() < t2 + c.empty) continue;
      const fl = faithAt(land), tc = RING.cells[tipIndex(fl)], tip = cellWorld(d, rx, ry, tc);
      prayer(d, rx, ry, ts, tl, { x: d.ox + (kneelX(kn, n) + 1.5) * P, y: d.oy - 2 * P }, tip, fl >= 0.999);
      const gl = (tl - land) / SA.glintS;
      if (gl >= 0 && gl < 1) glint(d, rx, ry, tc, gl);
    }
    if (SHRINE.mode === 'click') {
      // the faith streams off the tip as the arc unwinds, to the counter in the corner
      // (the counter stands in the window's lower left corner, in screen pixels: render/counter.js, EDGE)
      const z = S.zoom || 1, to = { x: S.camX + 26 / z, y: S.camY + S.viewH - 22 / z };
      const m = Math.round(c.unwind / c.every);
      for (let q = 0; q < m; q++) {
        const ts = t1 + q * c.every, tip = cellWorld(d, rx, ry, RING.cells[tipIndex(Math.max(0, 1 - ease3(q / m)))]);
        const s = w - ts;
        for (const lag of [0, ...SA.trail]) {
          const at = coinAt({ v: 1, x0: tip.x, y0: tip.y + 4 * P, tx: to.x, ty: to.y, at: ts }, w - lag);
          if (at) d.fade(at.ink * (lag ? 0.5 / (SA.trail.indexOf(lag) + 1) : 1), () => d.px(at.x - d.ox - P, at.y - d.oy - P, P * 2, P * 2, K));
        }
      }
      // and the burst out of the ring as it lets go
      const B = c.burst;
      risePuffs(d, w - t1, { ...B, once: true, path: (u, k, mm) => { const a = k / mm * Math.PI * 2 + 0.3, r = B.r0 + B.r1 * easeOut(u); return [Math.cos(a) * r, -Math.sin(a) * r]; } },
        B.puffs, hubX, hubUp - 0.5, 1);
    }
  }
  // the faithful, three a side on the floor, kneeling
  if (!d.sinking && SHRINE.pray) folk(d, SHRINE.folk);
  else if (!d.sinking) for (let i = 0; i < SHRINE.folk; i++) d.body(kneelX(i, SHRINE.folk), -3, 0, 0, true);
}

export const DRAW = { shrine, mill, workshop, shack, forestry };

// Each station's paper backing (kit.js, `silhouette`), read off its idle
// drawing once: the moving parts swing inside it, and what they carry is
// solid ink of its own.
const BACKS = {};
export const backOf = key => (key === 'shrine' ? shrineBack() : BACKS[key]) || (BACKS[key] = silhouette(d => DRAW[key](d, false, 0, null)));

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
