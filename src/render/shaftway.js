// The way through the portal, marked at it (DESIGN.md, "The way between the
// halves"; "Two crews and a portal"): the pointing hand (render/hand.js) in
// the liquid beside the portal in the yard, pointing left at it, and one
// under its deep end, pointing up into it, each tapping toward it. A click
// on either takes the view through. From the wizards' portal on, while the
// camera is not already gliding.

import { P, SHAFT_ARROW_SIDE, SHAFT_ARROW_DOWN, ABYSS_TONES, ABYSS_MAGIC_TONES } from '../config.js';
import { S } from '../state.js';
import { portalCircle, deepPortal } from '../deep/place.js';
import { holeReach } from './portal.js';
import { gliding } from '../view.js';
import { ctx } from './ctx.js';
import { GREYS, PURPLES, PURPLE_RUNG } from './deeptones.js';
import { drawHand, handSize, handTip } from './hand.js';

const UP_BOX = handSize('up'), LEFT_BOX = handSize('left');
const [UP_TIP_C] = handTip('up'), [, LEFT_TIP_R] = handTip('left');
const WHITE = ABYSS_TONES.length - 1;

const snap = v => Math.round(v / P) * P;
// Gone once the fade is spent: from then on the portal's own circle is the
// click and the stop (input.js `onPortal`, stops.js `way:portal`), the hand's
// box no longer is.
export const arrowShown = () => !!S.portalOpen && !gliding() && S.portalHand > 0;
const shown = arrowShown;

// Where the hand rests in its half, top-left, on the grid, the fingertip's
// cell on the portal's middle line. The tap is drawn on top of this
// (drawHand), so the box -- a click's, a pad's focus's (stops.js) -- holds
// still.
export function arrowBox(deep) {
  if (deep) {
    const c = deepPortal();
    return { x: snap(c.x - P / 2) - UP_TIP_C * P, y: snap(c.y + c.r + SHAFT_ARROW_DOWN), ...UP_BOX };
  }
  const c = portalCircle();
  return { x: snap(c.x + holeReach() + SHAFT_ARROW_SIDE), y: snap(c.y - P / 2) - LEFT_TIP_R * P, ...LEFT_BOX };
}

// A click near either: a cell of slack round the drawing, since the sky round
// it does nothing else.
export function onShaftArrow(x, y) {
  if (!shown()) return false;
  const b = arrowBox(S.view === 'deep');
  return x >= b.x - P && x < b.x + b.w + P && y >= b.y - P && y < b.y + b.h + P;
}

// Opacity, not a cut: the hands leave by fading once the round trip is made.
function faded(draw) {
  const was = ctx.globalAlpha;
  ctx.globalAlpha = was * S.portalHand;
  draw();
  ctx.globalAlpha = was;
}

// The deep's line on both: the yard's hand stands in the same black liquid,
// where a black line is lost. The yard draws its tones as seen, the deep
// through its negative (deeptones.js), so each names its own.
export function drawYardArrow() {
  if (shown()) { const b = arrowBox(false); faded(() => drawHand(b.x, b.y, 'left', ABYSS_MAGIC_TONES[PURPLE_RUNG[WHITE - 2]], ABYSS_TONES[WHITE])); }
  ctx.fillStyle = '#000';
}

export function drawDeepArrow() {
  if (shown()) { const b = arrowBox(true); faded(() => drawHand(b.x, b.y, 'up', PURPLES[WHITE - 2], GREYS[WHITE])); }
  ctx.fillStyle = '#000';
}
