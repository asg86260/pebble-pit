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
