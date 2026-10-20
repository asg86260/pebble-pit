// Act 3's stations are rows of the one station table (stations.js; DESIGN.md,
// "One place engine", step 1): the pointer's one hit test, `stationAt`,
// answers each of them where it is drawn up there, and only up there. The
// yard's rows never answer in the afterlife, and the act's never in the yard.
// A plain press is asked as input.js asks it: the hand work's first, then the
// station under it (test/after-hands.mjs `asks`); the board it names is then
// bought from like any (test/after-boards.test.mjs).
import { group, ok, run, yard, P } from './helpers.mjs';
import { asks } from './after-hands.mjs';
import { stationAt, standRect, hitRect, STATIONS } from '../src/stations.js';
import { stationBox, stationParts, plotX, afterFloor } from '../src/after/place.js';
import { godMid, faceY } from '../src/after/sky.js';

const S = yard.S;
const OPENING = ['house-fall', 'arrive', 'meet-god', 'refuse'];
function up(stand = []) {
  window.__actsOn(true);
  S.after = null;
  window.__goPlace('after');
  for (const k of OPENING) if (!S.beatsDone.includes(k)) S.beatsDone.push(k);
  run(1);
  for (const k of stand) if (!S.after.built.includes(k)) S.after.built.push(k);
  run(0.5);
}
const mid = b => ({ x: b.x + b.w / 2, y: b.y + b.h - P });

group('act 3\'s stations answer the pointer\'s one hit test where they are drawn, and only up there', async () => {
  up(['mill', 'chipper', 'papermill', 'workshop', 'press']);
  const cards = ['mill', 'chipper', 'papermill', 'workshop', 'press', 'shack'];
  const at = {};
  for (const k of cards) at[k] = asks(mid(stationBox(k)));
  at.pedestal = asks(mid(stationParts('pedestal').top));
  at.heap = asks(mid(stationParts('heap').heap));
  at.grove = asks({ x: plotX(0), y: afterFloor() - P * 2 });
  at.crowd = asks({ x: godMid(S.camX + S.viewW / 2), y: faceY() });
  const rects = cards.every(k => standRect(`after-${k}`) && hitRect(`after-${k}`));
  // The yard's rows, asked up there over the whole window: none answers.
  const yardRows = new Set(STATIONS.filter(r => !r.place || r.place === 'yard' || r.place === 'deep').map(r => r.key));
  const leaks = new Set();
  for (let x = S.camX; x < S.camX + S.viewW; x += P * 4)
    for (let y = S.camY; y < S.camY + S.viewH; y += P * 4) { const k = stationAt(x, y); if (yardRows.has(k)) leaks.add(k); }
  // And down in the yard, a press where the shack stands up there is nobody's.
  const shack = mid(stationBox('shack'));
  window.__view('yard');
  run(0.5);
  const below = stationAt(shack.x, shack.y);
  window.__actsOn(null);
  return [
    ok(cards.every(k => at[k] === `after-${k}`) && at.pedestal === 'after-pedestal',
       'each standing station\'s drawing names its board', JSON.stringify(at)),
    ok(at.heap === 'after-mill', 'the sawdust heap is the saw mill\'s', String(at.heap)),
    ok(at.grove === 'after-grove', 'a pine is the grove\'s', String(at.grove)),
    ok(at.crowd === 'after-crowd', 'God as drawn, far back on his stage, is his crowd\'s', String(at.crowd)),
    ok(rects, 'each stands on its own ground and has a hit box, the yard\'s readers serving it'),
    ok(!leaks.size, 'no yard station answers in the afterlife', [...leaks].join(' ')),
    ok(below === null, 'and no act station answers in the yard', String(below))
  ];
}, { reload: false });
