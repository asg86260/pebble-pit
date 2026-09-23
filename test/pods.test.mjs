// One crew, two homes (DESIGN.md, "One crew, two homes: pods in the deep").
// A pod is bought in scales and adds a body who lives down there; bodies
// fill jobs in their own half first; the yard lends its haulers to the deep's
// floor only while its piles are calm; and a gatherer stood down with a load
// drops it in the deep, not in the yard.

import { group, ok, yard, run, runUntil } from './helpers.mjs';
import { WORKER, PILE_LIMIT } from '../src/config.js';
import { deepTop, podAt } from '../src/deep/place.js';

const S = yard.S;
const residents = () => S.workers.filter(w => w.deepHome);
const inDeep = w => w.y + WORKER > deepTop();

function deepYard() {
  window.__fullSites();
  window.__snatch({ played: true });
  window.__deepCrew({ brawlers: 0 });
  window.__crew(0, 4);
}

group('a pod is bought in scales and adds a body who lives down there', async () => {
  deepYard();
  const crew = S.crew;
  window.__scales(1000);
  const scales = S.scales;
  const bought = window.__buy('pod');
  window.__finish();
  run(0.5);
  const home = residents();
  const at = podAt(0);
  return [
    ok(bought, 'the altar sells a pod'),
    ok(S.scales < scales, 'for scales', `${scales} -> ${S.scales}`),
    ok(S.crew === crew + 1 && S.pods === 1, 'and the crew is one more, living in it', `crew ${S.crew}, pods ${S.pods}`),
    ok(home.length === 1 && inDeep(home[0]), 'who comes out of it on the deep\'s floor',
       home[0] ? `${Math.round(home[0].x)},${Math.round(home[0].y)} by ${at.x}` : 'nobody')
  ];
});

group('a deep job is filled from the deep\'s residents first', async () => {
  deepYard();
  window.__scales(100000);
  for (let i = 0; i < 2; i++) { window.__buy('pod'); window.__finish(); }
  run(1);
  const put = [window.__assign('brawlers', 1), window.__assign('brawlers', 1)];
  run(1);
  const brawlers = S.workers.filter(w => w.type === 'brawler');
  return [
    ok(put.every(p => p !== false) && brawlers.length === 2, 'two brawlers put on', `${brawlers.length}`),
    ok(brawlers.every(w => w.deepHome), 'and both are the ones who live down there',
       brawlers.map(w => !!w.deepHome).join())
  ];
});

group('the yard lends haulers only while its piles are calm', async () => {
  deepYard();
  window.__crew(0, 8);
  // A yard pile heaped past its limit: the yard is busy, and with nobody
  // living down there nobody goes down to gather.
  const pile = S.piles.find(p => p.key === 'quarry');
  window.__pile((pile.from + pile.to) / 2, PILE_LIMIT.quarry + 60);
  window.__looseScales(400);
  run(1);
  const busy = { lends: S.yardLends, gatherers: S.gatherers };
  // The pile carted off: calm again, and the yard lends.
  window.__clearFloor();
  run(1);
  const calm = { lends: S.yardLends, gatherers: S.gatherers };
  return [
    ok(!busy.lends && busy.gatherers === 0, "a full pile keeps the yard's haulers up top", JSON.stringify(busy)),
    ok(calm.lends && calm.gatherers > 0, 'and with the piles calm the yard lends them down', JSON.stringify(calm))
  ];
}, { reload: false });

group('a gatherer stood down with a load drops it in the deep', async () => {
  deepYard();
  window.__crew(0, 6);
  window.__looseScales(300);
  runUntil(() => S.workers.some(w => w.type === 'gatherer' && (w.carry || 0) > 1 && inDeep(w)), 120);
  const loads = S.workers.filter(w => w.type === 'gatherer').reduce((n, w) => n + (w.carry || 0), 0);
  const dust = S.chips.length, water = S.sinking.length;
  // A crew of two: one hauler kept up top, so every gatherer is stood down
  // where it is, load and all.
  window.__crew(0, 2);
  const stood = S.workers.filter(w => w.type === 'gatherer').length;
  return [
    ok(loads > 1, 'the gatherers had loads', `${loads}`),
    ok(stood <= 1, 'most were stood down', `${stood} still gathering`),
    ok(S.chips.length === dust, "none of it came up as the yard's dust", `${S.chips.length - dust} chips`),
    ok(S.sinking.length > water, 'it went into the water where they stood', `${S.sinking.length - water} scales`)
  ];
}, { reload: false });
