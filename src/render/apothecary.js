// The apothecary, left to right: the hut, the bookshelf of stock, and the row of
// pots on their fires. Owns the HUT and CAULDRON pictures, the shelf, and the
// count badges over it.

import { P, APOTH_HUT_W, APOTH_HUT_H, APOTH_SHELF_W, APOTH_SHELF_H,
         APOTH_SHELF_ROWS, APOTH_GAP, APOTH_POT_ROW, POT_PITCH,
         BOTTLE_W, BOTTLE_H, BOTTLE_PITCH, SHELF_CAP,
         SHELF_NUM_W, SHELF_NUM_WIDE, SHELF_NUM_MIN, SHELF_PAD,
         FLAME_HOT, FLAME_TIP, FLAME_STEAM,
         POT_SWATCH, POT_SWATCH_EDGE, POT_SWATCH_DROP } from '../config.js';
import { APOTH_SMOKE } from '../config.js';
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
import { shown } from '../tween.js';

// --- the two pictures ---------------------------------------------------------
// One character to a cell: `#` is timber, `.` is empty (`drawSprite`). Everything
// that moves -- the fire, the bubbles, the steam -- is drawn in code over the top.

// The hut is what the board belongs to, so it stands first.
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

// Four pots stand side by side on four cauldrons' worth of ground (POT_PITCH),
// not on a smaller pot. Keep it an odd number of columns so it has a true center
// for the steam; if you move the row the brew sits on, update CAULDRON_BREW_ROW.
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
// The row of CAULDRON the brew sits on, 0-based from the top.
export const CAULDRON_BREW_ROW = 3;

// --- per-cell variation -------------------------------------------------------
// A stable hash of the cell's own coordinates picks its tone, so a wall reads as
// boards and does not strobe frame to frame the way `shadeNear`'s dice would.
// Kept very dark: grain in a black mass, not a gray building.
const BOARD = ['#000', '#0b0b0b', '#151515', '#060606'];
const grain = (c, r) => BOARD[Math.abs((c * 73856093) ^ (r * 19349663)) % BOARD.length];

// `drawSprite` is for a shape in one color; the hut wants a tone per cell.
function drawGrained(rows, x, y) {
  for (let r = 0; r < rows.length; r++)
    for (let c = 0; c < rows[r].length; c++) {
      if (rows[r][c] !== '#') continue;
      ctx.fillStyle = grain(c, r);
      ctx.fillRect(x + c * P, y + r * P, P, P);
    }
}

// --- a tonic's fire -----------------------------------------------------------
// Each pot's flame runs its own brew's color, so which pot is on which recipe
// reads from across the yard without a label. A tonic with no color falls back
// to a plain fire.
const hex = h => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mix = (h, toward, amt) => {
  const [r, g, b] = hex(h);
  const f = v => Math.round(v + (toward - v) * amt);
  return `rgb(${f(r)},${f(g)},${f(b)})`;
};
function flameOf(key) {
  const t = TONICS.find(x => x.key === key);
  const c = t ? t.color : '#f5851f';
  // Foot washed out toward white, middle a shade of the brew, tip the brew at
  // full strength.
  return { hot: mix(c, 255, FLAME_HOT), mid: mix(c, 255, FLAME_TIP), tip: c,
           steam: mix(c, 154, 1 - FLAME_STEAM) };
}

// `potBox` is apothecary.js's, because the pointer wants the same box the
// drawing uses -- a pot is a control as well as a picture.
export const potX = i => potBox(i).x;

// --- the shelf of potions ------------------------------------------------------
// A plank a tonic and a bottle a dose in stock, in the brew's own color; no
// legend or label. An open rack: a closed cabinet's dividers merged with the
// corks into a lattice at the yard's zoom. The top is derived from the number
// of planks shown (the shard brews hide until the quarry opens), never from
// APOTH_SHELF_H, or the later planks draw below the ground.
const shownTonics = () => TONICS.filter(tonicShown);
const shelfTop = () => S.groundY - P * (1 + shownTonics().length * APOTH_SHELF_ROWS);
export const shelfX = () => apothecary.x + APOTH_HUT_W + APOTH_GAP;
const shelfCols = () => Math.round(APOTH_SHELF_W / P);
// The top of tonic `i`'s bottles, and the plank they stand on.
export const shelfY = i => shelfTop() + P + i * APOTH_SHELF_ROWS * P;
const plankY = i => shelfY(i) + BOTTLE_H * P;
// Where the bottles start, and the well the count sits in at the far end. Both
// are measured off the case's own walls, so the count has nowhere to be but
// inside the case (SHELF_NUM_W, `drawStockCount`).
const bottlesX = () => shelfX() + (1 + SHELF_PAD) * P;
// Decides both how many bottles are drawn and how wide the well at the end of
// the plank is, so it is asked in one place.
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

// The cork is what makes it a bottle rather than a colored block, and it is
// centered, so BOTTLE_W wants to be odd.
function bottle(x, y, color) {
  ctx.fillStyle = '#000';
  ctx.fillRect(x + Math.floor(BOTTLE_W / 2) * P, y, P, P);
  ctx.fillStyle = color;
  ctx.fillRect(x, y + P, BOTTLE_W * P, (BOTTLE_H - 1) * P);
}

// Past the cap the numeral takes over: forty bottles on a plank is a plank
// nobody can count.
const bottlesOn = key =>
  overCap(key) ? SHELF_CAP - 1 : Math.min(SHELF_CAP, doseStock(key));

