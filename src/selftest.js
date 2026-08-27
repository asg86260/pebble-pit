// The checks that need a page.
//
// Run it in the browser -- open the game and call `__test()` in the console --
// or headless with `npm run test:browser`. It resets the save first, so run it
// on a game you do not mind losing.
//
// This used to be the whole suite: five hundred and eighty checks, most of them
// about the yard rather than about the page, all of them going through a browser
// to find out. The ones about the yard live in `test/*.test.mjs` now and run in
// node against `step` directly -- see tools/node/yard.mjs. What is left here is
// what a browser is actually for: a pointer being dragged across a canvas, a
// board seating itself against the edge of a window, a cursor changing shape, a
// cell landing on a whole device pixel.
//
// Every group starts from a new game (see `runTests`), so any one of them can be
// run on its own with `__test('some words from the name')`, and the suite can be
// split across as many browsers as you like.

// Real wall time, and the only thing in the suite that costs any. It is not
// waste: `run()` drives the game, but dust in flight, the counter tween, the
// board sliding and the save's debounce are all hung off real frames, and a
// check that reads them early reads them mid-animation. Capping these was tried
// and cost ten checks. What is worth cutting is simulated frames, below.
let SLEPT = 0, SLEEPS = 0, STEPPED = 0, FRAMES = 0, RUNS = 0;
const sleep = ms => { SLEPT += ms; SLEEPS++; return new Promise(r => setTimeout(r, ms)); };

// A frame of the page, rather than a stretch of the wall clock.
//
// Waiting for the browser is not the same as waiting for the game. The game's
// own clock is turned by hand here -- see `run` -- but the page has its own
// business: a board seats itself in the frame loop, and a style written this
// moment is not laid out until the next frame. Two frames is all any of that
// takes, and two frames is about thirty milliseconds rather than the quarter of
// a second a check used to sleep for on the off-chance.
// A frame, or a fiftieth of a second, whichever comes first. The frame is what
// is actually wanted; the timer is there because a headless browser stops
// painting when it decides nobody is looking, and a check waiting on a frame
// that will never come is a suite that hangs three minutes in with no output.
const raf = () => new Promise(r => {
  let done = false;
  const go = () => { if (!done) { done = true; r(); } };
  requestAnimationFrame(go);
  setTimeout(go, 50);
});

// The yard and the page, both brought up to date. The seconds are game seconds
// and cost nothing; the frames are real and cost two of them.
async function settle(seconds = 0.4) {
  if (seconds > 0) run(seconds);
  await raf();
  await raf();
}
let STATED = 0, STATES = 0;
const state = () => { const t = performance.now(); const v = window.__state(); STATED += performance.now() - t; STATES++; return v; };
const fmt = n => n.toLocaleString('en-US');   // the same as the boards write
// the boards are rebuilt when the game changes; a check that changes it by hand
// has to ask for the same
const buildShopFromTest = () => window.__build();

function ok(cond, what, detail = '') {
  if (cond) return { pass: true, what };
  return { pass: false, what, detail };
}

const P = 6;                                   // a cell, for the piles
const canvas = () => document.getElementById('c');
const board = () => document.getElementById('board');
const panel = () => document.getElementById('panel');
const shop = () => document.getElementById('shop');

const point = (type, x, y, buttons = 1, button = 0) =>
  canvas().dispatchEvent(new PointerEvent(type, {
    clientX: x, clientY: y, pointerId: 1, isPrimary: true, button,
    buttons: type === 'pointerup' ? 0 : buttons, bubbles: true
  }));

// world position -> where it is on screen right now
function onScreen(wx, wy) {
  const s = state();
  return [(wx - s.camX) * s.zoom, (wy - s.camY) * s.zoom];
}

// the game reports where it put things, so the tests never hold a copy of the layout
const benchWorld = () => {
  const s = state();
  return { x: s.benchX, y: s.groundY };
};

const boulderWorld = () => {
  const s = state();
  return { x: s.rockX, y: s.rockY };
};

// The bench is not in the yard until the first upgrade is affordable, so a check
// that wants to open it has to earn it first.
async function haveBench() {
  if (state().seenBench) return;
  window.__give(100);
  for (let i = 0; i < 30 && !state().seenBench; i++) await sleep(40);
}

async function hoverBench() {
  await haveBench();
  const b = benchWorld();
  const [x, y] = onScreen(b.x + 20, b.y - 30);
  point('pointermove', x, y, 0);
  await sleep(250);
}

// the cursor standing at no station at all, so the board closes
async function hoverAway() {
  point('pointermove', 4, 4, 0);
  await sleep(250);
}

// bank one core the long way round: finish the rock, wait for the core to roll
// clear of it, carry it, throw it in
// The crew take five when a rock is finished and the next one comes down out of
// the sky after them, so between rocks there is a stretch with nothing to mine.
// A check that wants a rock has to wait for one.
// Run the yard forward without waiting for it: `__fast(20)` is twenty seconds of
// game in a few milliseconds, and the same twenty seconds every time it is run.
// A check that sleeps and hopes passes on a fast machine and fails on a slow
// one; a check that turns the handle a fixed number of times does not.
const run = (seconds) => {
  const t = performance.now();
  const f = window.__fast(seconds);
  STEPPED += performance.now() - t; FRAMES += f; RUNS++;
  return f;
};

// Run until something is true, a second of game at a time, up to a limit. The
// limit is in game seconds, not real ones, so it is a fact about the game
// rather than about the machine.
function runUntil(done, limit = 60) {
  for (let i = 0; i < limit; i++) {
    run(1);
    if (done()) return true;
  }
  return false;
}

function haveRock() {
  return runUntil(() => {
    const s = state();
    return s.rock > 0 && !s.rockFall && !s.dancing;
  }, 30);
}

async function bankCore() {
  window.__next();                             // the last of the rock goes
  // Turned by hand rather than waited out. The core rolls clear on the game's
  // own clock, and the game's clock is ours here: six seconds of it costs a few
  // milliseconds, where sitting through six seconds costs six seconds.
  runUntil(() => state().coreItem?.rest, 10);
  const k = state().coreItem;
  if (!k) return false;

  const [kx, ky] = onScreen(k.x + 9, k.y + 9);
  point('pointerdown', kx, ky);
  run(0.1);
  const s = state();
  const [tx, ty] = onScreen(s.pitX + s.pitW * 0.2, s.groundY - 120);
  for (let i = 1; i <= 8; i++) {
    point('pointermove', kx + (tx - kx) * i / 8, ky + (ty - ky) * i / 8);
    run(1 / 60);
  }
  run(0.2);
  point('pointerup', tx, ty);
  return runUntil(() => !state().coreItem && !state().heldCore, 20) && (haveRock(), true);
}

// A roster: click the less or the more under the station itself. The game
// reports where its buttons are, so this aims at the real control through the
// real pointer path rather than calling assign() behind the yard's back.
const put = async (key, which) => {
  const p = state().roster.find(r => r.key === key);
  if (!p || p.fixed) return false;
  const was = state()[p.job];
  const [x, y] = onScreen(...p[which]);
  point('pointerdown', x, y);
  point('pointerup', x, y);
  await sleep(150);
  return state()[p.job] !== was;
};

const buy = async key => {
  const b = shop().querySelector(`button[data-key="${key}"]`);
  if (!b || b.disabled) return false;
  b.click();
  await sleep(150);
  return true;
};


// pretend to be a particular screen for the length of one check
async function asScreen(w, h, dpr, fn) {
  // devicePixelRatio is the window's own property, so deleting it would take it
  // away for good: put the description back exactly as it was found
  const el = document.documentElement;
  const was = [
    [window, 'devicePixelRatio', Object.getOwnPropertyDescriptor(window, 'devicePixelRatio')],
    [el, 'clientWidth', Object.getOwnPropertyDescriptor(el, 'clientWidth')],
    [el, 'clientHeight', Object.getOwnPropertyDescriptor(el, 'clientHeight')]
  ];
  const set = (o, k, v) => Object.defineProperty(o, k, { value: v, configurable: true });
  set(window, 'devicePixelRatio', dpr);
  set(el, 'clientWidth', w);
  set(el, 'clientHeight', h);
  dispatchEvent(new Event('resize'));
  await sleep(80);
  try {
    return await fn();
  } finally {
    for (const [o, k, d] of was) {
      if (d) Object.defineProperty(o, k, d); else delete o[k];
    }
    dispatchEvent(new Event('resize'));
    await sleep(80);
  }
}

// a finger rather than a mouse
const finger = (type, id, x, y) =>
  canvas().dispatchEvent(new PointerEvent(type, {
    clientX: x, clientY: y, pointerId: id, isPrimary: id === 1, pointerType: 'touch',
    buttons: type === 'pointerup' ? 0 : 1, bubbles: true, cancelable: true
  }));

