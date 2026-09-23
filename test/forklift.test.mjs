// The forklift: a cart with an engine under it, worn by a carter.
//
// What is checked is the bargain in DESIGN.md "The forklift": it is bought
// off the bench like a cart and reaches a body on foot, it carries and drives
// by the two knobs and nothing else, and it smokes for the road it drives
// laden and for nothing else. The row's gate is the belt's, so a yard that
// cannot buy the belt cannot buy this either.

import { group, ok, state, run, runUntil, openSites, buyNow } from './helpers.mjs';
import { LADDER, LIFT_LOAD, LIFT_PACE } from '../src/config.js';
import { S } from '../src/state.js';
import { load } from '../src/crew/hole.js';
import { drive } from '../src/crew/hauler.js';

// A lip that can buy the belt: both ladders topped and a set of carts, with
// the coins to pay. Two haulers, so one can be a driver and one stay a carter.
const lip = () => {
  window.__reset();
  openSites();
  window.__fullSites();
  window.__crew(0, 2);
  window.__grant({ sparks: 9999, shards: 9999, spores: 9999 });
  window.__tip(30000);
  window.__levels({ haulCarryLevel: LADDER, haulPaceLevel: LADDER });
  window.__kit({ carters: 3 });
};

const row = () => window.__rows().find(r => r.key === 'driver');
const driver = () => S.workers.find(w => w.lift);
const carter = () => S.workers.find(w => w.trained && !w.lift);
const soot = () => state().smog.skyKinds?.mach || 0;

group('a forklift is bought off the bench and reaches a carter on foot', async () => {
  window.__reset();
  openSites();
  window.__fullSites();
  window.__crew(0, 2);
  window.__grant({ sparks: 9999, shards: 9999, spores: 9999 });
  window.__tip(30000);
  // Carts alone do not open the row; the ladders alone do not either.
  window.__kit({ carters: 3 });
  const cartsOnly = row();
  window.__kit({ carters: 0 });
  window.__levels({ haulCarryLevel: LADDER, haulPaceLevel: LADDER });
  const laddersOnly = row();
  window.__kit({ carters: 3 });
  const open = row();

  const bought = buyNow('driver');
  const s0 = state();
  // Somebody wearing a cart walks to the engines' stand and comes back driving.
  runUntil(() => state().driving >= 1, 40);
  const s1 = state();
  const d = driver();
  const carry = r => r.roster.find(p => p.key === 'carry');
  return [
    ok(!cartsOnly?.shown && !laddersOnly?.shown, 'the row waits on the carts and both ladders',
       `carts only ${!!cartsOnly?.shown}, ladders only ${!!laddersOnly?.shown}`),
    ok(open?.shown, 'and is on the bench once both are there'),
    ok(bought && s0.drivers === 1, 'buying it puts an engine on the stand', `${s0.drivers} owned`),
    ok(s1.driving === 1, 'and a carter walks over and drives it away', `${s1.driving} driving`),
    ok(d && d.trained && d.kitOf === 'haulers', 'on a body that is wearing a cart'),
    ok(s1.carters === 3 && s1.drivers === 1, 'and the carts are still the carts',
       `${s1.carters} carts, ${s1.drivers} engines`),
    ok(carry(s0)?.lifts === 1 && carry(s1)?.lifts === 1,
       'the carry roster counts the engine under the carts', `${carry(s1)?.lifts}`)
  ];
});

group('a driver carries and drives by the two knobs', async () => {
  lip();
  buyNow('driver');
  runUntil(() => state().driving >= 1, 40);
  const d = driver(), c = carter();
  // The rule, read off the same functions the walk reads.
  const loads = d && c ? load(d) / load(c) : 0;
  const paces = d && c ? drive(d) / drive(c) : 0;
  // And the road: with a heap between the rock and the lip, the driver's
  // arms fill past what a cart holds.
  window.__clearFloor();
  const s = state();
  for (let i = 0; i < 400; i++) window.__pile(s.pitX - 400 + (i % 40) * 6, 3);
  let most = 0;
  runUntil(() => { const w = driver(); if (w) most = Math.max(most, w.carry || 0); return most > (c ? load(c) : 0); }, 40);
  return [
    ok(d && c, 'one drives and one still walks a cart', `${!!d} ${!!c}`),
    ok(Math.abs(loads - LIFT_LOAD) < 1e-6, `a driver carries ${LIFT_LOAD} times a carter`, `${loads}`),
    ok(Math.abs(paces - LIFT_PACE) < 1e-6, `and drives ${LIFT_PACE} times as fast`, `${paces}`),
    ok(c && most > load(c), 'and its arms fill past a cart on the road', `${most} against a cart's ${c && load(c)}`)
  ];
});

group('a forklift smokes for the road it drives laden, and not otherwise', async () => {
  lip();
  buyNow('driver');
  runUntil(() => state().driving >= 1, 40);
  // Nothing to carry: an engine idling puts nothing up.
  window.__clearFloor();
  const idle0 = soot();
  run(8);
  const idle1 = soot();
  // A heap to run, and the sky answers.
  const s = state();
  for (let i = 0; i < 400; i++) window.__pile(s.pitX - 400 + (i % 40) * 6, 3);
  const laden0 = soot();
  runUntil(() => soot() > laden0, 30);
  const laden1 = soot();
  return [
    ok(idle1 === idle0, 'an idle driver puts no soot up', `${idle0} -> ${idle1}`),
    ok(laden1 > laden0, 'and a laden drive does', `${laden0} -> ${laden1}`)
  ];
});

group('a driver comes back from a reload still driving', async () => {
  lip();
  buyNow('driver');
  runUntil(() => state().driving >= 1, 40);
  window.__reload();
  const s = state();
  // The engine is on the body, not on the stand: nobody sets off for a second.
  run(3);
  const later = state();
  return [
    ok(s.drivers === 1 && s.driving === 1, 'the engine is on the road after the reload',
       `${s.drivers} owned, ${s.driving} driving`),
    ok(later.driving === 1, 'and stays the one engine', `${later.driving}`)
  ];
});