// Two posts and the planks, nothing behind them: the bottles stand against
// the sky.
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

  // Cell offsets into the grid: if you move the brew up or down in CAULDRON,
  // move CAULDRON_BREW_ROW to match.
  const potMid = px + Math.round(CAULDRON[0].length / 2) * P;
  const brewY = topY + CAULDRON_BREW_ROW * P;

  // Fire, bubbles and steam only while a batch is on the boil, so an idle
  // cauldron is exactly the CAULDRON grid and the fire is part of what says it
  // is being worked. See `potBoiling`.
  if (!potBoiling(i)) return;
  const t = now();
  // Colored by the batch that was lit and paid for, not by what the pot is set
  // to: turn a pot mid-batch and the flame stays the brew it is cooking.
  const fire = flameOf(brewKeyOf(i));

  // One continuous bed of cells whose top edge is jagged and living, driven by
  // smooth value noise so the crests never fall into a repeating ripple and do
  // not strobe the way raw randomness does. `vnoise` is shared with the tonic
  // burning off a dosed body so the two fires flicker with the same hand.
  const bedL = px + P * 3, cols = 7, mid = (cols - 1) / 2;
  // Each pot's fire has its own place in the noise, so four pots do not flicker
  // in step like one long fire cut into four.
  const seed = i * 613.7;
  for (let c = 0; c < cols; c++) {
    const hump = (1 - Math.abs(c - mid) / mid) * 0.9;
    // The big per-column offsets (17.3, 11.9) put neighbors far apart in noise
    // space so they flicker independently; small offsets make neighbors nearly
    // the same value one step apart, which reads as a wave sliding left.
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
  // Embers, kept low against the belly so they read as the fire's own sparks.
  for (let e = 0; e < 3; e++) {
    const ph = (t / 520 + e * 0.33 + i * 0.17) % 1;
    if (ph > 0.6) continue;
    const ex = px + P * (4 + e * 2) + Math.round(Math.sin(t / 200 + e + i)) * P;
    const ey = g - P * 4 - Math.round(ph * 3) * P;
    ctx.fillStyle = (e % 2) ? fire.mid : fire.tip;
    ctx.fillRect(Math.round(ex / P) * P, ey, P, P);
  }
  // A wisp of smoke off the fire, kept below the rim so it stays part of the
  // fire rather than a column climbing the sky.
  ctx.fillStyle = APOTH_SMOKE;
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
  // Steam off the pool, carrying a hint of the brew's color so the vapor says
  // the same thing the flame does.
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
    // Only the pots that have been stood: an outline of the ones you could buy
    // would be a promise the building makes on its own behalf.
    for (let i = 0; i < S.apothPots; i++) drawPot(i, g);
    ctx.fillStyle = '#000';
  });

  // A bar a pot, over its own cauldron, only up while that batch is going.
  // Drawn outside `withRise` so they ride above the pots at full size once the
  // building has finished rising. `bar` is fourteen cells wide; the pots stand
  // far enough apart (POT_PITCH) that the bars clear each other.
  if (S.apothecaryOpen && !rising) {
    for (let i = 0; i < S.apothPots; i++) {
      const frac = brewFracOf(i);
      if (frac <= 0) continue;
      // Five cells over the rim: clear of the steam's roots just above the brew,
      // and still under the site's build/upgrade bar (four over the hut, in
      // `barSpot`).
      const mid = potX(i) + Math.round(CAULDRON[0].length / 2) * P;
      bar(Math.round(mid / P) * P, S.groundY - (CAULDRON.length + 5) * P, frac);
    }
  }
}

// The count, for a shelf holding more than it can stand a bottle for; under
// the cap the bottles are the count. It is clipped to a well of its own inside
// the case (`numWell`): the numeral is in SCREEN pixels and the gap between
// the case and the first cauldron is a WORLD distance, so without the clip
// there is no count and no zoom at which it is safe from running into the pot.
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
    // A white ground under it, so the number reads whatever is drawn behind it.
    ctx.fillStyle = '#fff';
    ctx.fillRect(at.x, at.y, w, h);
    ctx.fillStyle = '#000';
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    // Sized off the well in cells, so the numeral grows and shrinks with the
    // bottles beside it, with a floor of SHELF_NUM_MIN cells so it cannot shrink
    // itself into a speck. If the digits still will not fit the width, it is
    // taken down toward that floor and no further; the clip guarantees
    // containment, this is so what survives the clip is readable.
    const cell = h / BOTTLE_H;                   // one grid cell, in screen pixels
    const floor = SHELF_NUM_MIN * cell;
    const said = String(Math.round(shown('stock:' + book[i].key, n)));
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

// What each pot is set to, as a block of that brew's color under its belly. The
// flame says it only while a batch is going; the block says it always, and says
// it of an unset pot too, as an empty block. Screen-space, sized off the yard's
// own cells like `drawStockCount`, so it scales with the pot over it.
export function drawPotLabels() {
  if (!S.apothecaryOpen) return;
  for (let i = 0; i < S.apothPots; i++) {
    const t = tonicOf(potTonicOf(i));
    const b = potBox(i);
    // One cell in screen pixels, off two points a cell apart, so it is zoom-proof.
    const cell = screenAt(b.x + P, 0).x - screenAt(b.x, 0).x;
    const at = screenAt(b.x + b.w / 2, S.groundY);
    const side = Math.round(cell * POT_SWATCH);
    const x = Math.round(at.x - side / 2);
    const y = Math.round(at.y + cell * POT_SWATCH_DROP);
    // Ink first and the fill inside it, so the border is one shape: a pale brew
    // still reads as a block against the dust under a pot, and an unset pot is
    // the same block empty.
    const edge = Math.max(1, Math.round(cell * POT_SWATCH_EDGE));
    ctx.fillStyle = '#000';
    ctx.fillRect(x, y, side, side);
    ctx.fillStyle = t ? t.color : '#fff';
    ctx.fillRect(x + edge, y + edge, side - edge * 2, side - edge * 2);
  }
  ctx.fillStyle = '#000';
}
