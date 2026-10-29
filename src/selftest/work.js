// Putting people to work, taking them off again, and startling a bird.

import { until, state, ok, point, onScreen, hoverBench, run, haveRock, put } from './kit.js';
import { S } from '../state.js';
import { spawnGrit } from '../grit.js';
import { draw } from '../render.js';
import { ctx } from '../render/ctx.js';
import { setTheme } from '../ink.js';
import { pinInvert } from '../render/invert.js';

export const TESTS = [
  ['a worker put on the rock works it', async () => {
    haveRock();
    // The first body is not bought: it is the one left standing when the rock
    // came down (intro.js). An earlier check will have cleared the yard, so
    // it is put back by hand.
    window.__crew(1, 0);
    await hoverBench();
    const hired = state().crew > 0;
    // it starts on the rock, because that is what the opening left it doing
    const start = state();
    const off = await put('mine', 'less');
    const carrying = state();
    const moved = await put('mine', 'more');
    const before = state();
    run(14);                                  // long enough to walk to the rock and swing
    const after = state();
    return [
      ok(hired, 'the yard starts with a body, and it is not bought'),
      ok(start.crew === 1, 'it is on the payroll', `${start.crew}`),
      ok(start.rockhands === 1, 'and it is digging, which is why it is here',
         `${start.rockhands} mining`),
      ok(off && carrying.rockhands === 0 && carrying.haulers === 1,
         'the roster takes it off, and then it carries dust',
         `${carrying.rockhands} mining, ${carrying.haulers} carrying`),
      ok(moved, 'the rock has a roster under it to put it back on'),
      ok(after.rockhands === 1 && after.haulers === 0, 'now it is on the rock and not carrying',
         `${after.rockhands} mining, ${after.haulers} carrying`),
      ok(after.crew === 1, 'and it is the same body, not a second hire', `${after.crew}`),
      ok(after.rock < before.rock, 'rock is coming off', `${before.rock} -> ${after.rock}`)
    ];
  }],

  ['a worker can be taken off a job again', async () => {
    window.__crew(1, 0);                        // one body, on the rock
    await hoverBench();
    const on = state();
    const back = await put('mine', 'less');
    await until(() => { const s = state(); return s.rockhands === 0 && s.haulers === 1; });
    const off = state();
    const tooMany = await put('mine', 'more') && await put('mine', 'more');
    const capped = state();
    window.__crew(0, 0);
    return [
      ok(on.rockhands === 1 && on.idle === 0, 'it starts on the rock', `${on.rockhands} mining`),
      ok(back, 'the roster lets it go'),
      ok(off.rockhands === 0 && off.haulers === 1, 'and it goes back to carrying dust',
         `${off.rockhands} mining, ${off.haulers} carrying`),
      ok(!tooMany, 'a body it does not have cannot be put anywhere'),
      ok(capped.rockhands + capped.haulers === capped.crew,
         'the crew always adds up', `${capped.rockhands}+${capped.haulers} of ${capped.crew}`)
    ];
  }],

  ['a bird can be startled, and drops a little dust', async () => {
    window.__crew(0, 0, 0, 0);                   // nobody to fetch it while we watch
    window.__clearFloor();
    run(1);
    const clear = state().floor;
    const bank = state().stored;
    // Look at the yard before calling them in: birds are seeded across
    // whatever is on screen.
    window.__look(state().rockLeftX - 700);
    run(0.2);
    window.__birds();
    const s = state();
    // One over ordinary ground: clear of the hole, the rock's bare apron and
    // the mouth of the quarry, where a grain is banked instead of left lying.
    // That is those working, not the bird failing, but it is not what this
    // check is about.
    const clearOf = b => b.x < s.rockLeftX - 120 && b.x > s.pitX - s.pitW;
    const bird = s.sky.birdWorld.find(clearOf) || s.sky.birdWorld[0];
    const [x, y] = onScreen(bird.x, bird.y);
    point('pointerdown', x, y);
    point('pointerup', x, y, 0);
    const hit = state();
    run(3);                                      // long enough for them to come down
    const settled = state();

    return [
      ok(hit.sky.birds === s.sky.birds - 1, 'the one that was clicked is gone',
         `${s.sky.birds} -> ${hit.sky.birds}`),
      ok(hit.chips > 0, 'and it shook some dust loose', `${hit.chips} in the air`),
      ok(hit.chipShades.every(v => v > 0), 'every grain of it is a grain and not an empty cell',
         hit.chipShades.join(' ')),
      ok(settled.chips === 0 && settled.floor === clear + hit.chips,
         'all of which lands, and none of it is lost on the way',
         `${hit.chips} shaken, ${settled.floor - clear} down`),
      ok(hit.chipX.every(cx => Math.abs(cx - bird.x) <= 12),
         'and it falls from where the bird was rather than being thrown somewhere',
         `bird at ${bird.x}, grains at ${hit.chipX.join(' ')}`),
      ok(settled.stored === bank, 'and none of it is banked for free',
         `${bank} -> ${settled.stored}`)
    ];
  }],

  // A `difference` fill on the frame's canvas is the one thing Firefox's card
  // cannot do, and a page that did it on its first frames after a load was
  // drawn on the processor from then on: on the dark page, with a builder at
  // work, the yard ran at twenty frames (PERF.md, "Firefox's canvas off the
  // card"). Wherever the invert filter is exact the grit goes through it, on
  // either page. The control pins the filter inexact, which must still fill,
  // so the spy is known to see a fill when there is one.
  ['the dark page draws a builder\'s grit with no difference fill where the filter is exact', async () => {
    const root = document.documentElement;
    const was = root.classList.contains('dim') ? 'dim' : root.classList.contains('dark') ? 'dark' : 'light';
    const ops = [];
    const proto = Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype, 'globalCompositeOperation');
    Object.defineProperty(ctx, 'globalCompositeOperation', {
      configurable: true,
      get() { return proto.get.call(this); },
      set(v) { ops.push(v); proto.set.call(this, v); }
    });
    const fills = exact => {
      pinInvert(exact);
      S.grit.length = 0;
      spawnGrit(S.camX + S.viewW / 2, S.camY + S.viewH / 2, { n: 20 });
      ops.length = 0;
      draw();
      return ops.filter(o => o === 'difference').length;
    };
    let byFilter, byFill;
    try {
      setTheme('dark');
      byFilter = fills(true);
      byFill = fills(false);
    } finally {
      delete ctx.globalCompositeOperation;
      pinInvert(null);
      S.grit.length = 0;
      setTheme(was);
    }
    return [
      ok(byFilter === 0, 'dark page, exact filter: no difference fill on the frame', `${byFilter}`),
      ok(byFill > 0, 'control: an inexact filter still fills, so the spy sees fills', `${byFill}`)
    ];
  }],

];
