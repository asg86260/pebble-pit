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

import { P, GESTURE_WHEEL_LOG, GESTURE_FEED_LOG } from '../../config.js';
import { K, W, PULP, DUST, hash, clamp01, silhouette } from './kit.js';

const cyc = (t, T) => { const u = Math.max(0, t), k = Math.floor(u / T); return { ph: u / T - k, since: u - k * T }; };
const FADE = 0.4;
// White cut out of a mass a cell or more, 2 px in from its edge.
const cut = (d, x, y, w, h, tone = W) => d.px(x * P + 2, y * P + 2, w * P - 4, h * P - 4, tone);

// --- the saw mill: the frame saw ------------------------------------------------
// The press's frame with a plumb blade in it, its teeth cut white, going up
// and down through the log; a rod from the flywheel's knob to the blade's
// crosshead, so each turn of the wheel is a stroke of the blade. The wheel
// stands on a post beside the frame, at the body's hand.
const WHEEL = { cx: 15, cy: -8, r: 5 };
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
// The wheel's post, a cell thick down its middle, and its foot.
function wheelStand(d, { cx, cy }) { d.px(cx * P - 3, cy * P, 6, -cy * P, K); d.r(cx - 3, -1, 6, 1, K); }
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
const SPIN = (work, t) => (work ? Math.floor(t / 0.1) * Math.PI / 8 : 0);
function mill(d, work, t, h) {
  const hand = turning(h), a = hand ? Math.round(h.ang / TURN) * TURN : SPIN(work, t);
  const kx = WHEEL.cx + Math.cos(a) * (WHEEL.r + 1.8), ky = WHEEL.cy + Math.sin(a) * (WHEEL.r + 1.8);
  // The blade's stroke, in whole cells, off the wheel's angle: down as the knob goes down.
  const drop = Math.round(1.5 + 1.5 * Math.sin(a)), bot = -7 + drop, chY = bot - 6;
  wheelStand(d, WHEEL);
  hugeWheel(d, WHEEL, a);
  d.line(kx, ky, 24.5, chY + 0.5, 3);                       // the rod, knob to crosshead
  d.r(21, -3, 15, 2, K);                                    // the bed
  d.r(23, -16, 1, 13, K); d.r(33, -16, 1, 13, K);           // posts
  d.r(22, -1, 2, 1, K); d.r(33, -1, 2, 1, K);
  d.r(22, -18, 13, 2, K);                                   // the head
  if (hand) feedLog(d, t, SAW_T, -5, 22, 31, 28, (h.prog || 0) / GESTURE_WHEEL_LOG * 0.9);
  else if (work) feedLog(d, t, SAW_T, -5, 22, 31, 28);
  d.r(24, chY, 9, 1, K);                                    // the crosshead, riding between the posts
  d.r(27, chY + 1, 2, bot - chY, K);                        // the blade
  for (let y = chY + 2; y <= bot; y++) { d.px(27 * P, y * P, 3, 2, W); d.px(27 * P, y * P + 3, 1, 2, W); }   // its teeth, cut white
}

