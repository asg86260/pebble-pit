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
// What each rung of a deep ladder asks in the yard's coins, a rung at a time,
// written rather than converted from its scales: a yard that has reached the
// abyss holds millions of dust, so a scale's worth in dust is a bill nobody
// notices. Every fighter's ladder pays the same; a coin is asked from the
// band SCALE_BAND_COINS first names it in. The dust climbs gently: a yard at
// the abyss banks about 145k a minute, so a four-station party buys a rung
// every few minutes and stands near rung 7 when he is freed, and its damage
// grows a step at a time rather than in jumps an hour apart.
export const SCALE_RUNG_COINS = {
  dust:  [0, 0, 100e3, 250e3, 500e3, 900e3, 1.5e6, 2.5e6],
  shard: [0, 0, 0, 0, 1e3, 3e3, 10e3, 30e3],
  spark: [0, 0, 0, 0, 0, 0, 1e3, 3e3]
};

// A station bought with a fang joins a party already climbing: its first
// FANG_RUNGS rungs ask at least FANG_RUNG_DUST dust each, so it reaches the
// party over minutes instead of breaking the phase it joins at once (the
// driven runs, 2026-10-07). The free first station keeps the table above.
export const FANG_RUNGS = 4;
export const FANG_RUNG_DUST = 500e3;

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
// `.`, a blank outside the edge. A solid fang hanging from its root, its tip
// hooked back as a snake's is (the owner's A, docs/mocks/fang-mark-2026-09-28.html):
// a hollow tooth read as a triangle at nine pixels.
// The floating build button wears it (deep/buildbutton.js); the counter's
// card can lay the same pixels down beside the scale's.
export const FANG_MARK = [
  ' #####   ',
  ' ######  ',
  '  #####  ',
  '   ####  ',
  '    ###  ',
  '    ###  ',
  '    ##   ',
  '   ##    ',
  '   #     '
];

// A pod: scales, a steeper price each one, like the yard's rooms (HOUSE_RATE).
// The foot is the first pod bought, past the sqwife's: cheap, since only the
// hand gathers until it stands.
export const POD_SCALES0 = 10;
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
