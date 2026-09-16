// The hidden window's clock.
//
// A hidden window gets no frames, so the first frame back reads a wall that has
// moved by however long you were away. `dt` was already clamped for that frame
// (game.js, "a long tab-out is not a long frame"), but `now()` used to take the
// whole gap in one go -- so the yard did no work for the hour and every deadline
// on the clock, a dose, a hand, a break, fired the moment you came back. Now
// `tick` leaps by at most CLOCK_LEAP_MS a frame, the same number `dt` is capped
// at, and a hidden window is a pause. See docs/release-readiness.md, "The hidden
// tab, and the clock".
//
// The wall is faked. `tick` asks `performance.now()` and nothing else, so each
// group replaces that one function with a hand it can move, and puts the real
// one back when it is done. The node yard's `fast` turns the clock with
// `advance`, never `tick`, so nothing else in the harness notices; the frames
// these checks are about are turned by hand, `tick` then `step`, which is the
// exact pair main.js runs.

import { group, ok, state, run, runUntil, openSites, yard } from './helpers.mjs';
import { CLOCK_LEAP_MS } from '../src/config.js';
import { now, tick } from '../src/clock.js';
import { doseLive, doseLeftMs } from '../src/apothecary.js';

const HOUR = 60 * 60 * 1000;

// A wall that moves only when told to. Starts where the real wall is, and the
// clock's last reading is brought up to it with a *held* tick: the real wall
// has moved since the clock last looked, by however long the setup above took,
// and a held frame reads the wall without spending any of that -- so the clock
// starts each check level with the wall it is about to be shown.
function fakeWall() {
  const real = performance.now;
  let at = real.call(performance);
  performance.now = () => at;
  tick(true);
  return {
    away: ms => { at += ms; },
    restore: () => { performance.now = real; }
  };
}

// One real frame, the way main.js runs one: the clock first, then the yard.
const frame = (held = false) => { tick(held); yard.game.step(); };

group('an hour away is a tenth of a second on the clock', async () => {
  const wall = fakeWall();
  try {
    const before = now();
    wall.away(HOUR);
    tick(false);
    const moved = now() - before;
    // and the next frame is a normal one: the gap was dropped, not deferred
    wall.away(1000 / 60);
    tick(false);
    const next = now() - before - moved;
    return [
      ok(moved === CLOCK_LEAP_MS, 'an hour on the wall is one leap on the clock',
         `moved ${moved}, leap ${CLOCK_LEAP_MS}`),
      ok(Math.abs(next - 1000 / 60) < 1e-6, 'and the frame after is only as long as it was',
         `${next}`)
    ];
  } finally { wall.restore(); }
});

// The dose is reached the way a player reaches one: the plots broken, the
// building bought off its row, a pot set, a stirrer assigned, and the batch
// carried out to a body. Nothing here writes a dose on to anybody.
group('a dose bought before tabbing out is still live after', async () => {
  window.__reset();
  openSites();
  window.__crew(1, 3, 0, 1);
  window.__grant({ cores: 3, dust: 20000, spores: 2000, shards: 400 });
  run(1);
  const bought = window.__buy('unlockapothecary');
  window.__finish();
  window.__pot('stew');
  window.__assign('stirrers', 1);
  const dosed = () => yard.S.workers.find(doseLive);
  const landed = runUntil(() => !!dosed(), 240);
  const body = dosed();
  const before = body ? doseLeftMs(body) : 0;

  const wall = fakeWall();
  try {
    wall.away(HOUR);
    frame();
  } finally { wall.restore(); }
  const after = body ? doseLeftMs(body) : 0;
  const spent = before - after;

  return [
    ok(bought, 'the apothecary opens off its row'),
    ok(landed, 'and a dose lands on a body'),
    ok(before > CLOCK_LEAP_MS, 'with most of its minute still to run', `${before} ms`),
    ok(body && doseLive(body), 'the dose is still live after an hour away', `${after} ms left`),
    // One frame is at most one leap: that is what the frame after an hour
    // costs the dose, and not a millisecond more.
    ok(spent >= 0 && spent <= CLOCK_LEAP_MS, 'and it paid one frame for the hour, no more',
       `spent ${spent} of ${before}`)
  ];
});

// The hand is staked and dropped the way the player does it -- the arm held,
// the sign tapped -- and the handful is on the pegs, every grain's beat and
// fall written in time, when the tab goes dark. An hour away is one frame's
// leap to the clock, so the grains that were on the board are still on it
// when you come back, a beat further on and no more, and the hand settles
// in its own time.
group('a hand in flight resolves after its own time, not on return', async () => {
  window.__reset();
  window.__casino(true);
  window.__give(6000);
  window.__build();
  run(0.5);
  const staked = window.__casinoStake(100) > 0;
  const dropped = window.__tapSign();
  run(0.8);
  const before = state();

  const wall = fakeWall();
  let after;
  try {
    wall.away(HOUR);
    frame();
    after = state();
  } finally { wall.restore(); }
  // and it does settle, in its own time
  const rested = runUntil(() => !state().letting, 10);

  return [
    ok(staked && dropped, 'the stake goes in on the arm and the floor opens on the sign'),
    ok(before.letting && before.drop && before.drop.falling > 0, 'with the handful on the pegs',
       before.drop && `${before.drop.falling} falling`),
    ok(after.letting && after.drop && after.drop.sent <= before.drop.sent + 1,
       'an hour away moves the hand on by a frame, not an hour',
       `${before.drop && before.drop.sent} sent before, ${after.drop && after.drop.sent} after`),
    ok(after.drop && after.drop.falling > 0, 'so the grains are still on the board when you come back',
       after.drop && `${after.drop.falling} falling`),
    ok(rested, 'and the hand settles when its own time is up')
  ];
});

// Held and hidden are one rule. Sixty frames with the space bar down move the
// clock by nothing; sixty frames each coming after an hour's gap move it by one
// leap apiece and not a second more. Neither carries any of the sixty hours
// across -- which is the point, and the reason the two are the same case: the
// wall moved, the clock did not follow it. (The held frames add nothing rather
// than a leap because a pause is a gap on purpose: the frame after it is a
// normal frame measured from the pause's end, which is why the wall is still
// read while held.)
//
// A browser does not fire rAF in a hidden tab, so in play the hidden case is
// one frame, not sixty. A headless page may keep firing; if it does, this is
// what it costs -- one leap per fired frame, at most CLOCK_LEAP_MS each, which
// over an hour of sixty-a-second frames is still only the hour itself, never
// more, and with rAF throttled to nothing it is one leap.
group('the pause and the hidden window are the same case', async () => {
  const wall = fakeWall();
  try {
    const t0 = now();
    for (let i = 0; i < 60; i++) { wall.away(HOUR); tick(true); }
    const held = now() - t0;
    const t1 = now();
    for (let i = 0; i < 60; i++) { wall.away(HOUR); tick(false); }
    const hidden = now() - t1;
    return [
      ok(held === 0, 'sixty held frames move the clock by nothing', `${held}`),
      ok(hidden === 60 * CLOCK_LEAP_MS, 'sixty hidden frames move it by one leap each',
         `${hidden} vs ${60 * CLOCK_LEAP_MS}`),
      ok(held < HOUR && hidden < HOUR,
         'and neither carries a single hour of the sixty across', `${held}, ${hidden}`)
    ];
  } finally { wall.restore(); }
});
