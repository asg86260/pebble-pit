// Two ways a body ends up doing nothing, both of them one question asked twice.
//
// A pair of long-standing intermittent reports -- "some workers are walking
// through the air over the pit after cleaning muck, some are walking across the
// dust" and "quarry workers are getting stuck on the ladder" -- turned out to be
// the same shape of fault rather than two bugs about walking.
//
// The first: muck lies over the mouth of the pit, and `nearestMuck` handed any
// trade a column there. Only a hauler knows how to get down -- it has
// `downTheHole` -- so everybody else walked out over the opening and stood at
// `walkY`, the ground line, shovelling dust several hundred pixels beneath its
// feet. The ones that behaved were the haulers, which is exactly what "some of
// them" means.
//
// The second: whether there is a mess worth walking to was asked by the quarry
// with `yardMuck` and answered at the shovel with `muckFor`, and the two
// disagreed about poop. With no outhouse up -- where poop piles and nothing ever
// clears it -- a quarrier in a full cut was sent up by one and turned away by
// the other, for ever.
//
// Neither is a fault of ladders or of legs. Both are two spellings of one
// question, and both are fixed by there being one spelling.

import { group, ok, state, yard } from './helpers.mjs';

import { muckFor, yardMuckFor } from '../src/smog.js';

group('nobody claims a mess it cannot stand on', async () => {
  window.__reset();
  // No haulers at all: a hauler is the one trade allowed over the mouth, so a
  // yard without one is a yard where nothing may claim that ground.
  window.__crew(0, 0);
  window.__loo(true);
  window.__air({ janitors: 1 });
  window.__clearFloor();

  // Muck over the mouth of the pit and nowhere else, so the only thing to claim
  // is the thing nobody present can reach.
  // Only the near end of the mouth, so the walk is a walk a body will finish.
  const lip = window.__state().pitX;
  const overMouth = window.__muckSet(c => (window.__overPit(c) && c * 6 < lip + 300 ? 3 : 0));

  const hands = window.__state().workers;
  let airborne = 0, frames = 0;
  // Thirty seconds, not four. A body has to *walk* there -- the first draft of
  // this ran four seconds, during which the janitor was still on its way, and so
  // it passed against the very code it was written to catch.
  for (let i = 0; i < 60; i++) {
    window.__fast(0.5);
    for (const w of window.__state().workerPos) {
      const [, pos] = w.split(':');
      const x = Number(pos.split(',')[0]), y = Number(pos.split(',')[1]);
      if (!window.__overPit(Math.round((x + 9) / 6))) continue;
      frames++;
      // Standing on the ground line with the dust it is meant to be shovelling
      // a long way below is the whole of the symptom.
      if (window.__pitTop(x + 9) - y > 60) airborne++;
    }
  }

  return [
    // The setup has to be real or this passes by testing nothing -- an earlier
    // draft asserted over an empty yard and passed against the very code it was
    // written to catch.
    ok(overMouth > 0, 'there is muck over the open mouth', `${overMouth}`),
    ok(hands > 0, 'and somebody in the yard to be tempted by it', `${hands}`),
    // Frames over the mouth SHOULD be nil: the point is that a body which cannot
    // get down there never claims the column in the first place. What must never
    // happen is a body over the mouth standing on the ground line.
    ok(airborne === 0,
       'and nobody stands on the ground line over it',
       `${airborne} airborne of ${frames} frames over the mouth`)
  ];
});

group('the cut and the shovel agree about what is worth climbing out for', async () => {
  window.__reset();
  window.__crew(0, 0, 3);            // quarriers, and no janitor
  window.__fullSites();
  window.__clearFloor();

  // The steady state of a yard with no outhouse: poop on the bare ground and
  // nothing else out there. Nobody but a janitor may shift it.
  window.__muckSet(() => 0);
  const poop = window.__poopSet(c => (c % 7 === 0 ? 4 : 0));
  window.__fast(1);

  const q = { type: 'quarrier' }, j = { type: 'janitor' };

  // The invariant, stated directly, because it is the whole of the bug.
  //
  // Two questions are asked about the same mess: the cut asks "is there
  // anything up top worth climbing out for" and the shovel asks "is there
  // anything here I may actually shift". They ran off different expressions,
  // and the expressions disagreed about poop -- so a quarrier in a full cut was
  // sent up by one and turned away by the other, climbed back down, and did
  // that for as long as anybody watched. Not a fault of ladders: one question
  // with two spellings.
  //
  // Filling a quarry pile from the harness is slow and fiddly; the disagreement
  // itself is not, and it is the thing that has to stay fixed.
  return [
    ok(poop > 0, 'the yard holds a mess only a janitor may shift', `${poop}`),
    ok(yardMuckFor(q) === 0 && muckFor(q) === 0,
       'so neither question offers it to a quarrier',
       `out ${yardMuckFor(q)}, in hand ${muckFor(q)}`),
    ok(yardMuckFor(j) > 0 && muckFor(j) > 0,
       'and both offer it to a janitor',
       `out ${yardMuckFor(j)}, in hand ${muckFor(j)}`),
    ok(!(yardMuckFor(q) > 0 && muckFor(q) <= 0),
       'nobody is ever sent out for a mess it will then be refused')
  ];
});
