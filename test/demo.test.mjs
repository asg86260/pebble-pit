// The demo (DESIGN.md, "Three builds"): the farm is the last place it sells,
// the apothecary is never offered, and when the net fails the story's line
// stops and the demo's last sheet stands in place of the next step.
// Played the player's way: the props and the net bought on the bench and
// answered by the rocks, the farm bought through its row.
import { group, ok, state, run, runUntil, yard, buyBuilt } from './helpers.mjs';
import { PROP_FROM, NET_COST } from '../src/config.js';
import { objective } from '../src/objectives.js';

const S = yard.S;
const shown = key => !!window.__rows().find(r => r.key === key && r.shown);
const through = kind => {
  window.__buy(kind);
  runUntil(() => !!state().shield, 400);
  window.__next();
  const done = runUntil(() => state().shieldsDone.includes(kind), 240);
  runUntil(() => state().rock > 0 && !state().rockFall && state().chips === 0, 240);
  return done;
};

group('the demo sells the farm and stops at the net, with its last sheet', async () => {
  window.__demoOn(true);
  window.__reset();
  window.__crew(2, 1);
  window.__jump(PROP_FROM);
  window.__give(40000);
  window.__grant({ spores: NET_COST * 2 });
  run(1);
  const propsDown = through('props');
  const farm = buyBuilt('unlockfarm');
  run(2);
  const apothecary = shown('unlockapothecary');
  const netDown = through('net');
  run(2);
  const quarry = shown('unlockquarry'), line = objective();
  runUntil(() => S.beat.sheet === 'demoend', 30);
  const sheet = S.beat.sheet;
  const why = JSON.stringify({ beat: S.beat, done: S.beatsDone.slice(-4), net: S.shieldsDone });
  window.__demoOn(false);
  window.__reset();
  return [
    ok(propsDown && farm, 'the props fall and the farm is bought'),
    ok(!apothecary, 'the apothecary is never offered, crops in hand'),
    ok(netDown, 'the net falls'),
    ok(!quarry, 'and the quarry is not offered'),
    ok(!line, 'the story\'s line has nothing past the net', line && line.key),
    ok(sheet === 'demoend', 'the demo\'s last sheet stands', String(sheet))
  ];
});

group('the full game is unchanged: the net falling offers the quarry', async () => {
  window.__reset();
  window.__crew(2, 1);
  window.__jump(PROP_FROM);
  window.__give(40000);
  window.__grant({ spores: NET_COST * 2 });
  run(1);
  through('props');
  buyBuilt('unlockfarm');
  through('net');
  run(2);
  return [
    ok(shown('unlockquarry'), 'the quarry is offered'),
    ok(S.beat.sheet !== 'demoend' && !S.beatsDone.includes('demoend'), 'and no demo sheet')
  ];
});
