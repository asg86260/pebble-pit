// The one under the rock is lodged in the ground. Between rocks somebody digs at
// it and it comes up a little; the next rock lands before it is out and drives
// it back in. Only a rock held overhead gives the digging the time it needs.
// See intro.js, "the one underneath", and DESIGN.md, "The opening".

import { group, ok, run, runUntil, state, yard } from './helpers.mjs';

const { BURIED_DIG_S, DANCE_MS, MEET_MS } = await import('../src/config.js');

// There is no gap between rocks to dig in any more: after the first rock the
// next one is on its way the moment the footprint is empty (core.js,
// `ROCK_GAP_MS`), and `timeToDig` says so -- nobody so much as sets off. The
// one under the rock stays where it is, in sight for the second the ground is
// bare, until a rock is held overhead. (Wave polish, 2026-09-14: the between-
// rocks dig used to run under the dance, and the dance is gone from every rock
// but the first.)
group('between rocks nobody digs: there is no time to', () => {
  const checks = [];
  window.__crew(3, 1);
  window.__jump(3);                            // past the first rock, whose finish is the reunion
  checks.push(ok(state().buried && !state().buriedVisible, 'under a rock, out of sight, to start'));

  window.__next();                             // the rock is off
  const seen = runUntil(() => state().buriedVisible, 10);
  checks.push(ok(seen, 'and there they are'));

  // Frame by frame through the gap and the fall: nobody is sent, and the next
  // rock is down inside a couple of seconds.
  let dug = false, sent = false, frames = 0;
  while (state().buriedVisible && frames < 60 * 10) {
    run(1 / 60);
    frames++;
    if (yard.S.workers.some(w => w.dig)) sent = true;
    if (state().buriedDug > 0) dug = true;
  }
  checks.push(ok(!state().buriedVisible, 'the next rock lands on them', `${frames} frames`));
  checks.push(ok(frames < 60 * 3, 'inside a few seconds', `${(frames / 60).toFixed(1)}s`));
  checks.push(ok(!sent && !dug, 'and nobody went to dig in that time', `sent ${sent}, dug ${dug}`));
  checks.push(ok(state().buriedDug === 0 && state().buried, 'they are still under there'));
  return checks;
});

// Given time -- the one thing the between-rocks gap no longer has -- somebody
// goes and digs, and nobody dances through it: the digger is at the ground
// beside the square, not hopping, for as long as it digs. The time is lent by
// hand here (a celebration on the clock, the way the first rock's finish has
// one); the dome's hold is the place a player sees it, and shield.test.mjs
// covers that.
group('a digger digs; it does not dance', () => {
  const checks = [];
  window.__crew(4, 2);
  window.__jump(3);
  window.__next();
  run(1 / 60);                                 // the frame the rock dies zeroes the clock (core.js)
  yard.S.danceUntil = yard.clock.now() + DANCE_MS * 3;
  runUntil(() => yard.S.workers.some(w => w.dig && !w.walking), 20);
  const who = yard.S.workers.find(w => w.dig && !w.walking);
  checks.push(ok(!!who, 'somebody is at it'));
  if (!who) return checks;
  const x0 = who.x;
  let moved = 0, swung = false;
  for (let i = 0; i < 20 && who.dig && state().buriedVisible; i++) {
    run(0.1);
    moved = Math.max(moved, Math.abs(who.x - x0));
    if (who.lunge > 0.5) swung = true;
  }
  checks.push(ok(moved < 2, 'it stands where it stopped', `drifted ${moved.toFixed(1)}px`));
  checks.push(ok(swung, 'and swings'));
  yard.S.danceUntil = 0;
  return checks;
});

// The dig is measured against the gaps: longer than the dance, so that between
// rocks it can never finish.
group('the dig is longer than any gap the rocks leave', () => {
  const dance = DANCE_MS / 1000, meet = MEET_MS / 1000;
  return [
    ok(BURIED_DIG_S > dance, 'longer than the dance', `${BURIED_DIG_S}s vs ${dance}s`),
    ok(BURIED_DIG_S > meet, 'and longer than the reunion', `${BURIED_DIG_S}s vs ${meet}s`)
  ];
});
