// Act 3's fallen logs (after/grove.js, `groundLogs`; after/bodies.js,
// `gather`): a tree sawn down by hand splits into its logs, which roll a
// little off the fall and come to rest on the grove's floor; idle members
// walk to each on an errand and carry it to the forestry shack's pile, and
// the saw mill's sawyer fetches them from there to its own (DESIGN.md, "Act
// 3: one job a station"). Nothing lands in a pile without a body carrying
// it there. The harness reads the save back every five seconds, so a log
// mid-roll and a body mid-walk stand where they were.
import { group, ok, run, runUntil, yard } from './helpers.mjs';
import { lying } from '../src/after/ground.js';
import { loadKind } from '../src/carry.js';
import { AFTER_LOGS_A_TREE, AFTER_LOG_ROLL_S, AFTER_FALL_S, AFTER_FALL_BOUNCE_S } from '../src/config.js';
import { plotX } from '../src/after/place.js';
import { sawOn, saw } from './after-hands.mjs';

const S = yard.S;
const OPENING = ['house-fall', 'arrive', 'meet-god', 'refuse'];
const read = () => window.__afterRead();

group('a felled tree\'s logs roll to rest, idle hands carry each to the forestry shack, and the sawyer fetches them to the mill', async () => {
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
  const split = lying().filter(q => q.i === 0);
  const fell = S.after.plots[0].fell, rolling = split.length && split.every(q => q.x > q.x0 && q.at > fell);
  run(AFTER_FALL_BOUNCE_S + AFTER_LOG_ROLL_S + 0.5);
  const nLying = lying().length, inGrove = lying().every(q => q.x > plotX(0) && q.x < plotX(1));
  // Nobody on a job: the idle at the podium go for them.
  let carried = false;
  const all = runUntil(() => {
    carried = carried || S.after.bodies.some(b => b.job == null && b.errand === 'gatherer' && loadKind(b) === 'log');
    return lying().length === 0 && read().grovelogs === AFTER_LOGS_A_TREE;
  }, 600);
  // A sawyer, the saw mill standing: it fetches the pile on to the mill.
  window.__afterGrant({ rebel: 5000 });
  S.after.built.push('mill');
  const sawyer = window.__afterPress('sawyer');
  const fed = runUntil(() => read().logs > 0 || read().timber > 0, 600);
  window.__actsOn(null);
  return [
    ok(split.length === AFTER_LOGS_A_TREE && rolling, 'down, the trunk splits into its logs, each rolling on along the ground', `${split.length} logs`),
    ok(nLying === AFTER_LOGS_A_TREE && inGrove, 'they come to rest on the grove\'s floor, inside the plot', `${nLying} lying`),
    ok(carried && all < Infinity, 'idle hands carry every one to the forestry shack\'s pile', `carried ${carried} in ${all} s, pile ${read().grovelogs}`),
    ok(sawyer && fed < Infinity && read().grovelogs < AFTER_LOGS_A_TREE, 'the sawyer fetches them from that pile to the saw mill', `${read().logs} at the mill, ${read().grovelogs} at the shack`)
  ];
});
