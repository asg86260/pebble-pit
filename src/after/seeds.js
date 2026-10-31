// Seeds (DESIGN.md, "Act 3's grove, rebuilt", track D): the seed basket by the
// forestry shack, the acorns that fill it and the hands that plant them.
//
// The basket is the `seeds` pile (config/afterpiles.js): five acorns at its
// brim, each a unit of the act's one ground, the count what is drawn
// (render/after/basket.js). An acorn reaches it by one of two doors, both
// carried: bought, it is made at heaven's gates the moment a member's hands
// close on it (`seedsOwed` is the claim, saved, so a reload loses no
// purchase), and dropped by a felled crown, it lies where the crown broke
// until a member carries it home (the gatherer's round, bodies.js). It leaves
// by two: a woodcutter takes it to a bare plot (`plantStep`), or the hand
// takes it and lets go over one (`plantLand`); a plot holds one.
//
// Self-seeding is a debt, not a roll: each felled crown adds the rung's
// chance to `S.after.selfSeed`, and the crown that takes it to one drops an
// acorn and has one taken off, so 25% is exactly every fourth tree and a
// check can say which.
import { S } from '../state.js';
import { source } from '../flow.js';
import { AFTER_PUT_S, AFTER_SEED_PLANT_S, AFTER_SEED_REACH_S, AFTER_SEED_TAKE_S, AFTER_SEED_BILLS, AFTER_SEED_RATE,
         AFTER_SELF_SEED, AFTER_SEED_DROP, AFTER_FALL_BOUNCE_S, AFTER_TREE, ACT_GATES_CELL, P, KINDS } from '../config.js';
import { plantable, plantAcorn, layGood } from './grove.js';
import { pileCount, pileBrim, takeBlock, setBlock } from './piles.js';
import { pileMid, plotX, floorAt, afterX0, bedSpan, AP } from './place.js';
import { putSomewhere, tag, slotNear, slotTop, rowY, lying } from './ground.js';
import { isEmpty, push, pop, count, loadKind } from '../carry.js';
import { upCount } from './levels.js';
import { cellOf, colOf } from '../grid.js';
import { afterGround as G } from '../state.js';
import { walk } from './util.js';

// A walk along the floor, true once there.
const go = (w, x, dt) => { const there = walk(w, x, floorAt(x), dt); w.y = floorAt(w.x); return there; };

// --- the basket's room ---------------------------------------------------------------------
export const SEEDS_ROW = 'after-seeds';
export const SELF_SEED_ROW = 'after-selfseed';
export const seedsOwed = () => (S.after ? S.after.seedsOwed || 0 : 0);
export const seedsBought = () => (S.after && S.after.ups[SEEDS_ROW]) || 0;
// Acorns in members' arms: made, and not yet in the basket.
export const seedsCarried = () => (S.after ? S.after.bodies.reduce((n, w) => n + (loadKind(w) === 'acorn' ? count(w) : 0), 0) : 0);
// Room left in the basket for another to be bought: what it holds, what is
// owed and what is on its way in, against its brim. The seeds row is dead at
// none, so a bought seed always has somewhere to go.
export const seedsRoom = () => pileBrim('seeds') - pileCount('seeds') - seedsOwed() - seedsCarried();
// The bill of the seeds row's next purchase: the table, then the last bill
// dearer by AFTER_SEED_RATE for each purchase beyond it.
export function seedBill(n = seedsBought()) {
  const last = AFTER_SEED_BILLS.length - 1;
  if (n <= last) return AFTER_SEED_BILLS[n].map(([c, k]) => [c, k]);
  const k = Math.pow(AFTER_SEED_RATE, n - last);
  return AFTER_SEED_BILLS[last].map(([c, v]) => [c, Math.round(v * k)]);
}
// The row's purchase: one acorn owed, to be fetched.
export function owe() { S.after.seedsOwed = seedsOwed() + 1; }

// --- the fetch from the gates --------------------------------------------------------------
// An idle member's errand (bodies.js): walk to heaven's gates, close the
// hands on the acorn owed -- the unit is made on that frame, against the
// seed bought -- and carry it to the basket, where the count rises on the
// frame it is set down. False with none owed and nothing in the arms.
const gatesX = () => Math.max(afterX0(), ACT_GATES_CELL * P);
export function fetchStep(w, dt) {
  if (!count(w)) {
    if (seedsOwed() <= 0) return false;
    if (!go(w, gatesX(), dt)) { w.t = 0; return true; }
    w.t += dt;
    if (w.t < AFTER_SEED_TAKE_S) return true;
    S.after.seedsOwed = seedsOwed() - 1;
    source('acorn', 1, 'gates');
    push(w, cellOf('acorn'));
    w.t = 0;
    return true;
  }
  if (!go(w, pileMid('forestry', 'seeds'), dt)) return true;
  w.t += dt;
  if (w.t < AFTER_PUT_S) return true;
  const v = pop(w);
  // a basket somehow full: set down beside it, for a gatherer
  if (!setBlock('seeds', w.x, v)) layGood('acorn', w.x - KINDS.acorn.size * AP / 2, w.y - AP * 3, v);
  w.t = 0;
  return true;
}

