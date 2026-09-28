// Statuses (docs/wave-party.md, "Statuses"): what each does, on the whole
// serpent -- Bleeding ticks, Exposed takes more from everything, Held
// neither heals nor sways, Weakened heals less -- and on a fighter, Inspired
// and Hasted. Amps add and multiply once, capped; heal cuts cap. A status is
// laid outright here for the checks about what it does; that each class
// lays its own is classes.test.mjs's, and the last group here lets a Hexer
// lay Held the player's way.

import { group, ok, yard, run, runUntil } from './helpers.mjs';
import { SERPENT_HEAL, SERPENT_DEFENSE, EXPOSED_AMP, AMP_MAX, HEAL_CUT_MAX, HASTE,
         CLASSES } from '../src/config.js';
import { strike, healNow } from '../src/deep/serpent.js';
import { lay, has, level, ampOf, inspire, haste, tempo } from '../src/deep/statuses.js';
import { climb, openEveryClass } from './party-press.mjs';
import { bellyAt, bellySeg, coilAt } from '../src/deep/place.js';
import { now } from '../src/clock.js';

const S = yard.S;

// A yard the serpent has come for, nobody striking: every hit is the check's.
function deepYard(stage = 1) {
  window.__snatch({ played: true });
  window.__deepCrew();
  window.__serpent({ stage, wound: 0 });
}
const frame = () => yard.fast(1 / 60);
const belly = () => bellyAt(now());
const hit = (dmg = 100, o = {}) => { const p = belly(); return strike('brawler', dmg, p.x, p.y, null, 0, o); };
const near = (a, b) => Math.abs(a - b) < 1e-9 * Math.max(1, Math.abs(b));

group('Bleeding ticks the wound open, a tick at a time, and never stuns', async () => {
  deepYard(1);
  lay('bleed', 10, 3, bellySeg());
  const chips = S.serpentChips.length;
  let most = 0;
  for (let f = 0; f < 60 * 4; f++) { frame(); most = Math.max(most, S.serpentWound); }
  const cut = SERPENT_DEFENSE.sword[1];
  return [
    ok(most > 0, 'the wound opens under it', `${most}`),
    // Three seconds of ten a second, less what the ward's heal closed.
    ok(most <= 10 * 3 * cut + 1e-6 && most >= 10 * 3 * cut - SERPENT_HEAL[1] * 3 - 1e-6,
       'by its damage a second over its length', `${most.toFixed(2)}`),
    ok(S.serpentStun === 0 && S.serpentChips.length === chips, 'a tick bites nothing and stuns nothing'),
    ok(!has('bleed'), 'and it runs out')
  ];
});

group('Exposed: a quarter more from everything, blows and ticks alike', async () => {
  deepYard(0);
  const bare = hit();
  const tickBare = hit(100, { tick: true });
  lay('exposed', EXPOSED_AMP, 5);
  const open = hit();
  const tickOpen = hit(100, { tick: true });
  return [
    ok(near(open, bare * (1 + EXPOSED_AMP)), 'a blow', `${bare} then ${open}`),
    ok(near(tickOpen, tickBare * (1 + EXPOSED_AMP)), 'and a tick', `${tickBare} then ${tickOpen}`)
  ];
});

group('Held: no heal while it lasts, and the coil sways on', async () => {
  deepYard(1);
  window.__serpent({ stage: 1, wound: 400 });
  lay('held', 0, 2, bellySeg());
  frame();
  const pose = coilAt(bellySeg(), now());
  let least = S.serpentWound, moved = false;
  for (let f = 0; f < 100; f++) {
    frame();
    least = Math.min(least, S.serpentWound);
    const p = coilAt(bellySeg(), now());
    if (p.x !== pose.x || p.y !== pose.y) moved = true;
  }
  run(3);
  const after = coilAt(bellySeg(), now());
  return [
    ok(least === 400, 'nothing of the wound closes', `${least}`),
    ok(moved, 'the coil sways all the while: Held stops the heal, not the body', `${pose.x},${pose.y}`),
    ok(!has('held') && S.serpentWound < 400, 'and once it is over the heal takes up again', `${S.serpentWound}`),
    ok(after.x !== pose.x || after.y !== pose.y, 'and the coil sways on'),
    ok(S.serpentGrace === 0, 'a hold is not a stun: no grace follows it', `${S.serpentGrace}`)
  ];
});

