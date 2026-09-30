// The serpent's bar: what is left of the defense up, drawn in screen pixels at
// the top of the glass while the camera is in the deep (DESIGN.md, "The
// serpent's bar"). Full at a closed wound, empty at the break; four pips after
// it, one a defense. It reads the sim and keeps only what the picture needs to
// remember: where the bar stood before the last blow (the grey trail) and
// where the last blow left it (the purple the heal has grown back since).

import { S } from '../state.js';
import { ctx } from './ctx.js';
import { now } from '../clock.js';
import { darkPage, turned } from '../ink.js';
import { coilCeiling } from '../deep/place.js';
import { owedWound, landsAt } from './barflight.js';
import { drawFoeStatuses } from './statusicons.js';
import { blowK } from '../deep/serpent.js';
import { BAR_W, BAR_H, BAR_TOP, BAR_GAP, BAR_PIP, BAR_PIP_GAP, BAR_EDGE, BAR_TRACK, BAR_LEFT, BAR_TRAIL,
         BAR_HEALED, BAR_TO_COME, BAR_TRAIL_HOLD_S, BAR_TRAIL_RATE, BAR_STUN, BAR_STUN_RIM,
         BAR_CHIP_MIN, BAR_CHIP_MAX, BAR_CHIP_S, BAR_CHIP_OPEN_S, BAR_CHIP_POSE_S, BAR_CHIP_FALL, BAR_CHIP, BAR_KNOCK, BAR_KNOCK_BIG, BAR_KNOCK_S, NUM_KICK_BIG, STATUS_GAP, STATUS_PX,
         SERPENT_WOUND } from '../config.js';

// As fightnums.js: the deep on the dark page is drawn turned, so the bar is too.
const seen = c => darkPage ? turned(c) : c;

let stage = -1, was = 1, trail = 1, low = 1, hitAt = 0, then = 0;

export const barShown = () => S.view === 'deep' && S.snatched && S.serpentStage < SERPENT_WOUND.length;

// Where the bar stands on the glass, in screen pixels: centered with its pips,
// held still just over the highest the coil ever sways.
export function barRect() {
  const whole = BAR_W + SERPENT_WOUND.length * (BAR_PIP + BAR_PIP_GAP);
  // The row of status tiles hangs under the bar, so the gap to the coil is
  // measured from the bottom of the row, whether or not it has a tile in it.
  const row = STATUS_GAP + 1 + 5 * STATUS_PX + 4 + 4;
  const over = (coilCeiling() - S.camY) * S.zoom - BAR_GAP - row - BAR_H;
  return { x: Math.round((S.W - whole) / 2), y: Math.round(Math.max(BAR_TOP, over)), w: BAR_W, h: BAR_H };
}
// What the bar shows of the defense up, 0..1: the wound as the numbers that
// have landed in it say, not yet as the sim has it (render/barflight.js).
export function barLeft(t) {
  const d = SERPENT_WOUND[Math.min(S.serpentStage, SERPENT_WOUND.length - 1)];
  return d > 0 ? 1 - Math.max(0, Math.min(1, (S.serpentWound + owedWound(t)) / d)) : 1;
}

