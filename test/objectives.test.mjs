// The story's objectives (DESIGN.md, "The story's objectives"): the line is
// read off facts the save holds, so a fresh game, a yard mid-story and an old
// save finished before the second half each open on their own step.

import { readFileSync } from 'node:fs';
import { yard, group, ok, run } from './helpers.mjs';
import { objective } from '../src/objectives.js';

const S = yard.S;
const line = () => objective()?.key ?? null;

group('a fresh game asks for the rock first, and the line follows the story', async () => {
  const fresh = line();
  S.boulderNo = 2;
  const second = line();
  S.shieldsDone = ['props'];
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
      ok(after === 'ask' || after === 'tower', 'after the snatch, the wizards', after),
      ok(portal === 'portal', 'asked, buy the portal', portal),
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
