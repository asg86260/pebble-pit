// The fastest the rescue can be had: a driven yard, funded past every bill
// with the hooks, buys the four shields one after another and stands the
// dome, and the clock over the sqwife is read the moment they walk out.
// Nobody playing can beat a yard the hooks fund, so this is the floor under
// a posted time -- TIMES_FLOOR_MS in config/times.js is this, less a margin.
//
//   node tools/node/rescue-floor.mjs [crew]
//
// Same recipe as `under the dome, the one underneath walks out` in
// test/shield.test.mjs, with the clock read instead of the walk.

import { newYard } from './yard.mjs';
import { PROP_FROM, NET_COST, ARCH_COST, DOME_BILL, TIMES_FLOOR_MS } from '../../src/config.js';

const yard = await newYard();
const state = yard.state;
const run = s => yard.fast(s);
const runUntil = (done, limit = 60) => {
  for (let i = 0; i < limit; i++) { run(1); if (done()) return true; }
  return done();
};

const through = kind => {
  window.__buy(kind);
  runUntil(() => !!state().shield, 400);
  window.__next();
  runUntil(() => state().shieldsDone.includes(kind), 240);
  runUntil(() => state().rock > 0 && !state().rockFall && state().chips === 0, 240);
};

// The opening, played: the clock starts at the first rock.
window.__reset(true);
runUntil(() => state().beatsDone.includes('show') && state().buried, 90);
window.__jump(PROP_FROM);
window.__give(40000);
window.__grant({ shards: ARCH_COST * 2, spores: NET_COST * 2 });
run(1);
// the sites, then the crew: opening the sites stands everybody down
window.__crew(0, 0, 1, 1);
window.__crew(0, 0);
window.__shack();
window.__levels({ benchLevel: 0, plotLevel: 0 });
window.__crew(+(process.argv[2] || 2), 1);
through('props');
through('net');
through('arch');
window.__meteor();
for (const [money, n] of DOME_BILL) {
  if (money === 'dust') window.__give(n);
  else window.__grant({ [money + 's']: n });
}
window.__crew(+(process.argv[2] || 2), 1, 0, 0, 0, 1);
window.__buy('dome');
runUntil(() => { const sh = state().shield; return sh && sh.laid >= sh.pieces; }, 200);
window.__next();
const out = runUntil(() => state().rescued, 600);

const ms = yard.S.buriedMs;
console.log(out ? `rescued in ${(ms / 1000).toFixed(1)} s (${Math.round(ms)} ms)` : 'no rescue in 600 s');
console.log(`TIMES_FLOOR_MS is ${TIMES_FLOOR_MS}; ${ms >= TIMES_FLOOR_MS ? 'under the driven yard, as it should be' : 'ABOVE the driven yard: lower it'}`);
