// The sound's decisions, without a context.
//
// Neither tier can hear anything, the way neither can see a sprite, so the ear
// is the check for everything downstream of a decision. What this file holds
// is the decision half of audio.js, which is written to run on the game's
// clock with no AudioContext at all: given forty grains in one frame, how many
// voices does it decide to fire; does the ceiling drop rather than defer; does
// the player's own hand always get through. There is no bed to follow anything
// since the hits-only pass, so every group here is about strikes. There is no
// AudioContext on this yard, and `wakeAudio` wakes the decisions without one.
//
// The counters are since wake and the module is one per process, so the
// groups here read differences, and the first group -- which is about nothing
// being counted before the wake -- has to be first.

import { group, ok, run, runUntil } from './helpers.mjs';
import { sfx, stepAudio, wakeAudio, muteAudio, audioDecisions, applySounds, panOf } from '../src/audio.js';
import { S } from '../src/state.js';
import { SND_FOLD_MS, SND_FOLD_PER_S, SND_PUNCT_PER_S, SND_EACH_PER_S, SND_VOICES,
         SND_PAN_MAX, SND_PAN_OFF, SND_PAN_REACH, SOUND_KNOBS, SOUNDS } from '../src/config/sound.js';

const FRAME = 1 / 60;
const d = () => audioDecisions();
const snap = () => JSON.parse(JSON.stringify(d()));
const knob = key => SOUND_KNOBS.find(k => k.key === key);

// One frame of the yard, the way the shell runs it -- and stepAudio runs at
// the end of it, so a window that has closed is emitted here.
const frame = () => run(FRAME);

group('before the wake nothing is counted, and nothing is queued', async () => {
  const before = snap();
  for (let i = 0; i < 10; i++) sfx('rock-hit', { x: 100 });
  sfx('work-land', {});
  stepAudio(16);
  run(1);
  const after = snap();
  return [
    ok(typeof AudioContext === 'undefined', 'there is no AudioContext on this yard'),
    ok(after.fired === 0 && after.byClass.hand === 0 && after.byClass.punct === 0,
       'nothing asked for before the wake is counted', JSON.stringify(after.byClass)),
    ok(after.pending === 0 && before.pending === 0, 'and nothing is waiting to fire')
  ];
});

group('the wake wakes the decisions without a context, and a still yard asks for nothing', async () => {
  wakeAudio();
  muteAudio(false);
  const before = snap();
  run(1);                                        // a second of yard, awake
  const a = snap();
  return [
    ok(a.byClass.hand === before.byClass.hand, 'nobody has swung: no hand asked for'),
    ok(a.pending === 0, 'and nothing is waiting to fire')
  ];
});

group('forty grains in one frame are one sound', async () => {
  // A yard with nobody in it: the hauler the fresh yard stands up paces, and
  // every stride is a fold of its own, which would be a forty-first grain.
  window.__crew(0);
  run(2);                                        // clear any window from before
  const before = snap();
  for (let i = 0; i < 40; i++) sfx('grain-land', { x: 200 + i });
  const asked = snap();
  frame();
  const after = snap();
  // the window closes SND_FOLD_MS on, and the sound is emitted once
  runUntil(() => d().pending === 0, 1);
  const closed = snap();
  return [
    ok(asked.fired - before.fired === 1, 'one voice is decided on for the forty',
       `${asked.fired - before.fired} fired`),
    ok(asked.folded - before.folded === 39, 'and the other thirty-nine fold into it',
       `${asked.folded - before.folded} folded`),
    ok(asked.pending === 1, 'the one sound waits for its window', `pending ${asked.pending}`),
    ok(after.byClass.fold - before.byClass.fold === 40, 'all forty were asked for, by class'),
    ok(closed.pending === 0 && closed.fired - before.fired === 1,
       'the window closes and nothing else fires', `pending ${closed.pending}`)
  ];
});

