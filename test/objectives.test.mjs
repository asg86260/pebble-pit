// The story's objectives (DESIGN.md, "The story's objectives"): the line is
// read off facts the save holds, so a fresh game, a yard mid-story and an old
// save finished before the second half each open on their own step.

import { readFileSync } from 'node:fs';
import { yard, group, ok, run } from './helpers.mjs';
import { objective } from '../src/objectives.js';
import { offered } from '../src/stations.js';

const S = yard.S;
const line = () => objective()?.key ?? null;

group('a fresh game asks for the rock first, and the line follows the story', async () => {
  const fresh = line();
  S.boulderNo = 2;
  const second = line();
  S.shieldsDone = ['props']; S.farmOpen = true;
  const net = line();
  S.shieldsDone = ['props', 'net', 'arch', 'dome'];
  const sqwife = line();
  return [
    ok(fresh === 'rock', 'dig out the rock, first', fresh),
    ok(second === 'props', 'with the second rock down, build the props', second),
    ok(net === 'net', 'the props up, string the net', net),
    ok(sqwife === 'rescue', 'every shield up, save the sqwife', sqwife)
  ];
});

group('a save that finished the first half opens on the way down, or on nothing with the half off', async () => {
  const load = () => {
    localStorage.setItem('boulder-clicker/v4', readFileSync(new URL('./fixtures/crew-grows-on-load.json', import.meta.url), 'utf8'));
    yard.restore();
  };
  window.__serpentOn(false);
  let off;
  try { load(); off = line(); } finally { window.__serpentOn(null); }
  window.__serpentOn(true);
  try {
    load();
    const waiting = line();
    S.snatched = true;
    const after = line();
    S.askedWizards = true;
    const portal = line();
    S.portalOpen = true;
    const deep = line();
    S.serpentFreed = true;
    const told = line();
    return [
      ok(off === null, 'with the half off, the story is told', off),
      ok(waiting === null, 'with it on, nothing while the snatch is due', waiting),
      ok(after === 'tower' || after === 'portal', 'after the snatch, the tower or the portal', after),
      ok(portal === 'portal', 'tower up, buy the portal', portal),
      ok(deep === 'free', 'through the portal, free him', deep),
      ok(told === null, 'freed, no line', told)
    ];
  } finally { window.__serpentOn(null); }
}, { reload: false });

group('the intro quest under the rock ticks off its three items, then goes', async () => {
  const { questNow } = await import('../src/objectives.js');
  const items = () => (questNow() || []).map(i => `${i.key}:${i.done ? 1 : 0}`).join(' ');
  // a player's first moments: nothing swept, mined or banked yet (the node
  // yard skips the opening as a played yard, which counts as having swept)
  S.seenDrag = false; S.handChipped = false; S.banked = 0;
  const fresh = items();
  S.handChipped = true;
  const chipped = items();
  S.seenDrag = true;
  S.banked = 1;
  const all = questNow();
  return [
    ok(fresh === 'chip:0 pickup:0 toss:0', 'a fresh game shows all three, none done', fresh),
    ok(chipped === 'chip:1 pickup:0 toss:0', 'mining a piece off ticks the first', chipped),
    ok(all === null && line() === 'rock', 'all three done, the list goes and the line stays on the rock', `${JSON.stringify(all)} ${line()}`)
  ];
});

group('each fallen barrier asks for the place it opened before the next barrier', async () => {
  const fresh = () => { S.shieldsDone = []; S.farmOpen = false; S.quarryOpen = false; S.towerOpen = false; S.rescued = false; S.boulderNo = 2; };
  fresh();
  const first = line();
  // the farm is the goal from the props falling, before the bench offers it:
  // with no dust at all the card already names it
  const broke = S.stored;
  window.__answered('props');
  const early = line();
  const benchHas = offered('farm');
  window.__give(2000);
  const farm = line();
  window.__buy('unlockfarm');
  window.__finish();
  const net = line();
  // the farm already open when the props fall: straight to the net
  fresh();
  S.farmOpen = true;
  window.__answered('props');
  const skipped = line();
  window.__answered('net');
  const quarry = line();
  window.__give(20000); window.__buy('unlockquarry');
  window.__finish();
  const arch = line();
  window.__answered('arch');
  const tower = line();
  window.__give(20000); window.__buy('unlocktower');
  window.__finish();
  const dome = line();
  return [
    ok(first === 'props', 'the props first', first),
    ok(early === 'farm' && broke === 0 && !benchHas, 'props down with no dust, the farm is the goal before the bench offers it', `${early} with ${broke} dust, offered ${benchHas}`),
    ok(farm === 'farm', 'props down, farm unbought: buy the farm', farm),
    ok(net === 'net', 'the farm bought: the net', net),
    ok(skipped === 'net', 'the farm already open: straight to the net', skipped),
    ok(quarry === 'quarry', 'net down, quarry unbought: the quarry, not the arch', quarry),
    ok(arch === 'arch', 'the quarry bought: the arch', arch),
    ok(tower === 'buytower', 'arch down, tower unbought: the tower', tower),
    ok(dome === 'dome', 'the tower bought: the dome', dome)
  ];
});
