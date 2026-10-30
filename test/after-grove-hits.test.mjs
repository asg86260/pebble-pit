// Act 3's grove under the hand (after/grove.js, `treeAt` and `stumpAt`): a
// press lands on a tree or a stump exactly where the drawing paints it. The
// grove is drawn (render/after/pine.js) on a sheet that keeps every cell it
// is told to fill in the tree's own colors (its log browns and leaf greens,
// not the soil's greys), and every cell round the tree and the stump is
// asked of the hit tests: painted, it is the plot's; paper, it is nobody's.
// A press through the hand's own call (`gestureDown`) on the crown's tip
// takes that tree's saw (the grove's board is the forestry shack's), as one
// on the saw lying across its trunk does. The plots' shapes are the setup these checks are not about,
// set on the act's state.
import { group, ok, run, yard, P } from './helpers.mjs';
import { GREY, AFTER_PLOT_GAP, AFTER_ART_SCALE } from '../src/config.js';
import { groundOf, plotX, treeRows } from '../src/after/place.js';
import { treeAt, stumpAt } from '../src/after/grove.js';
import { gestureDown, gestureUp, gestureView, handSawAt } from '../src/after/gestures.js';
import { stationAt } from '../src/stations.js';
import { paintOn } from '../src/render/ctx.js';
import { drawAfterGrove } from '../src/render/after.js';

const S = yard.S;
const OPENING = ['house-fall', 'arrive', 'meet-god', 'refuse'];
function up() {
  window.__actsOn(true);
  S.after = null;
  window.__goPlace('after');
  for (const k of OPENING) if (!S.beatsDone.includes(k)) S.beatsDone.push(k);
  run(1);
}
const plot = over => ({ grow: 1, seed: null, tones: [0, 1, 2, 3, 1], stump: false, dug: 0, fall: null, fell: null, chops: 0, by: null, ...over });
const GREYS = new Set(GREY);

// The world cells the grove's drawing fills in the tree's colors, as "col,row" of P cells.
function inked() {
  const cells = new Set();
  let style = null;
  const g = new Proxy({}, {
    get: (o, k) => (k === 'fillRect' ? (x, y, w, h) => {
      if (GREYS.has(style)) return;
      for (let cx = Math.floor(x / P); cx < Math.ceil((x + w) / P); cx++)
        for (let cy = Math.floor(y / P); cy < Math.ceil((y + h) / P); cy++) cells.add(`${cx},${cy}`);
    } : k in o ? o[k] : () => ({})),
    set: (o, k, v) => { if (k === 'fillStyle') style = v; o[k] = v; return true; }
  });
  paintOn({ getContext: () => g, width: S.W, height: S.H }, drawAfterGrove);
  return cells;
}

group('a press lands on a tree and a stump exactly where they are drawn', async () => {
  up();
  // Three grown trees side by side, then a stump.
  S.after.plots = [plot(), plot(), plot(), plot({ grow: null, stump: true })];
  window.__look(plotX(1) - S.viewW / 2);
  run(3);   // past every fade, so each is drawn whole
  const ink = inked(), fl = groundOf('grove') / P;
  const wrong = [];
  // Each cell is its nearest trunk's plot: no tree reaches onto another's ground.
  const owner = cx => [0, 1, 2, 3].reduce((a, b) => (Math.abs(cx - plotX(b) / P) < Math.abs(cx - plotX(a) / P) ? b : a));
  // Asked over the tree's whole reach and height, and a margin, in grid
  // cells: its rows are its art's cells, AFTER_ART_SCALE grid cells each.
  const big = treeRows(), A = AFTER_ART_SCALE;
  const reach = (Math.max(...big.map(([, a, b]) => Math.max(-a, b + 1))) + 2) * A, high = (2 - Math.min(...big.map(([r]) => r))) * A;
  for (let cx = plotX(3) / P - reach; cx <= plotX(0) / P + reach; cx++) for (let cy = fl - high; cy < fl; cy++) {
    const x = cx * P + P / 2, y = cy * P + P / 2, drawn = ink.has(`${cx},${cy}`), i = owner(cx);
    const hit = treeAt(x, y) ?? stumpAt(x, y);
    if (drawn !== (hit === i)) wrong.push(`plot ${i} cell ${cx - plotX(i) / P},${cy - fl}: ${drawn ? `inked, got ${hit}` : `paper, got ${hit}`}`);
  }
  // The floor between two trees' crowns: columns with no paint at all.
  const cols = new Set([...ink].map(k => +k.split(',')[0]));
  let gap = 0;
  for (let cx = plotX(1) / P; cx < plotX(0) / P; cx++) if (!cols.has(cx)) gap++;
  // The crown's tip, the tree's highest inked cell, pressed by the hand.
  window.__afterSaw();
  const tip = [...ink].map(k => k.split(',').map(Number)).filter(([cx]) => cx === plotX(0) / P).reduce((a, b) => (b[1] < a[1] ? b : a));
  // as input.js answers a press: the hand work's first, else the station under it
  const tx = tip[0] * P + P / 2, ty = tip[1] * P + P / 2;
  const asked = gestureDown(tx, ty) ? null : stationAt(tx, ty);
  gestureUp();
  const tipSaws = gestureView().find(r => r.key === 'tree').on;
  run(0.5);
  // the hand has the first tree's saw now: a press on the saw lying across
  // the second's trunk takes that one
  const grip = handSawAt(1).grip;
  gestureDown(grip.x, grip.y);
  gestureUp();
  const on = gestureView().find(r => r.key === 'tree').on;
  window.__actsOn(null);
  return [
    ok(ink.size > 100, 'the grove drew its trees and its stump', `${ink.size} cells`),
    ok(gap >= AFTER_PLOT_GAP, 'two grown trees stand clear of each other', `${gap} clear columns between them, ${AFTER_PLOT_GAP} at least`),
    ok(!wrong.length, 'every painted cell is its plot\'s, and every paper cell round it nobody\'s', wrong.slice(0, 6).join('; ')),
    ok(asked === null && tipSaws === 0, 'a press on the crown\'s tip takes that tree\'s saw, no board asked for', JSON.stringify([asked, tipSaws])),
    ok(on === 1, 'and one on the saw across another tree\'s trunk takes that one', String(on))
  ];
}, { reload: false });
