// The landing page's words (DESIGN.md, "The landing page").
//
// The page itself is the browser tier's (src/selftest/settings.js, "the
// landing page reads the store"); what is checked here is what it reads:
// the label under `play`, the count on `saves`, and the record read off a
// save rather than off the yard -- each for an open, an empty and an
// unreadable slot -- and that picking a slot there moves the pointer and
// writes nothing.

const { group, ok, run, yard } = await import('./helpers.mjs');
const { persist, exportSave } = await import('../src/persist.js');
const { openSlot, setSlot, slotRaw, saveRaw, clear } = await import('../src/save.js');
const { playLabel, slotsLabel, slotLabels } = await import('../src/slots.js');
const { recordListOf, recordLabelOf } = await import('../src/record.js');
const { CATALOG } = await import('../src/catalog.js');
const KEY = 'boulder-clicker/v4';

const clean = () => {
  setSlot(1);
  for (const k of [KEY + '/2', KEY + '/3']) localStorage.removeItem(k);
};

group('play says what the open slot holds, without a yard number', async () => {
  clean();
  window.__crew(3);
  run(5);
  persist();
  const played = playLabel();
  setSlot(2);
  const empty = playLabel();
  saveRaw('{not a save');
  const bad = playLabel();
  clear();
  setSlot(1);
  return [
    ok(/^rock 1 · 3 crew · just now$/.test(played), 'a played slot: rock, crew, when', played),
    ok(empty === 'a new yard', 'an empty slot is a new yard', empty),
    ok(bad === 'unreadable', 'an unreadable one says so', bad),
    ok(slotsLabel() === 'saves · 1 of 3', 'and saves counts the yards', slotsLabel())
  ];
});

group('the record is read off a save, not the yard', async () => {
  clean();
  const won = ['firstgrain', 'crew0'];
  const rows = recordListOf(won, { firstgrain: 1, crew0: 2 });
  const none = recordListOf(undefined, undefined);
  return [
    ok(rows.length === 2 && rows[0].name === CATALOG.find(n => n.key === 'crew0').name,
       'newest first, named from the catalog', JSON.stringify(rows)),
    ok(none.length === 0 && recordLabelOf() === `achievements · 0 of ${CATALOG.length}`,
       'and no save is an empty record', recordLabelOf()),
    ok(recordLabelOf(won) === `achievements · 2 of ${CATALOG.length}`, 'with the count on the button')
  ];
});

group('picking a slot on the landing page moves the pointer and writes nothing', async () => {
  clean();
  window.__crew(2);
  run(5);
  persist();
  const blob = exportSave();
  setSlot(3);                                  // what the saves page does there
  const rows = slotLabels(Date.now(), false);
  const back = slotRaw(1);
  const open = openSlot();
  setSlot(1);
  return [
    ok(open === 3 && rows[2].open && !rows[0].open, 'slot 3 is the open one', JSON.stringify(rows.map(r => r.open))),
    ok(!rows[0].text.includes('playing'), 'and no row says playing, since nothing is', rows[0].text),
    ok(back === blob && slotRaw(3) == null, 'slot 1 is untouched and slot 3 still empty')
  ];
});
