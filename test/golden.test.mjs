// The same seed, the same yard.
//
// Every other check in this suite asserts something about *what* the yard does.
// This one asserts nothing about the yard at all. It says only that a run is a
// run: give the game a seed, work it hard for half a minute, write down what
// came of it, and then do the whole thing again from the same seed and get the
// same words back.
//
// That is worth its own file because it is the thing every other check leans on
// without saying so. A check that runs a busy yard and then measures it can only
// be as tight as the yard is repeatable, which is why so many of them are
// written with a band round the answer rather than the answer -- the band is not
// tolerance for the code, it is tolerance for the chance. Pin the chance and the
// bands can start coming in, and the three checks that used to fail under load
// and pass on the retry stop being weather.
//
// It is also the only check that would notice a stray `Math.random()`. There are
// none under src/ -- everything draws from `rand()` in rng.js -- but nothing
// stops one being written tomorrow, and a single one is enough to make every
// run different again while every other check in the suite carries on passing.
// One call site anywhere in the busy yard below, and the two digests part.
//
// What it does NOT do is hold a number from some other machine. A digest is a
// fact about a build, and the moment one is written down here every honest
// change to the game breaks this file and gets a golden constant edited rather
// than read. Same seed, same process, same answer is the whole claim, and it is
// the claim that catches what there is to catch.

import { test } from 'node:test';
import assert from 'node:assert/strict';
import { yard, state, run } from './helpers.mjs';
import { persist, restore } from '../src/persist.js';
import { load, save } from '../src/save.js';
import { seedRng, seed, rngState } from '../src/rng.js';

// FNV-1a over whatever we hand it. A hash rather than the string itself because
// the string is a few thousand characters of worker positions and grain counts,
// and what a failure has to say is "these two runs are not the same run" --
// which a pair of eight-character words says better than a pair of essays.
function digest(s) {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return (h >>> 0).toString(16).padStart(8, '0');
}

// What the yard is, in one string.
//
// Every field here is picked for being *stable* -- worked out from the game and
// nothing else. Anything read off the wall is left out on purpose: how long a
// frame took, how many frames a second, the device pixel ratio, the size of the
// window. So is the seed itself, which would otherwise be doing the comparing
// for us. What is left is where everybody is standing and what they are doing,
// how much of everything has been dug, carried, banked and grown, and where the
// loose stuff has settled in each of the two grids -- which is a broad enough
// net that a divergence anywhere in the sim lands in it within a second or two.
const CANON = [
  // where every body is, what it is at, and what it has done
  'workerPos', 'crewDetail', 'crewNames', 'commuting', 'moves', 'claims',
  // the rock, the cut and the plots
  'rock', 'boulderNo', 'depth', 'quarryDug', 'quarryOwed', 'seam', 'plots', 'plotTone',
  // what has been got out of them
  'stored', 'held', 'cores', 'shards', 'spores', 'sparks', 'floorGrains',
  // where the loose stuff came to rest
  'floor', 'pit', 'pitGrains', 'pitDust', 'findAll', 'findCells', 'pileCount',
  // the sky, which fouls and clears on its own
  'smog', 'sky', 'airX', 'airPos', 'wind',
  // and the crew's own comings and goings
  'roster', 'breaks', 'resting', 'inLoo', 'houses'
];

const canon = () => {
  const s = state();
  return CANON.map(k => `${k}=${JSON.stringify(s[k] ?? null)}`).join('\n');
};

// A yard with something going on in every corner of it. The point is coverage of
// the *chance*, not of the rules: every one of these places draws on `rand()`
// every frame -- the rock coming apart, the walk to the cut and back, the motes
// in the air, the muck going up into the sky, the breaks the crew take -- so a
// stray draw anywhere has somewhere to show itself.
function busyYard(seed) {
  window.__seed(seed);
  window.__fullSites();            // the quarry and the plots open, and the hats to work them
  window.__grant({ shards: 500, spores: 500, cores: 20, sparks: 200 });
  window.__crew(4, 4, 3, 3);       // miners, haulers, quarriers, farmhands
  window.__school({ breakers: 4, carters: 4, blasters: 3, growers: 3 });
  run(30);                         // half a minute of yard, in a few hundred ms
  return canon();
}

const SEED = 4242;

test('the same seed is the same run', () => {
  const first = busyYard(SEED);
  const again = busyYard(SEED);
  assert.equal(digest(again), digest(first),
    `two runs of seed ${SEED} came out differently.\n` +
    'Something in the sim is drawing on chance that is not seeded -- a stray\n' +
    'Math.random(), or a fact left over from the last run that the seeded restart\n' +
    'does not clear. See seedGame in src/hooks.js.');
});

