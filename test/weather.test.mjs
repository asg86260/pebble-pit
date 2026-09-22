// The rain is the sky's own, and the dirt only decides what it costs.
//
// A front is due every few minutes on a clock, whatever is overhead; it
// brews while the clouds swell, then pours a sheet of clean drops with the
// front's share of the settled sky falling among them as acid. A clean drop
// lands and is gone; a drop that was sky lands as muck. The first front of a
// save is a full storm a few minutes in, so the lightning is seen early over
// a yard too clean to mark. DESIGN.md, "Weather".

import { group, ok, state, run, runUntil } from './helpers.mjs';
import { RAIN_FIRST_S, STORM_BREW_S, RAIN_WASH, RAIN_MARK, CLOUD_SETTLE_S } from '../src/config.js';
import { skyReport } from '../src/weather.js';

group('it rains on a clean yard, on its own clock', async () => {
  run(0.4);
  window.__crew(0, 0);
  const before = state().smog;
  // Nothing fouled, nothing asked: the front comes when it is due.
  const came = runUntil(() => state().smog.raining, RAIN_FIRST_S + STORM_BREW_S + 15);
  const at = state().smog;
  runUntil(() => !state().smog.raining, 120);
  runUntil(() => state().smog.drops === 0, 30);
  const after = state().smog;
  return [
    ok(before.haze === 0 && !before.raining, 'a fresh yard has a clean, dry sky'),
    ok(came, 'and it rains anyway, inside the first few minutes'),
    ok(at.heft === 1, 'the first front is a full storm', `${at.heft}`),
    ok(after.landed.clean > 200, 'water came down', `${after.landed.clean} clean drops`),
    ok(after.landed.dirty === 0, 'and none of it was sky', `${after.landed.dirty}`),
    ok(after.muck.all === 0, 'so nothing is left on the ground', `${after.muck.all}`),
    ok(after.rainDue > 60, 'and the next front is on the clock', `${Math.round(after.rainDue)}s`)
  ];
});

group('dirty rain is a share of the sky, and only that share marks', async () => {
  run(0.4);
  window.__crew(0, 0);
  // Half a sky, left to settle before it is counted.
  window.__air({ haze: Math.round(state().smog.cap / 2), muck: 0 });
  run(8);
  const up = state().smog.sky;
  // The front brought forward over *this* sky, not `makeItRain`, which fills
  // it to the brim first.
  window.__front(1);
  const came = runUntil(() => state().smog.raining, 120);
  runUntil(() => !state().smog.raining, 120);
  runUntil(() => state().smog.drops === 0, 30);
  const after = state().smog;
  const fell = after.landed.dirty;
  const share = fell / up;
  window.__air({ haze: 0, muck: 0 });
  return [
    ok(came, 'it rains'),
    ok(share > RAIN_WASH * 0.7 && share < RAIN_WASH * 1.3,
       'the front washes its share of the settled sky down', `${fell} of ${up}: ${share.toFixed(2)} against ${RAIN_WASH}`),
    // The rest stays up -- the house, not the weather, is what empties a sky.
    ok(after.sky > up * (1 - RAIN_WASH) * 0.6, 'and leaves the rest up there', `${after.sky} of ${up} left`),
    ok(after.landed.clean > fell, 'the water outnumbers the acid', `${after.landed.clean} clean, ${fell} dirty`),
    // Under RAIN_MARK a drop, and a little under that again once a heavy wash
    // stacks its columns to MUCK_MAX; never more than the dirty drops that fell.
    ok(after.landed.laid > fell * RAIN_MARK * 0.4 && after.landed.laid <= fell,
       'and the acid lays its mark, the water none', `${after.landed.laid} laid by ${fell} dirty drops`),
    ok(after.muck.all > 0, 'so there is muck to shovel', `${after.muck.all}`)
  ];
});

group('the first storm strikes', async () => {
  run(0.4);
  window.__crew(0, 0);
  const came = runUntil(() => state().smog.raining, RAIN_FIRST_S + STORM_BREW_S + 15);
  // Looked for four times a second: a bolt hangs well under one, and a
  // once-a-second look can miss every strike of a storm on one seed.
  let struck = false, during = false;
  for (let i = 0; i < 4 * 60 && !struck; i++) {
    run(0.25);
    const s = state().smog;
    if (s.bolt > 0) { struck = true; during = s.raining; }
  }
  return [
    ok(came, 'the first front comes'),
    ok(struck && during, 'and a bolt is seen before the shower ends, over a clean yard', `${struck}, raining ${during}`)
  ];
});

