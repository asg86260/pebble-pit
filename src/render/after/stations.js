// The camp's six stations, polished (docs/mocks/act3-stations-2026-10-18:
// polish-grove-saw.html, polish-chipper-paper.html, polish-workshop-press.html),
// and the construction shack (docs/mocks/act3-place-2026-10-18/shack.html,
// "the chosen shack"). Each is one solid black mass with one signature
// shape, the yard's way; no detail under two cells except a clean line; grey
// only for material; the working state read through the body and the one
// moving part. Each is drawn on its own frame (kit.js) in the mock's own
// cells, so the numbers below are the mock's: the frame's ground is the
// mock's `G`, and the chipper's frame is turned to face the saw mill.
//
// A station draws its idle pose, or with `work` its working pose at time
// `t`; the worker's body is not drawn here but by the members' layer at the
// pose `workerPose` gives, so the one body standing at the door is the one
// doing the work. With the hand on it (`h`, the station's record in
// after/gestures.js, `gestureView`) the moving part goes where the hand put
// it instead: the wheel at the angle it was spun to, the paddle round the
// vat, the bar as far down as it is pulled. Every pose is held: a part moves
// a whole step at a time.
const TURN = Math.PI / 16;                                 // a held step of a turning part
const turning = h => !!h && (h.grab || Math.abs(h.w || 0) > 0.05);

import { P, GESTURE_WHEEL_LOG, GESTURE_FEED_LOG } from '../../config.js';
import { K, W, PULP, DUST, hash, clamp01, silhouette } from './kit.js';

const cyc = (t, T) => { const u = Math.max(0, t), k = Math.floor(u / T); return { ph: u / T - k, since: u - k * T }; };
const FADE = 0.4;

// --- the saw mill: a huge wheel, a small bench ---------------------------------
// The flywheel is the station: a rim two cells thick, four spokes as heavy
// lines, a solid hub and a knob for the hand, turning in held eighths of a
// quarter. The bench and its solid half blade are small beside it.
const WHEEL = { cx: 25, cy: -9, r: 7 };
function hugeWheel(d, { cx, cy, r }, a) {
  for (let y = Math.floor(cy - r - 2); y <= cy + r + 2; y++) for (let x = Math.floor(cx - r - 2); x <= cx + r + 2; x++) {
    const dd = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
    if (dd > r - 1 && dd <= r + 1) d.c(x, y, K);
  }
  for (let k = 0; k < 4; k++) { const b = a + k * Math.PI / 2; d.line(cx, cy, cx + Math.cos(b) * (r - 0.5), cy + Math.sin(b) * (r - 0.5), 5); }
  d.r(cx - 1.5, cy - 1.5, 3, 3, K);
  const kx = cx + Math.cos(a) * (r + 1.8), ky = cy + Math.sin(a) * (r + 1.8);
  d.r(Math.round(kx - 1), Math.round(ky - 1), 2, 2, K);
}
// The log on its way through the blade: a cell a step over the cycle, cut
// into two planks with a seam past the blade, faded on and off.
function feedLog(d, t, T, y, x0, x1, cutX, at = null) {
  const c = at == null ? cyc(t, T) : { ph: at, since: 1 }, steps = x1 - x0, k = Math.min(steps, Math.floor(c.ph * (steps + 2)));
  const x = x0 + k, a = c.since < FADE ? c.since / FADE : (c.ph > 0.9 ? 1 - (c.ph - 0.9) / 0.1 : 1);
  d.fade(a, () => {
    for (let i = 0; i < 5; i++) {
      const cx = x + i;
      if (cx < cutX) d.r(cx, y, 1, 2, K);
      else { d.r(cx, y, 1, 0.83, K); d.r(cx, y + 1.17, 1, 0.83, K); }
    }
    if (x + 4 < cutX) d.px((x + 4) * P + 2, y * P + 2, P - 4, 2 * P - 4, 3);
  });
}
const SAW_T = 2.4;
function mill(d, work, t, h) {
  const hand = turning(h);
  hugeWheel(d, WHEEL, hand ? Math.round(h.ang / TURN) * TURN : work ? Math.floor(t / 0.1) * Math.PI / 8 : 0);
  d.r(22, -1, 6, 1, K);                                   // the foot it turns on
  d.spr(['.##.', '####'], 12, -5);                         // the blade's top half, over the bench
  d.r(9, -3, 7, 1, K); d.r(10, -2, 1, 2, K); d.r(14, -2, 1, 2, K);
  if (hand) feedLog(d, t, SAW_T, -5, 7, 12, 13, (h.prog || 0) / GESTURE_WHEEL_LOG * 0.9);
  else if (work) feedLog(d, t, SAW_T, -5, 7, 12, 13);
}

