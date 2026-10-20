// The polish bar's motion rules (docs/polish-bar.md, "Automated gates" 2):
// rule 22 in src/verify.js, "a body jumped" and "a body arrived at full
// ink", over every body in every place.
//
// The rule is watched by every group in the tier; this file is its guard.
// First, that it speaks: a body moved by more than a stride in a frame, or
// put into a place's list at full ink, is reported in the yard, act 3 and
// hell alike. Then KNOWN_MOTION, the cases it knows happen today: each is
// stood up here the way the group that found it stands it, and must still
// be seen. One that is no longer seen has been fixed and comes off the list.

import { group, ok, run, runUntil, yard, openSites, buyBuilt } from './helpers.mjs';
import { KNOWN_MOTION, MOTION_SEEN } from '../src/verify.js';
import { SCENES } from '../src/scenes.js';
import { GHOST_FADE_S } from '../src/config.js';
import { workAt } from '../src/works.js';

const S = yard.S;

// What one frame of the sim says, thrown or not.
const frame = () => { try { yard.fast(1 / 60); return null; } catch (e) { return String(e.message); } };
const settle = () => { for (let i = 0; i < 10; i++) yard.fast(1 / 60); };

group('a yard body moved a long way in a frame is reported', async () => {
  window.__reset();
  window.__crew(2, 0);
  run(3);
  settle();
  const w = S.workers.find(o => o.type === 'rockhand' && !o.lifted && !o.falling && !o.inside);
  w.x += 300;
  const said = frame();
  window.__reset();
  return [ok(said && said.includes('a body jumped') && said.includes('yard:rockhand'), 'the jump is named', said)];
}, { reload: false });

group('an act body moved a long way in a frame is reported, and one that pops in', async () => {
  SCENES['hell-forge'].run();
  window.__holdShot(0);   // a scene holds the clock for its shot; this is a check, not a shot
  window.__goPlace('hell');
  run(2);
  settle();
  const b = S.hell.bodies.find(o => o.job && !o.way.length);
  b.x += 300;
  const jumped = frame();
  settle();
  S.hell.bodies.push({ ...JSON.parse(JSON.stringify(b)), id: S.hell.nextId++, age: GHOST_FADE_S });
  const popped = frame();
  S.hell.bodies.pop();
  SCENES['act3-mid'].run();
  window.__holdShot(0);   // a scene holds the clock for its shot; this is a check, not a shot
  window.__goPlace('after');
  run(2);
  settle();
  const m = S.after.bodies.find(o => o.job && o.state === 'work' && !o.lifted);
  m.x += 300;
  const up = frame();
  window.__view('yard');
  window.__actsOn(null);
  return [
    ok(jumped && jumped.includes('a body jumped') && jumped.includes('hell:'), 'a ghost that jumps is named', jumped),
    ok(popped && popped.includes('a body arrived at full ink') && popped.includes('hell:'), 'a ghost that pops in is named', popped),
    ok(up && up.includes('a body jumped') && up.includes('after:'), 'a member that jumps is named', up)
  ];
}, { reload: false });

// --- the known cases, each stood up as the group that found it --------------------
const STAGED = {
  // test/route.test.mjs, "a hole has exactly one way out"
  'yard:quarrier.yard:jump': () => {
    window.__reset();
    window.__crew(2, 3, 4, 0);
    window.__fullSites();
    window.__grant({ sparks: 999, shards: 999, spores: 999 });
    run(40);
  },
  // test/kit.test.mjs, "the carts have no ceiling"
  'yard:builder-dance.yard:jump': () => {
    window.__reset();
    window.__grant({ shards: 100000, dust: 40000 });
    window.__kit({ learned: true });
    window.__crew(0, 3);
    for (let i = 0; i < 6; i++) buyBuilt('carter');
    for (let i = 0; i < 6; i++) buyBuilt('breaker');
  },
  // test/apothecary.test.mjs, "another pot is built at the hut"
  'yard:farmhand.yard:jump': () => {
    window.__reset();
    openSites();
    window.__crew(1, 3, 0, 1);
    window.__grant({ dust: 20000, spores: 2000, shards: 400, sparks: 200 });
    run(1);
    window.__buy('unlockapothecary');
    window.__finish();
    S.brews = 5;
    window.__crew(3, 8, 2, 3);
    window.__grant({ spores: 20000, shards: 4000 });
    window.__buy('anotherpot');
    runUntil(() => !workAt('apothecary'), 180);
    run(2);
  },
};

for (const [key, what] of Object.entries(KNOWN_MOTION)) {
  group(`still happens: ${key} (${what})`, async () => {
    MOTION_SEEN.delete(key);
    if (STAGED[key]) await STAGED[key]();
    return [ok(STAGED[key], 'the case is stood up here'),
            ok(MOTION_SEEN.has(key), 'and it is still seen (take a fixed case off KNOWN_MOTION)')];
  });
}
