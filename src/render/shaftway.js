// The way through the portal, marked at it (DESIGN.md, "The way between the
// halves"; "Two crews and a portal"): a pixel arrow bobbing in the liquid
// beside the portal in the yard, pointing down, and one under its deep end, pointing up into
// it. A click on either takes the view through. From the
// wizards' portal on, while the camera is not already gliding.

import { P, SHAFT_ARROW_SIDE, SHAFT_ARROW_DOWN, SHAFT_ARROW_BOB, SHAFT_ARROW_MS, ABYSS_TONES } from '../config.js';
import { S } from '../state.js';
import { now } from '../clock.js';
import { portalCircle, deepPortal } from '../deep/place.js';
import { holeReach } from './portal.js';
import { gliding } from '../view.js';
import { ctx } from './ctx.js';
import { GREYS } from './deep.js';

// A chevron five cells across and three deep, point down; turned over for up.
const CHEVRON = ['#####', '.###.', '..#..'];
const W = CHEVRON[0].length * P, H = CHEVRON.length * P;

const snap = v => Math.round(v / P) * P;
const shown = () => !!S.portalOpen && !gliding();

// Where the arrow is in its half, top-left, on the grid. The bob is a whole
// cell up and down on a slow sine, so it moves a cell at a time and never
// sits half off the grid.
const bob = () => snap(Math.sin(now() / SHAFT_ARROW_MS * Math.PI * 2) * SHAFT_ARROW_BOB);
export function arrowBox(deep) {
  if (deep) {
    const c = deepPortal();
    return { x: snap(c.x - W / 2), y: snap(c.y + c.r + SHAFT_ARROW_DOWN) - bob(), w: W, h: H };
  }
  const c = portalCircle();
  return { x: snap(c.x + holeReach() + SHAFT_ARROW_SIDE), y: snap(c.y - H / 2) + bob(), w: W, h: H };
}

// A click near either: a cell of slack round the drawing, since it is small
// and the sky round it does nothing else.
export function onShaftArrow(x, y) {
  if (!shown()) return false;
  const b = arrowBox(S.view === 'deep');
  return x >= b.x - P && x < b.x + b.w + P && y >= b.y - P && y < b.y + b.h + P;
}

function paint(b, up, ink) {
  ctx.fillStyle = ink;
  CHEVRON.forEach((row, r) => [...row].forEach((ch, c) => {
    if (ch === '#') ctx.fillRect(b.x + c * P, b.y + (up ? CHEVRON.length - 1 - r : r) * P, P, P);
  }));
}

export function drawYardArrow() {
  if (shown()) paint(arrowBox(false), false, ABYSS_TONES[ABYSS_TONES.length - 1]);   // light, on the liquid
  ctx.fillStyle = '#000';
}

export function drawDeepArrow() {
  if (shown()) paint(arrowBox(true), true, GREYS[GREYS.length - 1]);
  ctx.fillStyle = '#000';
}