// And the digest is actually looking at the yard. Without this the check above
// passes just as happily on a digest of the empty string, which is the way a
// determinism check usually dies: it goes on passing after it has stopped
// reading anything.
test('and a different seed is a different run', () => {
  const a = busyYard(SEED);
  const b = busyYard(SEED + 1);
  assert.notEqual(digest(b), digest(a),
    `seeds ${SEED} and ${SEED + 1} came out identical, so the digest is not ` +
    'reading the yard.');
});

// The seed is a fact the yard will tell you about itself. A check that fails
// somewhere else prints its snapshot, and the snapshot names the run.
test('and the yard says which run it is', () => {
  window.__seed(SEED);
  assert.equal(state().seed, SEED);
  window.__seed(SEED + 7);
  assert.equal(state().seed, SEED + 7);
  assert.equal(yard.state().workers, 1);   // and it really did start again
});


// --- and a run put down is the same run when it is picked up -----------------
//
// Everything above is about a run started twice from the same seed. These are
// about the other half of the same claim: a game closed halfway through and
// opened again is still the *same* run, rather than a second one wearing its
// name.
//
// The save is what has to carry that, and a seed on its own does not. A seed
// says where a run began; a game an hour in has taken hundreds of thousands of
// draws since, and restoring only the seed would start the stream over -- the
// yard going on from where it stood, with the chance of its own first minute.
// So the generator's one word of state is written down beside the seed. See
// rngState in src/rng.js and what persist.js does with it.

const writeSave = () => { yard.S.dirty = true; persist(); };

test('the save says which run it is and where the chance had got to', () => {
  window.__seed(SEED);
  run(5);
  const at = rngState();
  writeSave();
  const sv = load();
  assert.equal(sv.runSeed, SEED, 'the save did not name the run');
  assert.equal(sv.rngState, at,
    'the save named the run but not where it had got to, so a reload would ' +
    'start the whole stream again.');
});

// And the reload is governed by that word rather than by whatever the page
// happened to be drawing from. Read the same save twice onto two completely
// different streams and ask where the chance stands afterwards: it has to be
// the same place both times, because the save said where it stood. Without the
// state coming off the save the answer is worked out from whatever the page was
// already on, and the two part company -- which is a run that forks every time
// it is opened.
test('and a reload carries on the run rather than forking a new one', () => {
  window.__seed(SEED);
  run(5);
  writeSave();

  const openOn = before => { seedRng(before); restore(); return rngState(); };
  const a = openOn(1);
  const b = openOn(999999);

  assert.equal(b, a,
    'where the chance stood after a reload depended on what the page was ' +
    'drawing from before it, so the save is not saying where the run had got ' +
    'to. See setRngState in src/rng.js and what restore() does with it.');
});

// A save written before a run had a name still opens, and gets one. It carries
// neither number, and what it must not do is refuse to load or come back named
// after nothing: the generator seeds itself from entropy when the page loads
// (see rng.js), so such a game keeps the stream it is already on and is simply
// told what that is called.
test('a save from before a run had a name still opens, and is given one', () => {
  window.__seed(SEED);
  run(2);
  writeSave();
  const sv = load();
  delete sv.runSeed;
  delete sv.rngState;
  save(sv);

  seedRng(777);
  restore();
  assert.equal(state().runSeed, 777,
    'an old save came back without a name, or under somebody else name');
  assert.equal(seed(), 777, 'and it should not have disturbed the stream it found');
});


// --- and it opens where you left it ------------------------------------------
//
// Scrolling the yard is the one piece of "where I am" the player sets by hand,
// and a reload used to throw it away and march the view back to the rock. So
// the view goes in the save beside everything else, and comes back off it as
// `S.camWas` -- read once, at boot, by main.js. See the comment there.

test('the save says where the view was left', () => {
  window.__seed(SEED);
  run(2);
  const at = window.__look(state().worldW * 0.5);
  writeSave();
  assert.equal(load().camX, at,
    'the save does not carry the view, so a reload cannot put it back.');
});

test('and a reload hands that spot back for the view to open on', () => {
  window.__seed(SEED);
  run(2);
  const at = window.__look(state().worldW * 0.5);
  writeSave();

  window.__look(0);                          // the view somewhere else entirely
  restore();
  assert.equal(yard.S.camWas, at,
    'the spot came off the save wrong, so booting on it would put the view ' +
    'somewhere nobody left it.');
});

// And a save from before the view was written down opens on the rock rather
// than at nought -- which is the left-hand end of the world, and not a place
// anybody was looking. `null` is what tells main.js to fall back.
test('a save from before the view was kept opens on the rock', () => {
  window.__seed(SEED);
  run(2);
  writeSave();
  const sv = load();
  delete sv.camX;
  save(sv);

  window.__look(0);
  restore();
  assert.equal(yard.S.camWas, null,
    'an old save came back claiming to know where the view was.');
});
