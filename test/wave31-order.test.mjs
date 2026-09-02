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
// So buying the lab before the school put the lab exactly where buying it
// second would have, and the feature was invisible rather than absent.
//
// The check is the reported symptom rather than the mechanism: buy two
// buildings in each order, and the yard must not look the same both times.

import { group, ok, state, yard } from './helpers.mjs';

const busy = () => Object.values(state().works || {}).some(Boolean);

// Buy a row and stand the yard still until the thing is up. One extra frame
// after it lands, because the order is recorded as the work lands and the
// ground is laid on the frame after that.
function build(key) {
  window.__buy(key);
  for (let i = 0; i < 600 && busy(); i++) yard.fast(1);
  yard.fast(1);
}

function yardWith(first, second) {
  window.__reset();
  window.__crew(3, 3);
  window.__grant({ cores: 40, shards: 9999, spores: 9999, dust: 400000 });
  build(first);
  build(second);
  const s = state();
  return { order: s.buildOrder, school: Math.round(s.stands.school.x),
           lab: Math.round(s.stands.lab.x) };
}

group('a building stands where it was bought, not where the table lists it', async () => {
  const schoolFirst = yardWith('unlockschool', 'unlocklab');
  const labFirst = yardWith('unlocklab', 'unlockschool');

  return [
    ok(schoolFirst.order.join() === 'school,lab',
       'the order is recorded as they are bought', schoolFirst.order.join()),
    ok(labFirst.order.join() === 'lab,school',
       'and the other way round when they are bought the other way round',
       labFirst.order.join()),

    // The whole of the bug: both of the above were already true, and the yard
    // looked identical either way.
    ok(schoolFirst.school !== labFirst.school,
       'the school stands somewhere else for having been bought first',
       `${schoolFirst.school} against ${labFirst.school}`),
    ok(schoolFirst.lab !== labFirst.lab,
       'and so does the lab',
       `${schoolFirst.lab} against ${labFirst.lab}`),

    // And the one bought first is the one nearer the rock: the walk starts
    // there and hands out ground as it goes.
    ok(schoolFirst.school > schoolFirst.lab,
       'bought first is placed first',
       `${schoolFirst.school} then ${schoolFirst.lab}`),
    ok(labFirst.lab > labFirst.school,
       'whichever one it was',
       `${labFirst.lab} then ${labFirst.school}`)
  ];
});

group('a yard that has bought nothing keeps the table order', async () => {
  window.__reset();
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
