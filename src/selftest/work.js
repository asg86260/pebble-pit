// Putting people to work, taking them off again, and startling a bird.

import { until, state, ok, point, onScreen, hoverBench, run, haveRock, put } from './kit.js';
import { S } from '../state.js';
import { P } from '../config.js';
import { draw } from '../render.js';
import { ctx } from '../render/ctx.js';
import { screenAt } from '../render/frame.js';
import { setTheme, ink, paper } from '../ink.js';

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

  // A blend or a filter on the frame's canvas is what Firefox's card cannot
  // do, and a page that did one was drawn on the processor from then on: on
  // the dark page, with a builder at work, the yard ran at twenty frames
  // (PERF.md, "Firefox's canvas off the card"). A chip is a plain fill: the
  // ink over open sky, the paper over what stands (here the ground under the
  // line), on either page, read back off the frame.
  ['a builder\'s grit is plain paper or ink, with no blend or filter on the frame', async () => {
    const root = document.documentElement;
    const was = root.classList.contains('dim') ? 'dim' : root.classList.contains('dark') ? 'dark' : 'light';
    const sets = [];
    const spy = key => {
      const proto = Object.getOwnPropertyDescriptor(CanvasRenderingContext2D.prototype, key);
      Object.defineProperty(ctx, key, { configurable: true, get() { return proto.get.call(this); },
        set(v) { sets.push(`${key}=${v}`); proto.set.call(this, v); } });
    };
    spy('globalCompositeOperation');
    spy('filter');
    const rgb = h => [1, 3, 5].map(i => parseInt(String(h).slice(i, i + 2), 16));
    // the scanlines (press.js) dim every other row a little after the grit
    const near = (a, b) => a.every((v, i) => Math.abs(v - b[i]) <= 24);
    const sky = { x: S.camX + S.viewW / 2, y: S.camY + 3 * P }, under = { x: S.camX + S.viewW / 2, y: S.groundY + 2 * P };
    const read = c => {
      const s = screenAt(Math.round(c.x / P) * P + P / 2, Math.round(c.y / P) * P + P / 2);
      return [...ctx.getImageData(Math.round(s.x * S.dpr), Math.round(s.y * S.dpr), 1, 1).data.slice(0, 3)];
    };
    const page = look => {
      setTheme(look);
      S.grit.length = 0;
      for (const c of [sky, under]) S.grit.push({ x: c.x, y: c.y, vx: 0, vy: 0, t: 0, life: 10 });
      sets.length = 0;
      draw();
      const off = sets.filter(s => s !== 'globalCompositeOperation=source-over' && s !== 'filter=none');
      return { off, sky: read(sky), under: read(under), ink: rgb(ink), paper: rgb(paper) };
    };
    let light, dark;
    try {
      light = page('light');
      dark = page('dark');
    } finally {
      delete ctx.globalCompositeOperation;
      delete ctx.filter;
      S.grit.length = 0;
      setTheme(was);
    }
    return [light, dark].flatMap((r, i) => {
      const name = i ? 'dark' : 'light';
      return [
        ok(!r.off.length, `${name} page: no blend or filter set on the frame`, r.off.join(', ')),
        ok(near(r.sky, r.ink), `${name} page: a chip in open sky is the ink`, `${r.sky} vs ${r.ink}`),
        ok(near(r.under, r.paper), `${name} page: a chip on the ground is the paper`, `${r.under} vs ${r.paper}`)
      ];
    });
  }],

];
