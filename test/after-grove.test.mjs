// Act 3's grove, rebuilt (DESIGN.md, "Act 3's grove, rebuilt", "Checks"),
// reached the player's way: every row bought through `__buy`, every member
// put on through its roster's + (`__afterPress`). The setup a check is not
// about goes through the act's hooks: the yard's coins and rebel granted, the
// crowd's rims set, the dev travel up with the act's opening beats played.
// Each track's checks are their own block below.
import { group, ok, run, runUntil, until, yard } from './helpers.mjs';
import { AFTER_UPGRADES, AFTER_BUILDS, AFTER_SEAT_BILLS, AFTER_PILES, AFTER_TREE, TREE_CHOPS, RIM_PIECES, ACT_CAPTION_S } from '../src/config.js';
import { lying } from '../src/after/ground.js';

const S = yard.S;
const read = () => window.__afterRead();
const OPENING = ['house-fall', 'arrive', 'meet-god', 'refuse'];
// Every act 3 bill once, and every seat twice over, in the yard's coins.
const YARD_PURSE = (() => {
  const sum = { dust: 0, spore: 0, shard: 0, scale: 0, spark: 0 };
  const bills = [...Object.values(AFTER_BUILDS).map(b => b.bill), ...Object.values(AFTER_UPGRADES).flatMap(u => u.bills), ...AFTER_SEAT_BILLS, ...AFTER_SEAT_BILLS];
  for (const bill of bills) for (const [c, n] of bill) if (c in sum) sum[c] += n;
  return { dust: sum.dust, spores: sum.spore, shards: sum.shard, scales: sum.scale, sparks: sum.spark };
})();
const up = () => {
  window.__actsOn(true);
  window.__goPlace('after');
  for (const k of OPENING) if (!S.beatsDone.includes(k)) S.beatsDone.push(k);
  window.__grant(YARD_PURSE);
  run(1);
};
// The camp given `n` members, walked out and standing on their spots.
function members(n) {
  window.__afterCrowd((i, v) => (i < n ? RIM_PIECES : v));
  runUntil(() => read().walking === 0 && read().camp >= n, 120);
}
// A member put on `job` through the roster's +, a seat bought first where the
// seats are full (its timber an order the idle carry in).
const putOn = job => window.__afterPress(job) || (window.__afterGrant({ timber: AFTER_PILES.timber.brim }), !!window.__buy(`after-seat-${job}`)
  && (runUntil(() => !S.after.orders.length, 240), window.__afterPress(job)));

// --- track B: the woodcutter and the saw -----------------------------------------------
import { sawSpot, AFTER_CREW } from '../src/after/bodies.js';
import { AFTER_WALK } from '../src/config.js';
import { AP } from '../src/after/place.js';
import { jobSays } from '../src/after/roster.js';
import { msg } from '../src/lang.js';
group('the woodcutter waits by a grown tree until the saw is bought, then saws it down; its four logs land on the break frame and are carried to the shack\'s pile', async () => {
  up();
  members(4);
  window.__afterGrant({ rebel: 3000 });
  const put = putOn('woodcutter');
  const cutter = () => S.after.bodies.find(b => b.job === 'woodcutter');
  run(40);
  // Waiting: at the tree, facing it, nothing sawn.
  const w0 = cutter(), plot = () => S.after.plots[0];
  const waited = !!w0 && Math.abs(w0.x - sawSpot(0)) <= AP && w0.face < 0 && plot().chops === 0 && plot().fall == null && !w0.sawing;
  const note = jobSays('woodcutter');
  const bought = window.__buy('after-saw');
  const handed = runUntil(() => S.after.sawHanded, 4 * ACT_CAPTION_S);
  // Sawing: a frame at a time from here, so the break is seen on its frame.
  // Once, mid-stroke, the woodcutter is taken up by the hand and set down a
  // way off (the place body engine's own calls): it walks back, never put back.
  let frames = 0, strokes = plot().chops, last = plot().chops, moved = null;
  while (plot().fall == null && frames < 60 * 60) {
    const w = cutter();
    if (moved == null && w.sawing && plot().chops >= 2) {
      AFTER_CREW.lifted(w); AFTER_CREW.hold(w, w.x + 20 * AP, w.y - 9);
      const x0 = w.x;
      run(1 / 60); frames++;
      moved = Math.abs(cutter().x - x0);
    } else { run(1 / 60); frames++; }
    if (plot().chops !== last) { if (plot().chops > last) strokes++; last = plot().chops; }
  }
  const by = plot().by, felledIn = frames / 60;
  const fromTree = () => lying().filter(q => q.i === 0).length;
  const seen = [];
  for (let f = 0; f < 60 * 5 && seen.length < 2; f++) {
    const before = fromTree();
    run(1 / 60);
    if (fromTree() !== before) seen.push([before, fromTree()]);
  }
  const g0 = read().grovelogs;
  const carried = runUntil(() => read().grovelogs >= g0 + AFTER_TREE.logs && !lying().some(q => q.kind === 'log' || q.kind == null), 120);
  window.__actsOn(null);
  return [
    ok(put && waited, 'put on through its roster, the woodcutter waits by the grown tree, facing it, and saws nothing before the saw is bought', JSON.stringify({ put, x: w0 && Math.round(w0.x), at: Math.round(sawSpot(0)), chops: plot().chops })),
    ok(note.includes(msg('after-stall-saw')), 'its roster note says it is waiting on the saw', note),
    ok(bought && handed, 'the saw row bought hands it the saw'),
    ok(by === 'worker' && strokes === TREE_CHOPS - 1, 'it saws the tree down itself, a stroke a cut (the last one starts the fall)', JSON.stringify({ by, strokes, secs: felledIn.toFixed(2) })),
    ok(moved != null && moved <= AFTER_WALK / 60 + 1, 'taken up mid-stroke and set down a way off, it walks back to the tree, never put back', `${moved} px in a frame`),
    ok(seen.length === 1 && seen[0][0] === 0 && seen[0][1] === AFTER_TREE.logs, 'its four logs appear together, on the one frame the trunk breaks', JSON.stringify(seen)),
    ok(carried, 'and they are carried to the forestry shack\'s pile', `${g0} -> ${read().grovelogs}`)
  ];
});

// --- track C: the stump (DESIGN.md, "Act 3's grove, rebuilt", call 10) ----------------
import { AFTER_DIG_CLICKS, GESTURE_STRAIN_S } from '../src/config.js';
import { pileCount } from '../src/after/piles.js';
import { cellOf } from '../src/grid.js';

group('track C: with stump removal bought, the woodcutter pulls the stump, a beat a root, and carries the stump-log to the pile', async () => {
  up();
  runUntil(() => read().walking === 0, 120);
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
