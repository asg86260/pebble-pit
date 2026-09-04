// The apothecary, left to right: the hut, the bookshelf of stock, and the row of
// pots on their fires (item 18's order -- you meet the building, then what it
// holds, then what it is doing). Owns the HUT and CAULDRON pictures, the shelf,
// and the count badges over it. Shared draw primitives (ctx, withRise,
// risingPlace, bar) come from ./ctx.js, ./rise.js and ./bars.js.

import { P, APOTH_HUT_W, APOTH_HUT_H, APOTH_SHELF_W, APOTH_SHELF_H,
         APOTH_GAP, APOTH_POT_ROW, POT_PITCH,
         FLAME_HOT, FLAME_TIP, FLAME_STEAM } from '../config.js';
import { S, apothecary } from '../state.js';
import { drawSprite } from '../sprites.js';
import { now } from '../clock.js';
import { vnoise } from './flicker.js';
import { potBoiling, brewFracOf, potTonicOf, doseStock, TONICS } from '../apothecary.js';
import { bar } from './bars.js';
import { ctx } from './ctx.js';
import { risingPlace, withRise } from './rise.js';

// --- the two pictures ---------------------------------------------------------
// One character to a cell: `#` is timber (black), `.` is empty. Retype either to
// redraw it -- see `drawSprite` in sprites.js. Everything that moves -- the fire,
// the bubbles, the steam -- is drawn in code over the top.

// The hut: the main building (item 17). It is what the board belongs to and what
// the whole place is called, so it stands first and it stands up -- a gable, two
// window slits and a doorway you could walk a crate of vials through.
export const HUT = [
  '....##....',
  '...####...',
  '..######..',
  '.########.',
  '##########',
  '##########',
  '#.#....#.#',
  '#.#....#.#',
  '###....###',
  '###....###'
];

// The cauldron, unchanged since the day it was drawn: the fat belly, the neck
// under the rim and the two little legs. Four of them stand side by side now,
// and the answer to that is four cauldrons' worth of ground (see POT_PITCH), not
// a smaller pot -- the pot is the picture the building is known by.
// Keep it an odd number of columns so it has a true centre for the steam, and if
// you move the row the brew sits on, update CAULDRON_BREW_ROW to match.
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
  '..#.......#..'
];
// The row of CAULDRON the brew sits on -- where the bubbles pop and the steam
// lifts off. Counts from the top, 0-based.
export const CAULDRON_BREW_ROW = 3;

// --- per-cell variation -------------------------------------------------------
// Timber is not one flat black. A stable hash of the cell's own coordinates
// picks its tone, so a wall reads as boards rather than as printed paint and
// does not strobe from frame to frame the way `shadeNear`'s dice would. Kept
// very dark: this is grain in a black mass, not a grey building.
const BOARD = ['#000', '#0b0b0b', '#151515', '#060606'];
const grain = (c, r) => BOARD[Math.abs((c * 73856093) ^ (r * 19349663)) % BOARD.length];

// One character grid, drawn cell by cell with the grain on it. `drawSprite` is
// the right tool for a shape in one colour; the hut wants a tone per cell.
function drawGrained(rows, x, y) {
  for (let r = 0; r < rows.length; r++)
    for (let c = 0; c < rows[r].length; c++) {
      if (rows[r][c] !== '#') continue;
      ctx.fillStyle = grain(c, r);
      ctx.fillRect(x + c * P, y + r * P, P, P);
    }
}

