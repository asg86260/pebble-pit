// The doors open one at a time, each earned by the last: the farm, then the
// quarry, then the tower. Without the chain every door answered to the first
// core at once, and "build the quarry" and "discover the tower" stood on the
// bench beside the farm before a plot had been broken. `shieldOpened` in
// shield.js keeps the chain, and this is the check on it.
//
// Every door is bought the way a player buys it -- through its own row -- and
// the yard is rich, so the money is never what hides a row here.

import { group, ok, run, runUntil, yard } from './helpers.mjs';

const S = () => yard.S;
const shown = key => !!window.__rows().find(r => r.key === key && r.shown);
const doors = () => ['unlockfarm', 'unlockquarry', 'unlocktower'].filter(shown).join(',');

function standRich() {
  window.__reset();
  window.__crew(2, 3, 0, 0);
  window.__grant({ cores: 30, dust: 900000, spores: 90000, shards: 90000 });
  run(1);
}

group('a first core offers the farm and nothing past it', async () => {
  standRich();
  return [
    ok(S().seenCore, 'a core has been seen'),
    ok(shown('unlockfarm'), 'the farm is on the bench', doors()),
    ok(!shown('unlockquarry'), 'the quarry is not', doors()),
    ok(!shown('unlocktower'), 'nor the tower', doors())
  ];
});

group('the farm earns the quarry, and the quarry the tower', async () => {
  standRich();
  const farm = window.__buy('unlockfarm');
  run(1 / 60);
  const midFarm = doors();                       // paid for, not yet standing: its own row shows the bar
  window.__finish(); run(1);
  const afterFarm = doors();
  const quarry = window.__buy('unlockquarry');
  run(1 / 60);
  const midQuarry = doors();
  window.__finish(); run(1);
  const afterQuarry = doors();
  const tower = window.__buy('unlocktower');
  window.__finish(); run(1);
  return [
    ok(farm, 'the farm is bought'),
    ok(midFarm === 'unlockfarm', 'and while it rises its own row stands, with nothing past it', midFarm),
    ok(afterFarm === 'unlockquarry', 'the plots standing puts the quarry up, alone', afterFarm),
    ok(quarry, 'the quarry is bought'),
    ok(midQuarry === 'unlockquarry', 'and while it rises the tower waits', midQuarry),
    ok(afterQuarry === 'unlocktower', 'the cut standing puts the tower up', afterQuarry),
    ok(tower && S().towerOpen, 'and the tower is bought and stands')
  ];
});
