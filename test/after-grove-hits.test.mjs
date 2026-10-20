// Act 3's grove under the hand (after/grove.js, `treeAt` and `stumpAt`): a
// press lands on a tree or a stump exactly where the drawing inks it. The
// grove is drawn (render/after/pine.js) on a sheet that keeps every black
// cell it is told to fill, and every cell round the pine and the stump is
// asked of the hit tests: inked, it is the plot's; paper, it is nobody's.
// A press through the hand's own call (`gestureDown`) on the crown's tip
// asks for the grove's board, and one on the saw icon over it puts the saw
// on that tree. The plots' shapes are the setup these checks are not about,
// set on the act's state.
import { group, ok, run, yard, P } from './helpers.mjs';
import { GREY, AFTER_PLOT_GAP, AFTER_ART_SCALE } from '../src/config.js';
import { afterFloor, plotX, pineRows, PINE_GROWN } from '../src/after/place.js';
import { treeAt, stumpAt } from '../src/after/grove.js';
import { gestureDown, gestureUp, gestureView, groveIcons } from '../src/after/gestures.js';
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
const plot = over => ({ stage: 3, grow: 0, chops: 0, chip: null, fall: null, fell: null, logs: 0, stump: false, dug: 0, big: false, at: null, ...over });

// The world cells the grove's drawing fills black, as "col,row" of P cells.
function inked() {
  const cells = new Set();
  let style = null;
  const g = new Proxy({}, {
    get: (o, k) => (k === 'fillRect' ? (x, y, w, h) => {
      if (style !== GREY[10]) return;
      for (let cx = Math.floor(x / P); cx < Math.ceil((x + w) / P); cx++)
        for (let cy = Math.floor(y / P); cy < Math.ceil((y + h) / P); cy++) cells.add(`${cx},${cy}`);
    } : k in o ? o[k] : () => ({})),
    set: (o, k, v) => { if (k === 'fillStyle') style = v; o[k] = v; return true; }
  });
  paintOn({ getContext: () => g, width: S.W, height: S.H }, drawAfterGrove);
  return cells;
}

group('a press lands on a pine and a stump exactly where they are drawn', async () => {
  up();
  // Two big pines side by side, the widest a plot holds, then a grown one and a stump.
  S.after.plots = [plot({ big: true }), plot({ big: true }), plot(), plot({ stage: 0, stump: true })];
  window.__look(plotX(1) - S.viewW / 2);
  run(3);   // past every fade, so each is drawn whole
  const ink = inked(), fl = afterFloor() / P;
  const wrong = [];
  // Each cell is its nearest trunk's plot: no pine reaches onto another's ground.
  const owner = cx => [0, 1, 2, 3].reduce((a, b) => (Math.abs(cx - plotX(b) / P) < Math.abs(cx - plotX(a) / P) ? b : a));
  // Asked over the biggest pine's whole reach and height, and a margin, in
  // grid cells: its rows are its art's cells, AFTER_ART_SCALE grid cells each.
  const big = pineRows(PINE_GROWN, true), A = AFTER_ART_SCALE;
  const reach = (Math.max(...big.map(([, a, b]) => Math.max(-a, b))) + 2) * A, high = (2 - Math.min(...big.map(([r]) => r))) * A;
  for (let cx = plotX(0) / P - reach; cx <= plotX(3) / P + reach; cx++) for (let cy = fl - high; cy < fl; cy++) {
    const x = cx * P + P / 2, y = cy * P + P / 2, drawn = ink.has(`${cx},${cy}`), i = owner(cx);
    const hit = treeAt(x, y) ?? stumpAt(x, y);
    if (drawn !== (hit === i)) wrong.push(`plot ${i} cell ${cx - plotX(i) / P},${cy - fl}: ${drawn ? `inked, got ${hit}` : `paper, got ${hit}`}`);
  }
  // The floor between the two big pines' feet: columns with no ink at all.
  const cols = new Set([...ink].map(k => +k.split(',')[0]));
  let gap = 0;
  for (let cx = plotX(0) / P; cx < plotX(1) / P; cx++) if (!cols.has(cx)) gap++;
  // The crown's tip, the tree's highest inked cell, pressed by the hand.
  window.__afterAxe();
  const tip = [...ink].map(k => k.split(',').map(Number)).filter(([cx]) => cx === plotX(0) / P).reduce((a, b) => (b[1] < a[1] ? b : a));
  // as input.js answers a press: the hand work's first, else the station under it
  const tx = tip[0] * P + P / 2, ty = tip[1] * P + P / 2;
  const asked = gestureDown(tx, ty) ? null : stationAt(tx, ty);
  gestureUp();
  run(0.5);
  const icon = groveIcons().find(c => c.kind === 'saw' && c.i === 0);
  gestureDown(icon.x, icon.y - 2);
  gestureUp();
  const on = gestureView().find(r => r.key === 'tree').i;
  window.__actsOn(null);
  return [
    ok(ink.size > 100, 'the grove drew its pines and its stump', `${ink.size} cells`),
    ok(gap >= AFTER_PLOT_GAP, 'two big pines stand clear of each other', `${gap} clear columns between them, ${AFTER_PLOT_GAP} at least`),
    ok(!wrong.length, 'every inked cell is its plot\'s, and every paper cell round it nobody\'s', wrong.slice(0, 6).join('; ')),
    ok(asked === 'after-grove', 'a press on the crown\'s tip asks for the grove\'s board', JSON.stringify(asked)),
    ok(on === 0, 'and one on the saw icon over it puts the saw on that tree', String(on))
  ];
}, { reload: false });
