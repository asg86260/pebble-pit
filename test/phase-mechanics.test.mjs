// A phase's mechanic and the class that answers it (DESIGN.md, "A phase has
// a mechanic and a class answers it"): the lash throws the melee fighters off
// the hide and Held in its warning stops it; the sink takes him out of reach
// and the window runs. The warded phase has none. The turn is set with `S.mechAt` as the setup; the answers are laid
// through the doors the classes lay them through (`strike` with a stun,
// `lay('held')`).

import { group, ok, yard, run, runUntil } from './helpers.mjs';
import { MECHANICS, SERPENT_WOUND, WORKER } from '../src/config.js';
import { strike } from '../src/deep/serpent.js';
import { part, sinkK } from '../src/deep/phases.js';
import { lay } from '../src/deep/statuses.js';
import { bellyAt, deepFloor } from '../src/deep/place.js';
import { now } from '../src/clock.js';

const S = yard.S;
const frame = () => yard.fast(1 / 60);

// The serpent at `stage`, nobody striking him, a wound deep enough to watch
// the window, a fresh one, and the turn `into` seconds short of its mechanic.
function atStage(stage, into) {
  window.__snatch({ played: true });
  window.__deepCrew();
  window.__serpent({ stage, wound: SERPENT_WOUND[stage] / 2 });
  S.mealT = 0; S.mealI = null;
  const m = MECHANICS[stage];
  S.mechAt = m.every - m.last - into;
  return m;
}
// How much of the window runs in `s` seconds.
const runs = s => { const was = S.mealT; run(s); return S.mealT - was; };


// A Brawler at the hide, the lash `into` seconds off.
async function brawlerAt(into) {
  window.__snatch({ played: true });
  window.__deepCrew();
  window.__serpent({ stage: 2, wound: 0 });
  window.__party({ stations: [{ kind: 'altar', cls: 'brawler', rung: 8 }] });
  const w = () => S.workers.find(o => o.station === S.stations[0].id);
  runUntil(() => w() && w().goal === 'fight', 60);
  const m = MECHANICS[2];
  S.mechAt = m.every - m.last - into;
  return w;
}

group('the lash throws a melee fighter off the hide; it lands dazed and swims back', async () => {
  const w = await brawlerAt(MECHANICS[2].warn);
  let fell = false, landed = false, dazed = false;
  const back = runUntil(() => {
    const b = w();
    if (b.falling) fell = true;
    if (fell && !b.falling && Math.abs(b.y + WORKER - deepFloor()) <= WORKER) landed = true;
    if (b.dizzyUntil > now()) dazed = true;
    return landed && b.goal === 'fight';
  }, 30);
  return [
    ok(fell, 'the lash throws it off'),
    ok(landed, 'it sinks to the floor'),
    ok(dazed, 'and lies there dazed'),
    ok(back, 'then swims back to the hide and fights', `${w().goal}`)
  ];
});

group('Held in the lash\'s warning stops the lash', async () => {
  const w = await brawlerAt(MECHANICS[2].warn);
  run(MECHANICS[2].warn / 2);
  lay('held', 1, MECHANICS[2].warn + MECHANICS[2].last + 1);
  let fell = false;
  runUntil(() => { if (w().falling) fell = true; return part().part === 'calm' && S.mechAt < 1; }, 10);
  return [ok(!fell && w().goal === 'fight', 'nobody is thrown off', `fell ${fell}, ${w().goal}`)];
});

group('sunk, nothing strikes him and the window runs; risen, blows land again', async () => {
  const m = atStage(3, 0);
  runUntil(() => sinkK() >= 1, 5);
  const p = bellyAt(now());
  const under = strike('mage', 100, p.x, p.y);
  const ran = runs(1);
  runUntil(() => part().part === 'calm', m.last + 1);
  const risen = strike('mage', 100, p.x, p.y);
  return [
    ok(under === 0, 'a blow in the abyss does nothing', `${under}`),
    ok(ran > 0.9, 'the window keeps running', `${ran.toFixed(2)}`),
    ok(risen > 0, 'out again, a blow lands', `${risen}`)
  ];
});

group('a break opens the next phase calm', async () => {
  atStage(2, 1);
  const p = bellyAt(now());
  strike('punch', SERPENT_WOUND[2], p.x, p.y);
  frame();
  return [
    ok(S.serpentStage === 3, 'the phase broke', `${S.serpentStage}`),
    ok(S.mechAt < 0.1 && part().part === 'calm', 'and the next opens at the top of its turn', `${S.mechAt}`),
    ok(S.mealT < 0.1, 'on a fresh window', `${S.mealT}`)
  ];
});
