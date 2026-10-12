// The yard held around a scene, as drawn (the owner's C, "held still,
// letterboxed"): everything the scene is not about settles to
// CUT_RECEDE_INK, the bystanders fade out altogether, and two flat bands step
// in at the top and the foot of the window.
//
// The recede is one wash, not an alpha on every layer: a layer drawn faint
// shows whatever is behind it through its own white, and the yard is mostly
// white shapes over black ones. So the picture is painted as ever, less the
// layers the scene is about, then washed toward the page in one fill, and
// those layers painted over it at full ink (render.js, `drawHalf`). Bodies
// are sorted inside their layers, since the crew's layer holds the pair and
// the haulers both: `bodyInk` says how much of a body each pass draws.

import { CELL, CUT_BAND_SHARE, CUT_BAND_RULE_PX, CUT_BAND_RULE_TONE, CUT_RECEDE_INK, ABYSS_TONES } from '../config.js';
import { S } from '../state.js';
import { recede } from '../cutscene.js';
import { roleOf } from '../stage.js';
import { darkPage, turned } from '../ink.js';
import { canvas, ctx } from './ctx.js';

// Which half of the picture is being painted: the receding yard ('back') or
// the scene's own layers over the wash ('front').
let pass = 'back';
export const setPass = p => { pass = p; };
export const inFront = () => pass === 'front';

// How much of a body this pass draws: the leads only in front and in full; an
// attacker behind, at full before the wash takes it down; a bystander behind,
// fading out as the yard recedes, so it is gone by the time the scene holds.
// With nothing held, everybody behind at full.
export function bodyInk(w) {
  const r = recede();
  if (r <= 0) return pass === 'back' ? 1 : 0;
  const role = roleOf(w);
  if (role === 'lead') return pass === 'front' ? 1 : 0;
  if (pass === 'front') return 0;
  return role === 'held' ? 1 : 1 - r;
}

// The bystanders' share, for a layer that is nothing but bystanders (the
// deep's fish).
export const byInk = () => 1 - recede();

// The wash: the page's white over everything painted so far, at the share of
// ink the yard gives up. In device pixels, over the whole glass; the deep's
// negative is turned after it, so there the background settles toward the
// liquid's black just the same.
export function wash() {
  const r = recede();
  if (r <= 0) return;
  ctx.save();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.globalAlpha = r * (1 - CUT_RECEDE_INK);
  ctx.fillStyle = '#fff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.restore();
  ctx.fillStyle = '#000';
}

// The share of ink left on a background layer painted after the wash.
export const backInk = () => 1 - recede() * (1 - CUT_RECEDE_INK);

// The yard's reading -- the counter, the rosters and their counts, the
// pile-full marks -- is in no scene: it fades right out with the recede and
// comes back with it, on the same number. The call to build the bench, which
// is the page's, reads it too (board.js, `seatCall`).
export const hudInk = () => 1 - recede();

// How many cells deep each band stands at full: a share of the window's
// height, in whole cells of the window's grid.
export const bandCells = () => Math.max(1, Math.round(S.H * CUT_BAND_SHARE / CELL));

// The bands: a cell of the window's own grid a step, stepping in and out with
// the hush rather than sliding, flat black over the finished picture. In the
// deep that black is the water's own, so a rule of the deep's light tone
// stands on each band's inner edge; drawn after the deep's negative, its tone
// is written as seen (render/fightnums.js).
const seen = c => darkPage ? turned(c) : c;
export function drawLetterbox() {
  const n = Math.round(S.hush * bandCells());
  if (n <= 0) return;
  const h = n * CELL;
  ctx.fillStyle = '#000';
  ctx.fillRect(0, 0, S.W, h);
  ctx.fillRect(0, S.H - h, S.W, h);
  if (S.view !== 'deep') return;
  ctx.fillStyle = seen(ABYSS_TONES[CUT_BAND_RULE_TONE]);
  ctx.fillRect(0, h - CUT_BAND_RULE_PX, S.W, CUT_BAND_RULE_PX);
  ctx.fillRect(0, S.H - h, S.W, CUT_BAND_RULE_PX);
  ctx.fillStyle = '#000';
}
