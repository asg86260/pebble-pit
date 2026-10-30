// MOCK act-3-the-cabin: the forestry shack redrawn four ways for the owner
// to vote on ("lets give it a tree or something fun on it, instead of a log
// cabin"), never merged. While `globalThis.__cabinMock` names an option,
// render/after/stations.js draws the forestry shack from here instead of
// its log cabin. Every option keeps to the shack's box columns (its frame's
// 8 to 23), since the grove mock lays the first plot off that box; height
// is free. Act 3's language: flat squares of one tone, no outlines; the
// leaves the grove's OAK-2 clumps in its oak-leaf green (lit edge on top,
// each clump's underside in shadow, the body two close tones), the wood the
// log's and the timber's browns.

import { P } from '../../config.js';
import { darkPage, raw } from '../../ink.js';
import { held } from '../../reset.js';
import { K, W, PALE, MID, hash, clamp01 } from './kit.js';
import { goodTone } from './piles.js';

held('cabin-mock', () => { globalThis.__cabinMock = null; });

// The grove mock's oak-leaf green (render/after/grovemock.js, CROWNS[4]),
// lightest first: lit tips, body, body's darker half, shadow under a clump.
const LEAF = { light: ['#4c7f3c', '#406d33', '#38602c', '#2a4920'], dark: ['#64a052', '#568c46', '#4b7c3d', '#3a612f'] };
const leaf = i => (darkPage ? raw(LEAF.dark[i]) : LEAF.light[i]);
const LOG = i => goodTone('log', i);      // bark and beams, lightest first
const WOOD = i => goodTone('plank', i);   // sawn wood: a cut face, boards

// --- clumps -------------------------------------------------------------------------
// A crown of round clumps [cx, cy, r] in the drawing's cells, cy up off the
// floor: each cell the clump it sits deepest in; a cell with no leaf of its
// own clump under it the shadow, with sky over it the lit edge, the rest the
// body's two tones a cell at a time. Worked out once a crown.
const CLUMPS = new Map();
function clumpCells(lobes) {
  const id = JSON.stringify(lobes);
  if (CLUMPS.has(id)) return CLUMPS.get(id);
  const own = new Map();
  for (let h = 0; h < 40; h++) for (let i = -2; i < 18; i++) {
    const x = i + 0.5, y = h + 0.5;
    let best = -1, bd = 0;
    lobes.forEach(([cx, cy, r], k) => { const dd = Math.hypot(x - cx, y - cy) - r; if (dd <= 0 && (best < 0 || dd < bd)) { best = k; bd = dd; } });
    if (best >= 0) own.set(`${i}|${h}`, best);
  }
  const out = [];
  for (const [key, k] of own) {
    const [i, h] = key.split('|').map(Number);
    const below = own.get(`${i}|${h - 1}`), above = own.get(`${i}|${h + 1}`);
    out.push([i, h, below !== k ? 3 : above == null ? 0 : null]);
  }
  CLUMPS.set(id, out);
  return out;
}
// The leaves stir: a slow gust runs across the crown, each body cell
// fading between its two body tones as it passes (a fade, never a step).
function clumps(b, lobes, t, dx = 0) {
  for (const [i, h, role] of clumpCells(lobes)) {
    const base = role != null ? role : hash(i * 31.7 + h * 17.3) < 0.5 ? 1 : 2;
    b.cell(i, h, leaf(base), dx);
    if (role == null && !b.d.sinking) {
      const a = clamp01(Math.sin(t * 1.1 - i * 0.45 + h * 0.2) * 1.6 - 0.9);
      if (a > 0) b.d.fade(a * 0.8, () => b.cell(i, h, leaf(base === 1 ? 2 : 1), dx));
    }
  }
}

// --- smoke --------------------------------------------------------------------------
// Puffs off a chimney's top at (i, h), cells: each a two-cell square rising
// and drifting at its true position, fading in and out. Not part of the
// drawing's ground, so never drawn into its silhouette.
function smoke(b, i, h, t) {
  if (b.d.sinking) return;
  const N = 4, LIFE = 4.8;
  for (let k = 0; k < N; k++) {
    const u = ((t / LIFE + k / N) % 1 + 1) % 1;
    const a = Math.min(1, u * 5) * (1 - u) * 0.85;
    const x = i - 0.5 + u * 1.6 + Math.sin(t * 0.9 + k * 2.1) * 0.35, y = h + u * 8;
    b.d.fade(a, () => b.d.px((b.X + x) * P, -(y + 2) * P, 2 * P, 2 * P, u < 0.45 ? MID : PALE));
  }
}

