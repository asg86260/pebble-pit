// The snatch and the freeing (snatch.js; docs/wave-serpent.md, "The story").
//
// Reached the way a player reaches them: the pit drowned by the rift eating
// its fill, the sqwife out with her sheet put down, in either order. The
// rescue itself is bought and walked in shield.test.mjs; here the yard is
// given the rescue's own record, as ending.test.mjs does, and the sheet is put
// down with its button. The freeing is the fourth defense broken, which is
// deep/serpent.js's; the flags are set here because the fight is not this
// file's subject.
import { group, ok, state, run, runUntil } from './helpers.mjs';
import { S } from '../src/state.js';
import { ABYSS_AT, WORKER, P } from '../src/config.js';
import { now } from '../src/clock.js';
import { commutePace } from '../src/levels.js';
import { belowYard } from '../src/route.js';
import { mouthX, deepFloor } from '../src/deep/place.js';

const done = key => S.beatsDone.filter(k => k === key).length;
const rescued = () => { S.rescued = true; S.buried = false; };
const inYard = w => !belowYard(w) && w.y + WORKER <= S.groundY + 1;

// Frame by frame, the body named: the furthest it moved in one frame, and
// the lowest and highest it was, until `until` says it is there. Found by name
// every frame, because the harness reads the yard back every five seconds and
// a reload stands every body up afresh.
function follow(name, until, limit = 60 * 60) {
  let jump = 0, low = -Infinity, high = Infinity, at = null, frames = 0, shaft = false;
  for (let f = 0; f < limit; f++) {
    const w = S.workers.find(o => o.name === name);
    if (!w) return { lost: true, jump, low, high, frames, shaft };
    if (at) jump = Math.max(jump, Math.hypot(w.x - at.x, w.y - at.y));
    at = { x: w.x, y: w.y };
    low = Math.max(low, w.y);
    high = Math.min(high, w.y);
    if (Math.abs(w.x - mouthX()) < 1 && w.y + WORKER > S.groundY + P && w.y + WORKER < deepFloor() - P) shaft = true;
    if (until(w)) return { there: true, jump, low, high, frames, shaft };
    run(1 / 60);
    frames++;
  }
  return { there: false, jump, low, high, frames, shaft };
}

group('drowned first: the rescue\'s sheet put down, and the serpent takes him, once', async () => {
  window.__crew(2, 2);
  run(1);
  window.__rift();                       // the hole ate its fill and gave way
  rescued();                             // and then the sqwife walked out
  run(1 / 60);
  const sheet = state().beat.sheet;
  window.__skipBeat('sheet');            // the button
  const danced = S.danceUntil > now();
  const before = S.crew;
  runUntil(() => S.beat.yard === 'snatch', 5);
  const started = S.beat.yard === 'snatch';
  const pair = S.pair.length;
  const crewDuring = S.crew;
  let sawHead = false, carried = false;
  for (let f = 0; f < 60 * 60 && !S.beatsDone.includes('snatch'); f++) {
    run(1 / 60);
    if (S.snatch && S.snatch.headY < S.groundY) sawHead = true;
    if (S.snatch && S.snatch.carried) carried = true;
  }
  const after = S.crew;
  const brawlers = S.workers.filter(w => w.type === 'brawler');
  // And never again: not on the next frames, not after a reload.
  window.__reload();
  run(3);
  return [
    ok(sheet === 'ending', 'the rescue\'s sheet comes first', `sheet ${sheet}`),
    ok(!danced, 'putting it down does not start the dance when the pit has drowned'),
    ok(started && pair === 2, 'the snatch takes the yard with two of the crew walked as the pair',
       `beat ${S.beat.yard}, pair ${pair}`),
    ok(crewDuring === before - 2, 'the two are off the crew while it plays', `${before} -> ${crewDuring}`),
    ok(sawHead && carried, 'something comes up out of the surface and takes one of them'),
    ok(S.snatched && after === before - 1, 'the crew is one fewer', `${before} -> ${after}`),
    ok(brawlers.length === 1 && S.brawlers === 1, 'and the one left standing is the deep\'s first brawler',
       `${brawlers.length} bodies, ${S.brawlers} on the books`),
    ok(done('snatch') === 1 && S.crew === after && S.beat.yard === null,
       'it plays once, and not again after a reload', `done ${done('snatch')}, crew ${S.crew}`)
  ];
});

