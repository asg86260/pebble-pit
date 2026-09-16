// The yard's events reach the sound engine, by the routes a player takes.
//
// Nothing here can hear anything, and neither can the browser tier: what the
// node yard can hold is the decision half -- which calls reached `sfx`, and in
// which class. So every check below does the thing the way a player does (a
// swing at the hill, a rock coming down, a crew at work) and reads
// `audioDecisions()` afterward, which the stub counts into and the engine
// returns in the same shape. See docs/wave-desk-sound.md, track C, and
// DESIGN.md "The sound of the yard" for the law each call obeys.
//
// The counters run since wake and never reset, so every group takes a delta.

import { group, ok, state, run, runUntil, haveRock, quickCrew, openSites } from './helpers.mjs';
import { rockhandMs } from '../src/levels.js';
import { wakeAudio, audioDecisions } from '../src/audio.js';

const snap = () => {
  const d = audioDecisions();
  return { fired: d.fired, hand: d.byClass.hand, fold: d.byClass.fold, punct: d.byClass.punct };
};
const delta = (a, b) => ({ fired: b.fired - a.fired, hand: b.hand - a.hand,
                           fold: b.fold - a.fold, punct: b.punct - a.punct });

// Before the first gesture the engine is asleep and nothing is queued; after
// it, the player's own swing is the one sound in the 'hand' class.
group('your own swing at the hill is a hand sound', async () => {
  haveRock();
  const asleep = snap();
  // Not yet awake: a swing now must count nothing, or the yard would cough up
  // its whole first second the moment the context opens.
  window.__swing(1);
  const stillAsleep = snap();
  wakeAudio();
  const before = snap();
  const took = window.__swing(1);
  const after = delta(before, snap());
  return [
    ok(asleep.fired === stillAsleep.fired, 'before the first gesture a swing counts nothing',
       `${stillAsleep.fired - asleep.fired} fired`),
    ok(took > 0, 'the swing took rock off the hill', `${took} cells`),
    ok(after.hand === 1, 'and it is one hand sound', `${after.hand} hand sounds`)
  ];
});

// A rock coming out of the sky and meeting the ground: punctuation, through
// `landRock`, reached by letting the yard finish one and drop the next.
group('the boulder landing is punctuation', async () => {
  wakeAudio();
  window.__crew(2, 0);
  haveRock();
  const was = state().boulderNo;
  window.__next();                          // the last of it goes
  const before = snap();
  // Through the dance and the fall, under the clock, until the next one is
  // standing on the ground line.
  const landed = haveRock();
  const after = delta(before, snap());
  window.__crew(0, 0);
  return [
    ok(landed && state().boulderNo === was + 1, 'the next rock came down and landed',
       `rock ${state().boulderNo} after rock ${was}`),
    ok(after.punct >= 1, 'and the landing is a punctuation sound', `${after.punct} punct`)
  ];
});

// A crew at work is footsteps and picks -- folded sounds, in quantity. An empty
// yard run for the same ten seconds has none of that to fold.
group('a crewed yard folds more than an empty one', async () => {
  wakeAudio();
  quickCrew();
  haveRock();
  const emptyBefore = snap();
  run(10);
  const empty = delta(emptyBefore, snap());
  window.__crew(4, 4);
  const crewedBefore = snap();
  run(10);
  const crewed = delta(crewedBefore, snap());
  window.__crew(0, 0);
  return [
    ok(crewed.fold > empty.fold, 'four rockhands and four haulers fold more than nobody',
       `${crewed.fold} with a crew, ${empty.fold} without`),
    ok(crewed.fold > 0, 'and a working crew is heard at all', `${crewed.fold} fold`),
    ok(crewed.hand === 0, 'none of it is in the hand class: nobody clicked',
       `${crewed.hand} hand`)
  ];
});

// A machine is heard at a body's pace, not its own. The ram beats several
// times a second and used to sound on every beat, and then again from
// `knockOff` for the same strike; now it is one strike per rockhand's swing,
// from the machine's end alone.
group("the ram is heard at a rockhand's pace, once per strike", async () => {
  window.__reset();
  wakeAudio();
  openSites();
  window.__fullSites();
  window.__crew(1, 0);                       // one body, which is all it holds
  window.__machine('ram', { bought: true });
  window.__clearFloor();
  window.__jump(3);
  runUntil(() => (state().machines.ram.workedAt | 0) > 0, 40);
  const ev = () => ({ ...audioDecisions().byEvent });
  const before = ev();
  const secs = 6;
  for (let i = 0; i < secs * 4; i++) { run(0.25); window.__clearFloor(); }
  const after = ev();
  const beats = (after['machine-beat'] || 0) - (before['machine-beat'] || 0);
  const swings = (after['rock-swing'] || 0) - (before['rock-swing'] || 0);
  const pace = secs * 1000 / rockhandMs();
  window.__crew(0, 0);
  return [
    ok(beats > 0, 'the working ram is heard at all', `${beats} beats`),
    ok(beats <= Math.ceil(pace) + 1, 'and no oftener than a rockhand swings',
       `${beats} beats in ${secs}s, a rockhand would swing ${pace.toFixed(1)} times`),
    ok(swings === 0, 'and its strike is not heard a second time from the rock',
       `${swings} rock-swing`)
  ];
});