group('a front survives a reload', async () => {
  run(0.4);
  window.__crew(0, 0);
  window.__front(0.6);
  runUntil(() => state().smog.brewing, 5);
  run(10);
  const was = state();
  window.__cold();
  const now = state();
  return [
    ok(was.smog.brewing && now.smog.brewing, 'the brew comes back brewing'),
    ok(Math.abs(now.smog.stormFor - was.smog.stormFor) < 0.05, 'at the same moment',
       `${was.smog.stormFor} -> ${now.smog.stormFor}`),
    ok(now.smog.heft === was.smog.heft, 'at the same heft', `${was.smog.heft} -> ${now.smog.heft}`),
    ok(now.sky.swell === was.sky.swell, 'and the clouds at the same swell', `${was.sky.swell} -> ${now.sky.swell}`)
  ];
});

group('the clouds swell through the brew and settle after', async () => {
  run(0.4);
  window.__crew(0, 0);
  const dry = skyReport();
  window.__front(1);
  runUntil(() => state().smog.brewing, 5);
  // Frame by frame through the brew: how many cells of cloud there are, and
  // whether every cloud ever grows on the same frame.
  let cells = skyReport().cloudCells, grew = 0, lockstep = 0, shrank = 0;
  let each = skyReport().cloudEach;
  for (let f = 0; f < STORM_BREW_S * 60 && !state().smog.raining; f++) {
    run(1 / 60);
    const r = skyReport();
    if (r.cloudCells < cells) shrank++;
    if (r.cloudCells > cells) grew++;
    let changed = 0;
    for (let i = 0; i < Math.min(each.length, r.cloudEach.length); i++) if (r.cloudEach[i] !== each[i]) changed++;
    if (changed && changed >= Math.min(each.length, r.cloudEach.length) && each.length > 2) lockstep++;
    cells = r.cloudCells; each = r.cloudEach;
  }
  const full = skyReport();
  runUntil(() => !state().smog.raining, 120);
  run(CLOUD_SETTLE_S + 2);
  const settled = skyReport();
  return [
    ok(dry.swell === 0 && dry.storm === 0, 'a dry sky is not swelled', `${dry.swell}, ${dry.storm} storm clouds`),
    ok(full.swell > 0.95, 'the brew swells the sky to the front\'s heft', `${full.swell}`),
    ok(full.cloudCells > dry.cloudCells * 2, 'and there is far more cloud', `${dry.cloudCells} -> ${full.cloudCells} cells`),
    ok(full.storm > 0, 'some of it the front\'s own', `${full.storm}`),
    ok(grew > 20, 'grown a step at a time', `${grew} frames grew`),
    ok(lockstep === 0, 'and never every cloud on one frame', `${lockstep} frames`),
    ok(shrank === 0, 'and never shrinking on the way up', `${shrank} frames`),
    ok(settled.swell === 0 && settled.storm === 0, 'and settled again after the shower', `${settled.swell}, ${settled.storm}`)
  ];
// Following particular clouds a cell at a time: the clouds are not saved, and
// a load stands up fresh ones (`seedWeather`), so a mid-brew reload is a new
// sky and the frame-by-frame count means nothing across it.
}, { reload: false });

// A working sky has to be seen: the clouds are the readout, so a dirty sky
// grows and darkens them, and the rain they drop falls in the yard rather than
// sliding sideways with the far, parallaxing clouds when the view scrolls.
group('a dirty sky shows in the clouds, and its rain falls in the yard', async () => {
  run(0.4);
  window.__crew(0, 0);
  const clean = skyReport().cloudCells;
  // A little haze -- far short of the brim -- has to already show: SMOG_CAP is
  // a slow-fill ceiling, so a machine sits at a low share for a long time, and
  // a linear murk would leave the sky blank through all of it (the bug this
  // fixes). The clouds grow with the murk, so more cells is the readout moving.
  window.__air({ haze: 300, muck: 0 });
  run(2);
  const dirty = skyReport().cloudCells;

  // Its rain is one sheet over the whole world, not the window: drops are
  // falling beyond either edge of the view, so a scroll finds rain already
  // there rather than a sheet that follows the camera and fills in behind it.
  window.__front(1);
  runUntil(() => state().smog.raining, 120);
  run(1);
  const xs = window.__dropXs();
  const cam = state().camX, right = cam + state().viewW;
  const beyond = xs.some(x => x < cam - 8) || xs.some(x => x > right + 8);
  const inWorld = xs.every(x => x >= -8 && x <= (state().worldW || right) + 8);
  const inView = xs.length > 0 && beyond && inWorld;
  window.__air({ haze: 0, muck: 0 });
  return [
    ok(clean >= 0, 'a clean sky has its clouds', `${clean} cells`),
    ok(dirty > clean, 'and a little haze already thickens them', `${clean} -> ${dirty}`),
    ok(inView, 'and the rain is one sheet over the whole world, not only the window',
       `${xs.length} drops, view ${Math.round(cam)}..${Math.round(right)}, world ${Math.round(state().worldW || 0)}`)
  ];
});