// --- the chipper: an open jaw, a drum, a hooked pipe ----------------------------
// An open jaw over four bodies high, a block of a drum, and a pipe two cells
// thick that hooks over in a half circle and pours the chips straight down.
// OX is the jaw's lip; everything is laid off it in whole cells.
const OX = 14, CHIP_T = 2.4, SWALLOW = 0.62, POUR_FOR = 1.1;
// The feed in held poses through a cycle: [from phase, log x, body x, lean px].
// The body walks the log in a cell at a time, leans on the last, and walks
// back a cell at a time.
const FEED = [
  [0.00, 10, 7, 0], [0.10, 11, 8, 0], [0.20, 12, 9, 0], [0.30, 13, 10, 0],
  [0.40, 14, 11, 0], [0.50, 15, 11, 2], [0.62, 16, 11, 2],
  [0.80, null, 10, 0], [0.87, null, 9, 0], [0.94, null, 8, 0]
];
const feedPose = ph => { let p = FEED[0]; for (const f of FEED) if (ph >= f[0]) p = f; return p; };
function chipper(d, work, t, h) {
  d.r(OX + 7, -7, 5, 7, K); d.r(OX + 12, -6, 1, 6, K);             // the drum, its corner taken off
  for (let i = 0; i < 7; i++) {                                     // the top jaw, a cell down a cell in
    const top = Math.min(-8, -12 + i), bot = Math.min(-4, -10 + i);
    d.r(OX + i, top, 1, bot - top + 1, K);
  }
  d.r(OX - 1, -13, 1, 2, K);                                        // the lip, flared up
  d.r(OX - 1, -1, 8, 1, K); d.r(OX - 1, -2, 1, 1, K);               // the bottom jaw, turned up at the lip
  d.r(OX + 10, -14, 2, 7, K);                                       // the pipe: up,
  const cx = OX + 14, cy = -14;
  for (let y = cy - 4; y < cy; y++) for (let x = cx - 4; x < cx + 4; x++) {
    const r = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
    if (r >= 1.9 && r <= 4.1) d.c(x, y, K);                         // round,
  }
  d.r(OX + 16, -14, 2, 3, K);                                       // and down
  d.r(OX + 15, -11, 4, 1, K);                                       // the spout's lip
  // Held by the hand, the log goes in as far as the feed has taken it.
  const hand = !!h && h.hold;
  if (!work && !hand) return;
  const c = hand ? { ph: (h.prog || 0) / GESTURE_FEED_LOG * SWALLOW, since: 1 } : cyc(t, CHIP_T), [, lx] = feedPose(c.ph);
  if (lx != null) {
    const a = c.ph >= SWALLOW ? 1 - clamp01((c.ph - SWALLOW) * CHIP_T / 0.35) : c.ph < 0.1 ? clamp01(c.since / FADE) : 1;
    d.fade(a, () => { d.r(lx, -3, 5, 2, K); d.px(lx * P + 2, -3 * P + 2, P - 2, 2 * P - 4, 3); });
  }
  // The chips: dashes a cell wide and two long, falling a cell every tenth
  // of a second from the spout while the log is chewed.
  const step = hand ? Math.floor(t * 10) % 10 : Math.floor(((c.ph - SWALLOW + 1) % 1) * CHIP_T * 10);
  for (let j = 0; j < 12; j++) {
    const born = step - j * 3;
    if (born < 0 || j * 0.3 > POUR_FOR) continue;
    const y = -10 + born;
    if (y > -3) continue;
    d.r(OX + 16 + (j % 2), y, 1, 2, DUST[j % DUST.length]);
  }
}

