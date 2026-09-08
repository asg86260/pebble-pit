// Buildings stand where you bought them, and the yard notices.
//
// The ordering itself was built in wave 3 (C7) and worked from the day it
// landed: `S.buildOrder` grows in purchase order, `siteOrder` walks the table
// in that order, and `placeSites` hands back the right x for everybody. None
// of it was ever *seen*, because the ground had already been laid under the
// old order and nothing asked again.
//
// `layPiles` is asked every frame and answers from one cached key -- what the
// ground depends on, written as a string. The key knew about the scrubbing
// house, the star and the sky, and not about the order the yard was bought in.
// So buying one building before another put it exactly where buying it second
// would have, and the feature was invisible rather than absent.
//
// The check is the reported symptom rather than the mechanism: buy two
// buildings in each order, and the yard must not look the same both times.

import { group, ok, state, yard, SEED } from './helpers.mjs';

const busy = () => Object.values(state().works || {}).some(Boolean);

// Buy a row and stand the yard still until the thing is up. One extra frame
// after it lands, because the order is recorded as the work lands and the
// ground is laid on the frame after that.
function build(key) {
  window.__buy(key);
  for (let i = 0; i < 600 && busy(); i++) yard.fast(1);
  yard.fast(1);
}

// The two doors, and why it is these two.
//
// It used to be the school and the lab, because those were the only two the
// yard would sell in either order on the first day. The lab is deleted
// (DESIGN.md, "The lab is deleted"), and finding its replacement is most of the
// work in this file:
//
//  - `__reset` is `newGame`, which leaves the buildings standing. Run twice in
//    one file it handed the second yard the first one's buildings, and the
//    second reading was of a school that had never moved because it had never
//    been rebuilt. The wipe is `__seed`, which is also what every group in this
//    tier starts from.
//  - The construction bench is not an option. Standing it up is not scenery:
//    before it the yard derives a builder from the spare hands, and after it
//    building is a post you hire, so a work with nobody assigned waits fenced
//    for ever. A pair that includes it is a pair that needs staffing between
//    the two purchases, which is a different check.
//  - `s.stands.<key>` is undefined for a building that never went up, so a
//    yard where a door did not actually open reads as a crash rather than as a
//    failure. Both readings are checked for before anything is compared.
//
// On a blank yard with a crew and a purse, exactly two unlock rows are on the
// board: `unlockfarm` and `unlockschool`. Both are gated on nothing but a coin,
// neither is pinned by `siteOrder`, and neither is the bench. So it is those.
function yardWith(first, second) {
  window.__seed(SEED);
  window.__crew(3, 3);
  window.__grant({ cores: 40, shards: 9999, spores: 9999, dust: 400000 });
  build(first);
  build(second);
  const s = state();
  return { order: s.buildOrder, stands: s.stands,
           school: s.stands.school && Math.round(s.stands.school.x),
           farm: s.stands.farm && Math.round(s.stands.farm.x) };
}

group('a building stands where it was bought, not where the table lists it', async () => {
  const schoolFirst = yardWith('unlockschool', 'unlockfarm');
  const farmFirst = yardWith('unlockfarm', 'unlockschool');

  return [
    // Both doors really opened, in both yards. Without this the comparisons
    // below read `undefined !== undefined` and say nothing at all.
    ok(schoolFirst.school != null && schoolFirst.farm != null,
       'both buildings went up when the school was bought first',
       Object.keys(schoolFirst.stands).join()),
    ok(farmFirst.school != null && farmFirst.farm != null,
       'and both when the plots were broken first',
       Object.keys(farmFirst.stands).join()),

    ok(schoolFirst.order.join() === 'school,farm',
       'the order is recorded as they are bought', schoolFirst.order.join()),
    ok(farmFirst.order.join() === 'farm,school',
       'and the other way round when they are bought the other way round',
       farmFirst.order.join()),

    // The whole of the bug: both of the above were already true, and the yard
    // looked identical either way.
    ok(schoolFirst.school !== farmFirst.school,
       'the school stands somewhere else for having been bought first',
       `${schoolFirst.school} against ${farmFirst.school}`),
    ok(schoolFirst.farm !== farmFirst.farm,
       'and so do the plots',
       `${schoolFirst.farm} against ${farmFirst.farm}`),

    // And the one bought first is the one nearer the rock: the walk starts
    // there and hands out ground as it goes.
    ok(schoolFirst.school > schoolFirst.farm,
       'bought first is placed first',
       `${schoolFirst.school} then ${schoolFirst.farm}`),
    ok(farmFirst.farm > farmFirst.school,
       'whichever one it was',
       `${farmFirst.farm} then ${farmFirst.school}`)
  ];
});

group('a yard that has bought nothing keeps the table order', async () => {
  // `__seed`, not `__reset`: `__reset` is `newGame` and leaves whatever is
  // standing standing, so run after the group above it this one asked about a
  // yard that had already bought two buildings.
  window.__seed(SEED);
  const fresh = state();
  // The settlement is the one thing standing on a brand new yard, and it is one
  // of the two the order never touches -- see `siteOrder`, which pins the bench
  // and the settlement to the front of the walk whatever has been bought.
  const house = fresh.stands.house;
  // Buy nothing, run a while: the ground is laid every frame off a key that now
  // has the order in it, so an empty order must lay the same ground every time.
  yard.fast(5);
  const later = state();

  return [
    ok((fresh.buildOrder || []).length === 0, 'nothing bought yet',
       JSON.stringify(fresh.buildOrder)),
    ok(house && Math.round(house.x) === Math.round(later.stands.house.x),
       'and the block has not moved for the yard having thought about it',
       `${Math.round(house?.x)} -> ${Math.round(later.stands.house.x)}`)
  ];
  // What protects a SAVE made before any of this is `test/stuck-yard.test.mjs`
  // and the other fixture checks, which load a real yard off disk: an empty
  // `buildOrder` there has to leave every building exactly where that player
  // left it, and those checks would fail loudly if it did not.
});
