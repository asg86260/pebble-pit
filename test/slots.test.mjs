// The save slots (DESIGN.md, "Save slots and the title page").
//
// Three yards, one open at a time, each its own autosave. Every group here is
// about the one promise that makes a slot a yard rather than a snapshot: the
// yard you left is untouched under its own key while you are in another, and
// comes back whole. The switch is reached through `__slot`, which is the same
// `switchSlot` the saves page presses; the page itself is the browser tier's.

const { group, ok, state, run, yard } = await import('./helpers.mjs');
const { persist, exportSave, importSave, claimSave } = await import('../src/persist.js');
const { openSlot, setSlot, slotRaw } = await import('../src/save.js');
const { slotLabels, since } = await import('../src/slots.js');
const KEY = 'boulder-clicker/v4';

// A yard worth telling apart from a fresh one, and its blob.
function played(crew = 2) {
  window.__crew(crew);
  run(10);
  yard.S.dirty = true;
  persist();
  return exportSave();
}

// Every group starts in slot 1 with the other two empty, whatever the last
// group left: the slot is a page fact and the group reset does not touch it.
const clean = () => {
  setSlot(1);
  for (const k of [KEY + '/2', KEY + '/3', KEY + '/2.tab', KEY + '/3.tab']) localStorage.removeItem(k);
};

group('stepping into an empty slot is the new game, and the yard you left stays', async () => {
  clean();
  const first = played(3);
  window.__slot(2);
  const fresh = state();
  run(3);                                        // the interval writes the new slot
  return [
    ok(openSlot() === 2, 'slot 2 is open', `slot ${openSlot()}`),
    ok(fresh.crew === 0 && fresh.intro, 'and the intro is standing in it', `${fresh.crew} crew, intro ${fresh.intro}`),
    ok(localStorage.getItem(KEY) === first, 'slot 1 still holds the yard exactly as it was left'),
    ok(!!localStorage.getItem(KEY + '/2'), 'and slot 2 has a blob of its own now')
  ];
});

group('the first yard comes back whole from the other slot', async () => {
  clean();
  played(3);
  const rock = yard.S.boulderNo;
  const crew = state().crew;
  window.__slot(2);
  played(1);
  window.__slot(1);
  const back = state();
  return [
    ok(openSlot() === 1, 'slot 1 is open again'),
    ok(back.crew === crew && !back.intro, 'with its crew and no intro', `${back.crew} vs ${crew}`),
    ok(yard.S.boulderNo === rock, 'and its rock', `${yard.S.boulderNo} vs ${rock}`),
    ok(JSON.parse(slotRaw(2)).crew === 1, 'and slot 2 kept its own yard')
  ];
});

group('the labels read what each slot holds', async () => {
  clean();
  played(3);
  window.__slot(2);
  played(1);
  const rows = slotLabels();
  const back = slotLabels(Date.now());
  return [
    ok(rows[0].text.startsWith('1 · rock 1 · 3 crew · just now'), 'slot 1: rock, crew, when', rows[0].text),
    ok(rows[1].text === '2 · rock 1 · 1 crew · playing' && rows[1].open, 'slot 2: playing', rows[1].text),
    ok(rows[2].text === '3 · empty' && rows[2].empty, 'slot 3: empty', rows[2].text),
    ok(since(0, 5 * 3600 * 1000) === '5 h ago' && since(0, 3 * 86400 * 1000) === '3 days ago' &&
       since(0, 90 * 1000) === '1 min ago', 'and the time is the coarse kind'),
    ok(back.length === 3, 'three rows, always')
  ];
});

group('a reset erases the open slot only', async () => {
  clean();
  const first = played(3);
  window.__slot(2);
  played(1);
  window.__reset(true, true);                    // the player's reset: the open slot
  return [
    ok(state().crew === 0, 'slot 2 is a fresh yard'),
    ok(localStorage.getItem(KEY) === first, 'and slot 1 was not touched')
  ];
});

group('an import lands in the open slot only', async () => {
  clean();
  const first = played(3);
  window.__slot(2);
  played(1);
  const took = importSave(first);
  return [
    ok(took && state().crew === 3, 'the imported yard is standing in slot 2', `${state().crew} crew`),
    ok(localStorage.getItem(KEY) === first, 'slot 1 is as it was'),
    ok(openSlot() === 2, 'and slot 2 is still the open one')
  ];
});

// The tab-owner key follows the slot, and the boot claimed the slot it
// opened in. A switch that did not claim the new slot found some earlier
// page's name there, took it for another tab, and yielded every write: the
// yard was switched into and never saved.
group('switching slots claims the new slot, so its autosave is not yielded to a ghost', async () => {
  clean();
  claimSave();                                   // as the boot does: this page is the writer
  played(2);
  localStorage.setItem(KEY + '/2.tab', 'someoldpage');
  window.__slot(2);
  window.__crew(1);
  run(5);
  yard.S.dirty = true;
  persist();
  const blob = slotRaw(2);
  const crew = blob ? JSON.parse(blob).crew : null;
  return [
    ok(!yard.S.yielded, 'the page did not stand aside', String(yard.S.yielded)),
    ok(crew === 1, 'and slot 2 holds the yard played in it', `${crew} crew`)
  ];
});

group('the harness door lets the hold go', async () => {
  yard.S.paused = true;
  window.__reset(true);
  return [ok(!yard.S.paused, 'a fresh game is not held')];
});
