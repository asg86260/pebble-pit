// The sound's decisions, without a context.
//
// Neither tier can hear anything, the way neither can see a sprite, so the ear
// is the check for everything downstream of a decision. What this file holds
// is the decision half of audio.js, which is written to run on the game's
// clock with no AudioContext at all: given forty grains in one frame, how many
// voices does it decide to fire; does the ceiling drop rather than defer; does
// the player's own hand always get through; does a bed's level follow the
// storm and come down over the crossfade rather than on a frame. There is no
// AudioContext on this yard, and `wakeAudio` wakes the decisions without one.
//
// The counters are since wake and the module is one per process, so the
// groups here read differences, and the first group -- which is about nothing
// being counted before the wake -- has to be first.

import { group, ok, state, run, runUntil, makeItRain, openSites, yard } from './helpers.mjs';
import { sfx, stepAudio, wakeAudio, muteAudio, audioDecisions } from '../src/audio.js';
import { SND_FOLD_MS, SND_FOLD_PER_S, SND_PUNCT_PER_S, SND_BED_S, SND_VOICES,
         SOUND_KNOBS } from '../src/config/sound.js';

const FRAME = 1 / 60;
const d = () => audioDecisions();
const snap = () => JSON.parse(JSON.stringify(d()));
const knob = key => SOUND_KNOBS.find(k => k.key === key);

// One frame of the yard, the way the shell runs it -- and stepAudio runs at
// the end of it, so a window that has closed is emitted here.
const frame = () => run(FRAME);

group('before the wake nothing is counted, and nothing is queued', async () => {
  const before = snap();
  for (let i = 0; i < 10; i++) sfx('stone', { x: 100, cls: 'hand' });
  sfx('wood', { cls: 'punct' });
  stepAudio(16);
  run(1);
  const after = snap();
  return [
    ok(typeof AudioContext === 'undefined', 'there is no AudioContext on this yard'),
    ok(after.fired === 0 && after.byClass.hand === 0 && after.byClass.punct === 0,
       'nothing asked for before the wake is counted', JSON.stringify(after.byClass)),
    ok(after.pending === 0 && before.pending === 0, 'and nothing is waiting to fire'),
    ok(after.beds.water === 0 && after.beds.air === 0, 'and no bed has moved',
       JSON.stringify(after.beds))
  ];
});

group('the wake wakes the decisions without a context', async () => {
  wakeAudio();
  muteAudio(false);
  run(1);                                        // a second of yard, awake
  const a = snap();
  return [
    ok(a.beds.air > 0, 'the air bed is up once the yard is awake: there is always wind',
       `air ${a.beds.air.toFixed(3)}`),
    ok(a.wants.water === 0, 'and no rain wanted on a dry yard')
  ];
});

