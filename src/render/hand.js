// The pointing hand: the one mark that says "click this", at the constrict's
// orb, over a station whose Recruit waits on its first choice, and at both
// ends of the portal (the owner, 2026-10-15, option E of
// docs/mocks/hand-glyph-2-2026-10-15/). A drawing only: what it points at is
// what takes the click, or, at the portal, the box the caller hit-tests.

import { P, HAND_STILL_S, HAND_PRESS_S, HAND_PRESS } from '../config.js';
import { GLYPHS } from '../glyphs.js';
import { now } from '../clock.js';
import { ctx } from './ctx.js';

export const HANDS = { down: GLYPHS.hand, up: GLYPHS.handup, left: GLYPHS.handleft };
const STEP = { down: [0, 1], up: [0, -1], left: [-1, 0] };

export const handSize = way => ({ w: HANDS[way][0].length * P, h: HANDS[way].length * P });

// The fingertip's cell, [col, row]: the one line cell on the edge the hand
// points at, so a caller can stand the tip on its target whatever the rows.
export function handTip(way) {
  const rows = HANDS[way], last = rows.length - 1;
  if (way === 'down') return [rows[last].indexOf('#'), last];
  if (way === 'up') return [rows[0].indexOf('#'), 0];
  return [0, rows.findIndex(r => r[0] === '#')];
}

// Held poses, no sine: still, then pressed a whole cell toward the target.
export const handPressed = (t = now()) =>
  (t / 1000) % (HAND_STILL_S + HAND_PRESS_S) >= HAND_STILL_S;

// The hand at its resting top-left (x, y), the press added here so a hit box
// built from the resting place does not twitch with it.
export function drawHand(x, y, way, line, fill, t = now()) {
  const rows = HANDS[way], k = handPressed(t) ? HAND_PRESS * P : 0;
  const ox = x + STEP[way][0] * k, oy = y + STEP[way][1] * k;
  for (const [ch, ink] of [['#', line], ['o', fill]]) {
    ctx.fillStyle = ink;
    rows.forEach((row, r) => [...row].forEach((c, col) => {
      if (c === ch) ctx.fillRect(ox + col * P, oy + r * P, P, P);
    }));
  }
}
