// The camp's ground plan: each station's drawing as ground, and the camp laid
// out left to right off it (the owner, 2026-10-20: "the stations are a bit
// too far apart": one gap of open floor between every two neighbors). A pure
// table and one function over it, with no import but the grid, so the config
// can lay God's yard and the stair off the camp's end (config/after.js) and
// place.js reads the same numbers for everything that stands.
//
// Each station's drawing (render/after/stations.js) laid off the left edge of
// its ground, in cells: `box` the drawing itself, as it stands (turned), as
// [left, width, height up off the floor] (what a click works and a board
// opens on); `door` the column a worker's middle stands on (where the mock
// draws its body); `pile` where each counted pile lies, in the drawing's own
// cells; `ground` how far its ground runs, piles and all, pressed flat under
// it once it is ordered. A drawing may be turned about its own ground
// (`flip`, its width), its box, door and piles turned with it. The chipper
// stands as drawn (the owner, 2026-10-20: "flip the chipper around, so logs go
// in from the left"): its log pile on its left, the jaws, and its chute
// pouring right onto the sawdust heap at the end of its ground, `heap` the
// heap's middle column, which the saw mill's sawdust joins. Its box ends at
// its block: the chute's spout reaches out over the heap, which stands on
// its own ground past the box.

// What a station draws past its box and piles, in its own cells: the
// chipper's heap and the notch past it, the workshop's blanks, the paper
// mill's drying line at its longest (`reach`, the column past its right end).
// This table cannot read the drawing (the config lays the camp off it), so
// the drawing is read against it instead: footprints.js takes each
// station's ground as what it inks at its fullest, and rule 22 in verify.js
// is red for a part past the ground laid here.
const DRAWN = {
  mill:      { box: [11, 39, 26], door: 8, pile: { logs: 0, timber: 53 } },
  chipper:   { box: [8, 27, 24], door: 10, pile: { chiplogs: 0 }, heap: 39, reach: 46 },
  papermill: { box: [5, 54, 19], door: 7, pile: { paper: 29 }, reach: 60 },
  workshop:  { box: [5, 21, 22], door: 13, pile: { signs: 27 }, reach: 52 },
  press:     { box: [9, 20, 19], door: 27, pile: { posters: 33 } },
  shack:     { box: [0, 14, 14], door: 7, pile: {} },
  // The forestry shack in front of the grove (the owner, 2026-10-20): the
  // grove's board, and the pile its gatherers bring the fallen logs to,
  // on its grove side, where the haulers fetch them from.
  forestry:  { box: [8, 16, 13], door: 10, pile: { grovelogs: 0 } },
  // Its sign on the workshops' side, between the last workshop and the
  // union's crowd: laid there off both by after/place.js, which overrides
  // this column (God's side holds the rebel pile).
  pedestal:  { box: [1, 10, 4], door: 6, pile: {}, ground: 16, sign: -8 }
};
// Every station's shop is a sign on a post on its own ground (the owner,
// 2026-10-21: the drawing is the hand work's, the sign the board's): `w`
// and `h` its board, `post` its post, in cells; it stands a cell past the
// rest of its ground unless the row says where (`sign`). A closed station's
// sign is crossed through; open, it carries the shop's mark.
export const SIGN = { w: 6, h: 4, post: 3 };
// A pile is six cells across, and a body stands three wide on its door.
const PILE_CELLS = 6;
// A body loading or unloading a pile stands beside it, on the side away from
// its station's drawing, its middle `stand` cells off the pile's edge, so
// the load over its head clears the pile: the widest load (a plank,
// render/after.js `drawLoad`) runs `load` cells past the body's middle.
export const PILE_STAND = { stand: 2.5, load: 2 };
// The column a body loading pile column `x` of drawing `a` stands on (its middle).
export const standCol = (a, x) => (x + PILE_CELLS / 2 < a.box[0] + a.box[1] / 2 ? x - PILE_STAND.stand : x + PILE_CELLS + PILE_STAND.stand);
// Each station's ground, derived from what it draws: from its first drawn
// column (`lead`) to the column past its last (`ground`), its box, its piles
// and the floor a body loads each from, its door, its `reach` and its sign
// all inside, so every two neighbors stand the one gap apart however each is
// drawn. The pedestal's ground is the union's camp's (config/after.js lays
// it at the camp's middle).
const span = a => {
  const piles = Object.values(a.pile), stands = piles.map(x => standCol(a, x));
  const lead = Math.min(a.box[0], a.door - 1, ...piles, ...stands.map(s => Math.floor(s - PILE_STAND.load)));
  const end = Math.max(a.box[0] + a.box[1], a.door + 2, ...piles.map(x => x + PILE_CELLS), ...stands.map(s => Math.ceil(s + PILE_STAND.load)), a.reach || 0);
  const sign = a.sign ?? end + 1;
  return { sign, lead: Math.min(lead, sign), ground: a.ground ?? Math.max(end, sign + SIGN.w) };
};
export const ART = Object.fromEntries(Object.entries(DRAWN).map(([k, a]) => [k, { ...a, ...span(a) }]));

// The camp's order, left to right off the grove: the forestry shack in front
// of the trees, the saw mill, the chipper, the paper mill, the workshop and
// the press, then the shack that sells them, and the pedestal nearest God's
// yard.
export const CAMP_ORDER = ['forestry', 'mill', 'chipper', 'papermill', 'workshop', 'press', 'shack', 'pedestal'];


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
export function campLayout(x0, gap, u = 1, shelf = {}) {
  const stations = {};
  const apart = (a, b) => Math.max(gap * u, rampRun((shelf[a] || 0) - (shelf[b] || 0)));
  let x = x0 + apart(null, CAMP_ORDER[0]), patch = x0;
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
