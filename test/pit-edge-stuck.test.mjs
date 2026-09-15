// A yard from the field, loaded whole: boulder 46, thirty-one crew, the belt
// bought and running, the rift open.
//
// The player reported "a stuck worker at the edge of the pit" -- twice, the
// second time after the fix that cut the nine haulers parked at the belt's post
// down to one. The one left is the belt's tender, and the belt runs while it
// stands there; what was wrong was the card over its head, which read "looking
// for pebbles" for the rest of the run, because the tender stage writes no goal
// and the card read the goal. A body standing still at the lip saying it is
// looking for something is a stuck body, whatever the machine behind it is
// doing. So the card asks the machines (`minding`, crew/tenders.js).
//
// What is asserted: after a while, one body stands at the belt's post, its card
// says it is minding the belt, the belt is manned, and no body that has not
// covered ground says it is looking for something.

import { readFileSync } from 'node:fs';
import { yard, group, ok, run, WORKER, P } from './helpers.mjs';
import { card } from '../src/crewboard.js';
import { beltRunning, beltPost } from '../src/dust.js';
import { now } from '../src/clock.js';

group('the belt\'s tender at the lip says so, and nobody else stands still', async () => {
  localStorage.setItem('boulder-clicker/v4',
    readFileSync(new URL('./fixtures/pit-edge-stuck.json', import.meta.url), 'utf8'));
  yard.restore();
  const S = yard.S;
  // By name, not by object: `run` saves and reads the yard back every five
  // seconds (helpers.mjs), and the bodies that come back are new objects.
  const from = new Map(S.workers.map(w => [w.name, w.x]));
  const span = new Map(S.workers.map(w => [w.name, 0]));
  // Thirty-one, not thirty: the reload lands on every fifth second, and
  // whether the belt is manned is a stamp the save does not carry, so a
  // reading taken on the reload's own frame finds it blank.
  for (let i = 0; i < 31; i++) {
    run(1);
    for (const w of S.workers) if (span.has(w.name)) span.set(w.name, Math.max(span.get(w.name), Math.abs(w.x - from.get(w.name))));
  }
  const post = beltPost();
  const still = S.workers.filter(w => span.has(w.name) && span.get(w.name) < P);
  const line = w => card(w).split(String.fromCharCode(10))[2];
  const tender = still.filter(w => Math.abs(w.x - post) < WORKER * 3);
  // A body that has not moved and says it is looking for something, or doing
  // nothing much, is what a player calls stuck. A farmhand at its plot barely
  // moves either, and its card says "tending a plot", which is the difference.
  const stuck = still.filter(w => /looking for|nothing much/.test(line(w)));
  // read before the roster is cleared: both are asked of the bodies
  const tenderLines = tender.map(line);
  const running = beltRunning(now());
  window.__crew(0, 0);
  return [
    ok(tender.length === 1, 'one body stands at the belt\'s post',
       tender.map(w => `${w.type} ${w.name} at ${Math.round(w.x)}`).join(', ')),
    ok(tenderLines.every(l => l.includes('minding the belt')), 'and its card says it is minding the belt',
       tenderLines.join(' | ')),
    ok(running, 'and the belt is running'),
    ok(stuck.length === 0, 'and no body standing still says it is looking for something',
       stuck.map(w => `${w.type} ${w.name} at ${Math.round(w.x)}: ${line(w)}`).join(', '))
  ];
}, 20250830);
