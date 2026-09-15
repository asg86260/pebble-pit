// The store seam (wave-desk-sound, track A).
//
// save.js keeps the save in localStorage on a page and behind `window.desk`
// in the Electron shell, and nothing above it is supposed to know which. So
// every group here puts a fake desk on the node yard's window -- five
// functions and a count of how often each was reached -- and asks the same
// questions the web checks ask: does the autosave write, does the boot read,
// is the blob the same blob either way, and do the two things the desk adds
// (the fallback to last-good, the migration from the browser) happen exactly
// when they should and no other time.

// The node yard is a dev build, and a dev build has no date to compare a
// save's against. This file stamps one before the yard loads -- a dynamic
// import, so the stamp is there when version.js reads it -- and the version
// boundary check below has something to be newer than.
globalThis.__BUILD__ = { version: '0.0.0', hash: 'test000', date: '2026-09-12' };
const { group, ok, state, run, yard, storeChecks } = await import('./helpers.mjs');
storeChecks();          // this file is about the store itself: no reload harness

const { persist, restore, exportSave, importSave, bootYard } = await import('../src/persist.js');
const { BROKEN_KEY } = await import('../src/save.js');
const KEY = 'boulder-clicker/v4';

// A desk whose disk is two strings. `write` answers as the real one does --
// a promise of a boolean -- and the count of each call is what the checks
// read. Installed on the window for one group and taken down after it, so
// the group reset (which clears the save) never reaches a stale one.
function fakeDesk({ current = null, lastGood = null } = {}) {
  const d = {
    reads: 0, writes: 0, written: [],
    disk: { current, lastGood },
    // one slot's disk: the adapter names the slot on every call, and slot 1
    // is the only one these groups play in
    read(slot) { d.reads++; return slot === 1 ? { current: d.disk.current, lastGood: d.disk.lastGood } : {}; },
    write(slot, raw) { d.writes++; d.written.push(raw); if (slot === 1) d.disk.current = raw; return Promise.resolve(true); },
    exportTo: () => Promise.resolve(true),
    importFrom: () => Promise.resolve(null),
    version: () => ({ hash: 'test', date: '' })
  };
  return d;
}
const onDesk = async (d, fn) => {
  window.desk = d;
  try { return await fn(); } finally { delete window.desk; }
};

// A yard worth telling apart from a fresh one: a crew, and time on the clock.
function played() {
  window.__crew(2, 2);
  run(20);
  yard.S.dirty = true;
  persist();
  return exportSave();
}

group('the autosave writes through the desk and the boot reads through it', async () => {
  const blob = played();
  const d = fakeDesk({ current: blob });
  return onDesk(d, () => {
    restore();
    bootYard();
    const readOnBoot = d.reads;
    const stored = state().stored;
    run(5);
    yard.S.dirty = true;
    persist();
    return [
      ok(readOnBoot > 0, 'restore reached desk.read', `${readOnBoot} reads`),
      ok(stored === JSON.parse(blob).stored, 'and the yard is the one on the desk',
         `${stored} vs ${JSON.parse(blob).stored}`),
      ok(d.writes === 1, 'persist reached desk.write, once', `${d.writes} writes`),
      ok(JSON.parse(d.written[0]).stored === state().stored,
         'with the yard as it stands'),
      ok(localStorage.getItem(KEY) === blob,
         'and localStorage was not written -- the file is the store now'),
      ok(yard.S.unsaved === false, 'a write the disk took is not an unsaved yard')
    ];
  });
});

group('the blob is the same blob either way', async () => {
  const web = played();
  const d = fakeDesk({ current: web });
  return onDesk(d, () => {
    const desk = exportSave();
    const took = importSave(desk);
    return [
      // but for the stamp of when, which is the one field the two writes differ in
      ok(desk.replace(/"savedAt":\d+/, '') === web.replace(/"savedAt":\d+/, ''),
         'exportSave on the desk is byte for byte the web one', `${desk.length} vs ${web.length} chars`),
      ok(took === true, 'importSave takes it on the desk'),
      ok(d.written.includes(desk), 'and the import wrote it through the desk'),
      ok(state().stored === JSON.parse(desk).stored, 'and the yard is the one in the blob')
    ];
  });
});

