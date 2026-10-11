// The one under a rock being mined calls "!" on a timer (intro.js, `buriedCalls`),
// only while the rock is being struck, and never while a beat owns her marks.
import { group, ok, run, state, yard } from './helpers.mjs';

const { BURIED_CALL_MS, BURIED_CALL_JITTER } = await import('../src/config.js');

const watch = (seconds, strike) => {
  let calls = 0, was = false, ownedBang = 0;
  for (let f = 0; f < 60 * seconds; f++) {
    if (strike && f % 60 === 0) window.__swing(1);
    run(1 / 60);
    const say = yard.S.buriedSay;
    const bang = !!say && say.mark === 'bang';
    if (bang && !was) calls++;
    if (bang && yard.S.beat.yard) ownedBang++;
    was = bang;
  }
  return { calls, ownedBang };
};

group('under a rock being mined she calls about every BURIED_CALL_MS', () => {
  const checks = [];
  window.__crew(0, 0);
  window.__jump(3);                            // past the first rock; she is under the second
  checks.push(ok(state().buried && !state().buriedVisible, 'under a rock'));
  const { calls, ownedBang } = watch(60, true);
  const want = 60000 / BURIED_CALL_MS;
  checks.push(ok(calls >= want * (1 - BURIED_CALL_JITTER) - 2 && calls <= want * (1 + BURIED_CALL_JITTER) + 1,
    'about the configured rate', `${calls} calls in a minute, ${want} expected`));
  checks.push(ok(ownedBang === 0, 'none while a beat owns the yard'));
  return checks;
});

group('an unstruck rock stays quiet', () => {
  const checks = [];
  window.__crew(0, 0);
  window.__jump(3);
  const { calls } = watch(20, false);
  checks.push(ok(calls === 0, 'nobody mining, nobody calls', `${calls}`));
  return checks;
});