group('rescued first: the drowning\'s scene plays through, then the snatch', async () => {
  window.__crew(2, 2);
  run(1);
  rescued();
  run(1 / 60);
  window.__skipBeat('sheet');
  run(2);
  const early = S.beat.yard;
  // The hole eating the last of its fill: the rift drowns it on its own step.
  window.__tear(ABYSS_AT);
  runUntil(() => S.beat.camera === 'drown', 5);
  const scene = S.beat.camera;
  run(1 / 60);
  const during = S.beat.yard;
  runUntil(() => S.beat.yard === 'snatch', 30);
  const after = { yard: S.beat.yard, drownDone: S.beatsDone.includes('drown'), camera: S.beat.camera };
  runUntil(() => S.beatsDone.includes('snatch'), 60);
  return [
    ok(early === null, 'nothing is taken before the pit has drowned', `yard ${early}`),
    ok(scene === 'drown' && during !== 'snatch', 'the drowning\'s scene plays first, alone',
       `camera ${scene}, yard ${during}`),
    ok(after.yard === 'snatch' && after.drownDone && after.camera === null,
       'and the snatch follows once it has finished', JSON.stringify(after)),
    ok(S.snatched && done('snatch') === 1, 'and plays through, once')
  ];
});

group('a reload mid-snatch plays it again from the start, or past the take from the surface', async () => {
  window.__crew(2, 2);
  run(1);
  const crew0 = S.crew;
  window.__snatch();
  runUntil(() => S.snatch && S.snatch.phase === 'walk', 3);
  run(1);
  window.__reload();                     // walking to the edge
  const back = { crew: S.crew, beat: S.beat.yard, snatched: S.snatched };
  runUntil(() => S.snatch && S.snatch.phase === 'close', 60);
  window.__reload();                     // he is under; the surface closing
  const closing = { crew: S.crew, snatched: S.snatched };
  run(1 / 60);
  const resumed = S.snatch && S.snatch.phase;
  runUntil(() => S.beatsDone.includes('snatch'), 30);
  return [
    ok(back.crew === crew0 && !back.snatched && back.beat === null,
       'read back mid-walk, the pair are hands of the crew again and nothing is taken', JSON.stringify(back)),
    ok(closing.snatched && closing.crew === crew0 - 1,
       'read back past the take, he is gone and she is a hand', JSON.stringify(closing)),
    ok(resumed === 'close', 'and it finishes from the surface closing', `phase ${resumed}`),
    ok(S.crew === crew0 - 1 && S.brawlers === 1 && done('snatch') === 1,
       'the crew is one fewer once, however it was read', `crew ${crew0} -> ${S.crew}, brawlers ${S.brawlers}`)
  ];
});

group('the brawler walks the shaft down, never faster than a pace', async () => {
  window.__crew(2, 2);
  run(1);
  window.__snatch({ played: true });
  const her = S.workers.find(w => w.type === 'brawler');
  const pace = commutePace();
  const trip = follow(her.name, w => !w.walking && belowYard(w));
  const w = S.workers.find(o => o.name === her.name);
  return [
    ok(trip.there, 'she gets to the altar', `${trip.frames} frames`),
    ok(trip.shaft && trip.high < S.groundY && trip.low >= deepFloor() - WORKER - 0.5,
       'by the shaft: from the plank to the deep\'s floor', `y ${Math.round(trip.high)}..${Math.round(trip.low)}`),
    ok(trip.jump <= pace + 0.01, 'never moving more than her pace in a frame',
       `${trip.jump.toFixed(2)} against ${pace}`),
    ok(w && Math.abs(w.y - (deepFloor() - WORKER)) < 1, 'and stands on the deep\'s floor')
  ];
});

group('the freeing puts him back on the crew, and he walks up the shaft to the yard', async () => {
  window.__crew(2, 2);
  run(1);
  window.__snatch({ played: true });
  const had = new Set(S.workers.map(w => w.name));
  const crew0 = S.crew;
  S.serpentStage = 4;                    // the fourth defense broken (deep/serpent.js)
  S.serpentFreed = true;
  run(1 / 60);
  const opening = S.beat.yard;
  runUntil(() => S.beatsDone.includes('freed'), 10);
  const him = S.workers.find(w => !had.has(w.name));
  const out = him && { deep: belowYard(him), type: him.type };
  const sheet = S.beat.sheet;
  window.__skipBeat('sheet');
  const pace = commutePace();
  const trip = him ? follow(him.name, inYard, 60 * 90) : { there: false };
  return [
    ok(opening === 'freed', 'the belly opens as a beat', `yard ${opening}`),
    ok(S.crew === crew0 + 1 && out && out.deep && out.type === 'hauler',
       'he is one of the crew again, a spare hand, in the deep', JSON.stringify(out)),
    ok(sheet === 'freedsheet', 'the sheet says so', `sheet ${sheet}`),
    ok(S.beatsDone.includes('freedsheet') && S.beat.sheet === null, 'and is put down with its button'),
    ok(trip.there && trip.shaft, 'he swims up the shaft and comes out on the yard', `${trip.frames} frames`),
    ok(trip.jump <= pace + 0.01, 'never moving more than his pace in a frame',
       `${(trip.jump || 0).toFixed(2)} against ${pace}`)
  ];
});
