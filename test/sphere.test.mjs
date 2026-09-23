// The sphere: the tower's machine, a shell the wizards pour round the star.
//
// What is checked is the bargain in DESIGN.md, "The sphere: the tower's
// machine": the tower holds a set of three hats and makes no more; the sphere
// is bought on the tower's board and then poured by the whole ring, which is
// only cut to one once the shell stands; the star under it is kept, not taken
// apart; the sparks it catches fall to the ground and are carried to the hole;
// nothing runs without a wizard up there; and its ladder is poured by that one
// wizard, from the ring.

import { group, ok, state, run, runUntil, yard, buyBuilt, buyNow } from './helpers.mjs';
import { KIT_MAX, RUNGS, SPHERE_WORK } from '../src/config.js';

const row = key => window.__rows().find(r => r.key === key);
const S = () => yard.S;

// The tower open, a star up, the tower's two ladders topped and money for
// anything. `hats` wizards on the ring with a hat each; the rest carry.
function tower(hats = KIT_MAX) {
  window.__reset();
  window.__crew(0, 8, 0, 0, 0, hats);
  window.__wizardHat(0);
  S().wizardHats = hats;
  window.__levels({ wizSpeedLevel: RUNGS, wizPowerLevel: RUNGS });
  window.__grant({ sparks: 99999, shards: 99999, spores: 99999, dust: 1e7 });
  window.__build();
}

group('the tower makes a set of three hats and no more', async () => {
  tower(2);
  const two = row('wizard');
  // The third, the way a player gets it: pressed, and made at the tower.
  const made = buyBuilt('wizard', 400);
  const three = row('wizard');
  return [
    ok(two && two.shown, 'a tower with two hats offers a third', `shown ${two?.shown}`),
    ok(made && S().wizardHats === KIT_MAX, 'and makes it', `${S().wizardHats} hats`),
    ok(three && !three.shown, 'and offers no fourth', `shown ${three?.shown}`)
  ];
});

group('the sphere is offered on a full set and the tower\'s ladders topped', async () => {
  tower(2);
  const short = row('sphere');
  tower(3);
  const full = row('sphere');
  window.__levels({ wizPowerLevel: RUNGS - 1 });
  window.__build();
  const unladdered = row('sphere');
  return [
    ok(short && !short.shown, 'not with two hats', `shown ${short?.shown}`),
    ok(full && full.shown, 'offered with three and both ladders topped', `shown ${full?.shown}`),
    ok(unladdered && !unladdered.shown, 'and not with a ladder a rung short',
       `shown ${unladdered?.shown}`)
  ];
});

group('the ring pours the shell, and only then is cut to one', async () => {
  tower(3);
  run(20);                                   // up on the ring
  // A fresh star, or the topped ring has stripped this one in the time it
  // took to get up there, and the pour would be waiting on a summoning.
  window.__meteor();
  const cells = state().meteor;
  const bought = buyNow('sphere');
  run(SPHERE_WORK / KIT_MAX / 2);
  const half = { pour: S().spherePour, wizards: S().wizards, cells: state().meteor };
  const closed = runUntil(() => S().spherePour >= 1, SPHERE_WORK);
  run(10);
  return [
    ok(bought, 'bought through its row'),
    ok(half.pour > 0.2 && half.pour < 1, 'poured by the ring, a piece at a time',
       `${half.pour.toFixed(2)} poured`),
    ok(half.wizards === KIT_MAX, 'with the whole ring still up while it goes on',
       `${half.wizards} wizards`),
    ok(half.cells === cells, 'and no bolts at the star under it', `${cells} -> ${half.cells}`),
    ok(closed, 'the shell closes', `${S().spherePour}`),
    ok(S().wizards === 1, 'and the ring is cut to its one tender', `${S().wizards} wizards`),
    ok(state().meteor === cells, 'with the star still whole', `${cells} -> ${state().meteor}`)
  ];
});

group('the closed sphere drops sparks for the haulers, and needs its tender', async () => {
  tower(3);
  run(20);
  buyNow('sphere');
  runUntil(() => S().spherePour >= 1, SPHERE_WORK);
  run(10);
  const before = S().sparks;
  run(60);
  const tended = S().sparks - before;
  const worked = state().machines.sphere.workedAt;
  // The tender taken off, as a player does it: the station's minus.
  window.__assign('wizards', -1);
  run(10);                                   // down off the ring
  const idleWorked = state().machines.sphere.workedAt;
  run(40);
  return [
    ok(tended > 0, 'sparks reach the hole while it is tended', `+${tended}`),
    ok(worked > 0, 'and the machine says it is working', `${worked}`),
    // Within a few milliseconds: a reload carries the clock as a distance.
    ok(Math.abs(state().machines.sphere.workedAt - idleWorked) < 5, 'and none with nobody up there',
       `${idleWorked} -> ${state().machines.sphere.workedAt}`)
  ];
});

group('a rung of the sphere is poured by its tender, from the ring', async () => {
  tower(3);
  run(20);
  buyNow('sphere');
  runUntil(() => S().spherePour >= 1, SPHERE_WORK);
  run(5);
  const shown = row('tunesphere');
  const rate0 = state().machines.sphere.rate;
  window.__assign('wizards', -1);
  run(10);
  const bought = window.__buy('tunesphere');
  run(40);
  const stalled = S().machines.sphere.tune;
  window.__assign('wizards', 1);
  const done = runUntil(() => S().machines.sphere.tune === 1, 90);
  return [
    ok(shown && shown.shown, 'the ladder is offered once the shell stands', `shown ${shown?.shown}`),
    ok(bought, 'and pressed'),
    ok(stalled === 0, 'nothing goes in with nobody on the ring', `rung ${stalled}`),
    ok(done, 'the tender pours it', `rung ${S().machines.sphere.tune}`),
    ok(state().machines.sphere.rate > rate0, 'and it is worth more',
       `${rate0} -> ${state().machines.sphere.rate}`)
  ];
});
