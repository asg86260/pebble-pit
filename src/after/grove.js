// The grove: heaven's trees (DESIGN.md, "Act 3's grove, rebuilt", the owner,
// 2026-10-29/30).
//
// A tree is no free thing that grows back by itself. An acorn goes into a
// plot's soil bed (`plantAcorn`, by a worker or the hand), the tree grows up
// row by row over the growth time, it is sawn down -- by the hand, always,
// or by the woodcutter once the saw is bought -- and on the last stroke it
// tips over away from the shack (render/after/pine.js turns it by its true
// angle), hits, rocks back once and breaks: its crown into clumps that
// scatter and fade, its trunk along its seams into exactly the four logs it
// is drawn as, each a unit of the act's one ground (after/ground.js) laid on
// the break frame and drawn hopping apart from its arrival tag. The stump is
// left, one whole log block, until its roots are pulled (`digStump`, a root
// at a time) and it comes out as a fifth log (`unroot`), the plot bare
// again. Nothing on a plot ever comes from nowhere: no tree without an
// acorn, no log but at a door (src/flow.js).
//
// Each plot is a row of `S.after.plots`:
//   grow   0..1 the tree's growth, 1 grown; null on a bare bed or a stump
//   seed   when its acorn went in (the sink's drawing), null for none seen
//   tones  its four logs' tones and its stump's, picked when it was planted
//   stump  a stump stands; `dug` the roots snapped from it so far
//   fall   when the tree began to tip; `fell` when it hit the ground
//   chops  saw strokes into the standing trunk; `by` who sawed the last one
//          ('hand' or 'worker'), for the rule that only the hand fells
//          without the saw bought
// A plot is exactly one of: bare, growing, standing, falling, stumped.

import { S } from '../state.js';
import { source, sink } from '../flow.js';
import { P, TREE_CHOPS, AFTER_FALL_S, AFTER_FALL_BOUNCE_S, AFTER_DIG_CLICKS, AFTER_PLOTS0, AFTER_SEED_SINK_S,
         AFTER_TREE, AFTER_BREAK_S, AFTER_BREAK_SPREAD, AFTER_CROWN_S, KINDS } from '../config.js';
import { secs, arand } from './util.js';
import { growS } from './levels.js';
import { stationParts, plotX, plotSpan, groundOf, treeHas, AP } from './place.js';
import { putSomewhere, tag, fallTag, lying, treeCol } from './ground.js';
import { afterGround as G } from '../state.js';
import { cellOf } from '../grid.js';

// A tree's logs and stump each one of the log's tones; the stump never the
// darkest, which is its roots' (DESIGN.md, "The tree, drawn").
const pickTones = () => {
  const n = KINDS.log.tones;
  return [...Array.from({ length: AFTER_TREE.logs }, () => Math.floor(arand() * n)), Math.floor(arand() * (n - 1))];
};
const plot = (grow = null) => ({ grow, seed: null, tones: pickTones(), stump: false, dug: 0, fall: null, fell: null, chops: 0, by: null });
// The grove at the act's start: its first plot, a grown tree in it (call 10).
export const blankPlots = () => Array.from({ length: AFTER_PLOTS0 }, () => plot(1));
// A plot cleared by the grove's card: a bare bed, waiting on an acorn.
export const clearPlot = () => { S.after.plots.push(plot()); };

// What a plot is now.
export const bare = p => p.grow == null && !p.stump && p.fall == null;
export const growing = p => p.grow != null && p.grow < 1 && p.fall == null;
// A tree standing whole and not already coming down.
export const standing = p => p.grow != null && p.grow >= 1 && p.fall == null;
export const falling = p => p.fall != null;
// A stump left standing, blocking its plot.
export const stumped = p => p.stump && p.fall == null;
// A bare plot an acorn may go into: nothing lying on its own ground
// (`plotSpan`). Not its trunk's columns alone: a tree felled over its last
// tree's logs would heap its own on them and roll the last off the plot,
// so the plot is cleared before it is planted, and every felled tree's logs
// come to rest on their own plot.
export function plantable(i) {
  const p = S.after?.plots[i];
  if (!p || !bare(p) || !G.grid) return false;
  const [x0, x1] = plotSpan(i);
  return !lying().some(q => q.x < x1 && q.x + q.w > x0);
}

