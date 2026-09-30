// A phase's mechanic and the class that answers it (DESIGN.md, "A phase has
// a mechanic and a class answers it"): the surge heals triple and a stun in
// its warning spends it; the lash throws the melee fighters off the hide and
// Held in its warning stops it; the sink takes him out of reach and the heal
// runs. The turn is set with `S.mechAt` as the setup; the answers are laid
// through the doors the classes lay them through (`strike` with a stun,
// `lay('held')`).

import { group, ok, yard, run, runUntil } from './helpers.mjs';
import { MECHANICS, SERPENT_HEAL, SERPENT_WOUND, WORKER } from '../src/config.js';
import { strike, healNow } from '../src/deep/serpent.js';
import { part, sinkK } from '../src/deep/phases.js';
import { lay } from '../src/deep/statuses.js';
import { bellyAt, deepFloor } from '../src/deep/place.js';
import { now } from '../src/clock.js';

const S = yard.S;
const frame = () => yard.fast(1 / 60);

// The serpent at `stage`, nobody striking him, a wound deep enough to watch
// the heal close, and the turn `into` seconds short of its mechanic.
function atStage(stage, into) {
  window.__snatch({ played: true });
  window.__deepCrew();
  window.__serpent({ stage, wound: SERPENT_WOUND[stage] / 2 });
  const m = MECHANICS[stage];
  S.mechAt = m.every - m.last - into;
  return m;
}
// What the heal accrues over `s` seconds, nobody striking: the bank and the
// wound a meal landing has closed of it, so a meal in the span changes nothing.
const healed = () => S.healBank - S.serpentWound;
const closes = s => { const was = healed(); run(s); return healed() - was; };

group('the surge heals triple in its turn, and a stun in the warning spends it', async () => {
  const m = atStage(1, 0);
  S.mechAt = m.every - m.last - m.warn - 2;            // two seconds of calm left
  const calm = closes(1);
  runUntil(() => part().part === 'on', 10);
  run(0.5);
  const surging = closes(1);
  // The next turn, answered: a stunning blow in the warning.
  S.mechAt = m.every - m.last - m.warn / 2;
  const p = bellyAt(now());
  strike('brawler', SERPENT_WOUND[1] / 4, p.x, p.y, null, 1, { stun: 1 });
  const stunned = S.serpentStun > 0;
  runUntil(() => !(S.serpentStun > 0), 10);
  const inOn = part().part === 'on';
  const spent = closes(0.5);
  return [
    ok(Math.abs(calm - SERPENT_HEAL[1]) < SERPENT_HEAL[1] * 0.05, 'calm, the heal is the phase\'s', `${calm.toFixed(1)}`),
    ok(Math.abs(surging / calm - m.x) < 0.1, 'in the surge it is triple', `${surging.toFixed(1)} against ${calm.toFixed(1)}`),
    ok(stunned, 'a blow the size of a haymaker stuns him in the warning'),
    ok(inOn && Math.abs(spent / 0.5 - SERPENT_HEAL[1]) < SERPENT_HEAL[1] * 0.1,
       'and once the stun is off the surge is spent: the plain heal', `on ${inOn}, ${(spent / 0.5).toFixed(1)} a second`)
  ];
});

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

group('sunk, nothing strikes him and the heal runs; risen, blows land again', async () => {
  const m = atStage(3, 0);
  runUntil(() => sinkK() >= 1, 5);
  const p = bellyAt(now());
  const under = strike('mage', 100, p.x, p.y);
  const healing = closes(1);
  runUntil(() => part().part === 'calm', m.last + 1);
  const risen = strike('mage', 100, p.x, p.y);
  return [
    ok(under === 0, 'a blow in the abyss does nothing', `${under}`),
    ok(healing > SERPENT_HEAL[3] * 0.9, 'the heal keeps closing the wound', `${healing.toFixed(1)}`),
    ok(risen > 0, 'out again, a blow lands', `${risen}`)
  ];
});

group('a break opens the next phase calm', async () => {
  atStage(1, 1);
  const p = bellyAt(now());
  strike('punch', SERPENT_WOUND[1], p.x, p.y);
  frame();
  return [
    ok(S.serpentStage === 2, 'the phase broke', `${S.serpentStage}`),
    ok(S.mechAt < 0.1 && part().part === 'calm', 'and the next opens at the top of its turn', `${S.mechAt}`),
    ok(healNow() === SERPENT_HEAL[2], 'with its plain heal', `${healNow()}`)
  ];
});
