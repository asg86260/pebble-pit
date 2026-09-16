// Who a pot's doses go to first is the POT's setting, not the building's.
//
// It was one dial on the apothecary board, which with two pots on two brews
// could not say the stew is for the diggers and the strong brew for the
// carters: whichever you set, one pot's doses went to a job the other's brew
// could not reach and fell through to whoever was nearest. Now each pot says
// who it is for, at the pot (potpick.js), and the picker prints how many of
// that job are under the brew out of how many there are.
//
// The apothecary is bought through its row, the pots set through the hooks the
// picker's clicks land on, and the stirrers assigned through the roster.

import { group, ok, run, runUntil, yard } from './helpers.mjs';
import { doses, doseCount, preferableFor, potPreferOf } from '../src/apothecary.js';

const S = () => yard.S;
const wearing = (w, key) => doses(w).some(d => d.tonic === key);
const of = type => S().workers.filter(w => w.type === type);

function standTwoPots() {
  window.__reset();
  window.__crew(3, 3, 3, 1);                     // diggers, haulers, quarriers, a farmhand
  window.__grant({ cores: 3, dust: 40000, spores: 4000, shards: 800 });
  run(1);
  window.__buy('unlockapothecary');
  window.__finish();
  S().apothPots = 2;
  window.__pot('stew', 0);
  window.__pot('strong', 1);
  window.__assign('stirrers', 2);
}

group('each pot favors its own job, and the picker offers the trades that stand', async () => {
  standTwoPots();
  // The stew for the diggers, the strong brew for the quarriers: two favors
  // the one dial could not hold at once.
  window.__potPrefer('rockhands', 0);
  window.__potPrefer('quarriers', 1);
  const canStew = preferableFor(0), canStrong = preferableFor(1);
  const first = { stew: null, strong: null };
  runUntil(() => {
    if (!first.stew) first.stew = S().workers.find(w => w.type !== 'stirrer' && wearing(w, 'stew')) || null;
    if (!first.strong) first.strong = S().workers.find(w => w.type !== 'stirrer' && wearing(w, 'strong')) || null;
    return !!(first.stew && first.strong);
  }, 400);
  return [
    ok(potPreferOf(0) === 'rockhands' && potPreferOf(1) === 'quarriers', 'each pot keeps its own favor',
       `${potPreferOf(0)} / ${potPreferOf(1)}`),
    ok(canStew.includes('haulers') && canStew.includes('rockhands') && canStew.includes('quarriers'),
       'the stew pot offers every trade that stands, haulers too', canStew.join(',')),
    ok(canStrong.includes('rockhands') && canStrong.includes('quarriers'),
       'and so does the strong pot', canStrong.join(',')),
    ok(!canStew.includes('wizards') && !canStrong.includes('wizards'),
       'and neither offers a trade with no station in the yard', canStew.join(',')),
    ok(first.stew && first.stew.type === 'rockhand', 'the first stew lands on a digger',
       first.stew && first.stew.type),
    ok(first.strong && first.strong.type === 'quarrier', 'and the first strong brew on a quarrier',
       first.strong && first.strong.type)
  ];
});

group('the picker counts who is under the brew out of who there is', async () => {
  standTwoPots();
  window.__potPrefer('rockhands', 0);
  const before = doseCount(0, 'rockhands');
  runUntil(() => doseCount(0, 'rockhands').dosed > 0, 400);
  const after = doseCount(0, 'rockhands');
  return [
    ok(before.of === 3 && before.dosed === 0, 'three diggers, none dosed to begin with',
       JSON.stringify(before)),
    ok(after.of === 3 && after.dosed >= 1, 'and the count climbs as the doses land',
       JSON.stringify(after))
  ];
});