// A drawing's brush in its own cells, x across from the box's left column,
// h up off the floor (0 the bottom row): `box(i, h, w, n, tone)` a block of
// w by n cells, `cell(i, h, tone, dx)` one cell, `dx` px off it.
const brush = (d, X) => ({
  d, X,
  box(i, h, w, n, tone) { d.r(X + i, -(h + n), w, n, tone); },
  cell(i, h, tone, dx = 0) { if (dx) d.px((X + i) * P + dx, -(h + 1) * P, P, P, tone); else d.c(X + i, -(h + 1), tone); },
  row(h, a, z, tone) { d.r(X + a, -(h + 1), z - a + 1, 1, tone); }
});
// A stepped gable from row h, `w` wide at its eaves off column i, a cell in
// each side a row, `n` rows.
function gable(b, i, h, w, n, tone) {
  for (let k = 0; k < n && w - 2 * k > 0; k++) b.row(h + k, i + k, i + w - 1 - k, tone);
}
// A trunk `w` wide off column i, rows h0 to h1: the lit half and the shaded.
function trunk(b, i, h0, h1, w = 4) {
  for (let h = h0; h <= h1; h++) for (let c = 0; c < w; c++) b.cell(i + c, h, LOG(c < w / 2 ? 1 : 2));
}

// --- A: the oak through the roof ------------------------------------------------------
// A plain cabin an oak has grown up through: the trunk out of the roof's
// ridge, the shingles round it heaved up, an OAK-2 crown over the whole
// house, and a twig in leaf poking out of the window.
const A_CROWN = [[8, 22, 3.6], [4.8, 19, 3.2], [11.2, 19, 3.2], [3, 15.5, 2.6], [13, 15.5, 2.6], [8, 15, 2.8]];
function optA(b, t) {
  b.box(1, 0, 14, 7, WOOD(0));                    // the walls, plain sawn boards (a good's tone, so they read on either page)
  b.box(10, 0, 3, 4, K);                          // the door
  b.box(2, 3, 3, 2, K);                           // the window
  b.box(2, 3, 3, 1, LOG(3));                      // the twig out through it
  b.cell(1, 3, LOG(3)); b.cell(0, 4, LOG(3));
  clumps(b, [[0.5, 5.5, 1.3]], t);               // its leaves outside
  gable(b, 0, 7, 16, 4, LOG(3));                  // the roof
  trunk(b, 6, 7, 17);                             // up through the ridge
  b.cell(5, 10, LOG(2)); b.cell(10, 10, LOG(2));  // shingles heaved up beside it
  b.cell(4, 9, LOG(3)); b.cell(11, 9, LOG(3));
  b.box(5, 7, 1, 3, LOG(3)); b.box(10, 7, 1, 3, LOG(3));
  for (const [i, h] of [[5, 15], [4, 16], [3, 16], [10, 15], [11, 16], [12, 16], [5, 13], [10, 13]]) b.cell(i, h, LOG(3));   // boughs out to the side clumps
  clumps(b, A_CROWN, t);
}

// --- B: the treehouse -----------------------------------------------------------------
// The forestry shack up in an oak's crown: a hut on a platform among the
// clumps, a ladder down the trunk's side to the floor, and a rope swing
// hanging off the platform, swaying.
const B_BACK = [[8, 25.5, 3.8], [3.2, 22, 3.2], [12.8, 22, 3.2], [1.6, 17, 2.2], [14.4, 17, 2.2]];
const B_FRONT = [[3.4, 13.6, 1.7], [12.6, 13.6, 1.7]];
function optB(b, t) {
  b.row(0, 5, 10, LOG(2));                        // the roots' flare
  trunk(b, 6, 1, 21);
  clumps(b, B_BACK, t);                           // the crown behind the hut
  b.box(1, 12, 14, 1, LOG(3));                    // the platform
  b.box(3, 13, 10, 6, WOOD(1));                   // the hut's walls, boards
  for (let h = 14; h < 19; h += 2) b.row(h, 3, 12, WOOD(2));
  b.box(9, 13, 2, 4, K);                          // its door, onto the ladder
  b.box(4, 15, 2, 2, W);                          // its window
  gable(b, 2, 19, 12, 4, LOG(3));                 // its roof
  clumps(b, B_FRONT, t);                          // two clumps in front of its foot
  for (let h = 0; h < 12; h++) { b.cell(11, h, LOG(0)); b.cell(13, h, LOG(0)); }   // the ladder: rails
  for (let h = 1; h < 12; h += 2) b.cell(12, h, LOG(0));                          // and rungs
  // the swing: two ropes off the platform's underside, the seat at their
  // foot, the whole swung about the platform at its true angle
  const th = b.d.sinking ? 0 : Math.sin(t * 1.6) * 0.16, len = 7, px = 3.5, py = 12;
  const sx = px + Math.sin(th) * len, sy = py - Math.cos(th) * len;
  for (const o of [-1, 1]) b.d.line(b.X + px + o, -py, b.X + sx + o, -sy, 2, K);
  b.d.px((b.X + sx - 1.5) * P, -sy * P, 3 * P, P, LOG(3));
}

