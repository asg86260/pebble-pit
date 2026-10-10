// The doors open one at a time, each earned by the barrier before it failing
// (DESIGN.md, "The barriers are the gates"): the props open the farm, the net
// the quarry, the arch the tower. Every door is bought the way a player buys
// it -- through its own row -- and the yard is rich, so the money is never
// what hides a row here. The barriers fail through `__answered`, the setup
// this check is not about; test/shield.test.mjs drops the rocks on them.

import { group, ok, run, yard } from './helpers.mjs';

const S = () => yard.S;
const shown = key => !!window.__rows().find(r => r.key === key && r.shown);
const doors = () => ['unlockfarm', 'unlockquarry', 'unlocktower'].filter(shown).join(',');
const fail = kind => { window.__answered(kind); run(1); };

function standRich() {
  window.__reset();
  window.__crew(2, 3, 0, 0);
  window.__grant({ dust: 900000, spores: 90000, shards: 90000 });
  run(1);
}

group('no door stands before the props have failed', async () => {
  standRich();
  return [ok(doors() === '', 'nothing on the bench yet', doors())];
});

group('the props open the farm, the net the quarry, the arch the tower', async () => {
  standRich();
  fail('props');
  const afterProps = doors();
  const farm = window.__buy('unlockfarm');
  window.__finish(); run(1);
  const farmUp = doors();
  fail('net');
  const afterNet = doors();
  const quarry = window.__buy('unlockquarry');
  window.__finish(); run(1);
  fail('arch');
  const afterArch = doors();
  const tower = window.__buy('unlocktower');
  window.__finish(); run(1);
  return [
    ok(afterProps === 'unlockfarm', 'the props failing puts the farm up, alone', afterProps),
    ok(farm && farmUp === '', 'it is bought, and nothing stands past it yet', farmUp),
    ok(afterNet === 'unlockquarry', 'the net failing puts the quarry up', afterNet),
    ok(quarry, 'the quarry is bought'),
    ok(afterArch === 'unlocktower', 'the arch failing puts the tower up', afterArch),
    ok(tower && S().towerOpen, 'and the tower is bought and stands')
  ];
});
