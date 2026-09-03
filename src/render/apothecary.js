// The apothecary: the cauldron on its fire and the animation over it.
// Extracted verbatim from render.js; behavior unchanged. Owns the CAULDRON
// picture and drawApothecary. Shared draw primitives (ctx, withRise,
// risingPlace, bar) are imported from render.js, which stays the core module.

import { P } from '../config.js';
import { S, apothecary } from '../state.js';
import { drawSprite } from '../sprites.js';
import { now } from '../clock.js';
import { boiling, brewFrac, TONICS } from '../apothecary.js';
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
  '#############',
  '.###########.',
  '#############',
  '#############',
  '#############',
    '#############',
  '#############',
  '.###########.',
  '..#########..',
  '..#.......#..',
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
    // The stock shelf on the far left: the tonics you can brew, each a little
    // vial of its own colour standing on a shelf, so what is on offer reads from
    // across the yard. A post holds the shelf up; the vials sit on it in the order
    // TONICS lists them.
    const shelfY = g - P * 5;
    ctx.fillStyle = '#000';
    ctx.fillRect(x + P, shelfY, P * (TONICS.length * 2 + 1), P);   // the shelf
    ctx.fillRect(x + P, shelfY + P, P, P * 3);                     // a post under its left end
    for (let i = 0; i < TONICS.length; i++) {
      const vx = x + P * (2 + i * 2);
      ctx.fillStyle = '#000';
      ctx.fillRect(vx, shelfY - P * 3, P, P);                      // cork
      ctx.fillStyle = TONICS[i].color;
      ctx.fillRect(vx, shelfY - P * 2, P, P * 2);                  // the coloured brew
    }
    ctx.fillStyle = '#000';

    // The cauldron is a *picture*, not arithmetic -- draw it by retyping the grid
    // in CAULDRON (above this function). `#` is iron, `o` is the pale brew, `.`
    // is empty. The fire, the bubbles and the steam are animation and stay code
    // below; everything static about the pot -- rim, belly, legs, handle -- is in
    // the grid, so the shape is yours to draw and not mine to guess.
    const potX = x + P * 10;                // pot on the right; shelf and stirrer to its left
    const topY = g - CAULDRON.length * P;
    drawSprite(ctx, CAULDRON, potX, topY);

    // Where the animation hangs off the grid: the pool near the top, the fire at
    // the foot, the middle of the pot for the steam. These are cell offsets into
    // the grid, so if you move the brew up or down in CAULDRON, move `BREW_ROW`
    // to match.
    const potMid = potX + Math.round(CAULDRON[0].length / 2) * P;
    const brewY = topY + CAULDRON_BREW_ROW * P;

    // The fire, the bubbles and the steam are all drawn only while a batch is on
    // the boil -- so an idle cauldron is *exactly* the CAULDRON grid, nothing
    // added underneath it. The fire used to be drawn always, and its flames stood
    // up at the foot like a second set of legs whether or not the grid had any;
    // now the pot you draw is the pot you get, and the fire is part of what says
    // it is being worked. See `boiling`.
    const t = now();
    if (boiling()) {
      // The fire beneath: a few coloured flame *tongues*, not scattered flecks --
      // the one place the yard breaks its black-and-white (like the sparks and the
      // star). Each tongue is a short run of cells that burns hot yellow at its
      // foot, through orange, to a red tip that leaps on the clock; the middle one
      // stands tallest, so the shape reads as a flame. They lick only a little way
      // up the belly and no higher -- the fire licks the pot, it does not shoot
      // past the rim.
      const HOT = '#ffd23f', MID = '#f5851f', TIP = '#e8402a';
      // The fire is ONE body of flame, not three fingers: a continuous bed of
      // cells across the foot of the pot whose top edge is jagged and living.
      // Driven by value noise rather than clean sines now, so the crests rise and
      // fall at random heights and the top never falls into a repeating ripple.
      // The noise is smooth -- hashed samples eased between -- so it stays lively
      // without the per-frame strobe that raw randomness gives. A gentle centre
      // hump keeps it a touch taller in the middle; colour runs hot yellow at the
      // base through orange to a red top edge; capped low, below the rim.
      const hash = n => { const s = Math.sin(n * 12.9898) * 43758.5453; return s - Math.floor(s); };
      const vnoise = x => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
                            return hash(i) + (hash(i + 1) - hash(i)) * u; };   // 0..1, smooth
      const bedL = potX + P * 3, cols = 7, mid = (cols - 1) / 2;
      for (let c = 0; c < cols; c++) {
        const hump = (1 - Math.abs(c - mid) / mid) * 0.9;    // lowered centre hump
        // Each column gets its OWN noise stream that only moves in time -- the big
        // per-column offsets (17.3, 11.9) put neighbours far apart in noise space
        // so they are uncorrelated and flicker independently in place. The old
        // small offsets made neighbours nearly the same value one step apart,
        // which is a travelling wave -- the fire looked like it was all sliding
        // left. Now it just rises and falls where it stands.
        const n = vnoise(c * 17.3 + t / 130) * 2.4           // this column's own flicker
                + vnoise(c * 11.9 + 40 + t / 260) * 1.2;     // a slower second stream
        const h = Math.max(0, Math.min(5, Math.round(0.4 + hump + n)));
        const fx = bedL + c * P;
        for (let hy = 0; hy < h; hy++) {
          const frac = hy / Math.max(1, h);
          ctx.fillStyle = frac < 0.34 ? HOT : frac < 0.72 ? MID : TIP;
          ctx.fillRect(fx, g - P - hy * P, P, P);
        }
      }
      // Embers: a stray spark or two lifting off the fire and winking out, kept
      // low against the belly so they read as the fire's own sparks.
      for (let e = 0; e < 3; e++) {
        const ph = (t / 520 + e * 0.33) % 1;
        if (ph > 0.6) continue;
        const ex = potX + P * (4 + e * 2) + Math.round(Math.sin(t / 200 + e)) * P;
        const ey = g - P * 4 - Math.round(ph * 3) * P;
        ctx.fillStyle = (e % 2) ? MID : TIP;
        ctx.fillRect(Math.round(ex / P) * P, ey, P, P);
      }
      // A wisp of smoke off the fire -- a mote or two lifting up the belly and
      // thinning out, kept below the rim so it stays part of the fire rather than
      // a column climbing the sky.
      ctx.fillStyle = '#3a3a3a';
      for (let s = 0; s < 2; s++) {
        const ph = (t / 900 + s * 0.5) % 1;
        if (ph > 0.8 || (Math.floor(t / 130 + s) % 2 === 0)) continue;
        const sway = Math.round(Math.sin(t / 700 + s * 1.3));
        const sx = potX + P * (5 + s * 3) + sway * P;
        const sy = Math.max(topY + P, g - P * 3 - Math.round(ph * 5) * P);
        ctx.fillRect(Math.round(sx / P) * P, sy, P, P);
      }
      ctx.fillStyle = '#000';
      // Bubbles rising through the brew and breaking its surface.
      for (let bcol = 0; bcol < 5; bcol++) {
        const bx = potX + P * 3 + bcol * P;
        const ph = (t / 560 + bcol * 0.21) % 1;
        if (ph < 0.6) ctx.fillRect(bx, brewY - (ph < 0.3 ? 0 : P), P, P);
      }
      // Steam: grey wisps off the pool -- more of them than before, spread wider
      // and climbing higher, fading out near the top. Grey, not black, so it
      // reads as vapour rising rather than soot.
      ctx.fillStyle = '#9a9a9a';
      for (let k = 0; k < 9; k++) {
        const ph = (t / 850 + k * 0.11) % 1;
        if (ph > 0.9) continue;
        const sway = Math.round(Math.sin(t / 760 + k * 1.4) * 2);
        const sx = potMid + Math.round((k - 4) * 0.8) * P + sway * P;
        const sy = brewY - P * 2 - Math.round(ph * 8) * P;
        ctx.fillRect(Math.round(sx / P) * P, sy, P, P);
      }
      ctx.fillStyle = '#000';
    }
  });

  // The brew's progress bar, over the cauldron -- only up while a batch is going.
  // Drawn outside `withRise` so it rides above the pot at full size once the
  // building has finished rising. Uses the yard's one bar, the same the lab and
  // the tower show.
  if (S.apothecaryOpen && !rising && brewFrac() > 0) {
    const potMid = apothecary.x + P * 10 + Math.round(CAULDRON[0].length / 2) * P;
    bar(Math.round(potMid / P) * P, S.groundY - (CAULDRON.length + 6) * P, brewFrac());
  }
}
