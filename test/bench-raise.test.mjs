// The bench is built, not delivered.
//
// It used to appear the frame `canAfford()` first went true -- the one thing in
// this yard that teleported, and the first structure a player ever saw. Now a
// call to build stands on its footprint, and pressing it opens an ordinary work
// on the yard that your one digger walks over and does. See raise.js and
// DESIGN.md, "The bench is built, not delivered".
//
// Pressed the player's way: `raiseBench` is the function the button on the page
// calls, so a check that calls it is going through the same door. The button
// itself -- that it is on the window, that nothing is over it, that a click on
// it lands -- is the browser tier's business and is checked in
// src/selftest/opening.js, which is where a real pointer lives.

import { group, ok, state, run, runUntil, yard } from './helpers.mjs';
import { callOut, raising, raiseBench } from '../src/raise.js';
import { workOn, progressOfKey } from '../src/works.js';

// A yard with a body in it and nothing bought: the game a player is looking at
// about fifteen seconds in.
function opened() {
  window.__reset();
  window.__crew(1);
  run(0.5);
}

group('nothing to buy, nothing to build', async () => {
  opened();
  return [
    ok(!yard.S.seenBench, 'no bench on a game that cannot afford anything'),
    ok(!callOut(), 'and no call to build one either')
  ];
});

group('the first row you can afford brings the call, not the bench', async () => {
  opened();
  window.__give(100);
  run(0.5);
  const asked = callOut();
  // ...and it is a call and not a countdown: left alone it never becomes a
  // bench, however long the yard is left running.
  run(40);
  return [
    ok(asked, 'the call is out'),
    ok(!yard.S.seenBench, 'and the bench is still not there forty seconds later'),
    ok(callOut(), 'the call is still standing, waiting to be pressed')
  ];
});

group('pressing it puts a body on it and a bench up', async () => {
  opened();
  window.__give(100);
  run(0.5);
  const pressed = raiseBench();
  const work = workOn('raisebench');
  const wasCalling = callOut();

  // The one digger is taken off the rock and lent to the yard -- `rebalance`
  // does this for any build with nobody spare, and at this point in a game
  // there is exactly one body and it is on the rock.
  runUntil(() => yard.S.rockhands === 0, 10);
  const lentOff = yard.S.rockhands;
  const builders = yard.S.workers.filter(w => w.type === 'builder').length;
  runUntil(() => progressOfKey('yard', 'raisebench') > 0.1, 30);
  const moving = progressOfKey('yard', 'raisebench');

  const built = runUntil(() => yard.S.seenBench, 90);
  run(2);                                   // and the walk home

  return [
    ok(pressed, 'the call takes the press'),
    ok(!!work, 'a work opens on the yard'),
    ok(!wasCalling, 'and the call is gone the moment it is pressed'),
    ok(lentOff === 0, 'the digger comes off the rock to do it', `${lentOff}`),
    ok(builders === 1, 'and stands at the yard as a builder', `${builders}`),
    ok(moving > 0.1, 'the bar moves while somebody is there', `${moving.toFixed(2)}`),
    ok(built && yard.S.seenBench, 'the bench stands when the work lands'),
    ok(!workOn('raisebench'), 'and the work is off the yard'),
    ok(yard.S.rockhands === 1, 'the digger goes back to the rock', `${yard.S.rockhands}`)
  ];
});

group('the call goes the moment it is pressed', async () => {
  opened();
  window.__give(100);
  run(0.5);
  const before = callOut();
  raiseBench();
  const during = callOut();
  const twice = raiseBench();
  runUntil(() => yard.S.seenBench, 90);
  return [
    ok(before, 'it was out'),
    ok(!during, 'and gone while the build is on'),
    ok(!twice, 'and pressing again does nothing'),
    ok(!callOut(), 'and it never comes back once the bench stands')
  ];
});

// Nothing new is saved: the call is derived, and the work rides in `S.works`
// like every other. A save taken mid-build comes back mid-build.
group('a save taken mid-build comes back mid-build', async () => {
  opened();
  window.__give(100);
  run(0.5);
  raiseBench();
  runUntil(() => progressOfKey('yard', 'raisebench') > 0.2, 40);
  const was = progressOfKey('yard', 'raisebench');
  window.__reload();
  const back = progressOfKey('yard', 'raisebench');
  const notYet = !yard.S.seenBench;
  const built = runUntil(() => yard.S.seenBench, 90);
  return [
    ok(was > 0.2, 'the build was under way', `${was.toFixed(2)}`),
    ok(back > 0.2, 'and it is still under way after a reload', `${back.toFixed(2)}`),
    ok(notYet, 'the bench was not up when it came back'),
    ok(built, 'and it finishes from where it was')
  ];
});