group('the ceiling drops rather than defers', async () => {
  window.__crew(0);                              // nobody pacing: every event has its own ceiling now
  run(2);
  const ceiling = 4;
  const was = SND_FOLD_PER_S;
  knob('SND_FOLD_PER_S').set(ceiling);
  const before = snap();
  // A grain on every frame for two seconds: sixty a second against a window
  // that admits one per SND_FOLD_MS and a ceiling of four a second.
  for (let i = 0; i < 120; i++) { sfx('grain-land', { x: 300 }); frame(); }
  const under = snap();
  // Then silence for a window and a bit. A ceiling that deferred would still
  // be paying out the backlog here; this one has nothing to pay.
  run(SND_FOLD_MS / 1000 + FRAME * 2);
  const quiet = snap();
  const fired = quiet.fired - before.fired;
  knob('SND_FOLD_PER_S').set(was);
  return [
    ok(fired <= 2 * ceiling + 1, 'two seconds of overload fires the ceiling, not the backlog',
       `${fired} fired for 120 asked, ceiling ${ceiling}/s`),
    ok(fired >= ceiling, 'and it does fire up to the ceiling', `${fired}`),
    ok(under.dropped - before.dropped > 0, 'what is over the ceiling is dropped',
       `${under.dropped - before.dropped} dropped`),
    ok(under.folded - before.folded > 0, 'and what is inside a window is folded',
       `${under.folded - before.folded} folded`),
    ok(quiet.pending === 0, 'nothing is left waiting once the yard goes quiet',
       `pending ${quiet.pending}`),
    ok(quiet.fired - under.fired <= 1, 'and at most the last open window closes after',
       `${quiet.fired - under.fired} more`)
  ];
});

group("the player's own hand always fires", async () => {
  run(2);
  const before = snap();
  for (let i = 0; i < 40; i++) sfx('rock-swing', { x: 200 });     // a window opens and fills
  sfx('rock-crit', { x: 200, hard: 0.5 });                        // the click, same frame
  sfx('rock-hit', { x: 200 });                                    // and another
  const asked = snap();
  frame();
  return [
    ok(asked.firedBy.hand - before.firedBy.hand === 2, 'both clicks fire in the frame the grains folded',
       `${asked.firedBy.hand - before.firedBy.hand}`),
    ok(asked.byClass.hand - before.byClass.hand === 2, 'and are counted as the hand'),
    ok(asked.fired - before.fired === 3, 'three voices: the handful, and the two clicks',
       `${asked.fired - before.fired}`)
  ];
});

group('punctuation is never folded', async () => {
  run(3);
  const before = snap();
  sfx('work-land', { x: 100, big: true });
  sfx('work-land', { x: 100, big: true });
  frame();
  const after = snap();
  return [
    ok(after.firedBy.punct - before.firedBy.punct === 2, 'two landings are two sounds, not one',
       `${after.firedBy.punct - before.firedBy.punct}`),
    ok(after.folded === before.folded, 'nothing about them is folded')
  ];
});

group('punctuation has a ceiling of its own', async () => {
  run(3);
  const before = snap();
  for (let i = 0; i < SND_PUNCT_PER_S + 3; i++) sfx('boulder-land', { x: 100, big: true });
  const after = snap();
  return [
    ok(after.firedBy.punct - before.firedBy.punct === SND_PUNCT_PER_S,
       'a burst of punctuation fires the ceiling', `${after.firedBy.punct - before.firedBy.punct}`),
    ok(after.dropped - before.dropped === 3, 'and the rest is dropped', `${after.dropped - before.dropped}`)
  ];
});

// Every grain into the pit is its own strike -- a tip is a stream, not a
// handful -- so it is heard through the pit, not through sfx, and past the
// ceiling a refund's burst is dropped rather than rendered.
group('every grain into the pit is a strike of its own, up to the ceiling', async () => {
  run(3);
  const before = snap();
  window.__tip(5);
  const five = snap();
  window.__tip(SND_EACH_PER_S);
  const burst = snap();
  return [
    ok(five.firedBy.each - before.firedBy.each === 5, 'five grains tipped are five strikes',
       `${five.firedBy.each - before.firedBy.each}`),
    ok(five.folded === before.folded, 'and none of them fold'),
    ok(burst.firedBy.each - before.firedBy.each === SND_EACH_PER_S,
       'a burst fires the ceiling', `${burst.firedBy.each - before.firedBy.each}`),
    ok(burst.dropped - before.dropped === 5, 'and the rest is dropped', `${burst.dropped - before.dropped}`)
  ];
});