group('a current that will not read falls back to last-good, and says so', async () => {
  const good = played();
  const bad = '{"stored":"no","boulder":"x","gw":1,"gh":1}';
  const d = fakeDesk({ current: bad, lastGood: good });
  return onDesk(d, () => {
    restore();
    bootYard();
    const fell = yard.S.fellBack;
    const stored = state().stored;
    const who = yard.S.workers.length;
    const broken = localStorage.getItem(BROKEN_KEY());
    return [
      ok(fell === true, 'S.fellBack is set'),
      ok(stored === JSON.parse(good).stored, 'and the yard is the last-good one',
         `${stored} vs ${JSON.parse(good).stored}`),
      ok(who === JSON.parse(good).who.length, 'crew and all', `${who} bodies`),
      ok(broken === bad, 'the blob that would not read is put aside under BROKEN_KEY'),
      ok(yard.S.broken === false, 'but the sheet does not offer it over the yard that is standing'),
      ok(d.writes === 0, 'nothing was written by the fallback itself', `${d.writes} writes`)
    ];
  });
});

group('an empty current is a reset, not a reason to fall back', async () => {
  const good = played();
  const d = fakeDesk({ current: '', lastGood: good });
  return onDesk(d, () => {
    restore();
    bootYard();
    return [
      ok(yard.S.fellBack === false, 'no fallback'),
      ok(yard.S.workers.length === 0 && state().stored === 0, 'a fresh yard',
         `${yard.S.workers.length} bodies, ${state().stored} stored`),
      ok(d.writes === 0, 'and the browser save was not migrated over the reset', `${d.writes} writes`)
    ];
  });
});

group('the browser save migrates to the desk exactly once', async () => {
  const web = played();                    // under KEY in localStorage
  const d = fakeDesk();                    // a desk that has never held a save
  return onDesk(d, () => {
    restore();
    bootYard();
    const afterFirst = d.writes;
    const stored = state().stored;
    restore();                             // a second boot on the same desk
    bootYard();
    return [
      ok(afterFirst === 1, 'the first boot wrote once', `${afterFirst} writes`),
      ok(d.written[0] === web, 'and what it wrote is the browser save, byte for byte'),
      ok(stored === JSON.parse(web).stored, 'and booted that yard'),
      ok(d.writes === 1, 'the second boot wrote nothing', `${d.writes} writes`),
      ok(localStorage.getItem(KEY) === web, 'the localStorage copy is left where it was'),
      ok(yard.S.fellBack === false, 'and nothing fell back')
    ];
  });
});

group('a save from a newer build is loaded and said, once', async () => {
  const blob = played();
  const s = JSON.parse(blob);
  s.build = { hash: 'abc1234', date: '2099-01-01' };
  const { BUILD } = await import('../src/version.js');
  const d = fakeDesk({ current: JSON.stringify(s) });
  return onDesk(d, () => {
    restore();
    bootYard();
    const stored = state().stored;
    const newer = yard.S.newerSave;
    const readBuild = yard.S.build && yard.S.build.date;
    // ...and a save from an older build, or this one, says nothing
    s.build = { hash: 'old', date: '2020-01-01' };
    window.desk = fakeDesk({ current: JSON.stringify(s) });
    restore();
    bootYard();
    const older = yard.S.newerSave;
    yard.S.dirty = true;
    persist();
    const written = JSON.parse(exportSave()).build;
    return [
      ok(stored === s.stored, 'the save is loaded, not refused'),
      ok(readBuild === '2099-01-01', 'and its build is read into S.build', String(readBuild)),
      ok(newer === '2099-01-01', 'newerSave carries the date', `newer=${newer}`),
      ok(older === null, 'a save from an older build says nothing', `newer=${older}`),
      ok(written && written.hash === BUILD.hash && written.date === BUILD.date,
         'and the save this build writes carries this build, not the one it read',
         JSON.stringify(written))
    ];
  });
});

group('the disk refusing a write reads as an unsaved yard', async () => {
  played();
  const d = fakeDesk({ current: exportSave() });
  d.write = raw => { d.writes++; d.written.push(raw); return Promise.resolve(false); };
  return onDesk(d, async () => {
    restore();
    bootYard();
    yard.S.dirty = true;
    persist();
    await Promise.resolve();               // the disk answers
    const first = yard.S.unsaved;
    yard.S.dirty = true;
    persist();
    return [
      ok(first === false, 'the first write is taken on trust'),
      ok(yard.S.unsaved === true, 'and the next one carries what the disk said')
    ];
  });
});
