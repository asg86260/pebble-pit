// The bench's build-speed ladder: a builder's pace, bought a rung at a time,
// and every build at every site going that much faster.
//
// Bought through the row, the way a player does. What a rung is worth is read
// off a build the yard really has under way: the seconds it has left with one
// pair of hands on it (`leftAt`), which is the work over the site's effort.

import { group, ok, run, climb, openSites } from './helpers.mjs';
import { S } from '../src/state.js';
import { LADDER, LADDERS, BUILD_CAP_S } from '../src/config.js';
import { buildSpeed } from '../src/levels.js';
import { leftAt, worksAt, SITES } from '../src/works.js';

const row = () => window.__rows().find(r => r.shown && r.key === 'buildspeed');
const goingKey = key => SITES.map(s => ({ s, w: worksAt(s).find(x => x.key === key) })).find(x => x.w);

// Something that takes time and has a site: the outhouse's row, bought and
// left standing as a work with its seconds read at once.
const outhouseLeft = () => {
  window.__grant({ dust: 1e9, spores: 1e9, shards: 1e9, sparks: 1e6, cores: 9 });
  S.seenMess = true;
  window.__crew(1, 1);
  if (!window.__buy('unlockouthouse')) return null;
  const g = goingKey('unlockouthouse');
  return g ? { left: leftAt(g.s, g.w), of: g.w.of } : null;
};

group('the build-speed row is on the bench, in its own section, eight rungs long', async () => {
  window.__reset();
  S.autoMine = true;
  openSites();
  window.__grant({ dust: 1e9, spores: 1e9, shards: 1e9, sparks: 1e6 });
  run(1);
  const first = row();
  const got = climb('buildspeed', 20);
  return [
    ok(!!first, 'the row is offered on the bench'),
    ok(got === LADDER, `and takes ${LADDER} rungs`, String(got)),
    ok(S.buildSpeedLevel === LADDER, 'the level is the top', String(S.buildSpeedLevel)),
    ok(buildSpeed() === 2, 'which doubles a builder at the top', String(buildSpeed())),
    ok(LADDERS.buildspeed.value.length === LADDER + 1 && LADDERS.buildspeed.dust.length === LADDER,
       'written as a foot and a value a rung, with a dust cost a rung')
  ];
});

group('a bought rung makes the same build finish proportionally sooner', async () => {
  window.__reset();
  window.__grant({ dust: 1e9, spores: 1e9, shards: 1e9, sparks: 1e6, cores: 9 });
  const slow = outhouseLeft();
  window.__reset();
  window.__grant({ dust: 1e9, spores: 1e9, shards: 1e9, sparks: 1e6 });
  S.autoMine = true;
  openSites();
  run(1);
  const rungs = climb('buildspeed', 4);
  const quick = outhouseLeft();
  const k = LADDERS.buildspeed.value[rungs];
  return [
    ok(!!slow && !!quick, 'the outhouse goes up as a build both times'),
    ok(slow && quick && slow.of === quick.of, 'the same work', `${slow?.of} vs ${quick?.of}`),
    ok(slow && quick && Math.abs(slow.left / quick.left - k) < 0.01,
       `four rungs in, it takes 1/${k} of the time`, `${slow?.left} -> ${quick?.left}`),
    ok(slow && quick && slow.left <= BUILD_CAP_S * 1000 + 1 && quick.left < slow.left, 'inside the cap, and sooner', `${slow?.left} ${quick?.left}`)
  ];
});

group('the bought rung is still there after a reload', async () => {
  window.__reset();
  S.autoMine = true;
  openSites();
  openSites();
  window.__grant({ dust: 1e9, spores: 1e9, shards: 1e9, sparks: 1e6 });
  run(1);
  const got = climb('buildspeed', 3);
  window.__reload();
  return [
    ok(got === 3, 'three rungs bought', String(got)),
    ok(S.buildSpeedLevel === 3, 'and the level reads back', String(S.buildSpeedLevel)),
    ok(buildSpeed() === LADDERS.buildspeed.value[3], 'at its written value')
  ];
});
