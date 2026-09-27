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
import { woundK } from '../deep/serpent.js';
import { BAR_W, BAR_H, BAR_TOP, BAR_PIP, BAR_PIP_GAP, BAR_EDGE, BAR_TRACK, BAR_LEFT, BAR_TRAIL,
         BAR_HEALED, BAR_TO_COME, BAR_TRAIL_HOLD_S, BAR_TRAIL_RATE, SERPENT_WOUND } from '../config.js';

// As fightnums.js: the deep on the dark page is drawn turned, so the bar is too.
const seen = c => darkPage ? turned(c) : c;

let stage = -1, was = 1, trail = 1, low = 1, hitAt = 0, then = 0;

export const barShown = () => S.view === 'deep' && S.snatched && S.serpentStage < SERPENT_WOUND.length;

export function drawSerpentBar() {
  const t = now(), left = 1 - woundK();
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
  const whole = BAR_W + pips * (BAR_PIP + BAR_PIP_GAP);
  const x = Math.round((S.W - whole) / 2), y = BAR_TOP;
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
  }
  ctx.restore();
}
