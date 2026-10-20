// Act 3's fallen logs (after/grove.js, `groundLogs`; after/bodies.js, the
// gatherer): a tree sawn down by hand splits into its logs, which roll a
// little off the fall and come to rest on the grove's floor; a gatherer,
// its post bought on the grove's board, walks to each, carries it to the
// forestry shack's pile, and a hauler takes them from there to the saw
// mill. Nothing lands in a pile without a body carrying it there. The
// harness reads the save back every five seconds, so a log mid-roll and a
// gatherer mid-walk stand where they were.
import { group, ok, run, runUntil, yard } from './helpers.mjs';
import { AFTER_LOGS_A_TREE, AFTER_LOG_ROLL_S, AFTER_FALL_S, AFTER_FALL_BOUNCE_S } from '../src/config.js';
import { plotX } from '../src/after/place.js';
import { sawOn, saw } from './after-hands.mjs';

const S = yard.S;
const OPENING = ['house-fall', 'arrive', 'meet-god', 'refuse'];
const read = () => window.__afterRead();

group('a felled tree\'s logs roll to rest, and a gatherer carries each to the forestry shack, a hauler on to the mill', async () => {
  window.__actsOn(true);
  S.after = null;
  window.__goPlace('after');
  for (const k of OPENING) if (!S.beatsDone.includes(k)) S.beatsDone.push(k);
  window.__grant({ dust: 200000, spores: 40000, shards: 40000, sparks: 2000 });
  run(1);
  window.__afterCrowd((i, v) => (i < 6 ? 8 : v));
  runUntil(() => read().walking === 0 && read().camp >= 4, 120);
  window.__afterAxe();
  run(0.5);
  // Sawn down by hand.
  sawOn(0);
  saw(0, () => S.after.plots[0].fall != null);
  runUntil(() => S.after.plots[0].fall == null, AFTER_FALL_S + 1);
  const split = S.after.groundLogs.filter(q => q.i === 0);
  const fell = S.after.plots[0].fell, rolling = split.length && split.every(q => q.x > q.x0 && q.at > fell);
  run(AFTER_FALL_BOUNCE_S + AFTER_LOG_ROLL_S + 0.5);
  const lying = S.after.groundLogs.length, inGrove = S.after.groundLogs.every(q => q.x > plotX(0) && q.x < plotX(1));
  const pile0 = read().grovelogs;
  // Nothing comes off the ground with nobody posted to it.
  run(20);
  const untouched = S.after.groundLogs.length === lying && read().grovelogs === pile0;
  // A gatherer's post, bought on the grove's board.
  window.__afterGrant({ rebel: 5000 });
  const post = window.__buy('after-post-gatherer');
  let carried = false;
  const all = runUntil(() => {
    carried = carried || S.after.bodies.some(b => b.job === 'gatherer' && b.load === 'log');
    return S.after.groundLogs.length === 0 && read().grovelogs === AFTER_LOGS_A_TREE;
  }, 600);
  // A hauler, and the saw mill standing: the pile goes on to the mill.
  S.after.built.push('mill');
  const hauler = window.__buy('after-post-hauler');
  const fed = runUntil(() => read().logs > 0, 600);
  window.__actsOn(null);
  return [
    ok(split.length === AFTER_LOGS_A_TREE && rolling, 'down, the trunk splits into its logs, each rolling on along the ground', `${split.length} logs`),
    ok(lying === AFTER_LOGS_A_TREE && inGrove, 'they come to rest on the grove\'s floor, inside the plot', `${lying} lying`),
    ok(untouched, 'with nobody posted they lie where they stopped'),
    ok(post && carried && all < Infinity, 'a gatherer carries every one to the forestry shack\'s pile', `post ${post} carried ${carried} in ${all} s, pile ${read().grovelogs}`),
    ok(hauler && fed < Infinity && read().grovelogs < AFTER_LOGS_A_TREE, 'a hauler takes them from that pile to the saw mill', `in ${fed} s, ${read().logs} at the mill`)
  ];
});
