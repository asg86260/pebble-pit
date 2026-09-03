// The apothecary: the cauldron on its fire and the animation over it.
// Extracted verbatim from render.js; behavior unchanged. Owns the CAULDRON
// picture and drawApothecary. Shared draw primitives (ctx, withRise,
// risingPlace, bar) are imported from render.js, which stays the core module.

import { P } from '../config.js';
import { S, apothecary } from '../state.js';
import { drawSprite } from '../sprites.js';
import { now } from '../clock.js';
import { boiling, brewFrac } from '../apothecary.js';
import { ctx, withRise, risingPlace, bar } from '../render.js';

// The apothecary: a cauldron on a fire, a bed of herbs beside it, and steam off
// the pot when there is a body stirring it. The steam IS the readout -- the
// lab's chimney rule, word for word -- so a pot with nobody on it stands cold,
// however much crop is in the yard, and you learn it is up from across the
// yard the way you learn the lab is being worked. See `boiling` in apothecary.js.
// The cauldron, as a picture you can hand-draw. One character to a cell:
//   #  iron (black)      o  the pale brew (white)      .  empty
// Retype it to redraw it -- see `drawSprite` in sprites.js. The animated fire,
// bubbles and steam are drawn in code over the top (see drawApothecary); this
// grid is everything that stands still. Keep it an odd number of columns wide so
// it has a true centre for the steam, and if you move the row the brew sits on,
// update CAULDRON_BREW_ROW to match (0 is the top row).
export const CAULDRON = [
  '.....###.....',
  '....#...#....',
  '#############',
  '#ooooooooooo#',
  '..#########..',
  '.###########.',
  '.###########.',
  '..#########..',
  '...#######...',
  '....#####....',
  '...#..#..#...',
  '...#..#..#...',
];
// The row of CAULDRON the brew sits on -- where the bubbles pop and the steam
// lifts off. Counts from the top, 0-based.
export const CAULDRON_BREW_ROW = 3;

export function drawApothecary() {
  const rising = risingPlace() === 'apothecary';
  if (!S.apothecaryOpen && !rising) return;
  const { x, y, w, h } = apothecary;
  withRise(rising, x, S.groundY, w, h, () => {
    const g = S.groundY;
    ctx.fillStyle = '#000';

    // The cauldron is a *picture*, not arithmetic -- draw it by retyping the grid
    // in CAULDRON (above this function). `#` is iron, `o` is the pale brew, `.`
    // is empty. The fire, the bubbles and the steam are animation and stay code
    // below; everything static about the pot -- rim, belly, legs, handle -- is in
    // the grid, so the shape is yours to draw and not mine to guess.
    const potX = x + P * 2;
    const topY = g - CAULDRON.length * P;
    drawSprite(ctx, CAULDRON, potX, topY);

    // Where the animation hangs off the grid: the pool near the top, the fire at
    // the foot, the middle of the pot for the steam. These are cell offsets into
    // the grid, so if you move the brew up or down in CAULDRON, move `BREW_ROW`
    // to match.
    const potMid = potX + Math.round(CAULDRON[0].length / 2) * P;
    const brewY = topY + CAULDRON_BREW_ROW * P;

    // The fire beneath: flames licking up between the legs, uneven and flickering
    // on the clock so it is a live fire and not a fence. The cauldron is always
    // over its fire; the steam and the bubbles are the extra that say a batch is
    // on the boil. See `boiling`.
    const t = now();
    const flames = [[potX + P * 4, 2], [potX + P * 5, 3], [potX + P * 7, 3], [potX + P * 8, 2]];
    for (let i = 0; i < flames.length; i++) {
      const [fx, base] = flames[i];
      const flick = (Math.sin(t / 220 + i * 1.7) > 0.4) ? 1 : 0;   // a tongue leaps
      for (let hy = 0; hy < base + flick; hy++) ctx.fillRect(fx, g - P * (hy + 1), P, P);
    }

    if (boiling()) {
      // Bubbles rising through the brew and breaking its surface.
      for (let bcol = 0; bcol < 5; bcol++) {
        const bx = potX + P * 3 + bcol * P;
        const ph = (t / 560 + bcol * 0.21) % 1;
        if (ph < 0.6) ctx.fillRect(bx, brewY - (ph < 0.3 ? 0 : P), P, P);
      }
      // Steam: wisps off the pool, climbing and fading out near the top.
      for (let k = 0; k < 4; k++) {
        const ph = (t / 900 + k * 0.25) % 1;
        if (ph > 0.85) continue;
        const sway = Math.round(Math.sin(t / 800 + k * 1.4) * 1.5);
        const sx = potMid + (k - 1.5) * P + sway * P;
        const sy = brewY - P * 2 - Math.round(ph * 6) * P;
        ctx.fillRect(Math.round(sx / P) * P, sy, P, P);
      }
    }
  });

  // The brew's progress bar, over the cauldron -- only up while a batch is going.
  // Drawn outside `withRise` so it rides above the pot at full size once the
  // building has finished rising. Uses the yard's one bar, the same the lab and
  // the tower show.
  if (S.apothecaryOpen && !rising && brewFrac() > 0) {
    const potMid = apothecary.x + P * 2 + Math.round(CAULDRON[0].length / 2) * P;
    bar(Math.round(potMid / P) * P, S.groundY - (CAULDRON.length + 3) * P, brewFrac());
  }
}
