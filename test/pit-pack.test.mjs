// Pressing the pile: what the star's red is for.
//
// The hole is a fixed size and always was -- see pit.js, which stopped being
// something you dug a purchase at a time because a hole that gates every price
// in the game is the tail wagging the dog. What you can buy is how finely it
// holds what goes in it: a grain half as wide packs four of itself into the same
// square of ground, and `refinePit` shares every grain of the old pile out
// across the finer columns standing where it did.
//
// The machinery for that was written when the hole was and then pinned shut at
// one grain size, because nothing paid for it. This is the paying.

import { group, ok, state, yard } from './helpers.mjs';

group('red presses the pile, and the hole holds more of the same dust', async () => {
  window.__crew(0, 0);
  window.__tip(3000);
  const before = state();

  // Nothing to see until there is red in the world. The row is the only one on
  // the bench priced in sparks, and a row you cannot pay for in a currency you
  // have never seen is a row that reads as broken.
  const hidden = state().pitFine;
  window.__grant({ sparks: 60 });
  const shown = state();

  const paid = window.__press();
  const after = state();

  // and the dust is all still there, in a hole that now has room
  window.__tip(4000);
  const filled = state();

  window.__reset();
  return [
    ok(before.pitGrain === 6 && before.pitFine === 0,
       'a new yard holds its dust at the coarse grain',
       `${before.pitGrain}px, ${before.pitCapacity} of room`),
    ok(hidden === 0 && shown.seenSpark,
       'and nothing is pressed until there is red to press it with'),
    ok(after.pitGrain === 3 && after.pitFine === 1,
       'red buys the next grain down', `${before.pitGrain}px -> ${after.pitGrain}px`),
    ok(after.sparks === shown.sparks - 40,
       'and it is paid for', `${shown.sparks} -> ${after.sparks} sparks`),
    ok(after.pitCapacity > before.pitCapacity * 3.5,
       'the same hole holds four times as much',
       `${before.pitCapacity} -> ${after.pitCapacity}`),
    // The one thing a compression may never do. Every grain of the old pile is
    // shared out across the finer columns standing where it did; nothing is
    // dropped on the floor and nothing is counted twice.
    ok(after.stored === before.stored && after.pitDust === before.pitDust,
       'and not one grain of it was lost in the pressing',
       `${before.pitDust} in the hole before, ${after.pitDust} after`),
    ok(filled.stored === after.stored + 4000,
       'the room is real: more goes in and is counted',
       `${after.stored} -> ${filled.stored}`),
    ok(paid.grain === 3 && paid.step === 1, 'the press says what it did',
       JSON.stringify(paid))
  ];
});

group('a pressing has to be bought, every time', async () => {
  window.__crew(0, 0);
  window.__tip(500);
  window.__grant({ sparks: 40 });
  window.__press();                       // the first one, paid for
  const once = state();

  // The hole fills right up with no red anywhere. It used to settle finer by
  // itself the moment it ran out of room, which is a hole with no ceiling: a
  // full pit is the yard saying it has outgrown its hole, and the answer to
  // that has to be something you go and get.
  window.__tip(300000);
  const crammed = state();

  window.__grant({ sparks: 200 });
  window.__press();
  const twice = state();
  window.__press();
  const thrice = state();

  window.__reset();
  return [
    ok(once.pitGrain === 3, 'the first pressing lands', `${once.pitGrain}px`),
    ok(crammed.pitFull && crammed.pitGrain === 3,
       'and a hole filled to the brim stays at the grain it was paid for',
       `full: ${crammed.pitFull}, grain ${crammed.pitGrain}px`),
    ok(twice.pitGrain === 2 && twice.sparks === crammed.sparks + 200 - 140,
       'the second is dearer and finer again',
       `${twice.pitGrain}px for 140, ${twice.sparks} left`),
    ok(thrice.pitGrain === 2 && thrice.sparks === twice.sparks,
       'and there is no third: nothing is taken for nothing',
       `${thrice.pitGrain}px, ${thrice.sparks} sparks`)
  ];
});