group('the cap steals the oldest and quietest, and never the hand', async () => {
  run(3);
  const before = snap();
  // More strikes than the cap holds, each its own voice: hands are never
  // folded, so they are the way to fill the cap in one frame.
  for (let i = 0; i < SND_VOICES; i++) sfx('rock-hit', { x: 100 });
  const full = snap();
  for (let i = 0; i < 3; i++) sfx('rock-hit', { x: 100 });
  const over = snap();
  // Punctuation, not the hand: past the cap now, and something has to go --
  // and it cannot be one of the hands.
  sfx('boulder-land', { x: 100, big: true });
  const took = snap();
  return [
    ok(full.fired - before.fired === SND_VOICES, 'the cap fills', `${full.fired - before.fired}`),
    ok(over.stolen === full.stolen, 'hands over the cap steal nothing: every voice up is a hand'),
    ok(took.stolen === over.stolen, 'and a landing over a cap full of hands takes none of them either',
       `${took.stolen - over.stolen} stolen`)
  ];
});

group('a cap full of gravel gives way to the next strike', async () => {
  window.__crew(0);                              // nobody pacing, see above
  run(3);
  const before = snap();
  // Fold windows, one closed after another, until the cap is full of yard
  // noise -- then one more. A strike rings for a fraction of a second and a
  // window is eighty milliseconds, so the cap is brought down to what a
  // couple of windows can fill, through its own knob, and put back after.
  // The grain is unmapped -- silent -- and a silent event takes no slot, so
  // it is given the rock's recipe for the length of the group, through the
  // same door the dev panel's paste goes through, and it is taken back after.
  const voices = knob('SND_VOICES');
  voices.set(2);
  const laid = applySounds({ 'grain-land': 'stone', 'boulder-land': 'stone' });
  let i = 0;
  while (d().fired - before.fired < 2) {
    sfx('grain-land', { x: 100, big: true });
    run(SND_FOLD_MS / 1000 + FRAME);
    i++;
    if (i > 8) break;
  }
  const full = snap();
  sfx('boulder-land', { x: 100, big: true });
  const after = snap();
  voices.set(SND_VOICES);
  applySounds({ 'grain-land': null, 'boulder-land': null });
  return [
    ok(laid === 2 && SOUNDS['grain-land'].recipe === null, 'a mapping lays over the table and comes off again'),
    ok(full.fired - before.fired >= 2, 'the cap is full of the yard',
       `${full.fired - before.fired} up`),
    ok(after.stolen - full.stolen >= 1, 'and the next strike takes one',
       `${after.stolen - full.stolen} stolen`)
  ];
});

group('a strike off the edge of the screen is heard off that edge', async () => {
  const near = 1e-9;
  const was = { viewW: S.viewW, camX: S.camX };
  S.viewW = 1000; S.camX = 2000;               // the view covers 2000..3000
  const mid = panOf(2500), left = panOf(2000), right = panOf(3000);
  const off = panOf(2000 - SND_PAN_REACH * 1000), farOff = panOf(-1e6);
  const half = panOf(2000 - SND_PAN_REACH * 500), rightOff = panOf(1e6);
  Object.assign(S, was);
  return [
    ok(Math.abs(mid) < near, 'the middle of the view is dead center', mid),
    ok(Math.abs(left + SND_PAN_MAX) < near && Math.abs(right - SND_PAN_MAX) < near,
       'the view edges sit at the shallow on-screen pan', `${left} ${right}`),
    ok(half < left && half > -SND_PAN_OFF, 'past the edge the pan keeps deepening', half),
    ok(Math.abs(off + SND_PAN_OFF) < near, 'a reach beyond the edge is the off-screen pan', off),
    ok(Math.abs(farOff + SND_PAN_OFF) < near && Math.abs(rightOff - SND_PAN_OFF) < near,
       'and it holds there, never hard, on either side', `${farOff} ${rightOff}`),
    ok(panOf(undefined) === 0, 'a strike with no x is centered')
  ];
});