const TESTS = [
  // Nothing is shown before it can be used: the bench is not in the yard until
  // there is a row on it you can afford, and once it is there it says what it
  // has without being opened.
  // This one goes first, on the fresh game the suite resets to: the bench only
  // arrives once, and nothing after here would ever see it missing.
  ['the bench arrives when there is something to buy', async () => {
    const bare = state();
    window.__give(100);
    for (let i = 0; i < 30 && !state().seenBench; i++) await sleep(40);
    const earned = state();
    await hoverBench();                       // reading the board marks it read
    await sleep(150);
    point('pointermove', 4, 4, 0);
    await sleep(250);
    const read = state();
    return [
      ok(!bare.seenBench, 'no bench on a game that cannot afford anything'),
      ok(!bare.benchMark, 'and nothing drawn over it', `${bare.benchMark}`),
      ok(earned.seenBench, 'it arrives with the first row you can afford'),
      ok(earned.benchMark === 'flag', 'a group you have never seen flies a flag',
         `${earned.benchMark}`),
      ok(read.benchMark === 'dot', 'once read it is back to a dot for what you can afford',
         `${read.benchMark}`),
      ok(read.seenSects.includes('you'), 'the heading counts as read',
         JSON.stringify(read.seenSects))
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
    // the floor of the hole, which is not the top of the bed: the pile is
    // allowed to heap above the brim, so the bed starts above the ground line
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

  // A rock that starts halfway up the sky appears out of nothing in the middle of
  // the window and falls the second half of the way. It has to come in over the
  // top edge, which means the drop is measured against the window: a tall one has
  // to be cleared by more than a short one.
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

  ['the school is a place you walk to', async () => {
    window.__crew(2, 2, 2, 2);
    window.__grant({ shards: 30 });
    const shut = state();
    const row = [...shop().querySelectorAll('[data-key]')]
      .find(r => r.dataset.key === 'unlockschool');
    row?.click();
    const open = state();
    const rows = [...document.getElementById('schoolshop').querySelectorAll('[data-key]')]
      .map(r => r.dataset.key);

    // standing at it opens its board, the same as the bench and the lab
    window.__look(open.schoolX - 200);
    await sleep(60);
    const [sx, sy] = onScreen(open.schoolX + 60, open.groundY - 20);
    point('pointermove', sx, sy, 0);
    await sleep(250);
    const standing = state().schoolBoardOpen;
    await hoverAway();
    window.__look(state().openCamX);             // and leave the view where it was
    window.__crew(0, 0);
    return [
      ok(!shut.schoolOpen && !!row, 'the bench sells it, and it is not there to start with'),
      ok(open.schoolOpen && open.shards === shut.shards - 4,
         'shards build it', `${shut.shards} -> ${open.shards}`),
      ok(open.schoolX > 1956 && open.schoolX + 120 < 2268,
         'it stands clear of the quarry spoil and of where the crew live',
         `${open.schoolX}`),
      ok(rows.join(',') === 'breaker,carter,blaster,grower',
         'and it sells the four trades', rows.join(',')),
      ok(standing, 'walking up to it opens its board')
    ];
  }],

  // The trades are bought at a building of their own, not on the bench. The
  // bench is the shop; this is a decision about people, and they read
  // differently for standing in different places.
  ['shop opens at the bench and is not buried', async () => {
    // The first time the board has been opened since the page loaded, which is
    // the case that used to be wrong: it was seated by the height it had before
    // its rows were written, so it hung low until you closed it and opened it
    // again. Nothing after this check ever sees a board opening for the first
    // time, so if this is not where it is caught it is not caught at all.
    await hoverBench();
    const b = board();
    const first = document.getElementById('panel').getBoundingClientRect();
    await hoverAway();
    await sleep(220);
    await hoverBench();
    const again = document.getElementById('panel').getBoundingClientRect();

    const r = b.getBoundingClientRect();
    const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    const rows = [...shop().children];
    const cells = rows.filter(el => !el.dataset.sect)
                      .map(el => [...el.children].map(sp => sp.textContent));
    return [
      ok(!b.hidden, 'board opens when the cursor nears the bench'),
      ok(r.width > 40 && r.height > 40, 'board has a size', `${r.width}x${r.height}`),
      ok(r.left >= 0 && r.top >= 0 && r.right <= innerWidth && r.bottom <= innerHeight,
         'board is inside the window', JSON.stringify(r)),
      ok(hit !== canvas(), 'board is above the canvas, not behind it',
         `topmost is ${hit && (hit.id || hit.tagName)}`),
      ok(rows.some(el => el.dataset.sect), 'board has section headings'),
      ok(cells.length > 0 && cells.every(c => c.length === 3), 'rows are three columns',
         JSON.stringify(cells[0])),
      ok(cells.every(c => c[0] && c[2]), 'every row has a name and a price',
         JSON.stringify(cells)),
      // No row states a value the game is keeping. What it says in the middle is
      // what buying it changes -- a whole number of something, or a share of
      // what that thing was already doing -- so every one that says anything at
      // all starts with a plus and there is never an arrow.
      ok(cells.every(c => !c[1] || /^\+\d/.test(c[1])), 'a row says a gain, not a before and after',
         JSON.stringify(cells.map(c => c[1]))),
      ok(Math.abs(first.top - again.top) < 2 && Math.abs(first.height - again.height) < 2,
         'and it opens in the same place the first time as the second',
         `${Math.round(first.top)}/${Math.round(first.height)} then ` +
         `${Math.round(again.top)}/${Math.round(again.height)}`)
    ];
  }],

  // Something moving through still air moves the air. The dust is the one thing
  // in this yard the pointer goes through without touching anything, and a field
  // that takes no notice of a hand through it is a picture of dust.
  ['the cursor leaves a draught in the dust', async () => {
    window.__reset();
    await settle();
    run(3);
    const quiet = state();

    // Put the hand down first and let the air forget it. Whatever ran before this
    // left the pointer somewhere, so the move *to* the starting corner is itself
    // a sweep across the window -- and measuring "nothing is blowing about" in
    // the frame after it reads the last check's draught, not this one's.
    point('pointermove', 200, 200, 0);
    run(3);
    const still = state();
    for (let i = 1; i <= 12; i++) point('pointermove', 200 + i * 16, 200, 0);
    const stirred = state();
    const was = stirred.airPos;
    run(2 / 60);
    const after = state();
    const shifted = after.airPos.filter((p, i) => p !== was[i]).length;

    // and the pointer left where it is: standing still stirs nothing
    run(3);
    const settledAir = state();
    point('pointermove', 392, 200, 0);
    point('pointermove', 392, 200, 0);
    const parked = state();

    return [
      ok(quiet.air > 0, 'there is dust in the air to begin with', `${quiet.air} motes`),
      ok(still.airStirred === 0, 'and none of it is being blown about',
         `${still.airStirred} carrying a draught`),
      ok(stirred.airStirred > 0, 'a hand drawn through it takes some of it along',
         `${stirred.airStirred} of ${stirred.air}`),
      ok(stirred.airStirred < stirred.air,
         'and not the whole field: it is a wake, not a wind', `${stirred.airStirred} of ${stirred.air}`),
      ok(shifted > 0, 'the motes it caught actually move', `${shifted} moved`),
      ok(settledAir.airStirred === 0, 'the air settles again once the hand has gone by',
         `${settledAir.airStirred} still drifting`),
      ok(parked.airStirred === 0,
         'and a pointer parked in it stirs nothing at all, however long it sits there',
         `${parked.airStirred} drifting`)
    ];
  }],

  // A body let go of used to drop straight down however you were moving when you
  // let go -- the one thing in the yard that fell out of the air with no regard
  // for the hand that had hold of it. It is thrown now, off the same flick the
  // dust is thrown with, and waggling one about earns it a moment of not
  // knowing which way is up.
  ['a body is thrown rather than dropped, and shaking one makes it dizzy', async () => {
    window.__reset();
    await settle();
    window.__crew(2, 2);
    run(2);

    const grab = () => {
      const s = state();
      const [wx, wy] = s.workerPos[0].split(':')[1].split(',').map(Number);
      const [sx, sy] = onScreen(wx, wy);
      point('pointerdown', sx, sy, 2, 2);
      return { wx, sx, sy };
    };
    const at = () => state().workerPos[0].split(':')[1].split(',').map(Number);
    // Where it came to rest, not where it had walked to afterwards: a body picks
    // its job back up the moment it lands, so a fixed run() after the throw
    // measures the walk as well as the flight.
    const landed = () => {
      for (let i = 0; i < 240 && state().falling > 0; i++) run(1 / 60);
      return at();
    };

    // Thrown sideways from up in the air. Held at head height it has no time to
    // travel before it lands, which measures the drop rather than the throw --
    // so it goes up first, stands still long enough for the climb to go stale,
    // and is then flicked across.
    const a = grab();
    await sleep(20);
    for (let i = 1; i <= 5; i++) { point('pointermove', a.sx, a.sy - i * 40, 2); await sleep(16); }
    await sleep(180);                            // the climb is not the throw
    for (let i = 1; i <= 6; i++) { point('pointermove', a.sx + i * 20, a.sy - 200, 2); await sleep(16); }
    point('pointerup', a.sx + 140, a.sy - 200, 0);
    const thrown = at();
    const landedAt = landed();
    const carried = Math.abs(landedAt[0] - thrown[0]);

    // and dropped from a standstill: it goes where it was let go of
    run(3);
    const b = grab();
    await sleep(20);
    for (let i = 1; i <= 5; i++) { point('pointermove', b.sx, b.sy - i * 40, 2); await sleep(16); }
    await sleep(180);                            // stood still before letting go
    point('pointerup', b.sx, b.sy - 200, 0);
    const still = at();
    const stillLanded = landed();
    const dropped = Math.abs(stillLanded[0] - still[0]);

    // shaken about: it lands seeing stars
    run(3);
    const c = grab();
    await sleep(20);
    for (let i = 0; i < 8; i++) { point('pointermove', c.sx + (i % 2 ? 26 : -26), c.sy, 2); await sleep(30); }
    point('pointerup', c.sx, c.sy, 0);
    run(0.6);
    const dizzy = state();
    run(3);
    const over = state();

    window.__crew(0, 0);
    return [
      // Measured against each other rather than against a number. How far a
      // throw carries depends on how long the body is in the air, which depends
      // on where it was standing when it was picked up -- so what is actually
      // being claimed is that the flick does something the standstill does not.
      ok(carried > dropped + 15, 'a body flicked out of your hand travels while it falls',
         `${carried}px thrown against ${dropped}px let go of`),
      ok(dropped < 10, 'and one let go of from a standstill comes straight down',
         `${dropped}px across`),
      ok(dizzy.saying > 0, 'shaking one about leaves it seeing stars',
         `${dizzy.saying} saying something`),
      ok(over.saying === 0, 'and it comes round', `${over.saying} still at it`)
    ];
  }],

  // Shards used to trickle: a quarrier swung, and every so often one came off the
  // face, for ever, at a steady rate -- which makes blue a tap rather than a
  // find. A cut is full of dirt now. Somebody works down through it, and at the
  // bottom there is a seam: a handful all at once, thrown up over the rim, then
  // the climb out and the hole falls in behind them.
  ['the cut is dug out to a seam, and falls in behind them', async () => {
    window.__reset();
    await settle();
    window.__crew(0, 0, 2);
    run(2);
    const fresh = state();

    // it goes down, and nothing comes up on the way
    runUntil(() => state().cutDug > 0.5, 120);
    const halfway = state();

    // and at the bottom the seam comes out in one go
    const paid = runUntil(() => state().pileCount.quarry > 0, 180);
    const seam = state();
    const climbing = runUntil(() => state().crewDetail.some(d => d[0] === 'q' && d.includes('|up|')), 30)
                  || seam.cutDug >= 1;

    // then the hole fills back in and they start again
    const again = runUntil(() => state().cutDug < 0.5 && state().pileCount.quarry > 0, 120);
    const round2 = runUntil(() => state().pileCount.quarry > seam.pileCount.quarry, 240);
    window.__crew(0, 0);
    return [
      ok(fresh.cutDug < 0.2, 'a fresh cut is full to the ground line', `${fresh.cutDug}`),
      ok(halfway.pileCount.quarry === 0,
         'and nothing comes up while they are still digging through it',
         `${halfway.pileCount.quarry} on the pile at ${halfway.cutDug} down`),
      ok(paid && seam.pileCount.quarry > 1,
         'the seam at the bottom pays a handful at once, not one at a time',
         `${seam.pileCount.quarry} up in one go`),
      ok(seam.seam >= 2, 'and what it is worth is the depth of the cut', `${seam.seam} a seam`),
      ok(climbing, 'they climb out with it'),
      ok(again, 'the cut falls in behind them', `${state().cutDug} deep again`),
      ok(round2, 'and they dig it again')
    ];
  }],

  // The yard makes its own work. A body stops now and then, says so, leaves the
  // same muck the sky rains down, and gets back to it -- so a bigger crew is
  // more hands and a bigger mess, and the shovelling has something to do that
  // did not come out of the weather.
  ['a body stops now and then, and the crew clear up after it', async () => {
    window.__reset();
    await settle();
    window.__crew(4, 0);                       // miners only: nobody to shovel it yet
    window.__air({ haze: 0, muck: 0 });
    window.__clearFloor();

    let said = 0, mucked = 0;
    for (let i = 0; i < 700 && (said < 2 || mucked < 2); i++) {
      run(0.25);
      const s = state();
      if (s.saying > 0) said++;
      if (s.smog.muck.yard > 0) mucked++;
    }
    const left = state().smog.muck.yard;

    // and now somebody whose job it is to shift it
    window.__crew(1, 4);
    const cleared = runUntil(() => state().smog.muck.yard === 0, 90);
    window.__crew(0, 0);
    window.__air({ haze: 0, muck: 0 });
    window.__clearFloor();
    return [
      ok(said > 0, 'a body says what it is about to do', `${said} frames saying it`),
      ok(mucked > 0, 'and leaves something behind', `${mucked} frames with muck in the yard`),
      ok(left > 0, 'which stays there while nobody is shovelling', `${Math.round(left)}`),
      ok(cleared, 'and the crew clear it like any other mess',
         `${Math.round(state().smog.muck.yard)} left`)
    ];
  }],

  // A yard under muck is the one job the whole crew drops everything for, and it
  // has something to shovel wherever you stand -- so a gang that arrived
  // together each found work on the spot it arrived on, and the mess was cleared
  // by one lump you could not count the bodies in.
  ['the crew spread out to shovel rather than clearing it as one lump', async () => {
    window.__reset();
    await settle();
    window.__crew(0, 6);
    window.__clearFloor();
    window.__air({ muck: 300 });
    run(3);
    const s = state();
    const xs = s.workerPos.filter(d => d[0] === 'h')
                          .map(d => +d.split(':')[1].split(',')[0])
                          .sort((a, b) => a - b);
    const onJob = s.crewDetail.filter(d => d[0] === 'h' && d.split('|')[1] === 'muck').length;
    // the closest any two of them stand
    let tightest = Infinity;
    for (let i = 1; i < xs.length; i++) tightest = Math.min(tightest, xs[i] - xs[i - 1]);

    // and it settles rather than jittering: two reads a moment apart agree
    run(0.5);
    const again = state().workerPos.filter(d => d[0] === 'h')
                                   .map(d => +d.split(':')[1].split(',')[0])
                                   .sort((a, b) => a - b);
    window.__crew(0, 0);
    window.__air({ haze: 0, muck: 0 });
    window.__clearFloor();
    return [
      ok(onJob >= 5, 'the crew drop what they are doing for a yard under muck',
         `${onJob} of 6 shovelling`),
      ok(new Set(xs).size === xs.length, 'and no two of them stand on the same spot',
         xs.join(',')),
      // Three cells, which is what a body is. This file has no imports -- it
      // reads the yard through __state() and nothing else -- so the width is
      // written out rather than borrowed from config.
      ok(tightest >= 18, 'each has a body width of ground to work in',
         `closest pair ${tightest}px apart`),
      ok(again.every((x, i) => Math.abs(x - xs[i]) < 12),
         'and the line they make settles rather than shuffling about',
         `${xs.join(',')} then ${again.join(',')}`)
    ];
  }],

  // A rock in the air stops anybody who would have to walk under it, and that is
  // right. Standing dead still for the whole ten seconds of it is not: five
  // haulers that were walking in step all stop on the same pixel, and what you
  // see is one body twitching rather than a crew waiting for a rock to land.
  ['a rock in the air is danced through, not stood through', async () => {
    window.__reset();
    await settle();
    window.__crew(2, 5);
    window.__clearFloor();
    const p = state().piles.find(q => q.key === 'rock');
    for (let x = p.from + 8; x < p.to - 8; x += 8) window.__pile(x, 30);
    window.__next();                             // the rock is off; the next one comes
    // A frame at a time. `runUntil` moves a whole second at a go, and the fall
    // is over inside one -- so the coarse loop steps straight across it and
    // reports a yard that was never held up at all.
    let falling = false;
    for (let i = 0; i < 3600 && !falling; i++) { run(1 / 60); falling = state().rockFall > 0; }

    // Sampled right through the fall rather than off the front of it. The dance
    // spreads them by walking -- a whole cell at a twentieth of a step, because
    // a body that jumped to its mark would be teleporting -- so the first few
    // frames of it look exactly like the standing about it replaced.
    // On an odd number of frames, and not a round one. The hop is a sine on the
    // clock: sampled every twenty frames it is read at the same point of the
    // beat every time, and a body hopping steadily reads as a body standing
    // still.
    const shots = [];
    for (let i = 0; i < 14; i++) { run(7 / 60); shots.push(state()); }
    const hauls = s => s.workerPos.filter(d => d[0] === 'h');
    const xs = s => hauls(s).map(d => d.split(':')[1].split(',')[0]);
    const ys = s => hauls(s).map(d => d.split(':')[1].split(',')[1]);
    const spread = shots.map(s => new Set(xs(s)).size);
    const finite = shots.every(s => ys(s).every(y => Number.isFinite(+y)));
    const hopped = new Set(shots.flatMap(s => ys(s))).size > 1;
    const zone = shots[0].dropZone;
    const clear = !zone || shots.every(s => xs(s).every(x => +x + 18 <= zone[0] || +x >= zone[1]));

    // and it is put away again on the far side
    for (let i = 0; i < 3600 && state().rockFall > 0; i++) run(1 / 60);
    run(1);
    const after = state();
    window.__crew(0, 0);
    window.__clearFloor();
    return [
      ok(falling, 'a rock comes down to be held up by'),
      ok(finite, 'a body that has never been on the rock can still dance',
         ys(shots[0]).join(' ')),
      ok(Math.max(...spread) > 1, 'they do not all wait it out on the same pixel',
         spread.join('/')),
      ok(hopped, 'and they are hopping rather than standing', [...new Set(shots.flatMap(ys))].join(' ')),
      ok(clear, 'without any of them wandering under the rock',
         `${xs(shots[0]).join(' ')} against ${JSON.stringify(zone)}`),
      ok(new Set(hauls(after).map(d => d.split(',')[1])).size === 1,
         'and once the rock is down they are all back on their feet',
         hauls(after).join(' '))
    ];
  }],

  ['the headcount rides on the section as a badge', async () => {
    await hoverBench();
    window.__crew(3, 2, 2, 0, 0);
    await sleep(50);
    const rows = [...shop().children].filter(el => el.dataset.sect);
    const rock = rows.find(el => el.dataset.sect === 'the rock');
    const farm = rows.find(el => el.dataset.sect === 'the farm');
    const rockBadge = rock && rock.querySelector('.badge');
    const farmBadge = farm && farm.querySelector('.badge');
    const s = state();
    return [
      ok(!!rockBadge, 'a section with people under it carries a badge'),
      ok(rockBadge && rockBadge.textContent === String(s.miners),
         'the badge is the bare number, no x and no word', rockBadge && rockBadge.textContent),
      ok(!!farm && !farmBadge, 'a section with nobody has no badge'),
      ok(rockBadge && rockBadge.parentElement === rock, 'the badge is a span inside the heading'),
      ok(rockBadge && rock.firstChild.nodeValue === 'the rock',
         'the heading keeps its own title as plain text', rock.firstChild.nodeValue),
      ok(rockBadge && getComputedStyle(rockBadge).backgroundColor === 'rgb(0, 0, 0)' &&
         getComputedStyle(rockBadge).opacity === '1',
         'the badge is solid black, not dimmed with the rest of the heading',
         rockBadge && `${getComputedStyle(rockBadge).backgroundColor} @ ${getComputedStyle(rockBadge).opacity}`)
    ];
  }],

  // The same badge, on the other board, counting the other thing. A row says
  // what buying it gives you and what it costs, which leaves nowhere to read
  // what you already have -- and kit is the one purchase where that is the whole
  // question: a helmet is worth buying because of how many are already on the
  // rock.
  // A decision about a place is made at the place. The cut and the plots used to
  // be sold from the bench, under headings naming a hole and a field on the far
  // side of the yard: you bought a bench you could not see, priced in a currency
  // that comes out of ground you were not standing on. The lab and the school
  // are buildings you walk to for exactly this reason.
  ['the cut and the plots are bought where they are', async () => {
    window.__reset();
    await settle();
    window.__crew(2, 2);
    window.__grant({ cores: 30, shards: 900, spores: 900 });
    window.__give(500000);
    buildShopFromTest();
    shop().querySelector('[data-key="unlockquarry"]')?.click();
    buildShopFromTest();
    shop().querySelector('[data-key="unlockfarm"]')?.click();
    buildShopFromTest();
    const bench = [...shop().querySelectorAll('[data-key]')].map(b => b.dataset.key);

    // walk to the mouth of the cut
    const s0 = state();
    window.__look(s0.quarryX - 200);
    await sleep(60);
    const [qx, qy] = onScreen(s0.quarryX + s0.quarryW / 2, s0.groundY - 10);
    point('pointermove', qx, qy, 0);
    await sleep(250);
    const atCut = state();
    const cutRows = [...document.querySelectorAll('#quarryshop [data-key]')].map(b => b.dataset.key);
    const deeper = document.querySelector('#quarryshop [data-key="quarrybench"]');
    const wasBenches = state().benches;
    deeper?.click();
    const nowBenches = state().benches;

    // and out to the plots
    window.__look(s0.farmX - 200);
    await sleep(60);
    const [fx, fy] = onScreen(s0.farmX + s0.farmW / 2, s0.groundY - 10);
    point('pointermove', fx, fy, 0);
    await sleep(250);
    const atPlots = state();
    const plotRows = [...document.querySelectorAll('#farmshop [data-key]')].map(b => b.dataset.key);

    await hoverAway();
    window.__look(state().openCamX);
    window.__crew(0, 0);
    return [
      ok(!bench.includes('quarrybench') && !bench.includes('quarrypace') &&
         !bench.includes('farmbed') && !bench.includes('tend'),
         'the bench sells neither of them any more', bench.join(',')),
      ok(atCut.quarryBoardOpen, 'standing at the cut opens its own board'),
      ok(cutRows.join(',') === 'quarrybench,quarrypace',
         'holding how deep it goes and how fast it works', cutRows.join(',')),
      ok(nowBenches === wasBenches + 1, 'and the row on it digs the cut deeper',
         `${wasBenches} -> ${nowBenches}`),
      ok(atPlots.farmBoardOpen, 'and the plots have theirs'),
      ok(plotRows.join(',') === 'farmbed,tend',
         'holding the next plot and how fast a bed comes on', plotRows.join(','))
    ];
  }],

  ['the training grounds count the kit on each stand', async () => {
    window.__crew(2, 2, 2, 2);
    window.__grant({ shards: 60 });
    window.__school({ open: true, breakers: 3, carters: 1, blasters: 0, growers: 0 });
    const s = state();

    // standing at it is what fills its board, the same as the bench
    window.__look(s.schoolX - 200);
    await sleep(60);
    const [sx, sy] = onScreen(s.schoolX + 60, s.groundY - 20);
    point('pointermove', sx, sy, 0);
    await sleep(250);

    const heads = [...document.getElementById('schoolshop').children]
      .filter(el => el.dataset.sect);
    const badge = title => {
      const h = heads.find(el => el.dataset.sect === title);
      return h && h.querySelector('.badge');
    };
    const rock = badge('the rock'), dust = badge('the dust'), quarry = badge('the quarry');

    await hoverAway();
    window.__look(state().openCamX);
    window.__crew(0, 0);
    window.__school({ open: false, breakers: 0, carters: 0 });
    return [
      ok(rock && rock.textContent === '3',
         'a stand with kit on it says how much', rock && rock.textContent),
      ok(dust && dust.textContent === '1',
         'each trade counts its own, not the whole school', dust && dust.textContent),
      ok(!quarry, 'a trade you own none of carries no badge, the way an empty section does not'),
      ok(rock && rock.parentElement.firstChild.nodeValue === 'the rock',
         'and the heading keeps its own title as plain text',
         rock && rock.parentElement.firstChild.nodeValue)
    ];
  }],

  // Three boards slide into the same spot and differ only in their rows, so
  // each one says whose it is. And a board with nothing on it says that too:
  // the school runs out of trades on purpose, and an empty sheet is a bug you
  // have to rule out before you can believe it.
  ['every board says whose it is, even an empty one', async () => {
    const titles = [...document.querySelectorAll('.page .title')].map(t => t.textContent);

    window.__crew(2, 2);
    window.__grant({ shards: 40 });
    // The school sells kit and there is no ceiling on kit, so the way to a board
    // with nothing on it is a board whose rows are not open yet. What is being
    // checked is the sheet, not the school: a board that renders blank is a bug
    // you have to rule out before you can believe it.
    window.__school({ open: false });
    buildShopFromTest();
    const empty = document.getElementById('schoolshop');
    const emptyText = empty.textContent;
    const emptyRows = empty.querySelectorAll('[data-key]').length;

    window.__school({ open: true });
    buildShopFromTest();
    const back = document.getElementById('schoolshop').querySelectorAll('[data-key]').length;
    window.__crew(0, 0);
    window.__school({ open: false });
    return [
      ok(titles.join('|') === 'the bench|the lab|the training grounds|the house|' +
                              'the quarry|the farm|the scrubbing house|the casino',
         'each board carries its own name', titles.join('|')),
      ok(emptyRows === 0 && emptyText.trim().length > 0,
         'a board with no rows says so instead of standing there blank', emptyText),
      ok(back > 0, 'and the rows come back once the place is built', `${back}`)
    ];
  }],

  // Every price on a board is a mark and a number, and what you *had* of that
  // mark was only ever written over the pit -- the other end of the yard, in the
  // corner of the window, and as often as not behind the board itself.
  // This went missing for a while and nobody noticed. The three lines that
  // opened the bench board, the lab board and the tooltip became one call that
  // opened a board, and the tooltip went with them -- the words, the element and
  // the styling all still there, and nothing reaching them. A board opens
  // because you walked up to a station; a tooltip opens because you went and
  // looked at a mark. This check is the difference between those two.
  ['a stopped station says why when you look at it', async () => {
    const tip = document.getElementById('tip');
    const hover = async (wx, wy) => {
      window.__look(wx - 380);
      await sleep(60);
      const [x, y] = onScreen(wx, wy);
      point('pointermove', x, y, 0);
      await sleep(140);
      return tip.hidden ? null : tip.textContent;
    };

    // a full pile at the rock
    window.__crew(4, 0);
    window.__clearFloor();
    const strip = state().piles.find(q => q.key === 'rock');
    for (let pass = 0; pass < 4 && !state().pileFull.rock; pass++) {
      for (let x = strip.from + P; x < strip.to - P; x += P) window.__pile(x, 20);
      run(1);
    }
    runUntil(() => state().pileFull.rock, 60);
    const onMark = await hover(state().rockX, state().groundY + P * 7);
    const away = await hover(state().rockX - 300, state().groundY - P * 20);

    // and a full hole
    window.__crew(0, 0);
    window.__clearFloor();
    window.__tip(state().pitCapacity * 2);
    run(1);
    const s = state();
    const onPit = await hover(s.pitX - P * 5, s.groundY - P * 7);

    window.__spend(state().stored);
    await hoverAway();
    window.__look(state().openCamX);
    return [
      ok(onMark === 'pile is full', 'the mark over a stopped station says so',
         String(onMark)),
      ok(away === null, 'and only where the mark is', String(away)),
      ok(s.pitFull && onPit === 'the hole is full',
         'the hole owes the same explanation, and gives it', String(onPit))
    ];
  }],

  ['the boards say what you have to spend with', async () => {
    await hoverBench();
    const purse = document.getElementById('purse');
    const marks = () => [...purse.querySelectorAll('.coin i')].map(i => i.className);

    // What has been seen depends on how far the checks before this one got the
    // yard, so the rule is checked against the game rather than against a
    // guess: the purse shows exactly the currencies you have seen, in order.
    const s0 = state();
    const want = ['dust', s0.seenCore && 'core', s0.seenShard && 'shard',
                  s0.seenSpore && 'spore'].filter(Boolean);
    const early = marks();
    window.__grant({ shards: 5, spores: 2 });
    await sleep(80);
    const later = marks();
    const shown = [...purse.querySelectorAll('.coin b')].map(b => b.textContent);
    const s = state();

    // beside the board, and on the left of it
    const box = purse.getBoundingClientRect();
    const sheet = document.querySelector('.panel .sheet').getBoundingClientRect();
    await hoverAway();
    return [
      ok(early.join(',') === want.join(','),
         'it shows exactly the currencies you have seen, and no others',
         `${early.join(',')} vs ${want.join(',')}`),
      ok(later.includes('shard') && later.includes('spore'),
         'and one you have appears', later.join(',')),
      ok(shown[0] === fmt(s.stored), 'the numbers are what you actually hold',
         `${shown[0]} vs ${s.stored}`),
      ok(box.right <= sheet.left + 1, 'it floats off the left of the board',
         `purse ends ${Math.round(box.right)}, board starts ${Math.round(sheet.left)}`),
      ok(box.width > 0 && box.height > 0, 'and it is actually on screen',
         `${Math.round(box.width)}x${Math.round(box.height)}`)
    ];
  }],

  ['the opening view is looking at the rock', async () => {
    window.__jump(12);
    await sleep(300);
    const s = state();
    const left = (s.rockX - s.rockW / 2 - s.camX) * s.zoom;
    const right = (s.rockX + s.rockW / 2 - s.camX) * s.zoom;
    let deskFits = false, deskShowsBench = false;
    await asScreen(1440, 900, 1, () => {
      const d = state();
      deskFits = (d.rockX - d.rockW / 2 - d.camX) * d.zoom >= 0 &&
                 (d.pitX - d.camX) * d.zoom < 1440;
      deskShowsBench = d.benchX >= d.openCamX;
    });
    window.__jump(1);
    return [
      ok(left >= 0, 'the last rock is not cut off on the left', `${Math.round(left)}px in`),
      ok(right < innerWidth, 'and you can see the whole of it',
         `ends at ${Math.round(right)} of ${innerWidth}`),
      // The bench and the shacks stand off the rock's far flank, and a window
      // with the room for them opens wide enough to show them. A narrow one
      // does not, and must not: the rock wins every time.
      ok(deskShowsBench, 'a desk-sized window opens on the bench as well'),
      // it no longer has to fit every window, but it has to fit a desk
      ok(deskFits, 'a desk-sized window shows the rock and the pit lip at once')
    ];
  }],

  // A shard is a grain of dust as far as the ground and the hand are concerned:
  // it is swept up with everything else, rides the cursor, and is thrown the
  // same way. It costs carrying room, because it is one grain of your load.
  ['a shard is swept up and thrown like anything else', async () => {
    window.__crew(0, 0);
    window.__clearFloor();
    // A hole worth throwing at. A scrape is 150 across and a thrown grain
    // carries most of a window: aiming one into a fresh pit is a check about
    // marksmanship, and this one is about what the grain counts as when it
    // lands.
    window.__dig();
    run(0.5);
    const s0 = state();
    // The strip in front of the rock, because the throw has to be watched as
    // well as the sweep: a shard dropped at the far end of the yard is a shard
    // and the lip of the pit in two different windows, and the release point
    // would be off the side of the screen -- which is a throw nobody could make
    // and not what this check is about.
    const p = s0.piles.find(q => q.key === 'rock');
    window.__toss('shard', p.from + 60);
    run(3);
    const lying = state();
    const mine = lying.findAll.map(t => t.split(',').map(Number))
                              .filter(a => a[0] > p.from && a[0] < p.to);

    const [sx, sy] = onScreen(mine[0][0], s0.groundY - mine[0][1]);
    point('pointerdown', sx, sy);
    for (let i = 0; i < 4; i++) { point('pointermove', sx, sy); await sleep(20); }
    const inHand = state();

    const [px, py] = onScreen(s0.pitX + 40, s0.groundY - 120);
    for (let i = 1; i <= 6; i++) {
      point('pointermove', sx + (px - sx) * i / 6, sy + (py - sy) * i / 6);
      await sleep(16);
    }
    point('pointerup', px, py);
    run(4);
    const after = state();
    return [
      ok(mine.length === 1, 'a shard is lying there to start with'),
      ok(inHand.held > 0, 'sweeping over it lifts it like any other grain',
         `${inHand.held} in hand`),
      ok(after.shards > lying.shards, 'and thrown into the pit it counts as a shard',
         `${lying.shards} -> ${after.shards}`)
    ];
  }],

  // Your pick and a miner's are two different tools. One row that bought both
  // was doing two jobs, and it sat under `you` while half of it was on the rock.
  ['your pick and a miner bite are bought apart', async () => {
    window.__crew(1, 0);
    // Yours is cut stone and theirs is what they are fed on: no core buys a
    // rate any more, they open places.
    window.__grant({ shards: 200, spores: 200 });
    await hoverBench();
    const before = state();
    const gotBite = await buy('minerpick');
    const mid = state();
    const gotPick = await buy('pick');
    const after = state();
    window.__crew(0, 0);
    return [
      ok(gotBite, 'the rock has a bite row of its own'),
      ok(mid.minerPickLevel === before.minerPickLevel + 1, 'buying it moves the miners',
         `${before.minerPickLevel} -> ${mid.minerPickLevel}`),
      ok(mid.pickLevel === before.pickLevel, 'and leaves your own pick alone',
         `${before.pickLevel} -> ${mid.pickLevel}`),
      ok(gotPick && after.pickLevel === mid.pickLevel + 1, 'your pick still buys your own swing',
         `${mid.pickLevel} -> ${after.pickLevel}`),
      ok(after.minerPickLevel === mid.minerPickLevel, 'and not theirs',
         `${mid.minerPickLevel} -> ${after.minerPickLevel}`)
    ];
  }],

  ['a cell is a whole number of device pixels', async () => {
    const checks = [];
    for (const [w, h, dpr] of [[2560, 1300, 1], [1440, 900, 2], [390, 844, 3], [412, 915, 2.6]]) {
      await asScreen(w, h, dpr, () => {
        const s = state();
        const cell = s.cellDevicePx;
        checks.push(ok(Math.abs(cell - Math.round(cell)) < 1e-6,
          `${w}x${h} at ${dpr}x lands on whole device pixels`, `${cell} device px a cell`));
      });
    }
    return checks;
  }],

  // The picture never shrinks to fit. A cell is a cell whatever you are looking
  // at this on, so a narrow window shows less of the yard rather than a smaller
  // one: what a small screen owes you is the rock and somewhere to put the dust,
  // not the whole works at once.
  ['a small window shows less, not smaller', async () => {
    const checks = [];
    const zoomWas = state().zoom;               // whatever the game is drawn at
    for (const [w, h, dpr, name] of [[390, 844, 3, 'portrait'], [844, 390, 3, 'landscape'],
                                     [412, 915, 2.6, 'android'], [768, 1024, 2, 'tablet']]) {
      await asScreen(w, h, dpr, () => {
        const s = state();
        const rockLeft = (s.rockX - s.rockW / 2 - s.camX) * s.zoom;
        const rockRight = (s.rockX + s.rockW / 2 - s.camX) * s.zoom;
        checks.push(ok(Math.abs(s.zoom - zoomWas) < 1e-9,
          `${name} draws at the same size as everywhere else`, `zoom ${s.zoom}`));
        checks.push(ok(rockRight > 0 && rockLeft < w, `${name} is looking at the rock`,
          `rock ${Math.round(rockLeft)}..${Math.round(rockRight)} of ${w}`));
      });
    }
    return checks;
  }],

  ['two fingers drag the view', async () => {
    const before = state();
    finger('pointerdown', 1, 300, 300);
    finger('pointerdown', 2, 400, 300);
    for (let i = 1; i <= 8; i++) {
      finger('pointermove', 1, 300 - i * 12, 300);
      finger('pointermove', 2, 400 - i * 12, 300);
      await sleep(16);
    }
    finger('pointerup', 1, 204, 300);
    finger('pointerup', 2, 304, 300);
    await sleep(100);
    const after = state();
    return [
      ok(after.camX > before.camX, 'the view moves with the fingers',
         `${before.camX} -> ${after.camX}`),
      ok(!after.dragging, 'and it is not left mid-sweep'),
      ok(after.held === before.held, 'a pan does not sweep dust up',
         `${before.held} -> ${after.held}`)
    ];
  }],

  ['a tap opens the board, because there is no hovering', async () => {
    // Start from closed, whatever an earlier check left behind. The far corner
    // of the window rather than the near one: a board holds itself open over the
    // whole wedge between it and its station now, and the top-left of the screen
    // is somewhere that wedge can reach.
    const away = state();
    canvas().dispatchEvent(new PointerEvent('pointermove', {
      clientX: away.W - 4, clientY: away.H - 4,
      pointerId: 1, isPrimary: true, buttons: 0, bubbles: true }));
    await sleep(150);
    const startedClosed = board().hidden;

    await haveBench();
    const s = state();
    const at = (wx, wy) => [(wx - s.camX) * s.zoom, (wy - s.camY) * s.zoom];

    const [bx, by] = at(s.benchX + 20, s.groundY - 24);
    finger('pointerdown', 9, bx, by); await sleep(40); finger('pointerup', 9, bx, by);
    await sleep(150);
    const opened = !board().hidden;

    const [ax, ay] = at(s.benchX + 420, s.groundY - 200);
    finger('pointerdown', 9, ax, ay); await sleep(40); finger('pointerup', 9, ax, ay);
    await sleep(150);
    const closed = board().hidden;

    return [
      ok(startedClosed, 'the board is out of the way to begin with'),
      ok(opened, 'a tap on the bench opens it'),
      ok(closed, 'a tap away puts it back')
    ];
  }],

  ['the board stays on screen, however small it is', async () => {
    await haveBench();
    window.__crew(4, 3);                     // every row showing: the tallest it gets
    await sleep(250);
    const checks = [];
    for (const [w, h, dpr, name] of [[390, 844, 3, 'portrait'], [844, 390, 3, 'landscape'],
                                     [320, 568, 2, 'a small old phone']]) {
      await asScreen(w, h, dpr, async () => {
        const el = panel();
        el.hidden = false;
        board().hidden = false;
        window.__placeBoard();
        await sleep(60);
        // the window is not really this size, so read what placeBoard wrote
        // rather than where the browser drew it
        // it is placed with a transform now, so that is where its corner is
        const m = /translate3d\(([-\d.]+)px, ([-\d.]+)px/.exec(el.style.transform) || [0, 0, 0];
        const left = +m[1], top = +m[2];
        // the board's own size comes from CSS, which follows the real window and
        // not the pretend one, so only require it to be tucked in where it fits
        const bw = el.offsetWidth, bh = el.offsetHeight;
        const bottom = h - top - bh;
        const room = bw <= w && bh <= h;
        checks.push(ok(left >= 0 && bottom >= 0 &&
                       (!room || (left + bw <= w + 1 && bottom + bh <= h + 1)),
          `${name} keeps the whole board inside the window`,
          `${Math.round(left)}+${bw} wide, ${Math.round(bottom)}+${bh} tall, in ${w}x${h}`));
        el.hidden = true;
      });
    }
    window.__crew(0, 0);
    return checks;
  }],

  ['mining leaves dust on the ground', async () => {
    haveRock();                                // something to swing at
    const before = state().floor;
    const b = boulderWorld();
    const [x, y] = onScreen(b.x, b.y);
    for (let i = 0; i < 12; i++) { point('pointerdown', x, y); point('pointerup', x, y); run(0.05); }
    // Long enough for the last chip off the last swing to land. Turned by hand,
    // so it is however long the arc takes and not however long the check felt
    // like sitting there.
    runUntil(() => state().chips === 0, 20);
    const after = state();
    return [
      ok(after.floor > before, 'dust lands on the floor', `${before} -> ${after.floor}`),
      ok(after.chips === 0, 'nothing is left stuck in the air', `${after.chips} in flight`)
    ];
  }],

  ['dust thrown in the pit counts, and spending takes it back', async () => {
    const start = state();
    window.__give(500);
    await sleep(300);
    const filled = state();
    const cost = 8;
    const bought = await buy('carry');
    await sleep(300);
    const spent = state();
    return [
      ok(filled.stored === start.stored + 500, 'the hole counts what goes in',
         `${start.stored} -> ${filled.stored}`),
      ok(filled.pitGrains > start.pitGrains, 'and the pile grows with it'),
      ok(bought, 'carry can be bought'),
      ok(spent.stored === filled.stored - cost, 'buying comes out of the hole',
         `${filled.stored} -> ${spent.stored}`),
      ok(spent.pitGrains < filled.pitGrains, 'and the pile shrinks with it',
         `${filled.pitGrains} -> ${spent.pitGrains}`)
    ];
  }],

  ['paying flies the dust to the bench', async () => {
    window.__give(600);
    await sleep(300);
    await hoverBench();
    const before = state();
    await buy('carry');
    await sleep(120);
    const mid = state();
    await sleep(2000);
    const after = state();
    return [
      ok(mid.paid > 0, 'dust leaves the pit when you pay', `${mid.paid} in flight`),
      ok(after.paid === 0, 'and all of it reaches the bench', `${after.paid} left over`),
      ok(after.pitGrains < before.pitGrains, 'the pile is smaller for it')
    ];
  }],

  ['the counter runs to its value', async () => {
    const before = state().shown;
    window.__give(2000);
    await sleep(80);
    const mid = state().shown;
    await sleep(1500);
    const settled = state();
    return [
      ok(mid > before && mid < settled.stored, 'it eases rather than snapping',
         `${before} -> ${mid} -> ${settled.shown}`),
      ok(settled.shown === settled.stored, 'and lands on the number',
         `${settled.shown} vs ${settled.stored}`)
    ];
  }],

  ['a core can be carried and banked', async () => {
    const before = state().cores;
    const banked = await bankCore();
    const after = state();
    return [
      ok(banked, 'the core reaches the pit'),
      ok(after.cores === before + 1, 'and is counted', `${before} -> ${after.cores}`),
      ok(after.seenCore, 'core rows are unlocked in the shop')
    ];
  }],

  // One pool of bodies: you buy a worker, and where it works is a separate
  // question you can answer again at any time.
  ['a worker put on the rock works it', async () => {
    haveRock();
    // The first body is not bought -- it is the one left standing when the rock
    // came down, and a fresh game starts with it on the rock (see intro.js). An
    // earlier check will have cleared the yard, so it is put back by hand.
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
      ok(start.miners === 1, 'and it is digging, which is why it is here',
         `${start.miners} mining`),
      ok(off && carrying.miners === 0 && carrying.haulers === 1,
         'the roster takes it off, and then it carries dust',
         `${carrying.miners} mining, ${carrying.haulers} carrying`),
      ok(moved, 'the rock has a roster under it to put it back on'),
      ok(after.miners === 1 && after.haulers === 0, 'now it is on the rock and not carrying',
         `${after.miners} mining, ${after.haulers} carrying`),
      ok(after.crew === 1, 'and it is the same body, not a second hire', `${after.crew}`),
      ok(after.rock < before.rock, 'rock is coming off', `${before.rock} -> ${after.rock}`)
    ];
  }],

  ['a worker can be taken off a job again', async () => {
    window.__crew(1, 0);                        // one body, on the rock
    await hoverBench();
    const on = state();
    const back = await put('mine', 'less');
    await sleep(200);
    const off = state();
    const tooMany = await put('mine', 'more') && await put('mine', 'more');
    const capped = state();
    window.__crew(0, 0);
    return [
      ok(on.miners === 1 && on.idle === 0, 'it starts on the rock', `${on.miners} mining`),
      ok(back, 'the roster lets it go'),
      ok(off.miners === 0 && off.haulers === 1, 'and it goes back to carrying dust',
         `${off.miners} mining, ${off.haulers} carrying`),
      ok(!tooMany, 'a body it does not have cannot be put anywhere'),
      ok(capped.miners + capped.haulers === capped.crew,
         'the crew always adds up', `${capped.miners}+${capped.haulers} of ${capped.crew}`)
    ];
  }],

  ['the lab smokes while it is being worked', async () => {
    window.__grant({ shards: 20, cores: 9 });
    window.__lab(true);
    window.__crew(0, 2);
    run(1);
    const idle = state();

    document.querySelector('#labshop button[data-key]').click();
    await sleep(120);
    run(3);
    const paidButEmpty = state();

    window.__assign('labbers', 1);
    window.__assign('labbers', 1);
    runUntil(() => state().commuting.length === 0, 90);   // they walk there now
    run(4);
    const worked = state();
    window.__crew(0, 0);
    window.__abandon();                          // do not leave it in flight
    return [
      ok(idle.smoke === 0, 'an idle lab does not smoke', `${idle.smoke}`),
      ok(paidButEmpty.smoke === 0, 'nor does one that is paid for and empty',
         `${paidButEmpty.smoke}`),
      ok(worked.smoke > 0, 'it smokes once somebody is in there on it',
         `${worked.smoke} puffs`),
      ok(worked.crewDetail.filter(d => d.startsWith('l|in')).length === 2,
         'and they are inside it, not standing about in front',
         JSON.stringify(worked.crewDetail.filter(d => d[0] === 'l')))
    ];
  }],

  // The one thing in the sky you can touch. It is worth a few grains, and the
  // grains are not thrown anywhere: they drop from where the bird was and land
  // on whatever ground is under it.
  ['a bird can be startled, and drops a little dust', async () => {
    window.__crew(0, 0, 0, 0);                   // nobody to fetch it while we watch
    window.__clearFloor();
    run(1);
    const clear = state().floor;
    const bank = state().stored;
    window.__birds();
    const s = state();
    const bird = s.sky.birdWorld[0];
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

  ['research is started with shards and finished with people', async () => {
    window.__abandon();                          // whatever ran before us
    window.__crew(0, 3);
    window.__lab(true);
    window.__grant({ shards: 60, spores: 60 });
    run(1);

    const el = document.getElementById('lab');
    const s = state();
    const at = (wx, wy) => [(wx - s.camX) * s.zoom, (wy - s.camY) * s.zoom];
    const [lx, ly] = at(s.labX + 20, s.groundY - 30);
    canvas().dispatchEvent(new PointerEvent('pointermove', {
      clientX: lx, clientY: ly, pointerId: 1, isPrimary: true, buttons: 0, bubbles: true }));
    await sleep(200);

    const opened = !el.hidden;
    const before = state();
    const swing = el.querySelector('button[data-key="labswing"]');
    const rows = el.querySelectorAll('button[data-key]').length;

    swing.click();                               // start it, do not buy it
    await sleep(120);
    const started = state();

    run(12);                                     // and leave the lab empty
    const empty = state();

    window.__assign('labbers', 1);
    window.__assign('labbers', 1);
    runUntil(() => state().commuting.length === 0, 90);   // they walk there now
    run(5);
    const part = state();
    run(40);
    const after = state();
    window.__crew(0, 0);
    return [
      ok(opened, 'the lab board opens at the lab'),
      ok(rows >= 4, 'and offers what it can research', `${rows} rows`),
      ok(!!started.research, 'clicking one starts it rather than buying it',
         JSON.stringify(started.research)),
      ok(started.shards < before.shards, 'and it is paid for up front',
         `${before.shards} -> ${started.shards}`),
      ok(started.mult.swing === before.mult.swing,
         'the multiplier does not move on paying', `${started.mult.swing}`),
      ok(empty.research && empty.research.at === 0,
         'an empty lab gets no work done at all',
         `${empty.research && empty.research.at}`),
      ok(part.labbers === 2 && part.research && part.research.at > 0.15,
         'two bodies in it and it moves', `${part.research && part.research.at}`),
      ok(!after.research && after.mult.swing === before.mult.swing + 1,
         'and finishing it is what raises the multiplier',
         `${before.mult.swing} -> ${after.mult.swing}`),
      ok(after.mineMs < before.mineMs, 'which really is a faster swing',
         `${before.mineMs}ms -> ${after.mineMs}ms`)
    ];
  }],

  // The crew are inside the lab and the chimney goes out the moment they are
  // done, so the end of a piece of research is the one thing here you would
  // otherwise miss entirely. It leaves a mark standing over the lab, and the
  // mark comes down when the board it belongs to is read.
  ['a finished piece of research says so over the lab', async () => {
    const point_ = (x, y) => canvas().dispatchEvent(new PointerEvent('pointermove', {
      clientX: x, clientY: y, pointerId: 1, isPrimary: true, buttons: 0, bubbles: true }));
    const away = () => point_(4, 4);             // nobody standing at any station
    const atLab = () => {
      const s = state();
      point_((s.labX + 20 - s.camX) * s.zoom, (s.groundY - 30 - s.camY) * s.zoom);
    };

    window.__abandon();
    window.__crew(0, 3);
    window.__lab(true);
    window.__grant({ shards: 60, spores: 60 });
    run(1);

    atLab();                                     // go and stand at it
    await sleep(220);

    const el = document.getElementById('lab');
    const more = el.querySelector('.job[data-job="labcrew"] .more');
    more.click(); more.click();
    const staffed = state();

    el.querySelector('button[data-key="labswing"]').click();
    await sleep(140);
    const started = state();

    away();                                      // and walk off while they work
    await sleep(220);
    const finished = runUntil(() => !state().research, 120);
    const done = state();

    atLab();
    await sleep(220);
    const read = state();

    window.__crew(0, 0);
    window.__abandon();
    away();
    await sleep(160);
    return [
      ok(staffed.labbers === 2, 'the lab board puts bodies in the lab itself',
         `${staffed.labbers}`),
      ok(!!started.research && started.labDone === null,
         'and starting a piece leaves nothing to report yet',
         JSON.stringify(started.research)),
      ok(finished, 'two bodies see it through'),
      ok(!done.research && done.labDone === 'labswing',
         'a finished piece is remembered rather than just vanishing',
         `${done.labDone}`),
      ok(done.smoke > 0, 'and the chimney gives it one last plume', `${done.smoke}`),
      ok(read.labDone === null, 'reading the board is what takes the mark down',
         `${read.labDone}`)
    ];
  }],

  ['the lab board stays inside the window too', async () => {
    const checks = [];
    for (const [w, h, dpr, name] of [[390, 844, 3, 'portrait'], [844, 390, 3, 'landscape']]) {
      await asScreen(w, h, dpr, async () => {
        // the geometry is the one container's; the lab is a page inside it
        const el = panel();
        el.hidden = false;
        document.getElementById('lab').hidden = false;
        document.getElementById('board').hidden = true;
        window.__placeBoard();
        await sleep(60);
        // it is placed with a transform, so that is where its corner is
        const m = /translate3d\(([-\d.]+)px, ([-\d.]+)px/.exec(el.style.transform) || [0, 0, 0];
        const left = +m[1], top = +m[2];
        const bw = el.offsetWidth, bh = el.offsetHeight;
        const bottom = h - top - bh;
        const room = bw <= w && bh <= h;
        checks.push(ok(left >= 0 && bottom >= 0 &&
                       (!room || (left + bw <= w + 1 && bottom + bh <= h + 1)),
          `${name} keeps the lab board inside the window`,
          `${Math.round(left)}+${bw} wide, ${Math.round(bottom)}+${bh} tall, in ${w}x${h}`));
      });
    }
    document.getElementById('lab').hidden = true;
    return checks;
  }],

  ['the places are revealed one at a time', async () => {
    const rows = () => [...shop().querySelectorAll('button')].map(b => b.dataset.key);
    const has = k => rows().includes(k);

    window.__reset();
    await settle();
    const fresh = rows();

    window.__grant({ cores: 4 });
    await sleep(150);
    const withCore = { quarry: has('unlockquarry'), farm: has('unlockfarm'),
                       lab: has('unlocklab') };

    window.__crew(1, 1, 1);                  // the quarry open
    await sleep(150);
    const withCave = { farm: has('unlockfarm'), lab: has('unlocklab') };

    window.__grant({ shards: 3 });
    await sleep(150);
    const withShard = { lab: has('unlocklab') };

    window.__lab(true);
    await sleep(150);

    window.__crew(0, 0);
    return [
      ok(!fresh.includes('pick') && !fresh.includes('unlockquarry'),
         'a fresh game offers nothing about cores or places', fresh.join(' ')),
      ok(withCore.quarry && !withCore.farm && !withCore.lab,
         'the first core offers the quarry, and only the quarry',
         JSON.stringify(withCore)),
      ok(withCave.farm && !withCave.lab, 'opening the quarry offers the farm'),
      ok(withShard.lab, 'a shard in hand offers the lab')
    ];
  }],

  // A site is bought with cores and then paid for by itself. What the quarry
  // gives up takes the cut down another bench, and what the beds give up breaks
  // another bed -- and a bench and a bed are each a place for one body, so the
  // thing the site's own currency buys first is room for somebody to work it.
  ['the quarry and the farm grow on what they give up', async () => {
    window.__reset();
    await settle();
    window.__levels({ benchLevel: 0, bedLevel: 0 });
    S_open();
    window.__crew(0, 10);
    const start = state();
    // every hand in the yard, and only so many of them fit
    for (let i = 0; i < 6; i++) window.__assign('quarriers', 1);
    for (let i = 0; i < 6; i++) window.__assign('farmhands', 1);
    const packed = state();

    window.__grant({ shards: 40, spores: 40 });
    buildShopFromTest();
    // Each is on the board at its own site now, not on the bench: see
    // 'the cut and the plots are bought where they are'.
    const rows = [...document.querySelectorAll('#quarryshop [data-key], #farmshop [data-key]')]
      .map(b => b.dataset.key);
    const deep = state().quarryH, wide = state().farmW;
    document.querySelector('#quarryshop button[data-key="quarrybench"]').click();
    document.querySelector('#farmshop button[data-key="farmbed"]').click();
    const grown = state();
    window.__assign('quarriers', 1);
    window.__assign('farmhands', 1);
    const after = state();
    window.__crew(0, 0);
    return [
      ok(start.benches === 2 && start.bedCount === 3,
         'a fresh cut holds two and the ground comes with three beds',
         `${start.benches} benches, ${start.bedCount} beds`),
      ok(packed.quarriers === 2 && packed.farmhands === 3,
         'and no more than that can be sent to either',
         `${packed.quarriers} down, ${packed.farmhands} at the beds`),
      ok(rows.includes('quarrybench') && rows.includes('farmbed'),
         'both are on their own board the moment the place is open', rows.join(',')),
      ok(grown.quarryH > deep && grown.farmW > wide,
         'buying one takes the cut deeper and the plot wider',
         `${deep}->${grown.quarryH} deep, ${wide}->${grown.farmW} wide`),
      ok(after.quarriers === 3 && after.farmhands === 4,
         'and there is room for one more body at each',
         `${after.quarriers} down, ${after.farmhands} at the beds`)
    ];
  }],

  // The one place in the yard that makes nothing. Everywhere else a thing you
  // buy does something for ever after; this takes what you have and hands some
  // of it back, and the whole of it is a decision you keep making.
  ['the casino takes a stake and pays a pot', async () => {
    window.__reset();
    await settle();
    window.__grant({ cores: 20 });
    window.__give(20000);
    window.__dig(23);                            // room for the winnings
    window.__lab(true);
    buildShopFromTest();
    const before = document.querySelector('#shop button[data-key="unlockcasino"]');
    before.click();
    buildShopFromTest();
    const open = state();

    const casino = () => document.getElementById('casinoshop');
    const row = k => casino().querySelector(`button[data-key="${k}"]`);
    const rows = () => [...casino().querySelectorAll('button[data-key]')].map(b => b.dataset.key);

    // The chips go all the way up to everything you have. Wound back to the
    // smallest first: the dial is a setting and it keeps whatever an earlier
    // check left it on.
    const chips = [];
    const dial = () => casino().querySelector('[data-dial="chip"]');
    for (let i = 0; i < 4; i++) { dial().children[1].click(); buildShopFromTest(); }
    for (let i = 0; i < 4; i++) { chips.push(state().chip); dial().children[3].click(); buildShopFromTest(); }

    // and back down again, to put the smallest one down
    for (let i = 0; i < 4; i++) { dial().children[1].click(); buildShopFromTest(); }
    const held = state().stored;
    const stake = state().stakes.dust;
    row('stakedust').click();
    const down = state();
    run(4);        // the wheel takes its time now, and is meant to
    buildShopFromTest();
    const settled = state();
    const potRows = settled.pot ? rows() : [];

    // Keep at it until both ways round have come up -- and let the yard go quiet
    // between hands. Nothing here is instant any more: the stake trickles down
    // out of the sky, the wheel takes its time, and banking is the whole pot
    // flying across the works to the hole. A check that reads the counter while
    // half of it is still in the air is a check reading a number mid-throw.
    const quiet = () => runUntil(() => state().sparks === 0 && !state().paying &&
                                       !state().spinning, 30);
    let won = null, lost = null;
    for (let i = 0; i < 40 && !(won && lost); i++) {
      if (state().pot) { row('bank').click(); quiet(); buildShopFromTest(); }
      quiet();
      const b = state().stored;
      row('stakedust').click();
      quiet();
      buildShopFromTest();
      const p = state().pot;
      const hand = state().hand;
      if (p) {
        row('bank').click();
        quiet();
        buildShopFromTest();
        won = { net: state().stored - b, said: hand && hand.won };
      } else lost = { net: state().stored - b, said: hand && hand.won === false };
    }
    window.__reset();
    await sleep(300);
    return [
      ok(open.casinoOpen, 'cores build it, out past the lab',
         `${open.casinoX} vs lab ${open.labX}`),
      ok(open.casinoX < open.labX, 'and it is the last thing on the ground'),
      ok(chips.join(',') === '10,100,1000,all in',
         'the chips run from ten to everything you have', chips.join(',')),
      ok(down.stored === held - stake,
         'a stake comes out of your hands', `${held} - ${stake} -> ${down.stored}`),
      ok(down.spinning, 'and putting it down is the spin: one gesture, not two'),
      ok(!settled.pot || potRows.join(',') === 'bank,ride',
         'a table with a pot on it offers two decisions and no stakes',
         potRows.join(',')),
      ok(won && won.net === stake, 'a win doubles the stake, so banking it clears it',
         won && `${won.net} net on ${stake}`),
      ok(lost && lost.net === -stake, 'and a loss is the stake, and nothing else',
         lost && `${lost.net} net on ${stake}`),
      ok(won && won.said && lost && lost.said,
         'and the yard says which way each one went')
    ];
  }],

  // A spin is the one moment in this game you are meant to sit and watch, so the
  // board gets out of the light, the wheel takes its time, and what is on the
  // table is a heap on the ground rather than a number on a row.
  ['a spin is something to watch', async () => {
    window.__reset();
    await settle();
    window.__grant({ cores: 20 });
    window.__give(20000);
    window.__dig(23);
    window.__lab(true);
    buildShopFromTest();
    document.querySelector('#shop button[data-key="unlockcasino"]').click();
    buildShopFromTest();
    // stand at it, so there is a board in the way to get out of the way
    const s0 = state();
    window.__look(s0.casinoX - 200);
    run(0.5);

    const row = k => document.getElementById('casinoshop').querySelector(`button[data-key="${k}"]`);
    row('stakedust').click();
    const t0 = state();
    run(0.6);
    const early = state();
    run(1.2);
    const late = state();
    run(3);
    const done = state();

    // and again until it comes off, to see the heap and the shower
    let win = null;
    for (let i = 0; i < 30 && !win; i++) {
      buildShopFromTest();
      if (state().pot) { row('bank').click(); run(0.5); buildShopFromTest(); }
      row('stakedust').click();
      run(4);
      buildShopFromTest();
      if (state().pot) win = state();
    }
    window.__reset();
    await sleep(300);
    return [
      ok(t0.spinning, 'the wheel is going the moment the chip goes down'),
      ok(early.wheel !== late.wheel, 'and it is actually turning',
         `${early.wheel} -> ${late.wheel}`),
      ok(!done.spinning, 'and it comes to rest on its own'),
      ok(win && win.pot && win.pot.on > 0 && win.potAt > win.casinoX,
         'what is on the table is a heap on the ground beside the building',
         win && `${win.pot.on} at ${win.potAt}, building at ${win.casinoX}`),
      ok(win && (win.sparks > 0 || win.table > 0),
         'and it trickles down out of the sky on to it',
         win && `${win.sparks} in the air, ${win.table} down`),
      ok(win && win.hand && win.hand.won, 'with a mark to say so')
    ];
  }],

  // The pot is a real bed of sand, not a drawing of one: one grain, one of
  // whatever was staked, settled by the same code the yard and the hole use. A
  // thousand on the table is a thousand grains lying there.
  ['the pot is a real pile, grain for grain', async () => {
    window.__reset();
    await settle();
    window.__grant({ cores: 20 });
    window.__give(30000);
    window.__dig(23);
    window.__lab(true);
    buildShopFromTest();
    document.querySelector('#shop button[data-key="unlockcasino"]').click();
    buildShopFromTest();
    const row = k => document.getElementById('casinoshop').querySelector(`button[data-key="${k}"]`);
    const dial = () => document.getElementById('casinoshop').querySelector('[data-dial="chip"]');

    dial().children[3].click(); buildShopFromTest();     // a hundred, so the heap is worth looking at
    const stake = state().stakes.dust;
    row('stakedust').click();
    run(0.5);                                   // the first of it is still falling
    const arriving = state();
    run(8);                                     // and all of it has landed by now
    const settled = state();
    const on = settled.pot ? settled.pot.on : 0;

    // and it leaves the same way, a grain at a time and fading as it goes
    if (settled.pot) { row('bank').click(); run(0.4); }
    const leaving = state();
    run(4);
    const gone = state();
    window.__reset();
    await sleep(300);
    return [
      ok(arriving.table < stake && arriving.table + arriving.sparks > 0,
         'it arrives a grain at a time rather than appearing',
         `${arriving.table} of ${stake} down, ${arriving.sparks} still falling`),
      ok(arriving.sparks > 0, 'trickling out of the sky', `${arriving.sparks} in the air`),
      ok(settled.table === on, 'and it is the pot, grain for grain',
         `${settled.table} grains, ${on} on the table`),
      ok(leaving.sparks > 0 || gone.table === 0,
         'and when it goes it lifts off rather than blinking out'),
      ok(gone.table === 0, 'until the ground is bare again', `${gone.table} left`)
    ];
  }],

  // Nothing here is a number moving from one counter to another. The pot is sand
  // at the far end of the yard and the hole is at the other, so banking is the
  // whole of it going over -- and every grain that leaves the heap is a grain
  // the hole counts when it lands.
  ['banking flies the pot to the hole, grain for grain', async () => {
    window.__reset();
    await settle();
    window.__grant({ cores: 20 });
    window.__give(30000);
    window.__dig(23);
    window.__lab(true);
    buildShopFromTest();
    document.querySelector('#shop button[data-key="unlockcasino"]').click();
    buildShopFromTest();
    const row = k => document.getElementById('casinoshop').querySelector(`button[data-key="${k}"]`);
    const dial = () => document.getElementById('casinoshop').querySelector('[data-dial="chip"]');
    const quiet = () => runUntil(() => state().sparks === 0 && !state().paying &&
                                       !state().spinning, 30);

    dial().children[3].click(); buildShopFromTest();
    let win = null;
    for (let i = 0; i < 30 && !win; i++) {
      quiet();
      buildShopFromTest();
      if (state().pot) { row('bank').click(); quiet(); buildShopFromTest(); }
      row('stakedust').click();
      quiet();
      buildShopFromTest();
      if (state().pot) win = state();
    }
    const held = state().stored;
    const on = win ? win.pot.on : 0;
    row('bank').click();
    run(0.6);
    const flying = state();
    quiet();
    const landed = state();
    window.__reset();
    await sleep(300);
    return [
      ok(!!win && on > 0, 'there is a pot to take', `${on}`),
      ok(flying.sparks > 0 && flying.paying !== null,
         'taking it puts the whole heap in the air',
         `${flying.sparks} flying, ${flying.paying} still to go`),
      ok(flying.stored < held + on,
         'and the counter does not move until it gets there',
         `${flying.stored} vs ${held + on}`),
      ok(landed.stored === held + on, 'every grain that set off is counted when it lands',
         `${held} + ${on} -> ${landed.stored}`),
      ok(landed.table === 0 && landed.sparks === 0,
         'and nothing is left behind', `${landed.table} on the ground`)
    ];
  }],

  // The lab empties itself when there is nothing to research. That is the game
  // tidying up after you, and making you go and undo it before anything can
  // happen is a chore rather than a decision.
  ['starting research calls back whoever the lab let out', async () => {
    window.__reset();
    await settle();
    window.__lab(true);
    window.__crew(0, 3, 0, 0, 2);                // two of the five in the lab
    window.__grant({ shards: 50 });
    run(3);
    const staffed = state();
    run(40);                                     // long enough for them to drift off
    const empty = state();
    buildShopFromTest();
    document.querySelector('#labshop button[data-key="labswing"]').click();
    run(1);
    const back = state();
    window.__abandon();
    window.__crew(0, 0);
    return [
      ok(staffed.labbers === 2, 'two are put in the lab', `${staffed.labbers}`),
      ok(empty.labbers < 2, 'with nothing to work on they let themselves out',
         `${empty.labbers} left in`),
      ok(back.labbers === 2, 'and starting a piece of research calls them back',
         `${back.labbers} back in`),
      ok(!!back.research, 'with the work actually started', JSON.stringify(back.research))
    ];
  }],

  // Picking somebody up moves them and does nothing else. It is the right
  // button because the left one is the whole game -- swinging, sweeping,
  // catching -- and a body is eighteen pixels walking about on top of the dust
  // you are trying to sweep.
  ['a body can be picked up, and walks back to work', async () => {
    window.__reset();
    await settle();
    window.__crew(2, 2);
    window.__clearFloor();
    run(30);
    const s = state();
    const m = state().workerPos.find(p => p[0] === 'm').split(':')[1].split(',').map(Number);
    const scr = (wx, wy) => [(wx - state().camX) * s.zoom, (wy - state().camY) * s.zoom];

    // hovering one says who it is
    point('pointermove', ...scr(m[0] + 9, m[1] + 9), 0);
    const tipEl = document.getElementById('tip');
    const said = tipEl.hidden ? '' : tipEl.textContent;

    // the right button picks it up
    point('pointerdown', ...scr(m[0] + 9, m[1] + 9), 2, 2);
    const up = state();
    const away = [s.rockX - 700, s.groundY - 200];
    point('pointermove', ...scr(...away), 2, -1);
    const carried = state();
    const heldCard = document.getElementById('tip');
    const heldSaid = heldCard.hidden ? '' : heldCard.textContent;
    point('pointerup', ...scr(...away), 0, 2);
    run(0.2);
    const put = state();
    run(20);
    const home = state();
    window.__crew(0, 0);
    return [
      ok(said.split(String.fromCharCode(10)).length === 7 && said.includes('mining the rock'),
         'hovering one says who it is and what it does, a row at a time',
         JSON.stringify(said)),
      ok(/^mined {5}/m.test(said) && /^quarried {2}/m.test(said) && /^stored {4}/m.test(said),
         'one line per site, all lined up in a column', JSON.stringify(said)),
      ok(!/^carrying/m.test(said), 'and a miner is not asked what it is carrying',
         JSON.stringify(said)),
      ok(!!up.lifted, 'the right button picks it up', `${up.lifted}`),
      ok(heldSaid.startsWith(up.lifted), 'and it keeps saying who it is while you hold it',
         JSON.stringify(heldSaid.slice(0, 40))),
      ok(up.rock === s.rock, 'and does not swing at what it was standing on'),
      // whichever miner is on the cursor, not whichever is first in the list:
      // there are two of them and the order they are stored in is not a fact
      // about which one you picked up
      ok(carried.workerPos.some(p => p[0] === 'm' &&
           Math.abs(+p.split(':')[1].split(',')[0] - away[0]) < 30),
         'it goes where the cursor goes',
         `${carried.workerPos.filter(p => p[0] === 'm')} want ${Math.round(away[0])}`),
      ok(put.falling === 1, 'let go, it falls rather than being lowered', `${put.falling}`),
      ok(!put.lifted && put.miners === s.miners,
         'putting it down leaves everybody on the job they were on',
         `${s.miners} -> ${put.miners}`),
      ok(Math.abs(+home.workerPos.find(p => p[0] === 'm').split(':')[1].split(',')[0] - s.rockX) < s.rockW,
         'and it walks back to what it was doing',
         home.workerPos.find(p => p[0] === 'm'))
    ];
  }],

  // Put down where it already works, there is nothing to walk to, so it should
  // not walk: the commute that gets a body home from the far end of the yard is
  // exactly the wrong thing when you have just set it on its own rock.
  ['a body dropped on its own station gets straight back to it', async () => {
    window.__reset();
    await settle();
    window.__crew(1, 0);
    window.__clearFloor();
    run(30);
    const s = state();
    const scr = (wx, wy) => [(wx - s.camX) * s.zoom, (wy - s.camY) * s.zoom];
    const m = s.workerPos.find(p => p[0] === 'm').split(':')[1].split(',').map(Number);
    point('pointerdown', ...scr(m[0] + 9, m[1] + 9), 2, 2);
    // straight up in the air over the rock, then let go
    const over = [s.rockX + s.rockW / 2, s.groundY - 260];
    point('pointermove', ...scr(...over), 2, -1);
    point('pointerup', ...scr(...over), 0, 2);
    const let_go = state();
    run(0.35);
    const air = state();
    run(4);
    const down = state();
    const near = +down.workerPos.find(p => p[0] === 'm').split(':')[1].split(',')[1];
    window.__crew(0, 0);
    return [
      ok(let_go.falling === 1, 'let go over its own rock, it is in the air', `${let_go.falling}`),
      ok(+air.workerPos.find(p => p[0] === 'm').split(':')[1].split(',')[1] > over[1],
         'and it is coming down', air.workerPos.find(p => p[0] === 'm')),
      ok(down.falling === 0 && near < s.groundY + 40, 'it lands', `${down.falling}, ${near}`),
      ok(down.miners === s.miners, 'still a miner', `${s.miners} -> ${down.miners}`)
    ];
  }],

  // A body put down on the rock should be standing on the rock, not standing on
  // the ground under it and then appearing on top a frame later.
  ['a body dropped on the rock lands on the rock and climbs from there', async () => {
    window.__reset();
    await settle();
    window.__crew(1, 1);
    window.__give(400);
    // wait for the hauler to actually have something in its hands, so the drop
    // below is a drop of a loaded body rather than an empty one
    const laden = () => state().crewDetail.find(d => d[0] === 'h' && !/\|c0\|/.test(d));
    runUntil(() => laden(), 40);
    const s = state();
    const carriedBefore = +(laden() || '').split('|')[3].slice(1) || 0;
    const scr = (wx, wy) => [(wx - s.camX) * s.zoom, (wy - s.camY) * s.zoom];
    // the hauler, so its card is the one that says what it is carrying
    const h = s.workerPos.find(p => p[0] === 'h').split(':')[1].split(',').map(Number);
    point('pointermove', ...scr(h[0] + 9, h[1] + 9), 0);
    const tipEl = document.getElementById('tip');
    const hauled = tipEl.hidden ? '' : tipEl.textContent;

    // Two drops from the same height: one over bare ground, one over the middle
    // of the rock. What the ground one lands at is what "fell to the ground"
    // means here, so the rock one can be measured against it rather than against
    // a number picked out of the air.
    const sky = s.groundY - 400;
    // Carried to a spot and *put down* there, which since bodies became throwable
    // means coming to a stop before letting go: a hand still travelling throws,
    // and this check is about where a body lands, not about how far it can be
    // flung. Two moves to the same place, a beat apart, is a hand at rest.
    const dropAt = async (tag, wx) => {
      const w = state().workerPos.find(p => p[0] === tag).split(':')[1].split(',').map(Number);
      point('pointerdown', ...scr(w[0] + 9, w[1] + 9), 2, 2);
      point('pointermove', ...scr(wx, sky), 2, -1);
      await sleep(180);
      point('pointermove', ...scr(wx, sky), 2, -1);
      await sleep(180);
      point('pointerup', ...scr(wx, sky), 0, 2);
      for (let i = 0; i < 80; i++) {
        run(0.1);
        if (!state().falling)
          return +state().workerPos.find(p => p[0] === tag).split(':')[1].split(',')[1];
      }
      return null;
    };
    const ground = await dropAt('h', s.rockX - 500);
    const carriedAfter = +(state().crewDetail.find(d => d[0] === 'h') || '|||c0').split('|')[3].slice(1);
    const landed = await dropAt('m', s.rockX + s.rockW / 2);
    window.__crew(0, 0);
    return [
      ok(/^carrying {2}(nothing|[■▲⬢◯] \d)/m.test(hauled),
         'a body whose job is carrying says what it has, kind by kind',
         JSON.stringify(hauled)),
      // a body that fell to the ground stands exactly at `standOn(groundY)`; on
      // the rock it stands higher, however low the rock has been worked
      ok(carriedBefore > 0 && carriedAfter === carriedBefore,
         'and picking one up and putting it down does not empty its hands',
         `${carriedBefore} -> ${carriedAfter}`),
      ok(landed != null && landed < ground - 1,
         'and one dropped over the rock stops on the rock, not on the ground under it',
         `${landed} vs ${ground} on the ground`)
    ];
  }],

  // A hire has always *been* a room -- the settlement is drawn straight off the
  // headcount -- so the bench selling "workers" from the far end of the yard was
  // the shop describing something the houses were already doing. You put the
  // next one up where it goes up.
  ['another house is bought where the houses are', async () => {
    window.__reset();
    await settle();
    window.__crew(2, 2);
    window.__give(100000);
    run(20);
    buildShopFromTest();
    const onBench = !!shop().querySelector('[data-key="worker"]') ||
                    !!shop().querySelector('[data-key="house"]');

    const s = state();
    const h = s.houses;
    const mid = (h.left + h.right) / 2;
    window.__look(mid - 600);
    await sleep(120);
    const [hx, hy] = onScreen(mid, h.top + 20);
    point('pointermove', hx, hy, 0);
    await sleep(160);

    const before = state();
    const row = document.querySelector('#crewshop button[data-key="house"]');
    row?.click();
    await sleep(60);
    run(1);
    const after = state();
    window.__crew(0, 0);
    return [
      ok(!onBench, 'the bench does not sell people any more'),
      ok(!!row, 'the house board does'),
      ok(before.houseRow && /^another house/.test(before.houseRow),
         'and the row is a house rather than a headcount', before.houseRow),
      ok(before.houseRow && before.houseRow.includes('+1'),
         'saying what it gives you, like every other row', before.houseRow),
      ok(after.crew === before.crew + 1, 'buying one takes somebody on',
         `${before.crew} -> ${after.crew}`),
      ok(after.stored < before.stored, 'and it is paid for in dust',
         `${before.stored} -> ${after.stored}`),
      ok(after.houses.cubes > before.houses.cubes,
         'and the block has another room standing in it',
         `${before.houses.cubes} -> ${after.houses.cubes}`)
    ];
  }],

  // The house is the one board that sells nothing. Standing at it lists who
  // lives there, where each of them is right now, and what each has done.
  ['the house lists who lives there', async () => {
    window.__reset();
    await settle();
    window.__crew(2, 2);
    run(60);
    const s = state();
    const h = s.houses;
    const mid = (h.left + h.right) / 2;
    window.__look(mid - 600);
    await sleep(120);
    const [hx, hy] = onScreen(mid, h.top + 20);
    point('pointermove', hx, hy, 0);
    await sleep(120);
    const open = state();
    // the first *person*: the board's other row is the one thing it sells
    const row = document.querySelector('#crewshop button[data-key^="who"]');
    if (row) {
      const r = row.getBoundingClientRect();
      row.dispatchEvent(new PointerEvent('pointerenter',
        { clientX: r.left + 2, clientY: r.top + 2, bubbles: true }));
    }
    const tipEl = document.getElementById('tip');
    const said = tipEl.hidden ? '' : tipEl.textContent;
    const names = state().crewNames.split(' ').map(w => w.split('|')[0]);

    // clicking a name says which one it is, for a few seconds and no longer
    row?.click();
    const picked = state();
    // A body walks. The view is asked where it is now rather than where it was
    // standing when the row was clicked, so a couple of seconds of yard later
    // the two of them are still together.
    run(2);
    const kept = state();
    run(5);
    const gone = state();
    window.__crew(0, 0);
    return [
      ok(open.houseBoardOpen, 'standing at the house opens it', `${open.houseBoardOpen}`),
      ok(open.crewRows.length === 4, 'one row per body', `${open.crewRows.length} rows`),
      ok(open.crewRows.every(r => names.some(n => r.startsWith(n))),
         'and every row is somebody by name', JSON.stringify(open.crewRows)),
      ok(open.crewRows.some(r => r.includes('on the rock')) &&
         open.crewRows.some(r => r.includes('at the pit')),
         'saying where that body is standing, not what its job is called',
         JSON.stringify(open.crewRows)),
      ok(/^mined {5}/m.test(said) && said.split(String.fromCharCode(10)).length >= 6,
         'and hovering one gives that body its whole card', JSON.stringify(said)),
      ok(picked.pointed.length === 1 && open.crewRows[0].startsWith(picked.pointed[0]),
         'and clicking one puts an arrow over that body, so you can find it',
         JSON.stringify(picked.pointed)),
      ok(gone.pointed.length === 0, 'which goes away on its own a few seconds later',
         JSON.stringify(gone.pointed)),
      ok(kept.follows === picked.pointed[0] && Math.abs(kept.followOff) < 120,
         'and the view walks with them while the arrow is up, rather than to where they were',
         `${kept.follows} ${kept.followOff}px off centre`),
      ok(gone.follows === null, 'and lets go of them when the arrow does',
         `${gone.follows}`),
      ok(open.crewRows.every(r => !r.includes('undefined')),
         'and no row has a body the board cannot place',
         JSON.stringify(open.crewRows))
    ];
  }],

  // A board is seated by the height it was measured at, and buying something
  // takes its row off the board -- so the height it was measured at is no
  // longer the height it is. It has to measure itself again, or the sheet
  // stands where a board of some other size would have stood.
  ['a board that gains or loses a row is seated by its new size', async () => {
    window.__reset();
    await settle();
    await hoverBench();
    window.__give(400);
    run(0.5);
    await sleep(80);
    const rows = shop().querySelectorAll('[data-key]').length;
    const row = shop().querySelector('[data-key="auto"]');
    row?.click();
    run(0.5);
    await sleep(80);
    const fit = window.__boardFit();
    const r = panel().getBoundingClientRect();
    const left = shop().querySelectorAll('[data-key]').length;
    return [
      ok(!!row && left !== rows, 'buying a row changes what is on the board',
         `${rows} -> ${left} rows`),
      ok(Math.abs(fit.h - fit.realH) < 2 && Math.abs(fit.w - fit.realW) < 2,
         'and the board is seated by the size it is now, not the size it was',
         `seated ${fit.w}x${fit.h}, really ${fit.realW}x${fit.realH}`),
      ok(r.top >= 0 && r.bottom <= innerHeight && r.left >= 0 && r.right <= innerWidth,
         'so it is still inside the window', JSON.stringify(r))
    ];
  }],

  // The problem, then the diagnosis, then the cure. The rain has to have come
  // down once, and the lab has to have been told to watch the sky, before the
  // yard will sell you anything to do about it.
  ['the scrubbing house is offered after the rain and the readout', async () => {
    window.__reset();
    await settle();
    window.__crew(4, 4);
    window.__grant({ cores: 9, spores: 40 });
    window.__lab(true);
    const has = () => { buildShopFromTest(); return !!shop().querySelector('[data-key="unlockscrub"]'); };

    run(2);
    const clean = has();

    // it has rained, and nobody has looked into why
    window.__air({ haze: state().smog.at + 1 });
    runUntil(() => state().smog.rains > 0, 30);
    run(20);
    const rained = has();

    // and now the lab is told to watch it
    window.__research('labair');
    const both = has();
    const air = state().smog;
    window.__crew(0, 0);
    window.__air({ haze: 0, muck: 0 });
    window.__clearFloor();
    return [
      ok(!clean, 'a yard that has never been rained on is offered nothing', `${clean}`),
      ok(!rained, 'and a yard that has been rained on but never looked into it, nothing either',
         `${air.rains} rains, row ${rained}`),
      ok(both, 'the readout is what opens it', `${both}`),
      ok(air.rains > 0, 'and it took a real rain to get there', `${air.rains}`)
    ];
  }],

  // The one row in the game that is a reading rather than a purchase. It sits on
  // a board of things you press, so the only way to say it is not one of them is
  // to give up everything that says it is.
  ['the pollution reading is not a button', async () => {
    window.__reset();
    await settle();
    window.__crew(4, 4);
    window.__grant({ cores: 9, spores: 40 });
    window.__lab(true);
    window.__air({ haze: state().smog.at + 1 });
    runUntil(() => state().smog.rains > 0, 30);
    run(20);
    window.__research('labair');
    buildShopFromTest();
    shop().querySelector('[data-key="unlockscrub"]').click();
    buildShopFromTest();

    const row = document.getElementById('scrubshop').querySelector('[data-key="airrate"]');
    // Read either side of the click with no clock in between: the sky fills on
    // its own, so a run() here would show the yard working and prove nothing.
    const before = state().smog.haze;
    row?.click();                                // nothing is hung on it to fire
    const after = state().smog.haze;
    const buy = document.getElementById('scrubshop')
                        .querySelector('[data-key]:not([data-key="airrate"])');

    window.__crew(0, 0);
    window.__air({ haze: 0, muck: 0 });
    window.__clearFloor();
    return [
      ok(!!row, 'the sky has a row on the house board'),
      ok(row && row.classList.contains('stat'),
         'and it is marked as a reading rather than a purchase'),
      ok(row && getComputedStyle(row).cursor === 'default',
         'the cursor does not change over it', row && getComputedStyle(row).cursor),
      ok(row && !row.disabled,
         'it is not dimmed either: a reading is live, it is just not for pressing'),
      ok(after === before, 'and pressing it does nothing at all', `${before} -> ${after}`),
      ok(!buy || getComputedStyle(buy).cursor === 'pointer',
         'while a real row on the same board still offers itself',
         buy && getComputedStyle(buy).cursor)
    ];
  }],

  // Space stops the clock. Not a flag every system checks -- the clock simply
  // does not advance, so nothing in the yard can tell the difference.
  ['space holds the whole yard still', async () => {
    window.__reset();
    await settle();
    window.__crew(2, 2);
    run(20);
    const before = state();
    dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true }));
    const held = state();
    // read now, not at the end: by then the test has pressed resume
    const sheetUp = !document.getElementById('held').hidden;
    run(30);
    const still = state();
    document.getElementById('resume').click();
    const sheetGone = document.getElementById('held').hidden;
    run(20);
    const after = state();
    window.__crew(0, 0);
    return [
      ok(held.paused && sheetUp,
         'space holds it, and says so in the middle of the window',
         `${held.paused}, ${sheetUp}`),
      ok(still.workerPos.join() === held.workerPos.join(),
         'and nobody moves a pixel while it is held'),
      ok(!after.paused && sheetGone, 'and the resume button lets it go again',
         `${after.paused}, ${sheetGone}`),
      ok(after.workerPos.join() !== still.workerPos.join(),
         'and everybody carries on from exactly where they stopped')
    ];
  }],

  // The board opens because the cursor is at a station and it stands above that
  // station, so getting to it means crossing bare canvas that is neither. Aim
  // for a row in the far corner of the sheet and the diagonal used to take you
  // out of the station's patch of ground before it took you into the board.
  ['the board does not shut on the way to it', async () => {
    window.__reset();
    await settle();
    window.__crew(2, 2);
    window.__give(400);
    run(2);
    const panel = document.getElementById('panel');
    // looking at the bench, which is where you are when you walk up to it: the
    // board is clamped inside the window and the station is not, so a station
    // scrolled off the side is a different geometry entirely
    window.__look(state().benchX - 200);
    run(0.2);
    const s = state();
    const move = (cx, cy) => { point('pointermove', cx, cy, 0); return state().boardOpen; };

    const bx = (s.benchX + 20 - s.camX) * s.zoom, by = (s.groundY - 30 - s.camY) * s.zoom;
    const opened = move(bx, by);
    const r = panel.getBoundingClientRect();

    // the whole diagonal from the station to the far bottom corner of the sheet
    const far = { x: r.x + r.width - 6, y: r.y + r.height - 6 };
    let heldOn = true;
    for (let i = 1; i <= 12; i++) {
      const k = i / 12;
      if (!move(bx + (far.x - bx) * k, by + (far.y - by) * k)) heldOn = false;
    }
    const corner = state().boardOpen;

    // and it still shuts when you actually walk away
    move(bx, by);
    const aside = move(r.x + r.width + 400, by);
    move(bx, by);
    const below = move(bx, by + 200);
    move(s.W - 4, 4);                           // and out of the way for the next check
    await hoverAway();
    window.__crew(0, 0);
    return [
      ok(opened, 'standing at the bench opens it'),
      ok(heldOn, 'and every step of the way to its far corner keeps it open'),
      ok(corner, 'including the corner itself'),
      ok(!aside, 'well off to one side still shuts it',
         `panel ${Math.round(r.x)},${Math.round(r.y)} ${Math.round(r.width)}x${Math.round(r.height)} ` +
         `bench ${Math.round(bx)},${Math.round(by)} probe ${Math.round(r.x + r.width + 400)}`),
      ok(!below, 'and so does walking off below it')
    ];
  }],

  // The yard is one canvas, so nothing drawn in it carries a cursor of its own
  // the way a button on a page does. Half the things on screen do something when
  // you click them, and without this none of them say so.
  ['the cursor says what a thing will do', async () => {
    window.__reset();
    await settle();
    window.__crew(2, 2);
    window.__give(400);
    run(2);
    const canvasEl = canvas();
    const at = (wx, wy) => {
      const s = state();
      point('pointermove', (wx - s.camX) * s.zoom, (wy - s.camY) * s.zoom, 0);
      return canvasEl.style.cursor;
    };
    const s0 = state();
    const r = s0.roster.find(x => x.job === 'miners');
    // Below the ground line and well clear of everything: the sky is where the
    // birds are, and a bird under the cursor is a thing you can click.
    const sky = at(s0.rockX - 900, s0.groundY + 300);
    const rock = at(s0.rockX, s0.rockY);
    const bench = at(s0.benchX + 20, s0.groundY - 30);
    const minus = at(r.less[0], r.less[1]);

    // a loose core is the one thing in this yard you pick up yourself
    window.__next();
    run(3);
    const k = state().coreItem;
    const core = k ? at(k.x + 9, k.y + 9) : null;

    // and a mark that would tell you why something has stopped
    window.__give(100000);
    run(2);
    const full = state();
    const warn = at(full.pitX - 30, full.groundY - 42);
    window.__crew(0, 0);
    window.__reset();
    await sleep(300);
    return [
      ok(sky === 'crosshair' && rock === 'crosshair',
         'the ground state is aiming at a rock', `${sky} / ${rock}`),
      ok(bench === 'pointer', 'a place with a board on it is a thing to open', bench),
      ok(minus === 'pointer', 'and so are the counts under a station', minus),
      // and the target is a good deal bigger than the mark you aim at: the mark
      // is a bar in a slot four cells square, and there is no box round it to
      // say where the edge is, so the edge is generous instead
      ok(r.hitW >= 36 && r.hitH >= 48, 'with a target well past the mark itself',
         `${r.hitW}x${r.hitH} for an 18x2 mark`),
      ok(at(r.less[0], r.less[1] - 16) === 'pointer' &&
         at(r.less[0] - 16, r.less[1]) === 'pointer',
         'so a near miss still lands on it'),
      ok(at((r.less[0] + r.more[0]) / 2, r.less[1]) !== 'pointer',
         'and the count between them is still not a button'),
      ok(core === 'grab', 'a loose core is a thing to pick up', `${core}`),
      ok(full.pitFull && warn === 'help',
         'and a mark that says why something stopped is a thing to ask', warn)
    ];
  }],

];

// the quarry and the beds, opened without paying for them
function S_open() {
  window.__crew(0, 0, 1, 1);      // opens both places
  window.__crew(0, 0);
  window.__levels({ benchLevel: 0, bedLevel: 0 });
}

// `__test('quarry')` runs only the groups whose name says quarry. The whole suite is
// two minutes; one group is seconds, which is the difference between checking a
// change and putting off checking it.
// `__test()` runs the lot. `__test('casino')` runs one corner of it. `__test('',
// {i, n})` runs every nth group starting at i, which is how `tools/test.mjs`
// splits the suite across as many browsers as the machine has room for.
// Every group starts from a new game.
//
// It did not use to. The suite was one long narrative -- the opening first, and
// a dozen groups afterwards leaning on the yard a neighbour had left behind --
// which meant a group could only be run where it sat, a failure could belong to
// any of the groups above it, and the whole thing could not be split across more
// than a handful of browsers without breaking.
//
// A reset is half a second of game and costs nothing, and with it every group is
// a check you can run on its own. `{ solo: false }` is kept for one purpose: to
// watch what the suite used to do.
export async function runTests(filter = '', shard = null, opts = {}) {
  const solo = opts.solo !== false;
  const errs = [];
  const onErr = e => errs.push(String(e.message || e));
  addEventListener('error', onErr);

  window.__reset();                                            // known state
  await sleep(600);

  const results = [];
  const timing = [];
  // Cut into blocks, in file order, rather than dealt out round-robin.
  //
  // Round-robin balances the slow groups better and was tried first. It also
  // shuffles the order, and the order is not decoration here: the opening runs
  // first because it is the only group that can watch the game open, and a dozen
  // others lean on the yard a neighbour left behind. Dealt out, sixteen checks
  // failed that pass in sequence. A block keeps everybody next to the group they
  // were written next to.
  const all = TESTS.filter(([name]) =>
    !filter || name.toLowerCase().includes(filter.toLowerCase()));
  const per = shard ? Math.ceil(all.length / shard.n) : all.length;
  const wanted = shard ? all.slice(shard.i * per, (shard.i + 1) * per) : all;
  for (const [name, fn] of wanted) {
    let checks;
    if (solo) { window.__reset(); await settle(0.5); }
    const t0 = performance.now();
    try {
      checks = await fn();
    } catch (e) {
      checks = [{ pass: false, what: 'threw', detail: String(e && e.stack || e) }];
    }
    timing.push([name, Math.round(performance.now() - t0)]);
    for (const c of checks) results.push({ ...c, group: name });
  }
  timing.sort((a, b) => b[1] - a[1]);
  removeEventListener('error', onErr);

  const failed = results.filter(r => !r.pass);
  console.log(`%c${results.length - failed.length}/${results.length} checks passed`,
              `font-weight:bold;color:${failed.length ? '#b00' : '#070'}`);
  for (const f of failed) console.warn(`FAIL  ${f.group}: ${f.what}${f.detail ? ` — ${f.detail}` : ''}`);
  if (errs.length) console.warn('errors during run:', errs);

  return {
    passed: results.length - failed.length,
    total: results.length,
    seconds: Math.round(timing.reduce((n, t) => n + t[1], 0) / 1000),
    cost: { sleptMs: Math.round(SLEPT), sleeps: SLEEPS,
            steppedMs: Math.round(STEPPED), frames: FRAMES, runs: RUNS,
            statedMs: Math.round(STATED), states: STATES },
    slowest: timing.slice(0, 8).map(([n, ms]) => `${(ms / 1000).toFixed(1)}s ${n}`),
    failures: failed.map(f => `${f.group}: ${f.what}${f.detail ? ` — ${f.detail}` : ''}`),
    errors: errs
  };
}

window.__test = runTests;
window.__groups = () => TESTS.map(([name]) => name);