// --- the chipper: the jaws ------------------------------------------------------
// A tall back block and a toothed top jaw that comes down on the log a whole
// cell at a time, like the platen, and opens again; white teeth on both
// jaws, a chute off the block's top pouring the chips straight down. Drawn
// facing right; its frame turns it to face the saw mill.
const CHIP_T = 2.4, SWALLOW = 0.62, LOG_X0 = 9, LOG_X1 = 15, MOUTH = 17;
// The top jaw's drop in cells through a cycle, twelve held steps: open while
// the log goes in, then bites.
const JAW = [0, 0, 0, 0, 1, 2, 4, 4, 2, 4, 4, 1];
const CHEW = 4;                                            // the first step of JAW that bites
const POUR = 0.45;                                         // the phase the chips start falling
// The feed at phase `ph`: the log walked into the mouth a cell at a time with
// the body behind it, a lean on the last; then the body walks back.
function chFeed(ph) {
  const steps = LOG_X1 - LOG_X0, k = Math.min(steps, Math.floor(ph / SWALLOW * (steps + 1)));
  if (ph >= SWALLOW) {
    const back = Math.floor((ph - SWALLOW) / (1 - SWALLOW) * 4);
    return { lx: null, bx: LOG_X0 - 3 + steps - Math.min(steps, back * Math.ceil(steps / 3)), lean: 0 };
  }
  return { lx: LOG_X0 + k, bx: LOG_X0 - 3 + k, lean: k === steps ? 2 : 0 };
}
function chipper(d, work, t, h) {
  // Held by the hand, the log goes in as far as the feed has taken it and
  // the jaw chews for as long as it is held.
  const hand = !!h && h.hold, c = hand ? { ph: (h.prog || 0) / GESTURE_FEED_LOG * SWALLOW, since: 1 } : cyc(t, CHIP_T);
  const jawStep = hand ? CHEW + Math.floor(t / (CHIP_T / JAW.length)) % (JAW.length - CHEW) : Math.min(JAW.length - 1, Math.floor(c.ph * JAW.length));
  const chewing = hand || (work && c.ph >= POUR);
  if (work || hand) {
    const f = chFeed(c.ph);
    if (f.lx != null) d.fade(c.ph < 0.1 ? clamp01(c.since / FADE) : 1, () => {
      const w = Math.max(0, Math.min(5, MOUTH - f.lx + 2));
      d.r(f.lx, -4, w, 2, K); d.px(f.lx * P + 2, -4 * P + 2, P - 2, 2 * P - 4, 3);
    });
  }
  const jy = -13 + (work || hand ? JAW[jawStep] : 0);
  d.r(22, -15, 6, 15, K);                                   // the back block
  d.px(23 * P + 2, -6 * P, 4 * P - 4, 2, W); d.px(23 * P + 2, -4 * P, 4 * P - 4, 2, W);
  d.r(12, -1, 10, 1, K);                                    // the bottom jaw
  for (let i = 0; i < 5; i++) d.r(12 + i * 2, -2, 1, 1, K); // its teeth
  d.r(13, jy, 9, 4, K); d.r(12, jy - 1, 1, 3, K);           // the top jaw and its lip
  d.px(14 * P, (jy + 1) * P + 2, 6 * P, 2, W);              // its band, cut white
  for (let i = 0; i < 5; i++) d.r(13 + i * 2, jy + 4, 1, 1, K);
  d.px(22 * P - 2, (jy + 2) * P - 2, 4, 4, W);              // the hinge pin
  d.r(25, -18, 2, 3, K); d.r(25, -19, 7, 2, K); d.r(30, -17, 2, 2, K); d.r(29, -15, 4, 1, K);   // the chute
  // The chips: dashes a cell wide and two long, falling a cell every tenth
  // of a second from the chute while the log is chewed.
  if (!chewing) return;
  const step = hand ? Math.floor(t * 10) % 12 : Math.floor((c.ph - POUR) * CHIP_T * 10);
  for (let j = 0; j < 8; j++) {
    const y = -14 + step - j * 2;
    if (y < -14 || y > -3) continue;
    d.r(30 + (j % 2), y, 1, 2, DUST[j % DUST.length]);
  }
}

// --- the paper mill: the vat and the drying line ---------------------------------
// A mirrored vat with lips, posts up off the lips to a line hung with three
// pegged white sheets: a closed frame with the product in it. The paddle
// stays plumb and is walked across the pulp, the handle level from the hand
// of the body on its step.
const STIR_T = 0.3, PADDLE_X = [15, 18, 21, 18], PADDLE_MID = 18, PADDLE_REACH = 3;
const LEAN = [0, 2, 3, 2];
const stirPose = (work, t) => (work ? Math.floor(t / STIR_T) % 4 : 0);
function vat(d) {
  d.r(10, -10, 4, 1, K); d.r(24, -10, 4, 1, K);             // the rim's lips
  d.r(11, -9, 2, 8, K); d.r(25, -9, 2, 8, K);               // walls
  d.r(12, -2, 14, 1, K);                                    // floor
  d.r(11, -1, 3, 1, K); d.r(24, -1, 3, 1, K);               // feet
  for (let j = 0; j < 5; j++) for (let i = 0; i < 12; i++) d.c(13 + i, -7 + j, PULP[Math.floor(hash((13 + i) * 5.1 + j * 9.3) * PULP.length)]);
}
// A crest stands up ahead of the paddle and a trough opens behind it.
function crest(d, x, dir) {
  const c = dir > 0 ? x + 2 : x - 3, tr = dir > 0 ? x - 3 : x + 2;
  if (c >= 13 && c + 2 <= 25) d.r(c, -8, 2, 1, PULP[0]);
  if (tr >= 13 && tr + 2 <= 25) d.r(tr, -7, 2, 1, W);
}
function papermill(d, work, t, h) {
  // Stirred by hand, the stir's circle is walked across the vat a cell at a
  // time: its angle's cosine is how far across, its sine which way.
  const hand = turning(h);
  let x = PADDLE_MID, dir = 1;
  if (hand) { x = Math.round(PADDLE_MID - PADDLE_REACH * Math.cos(h.ang)); dir = Math.sin(h.ang) >= 0 ? 1 : -1; }
  else if (work) { const p = stirPose(work, t); x = PADDLE_X[p]; dir = p < 2 ? 1 : -1; }
  vat(d);
  if (work || hand) crest(d, x, dir);
  d.r(10, -17, 1, 7, K); d.r(27, -17, 1, 7, K);             // posts
  d.r(9, -18, 20, 1, K);                                    // the line
  for (const sx of [12, 17, 22]) {                          // the sheets, pegged a cell under the line
    d.r(sx, -16, 4, 3, K); cut(d, sx, -16, 4, 3); d.px(sx * P + 2, -14 * P - 2, 4 * P - 4, 2, 2);
    d.px(sx * P + 3, -17 * P, 3, P + 2, K); d.px((sx + 4) * P - 6, -17 * P, 3, P + 2, K);
  }
  d.r(5, -9, 4, 9, K);                                      // the step
  for (let y = -8; y < 0; y += 2) d.px(5 * P + 3, y * P + 1, 4 * P - 6, 2, W);
  d.px(9 * P, -12 * P + 1, (x - 9) * P + 3, 4, K);          // the handle, level from the hand
  d.px(x * P, -12 * P + 1, 4, 7 * P, K);                    // the paddle, plumb
  d.r(x - 0.5, -5, 2, 3, K);                                // its blade in the pulp
}

