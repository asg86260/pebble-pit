// --- the deep's boards: the scale's and the fang's marks, the floor slots ---
// Owned by track BOARD (docs/wave-serpent.md, docs/wave-party.md). Every
// number the track needs lives here; a magic number in a module is a bug.
import { P } from './yard.js';
import { FIGHT_STATIONS_MAX } from './classes.js';

// The coins each group of a deep ladder adds to its scales, first to last:
// scales alone, then the yard's dust, then its ore, then a spark on top. The
// deep's own version of BAND_COINS (config/tiers.js), read when a ladder is
// built with `lead: 'scale'` (upgrades/tiers.js). The purse crosses over, so
// the yard's coins are the deep's second and third.
export const SCALE_BAND_COINS = [[], ['dust'], ['dust', 'shard'], ['dust', 'shard', 'spark']];

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

// The fang as a mark, the scale's way: nine pixels square, ink `#`, paper
// `.`, a blank outside the edge. A tooth hanging point down from its root,
// hollow down the middle, so it reads as a white thing on the black water.
// The floating build button wears it (deep/buildbutton.js); the counter's
// card can lay the same pixels down beside the scale's.
export const FANG_MARK = [
  ' ####### ',
  ' #.....# ',
  ' #.....# ',
  '  #...#  ',
  '  #...#  ',
  '   #.#   ',
  '   #.#   ',
  '    #    ',
  '    #    '
];

// A pod: scales, a steeper price each one, like the yard's rooms (HOUSE_RATE).
export const POD_SCALES0 = 150;
export const POD_RATE = 1.3;

// --- the party's floor (docs/wave-party.md, "Floor slots") -------------------
// Where a station may stand, as fractions of DEEP_W from the deep's left edge:
// the five spots the old stations stood at first, then two between them. A
// station takes the lowest slot free when it is bought, so the floor fills
// left to right after the crusher and the pods.
export const DEEP_SLOTS = [0.335, 0.475, 0.62, 0.76, 0.9, 0.405, 0.69];

// The ids a station can have. A station is never taken down, so the ids are
// the first FIGHT_STATIONS_MAX of `s1, s2, ...`, and each has its row in the
// station table (stations.js) from the first frame -- a board, a site for its
// build, a flag -- keyed by the id rather than the kind, since a kind can
// stand twice.
export const PARTY_IDS = Array.from({ length: FIGHT_STATIONS_MAX }, (_, i) => `s${i + 1}`);

// The floating build button: how high over the deep's floor its foot stands,
// above the slot the station will go up on, and how long it takes to fade in
// or out.
export const BUILD_BUTTON_UP = P * 30;
export const BUILD_FADE_MS = 200;
// A rail folding away: its height and ink go in this many steps over this
// long, and at once under reduced motion.
export const RAIL_FOLD_MS = 200;
export const RAIL_FOLD_STEPS = 4;

export const DEEP_BOARD_KNOBS = [];
