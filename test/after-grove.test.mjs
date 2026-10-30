// Act 3's grove, rebuilt (DESIGN.md, "Act 3's grove, rebuilt", "Checks",
// node tier), reached the way a player reaches it: every row bought through
// `__buy`, every member put on through its roster's + (`__afterPress`). The
// setup a check is not about goes through the act's hooks: the yard's coins
// granted, the dev travel up (`__goPlace`) with the act's opening beats
// marked played, a plot stood as the check needs it. Each track's checks are
// a block of their own.
import { group, ok, run, runUntil, until, yard } from './helpers.mjs';

const S = yard.S;
const read = () => window.__afterRead();
const OPENING = ['house-fall', 'arrive', 'meet-god', 'refuse'];
// The act up with the yard's coins to pay its bills (the setup no check here
// is about), its first members stood in the camp.
const up = () => {
  window.__actsOn(true);
  window.__goPlace('after');
  for (const k of OPENING) if (!S.beatsDone.includes(k)) S.beatsDone.push(k);
  window.__grant({ dust: 2e6, spores: 5e5, shards: 5e5, scales: 3e4, sparks: 5e4 });
  run(1);
  runUntil(() => read().walking === 0, 120);
};

// --- track C: the stump (DESIGN.md, "Act 3's grove, rebuilt", call 10) ----------------
import { AFTER_DIG_CLICKS, AFTER_TREE, GESTURE_STRAIN_S } from '../src/config.js';
import { pileCount } from '../src/after/piles.js';
import { lying } from '../src/after/ground.js';
import { cellOf } from '../src/grid.js';

group('track C: with stump removal bought, the woodcutter pulls the stump, a beat a root, and carries the stump-log to the pile', async () => {
  up();
  window.__afterGrant({ rebel: 3000 });
  // a stump on the first plot and nothing lying, the setup the pull is not about
  Object.assign(S.after.plots[0], { grow: null, stump: true, dug: 0 });
  const tone = S.after.plots[0].tones[AFTER_TREE.logs], none = lying().length === 0;
  const post = window.__afterPress('woodcutter');
  run(20);
  const waited = S.after.plots[0].stump && S.after.plots[0].dug === 0;
  const bought = window.__buy('after-stumps');
  // each root's snap, on the act's clock, until the stump is out
  const beats = [];
  let last = 0;
  const out = await until(() => {
    const p = S.after.plots[0], dug = p.stump ? p.dug : AFTER_DIG_CLICKS;
    if (dug > last) { beats.push(S.after.t); last = dug; }
    return !p.stump;
  }, 120 * 60);
  const gaps = beats.slice(1).map((t, k) => t - beats[k]);
  const w = S.after.bodies.find(b => b.job === 'woodcutter');
  const carried = !!w && w.load.length === 1 && w.load[0] === cellOf('log', tone);
  const pile0 = pileCount('grovelogs');
  const home = runUntil(() => pileCount('grovelogs') > pile0, 120);
  const emptied = !!w && w.load.length === 0;
  window.__actsOn(null);
  return [
    ok(none && post && waited, 'put on, the woodcutter leaves the stump until stump removal is bought', JSON.stringify({ none, post, waited })),
    ok(bought && out, 'bought, it pulls the stump out', JSON.stringify({ bought, out })),
    ok(beats.length === AFTER_DIG_CLICKS && gaps.every(g => g >= GESTURE_STRAIN_S), `its ${AFTER_DIG_CLICKS} roots give a beat each, a strain apart`, JSON.stringify(gaps)),
    ok(carried, 'the stump comes out straight into its arms, a log in the stump\'s own tone', JSON.stringify(w && w.load)),
    ok(home && emptied, 'and it carries the stump-log to the forestry shack\'s pile', JSON.stringify({ home, pile0 }))
  ];
});
