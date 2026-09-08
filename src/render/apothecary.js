// The apothecary, left to right: the hut, the bookshelf of stock, and the row of
// pots on their fires (item 18's order -- you meet the building, then what it
// holds, then what it is doing). Owns the HUT and CAULDRON pictures, the shelf,
// and the count badges over it. Shared draw primitives (ctx, withRise,
// risingPlace, bar) come from ./ctx.js, ./rise.js and ./bars.js.

import { P, APOTH_HUT_W, APOTH_HUT_H, APOTH_SHELF_W, APOTH_SHELF_H,
         APOTH_SHELF_ROWS, APOTH_GAP, APOTH_POT_ROW, POT_PITCH,
         BOTTLE_W, BOTTLE_H, BOTTLE_PITCH, SHELF_CAP,
         SHELF_NUM_W, SHELF_NUM_WIDE, SHELF_NUM_MIN, SHELF_PAD,
         FLAME_HOT, FLAME_TIP, FLAME_STEAM } from '../config.js';
import { S, apothecary } from '../state.js';
import { drawSprite } from '../sprites.js';
import { now } from '../clock.js';
import { vnoise } from './flicker.js';
import { potBoiling, brewFracOf, potTonicOf, brewKeyOf, doseStock, potBox, TONICS,
         tonicOf, tonicShown } from '../apothecary.js';
import { screenAt } from './frame.js';
import { bar } from './bars.js';
import { ctx } from './ctx.js';
import { rising as risingAt, withRise } from './rise.js';

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

// Where each pot stands. `potBox` is apothecary.js's, because the pointer wants
// the same box the drawing uses -- a pot is a control as well as a picture.
export const potX = i => potBox(i).x;

// --- the shelf of potions ------------------------------------------------------
// Stock is per tonic (item 13), and this is where a passerby reads it: a plank to
// a tonic, and a bottle standing on that plank for every dose in stock, filled
// with the brew's own color. Nothing here is a legend or a label -- the shelf
// says what it is holding by holding it, the way the pile says how much dust
// there is.
//
// It was a seven-cell case, taller than it was wide, with a colored tick on each
// board and a run of single cells beside it. Nothing in it was shaped like a
// bottle and the whole thing read as a ladder with paint on it. So: a box wider
// than it is tall, and a bottle that is a bottle.
//
// It is an open rack -- posts, planks, and the bottles standing against the sky
// with nothing behind them. A closed cabinet with a slot per bottle was drawn
// and looked at beside it: at the size the yard is actually played, the divider
// between one slot and the next put a black cell between every bottle, and the
// dividers and the corks merged into a lattice you had to work to read stock out
// of. Color is the only thing in this box for a reason.
// The planks the rack shows: one per recipe the player can see (item 24 hides
// the shard brews until the quarry opens), so the rack grows when the book does.
// The top is derived from that count rather than from APOTH_SHELF_H, which was
// typed for the three-recipe book and would leave the wave-7 planks drawing
// below the ground.
const shownTonics = () => TONICS.filter(tonicShown);
const shelfTop = () => S.groundY - P * (1 + shownTonics().length * APOTH_SHELF_ROWS);
export const shelfX = () => apothecary.x + APOTH_HUT_W + APOTH_GAP;
const shelfCols = () => Math.round(APOTH_SHELF_W / P);
// The top of tonic `i`'s bottles, and the plank they stand on: one cell of frame
// over the first, then a bottle's height and a plank, over and over.
export const shelfY = i => shelfTop() + P + i * APOTH_SHELF_ROWS * P;
const plankY = i => shelfY(i) + BOTTLE_H * P;
// Where the bottles start, and the well the count sits in at the far end. Both
// are measured off the case's own walls, so the count has nowhere to be but
// inside the case -- see SHELF_NUM_W in config, and `drawStockCount` below.
const bottlesX = () => shelfX() + (1 + SHELF_PAD) * P;
// Whether this plank is holding more than it can stand a bottle for -- the one
// question that decides both how many bottles are drawn and how wide the well
// at the end of the plank is, so it is asked in one place.
const overCap = key => doseStock(key) > SHELF_CAP;
export const numWell = i => {
  const cells = overCap(shownTonics()[i].key) ? SHELF_NUM_WIDE : SHELF_NUM_W;
  return {
    x: shelfX() + (shelfCols() - 1 - SHELF_PAD - cells) * P,
    y: shelfY(i),
    w: cells * P,
    h: BOTTLE_H * P
  };
};

