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

  // What the odds are worth, read off the yard rather than worked out here: a
  // clean sky is not a question at all, a sky at the line is a chance, and a sky
  // at the brim is a certainty.
  window.__air({ haze: Math.round(state().smog.at / 2) });
  const clean = state().smog.odds;
  window.__air({ haze: state().smog.at + 1 });
  const line = state().smog.odds;
  window.__air({ haze: state().smog.cap });
  const brim = state().smog.odds;

  // and it does come down: the roll is a delay, not a reprieve
  const came = makeItRain();
  window.__air({ haze: 0, muck: 0 });
  return [
    ok(!crossed.raining, 'crossing the line is not the same as it raining',
       `${Math.round(crossed.haze)} haze, dry`),
    ok(clean === 0, 'a sky under the line is not a question', `${clean}`),
    ok(line > 0 && line < 1, 'a sky at the line is a chance', `${line}`),
    ok(brim === 1, 'and a sky at the brim is a certainty', `${brim}`),
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
