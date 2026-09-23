// --- the deep's boards: its doors' bills, and the scale's mark ---
// Owned by track BOARD of docs/wave-serpent.md. Every number the track needs
// lives here; a magic number in a module is a bug.
import { P } from './yard.js';

// The coins each group of a deep ladder adds to its scales, first to last:
// scales alone, then the yard's dust, then its ore, then a spark on top. The
// deep's own version of BAND_COINS (config/tiers.js), read when a ladder is
// built with `lead: 'scale'` (upgrades/tiers.js). The purse crosses over, so
// the yard's coins are the deep's second and third.
export const SCALE_BAND_COINS = [[], ['dust'], ['dust', 'shard'], ['dust', 'shard', 'spark']];

// The doors, sold on the altar and built there by the brawlers. Each opens
// on the stage before the one its weapon answers (the `needs` column of
// STATIONS), so its bill is paid from the scales the last weapon knocked off.
export const DOOR_BILLS = {
  well:   [['scale', 150], ['dust', 20000]],
  font:   [['scale', 600], ['dust', 60000], ['shard', 3000]],
  circle: [['scale', 600], ['dust', 60000], ['spore', 8000]],
  spire:  [['scale', 2500], ['dust', 150000], ['shard', 6000], ['spark', 200]]
};

// The scale as a mark: nine pixels square, ink `#` and paper `.`, a blank
// outside the edge. A square with its foot rounded in, and a crescent hanging
// from its top edge -- the rim of the scale lying over it -- so it reads as
// one of a row of them rather than a face. One drawing for both places it is
// shown: the stylesheet's `.scale` is masked from these pixels
// (`--scale-mark`, written by board.js) and the counter lays the same pixels
// down on its card (render/counter.js), so the board and the card cannot draw
// two coins.
export const SCALE_MARK = [
  '#########',
  '#.#####.#',
  '#..###..#',
  '#.......#',
  '#.......#',
  '#.......#',
  ' #.....# ',
  '  #...#  ',
  '   ###   '
];

export const DEEP_BOARD_KNOBS = [];
