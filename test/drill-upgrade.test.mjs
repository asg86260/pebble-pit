// A station whose machine is bought still gets its upgrades built -- and the
// machine keeps running while they are.
//
// Once the drill is bought the quarry's gang is one body (`capOf`), and that
// body is its tender. Under the shed claim, an open work at the station
// outbid the machine's post: the tender walked to the shed and the drill
// idled unmanned for the duration. Now the work is a spare hand's -- a hauler
// off the dust -- so the tender stays at the drill and the drill keeps going.

import { group, ok, state, run, runUntil, openSites, buyBuilt, WORKER } from './helpers.mjs';
import { S } from '../src/state.js';
import { TYPE } from '../src/jobs.js';
import { workAt } from '../src/works.js';
import { quarryShed } from '../src/world.js';

group('a quarry upgrade gets worked while the drill stands, and the drill keeps running', async () => {
  window.__reset();
  openSites();
  window.__crew(0, 2, 5);
  window.__machineGates();
  window.__grant({ spores: 999, shards: 999, sparks: 999 });
  window.__tip(90000);

  // The drill, bought the way a player buys it, and running.
  const drill = buyBuilt('jaw');
  // `__machineGates` topped both quarry ladders to get the drill on the
  // board. At that yield the pile brims before the drill is built, and a
  // topped pace ladder has no rung left to buy; this is about a rung worked.
  window.__levels({ seamLevel: 0, quarryPaceLevel: 0 });
  window.__clearFloor();
  run(12);
  const manned = state();

  // The upgrade under test, bought like a player: the pace rung, priced in
  // spore, built at the quarry's shed by a spare hand.
  const bought = window.__buy('quarrypace');
  const sent = () => S.workers.filter(w => w.type === TYPE.BUILD && w.site === 'quarry');
  const taken = runUntil(() => sent().length === 1, 30);

  // The bar moves while it stands at the shed...
  const shed = quarryShed();
  const inShed = w => w.x + WORKER > shed.x && w.x < shed.x + shed.w;
  const arrived = runUntil(() => sent().some(w => w.goal === 'at' && inShed(w)), 90);
  const at0 = workAt('quarry')?.done ?? -1;
  const workedFrom = state().machines.jaw.workedAt;
  // ...and the drill goes on meanwhile: its tender was never asked to leave.
  // The heap is swept as it goes, so a jaw with nowhere to put what comes out
  // does not stand down for that reason.
  for (let i = 0; i < 4; i++) { run(1); window.__clearFloor(); }
  // A rung this cheap can land inside the sample; landed counts as advanced.
  const at1 = workAt('quarry')?.done ?? Infinity;
  const workedTo = state().machines.jaw.workedAt;
  const tenderHome = S.workers.filter(w => w.type === TYPE.QUARRY).length;

  // The work lands and the hand goes back to the dust.
  const landed = runUntil(() => !workAt('quarry'), 600);
  const released = runUntil(() => sent().length === 0, 10);

  window.__crew(0, 0, 0);
  return [
    ok(drill && manned.machines.jaw.bought, 'the drill is bought and standing'),
    ok(manned.machines.jaw.workedAt > 0, 'and working, tended by the one-body gang'),
    ok(bought, 'the pace rung is bought like a player buys it'),
    ok(taken, 'a spare hand is sent for the work'),
    ok(arrived, 'and stands at the quarry shed'),
    ok(at1 > at0 && at0 >= 0, 'the bar advances while it stands there',
       `${at0} -> ${at1}`),
    ok(workedTo > workedFrom, 'and the drill keeps running meanwhile',
       `${workedFrom} -> ${workedTo}`),
    ok(tenderHome === 1, 'with its tender still a quarrier', `${tenderHome}`),
    ok(landed && released, 'the work lands and the hand goes back to the dust')
  ];
});