// --- a tonic's fire -----------------------------------------------------------
// Each pot's flame runs its own brew's colour (item 18): washed out toward white
// at the foot where it is hottest, the tonic's own colour through the middle,
// and taken down toward black at the tip. So which pot is on which recipe reads
// from across the yard, without a label and without three fires that all look
// the same. A tonic that has somehow no colour falls back to the old fire.
const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mix = (h, toward, amt) => {
  const [r, g, b] = hex(h);
  const f = v => Math.round(v + (toward - v) * amt);
  return `rgb(${f(r)},${f(g)},${f(b)})`;
};
function flameOf(key) {
  const t = TONICS.find(x => x.key === key);
  const c = t ? t.color : '#f5851f';
  // The foot is the brew washed out toward white, the middle a shade of it, and
  // the tip the brew at full strength -- the old fire's hot-yellow-to-red run,
  // read in one colour instead of three.
  return { hot: mix(c, 255, FLAME_HOT), mid: mix(c, 255, FLAME_TIP), tip: c,
           steam: mix(c, 154, 1 - FLAME_STEAM) };
}

// Where each pot stands, measured off the building's own left edge.
export const potX = i => apothecary.x + APOTH_POT_ROW + i * POT_PITCH;

// --- the bookshelf ------------------------------------------------------------
// Stock is per tonic now (item 13), so the stock is drawn as a bookshelf with a
// shelf to a tonic: what is standing on each one is that brew and no other, and
// turning a pot from stew to brace plainly does not empty the stew shelf. The
// number on each shelf is drawn in screen pixels by `drawStockCount` below --
// the vials say which brew and roughly how much, the badge says exactly.
const SHELF_ROWS = 3;                    // cells a compartment stands, board included
const shelfTop = () => S.groundY - APOTH_SHELF_H;
// The top of tonic `i`'s compartment, and the board it stands on.
export const shelfY = i => shelfTop() + P + i * SHELF_ROWS * P;
export const shelfX = () => apothecary.x + APOTH_HUT_W + APOTH_GAP;

function drawShelves() {
  const x = shelfX(), top = shelfTop(), g = S.groundY;
  const cols = Math.round(APOTH_SHELF_W / P);
  // The case: two uprights to the ground and a cap over them.
  for (let r = 0; r * P < g - top; r++) {
    ctx.fillStyle = grain(0, r); ctx.fillRect(x, top + r * P, P, P);
    ctx.fillStyle = grain(cols - 1, r); ctx.fillRect(x + (cols - 1) * P, top + r * P, P, P);
  }
  for (let c = 0; c < cols; c++) {
    ctx.fillStyle = grain(c, 0); ctx.fillRect(x + c * P, top, P, P);
  }

  for (let i = 0; i < TONICS.length; i++) {
    const t = TONICS[i];
    const y = shelfY(i);
    const board = y + (SHELF_ROWS - 1) * P;              // the plank it all stands on
    for (let c = 1; c < cols - 1; c++) {
      ctx.fillStyle = grain(c, i * SHELF_ROWS + 3);
      ctx.fillRect(x + c * P, board, P, P);
    }
    // A tick of the brew's own colour at the near end of every board: which
    // shelf is which has to be legible when the shelf is empty, and an empty
    // shelf is exactly when you are asking.
    ctx.fillStyle = t.color;
    ctx.fillRect(x + P, board, P, P);
    // ...and a vial standing for each dose in stock, up to what the shelf holds.
    const room = cols - 3;
    const n = Math.min(room, doseStock(t.key));
    for (let v = 0; v < n; v++) {
      const vx = x + (2 + v) * P;
      ctx.fillStyle = '#000';
      ctx.fillRect(vx, y, P, P);                          // the cork
      ctx.fillStyle = t.color;
      ctx.fillRect(vx, y + P, P, P);                      // and the brew in it
    }
  }
}

