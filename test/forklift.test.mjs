// The forklifts: machines that haul by themselves.
//
// What is checked is the bargain in DESIGN.md, "The forklifts drive
// themselves": one is bought off the bench and rolls off the stand with nobody
// aboard; it carries to the hole on its own, at its own two ladders' load and
// pace, sharing the piles with the haulers rather than doubling up on them; it
// parks when the yard is clean; it smokes for the road it drives laden and for
// nothing else; and it is never crew.

import { group, ok, state, run, runUntil, openSites, buyNow, climb, yard } from './helpers.mjs';
import { LADDER } from '../src/config.js';
import { S } from '../src/state.js';
import { load } from '../src/crew/hole.js';
import { drive } from '../src/crew/hauler.js';
import { liftCap, liftSpeed } from '../src/levels.js';
import { doorX } from '../src/crew/lifts.js';

// A lip that can buy the belt: both hauler ladders topped and a set of carts,
// with the coins to pay. `haulers` people carrying.
const lip = (haulers = 2) => {
  window.__reset();
  openSites();
  window.__fullSites();
  window.__crew(0, haulers);
  window.__grant({ sparks: 9999, shards: 9999, spores: 9999 });
  window.__tip(30000);
  window.__levels({ haulCarryLevel: LADDER, haulPaceLevel: LADDER });
  window.__kit({ carters: 3 });
};

const row = key => window.__rows().find(r => r.key === key);
const lift = () => (S.lifts || [])[0];
const soot = () => state().smog.skyKinds?.mach || 0;
// A heap between the rock and the lip, for somebody to carry.
const heap = () => {
  const s = state();
  for (let i = 0; i < 400; i++) window.__pile(s.pitX - 400 + (i % 40) * 6, 3);
};

group('a forklift is bought off the bench and drives out of its garage by itself', async () => {
  window.__reset();
  openSites();
  window.__fullSites();
  window.__crew(0, 2);
  window.__grant({ sparks: 9999, shards: 9999, spores: 9999 });
  window.__tip(30000);
  // Carts alone do not open the row; the ladders alone do not either.
  window.__kit({ carters: 3 });
  const cartsOnly = row('driver');
  window.__kit({ carters: 0 });
  window.__levels({ haulCarryLevel: LADDER, haulPaceLevel: LADDER });
  const laddersOnly = row('driver');
  window.__kit({ carters: 3 });
  const open = row('driver');
  const people = S.workers.length, crew = S.crew;

  const bought = buyNow('driver');
  const s0 = state();
  const at = lift();
  const carry = r => r.roster.find(p => p.key === 'carry');
  return [
    ok(!cartsOnly?.shown && !laddersOnly?.shown, 'the row waits on the carts and both ladders',
       `carts only ${!!cartsOnly?.shown}, ladders only ${!!laddersOnly?.shown}`),
    ok(open?.shown, 'and is on the bench once both are there'),
    ok(bought && s0.drivers === 1 && s0.lifts.length === 1, 'buying one puts a forklift in the yard',
       `${s0.drivers} owned, ${s0.lifts.length} in the yard`),
    ok(at && at.inside && Math.abs(at.x - doorX()) < 1, 'made in the garage', `${at?.x} against ${doorX()}, inside ${at?.inside}`),
    ok(S.workers.length === people && S.crew === crew && !S.workers.some(w => w.vehicle),
       'and nobody on the crew is it, or is driving it', `${people} -> ${S.workers.length} bodies`),
    ok(s0.carters === 3, 'the carts are still the carts', `${s0.carters}`),
    ok(carry(s0)?.lifts === 1, 'the carry roster counts it under the carts', `${carry(s0)?.lifts}`)
  ];
});

group('with no haulers at all, the forklifts empty the yard', async () => {
  lip(0);
  buyNow('driver');
  buyNow('driver');
  window.__clearFloor();
  heap();
  run(40);
  const s = state();
  return [
    ok(S.workers.every(w => w.type !== 'hauler'), 'there is nobody hauling', `${state().haulers}`),
    ok(S.lifts.some(w => (w.stored || 0) > 0), 'and the forklifts put loads in the hole',
       S.lifts.map(w => w.stored || 0).join(', ')),
    ok(s.lifts.length === 2, 'both of them', `${s.lifts.length}`)
  ];
});

