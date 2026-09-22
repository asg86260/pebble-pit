// A hauler tips onto the belt, not over the lip.
//
// While the belt runs it carries everything on it to the hole, so a trip that
// walks the whole run to the lip walks the belt's road beside it. A laden body
// ends its trip at the tail and tosses the load up onto the band; the band
// catches it the way it catches the rock's spoil (`catchBelt`).

import { group, ok, openSites, buyNow, state, P } from './helpers.mjs';
import { beltFrom, onBelt } from '../src/dust.js';
import { S, floor } from '../src/state.js';
import { at } from '../src/grid.js';
import { LADDER } from '../src/config.js';

const WORKER = 18;

// Grains lying on the ground from `from` up to `to`.
function groundIn(from, to) {
  let n = 0;
  for (let c = Math.max(0, Math.floor((from - floor.x) / P)); c * P + floor.x < to; c++)
    for (let r = 0; r < floor.rows; r++) if (at(floor, c, r)) n++;
  return n;
}
const groundBefore = x => groundIn(0, x);

group('with the belt running, a laden hauler tips at the tail and the band takes it', async () => {
  window.__reset();
  openSites();
  window.__fullSites();
  window.__crew(0, 4);
  window.__grant({ sparks: 999999, shards: 9999, spores: 9999, dust: 9999999 });
  // The lip bought out and a set of carts, which the belt is gated behind.
  window.__levels({ haulCarryLevel: LADDER, haulPaceLevel: LADDER });
  window.__kit({ carters: 6 });
  const ram = buyNow('ram'), belt = buyNow('belt');
  window.__jump(4);
  window.__clearFloor();
  // A heap out past the rock, on the far side from the hole.
  const tail = beltFrom();
  const heapX = state().rockX - P * 30;
  window.__pile(heapX, 120);
  const had = groundBefore(tail);

  const tips = [];
  const carry = new Map();
  let caught = 0, missed = 0;
  for (let f = 0; f < 60 * 40; f++) {
    window.__fast(1 / 60);
    for (const w of S.workers) {
      if (w.type !== 'hauler') continue;
      if ((carry.get(w) || 0) > 0 && !w.carry) tips.push(w.x);
      carry.set(w, w.carry || 0);
    }
    caught = Math.max(caught, onBelt());
    // Under the band, where a toss that missed it would come down.
    missed = Math.max(missed, groundIn(tail, state().pitX));
  }
  const lip = state().pitX - WORKER;
  const atLip = tips.filter(x => Math.abs(x - lip) < P * 2).length;
  const atTail = tips.filter(x => x < tail).length;
  return [
    ok(ram && belt, 'the ram and the belt were bought', `ram ${ram}, belt ${belt}`),
    ok(had >= 100, 'a heap lay out past the rock', `${had} grains`),
    ok(tips.length > 0, 'the haulers tipped loads', `${tips.length} tips`),
    ok(atLip === 0, 'nobody walked a load to the lip', `${atLip} of ${tips.length} at the lip`),
    ok(atTail === tips.length, 'every load was tipped at the tail',
       `${atTail} of ${tips.length}, tail at ${tail}, tips at ${[...new Set(tips.map(Math.round))].slice(0, 6)}`),
    ok(caught > 0, 'and the band carried it', `${caught} grains on the belt at most`),
    ok(missed === 0, 'and nothing thrown at it missed and fell under it', `${missed} grains at most`),
    ok(groundBefore(tail) === 0, 'and the heap is gone off the ground',
       `${groundBefore(tail)} grains left`)
  ];
});
