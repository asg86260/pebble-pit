// The camp's ground plan: each station's drawing as ground, and the camp laid
// out left to right off it (the owner, 2026-10-20: "the stations are a bit
// too far apart": one gap of open floor between every two neighbors). A pure
// table and one function over it, with no import but the piles' sizes
// (config/afterpiles.js, which imports nothing), so the config can lay God's
// yard and the stair off the camp's end (config/after.js) and place.js reads
// the same numbers for everything that stands.
//
// Each station's drawing (render/after/stations.js) laid off the left edge of
// its ground, in cells: `box` the drawing itself, as it stands (turned), as
// [left, width, height up off the floor] (what a click works and a board
// opens on); `door` the column a worker's middle stands on (where the mock
// draws its body); `pile` where each counted pile lies, in the drawing's own
// cells, as the column of its edge toward the drawing (it grows away from
// the drawing, as wide as `pileGrid` makes it; or none, laid off the
// drawing by `layPiles`); `ground` how far its ground runs, piles and all, pressed flat under it once it is ordered. A drawing may be turned about its own ground
// (`flip`, its width), its box, door and piles turned with it.

import { AFTER_PILES, AFTER_BLOCK, AFTER_BLOCK_H, AFTER_PILE_GAP } from '../config/afterpiles.js';

// What a station draws past its box and piles, in its own cells, it names
// as `reach`, the column past its right end (the saw mill's chute).
// This table cannot read the drawing (the config lays the camp off it), so
// the drawing is read against it instead: footprints.js takes each
// station's ground as what it inks at its fullest, and rule 22 in verify.js
// is red for a part past the ground laid here.
const DRAWN = {
  // The saw mill's chute reaches past its box to column 60 (AFTER_MILL.chute's
  // foot, x1 + 2, and the block on it), and its timber mound is laid past
  // that, so the mound the chute drops onto never stands under the chute;
  // test/after-mill-machine.test.mjs holds the two to that one rule.
  mill:      { box: [11, 39, 26], door: 8, reach: 60, pile: { logs: 6, timber: null } },
  // The workshop's signs in its rack, and past them the timber walked to it
  // off the timber mound: laid off the shed and each other (`layPiles`).
  workshop:  { box: [5, 21, 22], door: 13, pile: { signs: null, benchtimber: null } },
  shack:     { box: [0, 14, 14], door: 7, pile: {} },
  // The forestry shack beside the grove's first plot (the owner, 2026-10-20;
  // rebuilt 2026-10-30): the grove's board; its seed basket, and past it the
  // pile its gatherers bring the fallen logs to, where the haulers fetch
  // them. Drawn turned within its own ground (`flip`, set below), so the
  // basket and the log pile stand on its far side from the grove and its
  // wall faces the first plot.
  forestry:  { box: [8, 16, 13], door: 10, pile: { seeds: 'left', grovelogs: 'left' }, turned: true },
  // Its board's ground on the workshops' side, between the last workshop and
  // the union's crowd: laid there off both by after/place.js, which overrides
  // this column (God's side holds the rebel pile).
  pedestal:  { box: [1, 10, 4], door: 6, pile: {}, ground: 16, sign: -8 }
};
// Every station's board stands beside it, over a column of its own ground
// where its shop sign stood until the station became its own shop
// (2026-10-27): kept, and nothing drawn on it, so the board never stands
// over the parts the hand works and the camp kept its layout. `w` and `h`
// the spot the board stands over, `post` the floor under it, in cells; a
// cell past the rest of the ground unless the row says where (`sign`).
export const SIGN = { w: 6, h: 4, post: 3 };
// A pile that is not a plot of blocks is six cells across, and a body
// stands three wide on its door.
const PILE_CELLS = 6;
// A counted pile's plot (config/afterpiles.js), in blocks: as wide as the
// heap its brim stands in at the dust's slope -- grid.js with no repose
// lets a block roll off any drop of two, so a heap of blocks set down on its
// middle column is a stair a block a column, h high on 2h - 1 columns,
// holding h * h -- and as many rows as that, the smallest h that holds the
// brim. A pile the design names a width for keeps it and stacks as high as
// its brim needs. Null for a pile that is not a plot.
export function pileGrid(what) {
  const pl = AFTER_PILES[what];
  if (!pl) return null;
  const h = Math.ceil(Math.sqrt(pl.brim)), cols = pl.cols ?? 2 * h - 1, size = AFTER_BLOCK[pl.good];
  return { size, h: AFTER_BLOCK_H[pl.good] ?? size, cols, rows: pl.cols ? Math.ceil(pl.brim / cols) : h };
}
// A pile's width and height in cells.
export const pileCells = what => { const g = pileGrid(what); return g ? g.cols * g.size : PILE_CELLS; };
export const pileHigh = what => { const g = pileGrid(what); return g ? g.rows * g.h : 0; };
// Which side of its drawing a pile of drawing `a` lies on, and its left
// column: a pile left of the drawing's middle ends at its column, one right
// of it starts there.
const leftOf = (a, edge) => edge < a.box[0] + a.box[1] / 2;
export const pileLeft = (a, what) => (leftOf(a, a.pile[what]) ? a.pile[what] - pileCells(what) : a.pile[what]);
// A body loading or unloading a pile stands beside it, on the side away from
// its station's drawing, its middle `stand` cells off the pile's edge, so
// the load over its head clears the pile: the widest load (a plank,
// render/after.js `drawLoad`) runs `load` cells past the body's middle.
export const PILE_STAND = { stand: 2.5, load: 2 };
// The column a body loading pile `what` of drawing `a` stands on (its middle).
export const standCol = (a, what) => (leftOf(a, a.pile[what]) ? pileLeft(a, what) - PILE_STAND.stand : pileLeft(a, what) + pileCells(what) + PILE_STAND.stand);
// Each station's ground, derived from what it draws: from its first drawn
// column (`lead`) to the column past its last (`ground`), its box, its piles
// and the floor a body loads each from, its door, its `reach` and its
// board's spot all inside, so every two neighbors stand the one gap apart however each is
// drawn. The pedestal's ground is the union's camp's (config/after.js lays
// it at the camp's middle).
const span = a => {
  const keys = Object.keys(a.pile), piles = keys.map(k => pileLeft(a, k)), stands = keys.map(k => standCol(a, k));
  const lead = Math.min(a.box[0], a.door - 1, ...piles, ...stands.map(s => Math.floor(s - PILE_STAND.load)));
  const end = Math.max(a.box[0] + a.box[1], a.door + 2, ...keys.map((k, i) => piles[i] + pileCells(k)), ...stands.map(s => Math.ceil(s + PILE_STAND.load)), a.reach || 0);
  const sign = a.sign ?? end + 1;
  return { sign, lead: Math.min(lead, sign), ground: a.ground ?? Math.max(end, sign + SIGN.w) };
};
// A drawing's piles that name no column are laid off it rather than placed
// by hand: right of its box and its `reach` (null), or left of it ('left'), in the order
// named, each AFTER_PILE_GAP cells of floor past what stands before it --
// the drawing's edge, or the floor the body loading the pile before it
// reaches over.
function layPiles(a) {
  const pile = { ...a.pile };
  let right = Math.max(a.box[0] + a.box[1], a.reach || 0) + AFTER_PILE_GAP, left = a.box[0] - AFTER_PILE_GAP;
  for (const k of Object.keys(pile)) {
    if (pile[k] === 'left') {
      pile[k] = left;
      left = Math.floor(standCol({ ...a, pile }, k) - PILE_STAND.load) - AFTER_PILE_GAP;
    } else if (pile[k] == null) {
      pile[k] = right;
      right = Math.ceil(standCol({ ...a, pile }, k) + PILE_STAND.load) + AFTER_PILE_GAP;
    }
  }
  return { ...a, pile };
}
// A turned drawing is turned about its whole ground (`flip`, the column its
// ground's two ends sum to), so the ground itself stays put and only what
// stands on it changes sides.
export const ART = Object.fromEntries(Object.entries(DRAWN).map(([k, a]) => {
  const b = layPiles(a), s = span(b);
  return [k, { ...b, ...s, ...(a.turned ? { flip: s.lead + s.ground } : {}) }];
}));

