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
// and lie where they stop on the act's ground (after/ground.js), its crown fading off (never a
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
// fell, laid on the ground on its first frame. A log on the ground is a
// unit of the act's one ground, as is every good the hand or a body let go
// of (`groundLogs`, below).

import { S } from '../state.js';
import { P, TREE_CHOPS, AFTER_LOGS_A_TREE, AFTER_LOGS_BIG_TREE, AFTER_FALL_S, AFTER_CROWN_FADE_S, AFTER_DIG_CLICKS,
         AFTER_PLOTS0, AFTER_FALL_BOUNCE_S, AFTER_LOG_ROLL, AFTER_LOG_ROLL_S, AFTER_LOG_SPAN, KINDS } from '../config.js';
import { secs, nextId } from './util.js';
import { growS, bigTrees } from './levels.js';
import { PINE_GROWN, stationParts, plotX, AP } from './place.js';
import { putSomewhere, heapAt, takeAt, tag, fallTag, lying, colX } from './ground.js';
import { afterGround as G } from '../state.js';
import { cellOf } from '../grid.js';

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
// A log or any good lying on the act's floor is a unit of its one ground
// (after/ground.js), wherever it came down: it stacks, rolls and rests by the
// heap rule every block settles by, and is taken off the top. What follows
// keeps the lying list's old shape over the ground (TEMP: step 3's carry and
// hand read the cells): a row a loose unit, { id, kind, x, y, w, free } and
// its arrival, `x0` and `at` a felled log's, `y0` and `fall` a good let go of.
const snap = v => Math.round(v / P) * P;
const hsh = n => { let h = Math.imul(n ^ 0x9e3779b9, 2654435761); h ^= h >>> 15; return (h >>> 0) / 4294967296; };
// Plot i's trunk split into `n` logs across the fallen tree, which come to
// rest as the heap logs make on the grove's floor (ground.js, `heapAt`: a
// mound a block a step, never one log through another), leaning to the far
// side the tree fell to: its middle half a log past the middle of the
// trunk's span. Each splits off the trunk a little short of where it rests
// and sets off rolling there at `at`, the drawing's (render/after/piles.js).
function dropLogs(i, n, at) {
  const [a, b] = AFTER_LOG_SPAN, mid = plotX(i) + ((a + b) / 2 + KINDS.log.size / 2) * AP;
  for (const ai of heapAt(cellOf('log'), mid, n)) {
    if (ai < 0) continue;
    const roll = (AFTER_LOG_ROLL[0] + (AFTER_LOG_ROLL[1] - AFTER_LOG_ROLL[0]) * hsh(nextId())) * AP;
    tag(ai, { i, x0: snap(colX(ai % G.cols) - roll), at });
  }
}
// Whether a good on the floor may be taken up now: nothing on it, not
// falling, and done rolling off a felled trunk or coming down from the hand.
export const settled = q => q.free !== false && S.after.t >= (q.at ?? -Infinity) + (q.fall ?? AFTER_LOG_ROLL_S);
// What a thing lying on the floor is.
export const kindOf = q => q.kind || 'log';
// A good lying still on the floor under (x, y), `pad` px of slack round it,
// for the hover to name: the last in the list first.
export function lyingAt(x, y, pad = 0) {
  const list = groundLogs();
  for (let i = list.length - 1; i >= 0; i--) if (settled(list[i]) && under(list[i], x, y, pad)) return list[i];
  return null;
}
// Whether (x, y) is on a lying good, `pad` px of slack round it.
const under = (q, x, y, pad) => x >= q.x - pad && x <= q.x + q.w + pad && y >= q.y - pad && y <= q.y + q.w + pad;
// Every good lying free within `pad` px of (x, y), nearest first.
export function lyingNear(x, y, pad) {
  const mid = q => q.x + q.w / 2;
  return groundLogs().filter(q => settled(q) && under(q, x, y, pad)).sort((a, b) => Math.abs(mid(a) - x) - Math.abs(mid(b) - x));
}
// A good let go of at (x, y), off any pile: x its left edge, y the height it
// falls from under the yard's gravity, down onto whatever stands under it on
// the ground, where it lies until a gatherer takes it up. Its fall is drawn
// from y to where it came to rest (ground.js, `fallTag`).
export function layGood(kind, x, y) {
  const ai = putSomewhere(cellOf(kind), x + KINDS[kind].size * AP / 2);
  fallTag(ai, y);
}
// A gatherer taking good `id` up off the ground: only off the top, and only
// once it is down.
export function takeGroundLog(id) {
  const q = groundLogs().find(o => o.id === id);
  if (!q || !settled(q)) return false;
  return !!takeAt(id);
}
// The goods lying on the ground, for the drawing and the bodies.
export const groundLogs = () => (S.after ? lying() : []);

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
