// The deep's hands are the yard's crew, crossing both ways (docs/wave-serpent.md,
// "Bodies go down and come up by the route"). A body is put on a deep job with
// the roster's `+` under that station, the way a player does, and walks the
// shaft down to it; `-` sends it back up. The deep itself (the pit drowned, the
// snatch behind it, a door open) is set up with the hooks, because it is not
// what these checks are about.
import { group, ok, state, run } from './helpers.mjs';
import { S } from '../src/state.js';
import { P, WORKER, BRAWL_CAP, GRENADE_CAP } from '../src/config.js';
import { rosterHit } from '../src/roster.js';
import { assign } from '../src/staffing.js';
import { commutePace } from '../src/levels.js';
import { belowYard } from '../src/route.js';
import { mouthX, deepFloor, spotX } from '../src/deep/place.js';

const post = key => state().roster.find(p => p.key === key);
const press = (key, which) => { const p = post(key); return !!p && rosterHit(p[which][0], p[which][1]); };
const floorFeet = () => deepFloor() - WORKER;
const inYard = w => !belowYard(w) && w.y + WORKER <= S.groundY + 1;

// Frame by frame, the body named (found by name: the harness reads the yard
// back every five seconds): the furthest it moved in a frame, and whether it
// was ever in the shaft, until `until` says it is there.
function follow(name, until, limit = 60 * 90) {
  let jump = 0, at = null, shaft = false, frames = 0;
  for (let f = 0; f < limit; f++) {
    const w = S.workers.find(o => o.name === name);
    if (!w) return { lost: true, jump, shaft, frames };
    if (at) jump = Math.max(jump, Math.hypot(w.x - at.x, w.y - at.y));
    at = { x: w.x, y: w.y };
    if (Math.abs(w.x - mouthX()) < 1 && w.y > S.groundY && w.y < floorFeet() - 1) shaft = true;
    if (until(w)) return { there: true, jump, shaft, frames };
    run(1 / 60);
    frames++;
  }
  return { there: false, jump, shaft, frames };
}

group('+ under the altar sends a hand from the yard down the shaft to it', async () => {
  window.__crew(0, 3);
  run(1);
  window.__deepCrew({});                 // drowned, the snatch behind it: the altar stands
  const shown = !!post('altarjob');
  const hands = S.workers.map(w => w.name);
  const pressed = press('altarjob', 'more');
  const w = S.workers.find(o => o.type === 'brawler');
  const was = w && hands.includes(w.name);
  const pace = commutePace();
  const trip = w ? follow(w.name, o => !o.walking && belowYard(o)) : { there: false };
  const there = w && S.workers.find(o => o.name === w.name);
  return [
    ok(shown && pressed, 'the altar has a roster in the deep, and its + takes the press'),
    ok(S.brawlers === 1 && was, 'one of the yard\'s own hands is put on it, not one made from nothing',
       `brawlers ${S.brawlers}`),
    ok(trip.there && trip.shaft, 'it walks there by the shaft', `${trip.frames} frames`),
    ok(trip.jump <= pace + 0.01, 'never moving more than its pace in a frame', `${(trip.jump || 0).toFixed(2)} against ${pace}`),
    ok(there && Math.abs(there.y - floorFeet()) < 1 && Math.abs(there.x + WORKER / 2 - spotX('altar')) < 1,
       'and stands on the deep\'s floor at the altar', there && `${Math.round(there.x)},${Math.round(there.y)}`)
  ];
});

group('- sends it back up the shaft to the yard', async () => {
  window.__crew(0, 3);
  run(1);
  window.__deepCrew({ brawlers: 1 });    // one at the altar already
  run(1);
  const w = S.workers.find(o => o.type === 'brawler');
  const down = w && belowYard(w);
  const pressed = press('altarjob', 'less');
  const now = S.workers.find(o => o.name === w.name);
  const pace = commutePace();
  const trip = follow(w.name, inYard);
  return [
    ok(down, 'the brawler starts in the deep'),
    ok(pressed && S.brawlers === 0 && now && now.type !== 'brawler', 'the - takes it off the job',
       `brawlers ${S.brawlers}, ${now && now.type}`),
    ok(trip.there && trip.shaft, 'and it comes back up the shaft to the yard', `${trip.frames} frames`),
    ok(trip.jump <= pace + 0.01, 'never moving more than its pace in a frame', `${trip.jump.toFixed(2)} against ${pace}`)
  ];
});

group('the deep\'s caps hold: nobody before a door, no more than a station holds after', async () => {
  window.__crew(0, 20);
  run(1);
  window.__deepCrew({});
  for (let i = 0; i < BRAWL_CAP + 3; i++) press('altarjob', 'more');
  const brawlers = S.brawlers;
  const fontShut = !post('fontjob');
  assign('grenadiers', 1);               // the roster's own move, refused: nowhere to stand
  const shutCount = S.grenadiers;
  S.fontOpen = true;                     // the font's door (its row is the board's)
  window.__build();
  for (let i = 0; i < GRENADE_CAP + 3; i++) press('fontjob', 'more');
  return [
    ok(brawlers === BRAWL_CAP, 'the altar holds its cap and no more', `${brawlers} of ${BRAWL_CAP}`),
    ok(fontShut && shutCount === 0, 'a station whose door is shut has no roster and nobody on it'),
    ok(S.grenadiers === GRENADE_CAP, 'and once open, its own cap', `${S.grenadiers} of ${GRENADE_CAP}`),
    ok(S.workers.filter(w => w.type === 'grenadier').length === GRENADE_CAP, 'with a body for every one on the books')
  ];
});

group('a reload with bodies in the deep brings them back in the deep', async () => {
  window.__crew(0, 3);
  run(1);
  window.__deepCrew({ brawlers: 2 });
  run(1);
  const before = S.workers.filter(w => w.type === 'brawler').map(w => ({ name: w.name, x: w.x, y: w.y }));
  window.__cold();
  run(1 / 60);
  const after = before.map(b => S.workers.find(w => w.name === b.name));
  return [
    ok(before.length === 2 && before.every(b => b.y + WORKER > S.groundY + WORKER),
       'two brawlers stand in the deep', JSON.stringify(before)),
    ok(after.every((w, i) => w && w.type === 'brawler' && belowYard(w)
                   // a frame's swim at most: a brawler at work goes on swimming to the coil
                   && Math.abs(w.x - before[i].x) <= P && Math.abs(w.y - before[i].y) <= P),
       'and come back where they stood, in the deep', JSON.stringify(after.map(w => w && [w.type, w.x, w.y])))
  ];
});
