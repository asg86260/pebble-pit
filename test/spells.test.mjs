// The tower's enchantments wait on the thing they enchant, and each says on
// its tile what it is worth.
//
// They used to stand on the tower's board the moment a spark had been seen:
// "speed the machines" in a yard with no machine, "quicken the janitors" with
// no closet to hire one from. A spell is a sentence about somewhere else in
// the yard, and the somewhere has to exist first (tower.js, SPELL_NEEDS).

import { group, ok, run, yard } from './helpers.mjs';

const S = () => yard.S;
const row = key => window.__rows().find(r => r.key === key);
const shown = key => !!row(key)?.shown;
const spells = () => ['spelldrive', 'spellluck', 'spellgmo', 'spellthrift', 'spellsweep'].filter(shown).join(',');

function standTower() {
  window.__reset();
  window.__crew(3, 3, 0, 3);                     // the farm open, the quarry not
  window.__grant({ cores: 30, dust: 900000, spores: 90000, shards: 90000, sparks: 900 });
  window.__meteor();                             // the tower stands, a spark seen
  run(1);
}

group('an enchantment is offered once what it enchants is in the yard', async () => {
  standTower();
  const first = spells();
  window.__crew(3, 3, 3, 3);                     // the quarry opens
  run(1);
  const withQuarry = spells();
  window.__loo();                                // the closet stands
  run(1);
  const withLoo = spells();
  window.__machine('ram', { bought: true });     // a machine is owned
  run(1);
  const withMachine = spells();
  return [
    ok(first === 'spellgmo,spellthrift', 'with the tower and the farm, the crop\'s and the houses\' spells stand', first),
    ok(withQuarry === 'spellluck,spellgmo,spellthrift', 'the quarry brings its own', withQuarry),
    ok(withLoo === 'spellluck,spellgmo,spellthrift,spellsweep', 'the closet the janitors\'', withLoo),
    ok(withMachine === 'spelldrive,spellluck,spellgmo,spellthrift,spellsweep', 'and a machine the drive', withMachine)
  ];
});

group('each enchantment says what it is worth on the tile', async () => {
  standTower();
  window.__crew(3, 3, 3, 3); window.__loo(); window.__machine('ram', { bought: true });
  run(1);
  const gains = Object.fromEntries(['spelldrive', 'spellluck', 'spellgmo', 'spellthrift', 'spellsweep'].map(k => [k, row(k)?.gain]));
  return [
    ok(gains.spelldrive === '+50% speed', 'the drive', gains.spelldrive),
    ok(gains.spellluck === '+25% ore', 'the luck', gains.spellluck),
    ok(gains.spellgmo === '+25% spores', 'the gmo', gains.spellgmo),
    ok(gains.spellthrift === '50% cheaper', 'the thrift', gains.spellthrift),
    ok(gains.spellsweep === '2x faster', 'the sweep', gains.spellsweep)
  ];
});

group('the gmo spell is a quarter more spores off every cut', async () => {
  standTower();
  const { cropYield, cropSpores } = await import('../src/farm.js');
  const { SPELL_GMO } = await import('../src/config.js');
  S().spells = [];
  const plain = cropSpores();
  S().spells = ['gmo'];
  const blessed = cropSpores();
  S().spells = [];
  return [
    ok(plain === cropYield(), 'without it a cut is the ladder\'s answer', `${plain} vs ${cropYield()}`),
    ok(blessed === Math.max(1, Math.round(cropYield() * SPELL_GMO)),
       'with it laid, the ladder\'s answer and a quarter again', `${plain} -> ${blessed}`)
  ];
});
