// Nothing in the sim says "rebuild the boards" or "this is worth saving".
//
// The boards are rebuilt by the frame, once, when `S.shopStale` says a step
// changed a row set (main.js); a press rebuilds them on its own frame
// (shop.js); and the hooks a check reads a board through (`__buy`, `__rows`)
// rebuild before they answer, so a check sees the board a player would see a
// frame later. The save runs on the clock and writes whether or not anything
// moved: there is no flag for it to wait on.

import { group, ok, run, runUntil, yard, buyNow } from './helpers.mjs';

const { persist, restore } = await import('../src/persist.js');
const KEY = 'boulder-clicker/v4';
const S = yard.S;

// The rows a board's element holds, by key: what `build` put in the DOM, as
// against what `__rows` computes.
const domKeys = id => document.getElementById(id).children.map(c => c.dataset.key).filter(Boolean);

group('a rung bought through the row is the next rung on the same call', async () => {
  window.__crew(2, 2);
  window.__grant({ dust: 1e6 });
  run(1);
  const before = window.__rows().find(r => r.key === 'carry');
  const was = S.carryLevel;
  // Every bench row is built rather than had, so the rung is the press and
  // the landing (`buyNow`); no frame turns between the landing and the read.
  const bought = buyNow('carry');
  const after = window.__rows().find(r => r.key === 'carry');
  return [
    ok(before && before.shown, 'the carry row is on the bench'),
    ok(bought && S.carryLevel === was + 1, 'and a rung of it was bought through the row',
       `${was} -> ${S.carryLevel}`),
    ok(!S.shopStale, 'the press left nothing for the frame to rebuild'),
    ok(after && after.shown, 'the row is still on the bench'),
    ok(JSON.stringify(after.bill) !== JSON.stringify(before.bill),
       'and it is already asking the next rung\'s bill',
       `${JSON.stringify(before.bill)} -> ${JSON.stringify(after.bill)}`),
    ok(domKeys('shop').includes('carry'), 'and the board\'s element holds it')
  ];
});

// A door landing by itself, frames after the press, with no hook between the
// landing and the read. The reload harness is a hook (`__reload` rebuilds the
// boards), so it is off for this one group: what is being read is the board
// on the first call after the landing, and a reload in between would be the
// thing rebuilding it.
group('a work that lands by itself is on the boards the next frame', async () => {
  window.__crew(3, 6);
  window.__answered('props');
  window.__grant({ dust: 1e9, shards: 1e7, spores: 1e7, cores: 1e5, sparks: 1e6 });
  run(1);
  const door = window.__rows().find(r => r.key === 'unlockfarm');
  const pressed = window.__buy('unlockfarm');
  const wasOpen = S.farmOpen;
  const landed = runUntil(() => S.farmOpen, 120);
  run(1 / 60);
  const crop = window.__rows().find(r => r.key === 'crop');
  return [
    ok(door && door.shown, 'the farm\'s door is on the bench'),
    ok(pressed, 'and it was pressed'),
    ok(!wasOpen, 'the ground is not open on the press: the yard has to build it'),
    ok(landed, 'the work landed with nobody asking after it'),
    ok(crop && crop.shown, 'and the farm\'s rows are shown a frame later'),
    ok(domKeys('farmshop').includes('crop'), 'on the farm\'s own element'),
    ok(!S.shopStale, 'with nothing left over for the frame')
  ];
}, { reload: false });

group('the save writes on the clock whether or not anything moved', async () => {
  window.__crew(2, 2);
  run(2);
  localStorage.removeItem(KEY);
  persist();
  const first = localStorage.getItem(KEY);
  // Nothing has moved: no frame, no press, no hook. The clock fires again.
  localStorage.removeItem(KEY);
  persist();
  const second = localStorage.getItem(KEY);
  const crew = S.workers.length, stored = S.stored;
  restore();
  // The one field a write owns is the moment it was written.
  const sans = raw => { const s = JSON.parse(raw); delete s.savedAt; return JSON.stringify(s); };
  return [
    ok(first && first.length > 0, 'the first tick wrote the yard'),
    ok(second && second.length > 0, 'and so did the next, with nothing changed since'),
    ok(sans(second) === sans(first), 'the same yard, but for the stamp'),
    ok(S.workers.length === crew && S.stored === stored,
       'and it reads back as the yard that was standing',
       `${S.workers.length} of ${crew} bodies, ${S.stored} of ${stored} dust`)
  ];
});