// --- the paper mill: a cutaway vat, a long paddle --------------------------------
// The vat is a cutaway, thick black walls and a rounded floor, six rows of
// pulp seen through in grey under a white band of air; the body stands on a
// post level with the rim, and the paddle rests on the rim's corner, stirred
// in a loop of four held poses. No chimney.
const RIM = -10, PIVOT = [13.6, RIM - 0.3];
const LOOP = [[17, -4.5], [20, -7], [23, -5], [20, -3.5]];   // the blade's held places: an ellipse side on
const LEAN = [0, 2, 2, 0], STIR_T = 0.3;
const stirPose = (work, t) => (work ? Math.floor(t / STIR_T) % 4 : 3);
const LOOP_TURN = 2 * Math.PI;
function papermill(d, work, t, h) {
  const hand = turning(h);
  const pose = hand ? Math.floor((((h.ang % LOOP_TURN) + LOOP_TURN) % LOOP_TURN) / LOOP_TURN * LOOP.length) % LOOP.length : stirPose(work, t);
  work = work || hand;
  d.r(9, RIM, 3, -RIM, K);                                          // the post, hard up against the wall
  d.r(26, RIM, 3, 1, K);                                            // the far rim, overhanging
  d.r(12, RIM, 2, -RIM - 2, K); d.r(26, RIM + 1, 2, -RIM - 3, K);   // the walls
  d.r(12, -2, 16, 1, K); d.r(12, -1, 15, 1, K);                     // the floor, rounded off at the far corner
  for (let j = 0; j < 6; j++) for (let i = 0; i < 12; i++) d.c(14 + i, -8 + j, PULP[Math.floor(hash((14 + i) * 5.1 + j * 9.3) * PULP.length)]);
  if (work) {
    // A crest stands up ahead of the blade and a trough opens behind it.
    const ex = Math.round(LOOP[pose][0]), right = pose === 0 || pose === 1;
    const crest = right ? ex + 2 : ex - 4, trough = right ? ex - 4 : ex + 2;
    if (crest >= 14 && crest + 2 <= 26) d.r(crest, -9, 2, 1, PULP[0]);
    if (trough >= 14 && trough + 2 <= 26) d.r(trough, -8, 2, 1, W);
  }
  const [ex, ey] = LOOP[pose], [px, py] = PIVOT, lean = work ? LEAN[pose] : 0;
  const L = Math.hypot(ex - px, ey - py), ux = (ex - px) / L, uy = (ey - py) / L;
  d.line(px - ux * 7 + lean / P, py - uy * 7, ex, ey, P);
  d.r(Math.round(ex - 1), Math.round(ey - 1.5), 2, 3, K);           // the blade, in the pulp
}

