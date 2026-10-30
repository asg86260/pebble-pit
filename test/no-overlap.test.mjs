// No two objects of different kinds share ground (the owner, 2026-10-19: "zero
// overlapping of elements of different objects, as a hard rule").
//
// The footprint table (src/footprints.js) says what each placed object takes
// up, place by place; rule 21 in verify.js asks it once a second of every
// group in every file. This file stands the yard in the stages the map goes
// through -- an early yard, a mid yard, the endgame with the casino and
// heaven's gates and stair, the deep, act 3, hell -- and asks of each:
//
//   - nothing overlaps that is not on KNOWN_OVERLAPS (verify.js), and
//   - every entry on KNOWN_OVERLAPS is seen to overlap in some stage here, so
//     a pair that has been moved apart has to come off the list.
//
// The list is the to-do list for placing things apart and only ever shrinks.

import { group, ok, run, yard } from './helpers.mjs';
import { footprints, allOverlaps } from '../src/footprints.js';
import { KNOWN_OVERLAPS } from '../src/verify.js';
import { SCENES } from '../src/scenes.js';
import { APOTH_POTS_MAX } from '../src/config.js';

const S = () => yard.S;
const seen = new Set();

// What overlaps now, as `place:a|b` keys, remembered for the last group.
const now = () => {
  const keys = allOverlaps().map(o => o.key);
  for (const k of keys) seen.add(k);
  return keys;
};
const idsIn = place => footprints(place).map(f => f.id);

// A stage's checks: every id the stage is about stands (so a stage that
// silently set up nothing cannot pass), and nothing unlisted overlaps.
const stage = (place, stands) => {
  const have = idsIn(place);
  const missing = stands.filter(id => !have.includes(id));
  const bad = allOverlaps().filter(o => !(o.key in KNOWN_OVERLAPS)).map(o => `${o.key} (${o.w} by ${o.h} cells)`);
  now();
  return [
    ok(missing.length === 0, `${place}: the stage stands what it is about`, `missing ${missing.join(', ')}; have ${have.join(', ')}`),
    ok(bad.length === 0, `${place}: no overlap that is not on KNOWN_OVERLAPS`, bad.join('; '))
  ];
};

// Every site of the yard open and every ladder of its growth topped, which is
// where the yard is widest: the walk (world.js, `placeSites`) steps the left
// sites left as the apothecary's pots and the farm's plots are bought.
function fullYard() {
  SCENES.everything.run();
  for (const k of ['casino', 'filter', 'apothecary', 'outhouse', 'tower', 'meteor']) S()[k + 'Open'] = true;
  S().seenBench = true;
  S().apothPots = APOTH_POTS_MAX;
  window.__fullSites();
}

group('an early yard has nothing on anything', async () => {
  window.__reset();
  window.__crew(2, 2, 1, 1);
  run(2);
  return stage('yard', ['rock', 'pit', 'house']);
});

group('a mid yard with its stations and machines built', async () => {
  SCENES.yard.run();
  run(2);
  return stage('yard', ['pit', 'house', 'farm', 'quarry']);
});

group('the endgame with the casino, heaven\'s gates and stair', async () => {
  fullYard();
  window.__actsOn(null);
  window.__actsAt('road');
  run(2);
  const road = stage('yard', ['casino', 'filter', 'apothecary', 'tower', 'rift', 'home', 'heaven-stairway']);
  return road;
});

// The mansion stands on the fallen house's ground, in its place.
group('the endgame with the mansion built beside heaven stair', async () => {
  fullYard();
  window.__actsOn(null);
  window.__actsAt('mansion');
  run(2);
  return stage('yard', ['mansion', 'mansion-blocks', 'heaven-stairway', 'casino']);
});

group('the deep, with the party and the crusher', async () => {
  SCENES.late.run();
  run(2);
  return stage('deep', ['crusher', 'pods', 's1']);
});

group('the deep with hell\'s slit open over it', async () => {
  SCENES.late.run();
  window.__actsOn(null);
  window.__actsAt('road');
  run(2);
  return stage('deep', ['crusher', 'pods', 'hell-slit']);
});

group('act 3, the camp, the grove and the gates from behind', async () => {
  SCENES['after-chain'].run();
  run(2);
  return stage('after', ['mill', 'workshop', 'shack', 'pedestal', 'tree:0', 'throne-stair']);
});

group('act 3 with heaven gates standing on the cloud floor', async () => {
  SCENES['after-chain'].run();
  window.__actsAt('road');
  run(2);
  return stage('after', ['heaven-gates']);
});

group('hell, its chambers, barriers and the ring', async () => {
  SCENES['hell-cage'].run();
  window.__actsAt('act4');
  run(2);
  return stage('hell', ['furnace:0', 'barrier:0', 'barrier:4', 'hell-ring']);
});

// Last: the list is exactly what the stages above saw. An entry that no stage
// overlaps is a pair that has been moved apart.
group('KNOWN_OVERLAPS lists exactly the overlaps there are', async () => {
  const listed = Object.keys(KNOWN_OVERLAPS);
  const stale = listed.filter(k => !seen.has(k));
  const unlisted = [...seen].filter(k => !listed.includes(k));
  return [
    ok(stale.length === 0, 'every listed overlap still overlaps (take a fixed pair off the list)', stale.join(', ')),
    ok(unlisted.length === 0, 'every overlap is listed', unlisted.join(', ')),
    ok(listed.every(k => KNOWN_OVERLAPS[k].length > 0), 'every listed pair says what it is')
  ];
});
