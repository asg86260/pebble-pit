// The save in IndexedDB (DESIGN.md, "The save is in IndexedDB").
//
// The node yard has no IndexedDB, so every group here primes save.js with a
// fake -- a Map behind four promises, counting what reaches it -- and asks
// the questions the change is answerable for: does the autosave go to the
// database and not localStorage, does the boot read from it, does a save
// that was in localStorage come across once and leave localStorage, and does
// a full localStorage no longer cost the save. The last group is the bug:
// the same store refusing, and the sheet's line saying which way.

const { group, ok, state, run, yard } = await import('./helpers.mjs');
const { persist, restore, bootYard, exportSave, claimSave } = await import('../src/persist.js');
const { primeStore, storeSettled, storeTrouble, claimTab } = await import('../src/save.js');
const KEY = 'boulder-clicker/v4';

function fakeKv(seed = {}) {
  const m = new Map(Object.entries(seed));
  const kv = {
    m, sets: 0, gets: 0, refuse: null,
    get: async k => { kv.gets++; return m.has(k) ? m.get(k) : null; },
    set: async (k, v) => { kv.sets++; if (kv.refuse) throw kv.refuse; m.set(k, v); return true; },
    del: async k => { m.delete(k); return true; },
    all: async () => new Map(m)
  };
  return kv;
}
const onKv = kv => primeStore(() => Promise.resolve(kv));
const offKv = () => primeStore(() => Promise.resolve(null));

function played() {
  window.__crew(2);
  run(10);
  yard.S.dirty = true;
  persist();
  return exportSave();
}

group('the autosave goes to the database and the boot reads from it', async () => {
  localStorage.removeItem(KEY);
  const kv = fakeKv();
  await onKv(kv);
  const blob = played();
  await storeSettled();
  const inDb = kv.m.get(KEY) === blob;
  const notInLocal = localStorage.getItem(KEY) == null;
  const crew = state().crew;
  // a fresh page on the same database: a blank yard, primed again over what
  // the database held before the reset (a reset is a real clear, and goes
  // through the store like any other write), and the store read over it
  const disk = new Map(kv.m);
  window.__reset(true);
  await storeSettled();
  kv.m.clear();
  for (const [k, v] of disk) kv.m.set(k, v);
  await onKv(kv);
  restore();
  bootYard();
  const back = state().crew;
  await offKv();
  return [
    ok(inDb, 'the blob is in the database', `${kv.sets} sets`),
    ok(notInLocal, 'and not in localStorage'),
    ok(back === crew && back > 0, 'and a boot reads it back', `${back} vs ${crew}`),
    ok(yard.S.unsaved === false, 'a write the database took is not an unsaved yard')
  ];
});

group('a save that was in localStorage comes across once, and leaves it', async () => {
  const blob = played();             // on localStorage: the store is not primed
  const inLocal = localStorage.getItem(KEY) === blob;
  const kv = fakeKv();
  await onKv(kv);
  const carried = kv.m.get(KEY) === blob;
  const gone = localStorage.getItem(KEY) == null;
  restore();
  bootYard();
  const stood = state().stored === JSON.parse(blob).stored;
  await offKv();
  return [
    ok(inLocal, 'the save was in localStorage'),
    ok(carried, 'priming carries it into the database'),
    ok(gone, 'and lets go of the localStorage copy -- the shared quota gets it back'),
    ok(stood, 'and the yard is the one that was saved')
  ];
});

group('a full localStorage no longer costs the save', async () => {
  const kv = fakeKv();
  await onKv(kv);
  // localStorage refusing every write, the way a full origin does
  const real = localStorage.setItem;
  const quota = Object.assign(new Error('quota'), { name: 'QuotaExceededError' });
  localStorage.setItem = () => { throw quota; };
  let took, unsaved;
  try {
    const blob = played();
    await storeSettled();
    took = kv.m.get(KEY) === blob;
    unsaved = yard.S.unsaved;
  } finally {
    localStorage.setItem = real;
    await offKv();
  }
  return [
    ok(took, 'the save reached the database'),
    ok(unsaved === false, 'and the yard is not unsaved', String(unsaved))
  ];
});

group('the database refusing reads as an unsaved yard, and the store is on localStorage without one', async () => {
  const kv = fakeKv();
  await onKv(kv);
  kv.refuse = Object.assign(new Error('no room'), { name: 'QuotaExceededError' });
  played();
  await storeSettled();
  yard.S.dirty = true;
  persist();                         // one write behind: this one reports the last
  const said = yard.S.unsaved;
  const why = storeTrouble();
  await offKv();
  const blob = played();
  const onLocal = localStorage.getItem(KEY) === blob;
  return [
    ok(said === true, 'a refused write is an unsaved yard'),
    ok(why?.kind === 'full', 'and the store says it was full', JSON.stringify(why)),
    ok(onLocal, 'with no database the save is in localStorage, as before')
  ];
});

group('the sheet can tell blocked from full', async () => {
  await offKv();
  const real = localStorage.setItem;
  localStorage.setItem = () => { throw Object.assign(new Error('denied'), { name: 'SecurityError' }); };
  played();
  const blocked = storeTrouble();
  localStorage.setItem = () => { throw Object.assign(new Error('quota'), { name: 'QuotaExceededError' }); };
  yard.S.dirty = true;
  persist();
  const full = storeTrouble();
  localStorage.setItem = real;
  yard.S.dirty = true;
  persist();
  const after = storeTrouble();
  return [
    ok(blocked?.kind === 'blocked', 'a SecurityError is blocked', JSON.stringify(blocked)),
    ok(full?.kind === 'full' && full.used >= full.ours && full.ours > 0, 'a QuotaExceededError is full, with the count',
       JSON.stringify(full)),
    ok(after === null, 'and a write that takes clears it')
  ];
});

group('a claim that could not be written is no claim, so the page does not stand aside for a ghost', async () => {
  localStorage.setItem('boulder-clicker/v4.tab', 'someoldtab');
  const real = localStorage.setItem;
  localStorage.setItem = () => { throw Object.assign(new Error('quota'), { name: 'QuotaExceededError' }); };
  const took = claimTab();
  claimSave();
  localStorage.setItem = real;
  const blob = played();
  const yielded = yard.S.yielded;
  localStorage.removeItem('boulder-clicker/v4.tab');
  claimSave();
  return [
    ok(took === false, 'the claim says it did not take'),
    ok(!yielded && localStorage.getItem(KEY) === blob, 'and the page keeps writing', `yielded ${yielded}`)
  ];
});
