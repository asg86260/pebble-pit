// The figures the mess tags say (messtags.js): every cell of weather muck on
// the ground and every cell of the crew's own poop, a figure a kind, read off
// the same layer the yard draws -- so the card at the top edge cannot count
// something the ground does not show, or miss what lies on the rock, in the
// cut or on the plots.

import { group, ok, state, run, runUntil, makeItRain } from './helpers.mjs';

const onGround = s => s.muckAt.reduce((n, [, d]) => n + d, 0);

group('the muck figure is every cell the rain laid, and falls as it is swept', async () => {
  run(0.4);
  window.__crew(0, 0);
  window.__air({ haze: 0, muck: 0 });
  const dry = state().smog.mess;
  makeItRain();
  runUntil(() => !state().smog.raining, 120);
  const wet = state();
  // somebody to sweep it, and the figure watched going down
  window.__crew(3, 2);
  run(30);
  const swept = state();
  window.__crew(0, 0);
  window.__air({ haze: 0, muck: 0 });
  return [
    ok(dry.muck === 0 && dry.poop === 0, 'a clean yard counts nothing', JSON.stringify(dry)),
    ok(wet.smog.mess.muck > 0, 'a storm lays muck, and it is counted', `${wet.smog.mess.muck}`),
    ok(wet.smog.mess.muck === onGround(wet), 'every cell of it, wherever it lies',
       `${wet.smog.mess.muck} counted, ${onGround(wet)} on the ground`),
    ok(swept.smog.mess.muck < wet.smog.mess.muck, 'and the figure falls as the crew sweep',
       `${wet.smog.mess.muck} -> ${swept.smog.mess.muck}`),
    ok(swept.smog.mess.muck === onGround(swept), 'still cell for cell with the ground',
       `${swept.smog.mess.muck} counted, ${onGround(swept)} on the ground`)
  ];
});

group('the poop figure is what a crew with nowhere to go leaves, and only that', async () => {
  window.__reset();
  window.__crew(3, 2);
  window.__tune('LOO_EVERY', 4000);
  window.__air({ haze: 0, muck: 0 });
  run(60);
  const s = state().smog;
  window.__reset();
  return [
    ok(s.mess.poop > 0, 'a crew leaves a mess, and it is counted', `${s.mess.poop}`),
    ok(s.mess.poop === s.poop, 'cell for cell with the layer', `${s.mess.poop} vs ${s.poop}`),
    ok(s.mess.muck + s.mess.poop === s.muck.all, 'and the two figures are all the mess there is',
       `${s.mess.muck} + ${s.mess.poop} vs ${s.muck.all}`)
  ];
});