// --- the workshop: a hammer with a thin roof over it ------------------------------
// The lean-to's roof a thin line high over the raised hammer on two posts, so
// it holds the picture up without being the picture; the sign on the bench a
// white board; the hammer drawn by hand in whole cells a pose, never rotated.
const HX = 18, HY = -4, SIGN = { x: 10, y: -5, w: 6, h: 3 };
const WS_SEQ = ['up', 'up', 'up', 'swing', 'strike', 'strike', 'strike', 'strike'], WS_STEP = 0.16;
function wsPose(work, t) {
  if (!work) return { pose: 'rest', since: 9 };
  const k = Math.floor(t / WS_STEP), i = k % WS_SEQ.length;
  let j = i; while (j > 0 && WS_SEQ[j - 1] === WS_SEQ[i]) j--;
  return { pose: WS_SEQ[i], since: t - (k - (i - j)) * WS_STEP };
}
function hammer(d, pose) {
  if (pose === 'up') { d.r(HX, HY - 4, 1, 4, K); d.r(HX - 2, HY - 7, 5, 3, K); }
  else if (pose === 'swing') {
    // the smear: only grey, a faint copy where it was and a darker one half way down
    d.r(HX - 2, HY - 7, 5, 3, 2); d.r(HX - 5, HY - 6, 4, 4, 4);
    d.line(HX + 0.5, HY + 0.5, HX - 1.5, HY - 2.5, 4, K, false);
  } else {
    // the strike: the head stood on its face on the sign, the handle back to the hand
    d.line(HX + 0.5, HY + 0.5, SIGN.x + 4, SIGN.y - 2.5, 4, K, false);
    d.r(SIGN.x + 1, SIGN.y - 5, 3, 5, K);
  }
}
// A tap is a blow: the swing for a step, then held on the strike.
function tapPose(h, t) {
  const since = t - h.strike;
  if (since < WS_STEP) return { pose: 'swing', since };
  if (since < WS_STEP * 5) return { pose: 'strike', since: since - WS_STEP };
  return null;
}
function workshop(d, work, t, h) {
  const { pose, since } = (h && tapPose(h, t)) || wsPose(work, t);
  d.line(7, -12, 25.5, -15.5, 3, K, false);
  d.line(7, -12, 7, -0.4, 3, K, false); d.line(25, -15.5, 25, -0.4, 3, K, false);
  d.r(8, -2, 9, 1, K); d.r(9, -1, 1, 1, K); d.r(15, -1, 1, 1, K);    // the bench, low
  d.r(SIGN.x, SIGN.y, SIGN.w, SIGN.h, K); d.px(SIGN.x * P + 2, SIGN.y * P + 2, SIGN.w * P - 4, SIGN.h * P - 4, W);
  d.r(HX - 1, -1, 5, 1, K);                                         // the step the body stands on
  hammer(d, pose === 'rest' ? 'strike' : pose);                     // at rest it lies where the last blow left it
  if (pose === 'strike') d.fade(1 - since / (4 * WS_STEP), () => {
    d.line(SIGN.x - 0.6, SIGN.y - 0.6, SIGN.x - 2, SIGN.y - 0.6, 3, K, false);
    d.line(SIGN.x - 0.2, SIGN.y - 1.6, SIGN.x - 1.8, SIGN.y - 3.2, 3, K, false);
  });
}

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

export const DRAW = { mill, chipper, papermill, workshop, press, shack };

// Each station's paper backing (kit.js, `silhouette`), read off its idle
// drawing once: the moving parts swing inside it, and what they carry is
// solid ink of its own.
const BACKS = {};
export const backOf = key => BACKS[key] || (BACKS[key] = silhouette(d => DRAW[key](d, false, 0, null)));

// Where the worker at a working station stands and how, in its frame's
// cells: its left column and top row, a lean in px, and whether it squats.
// Idle, it stands at the same spot unleaning.
export function workerPose(key, work, t) {
  if (key === 'mill') return { x: 6, y: -3, dx: work && Math.floor(cyc(t, SAW_T).ph * 9) % 2 ? 3 : 0 };
  if (key === 'chipper') {
    if (!work) return { x: 8, y: -3, dx: 0 };
    const [, , bx, lean] = feedPose(cyc(t, CHIP_T).ph);
    return { x: bx, y: -3, dx: lean };
  }
  if (key === 'papermill') return { x: 9, y: RIM - 3, dx: work ? LEAN[stirPose(work, t)] : 0 };
  if (key === 'workshop') return { x: HX, y: HY, dx: 0 };
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