// --- the workshop: the shed -------------------------------------------------------
// A solid gabled mass with its whole front open, like the shack's cut-out, a
// sign cut white over the door. Inside, a two-deep bench with the sign blank
// stood in it and the body on a slatted stand at the blank's top edge; the
// hammer in two held poses a whole quarter turn apart (up: handle plumb,
// head level; strike: handle level, head plumb), a grey smear between,
// never drawn at a slant.
const WS_SEQ = ['up', 'up', 'up', 'swing', 'strike', 'strike', 'strike', 'strike'], WS_STEP = 0.16;
const STAND_X = 20;
function wsPose(work, t) {
  if (!work) return { pose: 'rest', since: 9 };
  const k = Math.floor(t / WS_STEP), i = k % WS_SEQ.length;
  let j = i; while (j > 0 && WS_SEQ[j - 1] === WS_SEQ[i]) j--;
  return { pose: WS_SEQ[i], since: t - (k - (i - j)) * WS_STEP };
}
// A tap is a blow: the swing for a step, then held on the strike.
function tapPose(h, t) {
  const since = t - h.strike;
  if (since < WS_STEP) return { pose: 'swing', since };
  if (since < WS_STEP * 5) return { pose: 'strike', since: since - WS_STEP };
  return null;
}
// The sign blank stood in the bench, x0..x0+5, rows y0..y0+3.
function signBlank(d, x0, y0 = -8) {
  d.r(x0, y0, 6, 4, K); cut(d, x0, y0, 6, 4);
  d.px(x0 * P + 6, y0 * P + 7, 22, 3, K); d.px(x0 * P + 6, y0 * P + 13, 14, 3, K);
}
function benchKit(d, pose, since) {
  d.r(9, -4, 11, 2, K);                                     // the bench top, two deep
  d.r(10, -2, 2, 2, K); d.r(17, -2, 2, 2, K);               // its legs
  signBlank(d, 11);
  d.r(STAND_X, -6, 3, 6, K);                                // the stand the body works from
  for (const y of [-5, -3, -1]) d.px(STAND_X * P + 3, y * P + 1, 3 * P - 6, 2, W);
  const p = pose === 'rest' ? 'strike' : pose;              // at rest it lies where the last blow left it
  if (p === 'up') { d.px(19 * P + 2, -13 * P, 4, 4 * P, K); d.r(18, -15, 3, 2, K); }
  else if (p === 'swing') {
    d.r(18, -15, 3, 2, 2);                                  // where it was, faint
    d.r(15, -14, 3, 3, 4);                                  // half way, darker
    d.px(17 * P, -10 * P + 1, 3 * P, 4, 4);
  } else {
    d.r(15, -11, 2, 3, K);                                  // the head stood on the blank's edge
    d.px(17 * P, -10 * P + 1, 3 * P + 2, 4, K);             // the handle, level, back to the hand
  }
  if (pose === 'strike') d.fade(1 - since / (4 * WS_STEP), () => {
    d.px(14 * P - 3, -9 * P + 2, 5, 2, K); d.px(14 * P - 2, -11 * P + 2, 2, 5, K);
  });
}
function workshop(d, work, t, h) {
  const { pose, since } = (h && tapPose(h, t)) || wsPose(work, t);
  d.r(5, -18, 21, 1, K);                                    // eaves
  d.r(7, -19, 17, 1, K); d.r(10, -20, 11, 1, K); d.r(13, -21, 5, 1, K);   // the gable, stepped
  d.px(11 * P + 2, -20 * P + 2, 9 * P - 4, P + 4, W);       // a sign over the door, cut white
  d.px(12 * P + 2, -20 * P + 5, 7 * P - 4, 2, K);
  d.r(6, -17, 19, 17, K); d.r(8, -16, 15, 16, W);           // walls and the open front
  benchKit(d, pose, since);
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
    if (!work) return { x: LOG_X0 - 3, y: -3, dx: 0 };
    const f = chFeed(cyc(t, CHIP_T).ph);
    return { x: f.bx, y: -3, dx: f.lean };
  }
  if (key === 'papermill') return { x: 6, y: -12, dx: work ? LEAN[stirPose(work, t)] : 0 };
  if (key === 'workshop') return { x: STAND_X, y: -9, dx: 0 };
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