// --- one pot ------------------------------------------------------------------
function drawPot(i, g) {
  const px = potX(i);
  const topY = g - CAULDRON.length * P;
  ctx.fillStyle = '#000';
  drawSprite(ctx, CAULDRON, px, topY);

  // Where the animation hangs off the grid: the pool near the top, the fire at
  // the foot, the middle of the pot for the steam. These are cell offsets into
  // the grid, so if you move the brew up or down in CAULDRON, move
  // CAULDRON_BREW_ROW to match.
  const potMid = px + Math.round(CAULDRON[0].length / 2) * P;
  const brewY = topY + CAULDRON_BREW_ROW * P;

  // The fire, the bubbles and the steam are all drawn only while a batch is on
  // the boil -- so an idle cauldron is *exactly* the CAULDRON grid, nothing
  // added underneath it. The fire used to be drawn always, and its flames stood
  // up at the foot like a second set of legs whether or not the grid had any;
  // now the pot you draw is the pot you get, and the fire is part of what says
  // it is being worked. See `potBoiling`.
  if (!potBoiling(i)) return;
  const t = now();
  const fire = flameOf(potTonicOf(i));

  // The fire is ONE body of flame, not three fingers: a continuous bed of cells
  // across the foot of the pot whose top edge is jagged and living. Driven by
  // value noise rather than clean sines, so the crests rise and fall at random
  // heights and the top never falls into a repeating ripple. The noise is smooth
  // -- hashed samples eased between -- so it stays lively without the per-frame
  // strobe raw randomness gives. A gentle centre hump keeps it a touch taller in
  // the middle; the colour ramp is the pot's own brew (see `flameOf`); capped
  // low, below the rim. `vnoise` is shared with the tonic burning off a dosed
  // body -- the two fires in this game should flicker with the same hand.
  const bedL = px + P * 3, cols = 7, mid = (cols - 1) / 2;
  // Each pot's fire is given its own place in the noise, so four pots side by
  // side do not all flicker in step like one long fire cut into four.
  const seed = i * 613.7;
  for (let c = 0; c < cols; c++) {
    const hump = (1 - Math.abs(c - mid) / mid) * 0.9;
    // Each column gets its OWN noise stream that only moves in time -- the big
    // per-column offsets (17.3, 11.9) put neighbours far apart in noise space so
    // they are uncorrelated and flicker independently in place. Small offsets
    // made neighbours nearly the same value one step apart, which is a
    // travelling wave: the fire looked like it was sliding left.
    const n = vnoise(seed + c * 17.3 + t / 130) * 2.4
            + vnoise(seed + c * 11.9 + 40 + t / 260) * 1.2;
    const h = Math.max(0, Math.min(5, Math.round(0.4 + hump + n)));
    const fx = bedL + c * P;
    for (let hy = 0; hy < h; hy++) {
      const frac = hy / Math.max(1, h);
      ctx.fillStyle = frac < 0.34 ? fire.hot : frac < 0.72 ? fire.mid : fire.tip;
      ctx.fillRect(fx, g - P - hy * P, P, P);
    }
  }
  // Embers: a stray spark or two lifting off the fire and winking out, kept low
  // against the belly so they read as the fire's own sparks.
  for (let e = 0; e < 3; e++) {
    const ph = (t / 520 + e * 0.33 + i * 0.17) % 1;
    if (ph > 0.6) continue;
    const ex = px + P * (4 + e * 2) + Math.round(Math.sin(t / 200 + e + i)) * P;
    const ey = g - P * 4 - Math.round(ph * 3) * P;
    ctx.fillStyle = (e % 2) ? fire.mid : fire.tip;
    ctx.fillRect(Math.round(ex / P) * P, ey, P, P);
  }
  // A wisp of smoke off the fire -- a mote or two lifting up the belly and
  // thinning out, kept below the rim so it stays part of the fire rather than a
  // column climbing the sky.
  ctx.fillStyle = '#3a3a3a';
  for (let s = 0; s < 2; s++) {
    const ph = (t / 900 + s * 0.5 + i * 0.23) % 1;
    if (ph > 0.8 || (Math.floor(t / 130 + s) % 2 === 0)) continue;
    const sway = Math.round(Math.sin(t / 700 + s * 1.3 + i));
    const sx = px + P * (5 + s * 3) + sway * P;
    const sy = Math.max(topY + P, g - P * 3 - Math.round(ph * 5) * P);
    ctx.fillRect(Math.round(sx / P) * P, sy, P, P);
  }
  // Bubbles rising through the brew and breaking its surface.
  ctx.fillStyle = '#000';
  for (let bcol = 0; bcol < 5; bcol++) {
    const bx = px + P * 3 + bcol * P;
    const ph = (t / 560 + bcol * 0.21 + i * 0.31) % 1;
    if (ph < 0.6) ctx.fillRect(bx, brewY - (ph < 0.3 ? 0 : P), P, P);
  }
  // Steam off the pool: wisps climbing and fading out near the top, carrying a
  // hint of the brew's colour so a glance up at the vapour says the same thing
  // the flame does.
  ctx.fillStyle = fire.steam;
  for (let k = 0; k < 9; k++) {
    const ph = (t / 850 + k * 0.11 + i * 0.13) % 1;
    if (ph > 0.9) continue;
    const sway = Math.round(Math.sin(t / 760 + k * 1.4 + i) * 2);
    const sx = potMid + Math.round((k - 4) * 0.8) * P + sway * P;
    const sy = brewY - P * 4 - Math.round(ph * 8) * P;
    ctx.fillRect(Math.round(sx / P) * P, sy, P, P);
  }
  ctx.fillStyle = '#000';
}

