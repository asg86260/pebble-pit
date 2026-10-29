// Nothing a page does to its own save claim stops it saving, a page another
// tab has really overtaken knows it without the game stopping, and the save
// before a shape change is kept (CHANGELOG, 2026-10-29: a refresh lost the
// ram and the wizards).
//
// A page stands aside when another page's name is beside the save, and the
// game plays on whatever happens to the writes, so a page that stood aside
// for the wrong reason played on with nothing written until a refresh read
// the old copy. These are the ways in: a second copy of the save module in
// the same page (the dev server serving it again after an edit), another
// tab, a page booted unseen, and the store refusing. What the player sees of
// each is the save mark (savemark.js), which reads `S.yielded` and
// `S.unsaved`; src/selftest/savemark.js checks the mark itself.

const { group, ok, run, yard, storeChecks } = await import('./helpers.mjs');
storeChecks();          // this file is about the store itself: no reload harness
const { readFileSync } = await import('node:fs');
const { persist, restore, bootYard, claimSave, claimAtBoot, setSeen, lastLanded } = await import('../src/persist.js');
const { primeStore, storeSettled, TAB } = await import('../src/save.js');
const { SAVE_V } = await import('../src/config/saves.js');
const KEY = 'boulder-clicker/v4';
const TAB_KEY = KEY + '.tab';

// Back to a page on screen that holds the slot and has nothing to say.
function settle() {
  setSeen(() => true);
  localStorage.removeItem(TAB_KEY);
  yard.S.yielded = false;
  yard.S.unsaved = false;
  claimSave();
}
const savedAt = () => JSON.parse(localStorage.getItem(KEY) || '{}').savedAt;
// a moment of wall time, so two saves carry two stamps
const tick = () => { const t = Date.now(); while (Date.now() === t) { /* wait */ } };

group('a second copy of the save module in the same page does not take the save from the game', async () => {
  settle();
  window.__crew(2);
  run(2);
  persist();
  // the dev server's copy of the file after an edit: a new module instance in
  // the same page, which names itself and claims the slot
  const again = await import('../src/save.js?edited=' + Date.now());
  again.claimTab(Date.now() + 60_000);
  tick();
  const before = savedAt();
  run(2);
  persist();
  const after = savedAt();
  const yielded = yard.S.yielded;
  settle();
  return [
    ok(again.TAB === TAB, 'the copy is the same writer', `${again.TAB} vs ${TAB}`),
    ok(!yielded && after > before, 'and the game goes on saving', `yielded ${yielded}, ${before} -> ${after}`)
  ];
});

group('another tab with a newer save is stood aside for without stopping the game, and taken back from once it is not', async () => {
  settle();
  window.__crew(2);
  run(2);
  persist();
  const mine = localStorage.getItem(KEY);
  localStorage.setItem(TAB_KEY, 'anothertab ' + (Date.now() + 60_000));   // a page writing ahead of this one
  run(2);
  persist();
  const untouched = localStorage.getItem(KEY) === mine;
  const yielded = yard.S.yielded;
  const playing = !yard.S.paused;
  // the other page's last save is no newer than this yard -- it has gone, or
  // it never wrote -- and this page is on screen
  localStorage.setItem(TAB_KEY, 'anothertab ' + (savedAt() - 1));
  tick();
  run(2);
  persist();
  const took = !yard.S.yielded && localStorage.getItem(KEY) !== mine && localStorage.getItem(TAB_KEY).startsWith(TAB + ' ');
  settle();
  return [
    ok(yielded && untouched, 'the newer save is left alone, and the page knows'),
    ok(playing, 'and the game plays on'),
    ok(took, 'a page on screen with the newest yard takes the slot back by itself')
  ];
});

group('a page booted unseen writes nothing until it is looked at', async () => {
  settle();
  persist();
  const before = localStorage.getItem(KEY);
  let onScreen = false;
  setSeen(() => onScreen);
  claimAtBoot(true);
  tick();
  run(2);
  persist();
  const untouched = localStorage.getItem(KEY) === before;
  const yielded = yard.S.yielded;
  onScreen = true;
  tick();
  run(2);
  persist();
  const wrote = localStorage.getItem(KEY) !== before && !yard.S.yielded;
  settle();
  return [
    ok(untouched && yielded, 'unseen, it writes nothing'),
    ok(wrote, 'looked at, with nothing newer written, it saves')
  ];
});

group('a landed save is told to the mark, and a refused one is not', async () => {
  settle();
  tick();
  persist();
  const landed = lastLanded();
  const kv = {
    m: new Map(),
    get: async k => kv.m.get(k) ?? null,
    set: async () => { throw Object.assign(new Error('quota'), { name: 'QuotaExceededError' }); },
    del: async k => { kv.m.delete(k); return true; },
    all: async () => new Map(kv.m)
  };
  await primeStore(() => Promise.resolve(kv));
  persist();
  await storeSettled();
  const lastTaken = lastLanded();  // the store answers one write behind
  tick();
  persist();
  const unsaved = yard.S.unsaved;
  const stillLanded = lastLanded();
  await primeStore(() => Promise.resolve(null));
  settle();
  return [
    ok(landed > 0 && landed === savedAt(), 'a save that landed is the one the mark shows'),
    ok(unsaved && !yard.S.paused, 'a refused one is known, and the game plays on'),
    ok(stillLanded === lastTaken, 'and is not shown as landed', `${lastTaken} -> ${stillLanded}`)
  ];
});

// The database as a Map behind the four calls save.js makes of it.
function fakeKv(seed = {}) {
  const m = new Map(Object.entries(seed));
  return {
    m,
    get: async k => m.get(k) ?? null,
    set: async (k, v) => { m.set(k, v); return true; },
    del: async k => { m.delete(k); return true; },
    all: async () => new Map(m)
  };
}

group('a save in an older shape is kept aside before the migrations rewrite it', async () => {
  settle();
  const raw = readFileSync(new URL('./fixtures/act3-before-cut.json', import.meta.url), 'utf8');
  const was = JSON.parse(raw).saveV;
  const kv = fakeKv({ [KEY]: raw });
  await primeStore(() => Promise.resolve(kv));
  restore();
  bootYard();
  await storeSettled();
  const kept = kv.m.get(KEY + '.premig');
  persist();                       // the migrated yard over the only copy
  await storeSettled();
  await primeStore(() => Promise.resolve(kv));   // a fresh page on the same database
  restore();                       // read again, in today's shape
  bootYard();
  await storeSettled();
  const still = kv.m.get(KEY + '.premig');
  const now = JSON.parse(kv.m.get(KEY)).saveV;
  await primeStore(() => Promise.resolve(null));
  settle();
  return [
    ok(was < SAVE_V, "the fixture is from before today's shape", `saveV ${was} vs ${SAVE_V}`),
    ok(kept === raw, 'the blob as it was is kept, byte for byte'),
    ok(now === SAVE_V && still === raw, "and a load in today's shape does not write over it")
  ];
});

group('on the localStorage fallback no second copy is written', async () => {
  settle();
  const raw = readFileSync(new URL('./fixtures/act3-before-cut.json', import.meta.url), 'utf8');
  localStorage.removeItem(KEY + '.premig');
  localStorage.setItem(KEY, raw);
  restore();
  bootYard();
  const none = localStorage.getItem(KEY + '.premig') == null;
  settle();
  return [ok(none, 'its few shared megabytes are left to the save itself')];
});
