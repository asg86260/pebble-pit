// The trip between the shacks and the work is the brisk one. A body that has
// knocked off used to trudge to the door at a quarter of the slowest commute,
// and one hired out of the door walked to its station at the plain commute;
// both go at `homePace` now, which is the commute times HOME_HURRY.

import { group, ok, state, run, runUntil, yard } from './helpers.mjs';
import { HOME_HURRY } from '../src/config.js';
const { commutePace, homePace } = await import('../src/upgrades.js');

// Pixels a body moved over one frame, measured rather than reasoned about.
const stepOf = w => { const x0 = w.x; run(1 / 60); return Math.abs(w.x - x0); };
const near = (a, b) => Math.abs(a - b) <= 0.5;

group('a body walking home goes at the hurried pace', async () => {
  run(0.4);
  window.__crew(0, 1);
  window.__clearFloor();
  const S = yard.S;
  // Stand it well away from the door, then wait for it to knock off and set out.
  // Re-found every time: `run` reloads the yard every few game seconds and
  // stands the crew back up as new objects.
  const body = () => S.workers[0];
  body().x = state().rockX + 300;
  const going = runUntil(() => body().goal === 'home' && !body().inside, 200);
  const w = body();
  const step = going ? stepOf(w) : 0;
  window.__crew(0, 0);
  return [
    ok(going, 'it knocks off and sets out for the door', `goal ${w.goal}`),
    ok(HOME_HURRY > 1 && near(homePace(), commutePace() * HOME_HURRY),
       'the walk home is a multiple of the commute', `${homePace()} vs ${commutePace()}`),
    ok(near(step, homePace()), 'and that is the pace it walks at',
       `${step.toFixed(2)} px a frame, want ${homePace().toFixed(2)}`)
  ];
});

group('a body put to work out of the house hurries to it', async () => {
  run(0.4);
  window.__crew(0, 0, 1);
  window.__crew(0, 1);
  window.__clearFloor();
  const S = yard.S;
  const home = runUntil(() => state().houses.home === 1, 300);
  window.__assign('quarriers', 1);
  run(1 / 60);
  const first = S.workers.find(x => x.walking);
  // Read fresh by name each time, not held: a reload (test/helpers.mjs) lays
  // the crew down again, and a record held across it is a frozen copy.
  const w = () => S.workers.find(x => x.name === first?.name);
  const came = !!first?.fromHome;
  const step = first ? stepOf(first) : 0;
  const out = first ? runUntil(() => !w().walking, 60) : false;
  const flag = first ? w().fromHome : null;
  window.__crew(0, 0);
  window.__clearFloor();
  return [
    ok(home, 'with nothing to carry it goes in', `${state().houses.home} in`),
    ok(first && came, 'put on the quarry it comes out walking, and knows it came from the door',
       first ? `fromHome ${came}` : 'nobody walking'),
    ok(near(step, homePace()), 'at the hurried pace',
       `${step.toFixed(2)} px a frame, want ${homePace().toFixed(2)}`),
    ok(out && !flag, 'and the flag is dropped when it arrives', first ? `fromHome ${flag}` : '')
  ];
});
