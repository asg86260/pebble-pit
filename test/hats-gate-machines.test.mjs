// A hat for every miner and every farmer, and the drill and the tiller sold
// only once the station has its set of them.
//
// The lamps and the brims stopped at three once (`KIT_MAX`), whatever the
// floor held. Now the row sells until every body the station holds wears one,
// and the machine stands on the board greyed, saying how many more, until
// `MACHINE_HATS` are bought.

import { group, ok, state, run, yard, buyNow, buyBuilt, openSites } from './helpers.mjs';
import { S } from '../src/state.js';
import { persist } from '../src/persist.js';
import { KIT_MAX, MACHINE_HATS, QUARRY_BENCH_MAX, QUARRY_BENCH0,
         FARM_PLOTS_MAX, FARM_PLOTS0 } from '../src/config.js';

const row = key => window.__rows().find(r => r.key === key && r.shown);
const rich = () => {
  window.__grant({ sparks: 9999, shards: 99999, spores: 99999 });
  window.__tip(900000);
};
// Press the hat row until it stops selling; how many it sold.
const buyAll = (key, most = 20) => {
  let n = 0;
  while (n < most && buyNow(key)) { n++; rich(); }
  return n;
};

group('every miner and every farmer can wear a hat, past the old three', async () => {
  window.__reset();
  openSites();
  window.__kit({ learned: true });
  rich();

  // A fresh cut holds two, so two lamps and no more.
  const early = buyAll('blaster');
  const earlyRow = row('blaster');
  // The whole cut and the whole plot broken: the rows reopen.
  window.__levels({ benchLevel: QUARRY_BENCH_MAX - QUARRY_BENCH0, plotLevel: FARM_PLOTS_MAX - FARM_PLOTS0 });
  rich();
  const reopened = row('blaster') && !row('blaster').done;
  const more = buyAll('blaster');
  const brims = buyAll('grower');
  const lamp = row('blaster'), brim = row('grower');
  run(1);
  return [
    ok(early === QUARRY_BENCH0 && earlyRow && earlyRow.done,
       'a two-bench cut sells two lamps and says done', `${early} bought, done ${earlyRow?.done}`),
    ok(reopened, 'and a deeper cut puts the row back on sale'),
    ok(S.blasters === QUARRY_BENCH_MAX && S.blasters > KIT_MAX,
       'a lamp for every bench, past the old three', `${S.blasters} of ${QUARRY_BENCH_MAX}`),
    ok(S.growers === FARM_PLOTS_MAX && brims === FARM_PLOTS_MAX,
       'a brim for every plot', `${S.growers} of ${FARM_PLOTS_MAX}`),
    ok(lamp?.done && lamp.rungs === QUARRY_BENCH_MAX && brim?.done && brim.rungs === FARM_PLOTS_MAX,
       'and each row ends when every body the station holds has one',
       `${lamp?.rung}/${lamp?.rungs} ${brim?.rung}/${brim?.rungs}`),
    ok(more === QUARRY_BENCH_MAX - QUARRY_BENCH0, 'no more lamps than benches', `${more}`)
  ];
});

group('the drill and the tiller stand greyed, saying how many more hats', async () => {
  window.__reset();
  openSites();
  window.__machineGates();               // both of each station's ladders topped
  window.__kit({ blasters: 0, growers: 0, learned: true });
  window.__crew(0, 2, 2, 2);
  rich();

  const bare = { jaw: row('jaw'), tiller: row('tiller') };
  const pressedBare = window.__buy('jaw') || window.__buy('tiller');
  // Hats bought at the row, the player's way, one short of the set.
  for (let i = 0; i < MACHINE_HATS - 2; i++) { buyNow('blaster'); buyNow('grower'); rich(); }
  const two = { jaw: row('jaw'), tiller: row('tiller') };
  buyNow('blaster'); buyNow('grower'); rich();
  const one = { jaw: row('jaw'), tiller: row('tiller') };
  buyNow('blaster'); buyNow('grower'); rich();
  const set = { jaw: row('jaw'), tiller: row('tiller') };
  const boughtJaw = buyBuilt('jaw', 240);
  rich();
  const boughtTiller = buyBuilt('tiller', 240);
  run(1);
  const s = state();
  return [
    ok(bare.jaw && bare.tiller, 'both rows are on their boards with no hats bought'),
    ok(bare.jaw?.waits === `buy ${MACHINE_HATS} blasters to unlock` &&
       bare.tiller?.waits === `buy ${MACHINE_HATS} growers to unlock`,
       'saying how many hats', `${bare.jaw?.waits} / ${bare.tiller?.waits}`),
    ok(bare.jaw?.gain === bare.jaw?.waits, 'in the line the card shows', bare.jaw?.gain),
    ok(!pressedBare, 'and pressing either buys nothing'),
    ok(two.jaw?.waits === 'buy 2 more blasters to unlock' &&
       two.tiller?.waits === 'buy 2 more growers to unlock',
       'the count runs down as hats are bought', `${two.jaw?.waits} / ${two.tiller?.waits}`),
    ok(one.jaw?.waits === 'buy 1 more blaster to unlock', 'one is one blaster', one.jaw?.waits),
    ok(set.jaw && !set.jaw.waits && set.tiller && !set.tiller.waits,
       'the set lifts the note', `${set.jaw?.waits}|${set.tiller?.waits}`),
    ok(boughtJaw && s.machines.jaw.bought && boughtTiller && s.machines.tiller.bought,
       'and both machines are bought, in sparks, as before',
       `${s.machines.jaw.bought} ${s.machines.tiller.bought}`)
  ];
});

group('a save that already owns the drill on three lamps keeps it', async () => {
  window.__reset();
  openSites();
  window.__fullSites();
  window.__crew(0, 1, 3, 3);
  window.__kit({ blasters: 3, growers: 3, learned: true });
  window.__machine('jaw', { bought: true });
  window.__machine('tiller', { bought: true });
  run(2);
  persist();
  const save = JSON.parse(localStorage.getItem('boulder-clicker/v4'));
  // As an old yard would have it: bought on the old set of three.
  save.machines.jaw.tookKit = true;
  save.machines.tiller.tookKit = true;
  localStorage.setItem('boulder-clicker/v4', JSON.stringify(save));
  yard.restore();
  run(8);
  const s = state();
  return [
    ok(s.machines.jaw.bought && s.machines.tiller.bought, 'both machines are still bought'),
    ok(s.machines.jaw.rate > 0 && s.machines.tiller.rate > 0, 'and still worth something',
       `${s.machines.jaw.rate} ${s.machines.tiller.rate}`),
    ok(!row('jaw') && !row('tiller'), 'neither is offered again'),
    ok(row('tunejaw') && row('tunetiller'), 'and their own ladders are'),
    ok(S.quarriers >= 1 || S.farmhands >= 1, 'somebody still works them', `${S.quarriers} ${S.farmhands}`)
  ];
});
