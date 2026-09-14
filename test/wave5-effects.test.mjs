// Wave 5, track F4: the black hole, a crit landing, the celebration, and the
// tonic on a body.
//
// Four features that are mostly *looked at*, which is why each check here is
// written against the one fact underneath the picture rather than against the
// picture: nothing in either tier can see a cell, so a check that claimed to
// would be a check about nothing. What the black hole looks like is settled by
// `node tools/look.mjs rift`; what it DOES -- that nothing settles on the pit
// floor while it is open -- is settled here.

import { group, ok, run, runUntil, state, yard, haveRock } from './helpers.mjs';
import { S, pit } from '../src/state.js';
import { critMult } from '../src/crit.js';
import { CRIT_MOTES, CRIT_RING_MS, RIFT_INHALE_MAX } from '../src/config.js';
import { MOVE_KEYS } from '../src/crew/dance.js';
import { shockReach } from '../src/shock.js';
import { TOWER_UPGRADES, TOWER_SECTIONS } from '../src/tower.js';
import { STEPS } from '../src/game.js';

// --- the rift ------------------------------------------------------------------

// A yard whose hole has given way. It is not bought and never was: the hole
// collapses the first time it cannot take a grain, so the way a player gets one
// is to fill the hole -- which is what this does.
// A hole torn AND grown. The two checks below are about the far end of the
// arc -- everything, on the frame it lands -- and since the reach landed
// (rift.js, `riftReach`; docs/critics-2026-09-10.md, B5) a freshly torn hole
// skims the pile under its mouth and leaves the rest standing. The eating-
// everything rule is the grown hole's, so that is the hole these use.
function tornYard() {
  window.__reset();
  window.__crew(0, 4);
  window.__fullSites();
  window.__meteor();
  window.__give(60000);              // more than the hole holds: it gives way
  run(4);                            // and the tearing takes the pile with it
  window.__rift();                   // ...and it has since eaten its fill: the abyss, at full reach
  run(1);
}

group('a grown black hole inhales: nothing settles on the pit floor', async () => {
  tornYard();
  const before = state();
  const pile = 5000;                 // a known pile, tipped into a hole that is open

  window.__give(pile);
  // One second is a long time for something that takes everything on the frame
  // it lands, and the point is that no amount of waiting finds a grain down
  // there: the floor is empty every time it is asked.
  let everSettled = 0;
  for (let i = 0; i < 60; i++) { run(1 / 60); everSettled = Math.max(everSettled, pit.n); }
  const after = state();

  return [
    ok(before.riftOpen, 'the hole gave way when it was filled', `${before.riftOpen}`),
    ok(after.pitGrains === 0, 'and the pit floor holds nothing at all',
       `${after.pitGrains} grains`),
    ok(after.rift - before.rift === pile, 'the rift banked every grain of it',
       `${before.rift} -> ${after.rift}, against ${pile} thrown in`),
    ok(after.stored === before.stored + pile, 'and none of it was spent or lost',
       `${before.stored} -> ${after.stored}`),
    ok(after.pitDust + after.rift === after.stored,
       'the pile and the rift are still the counter',
       `${after.pitDust} + ${after.rift} against ${after.stored}`),
    // The ceiling is a ceiling on ONE FRAME, not a rate: it is there so that a
    // hundred thousand grains arriving at once are taken over a handful of
    // frames rather than walking a million cells inside one. Anything the yard
    // can earn in a frame is orders under it.
    ok(everSettled <= RIFT_INHALE_MAX,
       'nothing ever stood in the hole past what one frame may take',
       `${everSettled} at the most, ceiling ${RIFT_INHALE_MAX}`)
  ];
});

group('there is no row anywhere that summons or widens the black hole', async () => {
  tornYard();
  window.__grant({ sparks: 9999 });
  const rows = window.__rows();

  return [
    ok(!rows.some(r => r.key === 'riftrate'),
       'no row widens it, on the tower or anywhere else',
       rows.filter(r => /rift/.test(r.key)).map(r => r.key).join(',') || 'none'),
    ok(!rows.some(r => r.key === 'rift'), 'and none sells one'),
    ok(!TOWER_UPGRADES.some(r => r.key === 'riftrate'),
       'the tower does not carry the row at all'),
    ok(!TOWER_SECTIONS.some(s => s.title === 'the black hole'),
       'and there is no section left standing empty over it',
       TOWER_SECTIONS.map(s => s.title).join(' | '))
  ];
});

// A save from the build where the ladder existed. Nothing is refunded and
// nothing is lost: the rungs collapse into behavior the yard now has for free,
// and the field is still read off the file so an old save loads clean.
group('a save that bought the old widenings still loads, and pulls the same', async () => {
  tornYard();
  window.__give(4000);
  run(0.5);
  const plain = state().rift;

  // Written down as it stands -- the store otherwise holds whatever the last
  // group left, which since the reach landed is a hole of some other size.
  yard.S.dirty = true;
  yard.persist();
  const save = JSON.parse(localStorage.getItem('boulder-clicker/v4') || '{}');
  save.riftLevel = 7;
  save.riftOpen = true;
  localStorage.setItem('boulder-clicker/v4', JSON.stringify(save));
  yard.restore();
  const back = state();

  window.__give(4000);
  const was = state().rift;
  run(0.5);
  const took = state().rift - was;

  return [
    ok(back.riftLevel === 7, 'the field a widened save carries is still read back',
       `${back.riftLevel}`),
    ok(back.riftOpen, 'and the rift is open, the way the save left it'),
    ok(took === 4000, 'and it takes everything, the same as a save that bought none',
       `${took} of 4000, against a plain yard's ${plain}`),
    ok(state().pitGrains === 0, 'the floor is empty under it', `${state().pitGrains}`)
  ];
});

