// The one under a rock being mined calls on a timer (intro.js, `buriedCalls`),
// only while the rock is being struck, in one of BURIED_CALLS' patterns, and
// never while a beat owns her marks.
import { group, ok, run, state, yard } from './helpers.mjs';

const { BURIED_CALL_MS, BURIED_CALL_JITTER, BURIED_CALLS } = await import('../src/config.js');

const watch = (seconds, strike) => {
  const pats = [];
  let was = 0, owned = 0;
  for (let f = 0; f < 60 * seconds; f++) {
    if (strike && f % 60 === 0) window.__swing(1);
    run(1 / 60);
    const at = yard.S.buriedCall;
    if (at && at !== was) pats.push(yard.S.buriedPat);
    was = at;
    if (yard.S.buriedSay && yard.S.beat.yard) owned++;
  }
  return { pats, calls: pats.length, owned };
};

group('under a rock being mined she calls about every BURIED_CALL_MS', () => {
  const checks = [];
  window.__crew(0, 0);
  window.__jump(3);                            // past the first rock; she is under the second
  checks.push(ok(state().buried && !state().buriedVisible, 'under a rock'));
  const { calls, owned } = watch(60, true);
  const want = 60000 / BURIED_CALL_MS;
  checks.push(ok(calls >= want * (1 - BURIED_CALL_JITTER) - 2 && calls <= want * (1 + BURIED_CALL_JITTER) + 1,
    'about the configured rate', `${calls} calls in a minute, ${want} expected`));
  checks.push(ok(owned === 0, 'none while a beat owns the yard'));
  return checks;
});

group('her calls vary: several patterns, never one twice running, "!" the commonest', () => {
  const checks = [];
  window.__crew(0, 0);
  window.__jump(3);
  const { pats } = watch(240, true);
  const bangs = pats.filter(p => BURIED_CALLS[p].steps.some(s => s[0] === 'bang')).length;
  checks.push(ok(new Set(pats).size >= 3, 'at least three patterns', [...new Set(pats)].join(',')));
  checks.push(ok(pats.every((p, i) => i === 0 || p !== pats[i - 1]), 'never the same twice running', pats.join(',')));
  checks.push(ok(bangs > pats.length / 2, '"!" calls are the majority', `${bangs} of ${pats.length}`));
  checks.push(ok(pats.every(p => BURIED_CALLS[p]) && !Object.values(BURIED_CALLS)
    .some(c => c.steps.some(s => ['heart', 'note'].includes(s[0]))), 'nothing warm'));
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
