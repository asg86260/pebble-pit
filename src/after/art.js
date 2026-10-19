// The camp's ground plan: each station's drawing as ground, and the camp laid
// out left to right off it (the owner, 2026-10-18: about one station's width
// of open floor between neighbors, never less than the least gap). A pure
// table and one function over it, with no import but the grid, so the config
// can lay God's yard and the stair off the camp's end (config/after.js) and
// place.js reads the same numbers for everything that stands.
//
// Each station's drawing (render/after/stations.js) laid off the left edge of
// its ground, in cells: `box` the drawing itself, as it stands (turned), as
// [left, width, height up off the floor] (what a click works and a board
// opens on); `door` the column a worker's middle stands on (where the mock
// draws its body); `pile` where each counted pile lies, in the drawing's own
// cells (turned with it); `ground` how far its ground runs, piles and all,
// pressed flat under it once it is ordered. The chipper is drawn turned about
// its own ground (`flip`), facing the saw mill.

export const ART = {
  mill:      { box: [11, 39, 26], door: 8, pile: { logs: 0, timber: 53 }, ground: 72 },
  chipper:   { box: [2, 30, 19], door: 30, pile: { chiplogs: 0 }, ground: 40, flip: 40 },
  papermill: { box: [5, 54, 19], door: 7, pile: { paper: 29 }, ground: 62 },
  workshop:  { box: [5, 21, 21], door: 21, pile: { signs: 28 }, ground: 37 },
  press:     { box: [9, 20, 19], door: 27, pile: { posters: 33 }, ground: 38 },
  shack:     { box: [0, 14, 14], door: 7, pile: {}, ground: 14 },
  pedestal:  { box: [1, 10, 4], door: 6, pile: {}, ground: 16 }
};

// The camp's order, left to right off the grove: the saw mill nearest the
// trees, the chipper, the paper mill, the workshop and the press, then the
// shack that sells them, and the pedestal nearest God's yard.
export const CAMP_ORDER = ['mill', 'chipper', 'papermill', 'workshop', 'press', 'shack', 'pedestal'];

// The open floor between two neighbors' grounds, in cells: the mean of their
// drawings' widths (a station's width of floor), never under `least`.
export const gapBetween = (a, b, least) => Math.max(least, Math.round((ART[a].box[1] + ART[b].box[1]) / 2));

// The camp laid off cell `x0` (the grove's end and its margin): each
// station's ground's left edge, `{ key: { at } }` in cells; `end`, the cell
// past the pedestal's ground; and `patch`, the middle of the open floor
// between the shack and the pedestal, where the yard's coins come up.
export function campLayout(x0, least) {
  const stations = {};
  let x = x0, patch = x0;
  CAMP_ORDER.forEach((key, k) => {
    if (k) {
      const gap = gapBetween(CAMP_ORDER[k - 1], key, least);
      if (key === 'pedestal') patch = x + Math.round(gap / 2);
      x += gap;
    }
    stations[key] = { at: x };
    x += ART[key].ground;
  });
  return { stations, end: x, patch };
}
