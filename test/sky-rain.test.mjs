// When it rains again, and that a storm strikes.
//
// The rain is on a clock of its own now (test/weather.test.mjs has the clock,
// the wash and the first storm); what is left here is the minute of dry
// underneath it and the bolt. A shower takes down its share of the sky and
// nothing else, so a busy yard came out of one downpour with the band still
// over the line; the gap is what keeps two rains from being one that
// stuttered.

import { group, ok, state, run, runUntil, makeItRain } from './helpers.mjs';

group('a minute of dry between one shower and the next', async () => {
  run(0.4);
  window.__crew(0, 0);
  makeItRain();
  runUntil(() => !state().smog.raining, 120);
  const rains = state().smog.rains;

  // The next front brought forward every second from the moment the first
  // shower stops. What holds it off is the gap and nothing else, so this
  // measures the gap.
  let dry = 0;
  for (let i = 0; i < 180 && state().smog.rains === rains; i++) {
    window.__air({ haze: state().smog.cap });
    window.__front(1);
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

// Lightning comes with the pour. It is weather only -- nothing in the yard
// changes for it -- so what there is to check is that a real storm throws one
// without being asked, that the bolt reaches from over the window to the
// ground, and that it is gone again in well under a second.
group('a storm throws a bolt', async () => {
  run(0.4);
  window.__crew(0, 0);
  const came = makeItRain();
  // past the drizzle and into the full pour, then wait on a strike -- looked
  // for four times a second, since a bolt hangs for well under one
  run(12);
  let struck = false, cells = 0, embers = 0;
  for (let i = 0; i < 4 * 40 && !struck; i++) {
    run(0.25);
    const s = state().smog;
    if (s.bolt > 0) { struck = true; cells = s.bolt; embers = s.embers; }
  }
  const gone = runUntil(() => state().smog.bolt === 0, 2);
  window.__air({ haze: 0, muck: 0 });
  return [
    ok(came, 'it rains'),
    ok(struck, 'and a strike comes during the pour, unasked'),
    ok(cells > 20, 'and the bolt reaches from over the window to the ground', `${cells} cells`),
    ok(embers > 5, 'and it throws embers off its length', `${embers}`),
    ok(gone, 'and it is gone again inside a second')
  ];
});
