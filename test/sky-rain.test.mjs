// When it rains, and how long it is before it can rain again.
//
// The sky used to come down on the frame the haze crossed a fixed number, which
// made the weather a stopwatch: the same figure, every time, and a player who
// had read it once could stand under a full band counting down to the drop. It
// is sampled now -- the yard takes a look at what is overhead every few seconds
// and rolls for it, and the odds are how filthy it is -- so a dirty sky is a
// thing that is *going* to rain rather than a thing that rains at a number.
//
// And there is a minute of dry underneath all of it. A shower takes down the sky
// it broke on and nothing else, so a busy yard came out of one downpour with the
// band already back over the line and started the next one on the following
// frame. Two rains with a frame between them is one rain that stuttered.

import { group, ok, state, run, runUntil, makeItRain } from './helpers.mjs';

group('a full sky is a threat rather than a stopwatch', async () => {
  run(0.4);
  window.__crew(0, 0);
  // Over the line, and left alone for a second. Nothing is asked of the sky
  // between one look and the next, so the frame it crosses on is not the frame
  // it breaks on.
  window.__air({ haze: state().smog.at + 1, muck: 0 });
  run(1);
  const crossed = state().smog;

  // What the odds are worth, read off the yard rather than worked out here.
  //
  // There is no line any more -- see `rainOdds`. How often it rains *is* how
  // dirty the sky is, all the way down: nought at a clean sky exactly, a small
  // chance at a middling one, and a certainty at the brim. What used to be
  // asserted here is that anything under `at` was not a question at all, and
  // that cliff is what this replaces.
  window.__air({ haze: 0 });
  const clean = state().smog.odds;
  window.__air({ haze: Math.round(state().smog.cap / 4) });
  const light = state().smog.odds;
  window.__air({ haze: Math.round(state().smog.cap / 2) });
  const half = state().smog.odds;
  window.__air({ haze: state().smog.cap });
  const brim = state().smog.odds;

  // and it does come down: the roll is a delay, not a reprieve
  const came = makeItRain();
  window.__air({ haze: 0, muck: 0 });
  return [
    ok(!crossed.raining, 'reaching a filthy sky is not the same as it raining',
       `${Math.round(crossed.haze)} haze, dry`),
    ok(clean === 0, 'a clean sky is not a question at all', `${clean}`),
    ok(light > 0 && light < half, 'a lightly dirty sky is a small chance',
       `${light} against ${half} at half`),
    ok(half > 0 && half < brim, 'and a filthier one is a bigger chance', `${half}`),
    ok(brim === 1, 'and a sky at the brim is a certainty', `${brim}`),
    // The bend is the whole of the pacing: it has to fall away far faster than
    // the sky clears, or a middling yard is rained on constantly.
    ok(light < half / 4, 'and the odds fall away far faster than the sky does',
       `${light} against ${half}`),
    ok(came, 'and a sky that is certain to break, breaks')
  ];
});

group('a minute of dry between one shower and the next', async () => {
  run(0.4);
  window.__crew(0, 0);
  makeItRain();
  runUntil(() => !state().smog.raining, 120);
  const rains = state().smog.rains;

  // The sky held at the brim -- a certainty at every look -- from the moment the
  // first shower stops. What holds the second one off is the gap and nothing
  // else, so this measures the gap.
  let dry = 0;
  for (let i = 0; i < 180 && state().smog.rains === rains; i++) {
    window.__air({ haze: state().smog.cap });
    run(1);
    dry++;
  }
  const second = state().smog.rains > rains;
  window.__crew(0, 0);
  window.__air({ haze: 0, muck: 0 });
  return [
    ok(second, 'it rains again', `${dry}s later`),
    ok(dry >= 59, 'but not for a minute, however filthy it is overhead',
       `${dry}s of dry`),
    ok(dry < 90, 'and not much longer than that once it is owed one', `${dry}s`)
  ];
});