// --- a crit landing --------------------------------------------------------------

group('a crit leaves one shock, however many grains it threw', async () => {
  haveRock();
  window.__crew(0, 0);                       // one swing, and only ours
  window.__clearFloor();
  window.__crit(true);
  run(0.2);
  S.shocks.length = 0;
  S.shockMotes.length = 0;

  const rock0 = state().rock;
  window.__swing(1);                         // one crit swing, by hand
  const grains = rock0 - state().rock;
  const rings = S.shocks.length;
  const power = rings ? S.shocks[0].power : 0;
  const motes = S.shockMotes.length;

  // The ring goes OUT: it is bigger a moment later, and it is gone by the time
  // its run is over.
  const first = shockReach(S.shocks[0]);
  run(CRIT_RING_MS / 3000);
  const wider = S.shocks.length ? shockReach(S.shocks[0]) : 0;
  run(CRIT_RING_MS / 1000);
  const left = S.shocks.length;
  window.__crit(null);

  return [
    ok(grains > 1, 'the crit swing took several pixels', `${grains}`),
    ok(rings === 1, 'one blow, one ring -- not one a grain',
       `${rings} rings for ${grains} grains`),
    ok(power === critMult(), 'and the ring is the size of the crit that threw it',
       `${power} against ${critMult()}`),
    ok(motes === Math.round(CRIT_MOTES * power), 'with its specks scaled the same way',
       `${motes} against ${Math.round(CRIT_MOTES * power)}`),
    ok(wider > first, 'the ring is wider a moment later',
       `${first.toFixed(1)} -> ${wider.toFixed(1)}`),
    ok(left === 0, 'and it has run out by the end of its life', `${left} left`)
  ];
});

// --- the celebration -------------------------------------------------------------

group('the celebration is jumping, and nothing but jumping', async () => {
  window.__reset();
  window.__crew(3, 3);
  // The first rock, because it is the only rock that gets a dance now (wave
  // polish, 2026-09-14, Track A) -- and with the reunion already behind it,
  // since the first rock's finish is otherwise the meeting, where by design
  // (wave 7, item 5) nobody jumps.
  S.reunionDone = true;
  run(2);
  window.__next();                           // the rock goes off; the yard dances
  run(1 / 60);

  // A frame at a time, per body: how high it is off its own footing, and how far
  // along the ground it has moved. A jump moves the first and not the second --
  // that is the whole of what "no shuffle" means, said as a number.
  const was = S.workers.map(w => w.x);
  let ground = 0, air = 0;
  for (let f = 0; f < 180; f++) {
    run(1 / 60);
    const t = yard.clock.now();
    S.workers.forEach((w, i) => {
      if (w.jigOn !== t) { was[i] = w.x; return; }   // not dancing this frame
      ground = Math.max(ground, Math.abs(w.x - was[i]));
      if (w.foot != null) air = Math.max(air, w.foot - w.y);
      was[i] = w.x;
    });
  }

  return [
    ok(MOVE_KEYS.length === 1 && MOVE_KEYS[0] === 'jump',
       'the dance has one move and it is the jump', MOVE_KEYS.join(',')),
    ok(air > 6, 'a dancing body leaves the ground', `${air.toFixed(1)}px at the top`),
    // Not a tolerance: a jump writes `w.y` and never `w.x`, so the ground a
    // dancing body covers is nought exactly. The old step paced two cells a
    // frame across a patch fourteen cells wide.
    ok(ground === 0, 'and covers no ground at all while it does',
       `${ground.toFixed(3)}px in a frame`)
  ];
});

// --- the tonic on a body ---------------------------------------------------------
//
// **Item 6 is withdrawn.** It read the plume's trail as a bug -- the same buff
// wearing a different face depending on which way a body walked and how fast --
// and the answer built for it drew the haze on the body's own box instead, with
// nothing let go into the yard. Looked at in the running game that was the wrong
// call and the user said so: the plume let go behind a walking body is the point
// of it, and the yard is back to what it did before the wave.
//
// So what is pinned here is the opposite of what this group used to say: the
// motes ARE let go into the yard, they stay where they were dropped, and a body
// that walks leaves them behind it. Neither tier can see the picture; what it
// can see is that the yard is still making one.
group('a tonic is let go into the yard behind a body that walks', async () => {
  window.__reset();
  window.__crew(2, 2);
  run(1);
  window.__dose('rockhand', 'stew');
  window.__dose('hauler', 'brace');
  const moved = S.workers.map(w => w.x);
  run(4);
  const walked = S.workers.some((w, i) => Math.abs(w.x - moved[i]) > 6);
  const colored = S.smoke.filter(m => m.color);
  // A mote left where it was dropped is a mote the body has walked away from:
  // with several in the air at once off a moving body, they cannot all be
  // standing over one spot.
  const spread = new Set(colored.map(m => Math.round(m.x))).size;

  return [
    ok(walked, 'somebody crossed some ground under a tonic'),
    ok(colored.length > 0, 'and the tonic is coming off it into the yard',
       `${colored.length} colored motes in the air`),
    ok(spread > 1, 'left where they were let go rather than riding the head',
       `${spread} places for ${colored.length} motes`),
    ok(STEPS.some(s => s.name === 'dosemotes'),
       'the step that lets them go is in the frame', STEPS.map(s => s.name).join(',')),
    ok(S.workers.some(w => (w.doses || []).length), 'while the doses are still on')
  ];
});
