// A yard from the field whose crew grew by three on every refresh: 161 bodies
// on the roster, 132 of them in threes that had all been stood up in the same
// instant. The three were the wizards. Their count was read back after the
// load's deal (`STAFF` in persist.js's `SAVERS`), so the deal counted them as
// spare, dealt three more haulers than the roster held, and `syncWorkers`
// stood a body up for each. The next load found more bodies than crew and
// grew the crew to match, and so on, three at a time, for ever.
//
// What is asserted is the outcome: however many times the save is read back,
// the crew and the bodies in the yard stay the size the save says.

import { readFileSync } from 'node:fs';
import { yard, group, ok, run } from './helpers.mjs';

const KEY = 'boulder-clicker/v4';
const raw = readFileSync(new URL('./fixtures/crew-grows-on-load.json', import.meta.url), 'utf8');
const saved = JSON.parse(raw);

// Read back the way a fresh page reads it: nothing of the old yard in memory.
const load = text => {
  window.__reset();
  localStorage.setItem(KEY, text);
  yard.restore();
};
const count = () => ({ crew: yard.S.crew, bodies: yard.S.workers.length, haulers: yard.S.haulers });

group('a refresh does not stand up more crew than the save holds', async () => {
  load(raw);
  const first = count();
  const seen = [first];
  for (let i = 0; i < 3; i++) {
    run(1);
    yard.persist();
    load(localStorage.getItem(KEY));
    seen.push(count());
  }
  const want = saved.who.length;
  // The save is from when the air filter seated a purifier of its own; the
  // purifiers are one a balloon now, so the one past the craft is spare and
  // dealt to the haulers like any other.
  const unseated = Math.max(0, saved.purifiers - saved.craft.length);
  return [
    ok(first.crew === saved.crew && first.bodies === want,
       'the first load has the crew the save has', `${saved.crew} saved -> ${JSON.stringify(first)}`),
    ok(first.haulers === saved.haulers + unseated,
       'and deals the same number of haulers', `${saved.haulers} saved + ${unseated} unseated -> ${first.haulers}`),
    ok(seen.every(c => c.crew === want && c.bodies === want),
       'and nobody is added on any reload after it', JSON.stringify(seen))
  ];
}, { reload: false });
