// The hats fill first, through the new counters (roster.js): with a hat
// waiting, the + under a station sends a body for it, and so does a click on
// the plain counter's first empty seat; no plain seat fills until the hats
// are worn. Done with the pointer, at the counters' own buttons and pips, so
// every body still walks to the stand and then to the work.

import { group, ok, runUntil, run, state, yard, openSites } from './helpers.mjs';
import { rosterHit } from '../src/roster.js';

const S = yard.S;
const cut = () => state().roster.find(r => r.key === 'quarryjob');
const at = ([x, y]) => { S.mouse = { x, y }; return rosterHit(x, y); };

group('with a hat waiting, the + and a plain seat both seat the specialist first', async () => {
  window.__reset();
  openSites();
  window.__crew(0, 6);
  window.__levels({ benchLevel: 3 });
  window.__kit({ blasters: 2 });
  run(20);
  const bare = cut();
  // Every frame of every walk: a plain body never stands in a seat while a
  // hat is waiting.
  let plainWhileWaiting = 0;
  const watch = s => runUntil(() => {
    const r = cut();
    if (r.spareKit > 0 && r.seats.plain > 0) plainWhileWaiting++;
    return r.seats.coming.length === 0 && r.seats.wearing.length === 0 && r.n === s;
  }, 60);

  const sent = at(cut().more);
  watch(1);
  const one = cut();
  const clicked = at(one.counters.find(c => !c.top).at[0]);
  watch(2);
  const two = cut();
  // Hats full: the next + is a plain hand.
  at(cut().more);
  watch(3);
  const three = cut();
  S.mouse = null;
  return [
    ok(bare.counters.map(c => c.sprite).join() === 'hat,body' && bare.counters[0].pips === 2 && bare.n === 0,
       'two hats waiting: a hatted counter of two rings beside the plain seats', JSON.stringify(bare.counters)),
    ok(sent && one.n === 1 && one.worn === 1 && one.seats.plain === 0,
       'the + sends a body for the waiting hat, and it arrives hatted', JSON.stringify(one.seats)),
    ok(clicked && two.n === 2 && two.worn === 2 && two.seats.plain === 0,
       'a click on the first plain seat while a hat waits seats the specialist too', JSON.stringify(two.seats)),
    ok(plainWhileWaiting === 0, 'no plain seat fills while a hat waits', `${plainWhileWaiting} frames`),
    ok(three.n === 3 && three.worn === 2 && three.seats.plain === 1,
       'and once the hats are full the + seats a plain hand', JSON.stringify(three.seats))
  ];
});