group('forty grains in one frame are one sound', async () => {
  // A yard with nobody in it: the hauler the fresh yard stands up paces, and
  // every stride is a fold of its own, which would be a forty-first grain.
  window.__crew(0);
  run(2);                                        // clear any window from before
  const before = snap();
  for (let i = 0; i < 40; i++) sfx('stone', { x: 200 + i });
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
  run(2);
  const ceiling = 4;
  const was = SND_FOLD_PER_S;
  knob('SND_FOLD_PER_S').set(ceiling);
  const before = snap();
  // A grain on every frame for two seconds: sixty a second against a window
  // that admits one per SND_FOLD_MS and a ceiling of four a second.
  for (let i = 0; i < 120; i++) { sfx('stone', { x: 300 }); frame(); }
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
  for (let i = 0; i < 40; i++) sfx('stone', { x: 200 });          // a window opens and fills
  sfx('stone', { x: 200, cls: 'hand', hard: 0.5, crit: true });   // the click, same frame
  sfx('stone', { x: 200, cls: 'hand' });                          // and another
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

group('punctuation ducks the beds for about a second and is never folded', async () => {
  run(3);
  const before = snap();
  sfx('wood', { x: 100, cls: 'punct', big: true });
  sfx('wood', { x: 100, cls: 'punct', big: true });
  frame();
  const ducked = snap();
  run(SND_DUCK_S_plus());
  const later = snap();
  return [
    ok(ducked.firedBy.punct - before.firedBy.punct === 2, 'two landings are two sounds, not one',
       `${ducked.firedBy.punct - before.firedBy.punct}`),
    ok(ducked.folded === before.folded, 'nothing about them is folded'),
    ok(ducked.ducked === true, 'the beds are ducked under it'),
    ok(later.ducked === false, 'and back up after SND_DUCK_S')
  ];
});
// the duck's second, and a frame past it
function SND_DUCK_S_plus() { return 1 + FRAME * 2; }

group('punctuation has a ceiling of its own', async () => {
  run(3);
  const before = snap();
  for (let i = 0; i < SND_PUNCT_PER_S + 3; i++) sfx('stone', { x: 100, cls: 'punct', big: true });
  const after = snap();
  return [
    ok(after.firedBy.punct - before.firedBy.punct === SND_PUNCT_PER_S,
       'a burst of punctuation fires the ceiling', `${after.firedBy.punct - before.firedBy.punct}`),
    ok(after.dropped - before.dropped === 3, 'and the rest is dropped', `${after.dropped - before.dropped}`)
  ];
});

group('the cap steals the oldest and quietest, and never the hand', async () => {
  run(3);
  const before = snap();
  // More strikes than the cap holds, each its own voice: hands are never
  // folded, so they are the way to fill the cap in one frame.
  for (let i = 0; i < SND_VOICES; i++) sfx('metal', { x: 100, cls: 'hand' });
  const full = snap();
  for (let i = 0; i < 3; i++) sfx('metal', { x: 100, cls: 'hand' });
  const over = snap();
  // Punctuation across three voices, none of them the hand: past the cap now,
  // and something has to go -- and it cannot be one of the hands.
  sfx('wood', { x: 100, cls: 'punct' });
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
  // noise -- then one more. The rift's strike rings longest, so it is the one
  // still up when the last window closes.
  let i = 0;
  while (d().fired - before.fired < SND_VOICES) {
    sfx('rift', { x: 100 });
    run(SND_FOLD_MS / 1000 + FRAME);
    i++;
    if (i > SND_VOICES * 4) break;
  }
  const full = snap();
  sfx('rift', { x: 100, cls: 'punct' });
  const after = snap();
  return [
    ok(full.fired - before.fired >= SND_VOICES, 'the cap is full of the yard',
       `${full.fired - before.fired} up`),
    ok(after.stolen - full.stolen >= 1, 'and the next strike takes one',
       `${after.stolen - full.stolen} stolen`)
  ];
});

group('the water bed follows a storm and comes down over the crossfade', async () => {
  window.__reset();
  window.__crew(0, 0);
  wakeAudio();
  run(3);
  const dry = snap();
  const rained = makeItRain();
  runUntil(() => d().beds.water > 0.9, 10);
  const wet = snap();
  // The sky emptied: the rain has nothing left to come down as, and the bed
  // wants nought -- but it is at nought only after SND_BED_S, not this frame.
  window.__air({ haze: 0 });
  for (let i = 0; i < 600 && state().smog.raining; i++) frame();
  frame();
  const justOff = snap();
  run(SND_BED_S / 2);
  const halfway = snap();
  run(SND_BED_S / 2 + FRAME * 2);
  const down = snap();
  return [
    ok(rained, 'a storm comes through the yard\'s own hooks'),
    ok(dry.beds.water === 0, 'the water bed is down on a dry yard', `${dry.beds.water}`),
    ok(wet.wants.water === 1 && wet.beds.water > 0.9, 'and up under the rain',
       `wants ${wet.wants.water}, at ${wet.beds.water.toFixed(2)}`),
    ok(justOff.wants.water === 0, 'the rain stops and the bed wants nought'),
    ok(justOff.beds.water > 0.9, 'but is still up on that frame', `${justOff.beds.water.toFixed(2)}`),
    ok(halfway.beds.water > 0.3 && halfway.beds.water < 0.7, 'half the crossfade on it is about half down',
       `${halfway.beds.water.toFixed(2)}`),
    ok(down.beds.water === 0, 'and down after SND_BED_S', `${down.beds.water}`)
  ];
});

group('the hum follows the machines and the rift bed follows the tear', async () => {
  window.__reset();
  wakeAudio();
  run(1);
  const bare = snap();
  // A machine hums only with somebody standing at it: the ram is bought and a
  // body walks over to tend it, and the hum is up once it has started biting.
  openSites();
  window.__fullSites();
  window.__crew(1, 0);
  window.__machine('ram', { bought: true });
  window.__clearFloor();
  window.__jump(3);
  const unmanned = snap();
  const bit = runUntil(() => (state().machines.ram.workedAt | 0) > 0, 40);
  run(SND_BED_S + FRAME * 2);
  const manned = snap();
  window.__tear(0);                              // torn, the day it tears
  run(SND_BED_S + FRAME * 2);
  const torn = snap();
  window.__rift();                               // and drowned
  run(SND_BED_S + FRAME * 2);
  const drowned = snap();
  return [
    ok(bare.wants.hum === 0 && bare.wants.rift === 0, 'a bare yard has no hum and no rift',
       JSON.stringify(bare.wants)),
    ok(unmanned.wants.hum === 0, 'a machine bought and not yet tended is silent'),
    ok(bit && manned.wants.hum > 0 && manned.beds.hum > 0, 'and hums once a body is at it',
       `wants ${manned.wants.hum.toFixed(2)}, at ${manned.beds.hum.toFixed(2)}`),
    ok(torn.wants.rift > 0 && torn.wants.rift < 1 && torn.beds.rift > 0,
       'the rift bed comes up once the hole has torn, and not all the way',
       `wants ${torn.wants.rift.toFixed(2)}, at ${torn.beds.rift.toFixed(2)}`),
    ok(drowned.wants.rift === 1 && drowned.wants.water > 0,
       'and the abyss is the whole of it, with the water bed under it',
       JSON.stringify(drowned.wants))
  ];
});

group('the opening\'s silence: every bed wants nought while the body is flat', async () => {
  window.__reset();
  wakeAudio();
  run(1);
  const talking = snap();
  yard.S.intro = 'down';
  frame();
  const flat = snap();
  yard.S.intro = null;
  return [
    ok(talking.wants.air > 0, 'there is wind before the boulder', `${talking.wants.air.toFixed(2)}`),
    ok(flat.wants.air === 0 && flat.wants.water === 0 && flat.wants.rift === 0 && flat.wants.hum === 0,
       'and nothing at all while the body lies there', JSON.stringify(flat.wants))
  ];
});
