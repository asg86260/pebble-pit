// Act 3's grove, rebuilt (DESIGN.md, "Act 3's grove, rebuilt", "Checks"),
// reached the player's way: every row bought through `__buy`, every member
// put on through its roster's + (`__afterPress`). The setup a check is not
// about goes through the act's hooks: the yard's coins and rebel granted, the
// crowd's rims set, the dev travel up with the act's opening beats played.
// Each track's checks are their own block below.
import { group, ok, run, runUntil, yard } from './helpers.mjs';
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
import { sawSpot } from '../src/after/bodies.js';
import { AP } from '../src/after/place.js';
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
  const bought = window.__buy('after-saw');
  const handed = runUntil(() => S.after.sawHanded, 4 * ACT_CAPTION_S);
  // Sawing: a frame at a time from here, so the break is seen on its frame.
  let frames = 0, strokes = plot().chops, last = plot().chops;
  while (plot().fall == null && frames < 60 * 60) { run(1 / 60); frames++; if (plot().chops !== last) { if (plot().chops > last) strokes++; last = plot().chops; } }
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
    ok(bought && handed, 'the saw row bought hands it the saw'),
    ok(by === 'worker' && strokes === TREE_CHOPS - 1, 'it saws the tree down itself, a stroke a cut (the last one starts the fall)', JSON.stringify({ by, strokes, secs: felledIn.toFixed(2) })),
    ok(seen.length === 1 && seen[0][0] === 0 && seen[0][1] === AFTER_TREE.logs, 'its four logs appear together, on the one frame the trunk breaks', JSON.stringify(seen)),
    ok(carried, 'and they are carried to the forestry shack\'s pile', `${g0} -> ${read().grovelogs}`)
  ];
});