// --- C: the stump house ---------------------------------------------------------------
// A giant sawn stump hollowed into a house: bark down its sides, the cut
// face on top, an arched door and a round window in it, a stovepipe
// smoking, a shoot in leaf off the cut and a shelf fungus on the bark.
const BARK = [1, 2, 1, 1, 2, 3, 1, 2, 2, 1, 3, 1, 2, 1, 2, 1];
function optC(b, t) {
  b.row(0, 0, 15, LOG(2)); b.row(1, 0, 1, LOG(2)); b.row(1, 14, 15, LOG(2));   // the roots' flare
  for (let i = 1; i <= 14; i++) for (let h = 1; h <= 11; h++) b.cell(i, h, LOG(BARK[i] === 3 && (h + i) % 4 === 0 ? 2 : BARK[i]));
  b.row(12, 1, 14, WOOD(0));                       // the cut face
  for (const i of [3, 7, 8, 12]) b.cell(i, 12, WOOD(2));   // its rings
  b.box(6, 0, 4, 6, K); b.row(6, 7, 8, K);         // the arched door
  b.cell(8, 2, WOOD(0));                           // its knob
  b.row(7, 3, 3, WOOD(0)); b.row(8, 2, 4, WOOD(0)); b.row(9, 3, 3, WOOD(0));   // the round window, framed
  b.cell(3, 8, PALE);
  b.box(11, 4, 2, 2, PALE);                        // a small window
  b.box(14, 5, 2, 1, WOOD(1)); b.cell(15, 6, WOOD(1));   // the shelf fungus
  b.box(11, 13, 2, 4, K); b.row(17, 10, 13, K);    // the stovepipe and its cap
  b.box(4, 13, 1, 3, LOG(3));                      // the shoot off the cut
  clumps(b, [[4.5, 17.5, 1.8], [3.0, 16.0, 1.2], [6.0, 16.2, 1.2]], t);
  smoke(b, 11.5, 18, t);
}

// --- D: the turf roof and its sapling ------------------------------------------------
// A low pale-boarded cottage under a thick roof of turf in the oak's green,
// grass tufts along its ridge and a few flowers, a stone chimney smoking,
// and an oak sapling growing out of the turf, its crown swaying.
function optD(b, t) {
  b.box(2, 0, 12, 6, WOOD(0));                     // the walls, pale boards
  b.box(6, 0, 3, 4, K);                            // the door
  b.box(10, 2, 2, 2, W); b.box(3, 2, 2, 2, W);     // two windows
  b.row(6, 0, 15, LOG(3));                         // the sod's cut edge under the turf
  const turf = [[7, 0, 15], [8, 0, 15], [9, 1, 14], [10, 2, 13], [11, 4, 11]];
  turf.forEach(([h, a, z], k) => { for (let i = a; i <= z; i++) b.cell(i, h, leaf(k === 0 ? 3 : hash(i * 9.1 + h * 3.3) < 0.5 ? 1 : 2)); });
  for (const [i, h] of [[0, 9], [1, 10], [2, 11], [3, 11], [12, 11], [13, 11], [14, 10], [15, 9], [5, 12], [10, 12]]) b.cell(i, h, leaf(0));   // grass tufts
  for (const [i, h] of [[3, 9], [12, 9], [6, 10]]) b.cell(i, h, W);   // flowers
  b.box(11, 10, 2, 5, MID); b.row(15, 10, 13, MID); b.cell(11, 13, PALE); b.cell(12, 11, PALE);   // the stone chimney and its cap
  smoke(b, 12, 16, t);
  // the sapling: a thin trunk off the ridge, its crown swaying as one piece
  const dx = b.d.sinking ? 0 : Math.sin(t * 1.3) * 2;
  b.box(7, 12, 1, 3, LOG(2));
  b.cell(7, 15, LOG(2), dx / 2);
  clumps(b, [[7.5, 18.5, 2.4], [5.6, 17.0, 1.6], [9.4, 17.0, 1.6]], t, dx);
}

const OPTS = { a: optA, b: optB, c: optC, d: optD };
export const cabinMockOn = () => !!OPTS[globalThis.__cabinMock];
// The shack drawn as the option names, its box's left column at frame column X.
export function drawCabinMock(d, t, X) {
  OPTS[globalThis.__cabinMock](brush(d, X), t || 0);
}
