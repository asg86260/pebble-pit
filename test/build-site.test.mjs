// Act 3 builds through the yard's construction (DESIGN.md, "Act 3 builds
// through the yard's construction"): a station bought at the build sign in
// its lot is a building on the yard's works, put up by one member who walks
// over and hammers there, and it rises only while that member is at it. It
// stands when the work lands, and its builder goes back to the podium.
//
// Reached the way a player reaches it: the sign in the saw mill's lot
// pressed (`signPress`). The setup it is not about: the act on and its
// opening played, members walked out, coins granted.
import { group, ok, run, runUntil, yard } from './helpers.mjs';
import { RIM_PIECES } from '../src/config.js';
import { AFTER_JOB } from '../src/jobs.js';
import { workOn, progressOf, handsAt } from '../src/works.js';
import { signs, signMid, signPress } from '../src/buildsign.js';
import { flowBy } from '../src/flow.js';
import { purse } from '../src/words.js';

const S = yard.S;
const OPENING = ['house-fall', 'arrive', 'meet-god', 'refuse'];
const builders = () => S.after.bodies.filter(b => b.job === AFTER_JOB.BUILD);

group('a station bought at its build sign is built on the yard\'s works by one member at its lot, and stands', async () => {
  window.__actsOn(true);
  window.__goPlace('after');
  for (const k of OPENING) if (!S.beatsDone.includes(k)) S.beatsDone.push(k);
  window.__grant({ dust: 1e7, spores: 2e6, shards: 2e6, scales: 2e5, sparks: 2e5 });
  S.after.speech = { next: 1e9, f0: 0, held: null };
  window.__afterCrowd((i, v) => (i < 6 ? RIM_PIECES : v));
  runUntil(() => window.__afterRead().walking === 0, 240);
  window.__afterGrant({ rebel: 9000 });
  const rebel0 = purse('rebel');
  const at = signMid('after-mill', 'after');
  const pressed = !!at && signPress(at.x, at.y);
  const w = workOn('after-build-mill'), now = () => workOn('after-build-mill');
  const paid = rebel0 - purse('rebel');
  const signGone = !signs('after').some(s => s.key === 'after-mill');
  // Nothing moves until the builder is standing at the lot.
  let early = false, most = 0;
  for (let k = 0; k < 600 && w && !builders().some(b => b.goal === 'at'); k++) {
    run(1 / 30);
    if (now() && progressOf(now()) > 0 && !builders().some(b => b.goal === 'at')) early = true;
    most = Math.max(most, builders().length);
  }
  const arrived = builders().some(b => b.goal === 'at' && b.site === 'after-mill');
  let hammered = false;
  for (let k = 0; k < 120; k++) { run(1 / 30); if (builders().some(b => b.jigAt != null)) hammered = true; most = Math.max(most, builders().length); }
  const going = now() ? progressOf(now()) : 0, hands = handsAt('after-mill');
  const stood = runUntil(() => S.after.built.includes('mill'), 200);
  run(2);
  const after = builders().length;
  const by = flowBy();
  window.__actsOn(null);
  return [
    ok(pressed && !!w && w.of > 0, 'the sign\'s press starts the saw mill as a work on the yard\'s works', `pressed ${pressed}, work ${!!w}`),
    ok(paid > 0 && signGone, 'its bill is taken once and its sign goes', `paid ${paid}, sign gone ${signGone}`),
    ok(!early && arrived, 'it does not move until a member has walked over and stands at its lot'),
    ok(hammered && hands === 1 && most === 1 && going > 0, 'one member, and one only, hammers there and it rises', `hammered ${hammered}, hands ${hands}, builders at most ${most}, at ${going}`),
    ok(stood && after === 0, 'the mill stands when the work lands, and its builder goes back', `stood ${stood}, builders after ${after}`),
    ok(!Object.keys(by).some(k => k.startsWith('load:')), 'no load is made or laid: the loads are gone', Object.keys(by).join(' '))
  ];
});