group('Held raises nothing: a blow and a tick land as they are', async () => {
  deepYard(0);
  lay('held', 0.3, 5);
  const blow = hit(), tick = hit(100, { tick: true });
  return [
    ok(near(blow, 100), 'a blow', `${blow}`),
    ok(near(tick, 100), 'a tick', `${tick}`)
  ];
});

group('Weakened cuts the heal, and no more than the cap', async () => {
  deepYard(1);
  const bare = healNow();
  lay('weakened', 0.3, 5);
  const weak = healNow();
  lay('weakened', 0.95, 5);
  const most = healNow();
  return [
    ok(near(weak, bare * 0.7), 'by its share', `${bare} then ${weak}`),
    ok(near(most, bare * (1 - HEAL_CUT_MAX)), 'and never past HEAL_CUT_MAX', `${most}`)
  ];
});

group('a status laid again keeps the longer and the stronger; a break takes them all', async () => {
  deepYard(1);
  lay('weakened', 0.2, 10);
  const long = S.statuses.weakened.until;
  lay('weakened', 0.4, 1);
  const kept = { until: S.statuses.weakened.until, k: level('weakened') };
  lay('exposed', EXPOSED_AMP, 30);
  const p = belly();
  strike('mage', 900, p.x, p.y);
  frame();
  return [
    ok(kept.until === long && kept.k === 0.4, 'the longer and the stronger stand', JSON.stringify(kept)),
    ok(S.serpentStage === 2 && !has('weakened') && !has('exposed'), 'and the break clears them',
       `stage ${S.serpentStage}, ${Object.keys(S.statuses)}`)
  ];
});

group('amps add, then multiply once, capped', async () => {
  deepYard(0);
  const w = {};                   // a fighter's body, as far as its buffs go
  lay('exposed', EXPOSED_AMP, 5);
  const two = ampOf(false, null);
  inspire(w, 0.2, 5);
  const three = ampOf(false, w);
  inspire(w, 0.9, 5);
  const capped = ampOf(false, w);
  const dealt = hit(100, { by: w });
  return [
    ok(near(two, 1 + EXPOSED_AMP), 'Exposed raises it', `${two}`),
    ok(near(three, 1 + EXPOSED_AMP + 0.2), 'and Inspired adds with it', `${three}`),
    ok(near(capped, 1 + AMP_MAX) && near(dealt, 100 * (1 + AMP_MAX)), 'and all of them at most AMP_MAX more',
       `${capped}, ${dealt}`)
  ];
});

group('Hasted swings a fifth more often, for as long as it lasts', async () => {
  deepYard(0);
  const w = {};                   // a fighter's body, as far as its buffs go
  const plain = tempo(w, 1);
  haste(w, 2);
  const fast = tempo(w, 1);
  run(2.1);
  const after = tempo(w, 1);
  return [
    ok(near(fast, 1 / (1 + HASTE)), 'Hasted', `${plain} then ${fast}`),
    ok(near(after, plain), 'and back when it runs out', `${after}`)
  ];
});

// A Hexer at the circle, her capstone bought on her board: the player's way
// to a Held serpent.
group('a Hexer at rung 8 Holds the serpent, and the heal stops while it does', async () => {
  window.__snatch({ played: true });
  window.__serpent({ stage: 1, wound: 500 });
  window.__party({ stations: [{ kind: 'circle', cls: null, rung: 0 }] });
  openEveryClass();
  climb(S.stations[0].id, 'hexer', 8);
  const got = runUntil(() => has('held'), 30);
  const wound = S.serpentWound;
  let closed = false, frames = 0;
  while (has('held') && frames < 600) { frame(); frames++; if (has('held') && S.serpentWound < wound - 1e-9) closed = true; }
  return [
    ok(got, 'the hex lands and the serpent is Held', `${Object.keys(S.statuses)}`),
    ok(!closed, 'and nothing of the wound closes while it is', `${wound} then ${S.serpentWound}`),
    ok(Math.abs(frames / 60 - CLASSES.hexer.hold) < 0.1, 'for the hold the class table gives', `${frames / 60}s`)
  ];
});
