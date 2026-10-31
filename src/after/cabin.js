// REVIEW act-3-the-cabin-built
// The forestry shack's stump house (the owner's pick, C, 2026-10-30: "lets
// drop the small tree on top"), its parts in the house's own cells: i across
// from its left column, h up off the floor (0 the bottom row), each part
// [i, h, w, n] a block w by n. A pure table, importing only the doorway's
// (which imports nothing), so the camp's ground plan (after/art.js) takes the
// house's box and door off the parts the drawing (render/after/stations.js,
// `forestry`) inks, and the two cannot disagree.
import { DOORWAY } from './doorway.js';

export const CABIN = {
  // the one ink mass: the roots' flare two rows deep, the stump on it
  mass: [[0, 0, 16, 2], [1, 2, 14, 11]],
  fungus: [[14, 5, 2, 1], [15, 6, 1, 1]],
  pipe: [11, 13, 2, 4],
  cap: [10, 17, 4, 1],
  // the bark's seams, cut in paper: [column, foot, rows]
  seams: [[3, 2, 4], [5, 7, 3], [12, 1, 3], [13, 7, 4], [10, 9, 2]],
  face: [1, 12, 14, 1],           // the cut face, edge-on, in the pale
  rings: [4, 8, 11],              // its rings' columns, in the mid
  // the way in's left column: the stations' one doorway (after/doorway.js),
  // where the mock's arched door stood (the owner, 2026-10-30)
  door: 6,
  round: [[3, 7, 1, 1], [2, 8, 3, 1], [3, 9, 1, 1]],   // the round window
  cross: [3, 8],
  small: [11, 4, 2, 2]
};
// The house's width and height in cells: the furthest any inked part reaches.
const inked = [...CABIN.mass, ...CABIN.fungus, CABIN.pipe, CABIN.cap];
export const CABIN_W = Math.max(...inked.map(([i, , w]) => i + w));
export const CABIN_H = Math.max(...inked.map(([, h, , n]) => h + n));
// The middle of its way in, in the house's cells: where a body at it stands.
export const CABIN_DOOR = CABIN.door + DOORWAY.w / 2;
