// A station whose machine is bought can still build its own upgrades.
//
// Once the drill is bought the quarry's gang is one body (`capOf`), and that
// body is its tender. Tending runs before the job's own step, so the tender
// used to swallow every frame: `stepShedwork` never ran, nobody claimed the
// bought work, and the bar sat at nought for the rest of the run -- the yard
// lends no builder either, because the tender still counts as a quarrier.
// Now an open work at the station outbids the machine's post: the body walks
// to the shed and builds, the drill idles unmanned meanwhile, and when the
// work lands the body walks back and tends again.

import { group, ok, state, run, runUntil, openSites, buyBuilt } from './helpers.mjs';
import { S } from '../src/state.js';
import { TYPE } from '../src/jobs.js';
import { workAt } from '../src/works.js';

group('a quarry upgrade gets worked while the drill stands', async () => {
  window.__reset();
  openSites();
  window.__crew(0, 0, 5);
  window.__fullSites();
  window.__grant({ spores: 999, shards: 999, sparks: 999 });
  window.__tip(90000);

  // The drill, bought the way a player buys it, and running.
  const drill = buyBuilt('jaw');
  run(12);
  const manned = state();

  // The upgrade under test, bought like a player: the pace rung, priced in
  // spore, built at the quarry's shed by the quarry's own gang -- which is now
  // one body, and that body is the tender.
  const bought = window.__buy('quarrypace');
  const claimed = () => S.workers.filter(w => w.type === TYPE.QUARRY && w.onBuild === 'quarry');
  const taken = runUntil(() => claimed().length === 1, 30);

  // The bar moves while it stands at the shed...
  const arrived = runUntil(() => claimed().some(w => w.atShed), 90);
  const at0 = workAt('quarry')?.done ?? -1;
  const idleFrom = state().machines.jaw.workedAt;
  run(4);
  const at1 = workAt('quarry')?.done ?? -1;
  // ...and the drill idles unmanned meanwhile: the same bargain a hand-worked
  // gang pays -- while the bench is being cut, nothing comes up.
  const idleTo = state().machines.jaw.workedAt;

  // The work lands, the claim clears, and the body goes back to tending.
  const landed = runUntil(() => !workAt('quarry'), 600);
  const released = runUntil(() => claimed().length === 0, 10);
  // The heap swept first: a jaw with nowhere to put what comes out stands
  // down for that reason, and this line is about the tender coming back.
  window.__clearFloor();
  const back = runUntil(() => { if (state().machines.jaw.workedAt > idleTo) return true; window.__clearFloor(); return false; }, 90);

  window.__crew(0, 0, 0);
  return [
    ok(drill && manned.machines.jaw.bought, 'the drill is bought and standing'),
    ok(manned.machines.jaw.workedAt > 0, 'and working, tended by the one-body gang'),
    ok(bought, 'the pace rung is bought like a player buys it'),
    ok(taken, 'the tender is claimed for the work'),
    ok(arrived, 'and stands at the quarry shed'),
    ok(at1 > at0 && at0 >= 0, 'the bar advances while it stands there',
       `${at0} -> ${at1}`),
    ok(idleTo === idleFrom, 'the drill idles unmanned meanwhile',
       `${idleFrom} -> ${idleTo}`),
    ok(landed && released, 'the work lands and the claim clears'),
    ok(back, 'and the body walks back and tends the drill again')
  ];
});
