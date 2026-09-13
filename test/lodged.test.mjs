// The one under the rock is lodged in the ground. Between rocks somebody digs at
// it and it comes up a little; the next rock lands before it is out and drives
// it back in. Only a rock held overhead gives the digging the time it needs.
// See intro.js, "the one underneath", and DESIGN.md, "The opening".

import { group, ok, run, runUntil, state, yard } from './helpers.mjs';

const { BURIED_DIG_S, DANCE_MS, MEET_MS } = await import('../src/config.js');

// The gap between rocks is never long enough: whoever is nearest goes and digs,
// the square rises, and the rock lands on somebody half dug out.
group('between rocks somebody digs, and there is never enough time', () => {
  const checks = [];
  window.__crew(3, 1);
  window.__jump(3);                            // past the first rock, whose finish is the reunion
  checks.push(ok(state().buried && !state().buriedVisible, 'under a rock, out of sight, to start'));

  window.__next();                             // the rock is off
  const seen = runUntil(() => state().buriedVisible, 10);
  checks.push(ok(seen, 'and there they are'));

  // Somebody walks over and digs -- one of the crew, marked for it, and the
  // square comes up while they do.
  const dug = runUntil(() => yard.S.workers.some(w => w.dig) && state().buriedDug > 0, 20);
  checks.push(ok(dug, 'one of the crew goes over and digs', `dug ${state().buriedDug}`));
  const diggers = yard.S.workers.filter(w => w.dig).length;
  checks.push(ok(diggers === 1, 'one digger, not a crowd', `${diggers}`));

  // The next rock lands before the dig is done, and undoes it.
  let most = 0;
  const landed = runUntil(() => {
    most = Math.max(most, state().buriedDug);
    return !state().buriedVisible;
  }, 40);
  checks.push(ok(landed, 'the next rock lands on them'));
  checks.push(ok(most > 0 && most < 1, 'with the dig begun and not finished', `got to ${most.toFixed(2)}`));
  checks.push(ok(state().buriedDug === 0, 'and the rock drives them back in', `dug ${state().buriedDug}`));
  checks.push(ok(!yard.S.workers.some(w => w.dig), 'and nobody is left digging under it'));
  checks.push(ok(state().buried, 'they are still under there'));
  return checks;
});

// Nobody dances through it: the digger is at the ground beside the square, not
// hopping, for as long as it digs.
group('a digger digs; it does not dance', () => {
  const checks = [];
  window.__crew(4, 2);
  window.__jump(3);
  window.__next();
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
