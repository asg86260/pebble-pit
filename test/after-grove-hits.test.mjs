// Act 3's grove under the hand (after/grove.js, `treeAt` and `stumpAt`): a
// press lands on a tree or a stump exactly where the drawing inks it. The
// grove is drawn (render/after/pine.js) on a sheet that keeps every black
// cell it is told to fill, and every cell round the pine and the stump is
// asked of the hit tests: inked, it is the plot's; paper, it is nobody's.
// A press through the hand's own call (`gestureDown`) on the crown's tip
// takes hold of the saw. The plots' shapes are the setup these checks are
// not about, set on the act's state.
import { group, ok, run, yard, P } from './helpers.mjs';
import { GREY } from '../src/config.js';
import { afterFloor, plotX } from '../src/after/place.js';
import { treeAt, stumpAt } from '../src/after/grove.js';
import { gestureDown, gestureUp, gestureView } from '../src/after/gestures.js';
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
  S.after.plots = [plot(), plot({ big: true }), plot({ stage: 0, stump: true })];
  window.__look(plotX(1) - S.viewW / 2);
  run(3);   // past every fade, so each is drawn whole
  const ink = inked(), fl = afterFloor() / P;
  const wrong = [];
  // A big pine's foot reaches over its neighbors' ground, so a cell is asked
  // only whether it is somebody's.
  for (let cx = plotX(0) / P - 12; cx <= plotX(2) / P + 12; cx++) for (let cy = fl - 28; cy < fl; cy++) {
    const x = cx * P + P / 2, y = cy * P + P / 2, drawn = ink.has(`${cx},${cy}`);
    const hit = treeAt(x, y) ?? stumpAt(x, y);
    if (drawn !== (hit != null)) wrong.push(`cell ${cx},${cy - fl}: ${drawn ? 'inked, missed' : `paper, got plot ${hit}`}`);
  }
  // The crown's tip, the tree's highest inked cell, pressed by the hand.
  window.__afterAxe();
  const tip = [...ink].map(k => k.split(',').map(Number)).filter(([cx]) => cx === plotX(0) / P).reduce((a, b) => (b[1] < a[1] ? b : a));
  gestureDown(tip[0] * P + P / 2, tip[1] * P + P / 2);
  const held = (gestureView() || []).find(r => r.key === 'tree');
  gestureUp();
  window.__actsOn(null);
  return [
    ok(ink.size > 100, 'the grove drew its pines and its stump', `${ink.size} cells`),
    ok(!wrong.length, 'every inked cell is its plot\'s, and every paper cell round it nobody\'s', wrong.slice(0, 6).join('; ')),
    ok(held && held.i === 0 && held.grab, 'a press on the crown\'s tip takes hold of that tree\'s saw', JSON.stringify(held && { i: held.i, grab: held.grab }))
  ];
}, { reload: false });
