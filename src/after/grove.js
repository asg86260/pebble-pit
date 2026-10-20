// The grove: heaven's trees (DESIGN.md, "Acts 3 and 4", act 3, "The chain:
// trees to signs and posters", the grove; call 10, settled 2026-10-18).
// Placeholder drawing.
//
// The grove starts at one plot with a grown tree in it, and its card clears
// more plots (AFTER_PLOT_MAX in all), quickens the growth, grows bigger trees,
// posts woodcutters and buys them stump removal (the owner, 2026-10-18). A
// tree grows in held stages, sapling, pole, crown, a stage every `growS()`;
// the hand with the axe, or a woodcutter, knocks a chip out a swing, and on
// the last of TREE_CHOPS it falls in AFTER_FALL_FRAMES held frames, its
// crown's cells fading off after (never a pop), and lies as logs for the
// haulers. The stump blocks the plot until it is dug out -- by the hand, a
// click a held swing, AFTER_DIG_CLICKS of them, or by a woodcutter once stump
// removal is bought -- and digging it out sets a sapling in the plot, free.
// A plot newly cleared is set with its first sapling the same way.
//
// Each plot is a row of `S.after.plots`: { stage, grow, chops, chip, fall,
// fell, logs, stump, dug, big, at } -- `dug` the swings taken at its stump,
// `big` a tree planted after "bigger trees", `at` when the plot was cleared
// (it fades in).

import { S } from '../state.js';
import { P, TREE_CHOPS, AFTER_LOGS_A_TREE, AFTER_LOGS_BIG_TREE, AFTER_FALL_S, AFTER_CROWN_FADE_S, AFTER_DIG_CLICKS,
         AFTER_PLOTS0 } from '../config.js';
import { secs } from './util.js';
import { growS, bigTrees } from './levels.js';
import { PINE_GROWN, stationParts, AP } from './place.js';

export const GROWN = PINE_GROWN;

const plot = (stage, at = null, big = false) => ({ stage, grow: 0, chops: 0, chip: null, fall: null, fell: null, logs: 0,
                                                  stump: false, dug: 0, big, at });
// The grove at the act's start: its first plot, a grown tree in it.
export const blankPlots = () => Array.from({ length: AFTER_PLOTS0 }, () => plot(GROWN));
// A plot cleared by the grove's card, its first sapling set in it.
export const clearPlot = () => { S.after.plots.push(plot(1, S.after.t, bigTrees())); };

// A tree standing whole and not already coming down.
export const standing = p => p.stage === GROWN && p.fall == null;
// A stump left standing, blocking its plot.
export const stumped = p => p.stump && p.fall == null;

// The plot of a grown tree under a world point: on the pine as drawn, a
// row of its cells at a time (place.js, `stationParts('tree', i).rows`).
export function treeAt(x, y) {
  const plots = S.after ? S.after.plots : [];
  for (let i = 0; i < plots.length; i++) {
    if (!standing(plots[i])) continue;
    const { foot, rows } = stationParts('tree', i);
    const col = Math.floor((x - foot.x) / AP), row = Math.floor((y - foot.y) / AP);
    if (rows.some(([r, a, b]) => r === row && col >= a && col <= b)) return i;
  }
  return null;
}
// The plot of a stump under a world point: on the block as drawn, its foot
// on the floor line taken in.
export function stumpAt(x, y) {
  const plots = S.after ? S.after.plots : [];
  for (let i = 0; i < plots.length; i++) {
    if (!stumped(plots[i])) continue;
    const s = stationParts('stump', i).stump;
    if (x >= s.x && x < s.x + s.w && y >= s.y && y <= s.y + s.h) return i;
  }
  return null;
}

// A chip out of plot `i`'s trunk: by the hand (`hand`) or a feller. On the
// last chop the tree starts to fall.
export function chopTree(i, hand = false) {
  const a = S.after, p = a.plots[i];
  if (!p || !standing(p)) return false;
  p.chops += 1;
  p.chip = a.t;
  if (p.chops >= TREE_CHOPS) { p.fall = a.t; p.chops = 0; }
  return true;
}

// A swing at plot `i`'s stump, by the hand (`hand`, a click) or a woodcutter
// (`hand` false: its whole dig done in one). Dug out, a sapling is set in the
// plot, free; one set after "bigger trees" grows big.
export function digStump(i, hand = false) {
  const a = S.after, p = a.plots[i];
  if (!p || !stumped(p)) return false;
  p.dug = hand ? p.dug + 1 : AFTER_DIG_CLICKS;
  p.chip = a.t;
  if (p.dug < AFTER_DIG_CLICKS) return true;
  p.stump = false; p.dug = 0; p.stage = 1; p.grow = 0; p.big = bigTrees();
  return true;
}

// A hauler picking a log up off plot `i`.
export function takeLog(i) {
  const p = S.after.plots[i];
  if (!p || p.logs <= 0) return false;
  p.logs -= 1;
  return true;
}

// One frame of the grove: the trees growing, and those coming down landing.
export function stepGrove(c) {
  const a = S.after, dt = secs(c);
  for (const p of a.plots) {
    if (p.stage > 0 && p.stage < GROWN) {
      p.grow += dt;
      if (p.grow >= growS()) { p.stage += 1; p.grow = 0; }
    }
    if (p.fall != null && a.t - p.fall >= AFTER_FALL_S) {
      p.fall = null; p.fell = a.t;
      p.stage = 0; p.stump = true; p.logs += p.big ? AFTER_LOGS_BIG_TREE : AFTER_LOGS_A_TREE;
    }
    if (p.fell != null && a.t - p.fell > AFTER_CROWN_FADE_S) p.fell = null;
  }
}

// The plots, for the drawing.
export const trees = () => (S.after ? S.after.plots : []);