export function drawApothecary() {
  const rising = risingPlace() === 'apothecary';
  if (!S.apothecaryOpen && !rising) return;
  const { x, y, w, h } = apothecary;
  withRise(rising, x, S.groundY, w, h, () => {
    const g = S.groundY;
    ctx.fillStyle = '#000';
    drawGrained(HUT, x, g - APOTH_HUT_H);
    drawShelves();
    // Only the pots that have been stood: buying `another pot` is the thing that
    // puts one there, and an outline of the ones you could buy would be a
    // promise the building makes on its own behalf.
    for (let i = 0; i < S.apothPots; i++) drawPot(i, g);
    ctx.fillStyle = '#000';
  });

  // A bar a pot, over its own cauldron, only up while that batch is going. Drawn
  // outside `withRise` so they ride above the pots at full size once the building
  // has finished rising. Uses the yard's one bar, the same the lab and the tower
  // show.
  //
  // These were one bar for the whole building while the pots stood twelve cells
  // apart, because `bar` is fourteen cells wide and four of them overlapped into
  // a single band. At the seventeen-cell step the fat bellies want, they clear
  // each other by three cells and each pot can say for itself how far along it is.
  if (S.apothecaryOpen && !rising) {
    for (let i = 0; i < S.apothPots; i++) {
      const frac = brewFracOf(i);
      if (frac <= 0) continue;
      // A pot's bar hangs low, a couple of cells over its cauldron -- clear of
      // the site's build/upgrade bar, which floats higher (four cells over the
      // building's top, in `barSpot`). The two used to sit three cells apart and,
      // three cells tall each, touched; the pot's bar low and the building's high
      // is also the truer reading -- one is the brew, the other the building.
      const mid = potX(i) + Math.round(CAULDRON[0].length / 2) * P;
      bar(Math.round(mid / P) * P, S.groundY - (CAULDRON.length + 3) * P, frac);
    }
  }
}

// How many finished doses are standing on each shelf, written beside it -- the
// shelf shows *which* brew and roughly how much, this says exactly how many are
// ready to be carried out. Drawn in screen pixels next to the kit-stand counts
// (the same read-it, don't-look-at-it band). One badge a tonic, so a shelf that
// is holding nothing says nothing.
export function drawStockCount(screenAt) {
  if (!S.apothecaryOpen) return;
  ctx.font = '13px ui-monospace, "Courier New", monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#000';
  for (let i = 0; i < TONICS.length; i++) {
    const n = doseStock(TONICS[i].key);
    if (n <= 0) continue;
    // Just off the case's right upright, level with the vials on that shelf.
    const at = screenAt(shelfX() + APOTH_SHELF_W + P / 2, shelfY(i) + P);
    ctx.fillText(String(n), Math.round(at.x), Math.round(at.y));
  }
  ctx.textBaseline = 'alphabetic';
}