// --- the woodcutter plants -----------------------------------------------------------------
// A woodcutter with empty hands and a bare plot nobody has claimed takes the
// basket's top acorn, walks it to the plot and plants it (A1). True while it
// has the body this frame (after/bodies.js calls it each frame).
export function plantStep(w, dt) {
  const a = S.after;
  // Only ever an acorn in its arms: anything else and the planting is let go.
  if (w.plant != null && count(w) && loadKind(w) !== 'acorn') w.plant = null;
  if (w.plant == null) {
    if (!isEmpty(w) || pileCount('seeds') <= 0) return false;
    const i = a.plots.findIndex((p, k) => plantable(k) && !a.bodies.some(o => o !== w && o.plant === k));
    if (i < 0) return false;
    w.plant = i; w.t = 0;
  }
  if (!count(w)) {
    if (!go(w, pileMid('forestry', 'seeds'), dt)) { w.t = 0; return true; }
    w.t += dt;
    if (w.t < AFTER_SEED_REACH_S) return true;
    const v = takeBlock('seeds', w.x);
    if (!v) { w.plant = null; return false; }
    push(w, v);
    w.t = 0;
    return true;
  }
  if (!go(w, plotX(w.plant) + AP * 3, dt)) { w.t = 0; return true; }
  w.t += dt;
  if (w.t < AFTER_SEED_PLANT_S) return true;
  const v = pop(w);
  // the plot taken meanwhile: the acorn set down beside it, for a gatherer
  if (!plantAcorn(w.plant, v)) layGood('acorn', w.x - KINDS.acorn.size * AP / 2, w.y - AP * 3, v);
  w.plant = null; w.t = 0;
  return true;
}

// Whether a woodcutter is held up for want of an acorn: a bare plot to plant
// and none in the basket, owed or on its way (the roster's note).
export const waitsOnSeeds = () => !!S.after && pileCount('seeds') <= 0
  && S.after.plots.some((p, i) => plantable(i));

// --- self-seeding --------------------------------------------------------------------------
// The chance a crown drops an acorn at the rung bought now.
export const selfSeedChance = () => AFTER_SELF_SEED[Math.min(upCount(SELF_SEED_ROW), AFTER_SELF_SEED.length) - 1] || 0;
// A crown just broke over plot i: the rung's chance on the debt, and one
// acorn dropped when it reaches one. The acorn lies past the trunk's last
// log, on its own plot, hidden in the breaking crown until the crown lets it
// go and then hopping to its rest as a log does (render/after/piles.js).
function crownDrop(i) {
  const a = S.after, chance = selfSeedChance();
  if (!(chance > 0)) return false;
  a.selfSeed = (a.selfSeed || 0) + chance;
  // Owed but the basket full: the debt is kept and a later crown drops it,
  // so an acorn never lies with no room at home to carry it to (it would
  // hold the logs under it, and the plot, with it).
  if (a.selfSeed < 1 - 1e-9 || seedsRoom() - lying().filter(q => q.kind === 'acorn').length <= 0) return false;
  a.selfSeed -= 1;
  const pivot = plotX(i) + AFTER_TREE.c0 * AP, half = KINDS.acorn.size * AP / 2;
  // On the trunk's logs, just laid: the ground past the last log is the
  // next plot's, and an acorn's lattice may not fit the gap before it.
  const at = pivot - AFTER_SEED_DROP * AP, ai = putSomewhere(cellOf('acorn'), at);
  if (ai < 0) { a.selfSeed += 1; return false; }
  source('acorn', 1, 'crown');
  tag(ai, { i, x0: at - half, at: a.t + AFTER_FALL_BOUNCE_S, hop: true });
  return true;
}
// One frame of the seeds, after the grove's: each crown that landed this
// frame (`fell` is the frame's own time) counts toward the debt.
export function stepSeeds() {
  const a = S.after;
  if (!a || !G.grid) return;
  a.plots.forEach((p, i) => { if (p.fell != null && p.fell === a.t) crownDrop(i); });
}

// --- the hand plants -----------------------------------------------------------------------
// The surface a bare plot's soil bed is in act 3's landing chain
// (acts.js), ahead of the ground: an acorn chip whose foot comes down on a
// bed that can be planted is planted there. A second over the same bed finds
// it no longer bare and falls through to the ground under it, where it lies.
export function plantLand(ch) {
  if (ch.kind !== 'acorn' || ch.vy <= 0 || !S.after || !G.grid) return 0;
  const i = S.after.plots.findIndex((p, k) => { const [x0, x1] = bedSpan(k); return ch.x >= x0 && ch.x < x1 && plantable(k); });
  if (i < 0) return 0;
  const h = KINDS.acorn.size * AP / 2;
  const slot = slotNear(colOf(G, ch.x - h + AP / 2), KINDS.acorn.size);
  const top = slot >= 0 ? rowY(slotTop(slot, KINDS.acorn.size)) : rowY(0);
  if (ch.y + h < top) return 0;
  return plantAcorn(i, ch.s) ? 1 : 0;
}
