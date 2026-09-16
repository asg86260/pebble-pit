// The game opening: the bench arriving, the canvas, the ground line, and a
// rock coming in over the top of the window.

import { sleep, state, ok, canvas, point, onScreen, hoverBench, run, runUntil, raf,
         pressRaise, raiseEl, haveRock, asScreen, shop } from './kit.js';

export const TESTS = [
  // First, on the fresh game the suite resets to: the bench only arrives
  // once, and nothing after here would ever see it missing.
  ['the bench arrives when there is something to buy', async () => {
    const bare = state();
    window.__give(100);
    for (let i = 0; i < 30 && !state().benchCall; i++) await sleep(40);
    await raf();
    const called = state();
    const hit = await pressRaise();
    const started = state();
    const built = runUntil(() => state().seenBench, 90);
    const earned = state();
    await hoverBench();                       // reading the board marks it read
    await sleep(150);
    // Taken off the board while it is open rather than typed in here: a named
    // heading turns a check about reading into a check about one word.
    const shown = [...shop().children].filter(el => el.dataset.sect)
      .map(el => el.dataset.sect);
    point('pointermove', 4, 4, 0);
    await sleep(250);
    const read = state();
    return [
      ok(!bare.seenBench, 'no bench on a game that cannot afford anything'),
      ok(!bare.benchMark, 'and nothing drawn over it', `${bare.benchMark}`),
      ok(!bare.benchCall, 'and nothing asking to build one'),
      ok(called.benchCall && !called.seenBench,
         'the first row you can afford brings the call, not the bench'),
      ok(hit === raiseEl(), 'the call is on the window and nothing is over it',
         hit ? `${hit.tagName}#${hit.id}` : 'nothing there'),
      ok(started.benchRising && !started.seenBench,
         'pressing it starts the build rather than the bench'),
      ok(!started.benchCall, 'and the call goes as it is pressed'),
      ok(built && earned.seenBench, 'the bench stands once the work is done'),
      ok(earned.benchMark === 'flag', 'a group you have never seen flies a flag',
         `${earned.benchMark}`),
      ok(read.benchMark === 'dot', 'once read it is back to a dot for what you can afford',
         `${read.benchMark}`),
      ok(shown.length > 0, 'the board had headings on it to read',
         JSON.stringify(shown)),
      ok(shown.every(t => read.seenSects.includes(t)), 'every heading counts as read',
         `showed ${JSON.stringify(shown)}, read ${JSON.stringify(read.seenSects)}`)
    ];
  }],

  ['canvas covers the viewport', async () => {
    const c = canvas();
    const r = c.getBoundingClientRect();
    return [
      ok(Math.round(r.width) === innerWidth && Math.round(r.height) === innerHeight,
         'canvas box matches the window', `${r.width}x${r.height} vs ${innerWidth}x${innerHeight}`),
      ok(Math.round(r.left) === 0 && Math.round(r.top) === 0, 'canvas sits at the origin'),
      ok(c.width >= innerWidth, 'backing store is at least window sized', `${c.width}`)
    ];
  }],

  ['ground is pinned to the bottom', async () => {
    const s = state();
    // the deepest the hole can ever be, not how far it has been dug: the world
    // reserves the whole depth under the ground line from the first frame, so
    // digging never moves the floor of the window
    const pitFloorFromBottom = innerHeight - onScreen(0, s.groundY + s.pitFullDepth)[1];
    const groundFromBottom = innerHeight - onScreen(0, s.groundY)[1];
    const expected = (s.pitFullDepth + 12) * s.zoom;
    return [
      ok(Math.abs(pitFloorFromBottom - 12 * s.zoom) < 4,
         'pit floor rests on the bottom edge', `${Math.round(pitFloorFromBottom)}px up`),
      ok(Math.abs(groundFromBottom - expected) < 4,
         'ground line is a fixed height above it', `${Math.round(groundFromBottom)} vs ${Math.round(expected)}`)
    ];
  }],

  // The drop is measured against the window: a tall one has to be cleared by
  // more than a short one.
  ['a new rock comes in over the top of the window', async () => {
    // the first frame of a fall, and how far down the screen its foot is then
    const catchOne = () => {
      window.__next();
      for (let i = 0; i < 900; i++) {
        run(1 / 60);
        const s = state();
        if (s.rockFall > 0) return { s, footY: (s.rockFoot - s.camY) * s.zoom };
      }
      return null;
    };

    window.__crew(1, 0);
    haveRock();
    const near = catchOne();
    const landed = haveRock();
    const after = state();

    // and again on a window half as tall again, which has further to clear
    let tall = null;
    await asScreen(1000, 1300, 1, async () => { haveRock(); tall = catchOne(); haveRock(); });
    window.__crew(0, 0);

    return [
      ok(near !== null, 'a rock is caught on its way down'),
      ok(near && near.footY < 0, 'the whole of it starts above the top of the window',
         near && `its foot is ${Math.round(near.footY)}px down the screen`),
      ok(landed && after.rockFoot === after.groundY,
         'and it still lands on the ground line',
         `foot ${after.rockFoot}, ground ${after.groundY}`),
      ok(tall !== null && tall.footY < 0, 'a taller window is cleared too',
         tall && `foot ${Math.round(tall.footY)}px down a ${tall.s.H}px window`),
      ok(tall && near && tall.s.rockFall > near.s.rockFall,
         'and it is dropped from higher up to do it',
         tall && near && `${near.s.rockFall} on ${near.s.H}px, ${tall.s.rockFall} on ${tall.s.H}px`)
    ];
  }],
];
