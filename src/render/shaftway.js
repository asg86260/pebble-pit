// The way through the portal, marked at it (DESIGN.md, "The way between the
// halves"; "Two crews and a portal"): a pixel arrow in the liquid beside the
// portal in the yard, pointing left at it and bobbing toward it and back, and
// one under its deep end, pointing up into it and bobbing up and down. A click
// on either takes the view through. From the wizards' portal on, while the
// camera is not already gliding.

import { P, SHAFT_ARROW_SIDE, SHAFT_ARROW_DOWN, SHAFT_ARROW_BOB, SHAFT_ARROW_MS, ABYSS_TONES } from '../config.js';
import { S } from '../state.js';
import { now } from '../clock.js';
import { portalCircle, deepPortal } from '../deep/place.js';
import { holeReach } from './portal.js';
import { gliding } from '../view.js';
import { ctx } from './ctx.js';
import { GREYS } from './deep.js';

// The deep's chevron, five cells across and three deep, point up; the yard's
// is the same chevron on its side, three across and five deep, point left at
// the portal.
const UP = ['..#..', '.###.', '#####'];
const LEFT = ['..#', '.##', '###', '.##', '..#'];
const size = rows => ({ w: rows[0].length * P, h: rows.length * P });
const UP_BOX = size(UP), LEFT_BOX = size(LEFT);

const snap = v => Math.round(v / P) * P;
const shown = () => !!S.portalOpen && !gliding();

// Where the arrow is in its half, top-left, on the grid. The bob is a whole
// cell each way on a slow sine, so it moves a cell at a time and never sits
// half off the grid: along the line each arrow points, up and down in the
// deep, toward the portal's lip and back in the yard.
const bob = () => snap(Math.sin(now() / SHAFT_ARROW_MS * Math.PI * 2) * SHAFT_ARROW_BOB);
export function arrowBox(deep) {
  if (deep) {
    const c = deepPortal();
    return { x: snap(c.x - UP_BOX.w / 2), y: snap(c.y + c.r + SHAFT_ARROW_DOWN) - bob(), ...UP_BOX };
  }
  const c = portalCircle();
  return { x: snap(c.x + holeReach() + SHAFT_ARROW_SIDE) + bob(), y: snap(c.y - LEFT_BOX.h / 2), ...LEFT_BOX };
}

// A click near either: a cell of slack round the drawing, since it is small
// and the sky round it does nothing else.
export function onShaftArrow(x, y) {
  if (!shown()) return false;
  const b = arrowBox(S.view === 'deep');
  return x >= b.x - P && x < b.x + b.w + P && y >= b.y - P && y < b.y + b.h + P;
}

function paint(b, rows, ink) {
  ctx.fillStyle = ink;
  rows.forEach((row, r) => [...row].forEach((ch, c) => {
    if (ch === '#') ctx.fillRect(b.x + c * P, b.y + r * P, P, P);
  }));
}

export function drawYardArrow() {
  if (shown()) paint(arrowBox(false), LEFT, ABYSS_TONES[ABYSS_TONES.length - 1]);   // light, on the liquid
  ctx.fillStyle = '#000';
}

export function drawDeepArrow() {
  if (shown()) paint(arrowBox(true), UP, GREYS[GREYS.length - 1]);
  ctx.fillStyle = '#000';
}
