// The crusher: a scale is money once it lands in the hopper, and not before
// (DESIGN.md, "The crusher"). The floor's loose scales are gathered to it by
// the gatherers, a job put on at the roster like any other, or thrown in by
// hand; a payment comes back out of it.

import { group, ok, yard, run, runUntil } from './helpers.mjs';
import { WORKER, P } from '../src/config.js';
import { deepBed } from '../src/state.js';
import { hopperRect, crusherRect, deepTop, deepFloor } from '../src/deep/place.js';
import { spendScales } from '../src/deep/scales.js';
import { sweep, release } from '../src/hands.js';
import crusherMigration from '../src/migrations/2026-09-23-crusher.js';

const S = yard.S;
const gatherers = () => S.workers.filter(w => w.type === 'gatherer');

// A yard the serpent has come for, nobody down there, a floor of loose scales.
function floorOf(n) {
  window.__snatch({ played: true });
  window.__deepCrew({ brawlers: 0 });
  window.__crew(0, 6);
  window.__looseScales(n);
}

group('a scale on the floor is not money', async () => {
  floorOf(300);
  const lying = deepBed.n;
  const paid = spendScales(10, crusherRect().x, crusherRect().y);
  return [
    ok(lying === 300, 'three hundred lying on the floor', `${lying}`),
    ok(S.scales === 0, 'and none of them in the purse', `${S.scales}`),
    ok(!paid, 'so a bill of ten is refused')
  ];
}, { reload: false });

group('a gatherer walks down, carries the floor to the crusher, and they count as they land', async () => {
  floorOf(300);
  // Put on at the crusher's roster, from the yard: it walks the shaft down.
  const put = window.__assign('gatherers', 1);
  // Every frame, every scale is somewhere: in the purse, on the floor, in the
  // water or in the gatherer's arms. One counted before it had crossed the
  // water, or one lost on the way, is a frame where the sum is not 300.
  const where = () => S.scales + deepBed.n + S.sinking.length + (gatherers()[0]?.carry || 0);
  const early = [];
  let carried = 0, arcs = 0, down = false;
  for (let f = 0; f < 60 * 90; f++) {
    yard.fast(1 / 60);
    const g = gatherers()[0];
    if (g && g.y + WORKER > deepTop()) down = true;
    if (g) carried = Math.max(carried, g.carry || 0);
    arcs = Math.max(arcs, S.sinking.filter(s => s.arc != null).length);
    if (where() !== 300) early.push(`${f}: ${where()}`);
  }
  return [
    ok(put !== false && gatherers().length === 1, 'one gatherer put on through the roster'),
    ok(down, 'it went down the shaft'),
    ok(carried > 1, 'it carried a load off the floor', `${carried}`),
    ok(arcs > 0, 'and tossed it up over the lip', `${arcs}`),
    ok(early.length === 0, 'and on every frame each scale was in the purse, the floor, the water or its arms',
       early.slice(0, 5).join(', ')),
    ok(S.scales > 0, 'and the purse has what it brought', `${S.scales}`)
  ];
}, { reload: false });

group('a handful thrown in by hand is crushed', async () => {
  floorOf(200);
  // Swept off the bed by the crusher's side, let go over the hopper.
  const x = crusherRect().x + crusherRect().w + P * 12;
  S.dragging = true;
  for (let i = 0; i < 5; i++) sweep(x, deepFloor() - P);
  const held = S.heldScales;
  const h = hopperRect();
  release(h.x + h.w / 2, h.y - P * 6);
  S.dragging = false;
  const inWater = S.sinking.length;
  runUntil(() => S.sinking.length === 0, 30);
  return [
    ok(held > 0, 'the hand took scales off the floor', `${held}`),
    ok(inWater === held && S.heldScales === 0, 'and let them all go into the water', `${inWater}`),
    ok(S.scales === held, 'where they fell into the hopper and were crushed', `${S.scales} of ${held}`)
  ];
}, { reload: false });

group('a purchase comes back out of the crusher', async () => {
  floorOf(0);
  window.__scales(100);
  const h = hopperRect();
  const paid = spendScales(40, h.x + 600, deepFloor() - 60);
  const fleck = S.lifting[0];
  return [
    ok(paid && S.scales === 60, 'forty out of a hundred', `${S.scales}`),
    ok(fleck && fleck.y === h.y && fleck.x >= h.x && fleck.x <= h.x + h.w,
       'and what was paid rises out of the hopper', fleck ? `${Math.round(fleck.x)},${Math.round(fleck.y)}` : 'none')
  ];
}, { reload: false });

group('a save from the first pass comes back with its floor crushed', async () => {
  const old = { saveV: 5, scales: 12, deepBed: { cols: 4, heights: [3, 0, 5, 4] } };
  crusherMigration.apply(old);
  return [
    ok(old.scales === 12, 'the purse is what the floor held', `${old.scales}`),
    ok(old.deepBed.heights.every(h => h === 0), 'and the floor is bare', old.deepBed.heights.join())
  ];
}, { reload: false });
