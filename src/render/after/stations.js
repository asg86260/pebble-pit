// The camp's stations: the saw mill and the workshop as voted in the second
// redesign (docs/mocks/act3-stations-r2-2026-10-18: the frame saw, the shed),
// matched to the press (docs/mocks/act3-stations-2026-10-18,
// polish-workshop-press.html, the press since cut), the construction shack
// (docs/mocks/act3-place-2026-10-18/shack.html), the forestry shack and the
// shrine. Each
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
import { P, AFTER_SAW_TEETH, AFTER_ART_SCALE, AFTER_MILL, AFTER_CABIN_SMOKE, AFTER_SHRINE_PRAY, AFTER_SHRINE_MOTES, AFTER_SHRINE_SAUCE,
         AFTER_SHRINE_HEART, AFTER_SHRINE_LOOKS, AFTER_COIN_LIFE_S, AFTER_LINE_DARK } from '../../config.js';
import { K, W, PALE, MID, hash, silhouette, backing, clamp01 } from './kit.js';
import { ART } from '../../after/art.js';
import { CABIN } from '../../after/cabin.js';
import { DOORWAY } from '../../after/doorway.js';
import { held } from '../../reset.js';
import { ctx } from '../ctx.js';
import { ringCells } from '../cellring.js';
import { faith } from '../../after/faith.js';
import { prayerRung, prayerRaise } from '../../after/levels.js';
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
// `n` puffs off (x0, y0), in cells, as the config `C` has them: each rising
// and drifting at its true position, in and out by fading and from the mid
// grey to the pale. `C.path` lays a puff's way itself (the shrine's motes,
// thrown off its ring), and `C.once` runs them through a single life from
// `t` 0 (a burst) rather than round and round.
function risePuffs(b, t, C, n, x0, y0) {
  for (let k = 0; k < n; k++) {
    const u = C.once ? t / C.life : ((t / C.life + k / n) % 1 + 1) % 1;
    if (u < 0 || u >= 1) continue;
    const ez = C.ease ? ease3 : v => v;
    const a = ez(Math.min(1, u * C.fadeIn)) * ez(1 - u) * C.peak;
    const way = C.path ? C.path(u, k, n) : null;
    const x = way ? x0 + way[0] : x0 + u * C.drift + Math.sin(t * C.swayRate + k * C.swayPhase) * C.sway, y = way ? y0 + way[1] : y0 + u * C.rise;
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
}

// --- the shrine ------------------------------------------------------------------------
// Its look grows with its prayer rungs, a wayside cross to a church, each
// look put up by the act's builders (after/rows.js, `raiseRow`). Over it
// floats the faith ring, the air filter's dial's cell ring
// (render/cellring.js), full and beating like a heart, motes thrown off its
// cells on each beat; the faithful kneel either side and each prayer they
// send arcs up into the ring's tip, glints and is turned away, since the
// ring is full. Everything comes and goes by opacity, read off the act's
// clock: nothing pops.

// The faithful at prayer: the frame's own body (kit.js `body`), whole, moved
// as one piece at its true position, a small hop as each prayer leaves and
// still between, on a cycle of its own each, so one beat is both the hop and
// the prayer.
const FOLK = AFTER_SHRINE_PRAY;
const FEET_Y = -4;                                    // cells: the body's own row, a cell up out of the ground's dip
const offOf = k => hash(k * 4.1 + 3) * FOLK.every;
// where the whole body is, in px off its rest place, down
function hopOf(k, t) {
  const u = (((t - offOf(k)) % FOLK.every) + FOLK.every) % FOLK.every, e = u - FOLK.launch;
  return e > 0 && e < FOLK.hop ? -P * FOLK.lift * Math.sin(Math.PI * e / FOLK.hop) : 0;
}
function folk(d, t) {
  for (let i = 0; i < FOLK.n; i++) d.body(kneelX(i, FOLK.n), FEET_Y, 0, hopOf(i, t), false);
}

const SH = { x: 13, w: 19 };
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
const ease3 = k => k * k * (3 - 2 * k);
const easeOut = k => 1 - (1 - k) * (1 - k);

// The ring, every cell inked: in the dark the line's own light tone, so the
// ring is the brightest thing over the shrine on either page.
function ringAt(d, rx, ry) {
  for (const { i, j } of RING.cells) d.c(rx + i, ry + j, darkPage ? raw(AFTER_LINE_DARK) : K);
}
const cellWorld = (d, rx, ry, c) => ({ x: d.ox + (rx + c.i + 0.5) * P, y: d.oy + (ry + c.j + 0.5) * P });
const kneelX = (i, n) => { const left = i < n / 2, j = left ? i : i - Math.ceil(n / 2); return left ? 1 + j * 4 : SH.x + SH.w + 3 + j * 4; };
// A prayer: the yard's coin arc (aftercoins.js, `coinAt`) from a kneeler to
// the ring's tip, at its true position, with a short trail fading behind it;
// at the tip it is turned away outward, off the full ring, and fades.
function prayer(d, rx, ry, ts, tl, from, tip) {
  const life = AFTER_COIN_LIFE_S, m = { v: 1, x0: from.x, y0: from.y, tx: tip.x, ty: tip.y, at: ts };
  const hub = { x: d.ox + (rx + 9.5) * P, y: d.oy + (ry + 9.5) * P };
  const at = q => {
    const e = q - ts;
    if (e < 0) return null;
    if (e < life) { const c = coinAt(m, q); return c && { x: c.x, y: c.y, a: ease3(clamp01(e / 0.5)) }; }
    if (e >= life + SA.bounce.s) return null;
    const u = (e - life) / SA.bounce.s, dx = tip.x - hub.x, dy = tip.y - hub.y, len = Math.hypot(dx, dy) || 1;
    return { x: tip.x + dx / len * SA.bounce.r * P * easeOut(u), y: tip.y + dy / len * SA.bounce.r * P * easeOut(u), a: 1 - ease3(u) };
  };
  SA.trail.forEach((lag, i) => {
    const q = at(tl - lag);
    if (q) d.fade(q.a * 0.5 / (i + 1), () => d.px(q.x - d.ox - P * (1 - 0.2 * i), q.y - d.oy - P * (1 - 0.2 * i), P * (2 - 0.4 * i), P * (2 - 0.4 * i), K));
  });
  const q = at(tl);
  if (q) d.fade(q.a, () => d.px(q.x - d.ox - P, q.y - d.oy - P, P * 2, P * 2, K));
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

// The ring's heartbeat at time `t` (config, AFTER_SHRINE_HEART): its tremor
// off rest in cells (tx, ty), its scale, and the bursts of motes begun (each
// with its start, its seed and its count). Two beats a cycle, the lub strong
// and the dub its softer echo, each rising and easing back on its own
// envelope, which the tremor, the swell and the motes all follow; each beat
// strays from the mean by a seeded hash, so no two are alike and a scene is
// repeatable. Smooth sums of sines, never a pose.
function heartAt(t) {
  const E = AFTER_SHRINE_HEART, V = E.vary, m = Math.floor(t / E.every), ph = t - m * E.every;
  const str = (c, bi) => 1 + (hash(c * 3.1 + bi * 7.7 + 1) - 0.5) * 2 * V.str;
  let tx = 0, ty = 0, pulse = 0;
  E.beats.forEach((b, bi) => {
    const up = clamp01((ph - (b.at - b.rise)) / b.rise), down = clamp01((b.at + b.fall - ph) / b.fall);
    const e = ph < b.at ? ease3(up) : Math.pow(down, 1.6), s = str(m, bi), w = Math.PI * 2 * (ph - (b.at - b.rise));
    tx += e * b.amp * s * Math.sin(w * E.hz[0]);
    ty += e * b.amp * s * E.ySeen * Math.sin(w * E.hz[1] + 1);
    pulse = Math.max(pulse, e * b.pulse * s);
  });
  // this cycle's beats and the last's, whose motes may still be in the air
  const bursts = [];
  for (const c of m > 0 ? [m, m - 1] : [m])
    E.beats.forEach((b, bi) => bursts.push({ tb: t - c * E.every - b.at, seed: c * 7 + bi * 13, n: Math.round(b.shed * (1 + (hash(c * 5.3 + bi * 2.9 + 2) - 0.5) * 2 * V.shed)) }));
  return { tx, ty, sc: 1 + pulse, bursts };
}
// A mote's way off a ring cell: the cell, then outward from the hub and a
// little up; with `V` each mote its own speed, heading and lift, by hash.
function offRing(seed, out, up, V = null) {
  return (u, k) => {
    const c = RING.cells[Math.floor(hash(k * 5.1 + seed) * RING.cells.length)], hx = c.i - 9, hy = 9 - c.j, len = Math.hypot(hx, hy) || 1, e = easeOut(u);
    const r = q => (hash(k * q + seed + 9) - 0.5) * 2, sp = V ? 1 + r(2.3) * V.speed : 1, an = V ? r(4.7) * V.ang : 0, ul = V ? 1 + r(6.1) * V.up : 1;
    const ux = hx / len, uy = hy / len, dx = ux * Math.cos(an) - uy * Math.sin(an), dy = ux * Math.sin(an) + uy * Math.cos(an);
    return [hx + dx * out * sp * e, hy + dy * out * sp * e + up * ul * u];
  };
}
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
// What of the shrine stands now:
//   n     the look standing, whole: the prayer rung's
//   from  the look it replaced, fading out `fade` (1 to 0) once the new one
//         stands, or null
//   up    the next look and how far its work on the yard's works is laid
//         (`p`, 0..1), or null
//   top   the cells the ring rides over: the standing look's, or as far as
//         the rising one has been laid, whichever is higher
function lookNow() {
  const L = AFTER_SHRINE_LOOKS, n = Math.min(TOP, prayerRung()), at = S.after?.upAt?.['after-prayer'];
  let from = null, fade = 0, up = null;
  if (n > 0 && at != null) { from = n - 1; fade = 1 - clamp01((S.after.t - at) / L.fade); }
  const w = prayerRaise();
  if (w && n < TOP) up = { n: n + 1, p: progressOf(w) };
  const top = up ? Math.max(L.tops[n], L.tops[up.n] * up.p) : L.tops[n];
  return { n, from: fade > 0 ? from : null, fade, up, top };
}
// A look's ink on the frame.
function inkLook(d, x0, fn) {
  const r = (x, y, w, h, tone = K) => d.r(x0 + x, y, w, h, tone);
  fn(r, (y, a, b, tone = K) => r(a, y, b - a + 1, 1, tone));
}
// Each look's paper backing (kit.js, `silhouette`), read once a look. The
// shrine lays its own (`backOf` hands the station none), each look's with it
// and at its opacity, so a look fading out takes its paper with it.
const LOOK_BACKS = [];
const lookBack = n => LOOK_BACKS[n] || (LOOK_BACKS[n] = silhouette(d => inkLook(d, SH.x, LOOKS[n])));
const drawLook = (d, x0, n, alpha = 1) => d.fade(alpha, () => { backing(d, lookBack(n)); inkLook(d, x0, LOOKS[n]); });
// The shrine's looks: the one fading out, the one standing, and the next as
// far as it is laid, a course at a time from the floor up through the clip
// every building on the yard's works goes up through (render/rise.js,
// `withRise`), its own paper under it so it stands in front of the old.
function drawLooks(d, x0, LK) {
  if (LK.from != null) drawLook(d, x0, LK.from, LK.fade);
  drawLook(d, x0, LK.n);
  if (!LK.up || d.sinking) return;
  withRise('after-shrine-look', d.ox + x0 * P, d.oy, SH.w * P, AFTER_SHRINE_LOOKS.tops[LK.up.n] * P, () => drawLook(d, x0, LK.up.n));
}
function shrine(d, work, t) {
  const x0 = SH.x, tl = t || 0, LK = lookNow();
  drawLooks(d, x0, LK);
  if (d.sinking) { faith.box = null; return; }
  // The ring two cells over whatever look stands or is laid: whole cells,
  // plus the fraction carried by the ring's own move, so it rides its true
  // height smoothly as a look rises under it.
  const ryExact = -(LK.top + FAITH_AT.gap + RING.size), ry = Math.floor(ryExact), rx = x0 + FAITH_AT.x;
  const HB = heartAt(tl);
  HB.ty += ryExact - ry;
  const hubPx = { x: d.ox + (rx + 9.5) * P, y: d.oy + (ry + 9.5) * P };
  // where the ring stands, for the click cue (render/aftercues.js)
  faith.box = { x: d.ox + rx * P, y: d.oy + ryExact * P, w: RING.size * P, h: RING.size * P };
  // the heartbeat's tremor and swell, drawn by moving the ring as one piece
  const move = fn => {
    ctx.save();
    ctx.translate(hubPx.x + Math.round(HB.tx * P), hubPx.y + Math.round(HB.ty * P));
    ctx.scale(HB.sc, HB.sc);
    ctx.translate(-hubPx.x, -hubPx.y);
    fn();
    ctx.restore();
  };
  // swollen, the cells overlap by a pixel so scaling leaves no seam between them;
  // nothing paper in or round the ring: the sky and clouds run right up to it
  const dd = HB.sc > 1.001 ? { ...d, c: (x, y, tone) => d.px(x * P - 1, y * P - 1, P + 2, P + 2, tone) } : d;
  move(() => ringAt(dd, rx, ry));
  // the motes, every one off a ring cell: the steady few, and each beat's burst
  const M = AFTER_SHRINE_MOTES, B = AFTER_SHRINE_HEART.burst, ox = rx + 9 + HB.tx, oy = -ry - 10 - HB.ty;
  risePuffs(d, tl, { ...M, path: offRing(3, M.out, M.up) }, M.puffs, ox, oy);
  for (const bu of HB.bursts) if (bu.tb >= 0 && bu.tb < B.life)
    risePuffs(d, bu.tb, { ...B, once: true, path: offRing(bu.seed, B.out, B.up, AFTER_SHRINE_HEART.vary) }, bu.n, ox, oy);
  // the glint travelling the ring, eased in and out along it, and over its leading and trailing edge
  const N = RING.cells.length, u = (tl / SA.turnS) % 1, g = u * (N + SA.glintCells), env = ease3(clamp01(Math.min(u, 1 - u) * 4));
  RING.cells.forEach(({ i, j }, k) => {
    const dr = g - k, tail = dr >= -1 && dr < SA.glintCells ? ease3(dr < 0 ? 1 + dr : 1 - dr / SA.glintCells) : 0;
    if (tail > 0) move(() => d.fade(tail * env * SA.glintInk, () => d.c(rx + i, ry + j, W)));
  });
  // the prayers: each kneeler's leaves on its hop, lands on the tip and glints there
  const life = AFTER_COIN_LIFE_S, tail = life + SA.bounce.s + 0.4, tc = RING.cells[N - 1], tip = cellWorld(d, rx, ry, tc);
  for (let kn = 0; kn < FOLK.n; kn++) {
    const o = offOf(kn) + FOLK.launch;
    for (let m = Math.max(0, Math.ceil((tl - tail - o) / FOLK.every)); o + m * FOLK.every <= tl; m++) {
      const ts = o + m * FOLK.every, land = ts + life;
      prayer(d, rx, ry, ts, tl, { x: d.ox + (kneelX(kn, FOLK.n) + 1.5) * P, y: d.oy + FEET_Y * P + hopOf(kn, ts) - 2 }, tip);
      const gl = (tl - land) / SA.glintS;
      if (gl >= 0 && gl < 1) glint(d, rx, ry, tc, gl);
    }
  }
  folk(d, tl);
}

export const DRAW = { shrine, mill, workshop, shack, forestry };

// Each station's paper backing (kit.js, `silhouette`), read off its idle
// drawing once: the moving parts swing inside it, and what they carry is
// solid ink of its own. The shrine lays each look's paper itself (`drawLook`).
const BACKS = { shrine: [] };
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