group('a forklift carries and drives by its own two ladders, bought like a player', async () => {
  lip();
  buyNow('driver');
  const w = lift();
  const load0 = load(w), pace0 = drive(w);
  const loadRow = row('liftload'), paceRow = row('liftpace');
  const gotLoad = climb('liftload', 1);
  const gotPace = climb('liftpace', 1);
  return [
    ok(loadRow?.shown && paceRow?.shown, 'both ladders are on the bench once there is a forklift'),
    ok(load0 === liftCap(0) && Math.abs(pace0 - liftSpeed(0)) < 1e-9, 'at the foot it carries and drives what the table says',
       `${load0} grains, ${(pace0 * 60).toFixed(0)} px/s`),
    ok(gotLoad === 1 && load(w) === liftCap(1) && load(w) > load0, 'a load rung carries more',
       `${load0} -> ${load(w)}`),
    ok(gotPace === 1 && drive(w) > pace0, 'a speed rung drives faster',
       `${(pace0 * 60).toFixed(0)} -> ${(drive(w) * 60).toFixed(0)} px/s`)
  ];
});

// A claim is a target for empty hands, not a reservation: a body sweeping home
// with something in hand may take a nearer column somebody else set off for
// (`keptBy` in crew/hauler.js). What must never happen is two empty-handed
// bodies setting off for the same one.
group('forklifts and haulers share the piles and never set off for the same column', async () => {
  lip(3);
  buyNow('driver');
  buyNow('driver');
  window.__clearFloor();
  heap();
  let clash = 0;
  for (let i = 0; i < 30 * 6; i++) {
    run(1 / 6);
    const claims = [...S.workers.filter(w => w.type === 'hauler'), ...S.lifts]
      .filter(w => !w.carry).map(w => w.claim).filter(c => c >= 0);
    if (new Set(claims).size !== claims.length) clash++;
  }
  return [ok(clash === 0, 'no two empty-handed ever hold the same column', `${clash} frames with a clash`)];
});

group('with the yard clean, a forklift drives into the garage and smokes nothing', async () => {
  lip();
  buyNow('driver');
  window.__clearFloor();
  heap();
  const laden0 = soot();
  runUntil(() => soot() > laden0, 30);
  const laden1 = soot();
  window.__clearFloor();
  const outOnce = !lift().inside;
  runUntil(() => lift().inside, 60);
  const parked = lift();
  const idle0 = soot();
  run(8);
  return [
    ok(laden1 > laden0, 'a laden drive puts soot up', `${laden0} -> ${laden1}`),
    ok(outOnce, 'it came out of the garage for the heap'),
    ok(parked.inside && Math.abs(parked.x - doorX()) < 1, 'and with nothing to fetch it drives back in at the door',
       `${Math.round(parked.x)} against ${doorX()}, inside ${parked.inside}`),
    // No more than there was: what is up there drifts off on its own.
    ok(soot() <= idle0, 'and puts nothing up standing there', `${idle0} -> ${soot()}`),
    ok(!parked.brk, 'and takes no break')
  ];
});

group('a forklift comes back from a reload where it was', async () => {
  lip();
  buyNow('driver');
  window.__clearFloor();
  heap();
  run(6);
  const before = state().lifts[0];
  window.__reload();
  const after = state().lifts[0];
  run(3);
  return [
    ok(state().drivers === 1 && state().lifts.length === 1, 'still one forklift', `${state().lifts.length}`),
    ok(after && Math.abs(after.x - before.x) <= 1 && after.carry === before.carry,
       'where it was, with what it had on its forks', `${JSON.stringify(before)} -> ${JSON.stringify(after)}`)
  ];
});

group('an old save, whose forklift a carter was driving, comes back with it driving itself', async () => {
  lip();
  buyNow('driver');
  // The save as it was before: the forklift on a carter (`lift` on the body),
  // and no forklifts of its own.
  yard.persist();
  const key = 'boulder-clicker/v4';
  const raw = JSON.parse(localStorage.getItem(key));
  delete raw.lifts;
  const who = raw.who || [];
  const carter = who.find(k => k.trained && k.kitOf === 'haulers') || who[0];
  if (carter) carter.lift = true;
  window.__reset();
  localStorage.setItem(key, JSON.stringify(raw));
  yard.restore();
  run(1);
  return [
    ok(carter, 'the save had somebody to be the driver'),
    ok(S.lifts.length === 1 && S.drivers === 1, 'the forklift is in the yard by itself', `${S.lifts.length}`),
    ok(!S.workers.some(w => w.lift || w.vehicle), 'and nobody is on it'),
    ok(S.carters === 3, 'and the carts are all still there', `${S.carters}`)
  ];
});