export function drawSerpentBar() {
  const t = now(), left = barLeft(t);
  // A new defense starts full, with nothing to remember.
  if (S.serpentStage !== stage) { stage = S.serpentStage; was = trail = low = left; hitAt = t; }
  const dt = Math.max(0, (t - then) / 1000);
  then = t;
  // A blow: the bar drops, the trail holds where it stood, and the heal's
  // purple is measured up from here.
  if (left < was) { low = left; hitAt = t; }
  was = left;
  if (left >= trail) trail = left;
  else if ((t - hitAt) / 1000 > BAR_TRAIL_HOLD_S) trail = Math.max(left, trail - BAR_TRAIL_RATE * dt);
  if (low > left) low = left;

  const pips = SERPENT_WOUND.length;
  const { x, y: rest } = barRect();
  // The number went in from underneath, so the bar recoils up: two held
  // poses, the full knock and then half of it.
  let knock = 0;
  for (const h of S.hits) {
    if (h.weapon === 'heal') continue;
    const a = (t - landsAt(h)) / 1000;
    if (a < 0 || a >= BAR_KNOCK_S) continue;
    const full = blowK(h.done) > NUM_KICK_BIG ? BAR_KNOCK_BIG : BAR_KNOCK;
    knock = Math.max(knock, a < BAR_KNOCK_S / 2 ? full : full / 2);
  }
  const y = rest - knock;
  const fill = (c, fx, fy, w, h) => { ctx.fillStyle = seen(c); ctx.fillRect(fx, fy, w, h); };
  const len = k => Math.round(BAR_W * k);
  ctx.save();
  ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
  fill(BAR_EDGE, x - 1, y - 1, BAR_W + 2, BAR_H + 2);
  fill(BAR_TRACK, x, y, BAR_W, BAR_H);
  fill(BAR_TRAIL, x, y, len(trail), BAR_H);
  fill(BAR_HEALED, x, y, len(left), BAR_H);
  fill(BAR_LEFT, x, y, len(Math.min(low, left)), BAR_H);
  for (let s = 0; s < pips; s++) {
    const px = x + BAR_W + BAR_PIP_GAP + s * (BAR_PIP + BAR_PIP_GAP);
    const py = y + Math.round((BAR_H - BAR_PIP) / 2);
    fill(BAR_EDGE, px - 1, py - 1, BAR_PIP + 2, BAR_PIP + 2);
    fill(s < S.serpentStage ? BAR_TRACK : s === S.serpentStage ? BAR_LEFT : BAR_TO_COME, px, py, BAR_PIP, BAR_PIP);
    // Stunned, the heal is stopped: the defense's own pip is held open, a
    // ring of the heal's purple round nothing, for as long as it lasts.
    if (s === S.serpentStage && S.serpentStun > 0) {
      fill(BAR_STUN, px, py, BAR_PIP, BAR_PIP);
      fill(BAR_TRACK, px + BAR_STUN_RIM, py + BAR_STUN_RIM, BAR_PIP - BAR_STUN_RIM * 2, BAR_PIP - BAR_STUN_RIM * 2);
    }
  }
  // Every blow that has landed lately knocks a chip out of the fill's end.
  const end = x + len(left);
  for (const h of S.hits) {
    if (h.weapon === 'heal') continue;
    const a = (t - landsAt(h)) / 1000;
    if (a < 0 || a >= BAR_CHIP_S) continue;
    const w = Math.round(BAR_CHIP_MIN + blowK(h.done) * (BAR_CHIP_MAX - BAR_CHIP_MIN)), half = BAR_H / 2;
    const lit = a < BAR_CHIP_POSE_S, dir = h.side % 2 ? 1 : -1;
    if (a < BAR_CHIP_OPEN_S) fill(lit ? BAR_CHIP : BAR_TRACK, end - w, h.side % 2 ? y : y + half, w, half);
    // the chip, out of the notch and down past the bar, turned over a pose at a time
    const flat = Math.floor(a / BAR_CHIP_POSE_S) % 2 === 0;
    const cx = end - w / 2 + dir * BAR_CHIP_FALL.side * a, cy = y + BAR_CHIP_FALL.down * a + BAR_CHIP_FALL.grav * a * a;
    const cw = flat ? w : Math.ceil(w / 2), ch = flat ? half : Math.ceil(w / 2);
    fill(lit ? BAR_LEFT : BAR_CHIP, Math.round(cx - cw / 2), Math.round(cy + (h.side % 2 ? 0 : half)), cw, ch);
  }
  // what the fighters have laid on the serpent, in a row under the bar
  drawFoeStatuses(x, y + BAR_H + STATUS_GAP + 1);
  ctx.restore();
}
