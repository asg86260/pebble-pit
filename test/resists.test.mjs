// Resists (DESIGN.md, "Resists: magic in the ward, physical in the split,
// both in the fading"): a phase halves one kind of damage, and the fading
// takes magic and physical in turn, the coming one shown ahead; the turn is
// saved, so a reload lands in the same one.

import { group, ok, yard, run, runUntil } from './helpers.mjs';
import { RESIST_K, RESIST_TURN_S, RESIST_WARN_S, CLASSES } from '../src/config.js';
import { strike } from '../src/deep/serpent.js';
import { resistNow, resistNext } from '../src/deep/phases.js';
import { bellyAt } from '../src/deep/place.js';
import { now } from '../src/clock.js';

const S = yard.S;
const hitWith = cls => { const p = bellyAt(now()); return strike(CLASSES[cls].hit, 100, p.x, p.y) / 100; };

group('the warded phase halves magic, the split physical, and neither touches the Sapper', async () => {
  window.__snatch({ played: true });
  window.__deepCrew();
  window.__serpent({ stage: 1, wound: 0 });
  const warded = [hitWith('mage'), hitWith('monk'), hitWith('brawler'), hitWith('sapper')];
  window.__serpent({ stage: 2, wound: 0 });
  const split = [hitWith('mage'), hitWith('ranger'), hitWith('assassin'), hitWith('sapper')];
  return [
    ok(warded.join() === [RESIST_K, RESIST_K, 1, 1].join(), 'warded: the Mage and the Monk at half, the Brawler and Sapper whole', warded.join()),
    ok(split.join() === [1, RESIST_K, RESIST_K, 1].join(), 'split: the Ranger and the Assassin at half, the Mage and Sapper whole', split.join())
  ];
});

group('the fading takes magic and physical in turn, the coming one shown ahead', async () => {
  window.__snatch({ played: true });
  window.__deepCrew();
  window.__serpent({ stage: 3, wound: 0 });
  const first = resistNow(), mage0 = hitWith('mage'), brawler0 = hitWith('brawler');
  run(RESIST_TURN_S - RESIST_WARN_S / 2);
  const warned = resistNext();
  runUntil(() => resistNow() !== first, RESIST_WARN_S * 2);
  const second = resistNow(), mage1 = hitWith('mage'), brawler1 = hitWith('brawler');
  runUntil(() => resistNow() === first, RESIST_TURN_S + 1);
  return [
    ok(first === 'magic' && mage0 === RESIST_K && brawler0 === 1, 'it opens resisting magic', `${first} ${mage0} ${brawler0}`),
    ok(warned === 'physical', 'physical is shown coming in the last beat of the turn', `${warned}`),
    ok(second === 'physical' && mage1 === 1 && brawler1 === RESIST_K, 'then it resists physical', `${second} ${mage1} ${brawler1}`),
    ok(resistNow() === 'magic', 'and magic again after that')
  ];
});
