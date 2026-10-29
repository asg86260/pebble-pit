// The game's colors, as ramps: every tone the canvas draws is a rung of one
// of these, never a literal of its own (docs/design-language/canvas.md).
//
// Black and white are the normal. Grey is how deep the rock was and what is
// faded or far. Purple is the one accent, for anything outside the normal:
// magic, the deep's light, the foe's state, the pad's marker, the finale's
// door. The coins keep their own colors, because a coin's color is what it is.

// The yard's greys, paper to ink. The six middle rungs are the dust's shades
// (SHADES, view.js) exactly, so a heap and the rest of the yard share one set
// of steps; the rungs above them continue the same step up to the paper, and
// the darkest dust rung is the buildings' black, so mass has one black. A
// fade in the yard steps along this ramp rather than thinning by alpha.
export const GREY = ['#ffffff', '#efefef', '#d6d6d6', '#bdbdbd', '#a4a4a4', '#8a8a8a',
                     '#757575', '#5f5f5f', '#464646', '#2c2c2c', '#000000'];
// Where the dust's six shades start on it.
export const GREY_DUST_FROM = 5;

// The one purple, dark to bright. The bottom rungs reach black so a thing in
// the deep can fade down its own family to nothing (rift.js); the top rung is
// the lit purple a room or a cursor shows against the dark.
export const PURPLE = ['#000000', '#0b0614', '#130b20', '#1b112c', '#241739', '#2d1d47',
                       '#371f56', '#412465', '#4e2090', '#5c2ba6', '#6a2fbe', '#8244d8',
                       '#9b5de5', '#b79af2'];

// The coins, each a run of four tones bright to dark (FIND_COLOR, view.js),
// and the one tone the page's marks and badges draw a coin in: the page reads
// these into its stylesheet (`--coin-*`), so the board and the yard cannot
// drift. Flat and strong, not pastel. A dark page lifts each a step toward
// the light, as it does the purple (`COIN_DARK`), so a coin keeps its weight
// on charcoal.
export const COIN_TONES = {
  ore:   ['#5b83e0', '#3f68d4', '#2f5fd0', '#2748a4'],   // the quarry: a cold blue
  crop:  ['#57c074', '#3aa957', '#2e9e4b', '#227b3a'],   // the farm: green, it grew
  // The meteor's core: red, and the only red in the game. The quarry is cold
  // and the plots are alive; this came out of the sky and is still hot.
  spark: ['#e8503a', '#d93a25', '#c62d1c', '#9c2214']
};
export const COIN = { ore: COIN_TONES.ore[2], crop: COIN_TONES.crop[2], spark: COIN_TONES.spark[1] };
export const COIN_DARK = { ore: '#7d9cf0', crop: '#6fd08a', spark: '#f06a55' };


// Gold: the one hue kept for what is earned (the owner, 2026-10-16,
// treatment A on docs/mocks/wardrobe-aura-2026-10-16). Nothing a fresh yard
// can wear or see is gold, so the only warm pixel in a black-and-white crowd
// says "this one beat the game". None of the yard's hues could do it: blue,
// green and red are the coins, purple the deep's magic. Pulled toward ochre
// on the white paper, where a yellow would barely show, and lifted over the
// deep's black, as the coins are on a dark page (`COIN_DARK`); `deep` is the
// tone as it is seen there.
export const GOLD = { yard: '#c99406', deep: '#f2c14e' };

// Act 3's four tones (the owner, 2026-10-19), as rungs of GREY: the paper,
// one pale grey, one mid grey and the ink, and nothing between them, for the
// whole of the afterlife -- stations, bodies, the sky's crowd, clouds, the
// floor, piles, cues and bubbles. Depth in the crowd is which of the four a
// band takes, never a fifth grey. God, his light and his throne alone stand
// outside them (render/aftercrowd.js, drawn raw, below). On the dark page
// each lands on its step of AFTER_DARK.
export const AFTER_TONES = { paper: 0, pale: 3, mid: 6, ink: 10 };

// Act 3's goods carry their own color families, outside the four tones (the
// owner, 2026-10-29: "B2 colors, act 1 contrast"). Each good is a run of four
// tones light to dark, as each of act 1's coins is (COIN_TONES): the lightest
// full strength and the rest at the coin's own steps down (0.82, 0.75, 0.58).
// A unit takes one of its four at birth, with equal odds, and keeps it in its
// cell (grid.js, `cellOf`) through every station, so a heap reads as separate
// pieces without a border. Hues are apart from every coin's (ore blue, crop
// green, spark red, gold, the deep's purple). Each family is one role:
export const AFTER_GOODS = {
  log:     ['#9c6a3c', '#805731', '#75502d', '#5a3d23'],   // the felled log: bark brown
  plank:   ['#e6c896', '#bda47b', '#ac9670', '#857457'],   // timber: sawn pale wood
  sign:    ['#57606b', '#474f58', '#414850', '#32383e']    // the sign: a painted slate board
};

// The same families on the dark page, lifted a step toward the light as
// COIN_DARK lifts the coins, and spread so the four tones of a good still tell
// apart on the page's charcoal (ink.js would squeeze a brown's four steps
// into one). Drawn raw, one-to-one with AFTER_GOODS.
export const AFTER_GOODS_DARK = {
  log:     ['#b8814a', '#98683b', '#8a5d34', '#6c4727'],
  plank:   ['#efd6a6', '#cdb68b', '#bba57d', '#988764'],
  sign:    ['#8793a1', '#707b88', '#667180', '#4f5a67']
};

// Act 3 on the dark page (DESIGN.md, "The sky, redrawn flat"): the same order
// turned, each of the four tones where it lands there (src/ink.js, the
// 'after' map) -- the paper darkest, the ink lightest, a clear step between
// each. God and his light stay white, the brightest thing on the page.
export const AFTER_DARK = { paper: '#121212', pale: '#262626', mid: '#3a3a3a', ink: '#666666' };
// The sky's tones outside the four, drawn raw: God's throne and base, black
// on the light page and on the dark a step above the near crowd; the souls of
// the line, pale on the light page and the light grey on the dark; and the
// gaze's edge, one grey on both pages, a step off his white and the dark.
export const AFTER_SEAT_DARK = '#4a4a4a';
export const AFTER_LINE_DARK = '#9a9a9a';
export const AFTER_GAZE_EDGE = '#8a8a8a';
