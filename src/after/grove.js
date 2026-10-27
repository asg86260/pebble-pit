// The grove: heaven's trees (DESIGN.md, "Acts 3 and 4", act 3, "The chain:
// trees to signs", the grove; call 10, settled 2026-10-18).
// Placeholder drawing.
//
// The grove starts at one plot with a grown tree in it, and its card clears
// more plots (AFTER_PLOT_MAX in all), quickens the growth, grows bigger trees,
// posts woodcutters and buys them stump removal (the owner, 2026-10-18). A
// tree grows in held stages, sapling, pole, crown, a stage every `growS()`;
// the hand with the axe, or a woodcutter, knocks a chip out a swing, and on
// the last of TREE_CHOPS it tips over (render/after/pine.js turns it by its
// true angle), hits, and its trunk splits into logs that roll off a little
// and lie where they stop (`groundLogs`), its crown fading off (never a
// pop), until a gatherer carries each to the forestry shack's pile, where
// the haulers fetch them. The stump blocks the plot until it is dug out -- by the hand, a
// click a held swing, AFTER_DIG_CLICKS of them, or by a woodcutter once stump
// removal is bought -- and digging it out sets a sapling in the plot, free.
// A plot newly cleared is set with its first sapling the same way.
//
// Each plot is a row of `S.after.plots`: { stage, grow, chops, chip, fall,
// fell, logs, stump, dug, big, at } -- `dug` the swings taken at its stump,
// `big` a tree planted after "bigger trees", `at` when the plot was cleared
// (it fades in); `logs` only a save's from before the logs lay where they
// fell, laid on the ground on its first frame. A log on the ground is a row
// of `S.after.groundLogs`: { id, i, x0, x, at } -- its plot, where it split
// off the trunk and where it comes to rest (world px), and when it set off
// rolling. A good the hand let go of lies in the same list, `kind` saying
// what it is, `i` null, falling from `y0` for `fall` seconds instead of
// rolling.

import { S } from '../state.js';
import { P, TREE_CHOPS, AFTER_LOGS_A_TREE, AFTER_LOGS_BIG_TREE, AFTER_FALL_S, AFTER_CROWN_FADE_S, AFTER_DIG_CLICKS,
         AFTER_PLOTS0, AFTER_FALL_BOUNCE_S, AFTER_LOG_ROLL, AFTER_LOG_ROLL_S, AFTER_LOG_SPAN, GRAV } from '../config.js';
import { secs, nextId } from './util.js';
import { growS, bigTrees } from './levels.js';
import { PINE_GROWN, stationParts, plotX, floorAt, AP } from './place.js';

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

// --- the logs on the ground ---------------------------------------------------------
const snap = v => Math.round(v / P) * P;
const hsh = n => { let h = Math.imul(n ^ 0x9e3779b9, 2654435761); h ^= h >>> 15; return (h >>> 0) / 4294967296; };
// Plot i's trunk split into `n` logs across the fallen tree, each setting
// off rolling at `at` a little way along the ground, to the far side the
// tree fell to.
function dropLogs(i, n, at) {
  const x0 = plotX(i), [a, b] = AFTER_LOG_SPAN;
  for (let k = 0; k < n; k++) {
    const id = nextId(), from = snap(x0 + (a + (b - a) * (k + 0.5) / n) * AP);
    const roll = (AFTER_LOG_ROLL[0] + (AFTER_LOG_ROLL[1] - AFTER_LOG_ROLL[0]) * hsh(id)) * AP;
    S.after.groundLogs.push({ id, i, x0: from, x: snap(from + roll), at });
  }
}
// Whether a log has stopped rolling, or a good let go of by the hand has
// come down (`fall`, its seconds): a gatherer takes it up only then.
export const settled = q => S.after.t >= q.at + (q.fall ?? AFTER_LOG_ROLL_S);
// What a thing lying on the floor is: a felled tree's log, or whatever the
// hand let go of there (after/hand.js, `kind`).
export const kindOf = q => q.kind || 'log';
// A good let go of by the hand at (x, y), off any pile: it falls under the
// yard's gravity (GRAV, px a frame a frame) straight down to the floor at
// x, and lies there as a felled log does until a gatherer or the hand takes
// it up.
export function layGood(kind, x, y) {
  const a = S.after, fl = floorAt(x + AP), h = Math.max(0, fl - y);
  a.groundLogs.push({ id: nextId(), i: null, kind, x0: x, x, y0: Math.min(y, fl), at: a.t, fall: Math.sqrt(2 * h / GRAV) / 60 });
}
// A gatherer taking log `id` up off the ground.
export function takeGroundLog(id) {
  const a = S.after, k = a.groundLogs.findIndex(q => q.id === id);
  if (k < 0 || !settled(a.groundLogs[k])) return false;
  a.groundLogs.splice(k, 1);
  return true;
}
// The logs on the ground, for the drawing and the bodies.
export const groundLogs = () => (S.after ? S.after.groundLogs : []);

// One frame of the grove: the trees growing, and those coming down landing.
export function stepGrove(c) {
  const a = S.after, dt = secs(c);
  a.plots.forEach((p, i) => {
    // A save's logs from before they lay where they fell: on the ground, at rest.
    if (p.logs > 0) { dropLogs(i, p.logs, a.t - AFTER_LOG_ROLL_S); p.logs = 0; }
    if (p.stage > 0 && p.stage < GROWN) {
      p.grow += dt;
      if (p.grow >= growS()) { p.stage += 1; p.grow = 0; }
    }
    if (p.fall != null && a.t - p.fall >= AFTER_FALL_S) {
      p.fall = null; p.fell = a.t;
      p.stage = 0; p.stump = true;
      dropLogs(i, p.big ? AFTER_LOGS_BIG_TREE : AFTER_LOGS_A_TREE, a.t + AFTER_FALL_BOUNCE_S);
    }
    if (p.fell != null && a.t - p.fell > AFTER_FALL_BOUNCE_S + AFTER_CROWN_FADE_S) p.fell = null;
  });
}

// The plots, for the drawing.
export const trees = () => (S.after ? S.after.plots : []);
