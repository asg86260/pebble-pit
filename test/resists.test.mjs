// Resists (DESIGN.md, "Resists: magic in the ward, physical in the split,
// both in the fading"): a phase halves one kind of damage, and the fading
// takes magic and physical in turn, the coming one shown ahead; the turn is
// saved, so a reload lands in the same one.

import { group, ok, yard, run, runUntil } from './helpers.mjs';
import { RESIST_K, RESIST_TURN_S, RESIST_WARN_S, CLASSES, SERPENT_WOUND } from '../src/config.js';
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

// --- the serpent hardens against its strongest foes ----------------------------------
// (DESIGN.md, "The serpent hardens against its strongest foes"): at each break a
// phase resists the kinds of the party's highest-rung fighters, chosen once.
// The party is setup (`__party`); the break is the party's blows reaching
// the depth (`strike`), the way a fight breaks it.
const breakInto = stage => {
  window.__serpent({ stage: stage - 1, wound: 0 });
  runUntil(() => !S.breakT, 30);
  S.serpentWound = SERPENT_WOUND[stage - 1] - 1;
  const p = bellyAt(now());
  strike('punch', 50, p.x, p.y);
  runUntil(() => S.serpentStage === stage, 2);
  runUntil(() => S.breakT == null, 30);            // the dive or the roar plays out
  return S.serpentStage === stage;
};

group('the warded phase resists the highest-rung fighter, and holds it all phase', async () => {
  window.__snatch({ played: true });
  window.__party({ stations: [{ kind: 'spire', cls: 'mage', rung: 3 }, { kind: 'altar', cls: 'brawler', rung: 6 }] });
  const broke = breakInto(1);
  const kind = resistNow(), brawler = hitWith('brawler'), mage = hitWith('mage');
  // the Mage climbs past the Brawler mid-phase; the hide does not change
  S.stations[0].rung = 8;
  run(5);
  return [
    ok(broke, 'the blows broke the bare phase'),
    ok(kind === 'physical' && brawler === RESIST_K && mage === 1, 'it resists the Brawler, the highest rung', `${kind} ${brawler} ${mage}`),
    ok(resistNow() === 'physical', 'and keeps that for the phase, whoever climbs', resistNow())
  ];
});

group('a Sapper on top brings an explosive resist; the fading takes the top two kinds', async () => {
  window.__snatch({ played: true });
  window.__party({ stations: [{ kind: 'altar', cls: 'brawler', rung: 4 }, { kind: 'circle', cls: 'sapper', rung: 7 },
                              { kind: 'spire', cls: 'mage', rung: 5 }] });
  const broke = breakInto(2);
  const hits0 = S.barrierHits.length;
  const split = resistNow(), sapper = hitWith('sapper');
  const soaked = S.barrierHits.length > hits0;
  const fading = breakInto(3);
  const turns = new Set();
  for (let i = 0; i < 4; i++) { turns.add(resistNow()); run(RESIST_TURN_S); }
  return [
    ok(broke && split === 'explosive' && sapper === RESIST_K, 'the split resists explosive, the Sapper at half', `${split} ${sapper}`),
    ok(soaked, 'and the barrier marks where it soaked the charge up, for its flare', `${soaked}`),
    ok(fading && [...turns].sort().join() === 'explosive,magic', 'the fading turns between the Sapper and the Mage', [...turns].join())
  ];
});