// The camp's order, left to right off the grove: the forestry shack in front
// of the trees, the saw mill and the workshop, then the shack that sells
// them, and the pedestal nearest God's yard.
export const CAMP_ORDER = ['forestry', 'mill', 'workshop', 'shack', 'pedestal'];


// The camp laid off cell `x0` (the grove's end): each station's ground's left
// edge, `{ key: { at } }` in cells, laid so its first drawn column (`lead`)
// stands `gap` art cells of open floor past the last one's (the owner,
// 2026-10-20: "too far apart ... and inconsistently placed": one gap between
// every two neighbors, the grove's end and the forestry shack too); `end`,
// the cell past the pedestal's ground; and `patch`, the middle of the open
// floor between the shack and the pedestal, where the yard's coins come up.
// `u` is the art's grid cells a cell of its own (config/after.js,
// AFTER_ART_SCALE): the grounds and the gap are the art's, so they grow with it.
// `shelf` is each station's shelf in grid cells (config/after.js,
// AFTER_SHELF; the grove stands on the floor line): two neighbors on shelves
// further apart than the gap can ramp between stand as far apart as the ramp
// needs instead (`rampRun`).
// `first` is the open floor before the first station, the gap unless said:
// the grove lays its own off the shack (after/place.js, `plotX`).
export function campLayout(x0, gap, u = 1, shelf = {}, first = gap) {
  const stations = {};
  const apart = (a, b) => Math.max(gap * u, rampRun((shelf[a] || 0) - (shelf[b] || 0)));
  let x = x0 + first * u, patch = x0;
  CAMP_ORDER.forEach((key, k) => {
    if (k) {
      const g = apart(CAMP_ORDER[k - 1], key);
      if (key === 'pedestal') patch = x + Math.round(g / 2);
      x += g;
    }
    stations[key] = { at: x - ART[key].lead * u };
    x = stations[key].at + ART[key].ground * u;
  });
  return { stations, end: x, patch };
}
// The open floor, in grid cells, that an eased ramp of cloud between two
// shelves `dh` cells apart needs so that no column of it stands more than a
// cell over the next (the owner, 2026-10-26: no riser taller than a body can
// step, and the floor reads as slopes, not stairs): the ease's steepest is
// three halves of its mean, and each shelf's flat runs a cell past its
// ground (after/place.js, `floorFlats`).
export const RAMP_STEEP = 3 / 2;
export const rampRun = dh => Math.ceil(RAMP_STEEP * Math.abs(dh)) + 2;
