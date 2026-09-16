// The dance is for the two rocks that earn it (wave polish, track A).
//
// Every rock used to get one: five seconds of the crew jumping about, and then
// the whole of the next rock's fall danced through as well, on every rock for
// weeks. The celebration is kept for the first rock and for the moment the
// story ends -- the sheet after the rescue, put down -- and every other rock
// the crew get straight back to work, stepping clear of the footprint and no
// more. This file is the rule, said three ways: the first rock is danced, the
// second is not, and the ending is danced once and only once.

import { group, ok, run, runUntil, state, haveRock, yard, WORKER } from './helpers.mjs';
import { S } from '../src/state.js';
import { DANCE_MS } from '../src/config.js';

const KEY = 'boulder-clicker/v4';
const now = () => yard.clock.now();

// Whether anybody danced on this frame. `jigOn` is the frame the dance last ran
// on a body -- the mark and the move outlive the dance, so they will not do.
const anyJig = t => S.workers.some(w => w.jigOn === t);

group('the first rock is worth a dance', async () => {
  window.__crew(3, 0);
  // With the reunion already behind it. The first rock's finish is otherwise
  // the meeting (intro.js), which holds the yard for its own beat and is not a
  // party; this is about the rule in core.js, so the rule gets the frame.
  S.beatsDone.push('meet', 'part');
  haveRock();
  run(2);
  window.__next();                             // the last of rock one goes
  run(1 / 60);
  const t0 = now();
  const on = S.danceUntil;
  // and they actually dance it: somebody leaves the ground inside the first
  // second, and the flag is read off the clock rather than off the fall
  let danced = false;
  for (let i = 0; i < 60 && !danced; i++) { run(1 / 60); danced = anyJig(now()); }
  window.__crew(0, 0);
  return [
    ok(state().boulderNo === 1, 'it was the first rock', `rock ${state().boulderNo}`),
    ok(on > t0, 'and the crew are given their dance', `until ${on} against ${t0}`),
    ok(on - t0 <= DANCE_MS, 'of the length the dial says', `${on - t0}ms`),
    ok(danced, 'and somebody is off the ground doing it')
  ];
});

group('the second rock is not: straight back to work', async () => {
  window.__crew(3, 0);
  window.__jump(2);
  haveRock();
  run(2);
  const zone = () => state().dropZone;
  const inZone = z => z ? S.workers.filter(w => w.x + WORKER > z[0] && w.x < z[1]) : [];
  window.__next();                             // the last of rock two goes
  run(1 / 60);
  const flag = S.danceUntil;
  // Frame by frame across the gap, the fall and a second after the landing: a
  // coarse step walks straight over a single frame of somebody jumping.
  let jigged = 0, swung = 0, under = null, sky = 0, landedAt = -1, frames = 0;
  const mined = () => S.workers.reduce((n, w) => n + (w.mined || 0), 0);
  const dug0 = mined();
  for (let i = 0; i < 900; i++) {
    run(1 / 60); frames++;
    const s = state();
    if (anyJig(now())) jigged++;
    if (s.rockFall > 0) {
      sky = Math.max(sky, s.rockFall);
      // nobody swings at a rock in the air: the gang's tally does not move
      if (mined() !== dug0) swung++;
    }
    if (landedAt < 0 && sky > 0 && s.rock > 0 && !s.rockFall) {
      landedAt = frames;
      under = inZone(zone() || [s.rockLeftX, s.rockLeftX + s.rockW]);
    }
    if (landedAt > 0 && frames - landedAt >= 60) break;
  }
  const dug1 = mined();
  // and then they are back on it: the tally moves once it is down
  const back = runUntil(() => mined() > dug1, 10);
  window.__crew(0, 0);
  return [
    ok(flag === 0, 'no dance is called', `danceUntil ${flag}`),
    ok(sky > 0, 'the next rock comes down', `caught it ${sky}px up`),
    ok(landedAt > 0, 'and lands', `${frames} frames watched`),
    ok(jigged === 0, 'and nobody dances through any of it -- the gap, the fall or the landing',
       `${jigged} frames with somebody jumping`),
    ok(swung === 0, 'nobody swings at a rock in the air', `${swung} frames of it`),
    ok(under && under.length === 0, 'and nobody is under it when it lands',
       under ? under.map(w => `${w.type}@${Math.round(w.x)}`).join(' ') : 'no landing'),
    ok(back, 'and the gang are back at work on it')
  ];
});

group('the ending is danced once, when the sheet is put down', async () => {
  window.__crew(3, 0);
  haveRock();
  run(1);
  // The rescue is over and the sheet is up; the player puts it down. The
  // button is DOM (ending.js), so its skip of the ending beat is called
  // here, and the beat's own skip does the rest.
  S.rescued = true;
  run(1 / 60);                                 // the ending beat takes the sheet
  const t0 = now();
  window.__skipBeat('sheet');
  run(1 / 60);
  const on = S.danceUntil, marked = S.beatsDone.includes('ending');
  let danced = false;
  for (let i = 0; i < 60 && !danced; i++) { run(1 / 60); danced = anyJig(now()); }

  // And a save from before the beats existed, with the story already told:
  // an old finished yard does not throw a party on load.
  run(DANCE_MS / 1000 + 1);                    // this dance is over
  yard.persist();
  const s = JSON.parse(localStorage.getItem(KEY));
  const wrote = Array.isArray(s.beatsDone) && s.beatsDone.includes('ending');
  delete s.beatsDone;
  s.storyTold = true;
  localStorage.setItem(KEY, JSON.stringify(s));
  yard.restore();
  const t1 = now();
  run(1 / 60);
  const again = S.danceUntil > t1;
  window.__crew(0, 0);
  return [
    ok(on > t0, 'the sheet goes down and the crew dance', `until ${on} against ${t0}`),
    ok(marked, 'and the yard remembers it has'),
    ok(danced, 'somebody is off the ground doing it'),
    ok(wrote, 'the memory is written to the save'),
    ok(S.beatsDone.includes('ending'), 'an older save with the story told loads as already told',
       `done ${S.beatsDone}`),
    ok(!again, 'and does not dance on load', `danceUntil ${S.danceUntil} against ${t1}`)
  ];
});
