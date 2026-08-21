// A self-test you can run in the browser: open the game and call __test() in the
// console. It drives the game through the same dev hooks the console has, and
// checks the things that have broken before.
//
// It resets the save first, so run it on a game you do not mind losing.

const sleep = ms => new Promise(r => setTimeout(r, ms));
const state = () => window.__state();

function ok(cond, what, detail = '') {
  if (cond) return { pass: true, what };
  return { pass: false, what, detail };
}

const WORKER = 18;                             // a worker square, for tolerances
const canvas = () => document.getElementById('c');
const board = () => document.getElementById('board');
const shop = () => document.getElementById('shop');

const point = (type, x, y, buttons = 1) =>
  canvas().dispatchEvent(new PointerEvent(type, {
    clientX: x, clientY: y, pointerId: 1, isPrimary: true,
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

// bank one core the long way round: finish the rock, wait for the core to roll
// clear of it, carry it, throw it in
// The crew take five when a rock is finished and the next one comes down out of
// the sky after them, so between rocks there is a stretch with nothing to mine.
// A check that wants a rock has to wait for one.
// Run the yard forward without waiting for it: `__fast(20)` is twenty seconds of
// game in a few milliseconds, and the same twenty seconds every time it is run.
// A check that sleeps and hopes passes on a fast machine and fails on a slow
// one; a check that turns the handle a fixed number of times does not.
const run = (seconds) => window.__fast(seconds);

// Run until something is true, a second of game at a time, up to a limit. The
// limit is in game seconds, not real ones, so it is a fact about the game
// rather than about the machine.
function runUntil(done, limit = 60) {
  for (let i = 0; i < limit; i++) {
    window.__fast(1);
    if (done()) return true;
  }
  return false;
}

// Checks that are about *what* a worker does should not sit through *how long*
// it takes. There are checks of their own for pace and for the length of a walk.
function quickCrew() {
  window.__levels({ haulPaceLevel: 20, haulCarryLevel: 4, cavePaceLevel: 10, tendLevel: 10 });
}

function haveRock() {
  return runUntil(() => {
    const s = state();
    return s.rock > 0 && !s.rockFall && !s.dancing;
  }, 30);
}

async function bankCore() {
  window.__next();                             // the last of the rock goes
  for (let i = 0; i < 60 && !state().coreItem?.rest; i++) await sleep(100);
  const k = state().coreItem;
  if (!k) return false;

  const [kx, ky] = onScreen(k.x + 9, k.y + 9);
  point('pointerdown', kx, ky);
  await sleep(60);
  const s = state();
  const [tx, ty] = onScreen(s.pitX + s.pitW * 0.2, s.groundY - 120);
  for (let i = 1; i <= 8; i++) {
    point('pointermove', kx + (tx - kx) * i / 8, ky + (ty - ky) * i / 8);
    await sleep(16);
  }
  await sleep(200);
  point('pointerup', tx, ty);
  for (let i = 0; i < 40; i++) {
    await sleep(100);
    if (!state().coreItem && !state().heldCore) { haveRock(); return true; }
  }
  return false;
}

// a job row: click the more or the less beside its count
const put = async (key, which) => {
  const b = shop().querySelector(`.job[data-job="${key}"] .${which}`);
  if (!b || b.disabled) return false;
  b.click();
  await sleep(150);
  return true;
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
    const pitFloorFromBottom = innerHeight - onScreen(0, s.groundY + s.pitRows * 6)[1];
    const groundFromBottom = innerHeight - onScreen(0, s.groundY)[1];
    const expected = (s.pitRows * 6 + 12) * s.zoom;
    return [
      ok(Math.abs(pitFloorFromBottom - 12 * s.zoom) < 4,
         'pit floor rests on the bottom edge', `${Math.round(pitFloorFromBottom)}px up`),
      ok(Math.abs(groundFromBottom - expected) < 4,
         'ground line is a fixed height above it', `${Math.round(groundFromBottom)} vs ${Math.round(expected)}`)
    ];
  }],

  ['the pit is always the same hole', async () => {
    const s = state();
    return [
      ok(s.pitRows * s.pitGrain === 276, 'the hole is 276 deep whatever the grain',
         `${s.pitRows} x ${s.pitGrain}`),
      ok(s.pitW === 3624, 'and 3624 across', `${s.pitW}`),
      ok(s.pitCapacity === (3624 / s.pitGrain) * (276 / s.pitGrain),
         'capacity follows from the grain', `${s.pitCapacity} at grain ${s.pitGrain}`)
    ];
  }],

  ['dust in the pit is one grain each', async () => {
    const cap = state().pitCapacity;
    window.__give(Math.floor(cap * 0.6));
    await sleep(600);
    const s = state();
    return [
      ok(s.pitGrain === 6, 'a grain in the pile is the same size as dust anywhere else',
         `${s.pitGrain}px`),
      ok(s.stored === s.pitDust, 'every dust counted is a grain in the pile',
         `${s.stored} counted, ${s.pitDust} in the pit`),
      ok(cap > 20000, 'the hole holds a whole run of mining', `${cap}`)
    ];
  }],

  ['filling the pit past the brim does not break it', async () => {
    const cap = state().pitCapacity;
    window.__give(cap);                        // well past what the hole can show
    await sleep(800);
    const s = state();
    return [
      ok(s.pitDust <= cap, 'the pile stops at the brim', `${s.pitDust} of ${cap}`),
      ok(s.stored > cap, 'and the counter keeps going', `${s.stored}`),
      ok(s.pitGrain === 6, 'the grain does not change under it', `${s.pitGrain}px`)
    ];
  }],

  ['a full pit still saves and reloads', async () => {
    await sleep(1200);
    const raw = localStorage.getItem('boulder-clicker/v4');
    const s = state();
    const j = JSON.parse(raw || 'null');
    return [
      ok(raw.length < 200 * 1024, 'the save stays small', `${Math.round(raw.length / 1024)}KB`),
      ok(j.stored === s.stored, 'the hole is saved', `${j?.stored}`),
      ok(typeof j.pit?.heights === 'string', 'the pile is saved as its profile'),
      ok(j.pitStep === 0, 'and the grain it is drawn at', `${j?.pitStep}`)
    ];
  }],

  ['spending a full pit takes it back out', async () => {
    const before = state();
    window.__spend(Math.floor(before.stored / 2));
    await sleep(600);
    const after = state();
    return [
      ok(after.stored === before.stored - Math.floor(before.stored / 2), 'the counter comes down',
         `${before.stored} -> ${after.stored}`),
      ok(after.pitDust === Math.min(after.stored, after.pitCapacity),
         'and the pile matches what will fit',
         `${after.pitDust} in the pit, ${after.stored} counted, ${after.pitCapacity} room`),
      ok(after.paid > 0, 'dust is seen leaving')
    ];
  }],

  // Finishing a rock is the end of a long job, so it gets a beat: the crew hop
  // about on the bare ground, and only then does the next one come down.
  ['a finished rock is worth a moment', async () => {
    window.__crew(3, 0);
    haveRock();
    window.__next();                          // the last of it goes
    run(0.5);
    const partying = state();
    const feet = partying.workerPos.filter(p => p[0] === 'm').map(p => p.split(',')[1]);
    run(0.7);
    const stillPartying = state();
    const feetNow = stillPartying.workerPos.filter(p => p[0] === 'm').map(p => p.split(',')[1]);
    let sky = 0;
    for (let i = 0; i < 400 && !sky; i++) {    // catch it on its way down
      run(1 / 60);
      if (state().rockFall > 0) sky = state().rockFall;
    }
    const landed = haveRock();
    const after = state();
    window.__crew(0, 0);
    return [
      ok(partying.dancing, 'the crew are dancing the moment the rock is off'),
      ok(stillPartying.rock === 0, 'and the next rock has not turned up yet',
         `${stillPartying.rock} of rock`),
      ok(feet.join() !== feetNow.join(), 'they are off the ground doing it',
         `${feet.join()} then ${feetNow.join()}`),
      ok(sky > 0, 'the next rock comes down out of the sky', `caught it ${sky}px up`),
      ok(landed && after.rockFoot === after.groundY, 'and lands on the ground line',
         `foot ${after.rockFoot}, ground ${after.groundY}`),
      ok(after.apronClear, 'clearing the ground it needs as it lands',
         `${after.apronDust} grains in the apron`)
    ];
  }],

  ['shop opens at the bench and is not buried', async () => {
    await hoverBench();
    const b = board();
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
      ok(cells.length > 0 && cells.every(c => c.length === 5), 'rows are five columns',
         JSON.stringify(cells[0])),
      ok(cells.every(c => c[0] && c[4]), 'every row has a name and a price',
         JSON.stringify(cells))
    ];
  }],

  ['the rock stands on the ground', async () => {
    const s = state();
    return [
      ok(Math.abs(s.rockFoot - s.groundY) <= 18,
         'its foot is at the ground line', `${s.rockFoot - s.groundY} below`),
      ok(s.rockW > s.rockH, 'it is a hill, wider than it is tall', `${s.rockW}x${s.rockH}`),
      ok(s.rockX + s.rockW / 2 < s.benchX, 'it stands clear of the bench',
         `rock ends ${Math.round(s.rockX + s.rockW / 2)}, bench at ${s.benchX}`),
      ok(s.benchX < s.pitX, 'the bench is between the rock and the pit'),
      // the whole working area has to sit in a window at once, at the biggest
      // rock: the meteor is gone, so nothing needs to be pushed out to the left
      ok(s.pitX - (s.rockX - s.rockW / 2) < 1600, 'rock through pit lip is one screenful',
         `${Math.round(s.pitX - (s.rockX - s.rockW / 2))} across`),
      ok(s.benchX - (s.rockX + s.rockW / 2) > 60, 'the rock never grows into the bench',
         `${Math.round(s.benchX - (s.rockX + s.rockW / 2))} clear`),
      ok(s.pitX - s.benchX > 300, 'there is ground to sweep between bench and lip',
         `${Math.round(s.pitX - s.benchX)}`)
    ];
  }],

  // The rock is the only thing drawn a cell at a time, so it is the only thing
  // that seams: two rects sharing an edge on a fraction of a device pixel are
  // each antialiased against the page, and the seam between them comes out grey.
  // The layout picks a whole number of device pixels per cell, and this checks
  // the other half of it -- that the rock's own edges land on that same ladder,
  // at every cell size a window can ask for.
  ['the rock lands on whole device pixels', async () => {
    const s = state();
    const off = v => Math.abs(v - Math.round(v));
    const sizes = [1, 2, 3, 4, 5, 6];                 // device pixels a cell may be
    const rows = sizes.filter(cell => off(s.rockFoot * (cell / 6)) > 1e-9);
    const cols = sizes.filter(cell => off(s.rockLeftX * (cell / 6)) > 1e-9);
    return [
      ok(off(s.cellDevicePx) < 1e-9, 'a cell is a whole number of device pixels',
         `${s.cellDevicePx}`),
      ok(rows.length === 0, 'the rock stands on the device grid at every cell size',
         `seams at ${rows.join(', ')}px a cell`),
      ok(cols.length === 0, 'and its left edge does too',
         `seams at ${cols.join(', ')}px a cell`),
      ok((s.rockW / 6) % 2 === 0, 'the rock is an even number of cells across',
         `${s.rockW / 6} cells`)
    ];
  }],

  ['the opening view is looking at the rock', async () => {
    window.__jump(12);
    await sleep(300);
    const s = state();
    const left = (s.rockX - s.rockW / 2 - s.camX) * s.zoom;
    const right = (s.rockX + s.rockW / 2 - s.camX) * s.zoom;
    let deskFits = false;
    await asScreen(1440, 900, 1, () => {
      const d = state();
      deskFits = (d.rockX - d.rockW / 2 - d.camX) * d.zoom >= 0 &&
                 (d.pitX - d.camX) * d.zoom < 1440;
    });
    window.__jump(1);
    return [
      ok(left >= 0, 'the last rock is not cut off on the left', `${Math.round(left)}px in`),
      ok(right < innerWidth, 'and you can see the whole of it',
         `ends at ${Math.round(right)} of ${innerWidth}`),
      // it no longer has to fit every window, but it has to fit a desk
      ok(deskFits, 'a desk-sized window shows the rock and the pit lip at once')
    ];
  }],

  ['the crew stand on the rock and work it down', async () => {
    window.__crew(5, 0);
    await sleep(1500);
    const s = state();
    const miners = s.workerPos.filter(p => p[0] === 'm')
                              .map(p => p.split(':')[1].split(',').map(Number));
    const foot = s.rockFoot;
    window.__crew(0, 0);                    // put them back on the shelf
    return [
      ok(miners.length === 5, 'five miners are out', `${miners.length}`),
      ok(miners.every(([, y]) => y <= foot), 'nobody is below the ground',
         JSON.stringify(miners)),
      ok(miners.every(([x]) => x > s.rockX - s.rockW / 2 - 24 && x < s.rockX + s.rockW / 2 + 24),
         'they are all on the rock, not orbiting it', JSON.stringify(miners)),
      ok(Math.max(...miners.map(([, y]) => y)) - Math.min(...miners.map(([, y]) => y)) <= 6 * 6,
         'they stand level with each other, because they work a layer',
         JSON.stringify(miners.map(([, y]) => y))),
      ok(new Set(miners.map(([x]) => Math.round(x / 18))).size > 1,
         'and spread out along it rather than stacking up',
         JSON.stringify(miners.map(([x]) => Math.round(x))))
    ];
  }],

  // The last columns of ground sit further right than a worker is allowed to
  // stand, so one that had to be standing on a column to scoop it stood at the
  // lip for ever with the dust a hand's width away.
  // Two ways the yard used to bank dust with nobody carrying it: a heap that
  // reached the lip tipped itself in four cells at a time, and once the ground
  // was full the rest rolled straight into the pit. Both put the haulers out of
  // a job, which is the one thing the ground must never do.
  ['the ground never banks dust by itself', async () => {
    window.__crew(3, 0);
    window.__clearFloor();
    run(1);
    const s = state();
    const before = state().pitDust;
    // heap it at the ledge, far more than the old four-deep topple needed
    for (let i = 0; i < 40; i++) window.__pile(s.pitX - 30, 200);
    run(2);
    const heaped = state();

    // now fill the rock's strip and watch the crew stop rather than the dust roll in
    const strip = () => state().piles.find(q => q.key === 'rock');
    for (let i = 0; i < 200 && !state().pileFull.rock; i++) {
      const p = strip();
      window.__pile(p.from + Math.random() * (p.to - p.from), 80);
      run(0.2);
    }
    const full = state();
    const rockThen = full.rock;
    run(4);
    const stalled = state();
    window.__clearFloor();
    run(2);
    const freed = state();
    const rockFreed = freed.rock;
    run(4);
    const working = state();
    window.__crew(0, 0);
    window.__clearFloor();
    return [
      // a handful is what was already in the air when the ground ran out; in play
      // the crew stop before it can, so nothing is ever homeless
      ok(heaped.pitDust - before <= 20, 'a heap at the ledge does not topple in on its own',
         `${before} -> ${heaped.pitDust} in the pit`),
      ok(full.yardFull, "the rock's pile fills up", `${full.pileCount.rock} grains`),
      ok(stalled.pitDust - before <= 20, 'and nothing rolls in but what was already flying',
         `${stalled.pitDust - before} grains in`),
      ok(stalled.rock === rockThen, 'the crew down tools instead',
         `${rockThen} -> ${stalled.rock} of rock`),
      ok(full.dustAtCave === 0, 'and none of it is heaped over the mouth of the cave',
         `${full.dustAtCave} grains out there`),
      ok(!freed.yardFull, 'clearing the ground puts them back to work'),
      ok(working.rock < rockFreed, 'and the rock starts coming off again',
         `${rockFreed} -> ${working.rock}`)
    ];
  }],

  // Over the hole is in the hole. One landing on top of the ones already in
  // there rests above the ground line, and while the count asked it to be below
  // the line it lay over the mouth uncounted -- where a worker could see it,
  // walk to the lip, and stand there for ever reaching for something the lip
  // would not let it reach. Two workers stuck like that is a yard that has
  // quietly stopped, and it took half the suite runs with it.
  ['nothing is left lying over the mouth of the pit', async () => {
    window.__crew(0, 2);
    quickCrew();
    window.__clearFloor();
    run(0.5);
    const s = state();
    const before = s.shards;
    // drop a dozen straight over the lip, so they land on each other
    for (let i = 0; i < 12; i++) window.__toss('shard', s.pitX + 12);
    run(6);
    const after = state();
    const stranded = after.findPos.filter(p => !p.endsWith('c'));
    window.__crew(0, 0);
    return [
      ok(after.shards === before + 12, 'every one of them is counted',
         `${before} -> ${after.shards}`),
      ok(stranded.length === 0, 'none is left lying over the mouth uncounted',
         JSON.stringify(after.findPos)),
      ok(after.crewDetail.every(d => !d.includes('|h') || d.includes('|h0')),
         'and nobody is stuck at the lip holding one', JSON.stringify(after.crewDetail))
    ];
  }],

  // Two things had to be true before a heap of these looked like a heap. Down
  // is bigger, or a roll asks for a *higher* place beside it and nothing ever
  // rolls. And a resting one stands in a slot one body wide, or they perch on
  // each other at any offset at all and the whole lot reads as a mess.
  // They stopped being grains when they were given bodies, and a hand that could
  // sweep up the dust around a shard but not the shard itself is a hand missing
  // a trick. It is picked up like a core: one thing, not a load, no room needed.
  // Clearing a handful should put somebody back to work, because that is what
  // clearing a handful looks like it ought to do. Any hysteresis at all is a
  // chore: at a twentieth of the limit you had to fetch seventy grains before
  // anybody picked up a pick, and a sweep of the brush lifts about five.
  ['clearing a handful puts the crew back to work', async () => {
    window.__crew(4, 0);
    window.__clearFloor();
    run(0.5);
    // fill it to just under, then let the crew tip it over themselves, so the
    // pile stops where mining stops it rather than where a test dumped it
    const strip = () => state().piles.find(q => q.key === 'rock');
    for (let i = 0; i < 300 && state().pileCount.rock < 1330; i++) {
      const q = strip();
      window.__pile(q.from + Math.random() * (q.to - q.from) * 0.8, 20);
      run(0.1);
    }
    const stopped = runUntil(() => state().pileFull.rock, 60);
    const full = state();
    const rockThen = full.rock;
    run(2);
    const stalled = state();

    const took = window.__take('rock', 6);
    run(0.5);
    const freed = state();
    const rockFreed = freed.rock;
    run(2);
    const working = state();
    window.__crew(0, 0);
    window.__clearFloor();
    return [
      ok(stopped, 'the pile fills and the crew stop', `${full.pileCount.rock} grains`),
      ok(stalled.rock === rockThen, 'and stay stopped', `${rockThen} -> ${stalled.rock}`),
      ok(took === 6, 'six grains come off the pile', `${took}`),
      ok(!freed.pileFull.rock, 'which is enough to make room',
         `${freed.pileCount.rock} grains`),
      ok(working.rock < rockFreed, 'and they are swinging again',
         `${rockFreed} -> ${working.rock}`)
    ];
  }],

  ['a shard can be picked up by hand and thrown', async () => {
    window.__crew(0, 0);
    window.__clearFloor();
    run(0.5);
    const s = state();
    const p = s.piles.find(q => q.key === 'cave');
    window.__toss('shard', p.from + 120);
    run(3);
    const lying = state();
    // the one just tossed, not whichever find happens to be first in the list:
    // by now there are others resting in the pit from earlier checks
    const mine = lying.findAll.map(t => t.split(',').map(Number))
                              .filter(a => a[0] > p.from && a[0] < p.to);
    const at = mine[0];

    // sweep the cursor over it, the way a hand picks up a core
    const [sx, sy] = onScreen(at[0] + 6, s.groundY - at[1] + 6);
    point('pointerdown', sx, sy);
    for (let i = 0; i < 4; i++) { point('pointermove', sx, sy); await sleep(20); }
    const inHand = state();

    // and fling it towards the pit
    const [px, py] = onScreen(s.pitX + 40, s.groundY - 120);
    for (let i = 1; i <= 6; i++) {
      point('pointermove', sx + (px - sx) * i / 6, sy + (py - sy) * i / 6);
      await sleep(16);
    }
    point('pointerup', px, py);
    run(4);
    const after = state();
    return [
      ok(mine.length >= 1, 'a shard is lying there to start with'),
      ok(inHand.heldFinds === 1, 'sweeping over it picks it up',
         `${inHand.heldFinds} in hand`),
      ok(inHand.held === 0, 'and it costs no carrying room', `${inHand.held} of dust`),
      ok(after.heldFinds === 0, 'letting go throws it'),
      ok(after.shards > lying.shards, 'thrown into the pit, it counts',
         `${lying.shards} -> ${after.shards}`)
    ];
  }],

  ['a heap of finds heaps, rather than stacking', async () => {
    window.__crew(0, 0);
    window.__clearFloor();
    run(0.5);
    const p = state().piles.find(q => q.key === 'cave');
    for (let i = 0; i < 30; i++) { window.__toss('shard', p.from + 30); run(0.3); }
    run(10);
    // only the ones dropped here: finds already banked in the pit are still
    // lying in it, and they are none of this check's business
    const at = state().findAll.map(t => t.split(',').map(Number))
                              .filter(a => a[0] > p.from - 40 && a[0] < p.to + 40);
    const xs = at.map(a => a[0]), tall = Math.max(...at.map(a => a[1]));
    const spread = Math.max(...xs) - Math.min(...xs);
    // how far out from the near end of the strip the tallest column stands
    const tops = {};
    for (const [x, h] of at) tops[x] = Math.max(tops[x] || 0, h);
    const near = Math.min(...xs);
    const peak = (+Object.keys(tops).reduce((a, b) => tops[b] > tops[a] ? b : a) - near) / 12;
    window.__clearFloor();
    return [
      ok(at.length === 30, 'all thirty are lying there', `${at.length}`),
      ok(spread > 60, 'they spread out along the ground', `${spread}px across`),
      ok(tall <= 30 * 12 / 3, 'rather than going up in a column',
         `${tall / 12} bodies at the peak`),
      ok(at.every(a => a[1] % 12 === 0), 'and each sits squarely on what is under it',
         JSON.stringify(at.slice(0, 6))),
      // A resting find stands in a slot one body wide, the same as a grain of
      // sand stands in a cell. Without that they perch on each other at any
      // offset at all: two bodies three pixels apart, drawn twelve wide.
      ok(at.every(a => a[0] % 12 === 0), 'every one of them stands in a slot',
         JSON.stringify(at.map(a => a[0]).slice(0, 8))),
      ok(new Set(at.map(a => a.join(','))).size === at.length,
         'and no two are in the same place'),
      ok(at.every(a => at.every(b => a === b || a[0] === b[0] ||
                                     Math.abs(a[0] - b[0]) >= 12)),
         'so none of them overlaps the next'),
      // The same rule the dust keeps: a pile may only rise as it gets away from
      // the station behind it. Without it they went up in a column against the
      // station while the dust beside them sloped away properly.
      ok(peak > 0, 'the heap leans away from the station rather than standing on it',
         `tallest column is ${peak} bodies out from the near end`)
    ];
  }],

  ['a worker can reach dust at the far end of a pile', async () => {
    window.__crew(0, 0);                        // lay it down before anyone can take it
    window.__clearFloor();
    run(0.5);
    const s = state();
    const rock = s.piles.find(p => p.key === 'rock');
    window.__pile(rock.to - 12, 3);             // the last column of the strip
    run(0.5);
    const before = state();
    window.__crew(0, 1);
    quickCrew();
    const cleared = runUntil(() => state().stored > before.stored, 30);
    window.__crew(0, 0);
    return [
      ok(before.floor > 0, 'dust is lying at the far end to start with',
         `${before.floor} grains`),
      ok(cleared, 'a worker gets to it rather than stopping short',
         `${before.floor} still there`)
    ];
  }],

  // Every worker used to work out the same answer to "where is the nearest
  // dust", so a single grain behind the crew turned the whole line round, and
  // turned it round again the moment the first of them picked it up.
  ['workers do not all go for the same grain', async () => {
    window.__crew(0, 3);
    window.__clearFloor();
    run(0.5);
    const s = state();
    for (const at of [0.30, 0.45, 0.60]) window.__pile(s.pitX * at, 90);
    // Watched over a stretch rather than glanced at: a claim only lasts until
    // the column is bare, and a fast crew can clear three small heaps between
    // one look and the next.
    let claims = [], best = 0;
    for (let i = 0; i < 30; i++) {
      run(0.1);
      const now = state().claims.filter(c => c >= 0);
      const spread = new Set(now).size;
      if (spread > best) { best = spread; claims = now; }
    }
    const busy = state();
    window.__crew(0, 0);
    return [
      ok(claims.length >= 2, 'the workers are spread over the piles', JSON.stringify(busy.claims)),
      ok(new Set(claims).size === claims.length, 'no two set off for the same column',
         JSON.stringify(claims)),
      ok(busy.pace.empty > busy.pace.laden, 'and a worker moves quicker with its hands free',
         `${busy.pace.empty} empty, ${busy.pace.laden} laden`)
    ];
  }],

  // Your pick and a miner's are two different tools. One row that bought both
  // was doing two jobs, and it sat under `you` while half of it was on the rock.
  ['your pick and a miner bite are bought apart', async () => {
    window.__crew(1, 0);
    window.__grant({ cores: 12 });
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

  // Every station piles to its right, into a strip of ground of its own, and the
  // strip has a size. A pile that fills stops the station behind it -- that is
  // the whole of the choice the job rows ask, made visible in the yard.
  ['each station piles to its right, and stops when its pile is full', async () => {
    window.__crew(2, 0);
    window.__clearFloor();
    run(1);
    const s = state();
    const order = s.piles.map(p => p.key).join(' ');
    // fill the rock's strip by hand rather than waiting eight minutes for it
    for (let i = 0; i < 200 && !state().pileFull.rock; i++) {
      const p = state().piles.find(q => q.key === 'rock');
      window.__pile(p.from + Math.random() * (p.to - p.from), 60);
      run(0.2);
    }
    const full = state();
    const rockThen = full.rock;
    run(4);
    const stalled = state();
    window.__clearFloor();
    run(2);
    const freed = state();
    const rockFreed = freed.rock;
    run(4);
    const working = state();
    window.__crew(0, 0);
    return [
      ok(order === 'farm cave rock', 'the strips run farm, cave, rock, left to right', order),
      ok(s.piles.every((p, i) => i === 0 || p.from >= s.piles[i - 1].to),
         'and none of them runs into the next', JSON.stringify(s.piles)),
      ok(full.pileFull.rock, "the rock's pile fills", `${full.pileCount.rock} grains`),
      ok(stalled.rock === rockThen, 'and the crew stop working while it is',
         `${rockThen} -> ${stalled.rock} of rock`),
      ok(full.pileMarks.includes('rock'), 'the station says so, under it',
         JSON.stringify(full.pileMarks)),
      ok(!freed.yardFull, 'clearing it puts them back to work'),
      ok(!freed.pileMarks.includes('rock'), 'and the mark comes down with it'),
      ok(working.rock < rockFreed, 'and the rock starts coming off again',
         `${rockFreed} -> ${working.rock}`)
    ];
  }],

  ['a worker can reach the bank behind the rock', async () => {
    // no miners, so nothing new lands while we watch, and only one heap on the
    // ground: the one on the far side of the hill
    window.__crew(0, 1);
    quickCrew();                               // so it walks at a fair clip
    window.__clearFloor();                     // so the only dust is the heap we make
    await sleep(300);
    const s = state();
    const behind = s.rockX - s.rockW / 2 - 60;
    window.__pile(behind, 10);
    await sleep(400);
    const before = state();

    let reached = s.rockX;
    for (let i = 0; i < 150; i++) {
      await sleep(100);
      for (const p of state().workerPos) {
        if (p[0] !== 'h') continue;
        reached = Math.min(reached, +p.split(':')[1].split(',')[0]);
      }
      if (state().dustLeftOfRock < before.dustLeftOfRock) break;
    }
    const after = state();
    window.__crew(0, 0);                    // leave the payroll as we found it
    return [
      ok(before.dustLeftOfRock > 0, 'dust is heaped behind the hill to start with',
         `${before.dustLeftOfRock}`),
      ok(reached <= s.rockX - s.rockW / 2 + WORKER, 'a worker walks past the hill to get to it',
         `got to ${Math.round(reached)}, hill starts ${Math.round(s.rockX - s.rockW / 2)}`),
      ok(after.dustLeftOfRock < before.dustLeftOfRock, 'and starts clearing it',
         `${before.dustLeftOfRock} -> ${after.dustLeftOfRock}`)
    ];
  }],

  ['spoil is aimed, and lands clear of the rock', async () => {
    window.__crew(6, 0);
    run(5);
    const s = state();
    window.__crew(0, 0);
    const right = s.floor - s.dustLeftOfRock - s.dustUnderRock;
    return [
      ok(s.floor > 0, 'dust piles on the ground', `${s.floor}`),
      ok(s.dustUnderRock === 0, 'none of it comes to rest on or under the rock',
         `${s.dustUnderRock} grains`),
      // One pile, on the side the pit is on. Two banks either side meant half
      // the spoil landed on the far side of the hill from everything else.
      ok(right > 0 && s.pileCount.rock > 0, "it all goes into the rock's own pile",
         `${s.pileCount.rock} in the pile, ${right} right of the rock`),
      ok(s.apronClear, 'the ground right beside the rock stays bare',
         `${s.apronDust} grains in the apron`),
      // The apron is a cliff the sand cannot slump over, so without a ceiling on
      // how high a column may stand near it the bank grows straight up against
      // the rock as a sheer wall. It has to lean away instead.
      ok(s.heapAtRock <= 3, 'the bank does not stand up as a wall at the rock',
         `${s.heapAtRock} cells high against the apron`),
      ok(s.bankCrest > s.heapAtRock, 'it leans away from the rock, high point further out',
         `${s.heapAtRock} at the apron, ${s.bankCrest} at its crest`)
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
    // start from closed, whatever an earlier check left behind
    const away = state();
    canvas().dispatchEvent(new PointerEvent('pointermove', {
      clientX: 4, clientY: 4, pointerId: 1, isPrimary: true, buttons: 0, bubbles: true }));
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
        const el = board();
        el.hidden = false;
        window.__placeBoard();
        await sleep(60);
        // the window is not really this size, so read what placeBoard wrote
        // rather than where the browser drew it
        const left = parseFloat(el.style.left), bottom = parseFloat(el.style.bottom);
        // the board's own size comes from CSS, which follows the real window and
        // not the pretend one, so only require it to be tucked in where it fits
        const bw = el.offsetWidth, bh = el.offsetHeight;
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
    const before = state().floor;
    const b = boulderWorld();
    const [x, y] = onScreen(b.x, b.y);
    for (let i = 0; i < 12; i++) { point('pointerdown', x, y); point('pointerup', x, y); await sleep(20); }
    await sleep(2500);
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
    await hoverBench();
    const hired = await buy('firstworker');
    const idlingFirst = state();
    const moved = await put('mine', 'more');
    const before = state();
    run(3);
    const after = state();
    return [
      ok(hired, 'the first worker can be bought with a core'),
      ok(idlingFirst.crew === 1, 'it is on the payroll', `${idlingFirst.crew}`),
      ok(idlingFirst.miners === 0 && idlingFirst.haulers === 1,
         'and carries dust until it is put on something',
         `${idlingFirst.miners} mining, ${idlingFirst.haulers} carrying`),
      ok(moved, 'the rock has a job row to put it on'),
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
      ok(back, 'the job row lets it go'),
      ok(off.miners === 0 && off.haulers === 1, 'and it goes back to carrying dust',
         `${off.miners} mining, ${off.haulers} carrying`),
      ok(!tooMany, 'a body it does not have cannot be put anywhere'),
      ok(capped.miners + capped.haulers === capped.crew,
         'the crew always adds up', `${capped.miners}+${capped.haulers} of ${capped.crew}`)
    ];
  }],

  ['a hired worker carries dust to the pit', async () => {
    window.__give(4000);
    await sleep(200);
    await hoverBench();
    await bankCore();
    await bankCore();
    await hoverBench();
    const hired = await buy('firstworker') || state().crew > 0;
    quickCrew();

    const s = state();
    window.__pile(s.pitX - 260, 150);           // within a round trip of the lip
    await sleep(400);
    const before = state();

    // watch it work: it should reach the lip carrying something
    let reachedLip = false;
    for (let i = 0; i < 200; i++) {
      await sleep(100);
      const w = state().workerPos.find(p => p[0] === 'h');
      if (w) {
        const wx = +w.split(':')[1].split(',')[0];
        if (Math.abs(wx - (state().pitX - WORKER)) < 24) reachedLip = true;
      }
      if (reachedLip && state().stored > before.stored) break;
    }
    const after = state();
    return [
      ok(hired, 'there is a worker to carry it'),
      ok(after.haulers >= 1, 'a worker is on the payroll'),
      ok(reachedLip, 'the worker walks its load to the lip'),
      ok(after.stored > before.stored, 'and dust arrives in the hole',
         `${before.stored} -> ${after.stored}`)
    ];
  }],

  // A shard is brought up and set down. Nothing counts it there: somebody has to
  // walk over and pick it up, the same as everything else in this yard.
  ['the cave gives up shards, and somebody fetches them', async () => {
    window.__crew(0, 0, 3);                  // three spelunkers, cave open
    quickCrew();
    window.__clearFloor();
    const start = state();
    let wentUnder = false;
    const lay = runUntil(() => {
      wentUnder = wentUnder || state().underground > 0;
      return state().finds.includes('shard');
    }, 40);
    const waiting = state();

    window.__crew(0, 2, 3);                  // now put somebody on carrying
    window.__place('hauler', waiting.caveX);
    quickCrew();
    const got = runUntil(() => state().shards > start.shards, 60);
    const after = state();
    window.__crew(0, 0, 0);
    return [
      ok(after.caveOpen, 'the cave is open'),
      ok(wentUnder, 'a spelunker goes down it'),
      ok(lay, 'and leaves a shard lying in the dust by the mouth',
         JSON.stringify(waiting.finds)),
      ok(waiting.shards === start.shards, 'which is not counted where it lies',
         `${start.shards} -> ${waiting.shards}`),
      ok(got, 'a worker walks over for it and that is what counts it',
         `${start.shards} -> ${after.shards}`),
      ok(after.seenShard, 'which is worth showing on the counter')
    ];
  }],

  ['the cave is a hole in the ground, left of the rock', async () => {
    const s = state();
    return [
      ok(s.caveX + s.caveW < s.rockX - s.rockW / 2, 'it is out past the rock',
         `cave ends ${s.caveX + s.caveW}, rock starts ${Math.round(s.rockX - s.rockW / 2)}`),
      ok(s.caveW > 0 && s.caveW < 200, 'and it is a mouth, not a canyon', `${s.caveW}`)
    ];
  }],

  ['the farm grows spores when it is tended', async () => {
    window.__crew(0, 0, 0, 2);               // two farmhands, farm open
    quickCrew();
    window.__clearFloor();
    const start = state();
    let grew = false;
    const lay = runUntil(() => {
      grew = grew || state().beds.some(b => b > 0.1);
      return state().finds.includes('spore');
    }, 40);
    const waiting = state();

    window.__crew(0, 2, 0, 2);               // somebody to go and get it
    window.__place('hauler', waiting.farmX);
    quickCrew();
    const got = runUntil(() => state().spores > start.spores, 90);
    const after = state();
    return [
      ok(after.farmOpen, 'the farm is open'),
      ok(after.beds.length > 0, 'it has beds', `${after.beds.length}`),
      ok(grew, 'a bed comes on while it is tended'),
      ok(lay, 'and is cut for a spore that lies beside it',
         JSON.stringify(waiting.finds)),
      ok(got, 'a worker fetches it, and that is what counts it',
         `${start.spores} -> ${after.spores}`),
      ok(after.seenSpore, 'which is worth showing on the counter')
    ];
  }],

  ['nothing grows in an untended farm', async () => {
    window.__crew(0, 0, 0, 0);               // everybody off the farm
    await sleep(200);
    const before = state();
    await sleep(1500);
    const after = state();
    return [
      ok(after.spores === before.spores, 'the crop does not come on by itself',
         `${before.spores} -> ${after.spores}`)
    ];
  }],

  ['the sites are laid out left of the rock, in order', async () => {
    const s = state();
    return [
      ok(s.farmX + s.farmW < s.caveX, 'the farm is out past the cave',
         `farm ends ${Math.round(s.farmX + s.farmW)}, cave at ${s.caveX}`),
      ok(s.caveX + s.caveW < s.rockX - s.rockW / 2, 'and the cave past the rock'),
      ok(s.rockX < s.benchX && s.benchX < s.pitX, 'with the bench between rock and pit')
    ];
  }],

  ['the lab sells pace, and it bites', async () => {
    window.__crew(4, 2, 2, 2);
    window.__lab(true);
    window.__grant({ shards: 60, spores: 60 });
    await sleep(300);

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
    const cave = el.querySelector('button[data-key="labcave"]');
    if (swing) swing.click();
    if (cave) cave.click();
    await sleep(200);
    const after = state();

    return [
      ok(opened, 'the lab board opens at the lab'),
      ok(!!swing && !!cave, 'it sells pace in shards and in spores'),
      ok(after.mult.swing === before.mult.swing + 1, 'a multiplier goes up when bought'),
      ok(after.mineMs < before.mineMs, 'and the swing really is faster',
         `${before.mineMs}ms -> ${after.mineMs}ms`),
      ok(after.shards < before.shards, 'shards are spent on it',
         `${before.shards} -> ${after.shards}`),
      ok(after.spores < before.spores, 'and spores on the other one',
         `${before.spores} -> ${after.spores}`),
      ok(document.querySelectorAll('#stats b').length > 0, 'and it keeps the books')
    ];
  }],

  ['the lab board stays inside the window too', async () => {
    const checks = [];
    for (const [w, h, dpr, name] of [[390, 844, 3, 'portrait'], [844, 390, 3, 'landscape']]) {
      await asScreen(w, h, dpr, async () => {
        const el = document.getElementById('lab');
        el.hidden = false;
        window.__placeBoard();
        await sleep(60);
        const left = parseFloat(el.style.left), bottom = parseFloat(el.style.bottom);
        const bw = el.offsetWidth, bh = el.offsetHeight;
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

  // A spark comes down and lands in the yard as a grain, like everything else
  // the sites give up. It is counted when it reaches the pit, not before.
  ['the meteor sheds sparks, and they are carried in', async () => {
    window.__crew(0, 0);
    window.__meteor(true);
    const start = state();
    let sawFalling = false;
    const lay = runUntil(() => {
      sawFalling = sawFalling || state().falling > 0;
      return state().finds.includes('spark');
    }, 40);
    const waiting = state();

    window.__crew(0, 2);                     // somebody to carry it in
    window.__place('hauler', waiting.rockX);
    quickCrew();
    const banked = runUntil(() => state().sparks > start.sparks, 90);
    const after = state();
    window.__crew(0, 0);
    return [
      ok(after.meteorOpen, 'the meteor is up there'),
      ok(sawFalling, 'a spark comes loose and falls'),
      ok(lay, 'and lands in the yard with a body of its own',
         JSON.stringify(waiting.finds)),
      ok(waiting.sparks === start.sparks, 'not counted where it lies',
         `${start.sparks} -> ${waiting.sparks}`),
      ok(banked, 'a worker carries it to the pit, and that is what counts it',
         `${start.sparks} -> ${after.sparks}`),
      ok(after.seenSpark, 'which is worth showing on the counter')
    ];
  }],

  // The picture does not scale to fit, so the sky is only as tall as the window
  // leaves it. These are windows at or above the height the game asks for; a
  // shorter one loses sky off the top, and eventually the meteor with it.
  ['the meteor hangs clear of the rock and stays on screen', async () => {
    const checks = [];
    for (const [w, h, dpr, name] of [[2560, 1300, 1, 'big desktop'], [1440, 900, 2, 'laptop'],
                                     [1280, 1000, 1, 'narrow window'], [900, 840, 2, 'the minimum']]) {
      await asScreen(w, h, dpr, () => {
        const s = state();
        const top = (s.meteorY - 54 - s.camY) * s.zoom;
        checks.push(ok(top >= 0 && top < h, `${name} keeps the meteor in the window`,
          `top at ${Math.round(top)} of ${h}`));
        checks.push(ok(s.meteorY + 54 < s.groundY - s.rockH,
          `${name} keeps it above the rock`,
          `meteor bottom ${Math.round(s.meteorY + 54)}, rock top ${Math.round(s.groundY - s.rockH)}`));
      });
    }
    return checks;
  }],

  ['rocks stop growing, because they never stop coming', async () => {
    window.__jump(40);
    await sleep(200);
    const forty = state();
    window.__jump(400);
    await sleep(200);
    const far = state();
    window.__jump(1);
    await sleep(200);
    return [
      ok(far.rockW === forty.rockW && far.rockH === forty.rockH,
         'rock four hundred is no bigger than rock forty',
         `${forty.rockW}x${forty.rockH} vs ${far.rockW}x${far.rockH}`),
      ok(far.rockH < 520, 'and still fits under the sky', `${far.rockH}`),
      ok(far.rockW < 900 - 108, 'and never reaches the bench', `${far.rockW}`)
    ];
  }],

  ['the books report what was made, not what is left', async () => {
    window.__crew(6, 3);
    window.__give(8000, 4);
    await sleep(2500);
    const before = state().rates.banked;
    window.__spend(6000);                    // a big purchase
    await sleep(2500);
    const after = state().rates.banked;
    return [
      ok(before > 0, 'production reads while dust is coming in', `${before}/min`),
      ok(after >= 0, 'and buying something does not read as negative production',
         `${after}/min`)
    ];
  }],

  ['the places are revealed one at a time', async () => {
    const rows = () => [...shop().querySelectorAll('button')].map(b => b.dataset.key);
    const has = k => rows().includes(k);

    dispatchEvent(new KeyboardEvent('keydown', { key: 'r' }));
    await sleep(400);
    const fresh = rows();

    window.__grant({ cores: 4 });
    await sleep(150);
    const withCore = { cave: has('unlockcave'), farm: has('unlockfarm'),
                       lab: has('unlocklab'), meteor: has('unlockmeteor') };

    window.__crew(1, 1, 1);                  // the cave open
    await sleep(150);
    const withCave = { farm: has('unlockfarm'), lab: has('unlocklab') };

    window.__grant({ shards: 3 });
    await sleep(150);
    const withShard = { lab: has('unlocklab'), meteor: has('unlockmeteor') };

    window.__lab(true);
    await sleep(150);
    const withLab = { meteor: has('unlockmeteor') };

    window.__crew(0, 0);
    return [
      ok(!fresh.includes('pick') && !fresh.includes('unlockcave'),
         'a fresh game offers nothing about cores or places', fresh.join(' ')),
      ok(withCore.cave && !withCore.farm && !withCore.lab && !withCore.meteor,
         'the first core offers the cave, and only the cave',
         JSON.stringify(withCore)),
      ok(withCave.farm && !withCave.lab, 'opening the cave offers the farm'),
      ok(withShard.lab && !withShard.meteor, 'a shard in hand offers the lab'),
      ok(withLab.meteor, 'and the lab offers the sky')
    ];
  }],

  ['the save keeps what matters', async () => {
    const s = state();
    await sleep(1200);                       // let it write
    const raw = JSON.parse(localStorage.getItem('boulder-clicker/v4') || 'null');
    return [
      ok(!!raw, 'a save exists'),
      ok(Math.abs(raw.stored - s.stored) <= 20, 'the hole is saved',
         `${raw?.stored} vs ${s.stored}`),
      ok(raw.cores === s.cores, 'cores are saved'),
      ok(raw.miners === s.miners && raw.haulers === s.haulers, 'the crew is saved'),
      ok(raw.shards === s.shards, 'shards are saved', `${raw?.shards} vs ${s.shards}`),
      ok(raw.caveOpen === s.caveOpen, 'and whether the cave is open'),
      ok(raw.spores === s.spores, 'spores are saved', `${raw?.spores} vs ${s.spores}`),
      ok(Array.isArray(raw.beds), 'and how far along every bed is'),
      ok(raw.labOpen === s.labOpen, 'whether the lab is built'),
      ok(!!raw.mult && raw.mult.swing === s.mult.swing, 'and every multiplier bought'),
      ok(raw.sparks === s.sparks, 'sparks are saved', `${raw?.sparks} vs ${s.sparks}`),
      ok(raw.meteorOpen === s.meteorOpen, 'and whether the meteor is up'),
      ok(typeof raw.boulder === 'string' && raw.boulder.length === raw.gw * raw.gh,
         'the rock is saved cell by cell')
    ];
  }]
];

// `__test('cave')` runs only the groups whose name says cave. The whole suite is
// two minutes; one group is seconds, which is the difference between checking a
// change and putting off checking it.
export async function runTests(filter = '') {
  const errs = [];
  const onErr = e => errs.push(String(e.message || e));
  addEventListener('error', onErr);

  dispatchEvent(new KeyboardEvent('keydown', { key: 'r' }));   // known state
  await sleep(600);

  const results = [];
  const timing = [];
  const wanted = TESTS.filter(([name]) => !filter || name.toLowerCase().includes(filter.toLowerCase()));
  for (const [name, fn] of wanted) {
    let checks;
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
    slowest: timing.slice(0, 8).map(([n, ms]) => `${(ms / 1000).toFixed(1)}s ${n}`),
    failures: failed.map(f => `${f.group}: ${f.what}${f.detail ? ` — ${f.detail}` : ''}`),
    errors: errs
  };
}

window.__test = runTests;
window.__groups = () => TESTS.map(([name]) => name);
