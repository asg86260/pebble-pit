// The way through the surface, marked at the shaft (DESIGN.md, "The way
// between the halves"): a pixel arrow bobbing over the plank in the yard,
// pointing down, and one rising in the shaft's light in the deep, pointing
// up. A click on either takes the view through, as a click on the surface or
// the ceiling does; the arrow is only there to say that it can. From the
// snatch on, while the camera is not already gliding.

import { P, SHAFT_ARROW_UP, SHAFT_ARROW_DOWN, SHAFT_ARROW_BOB, SHAFT_ARROW_MS } from '../config.js';
import { S } from '../state.js';
import { now } from '../clock.js';
import { mouthX, deepTop } from '../deep/place.js';
import { abyssLine } from '../pit.js';
import { gliding } from '../view.js';
import { ctx } from './ctx.js';
import { GREYS } from './deep.js';

// A chevron five cells across and three deep, point down; turned over for up.
const CHEVRON = ['#####', '.###.', '..#..'];
const W = CHEVRON[0].length * P, H = CHEVRON.length * P;

const snap = v => Math.round(v / P) * P;
const shown = () => !!S.snatched && !gliding();

// Where the arrow is in its half, top-left, on the grid. The bob is a whole
// cell up and down on a slow sine, so it moves a cell at a time and never
// sits half off the grid.
const bob = () => snap(Math.sin(now() / SHAFT_ARROW_MS * Math.PI * 2) * SHAFT_ARROW_BOB);
export function arrowBox(deep) {
  const x = snap(mouthX() - W / 2);
  const y = deep ? snap(deepTop() + SHAFT_ARROW_DOWN) - bob() : snap(abyssLine() - SHAFT_ARROW_UP) + bob();
  return { x, y, w: W, h: H };
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
  if (shown()) paint(arrowBox(false), false, '#000');
  ctx.fillStyle = '#000';
}

export function drawDeepArrow() {
  if (shown()) paint(arrowBox(true), true, GREYS[GREYS.length - 1]);
  ctx.fillStyle = '#000';
}