// One bottle: a black cork over a body of the brew. The cork is what makes it a
// bottle rather than a colored block, and it is centered, so BOTTLE_W wants to
// be odd.
function bottle(x, y, color) {
  ctx.fillStyle = '#000';
  ctx.fillRect(x + Math.floor(BOTTLE_W / 2) * P, y, P, P);
  ctx.fillStyle = color;
  ctx.fillRect(x, y + P, BOTTLE_W * P, (BOTTLE_H - 1) * P);
}

// How many bottles actually stand on a plank: the stock, up to the cap. Past the
// cap the count takes over -- forty bottles drawn on a plank is a plank nobody
// can count, and the numeral is the honest way to say forty.
const bottlesOn = key =>
  overCap(key) ? SHELF_CAP - 1 : Math.min(SHELF_CAP, doseStock(key));

// Two posts and three planks, and nothing behind them. The bottles stand against
// the sky, which is the most color per pixel this can be and the plainest reading
// of "there are five of those left".
function drawShelves() {
  const x = shelfX(), top = shelfTop(), g = S.groundY, cols = shelfCols();
  for (let r = 0; r * P < g - top; r++) {           // the two posts, to the ground
    ctx.fillStyle = grain(0, r); ctx.fillRect(x, top + r * P, P, P);
    ctx.fillStyle = grain(cols - 1, r); ctx.fillRect(x + (cols - 1) * P, top + r * P, P, P);
  }
  for (let c = 0; c < cols; c++) {                  // and the board over the top
    ctx.fillStyle = grain(c, 0); ctx.fillRect(x + c * P, top, P, P);
  }
  const book = shownTonics();
  for (let i = 0; i < book.length; i++) {
    const t = book[i], py = plankY(i);
    for (let c = 0; c < cols; c++) {
      ctx.fillStyle = grain(c, i * APOTH_SHELF_ROWS + 3);
      ctx.fillRect(x + c * P, py, P, P);
    }
    const n = bottlesOn(t.key);
    for (let b = 0; b < n; b++)
      bottle(bottlesX() + b * BOTTLE_PITCH * P, shelfY(i), t.color);
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
  // The fire is colored by what is ON it -- the batch that was lit and paid for
  // -- not by what the pot is set to. Turn a pot mid-batch and the flame stays
  // the brew it is actually cooking; the new setting takes the next one.
  const fire = flameOf(brewKeyOf(i));

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
  const rising = risingAt('apothecary') && 'apothecary';
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
      // Five cells over the rim, not three: the steam lifts off the brew right
      // where the bar used to sit, so the bar's bottom edge sat on the wisps'
      // roots and hid them. Two cells up shows the steam rising under the bar
      // while still keeping under the building's own bar (four over the hut).
      const mid = potX(i) + Math.round(CAULDRON[0].length / 2) * P;
      bar(Math.round(mid / P) * P, S.groundY - (CAULDRON.length + 5) * P, frac);
    }
  }
}

