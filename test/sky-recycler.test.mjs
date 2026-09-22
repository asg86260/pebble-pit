// What a balloon lets fall for what it catches: muck, which the crew shovel,
// until the recycler is fitted and the same catch comes down as dust. The air
// filter's shed took nothing itself and had a spout, a heap and a clog of its
// own; they went with its own mouth. See DESIGN.md, "The balloons ride the
// clouds".

import { group, ok, state, run, runUntil } from './helpers.mjs';

const aloft = recycler => {
  window.__reset();
  window.__crew(0, 1);
  window.__clearFloor();
  window.__grant({ dust: 90000, shards: 900 });
  window.__air({ open: true, haze: 3000, muck: 0, recycler });
  window.__buy('balloon');
  window.__finish();
  window.__air({ purifiers: 1, haze: 3000, muck: 0 });
  runUntil(() => state().craft[0] && state().craft[0].up, 90);
  const floor = state().floor;
  run(40);
  return { s: state(), floorWas: floor };
};

group('a balloon lets its catch fall as muck, until the recycler makes it dust', async () => {
  const plain = aloft(false);
  const fitted = aloft(true);
  window.__air({ haze: 0, muck: 0, open: false, recycler: false, purifiers: 0 });
  window.__clearFloor();
  return [
    ok(plain.s.smog.haze < 3000 && fitted.s.smog.haze < 3000, 'either way it takes the sky down',
       `${plain.s.smog.haze} / ${fitted.s.smog.haze}`),
    ok(plain.s.smog.muck.yard > 0, 'without the recycler what it catches comes down as muck',
       `${Math.round(plain.s.smog.muck.yard)} to shovel`),
    ok(fitted.s.smog.muck.yard === 0, 'with it, no muck',
       `${Math.round(fitted.s.smog.muck.yard)} to shovel`),
    ok(fitted.s.smog.recycled > 0 && fitted.s.floor > fitted.floorWas,
       'and real dust on the ground instead',
       `${fitted.s.smog.recycled} grains, floor ${fitted.floorWas} -> ${fitted.s.floor}`)
  ];
});
