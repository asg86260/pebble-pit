// Reduced motion: the yard is the reward and the camera is punctuation. A
// player who asked for less motion gets the same yard, walking, and a view that
// does not move under them -- a glide is a cut, a knock is nothing, and the
// opening is watched from a still seat.
//
// The preference is the subject here, so it is set straight through `setPref`
// (the switch on the sheet is the settings track's). The routes are the
// player's: a purchase that sends the view somewhere, a rock coming down, the
// opening played through. Every group puts the preference back to "follow the
// system" on its way out, because the node yard has no `matchMedia` and every
// other file was written against the full picture.

import { group, ok, state, run, runUntil, haveRock, buyNow, P } from './helpers.mjs';
import { S, shack } from '../src/state.js';
import { setPref } from '../src/prefs.js';

const less = () => setPref('motion', true);
const full = () => setPref('motion', false);
const system = () => setPref('motion', null);

// The cheapest thing on the bench that sends the view somewhere: the shack.
// Bought the way a player buys it -- the row is pressed, the hands are given
// the work -- and its `buy` runs `lookAt` the moment it stands. It needs a body
// to build it and enough in the hole for the row to be on the board.
function buyTheShack() {
  window.__crew(1, 0);
  window.__give(2000);
  return buyNow('unlockshack');
}

// --- 1. a glide is a cut --------------------------------------------------------
group('a glide is a snap under reduced motion', async () => {
  less();
  const wanted = shack.x + shack.w / 2 - S.viewW / 2;
  const bought = buyTheShack();
  run(1 / 60);
  const camX = S.camX, camTo = S.camTo;
  system();

  // and the same purchase, with the preference off, is the glide it always was
  window.__seed(1);
  full();
  const wantedFull = shack.x + shack.w / 2 - S.viewW / 2;
  const boughtFull = buyTheShack();
  run(1 / 60);
  const camXFull = S.camX, camToFull = S.camTo;
  system();

  return [
    ok(bought, 'the shack was bought at the row'),
    ok(camTo === null, 'the view is not gliding after one frame', `camTo ${camTo}`),
    ok(Math.abs(camX - wanted) < 1, 'it is already looking at the shack',
       `camX ${camX} vs ${wanted}`),
    ok(boughtFull, 'the shack was bought again with the preference off'),
    ok(camToFull !== null, 'and this time the view is on its way',
       `camTo ${camToFull}`),
    ok(Math.abs(camXFull - wantedFull) > P, 'still short of the shack after one frame',
       `camX ${camXFull} vs ${wantedFull}`),
  ];
});

// --- 2. a knock is nothing ------------------------------------------------------
//
// Nothing in the yard shakes the view on a crit: a crit throws real dust (see
// test/crit.test.mjs), never a knock. What does knock the view is a rock coming
// down, and it is the biggest knock in the game -- so the crit is swung under
// the preference for the record, and the rock is what proves the view held.
group('a crit does not shake the view', async () => {
  // Frame by frame, because a knock is short: the next rock is watched all the
  // way down and for a second after it lands, and any frame the view was off
  // its spot counts.
  const watchALanding = () => {
    window.__next();
    const was = S.landAt;
    let moved = false, after = 0, asked = 0;
    for (let i = 0; i < 60 * 30 && after < 60; i++) {
      run(1 / 60);
      if (S.shakeX || S.shakeY) moved = true;
      asked = Math.max(asked, S.shake);
      if (S.landAt !== was) after++;
    }
    return { moved, asked, landed: after > 0 };
  };

  less();
  haveRock();
  window.__crit(true);
  window.__swing(1);
  window.__crit(false);
  let movedOnCrit = false;
  for (let i = 0; i < 60; i++) { run(1 / 60); if (S.shakeX || S.shakeY) movedOnCrit = true; }
  const still = watchALanding();
  system();

  // and with the preference off the same landing rocks the yard
  window.__seed(2);
  full();
  haveRock();
  const rocked = watchALanding();
  system();

  return [
    ok(!movedOnCrit, 'a crit swing leaves the view still'),
    ok(still.landed && rocked.landed, 'a rock came down both times'),
    ok(!still.moved, 'a rock landing leaves the view still under reduced motion'),
    ok(still.asked === 0, 'and no knock is left waiting to play out', `shake ${still.asked}`),
    ok(rocked.moved, 'with the preference off the same landing rocks the yard'),
  ];
});

// --- 3. the opening, from a still seat ------------------------------------------
//
// Every beat and every body, for the same length of time; only the easing
// between framings goes. So the opening takes as many frames as it always did,
// and the view moves only where one beat hands over to the next.
group('the intro plays to the end from a still seat', async () => {
  // The same run twice, seeded. The scripted beats end on the clock, so they
  // hand over on the same frame either way. The last beat ends when a thrown
  // grain lands in the hole, and that throw is not the same throw twice: the
  // sky's motes spend the one seeded generator at screen positions, so two
  // views of one yard draw different numbers off it, and the grain's arc with
  // them. That beat is held to a second rather than a frame, for that reason
  // and no other.
  const play = () => {
    window.__seed(3);
    window.__reset(true);
    const beats = [S.intro];
    const at = [];
    const moved = [];
    let frames = 0, lastX = S.camX;
    while (!S.introDone && frames < 60 * 90) {
      run(1 / 60);
      frames++;
      if (S.intro && !beats.includes(S.intro)) { beats.push(S.intro); at.push(frames); }
      if (S.camX !== lastX) { moved.push(`${frames}:${S.intro}`); lastX = S.camX; }
    }
    return { frames, beats, at, moved, done: S.introDone };
  };

  less();
  const still = play();
  system();
  full();
  const glided = play();
  system();

  const sameBeats = still.at.length === glided.at.length &&
    still.at.every((f, i) => Math.abs(f - glided.at[i]) <= 1);

  return [
    ok(still.done, 'the opening ran to the end under reduced motion'),
    ok(still.beats.join(',') === 'leave,chat,fall,down,up,show',
       'every beat played', still.beats.join(',')),
    ok(sameBeats, 'and every beat handed over on the same frame as with the preference off',
       `${still.at.join(',')} vs ${glided.at.join(',')}`),
    ok(Math.abs(still.frames - glided.frames) <= 60,
       'and the whole opening took the same time, to within the last throw',
       `${still.frames} vs ${glided.frames}`),
    ok(still.moved.length <= still.beats.length,
       'the view moved only at a beat boundary', `moved on ${still.moved.join(' ')}`),
    ok(glided.moved.length > still.beats.length * 4,
       'where the full opening glides frame by frame', `${glided.moved.length} frames`),
  ];
});

// --- 4. the yard still walks ----------------------------------------------------
group('the yard still walks', async () => {
  less();
  window.__crew(2, 2);
  haveRock();
  run(1);
  const a = state().workerPos.join(' ');
  run(2 / 60);
  const b = state().workerPos.join(' ');
  system();
  return [
    ok(a !== b, 'two frames apart, somebody has moved', `${a} -> ${b}`),
  ];
});