// The plot of a grown tree under a world point: on the tree as drawn, cell
// for cell (place.js, `treeHas`), the sky between its clumps nobody's.
export function treeAt(x, y) {
  const plots = S.after ? S.after.plots : [];
  for (let i = 0; i < plots.length; i++) {
    if (!standing(plots[i])) continue;
    const col = Math.floor((x - plotX(i)) / AP), row = Math.floor((y - groundOf('grove')) / AP);
    if (treeHas(col, row)) return i;
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

// --- the doors -----------------------------------------------------------------
// An acorn of value `v` into plot i's soil (the `planted` sink): the hand's
// let go over a bare bed, or a worker kneeling at it. The tree starts growing
// once the acorn has sunk in. False, and nothing unmade, on a plot that is
// not plantable.
export function plantAcorn(i, v) {
  const a = S.after, p = a && a.plots[i];
  if (!p || !plantable(i)) return false;
  sink('acorn', 1, 'planted');
  Object.assign(p, { grow: 0, seed: a.t, tones: pickTones(), chops: 0, by: null, dug: 0 });
  return true;
}
// A stroke of the saw into plot i's trunk: by the hand (`hand`), always, or
// by the woodcutter. On the last of TREE_CHOPS the tree starts to fall.
export function chopTree(i, hand = false) {
  const a = S.after, p = a.plots[i];
  if (!p || !standing(p)) return false;
  p.chops += 1;
  if (p.chops >= TREE_CHOPS) { p.fall = a.t; p.chops = 0; p.by = hand ? 'hand' : 'worker'; }
  return true;
}
// A root snapped off plot i's stump: by the hand's strain held, or a
// woodcutter's pull. On the last root the stump is free, and comes out as a
// log (`unroot`): handed to `into(v)` when the caller takes it up, else laid
// down beside the plot.
export function digStump(i, hand = false, into = null) {
  const p = S.after.plots[i];
  if (!p || !stumped(p)) return false;
  p.dug += 1;
  if (p.dug < AFTER_DIG_CLICKS) return true;
  const v = unroot(i);
  if (into) into(v);
  else layGood('log', plotX(i) + AFTER_TREE.c0 * AP, groundOf('grove') - AFTER_TREE.stump * AP, v);
  return true;
}
// Plot i's stump out of the ground, its roots all snapped: the plot bare
// again, and the stump made a log in its own tone (the `stump` source). Its
// cell value, for the hand or the arms it goes into, or 0 with no stump free.
export function unroot(i) {
  const p = S.after.plots[i];
  if (!p || !stumped(p) || p.dug < AFTER_DIG_CLICKS) return 0;
  source('log', 1, 'stump');
  const v = cellOf('log', p.tones ? p.tones[AFTER_TREE.logs] : 0);
  Object.assign(p, { stump: false, dug: 0, grow: null, seed: null, fell: null });
  return v;
}

// --- the logs on the ground ---------------------------------------------------------
// The four logs the landed trunk breaks into, each set down where it lay in
// the trunk -- end to end from the stump away from the shack -- and come to
// rest there by the heap rule (ground.js, `putSomewhere`), the nearest log
// first; each tagged with where it lay and when it breaks, so the drawing
// hops it a cell up and apart to its rest (render/after/piles.js).
function breakLogs(i, at) {
  const p = S.after.plots[i], { c0, logs, log } = AFTER_TREE, L = log * AP, pivot = plotX(i) + c0 * AP;
  for (let k = 0; k < logs; k++) {
    const x0 = pivot - (k + 1) * L, ai = putSomewhere(cellOf('log', p.tones ? p.tones[k] : 0), x0 + L / 2 - (k - (logs - 1) / 2) * AFTER_BREAK_SPREAD);
    if (ai < 0) continue;
    source('log', 1, 'tree');
    tag(ai, { i, x0, at, hop: true });
  }
}
// Whether a good on the floor may be taken up now: nothing on it, not
// falling, and done hopping off a broken trunk or coming down from the hand.
export const settled = q => q.free !== false && S.after.t >= (q.at ?? -Infinity) + (q.fall ?? AFTER_BREAK_S);
// What a thing lying on the floor is.
export const kindOf = q => q.kind || 'log';
// A good lying still on the floor under (x, y), `pad` px of slack round it,
// for the hover to name: the last in the list first.
export function lyingAt(x, y, pad = 0) {
  const list = lying();
  for (let i = list.length - 1; i >= 0; i--) if (settled(list[i]) && under(list[i], x, y, pad)) return list[i];
  return null;
}
// Whether (x, y) is on a lying good, `pad` px of slack round it.
const under = (q, x, y, pad) => x >= q.x - pad && x <= q.x + q.w + pad && y >= q.y - pad && y <= q.y + (q.h ?? q.w) + pad;
// A good let go of at (x, y), off any pile: x its left edge, y the height it
// falls from under the yard's gravity, down onto whatever stands under it on
// the ground, where it lies until a gatherer takes it up. Its fall is drawn
// from y to where it came to rest (ground.js, `fallTag`).
export function layGood(kind, x, y, v) {
  const ai = putSomewhere(v || cellOf(kind), x + KINDS[kind].size * AP / 2);
  fallTag(ai, y);
}
// When a felled tree's crown is done breaking: the verify rule's exception
// and the drawing both read it.
export const breakEnds = p => (p.fell == null ? -Infinity : p.fell + AFTER_FALL_BOUNCE_S + AFTER_CROWN_S);
// One frame of the grove: the trees growing, and those coming down landing
// and breaking.
export function stepGrove(c) {
  const a = S.after, dt = secs(c);
  a.plots.forEach((p, i) => {
    // A save from before the rebuild names no tones: picked on its first frame.
    if (!Array.isArray(p.tones)) p.tones = pickTones();
    if (growing(p) && (p.seed == null || a.t - p.seed >= AFTER_SEED_SINK_S)) p.grow = Math.min(1, p.grow + dt / growS());
    // Down: the trunk's logs are laid now, under the trunk rocking back, and
    // break out of it the moment it settles (their tags' `at`), so the data
    // never holds a log in mid-air nor the drawing a log twice.
    if (p.fall != null && a.t - p.fall >= AFTER_FALL_S) {
      p.fall = null; p.fell = a.t; p.grow = null; p.stump = true; p.dug = 0; p.seed = null;
      breakLogs(i, a.t + AFTER_FALL_BOUNCE_S);
    }
    if (p.fell != null && a.t > breakEnds(p)) p.fell = null;
  });
}

// The plots, for the drawing.
export const trees = () => (S.after ? S.after.plots : []);
// Whether a world column is a tree's (ground.js, `treeCol`), for a caller
// that thinks in world x.
export const underTree = x => !!G.grid && treeCol(Math.floor((x - G.x) / AP));
