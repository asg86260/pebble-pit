// The deep's hands are its own crew (DESIGN.md, "Two crews and a portal"): the
// roster's `+` under a deep station puts one of the deep's spare hands on it
// and `-` takes it off to gather, down there; nobody from the yard is ever
// sent. The deep itself (the pit drowned, the snatch behind it, a door open)
// is set up with the hooks, because it is not what these checks are about.
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

group("+ under the altar takes one of the deep's own hands, never one of the yard's", async () => {
  window.__crew(0, 3);
  run(1);
  window.__deepCrew({ brawlers: 0, spare: 1 });   // the snatch behind it, and one hand down there on no weapon
  run(3);
  const shown = !!post('altarjob');
  const yard = S.workers.filter(w => !belowYard(w)).map(w => w.name);
  const pressed = press('altarjob', 'more');
  const w = S.workers.find(o => o.type === 'brawler');
  run(3);
  // With nobody left spare down there, a second press does nothing.
  const again = press('altarjob', 'more');
  const stillYard = S.workers.filter(o => yard.includes(o.name)).every(o => !belowYard(o));
  return [
    ok(shown && pressed, 'the altar has a roster in the deep, and its + takes the press'),
    ok(w && belowYard(w) && !yard.includes(w.name), "the one put on it is the deep's own", w && w.name),
    ok(again && S.brawlers === 1, 'and with nobody spare down there, a second + puts nobody on', `brawlers ${S.brawlers}`),
    ok(stillYard, "and none of the yard's hands went down")
  ];
});

// `-` under a station takes the body off its weapon and leaves it in the
// deep, gathering.
group('- under the altar keeps it down there, gathering', async () => {
  window.__crew(0, 3);
  run(1);
  window.__deepCrew({ brawlers: 1 });
  run(1);
  const w = S.workers.find(o => o.type === 'brawler');
  const pressed = press('altarjob', 'less');
  const now = S.workers.find(o => o.name === w.name)?.type;
  run(10);
  const still = S.workers.find(o => o.name === w.name);
  return [
    ok(pressed && now === 'gatherer', 'the - takes it off the altar, and it gathers', `${now}`),
    ok(still && belowYard(still), 'and it stays down there')
  ];
});

group("the deep's caps hold: nobody before a door, no more than a station holds after", async () => {
  window.__crew(0, 3);
  run(1);
  window.__deepCrew({ brawlers: 0, spare: 20 });
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