// The count, for a shelf holding more than it can stand a bottle for. Under the
// cap the bottles ARE the count -- five bottles is five, and a numeral beside
// them would be the same fact written twice -- so nothing is drawn at all until
// the shelf runs past what it can show.
//
// It lives in a well of its own inside the case (`numWell`) and is clipped to it,
// and that clip is the whole fix for the count that used to overlap the pots. The
// numeral is drawn in SCREEN pixels at a fixed size; the gap it used to sit in,
// between the case and the first cauldron, is a WORLD distance. Measured at the
// game's own zoom of 0.833: two digits are 15.6 px against 12.5 px of clear air,
// so a count of ten ran three pixels into the pot -- and there was no count and
// no zoom at which it was safe, because the two are not measured in the same
// thing. Given ground of its own and a clip, it cannot reach past the case
// however far the stock climbs. The size follows the well for the same reason.
export function drawStockCount(screenAt) {
  if (!S.apothecaryOpen) return;
  const book = shownTonics();
  for (let i = 0; i < book.length; i++) {
    const n = doseStock(book[i].key);
    if (n <= SHELF_CAP) continue;
    const well = numWell(i);
    const at = screenAt(well.x, well.y);
    const to = screenAt(well.x + well.w, well.y + well.h);
    const w = to.x - at.x, h = to.y - at.y;
    ctx.save();
    ctx.beginPath();
    ctx.rect(at.x, at.y, w, h);
    ctx.clip();
    // A white ground under it, so the number reads over a plank, a slot or the
    // open sky without caring which treatment is drawing behind it.
    ctx.fillStyle = '#fff';
    ctx.fillRect(at.x, at.y, w, h);
    ctx.fillStyle = '#000';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    // Sized off the well, in cells rather than in CSS pixels. A cell is however
    // many screen pixels the yard's own zoom makes it, so the numeral grows and
    // shrinks with the bottles beside it instead of holding a size the rest of
    // the picture does not agree with -- and it has a floor of SHELF_NUM_MIN
    // cells, which is what stopped this from shrinking itself into a speck. Only
    // then, if the digits still will not fit the width, is it taken down toward
    // that floor and no further; the clip guarantees containment either way, and
    // this is so that what survives the clip is a number you can read.
    const cell = h / BOTTLE_H;                   // one grid cell, in screen pixels
    const floor = SHELF_NUM_MIN * cell;
    const said = String(n);
    let size = Math.max(floor, h * 0.9);
    ctx.font = `${size}px ui-monospace, "Courier New", monospace`;
    const room = w - cell;                       // a cell of air inside the well
    const wide = ctx.measureText(said).width;
    if (wide > room) {
      size = Math.max(floor, size * room / wide);
      ctx.font = `${size}px ui-monospace, "Courier New", monospace`;
    }
    ctx.fillText(said, Math.round(at.x + w - cell / 2), Math.round(at.y + h / 2));
    ctx.restore();
  }
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

// The tonic's short name under each pot that has a brew set (item 23). The flame
// already says which brew from across the yard, but only while a batch is going;
// the word under the belly says it always, and says it to a player who has not
// learned the colors yet. Screen-space, the same bargain `drawStockCount`
// strikes: the glyph is drawn at a size measured off the yard's own cells, so it
// grows and shrinks with the pot over it rather than holding a CSS size the
// picture does not agree with.
export function drawPotLabels() {
  if (!S.apothecaryOpen) return;
  for (let i = 0; i < S.apothPots; i++) {
    const t = tonicOf(potTonicOf(i));
    if (!t) continue;
    const b = potBox(i);
    // One cell in screen pixels, off two points a cell apart -- zoom-proof.
    const cell = screenAt(b.x + P, 0).x - screenAt(b.x, 0).x;
    const at = screenAt(b.x + b.w / 2, S.groundY);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = `${cell * 2}px ui-monospace, "Courier New", monospace`;
    // A white slab under the word, so it reads over the dust the ground under a
    // pot gathers -- the count over the shelf makes the same choice.
    const w = ctx.measureText(t.short).width + cell;
    ctx.fillStyle = '#fff';
    ctx.fillRect(Math.round(at.x - w / 2), Math.round(at.y + cell / 2), Math.round(w), Math.round(cell * 2.4));
    ctx.fillStyle = '#000';
    ctx.fillText(t.short, Math.round(at.x), Math.round(at.y + cell * 0.7));
  }
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = '#000';
}
