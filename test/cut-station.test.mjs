// A quarrier that is in the quarry is at its station. Reported 2026-09-13: on
// every refresh the gang came back on the far bank of the cut, shuffled the
// whole top of it to the ladder, climbed down and started again -- five
// seconds of loitering over a save that had them at work. The bank was the
// restore's doing (a body at ground height over the mouth is put on ground
// that is there), the shuffle was the descent's (brisk only past three hundred
// pixels from the ladder), and the round trip was the leg's (`to` always
// meant the rim). Three rules, one fact: down the hole is at work.

import { group, ok, run, runUntil, WORKER, P } from './helpers.mjs';
import { yard } from './helpers.mjs';
import { S, quarry } from '../src/state.js';
import { persist } from '../src/persist.js';
import { cutTop } from '../src/quarry.js';
import { commutePace } from '../src/upgrades.js';
import { QUARRY_WALK } from '../src/config.js';

const quarriers = () => S.workers.filter(w => w.type === 'quarrier');
const digging = () => quarriers().some(w => w.goal === 'work');
const dug = () => (S.quarryCells || []).reduce((a, b) => a + b, 0);

// The gang at work, then the save rewritten the way the report's must have
// been: every quarrier at ground height over the mouth, still marked at work.
const loadWithGangAtGroundHeight = () => {
  window.__crew(0, 0, 3, 0); window.__fullSites(); window.__tip(90000);
  runUntil(() => digging() && dug() > 30, 90);
  persist();
  const save = JSON.parse(localStorage.getItem('boulder-clicker/v4'));
  for (const w of save.who) if (w.type === 'quarrier') w.y = save.groundY - WORKER;
  localStorage.setItem('boulder-clicker/v4', JSON.stringify(save));
  const xs = save.who.filter(w => w.type === 'quarrier').map(w => w.x);
  yard.restore();
  return xs;
};

group('a working quarrier saved over the mouth comes back on the floor of the cut, not on the bank', async () => {
  const xs = loadWithGangAtGroundHeight();
  const after = quarriers();
  const onFloor = after.every(w => Math.abs(w.y + WORKER - cutTop(w.x + WORKER / 2)) <= P);
  const whereSaved = after.every((w, i) => Math.abs(w.x - xs[i]) < 1);
  const before = dug();
  const went = runUntil(() => dug() > before, 6);
  const stayedIn = after.every(w => w.x + WORKER > quarry.x && w.x < quarry.x + quarry.w);
  return [
    ok(after.length === 3, 'the three come back', `${after.length}`),
    ok(whereSaved, 'each where it was saved along the cut', JSON.stringify(after.map((w, i) => [Math.round(w.x), xs[i]]))),
    ok(onFloor, 'standing on the floor under its own feet', JSON.stringify(after.map(w => [Math.round(w.y + WORKER), Math.round(cutTop(w.x + WORKER / 2))]))),
    ok(went, 'and digging inside a few seconds', `${before} -> ${dug()}`),
    ok(stayedIn, 'without ever leaving the cut', JSON.stringify(after.map(w => Math.round(w.x))))
  ];
});

group('a quarrier told to go to the cut while standing on its floor simply works', async () => {
  window.__crew(0, 0, 2, 0); window.__fullSites(); window.__tip(90000);
  runUntil(() => quarriers().every(w => w.goal === 'work') && dug() > 20, 120);
  // The word a fresh hire carries, put on a body already down the hole.
  for (const w of quarriers()) { w.goal = 'to'; w.route = null; w.cell = null; }
  const before = dug();
  let leftTheCut = false;
  for (let i = 0; i < 60 && dug() === before; i++) {
    run(0.1);
    if (quarriers().some(w => w.y + WORKER < S.groundY - P)) leftTheCut = true;   // feet above the line: on the ladder
  }
  return [
    ok(dug() > before, 'it goes on digging', `${before} -> ${dug()}`),
    ok(!leftTheCut, 'and never climbs out to come back in', '')
  ];
});

group('the approach along the top of the cut is a walk, not the shuffle', async () => {
  // A quarrier put on the far bank with the ladder a stretch away: the time it
  // takes to reach the ladder's head says which pace it walked at.
  window.__crew(0, 0, 1, 0); window.__fullSites(); window.__tip(90000);
  runUntil(digging, 90);
  const w = quarriers()[0];
  w.goal = 'to'; w.route = null; w.cell = null;
  w.x = quarry.x + quarry.w + P * 4; w.y = S.groundY - WORKER;
  const from = w.x;
  const head = quarry.x;
  let frames = 0;
  for (; frames < 60 * 30; frames++) {
    run(1 / 60);
    if (w.x <= head + P * 3 || w.y + WORKER > S.groundY + 1) break;
  }
  const px = from - w.x;
  const shuffleFrames = px / QUARRY_WALK, walkFrames = px / commutePace();
  return [
    ok(frames < 60 * 30, 'it got to the ladder', `${frames} frames`),
    ok(frames < (shuffleFrames + walkFrames) / 2,
       'in walking time rather than shuffling time',
       `${frames} frames for ${Math.round(px)} px; a walk is ~${Math.round(walkFrames)}, the shuffle ~${Math.round(shuffleFrames)}`)
  ];
});
