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

const P = 6;                                   // a cell, for the piles
const WORKER = 18;                             // a worker square, for tolerances
const canvas = () => document.getElementById('c');
const board = () => document.getElementById('board');
const panel = () => document.getElementById('panel');
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
  window.__levels({ haulPaceLevel: 20, haulCarryLevel: 4, quarryPaceLevel: 10, tendLevel: 10 });
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
    const pitFloorFromBottom = innerHeight - onScreen(0, s.groundY + s.pitDepth)[1];
    const groundFromBottom = innerHeight - onScreen(0, s.groundY)[1];
    const expected = (s.pitDepth + 12) * s.zoom;
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
      ok(s.pitHoleRows * s.pitGrain === 276, 'the hole is 276 deep whatever the grain',
         `${s.pitHoleRows} x ${s.pitGrain}`),
      ok(s.pitW === 3624, 'and 3624 across', `${s.pitW}`),
      // the hole itself, plus whatever the heap over the brim is allowed to be
      ok(s.pitCapacity > (3624 / s.pitGrain) * (276 / s.pitGrain),
         'it holds the hole and then some, for the heap over the mouth',
         `${s.pitCapacity} at grain ${s.pitGrain}`),
      ok(s.pitCapacity < (3624 / s.pitGrain) * (276 / s.pitGrain) * 1.5,
         'but the heap is a heap, not another hole', `${s.pitCapacity}`)
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
      // it does not stop at the brim any more -- it heaps over the mouth -- but
      // it stops at what the bed will hold, and never gets out onto the ground
      ok(s.pitDust <= cap, 'the pile stops at what the bed holds',
         `${s.pitDust} of ${cap}`),
      ok(s.pitDust > (3624 / s.pitGrain) * (276 / s.pitGrain),
         'having heaped up over the mouth on the way', `${s.pitDust}`),
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
    // watched across the dance rather than at two moments in it: they hop about
    // three times a second, and two samples can easily catch the same height
    const heights = new Set();
    for (let i = 0; i < 60; i++) {
      run(1 / 60);
      heights.add(state().workerPos.filter(p => p[0] === 'm').map(p => p.split(',')[1]).join());
    }
    const stillPartying = state();
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
      ok(heights.size > 1, 'they are off the ground doing it',
         `${heights.size} different heights across a second of it`),
      ok(sky > 0, 'the next rock comes down out of the sky', `caught it ${sky}px up`),
      ok(landed && after.rockFoot === after.groundY, 'and lands on the ground line',
         `foot ${after.rockFoot}, ground ${after.groundY}`),
      ok(after.apronClear, 'clearing the ground it needs as it lands',
         `${after.apronDust} grains in the apron`)
    ];
  }],

  // A rock is a heavy thing coming out of the sky, and until it knocked the view
  // about it landed in silence. The shake has to die away on its own, and it has
  // to keep the picture on whole device pixels while it does it.
  ['the landing knocks the yard about', async () => {
    window.__crew(2, 0);
    haveRock();
    window.__next();
    let peak = 0, atLanding = null, quietOnTheWayDown = true;
    for (let i = 0; i < 900 && atLanding === null; i++) {
      run(1 / 60);
      const s = state();
      if (s.rockFall > 0 && s.shake > 0) quietOnTheWayDown = false;
      peak = Math.max(peak, s.shake);
      if (s.rock > 0 && !s.rockFall && peak > 0) atLanding = s;
    }
    // and then watch it ring: the offsets are read after the landing, because
    // the frame it lands on is the frame the shake is set, not spent
    const moved = new Set();
    for (let i = 0; i < 60; i++) { run(1 / 60); moved.add(state().shakeOff.join()); }
    const still = runUntil(() => state().shake === 0, 5);
    const rest = state();
    window.__crew(0, 0);
    return [
      ok(peak > 0, 'the landing throws the view', `${peak} world pixels of it`),
      ok(atLanding !== null && quietOnTheWayDown,
         'and it is the landing that does it, not the fall'),
      ok(moved.size > 2, 'it rocks rather than jumping once',
         `${moved.size} different offsets`),
      ok(still && rest.shake === 0, 'and it settles back on its own',
         `${rest.shake} left`),
      ok(rest.shakeOff[0] === 0 && rest.shakeOff[1] === 0,
         'leaving the view exactly where it was', rest.shakeOff.join())
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

  // The next rock lands on the ground the crew were standing on, so they get out
  // of its footprint before it arrives rather than being buried by it.
  ['the crew get out from under the next rock', async () => {
    window.__crew(4, 3);
    quickCrew();
    haveRock();
    window.__next();
    const inZone = s => !s.dropZone ? [] : s.workerPos.filter(w => {
      const x = +w.split(':')[1].split(',')[0];
      return x + WORKER > s.dropZone[0] && x < s.dropZone[1];
    });
    let told = false, late = 0, landed = null;
    for (let i = 0; i < 900 && landed === null; i++) {
      run(1 / 60);
      const s = state();
      if (s.dropZone) told = true;
      // the last of the fall is when it matters: by then the ground is spoken for
      if (s.rockFall > 0 && s.rockFall < 200 && inZone(s).length) late++;
      if (s.rock > 0 && !s.rockFall && told) landed = s;
    }
    const under = landed ? inZone({ ...landed, dropZone: landed.dropZone }) : ['no rock'];
    window.__crew(0, 0);
    return [
      ok(told, 'they are told where it is coming down before it is there'),
      ok(landed !== null, 'and it comes down'),
      ok(late === 0, 'nobody is still in the way as it drops',
         `${late} frames with somebody in it`),
      ok(under.length === 0, 'and nobody is under it when it lands', under.join(' '))
    ];
  }],

  // A crew that has been stood down is still a crew standing there. Frozen
  // squares read as a bug; shifting about reads as waiting.
  ['a stood-down crew shifts about', async () => {
    window.__crew(3, 0);
    haveRock();
    const strip = state().piles.find(p => p.key === 'rock');
    for (let x = strip.from + P; x < strip.to - P; x += P) window.__pile(x, 20);
    const full = runUntil(() => state().pileFull.rock, 30);
    const before = state();
    const poses = new Set();
    for (let i = 0; i < 240; i++) {
      run(1 / 60);
      poses.add(state().workerPos.filter(w => w[0] === 'm').join('|'));
    }
    const after = state();
    window.__crew(0, 0);
    window.__clearFloor();
    return [
      ok(full, 'the rock\'s pile fills and the crew stand down'),
      ok(after.rock === before.rock, 'nothing more comes off the rock',
         `${before.rock} -> ${after.rock}`),
      ok(poses.size > 10, 'but they are not stood frozen',
         `${poses.size} poses across four seconds`)
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
      ok(s.benchX + s.benchW < s.rockX - s.rockW / 2, 'it stands clear of the bench',
         `bench ends ${Math.round(s.benchX + s.benchW)}, rock starts ${Math.round(s.rockX - s.rockW / 2)}`),
      ok(s.benchX < s.rockX && s.rockX < s.pitX, 'the rock is between the bench and the pit'),
      // the whole working area has to sit in a window at once, at the biggest
      // rock: the bench, the rock and the lip of the pit are one screenful
      ok(s.pitX - s.benchX < 1600, 'bench through pit lip is one screenful',
         `${Math.round(s.pitX - s.benchX)} across`),
      ok((s.rockX - s.rockW / 2) - (s.benchX + s.benchW) > 60, 'the rock never grows into the bench',
         `${Math.round((s.rockX - s.rockW / 2) - (s.benchX + s.benchW))} clear`),
      ok(s.pitX - (s.rockX + s.rockW / 2) > 300, 'there is ground to sweep between rock and lip',
         `${Math.round(s.pitX - (s.rockX + s.rockW / 2))}`)
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
      // the bench stands off the rock's far flank now, so the view has to open
      // wide enough to the left to show it arriving
      ok(s.benchX >= s.camX, 'the bench is in the opening view',
         `bench at ${Math.round(s.benchX)}, view starts ${Math.round(s.camX)}`),
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
      ok(full.dustAtQuarry === 0, 'and none of it is heaped over the mouth of the quarry',
         `${full.dustAtQuarry} grains out there`),
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
  // Over the hole is in the hole. A chip that crosses the mouth is banked
  // whatever it is, so nothing can come to rest lying over the lip where a
  // worker could see it, walk to the ledge, and reach for it for ever.
  ['nothing is left lying over the mouth of the pit', async () => {
    window.__crew(0, 0);
    window.__clearFloor();
    run(0.5);
    const before = state().shards;
    for (let i = 0; i < 12; i++) window.__toss('shard', state().pitX + 12);
    run(4);
    const after = state();
    const nearLip = after.findAll
      .map(t => +t.split(',')[0])
      .filter(x => x > after.pitX - 60);
    return [
      ok(after.shards === before + 12, 'every one of them is counted',
         `${before} -> ${after.shards}`),
      ok(nearLip.length === 0, 'none is left lying over the mouth',
         JSON.stringify(nearLip))
    ];
  }],

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

  // A shard is a grain of dust as far as the ground and the hand are concerned:
  // it is swept up with everything else, rides the cursor, and is thrown the
  // same way. It costs carrying room, because it is one grain of your load.
  ['a shard is swept up and thrown like anything else', async () => {
    window.__crew(0, 0);
    window.__clearFloor();
    run(0.5);
    const s0 = state();
    const p = s0.piles.find(q => q.key === 'quarry');
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

  // They are dust with a different mark on them, so they heap the way dust
  // heaps: the same grid, the same repose, the same ceiling. There is no second
  // implementation of any of it to drift out of step.
  // The first colour in the game. Everything the ground makes is a grey, because
  // grey is how deep the rock was; the things the sites give up never came off
  // the rock, so they are the one thing a colour can mean something about. Each
  // grain carries its own tone, so a heap of them speckles like a heap of dust.
  ['what the sites give up comes in colours, and in tones', async () => {
    window.__crew(0, 0);
    window.__clearFloor();
    run(0.5);
    const p = state().piles.find(q => q.key === 'quarry');
    for (let i = 0; i < 24; i++) { window.__toss('shard', p.from + 40); run(0.25); }
    run(8);
    const cells = state().findCells.filter(c => c.x > p.from - 40 && c.x < p.to + 40);
    const tones = new Set(cells.map(c => c.v));
    return [
      ok(cells.length === 24, 'all of them are there', `${cells.length}`),
      ok(cells.every(c => c.kind === 'shard'), 'and every one is a shard',
         JSON.stringify([...new Set(cells.map(c => c.kind))])),
      ok(tones.size > 1, 'they are not all the same tone', `${tones.size} tones`),
      ok(tones.size <= 4, 'and no more tones than the kind has', `${tones.size}`)
    ];
  }],

  ['a heap of finds heaps, rather than stacking', async () => {
    window.__crew(0, 0);
    window.__clearFloor();
    run(0.5);
    const p = state().piles.find(q => q.key === 'quarry');
    for (let i = 0; i < 30; i++) { window.__toss('shard', p.from + 30); run(0.3); }
    run(10);
    const at = state().findAll.map(t => t.split(',').map(Number))
                              .filter(a => a[0] > p.from - 40 && a[0] < p.to + 40);
    const xs = at.map(a => a[0]);
    const tops = {};
    for (const [x, h] of at) tops[x] = Math.max(tops[x] || 0, h);
    const near = Math.min(...xs);
    const peak = (+Object.keys(tops).reduce((a, b) => tops[b] > tops[a] ? b : a) - near) / 6;
    const tall = Math.max(...at.map(a => a[1]));
    return [
      ok(at.length === 30, 'all thirty are lying there', `${at.length}`),
      ok(Math.max(...xs) - Math.min(...xs) >= 36, 'they spread out along the ground',
         `${Math.max(...xs) - Math.min(...xs)}px across`),
      ok(tall <= 30 * 6 / 3, 'rather than going up in a column',
         `${tall / 6} cells at the peak`),
      ok(at.every(a => a[0] % 6 === 0 && a[1] % 6 === 0),
         'every one of them sits in a cell, like a grain of dust',
         JSON.stringify(at.slice(0, 4))),
      ok(new Set(at.map(a => a.join(','))).size === at.length,
         'and no two are in the same cell'),
      ok(peak > 0, 'the heap leans away from the station rather than standing on it',
         `tallest column is ${peak} cells out from the near end`)
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
      ok(order === 'farm quarry rock', 'the strips run farm, quarry, rock, left to right', order),
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
    const behind = s.piles.find(p => p.key === 'quarry').to - 60;
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
    run(14);                                  // long enough to walk to the rock and swing
    const after = state();
    return [
      ok(hired, 'the first worker can be bought with a core'),
      ok(idlingFirst.crew === 1, 'it is on the payroll', `${idlingFirst.crew}`),
      ok(idlingFirst.miners === 0 && idlingFirst.haulers === 1,
         'and carries dust until it is put on something',
         `${idlingFirst.miners} mining, ${idlingFirst.haulers} carrying`),
      ok(moved, 'the rock has a roster under it to put it on'),
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

  // Moving somebody from one job to another used to delete a body where it stood
  // and make a new one already at the far end of the yard. It is the same person:
  // it keeps its place in the crew, walks out of wherever it was working, and
  // does none of the new job on the way.
  ['a body walks to its new work instead of appearing at it', async () => {
    const body = () => {
      const [t, xy] = state().workerPos[0].split(':');
      const [x, y] = xy.split(',').map(Number);
      return { t, x, y };
    };
    window.__crew(0, 0, 1);                     // one body, and it goes down the quarry
    run(10);                                    // down the wall and working the floor
    const s0 = state();
    const digging = body();

    window.__assign('quarriers', -1);           // now it is wanted on the rock
    window.__assign('miners', 1);
    const off = state();

    // a sixth of a second at a time, so the climb out is not stepped over
    const trail = [];
    for (let i = 0; i < 30; i++) { run(1 / 6); trail.push(body()); }
    const arrived = runUntil(() => state().commuting.length === 0, 200);
    const home = body();
    const after = state();
    window.__crew(0, 0);
    window.__clearFloor();                      // the shards it knocked off are not ours

    const climbing = trail.filter(p => p.y > s0.groundY - WORKER);
    const steps = trail.slice(1).map((p, i) => Math.abs(p.x - trail[i].x));
    return [
      ok(digging.t === 'q' && digging.y > s0.groundY,
         'it starts at work, down in the cut', `${digging.x},${digging.y}`),
      ok(off.workers === 1 && off.crew === 1,
         'moving it is one body, not one deleted and another made',
         `${off.workers} bodies, ${off.crew} on the payroll`),
      ok(off.miners === 1 && off.quarriers === 0,
         'and it counts at its new job the moment it is given it',
         `${off.miners} mining, ${off.quarriers} in the quarry`),
      ok(climbing.length > 0 && climbing.every(p => p.x === digging.x),
         'it climbs out of the cut before it walks anywhere',
         `${climbing.length} samples still below the line`),
      ok(steps.filter(d => d > 0).length > 8 && Math.max(...steps) < WORKER * 3,
         'then it crosses the yard a step at a time rather than jumping',
         steps.map(d => Math.round(d)).join(' ')),
      ok(arrived, 'and it gets there'),
      ok(Math.abs(home.x - s0.rockX) < s0.rockW,
         'which is the rock it was sent to',
         `${home.x}, rock at ${s0.rockX}`),
      ok(after.miners === 1 && after.workers === 1,
         'still the one body, and now it is a miner', `${after.workers} bodies`)
    ];
  }],

  // A lab with nothing to research is a room of people doing nothing, and there
  // is no button that takes them off it. So they take themselves off.
  ['an idle lab lets its people go', async () => {
    window.__abandon();                         // nothing for them to work on
    window.__crew(0, 1);
    window.__lab(true);
    window.__assign('labbers', 1);
    const sent = state();
    const inside = runUntil(() => state().crewDetail.some(d => d.startsWith('l|in')), 200);
    // LAB_IDLE_MS is four seconds, so two is still waiting and six is well past
    run(2);
    const waiting = state();
    run(4);
    const gone = state();
    window.__crew(0, 0);
    return [
      ok(sent.labbers === 1, 'a body can be put on the lab', `${sent.labbers}`),
      ok(inside, 'and it walks over and goes in'),
      ok(waiting.labbers === 1,
         'an empty lab does not turn people out the moment they arrive',
         `${waiting.labbers}`),
      ok(gone.labbers === 0, 'but it does not keep them standing in it for ever',
         `${gone.labbers}`),
      ok(gone.haulers === 1 && gone.crew === 1,
         'and the one it lets go is back to carrying dust, not off the payroll',
         `${gone.haulers} carrying of ${gone.crew}`)
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
  ['the quarry gives up shards, and somebody fetches them', async () => {
    window.__crew(0, 0, 3);                  // three quarriers, quarry open
    quickCrew();
    window.__clearFloor();
    const start = state();
    // Nobody is out of sight any more: they climb down and work the floor of the
    // cut where you can watch them, which is the whole point of a cut.
    let onTheFloor = false;
    const lay = runUntil(() => {
      const s = state();
      onTheFloor = onTheFloor || s.workerPos.some(p =>
        p[0] === 'q' && +p.split(',')[1] > s.groundY);
      return s.finds.includes('shard');
    }, 40);
    const waiting = state();

    window.__crew(0, 2, 3);                  // now put somebody on carrying
    window.__place('hauler', waiting.quarryX);
    quickCrew();
    const got = runUntil(() => state().shards > start.shards, 60);
    const after = state();
    window.__crew(0, 0, 0);
    return [
      ok(after.quarryOpen, 'the quarry is open'),
      ok(onTheFloor, 'a quarrier climbs down and works its floor'),
      ok(lay, 'and leaves a shard lying in the dust by the mouth',
         JSON.stringify(waiting.finds)),
      ok(waiting.shards === start.shards, 'which is not counted where it lies',
         `${start.shards} -> ${waiting.shards}`),
      ok(got, 'a worker walks over for it and that is what counts it',
         `${start.shards} -> ${after.shards}`),
      ok(after.seenShard, 'which is worth showing on the counter')
    ];
  }],

  // A worked cut, not a box. Both walls come down in benches and the floor they
  // leave is uneven -- and the floor is not just drawing: the crew stand on it,
  // so a quarrier's feet have to be on the stretch of floor it is over.
  ['the quarry is a worked cut, benched and uneven', async () => {
    window.__crew(0, 0, 3);
    quickCrew();
    run(6);
    const s = state();
    const c = s.quarryCut;
    const q = s.workerPos.filter(p => p[0] === 'q').map(p => +p.split(',')[1]);
    const feet = new Set(q);
    return [
      ok(c.deep - s.groundY > 100 && s.quarryW > 120,
         'it is a cut somebody has been down for a while, not a step down',
         `${s.quarryW} wide, ${c.deep - s.groundY} deep`),
      ok(c.rims === 2 && c.corners > 12, 'it is a stepped outline, not four corners',
         `${c.corners} corners, ${c.rims} at the rim`),
      ok(new Set(c.steps).size > 1 && Math.max(...c.steps) > 0,
         'and the floor it leaves is uneven', c.steps.join(' ')),
      ok(c.from > s.quarryX && c.to < s.quarryX + s.quarryW,
         'the walls eat in, so the floor is narrower than the mouth',
         `${c.from}..${c.to} in ${s.quarryX}..${s.quarryX + s.quarryW}`),
      ok(q.length === 3 && feet.size > 1, 'and the crew stand on it, not on one line',
         q.join(' '))
    ];
  }],

  ['the quarry is a hole in the ground, left of the rock', async () => {
    const s = state();
    return [
      ok(s.quarryX + s.quarryW < s.rockX - s.rockW / 2, 'it is out past the rock',
         `quarry ends ${s.quarryX + s.quarryW}, rock starts ${Math.round(s.rockX - s.rockW / 2)}`),
      ok(s.quarryW > 0 && s.quarryW < 200, 'and it is a mouth, not a canyon', `${s.quarryW}`)
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

  // A spore is a thing that grew, and it should be seen to have grown. It forms
  // at the tip of the stalk the moment the bed is ripe and sits there until the
  // farmhand takes it off -- from exactly where it grew, in the tone it grew in.
  ['a ripe bed shows its spore before it is cut', async () => {
    window.__crew(0, 0, 0, 1);
    quickCrew();
    window.__clearFloor();
    // a frame at a time, not a second: it is only ripe for as long as it takes
    // the farmhand to cut it, and a second-wide step steps right over that
    let ripe = false;
    // a bed with a spore on it, not merely one left standing ripe by an earlier
    // check: the tone is what says this one just grew, and the beds an earlier
    // check left ripe still carry theirs, so they are named and skipped
    const already = new Set(state().bedTone.flatMap((t, n) => t > 0 ? [n] : []));
    const fresh = s => s.bedTone.findIndex((t, n) => t > 0 && !already.has(n));
    for (let i = 0; i < 3000 && !ripe; i++) {
      run(1 / 60);
      ripe = fresh(state()) >= 0;
    }
    const showing = state();
    const i = fresh(showing);
    const tone = showing.bedTone[i];
    const spores = showing.finds.filter(f => f === 'spore').length;
    run(0.3);
    const stillThere = state();
    // wait for it rather than guessing how long the cut and the throw take
    const landed = runUntil(
      () => state().finds.filter(f => f === 'spore').length > spores, 20);
    const after = state();
    window.__crew(0, 0, 0, 0);
    return [
      ok(ripe, 'a bed comes ripe'),
      ok(tone > 0, 'and a spore forms on it', `tone ${tone}`),
      ok(stillThere.beds[i] >= 1, 'which stays there to be looked at',
         `${stillThere.beds[i]}`),
      ok(after.beds[i] < 1, 'until the farmhand takes it off', `${after.beds[i]}`),
      ok(landed, 'and then it is lying in the farm pile',
         `${spores} -> ${after.finds.filter(f => f === 'spore').length}`)
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
      ok(s.farmX + s.farmW < s.quarryX, 'the farm is out past the quarry',
         `farm ends ${Math.round(s.farmX + s.farmW)}, quarry at ${s.quarryX}`),
      ok(s.labX < s.farmX, 'and the lab out past the farm, at the far end',
         `lab at ${Math.round(s.labX)}, farm at ${Math.round(s.farmX)}`),
      ok(s.quarryX + s.quarryW < s.benchX, 'the quarry stands past the bench'),
      ok(s.benchX + s.benchW < s.rockX && s.rockX < s.pitX,
         'and the bench off the rock, between it and the quarry')
    ];
  }],

  // Nothing in the lab is bought outright any more. Paying starts a piece of
  // research; what finishes it is bodies standing in the lab, and an empty lab
  // makes no progress at all however much you have paid.
  // Benched rather than deleted: everything it needs is still here, and the dev
  // panel can put it back in the sky to be looked at. It is not in the game.
  // The crew go inside the lab, so there is nothing to watch. The chimney is the
  // whole of the signal, and it says the one thing worth saying: that somebody
  // is in there working. Paid-for research with an empty lab does not smoke.
  // The crew crossed the mouth in mid-air: the ground line stops at one rim and
  // picks up at the other, and everyone walked the gap. The bridge is what makes
  // that honest, so it is not scenery -- groundAt() has to put the crew on it,
  // and it has to reach solid ground either side of a mouth that moves with the
  // rock.
  ['there is a bridge over the quarry', async () => {
    window.__crew(0, 2, 1);
    run(1);
    const s = state();
    const { x0, d0, d1, x1, top } = s.bridge;
    const mouth = [s.quarryX, s.quarryX + s.quarryW];
    const p = s.deckWalk;                        // sampled across and past both ends
    const angle = Math.atan((s.groundY - top) / (d0 - x0)) * 180 / Math.PI;

    return [
      ok(d0 <= mouth[0] && d1 >= mouth[1], 'the flat deck covers the whole mouth',
         `${d0}..${d1} over ${mouth[0]}..${mouth[1]}`),
      ok(x0 - 0 < d0 && x1 > d1 && d0 - x0 === x1 - d1,
         'with a ramp of the same run either side', `${d0 - x0} / ${x1 - d1}`),
      ok(Math.abs(angle - 20) < 0.1, 'and they rise at twenty degrees',
         `${angle.toFixed(2)} deg`),
      ok([x0, d0, d1, x1].every(v => v % 6 === 0), 'every corner sits on the lattice',
         `${x0} ${d0} ${d1} ${x1}`),
      ok(p[0] === s.groundY && p[p.length - 1] === s.groundY,
         'off either end you are back on the ground', `${p[0]} / ${p[p.length - 1]}`),
      ok(p[1] > p[2] && p[2] > p[3], 'walking on it climbs', p.join(' ')),
      ok(p[3] === top && p[4] === top && p[5] === top, 'levels off over the hole',
         p.slice(3, 6).join(' ')),
      ok(p[6] < p[7] && p[7] < p[8], 'and comes back down the other side',
         p.slice(6).join(' ')),
      ok(p.every(v => v <= s.groundY), 'and never dips below the ground doing it',
         p.join(' '))
    ];
  }],

  // Scenery would have been cheaper. This is the check that it is not scenery:
  // somebody fetching from the far pile has to actually ride over the mouth
  // rather than walk across the gap on nothing, the way they used to.
  ['the crew walk the bridge rather than the air', async () => {
    window.__crew(0, 3, 1);
    quickCrew();
    const s0 = state();
    const { x0, x1 } = s0.bridge;

    // something worth fetching on the far side of the hole, so a hauler has a
    // reason to cross at all
    const farm = s0.piles.find(p => p.key === 'farm');
    window.__pile(Math.round((farm.from + farm.to) / 2), 40);

    let seen = 0, high = null;
    for (let i = 0; i < 80; i++) {
      window.__fast(0.2);                       // finer than a second: a crossing is short
      for (const w of state().workerPos) {
        const [t, xy] = w.split(':');
        const [x, y] = xy.split(',').map(Number);
        if (t === 'q' || x < x0 || x > x1) continue;
        seen++;
        if (high === null || y < high) high = y;
      }
    }
    window.__crew(0, 0);

    return [
      ok(seen > 0, 'somebody crosses the mouth at all', `${seen} samples over it`),
      ok(high !== null && high < s0.groundY - 18,
         'and the bridge carries them above the ground line doing it',
         `highest top edge ${high}, ground line ${s0.groundY}`),
      ok(high !== null && high <= s0.bridge.top - 18 + 1,
         'right up onto the deck, not just the foot of a ramp',
         `${high} vs deck ${s0.bridge.top - 18}`)
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

  // Clouds and birds are the only things in the game that are purely scenery, so
  // the one thing they must never do is get in the way: they stay in the strip of
  // sky above the height a rock can reach, and they stay in the view when it is
  // scrolled, which is what the parallax is for -- a fixed sky would slide off the
  // side of the world and leave an empty one behind.
  ['the sky has clouds in it, and birds now and then', async () => {
    const before = state().sky;
    run(2);
    window.__look(0);
    run(2);
    const near = state().sky;
    window.__look(1e6);                          // the far end of the world
    run(2);
    const far = state().sky;
    window.__birds();
    const flock = state().sky;
    run(4);
    const later = state().sky;

    const above = s => s.cloudY.every(y => y <= s.low) && s.cloudY.every(y => y >= s.top);
    const inView = s => s.cloudAcross.filter(x => x > -200 && x < state().viewW).length;

    return [
      ok(before.clouds === near.clouds && near.clouds === far.clouds,
         'the same few clouds are kept wherever you are looking',
         `${before.clouds} / ${near.clouds} / ${far.clouds}`),
      ok(above(near) && above(far), 'they keep to the sky above the rock',
         `${near.low} floor, lowest ${Math.max(...near.cloudY)}`),
      ok(inView(near) >= 2 && inView(far) >= 2, 'and there are some in view at either end',
         `${inView(near)} / ${inView(far)}`),
      ok(far.fars.every(f => f > 0 && f < 1), 'each one sits at its own distance',
         far.fars.join(' ')),
      ok(near.drifts, 'and they drift'),
      ok(flock.birds >= 2 && flock.birds <= 4, 'birds come in twos and threes',
         `${flock.birds}`),
      ok(flock.birdY.every(y => y <= flock.low + 20), 'flying no lower than the clouds do',
         flock.birdY.join(' ')),
      ok(later.birds >= flock.birds &&
         flock.birdAcross.every((x, i) => x !== later.birdAcross[i]),
         'and every one of them is crossing', flock.birdAcross.join(' ') + ' -> ' + later.birdAcross.join(' '))
    ];
  }],

  ['the air thickens with what is lying about, and keeps out of the ground', async () => {
    // The air is the only thing in the background of this game, so it is the
    // only thing that says the view is moving. What it must not do is drift
    // about inside solid ground, and what it must do is answer the yard.
    window.__clearFloor();
    run(4);
    const bare = state();

    window.__pile(bare.rockX + 300, 2400);       // a heap where the spoil goes
    run(20);                                     // the air comes on a mote at a time
    const heaped = state();

    window.__clearFloor();
    run(20);
    const swept = state();

    return [
      ok(bare.air > 0, 'a bare yard still has dust hanging in it', `${bare.air}`),
      // what the yard asks for, not what the screen is carrying: a stocked pit
      // asks for more than the cap allows, and by then the count says nothing
      ok(heaped.airWant > bare.airWant, 'a heap in the yard puts more of it up',
         `${bare.airWant} bare, ${heaped.airWant} heaped`),
      ok(swept.airWant < heaped.airWant, 'and carrying the heap away thins it again',
         `${heaped.airWant} heaped, ${swept.airWant} swept`),
      ok(heaped.airFront > 0, 'some of it passes in front of the yard, not behind it',
         `${heaped.airFront} of ${heaped.air}`),
      ok(bare.airUnder === 0 && heaped.airUnder === 0 && swept.airUnder === 0,
         'and none of it is under the ground',
         `${bare.airUnder}/${heaped.airUnder}/${swept.airUnder}`)
    ];
  }],

  // A mote is the colour of what kicked it up, which is the only thing in the
  // game that says what the far end of the yard is from across the world: blue
  // air over the quarry, green over the beds, grey everywhere else.
  ['the air over a site is the colour of what comes out of it', async () => {
    window.__reset();
    run(4);
    const yard = state();                        // nothing open: a grey yard

    window.__grant({ cores: 8 });
    window.__crew(0, 0, 2, 0);                   // opens the quarry, and works it
    window.__look(state().quarryX - 100);
    run(20);
    const atQuarry = state();

    window.__crew(0, 0, 0, 2);                   // and the beds
    window.__look(state().farmX - 100);
    run(20);
    const atFarm = state();

    return [
      ok(yard.airKinds.shard === 0 && yard.airKinds.spore === 0,
         'a yard with nothing open gives off nothing but dust',
         JSON.stringify(yard.airKinds)),
      ok(atQuarry.airKinds.shard > 0, 'the air over the quarry comes up blue',
         `${atQuarry.airKinds.shard} of ${atQuarry.air}`),
      ok(atFarm.airKinds.spore > 0, 'and the air over the beds comes off green',
         `${atFarm.airKinds.spore} of ${atFarm.air}`),
      ok(atFarm.airKinds.dust > 0, 'the yard itself is still grey',
         `${atFarm.airKinds.dust} of ${atFarm.air}`)
    ];
  }],

  // The one thing in the sky you can touch. It is worth a few grains, and the
  // grains have to be worth having: aimed into the rock's own strip of ground,
  // where the haulers already work, rather than dropped in the far yard where
  // nobody would ever go and fetch them.
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
    const strip = settled.piles.find(p => p.key === 'rock');

    return [
      ok(hit.sky.birds === s.sky.birds - 1, 'the one that was clicked is gone',
         `${s.sky.birds} -> ${hit.sky.birds}`),
      ok(hit.chips > 0, 'and it shook some dust loose', `${hit.chips} in the air`),
      ok(hit.chipShades.every(v => v > 0), 'every grain of it is a grain and not an empty cell',
         hit.chipShades.join(' ')),
      ok(settled.chips === 0 && settled.floor === clear + hit.chips,
         'all of which lands, and none of it is lost on the way',
         `${hit.chips} shaken, ${settled.floor - clear} down`),
      ok(settled.pileCount.rock === settled.floor - clear,
         'in the strip of ground the rock pours into, where somebody will fetch it',
         `${settled.pileCount.rock} of ${settled.floor - clear} inside ${strip.from}..${strip.to}`),
      ok(settled.stored === bank, 'and none of it is banked for free',
         `${bank} -> ${settled.stored}`)
    ];
  }],

  ['the thing in the sky is benched', async () => {
    const s = state();
    return [
      ok(!s.skyShown, 'it is not in the sky'),
      ok(typeof s.skyShown === 'boolean', 'but the switch for it still exists')
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

    window.__reset();
    await sleep(400);
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
      ok(raw.quarryOpen === s.quarryOpen, 'and whether the quarry is open'),
      ok(raw.spores === s.spores, 'spores are saved', `${raw?.spores} vs ${s.spores}`),
      ok(Array.isArray(raw.beds), 'and how far along every bed is'),
      ok(raw.labOpen === s.labOpen, 'whether the lab is built'),
      ok(!!raw.mult && raw.mult.swing === s.mult.swing, 'and every multiplier bought'),
      ok(raw.labbers === s.labbers, 'who is in the lab', `${raw?.labbers} vs ${s.labbers}`),
      ok(!raw.research === !s.research, 'and whatever it is working on'),
      ok(typeof raw.boulder === 'string' && raw.boulder.length === raw.gw * raw.gh,
         'the rock is saved cell by cell')
    ];
  }]
];

// `__test('quarry')` runs only the groups whose name says quarry. The whole suite is
// two minutes; one group is seconds, which is the difference between checking a
// change and putting off checking it.
export async function runTests(filter = '') {
  const errs = [];
  const onErr = e => errs.push(String(e.message || e));
  addEventListener('error', onErr);

  window.__reset();                                            // known state
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
