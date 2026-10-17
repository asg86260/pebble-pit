// The grove: heaven's trees (DESIGN.md, "Acts 3 and 4", act 3, "The chain:
// trees to signs and posters", the grove). Placeholder drawing.
//
// God's untended trees at the cloud's left edge, full grown -- the old growth
// the union inherits at the first meeting, so the first logs come quickly --
// and, once those are down, the plots and their growth clock (call 10 open:
// replanted with old growth first, the recommendation). A tree grows in held
// stages, sapling, pole, crown, a stage every `growS()`; a feller, or the
// hand with the axe, knocks a chip out a swing, and on the last of
// `treeChops()` it falls in AFTER_FALL_FRAMES held frames, its crown's cells
// fading off after (never a pop), and lies as logs for the haulers. The stump
// stays until a planter grubs it and sets a sapling for a little faith.
//
// Each plot is a row of `S.after.plots`: { stage, grow, chops, chip, fall,
// fell, logs, stump, old }.

import { S } from '../state.js';
import { P, AFTER_PLOTS, AFTER_LOGS_A_TREE, AFTER_FALL_S, AFTER_CROWN_FADE_S, AFTER_SAPLING_FAITH } from '../config.js';
import { secs } from './util.js';
import { growS, treeChops } from './levels.js';
import { plotX, afterFloor } from './place.js';

export const GROWN = 3;
// A tree's trunk and crown, in cells, by stage: none, sapling, pole, crown.
export const TRUNK_CELLS = [0, 2, 6, 10];
export const CROWN_CELLS = [0, 1, 2, 4];

export const blankPlots = () => Array.from({ length: AFTER_PLOTS }, () =>
  ({ stage: GROWN, grow: 0, chops: 0, chip: null, fall: null, fell: null, logs: 0, stump: false, old: true }));

// A tree standing whole and not already coming down.
export const standing = p => p.stage === GROWN && p.fall == null;

// The plot of a grown tree under a world point: its trunk and crown's box.
export function treeAt(x, y) {
  const plots = S.after ? S.after.plots : [];
  const floor = afterFloor();
  for (let i = 0; i < plots.length; i++) {
    const p = plots[i];
    if (!standing(p)) continue;
    const cx = plotX(i), r = CROWN_CELLS[GROWN] + 1;
    const top = floor - (TRUNK_CELLS[GROWN] + CROWN_CELLS[GROWN] * 2) * P;
    if (x >= cx - r * P && x < cx + (r + 1) * P && y >= top && y <= floor) return i;
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
  if (p.chops >= treeChops()) { p.fall = a.t; p.chops = 0; }
  return true;
}

// A planter's work done: the stump grubbed, a sapling set, paid in faith.
// False while the faith is short.
export function plantPlot(i) {
  const a = S.after, p = a.plots[i];
  if (!p || p.stage !== 0 || a.faith < AFTER_SAPLING_FAITH) return false;
  a.faith -= AFTER_SAPLING_FAITH;
  p.stage = 1; p.grow = 0; p.stump = false; p.old = false;
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
      p.stage = 0; p.stump = true; p.logs += AFTER_LOGS_A_TREE;
    }
    if (p.fell != null && a.t - p.fell > AFTER_CROWN_FADE_S) p.fell = null;
  }
}

// The trees standing, for the drawing.
export const trees = () => (S.after ? S.after.plots : []);
