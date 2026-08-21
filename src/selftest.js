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

const benchWorld = () => {
  const s = state();
  return { x: s.pitX - 258 - 474, y: s.groundY };
};

const boulderWorld = () => {
  const s = state();
  return { x: s.pitX - 258, y: s.groundY - 354 };
};

async function hoverBench() {
  const b = benchWorld();
  const [x, y] = onScreen(b.x + 20, b.y - 30);
  point('pointermove', x, y, 0);
  await sleep(250);
}

// bank one core the long way round: drop it, carry it, throw it in
async function bankCore() {
  window.__drop();
  for (let i = 0; i < 40 && !state().coreItem?.rest; i++) await sleep(100);
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
    if (!state().coreItem && !state().heldCore) return true;
  }
  return false;
}

const buy = async key => {
  const b = shop().querySelector(`button[data-key="${key}"]`);
  if (!b || b.disabled) return false;
  b.click();
  await sleep(150);
  return true;
};

const TESTS = [
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

  ['pit is always the same size', async () => {
    const s = state();
    return [
      ok(s.pitRows === 46, 'pit is 46 deep', `${s.pitRows}`),
      ok(Math.round(s.pitW / 6) === 240, 'pit is 240 across', `${Math.round(s.pitW / 6)}`),
      ok(s.pitCapacity === 46 * 240, 'capacity follows from those', `${s.pitCapacity}`)
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

  ['a hired miner works the rock', async () => {
    await hoverBench();
    const hired = await buy('unlockminers');
    const before = state().rock;
    await sleep(3000);
    const after = state();
    return [
      ok(hired, 'first miner can be bought with a core'),
      ok(after.miners === 1, 'one miner is on the payroll', `${after.miners}`),
      ok(after.workers === 1, 'and exists as a worker', `${after.workers}`),
      ok(after.rock < before, 'rock is coming off', `${before} -> ${after.rock}`)
    ];
  }],

  ['a hired worker carries dust to the pit', async () => {
    window.__give(4000);
    await sleep(200);
    await hoverBench();
    await bankCore();
    await bankCore();
    await hoverBench();
    const hired = await buy('unlockhaulers');
    for (let i = 0; i < 4; i++) await buy('haulpace');

    const s = state();
    window.__pile(s.pitX - 500, 150);
    await sleep(400);
    const before = state();

    // watch it work: it should reach the lip carrying something
    let reachedLip = false;
    for (let i = 0; i < 80; i++) {
      await sleep(100);
      const w = state().workerPos.find(p => p[0] === 'h');
      if (!w) continue;
      const wx = +w.split(':')[1].split(',')[0];
      if (Math.abs(wx - (state().pitX - 18)) < 24) reachedLip = true;
    }
    const after = state();
    return [
      ok(hired, 'first worker can be bought with cores'),
      ok(after.haulers >= 1, 'a worker is on the payroll'),
      ok(reachedLip, 'the worker walks its load to the lip'),
      ok(after.stored > before.stored, 'and dust arrives in the hole',
         `${before.stored} -> ${after.stored}`)
    ];
  }],

  ['the save keeps what matters', async () => {
    const s = state();
    await sleep(1200);                       // let it write
    const raw = JSON.parse(localStorage.getItem('boulder-clicker/v3') || 'null');
    return [
      ok(!!raw, 'a save exists'),
      ok(Math.abs(raw.stored - s.stored) <= 20, 'the hole is saved',
         `${raw?.stored} vs ${s.stored}`),
      ok(raw.cores === s.cores, 'cores are saved'),
      ok(raw.miners === s.miners && raw.haulers === s.haulers, 'the crew is saved'),
      ok(typeof raw.boulder === 'string' && raw.boulder.length === raw.grid * raw.grid,
         'the rock is saved cell by cell')
    ];
  }]
];

export async function runTests() {
  const errs = [];
  const onErr = e => errs.push(String(e.message || e));
  addEventListener('error', onErr);

  dispatchEvent(new KeyboardEvent('keydown', { key: 'r' }));   // known state
  await sleep(600);

  const results = [];
  for (const [name, fn] of TESTS) {
    let checks;
    try {
      checks = await fn();
    } catch (e) {
      checks = [{ pass: false, what: 'threw', detail: String(e && e.stack || e) }];
    }
    for (const c of checks) results.push({ ...c, group: name });
  }
  removeEventListener('error', onErr);

  const failed = results.filter(r => !r.pass);
  console.log(`%c${results.length - failed.length}/${results.length} checks passed`,
              `font-weight:bold;color:${failed.length ? '#b00' : '#070'}`);
  for (const f of failed) console.warn(`FAIL  ${f.group}: ${f.what}${f.detail ? ` — ${f.detail}` : ''}`);
  if (errs.length) console.warn('errors during run:', errs);

  return {
    passed: results.length - failed.length,
    total: results.length,
    failures: failed.map(f => `${f.group}: ${f.what}${f.detail ? ` — ${f.detail}` : ''}`),
    errors: errs
  };
}

window.__test = runTests;
