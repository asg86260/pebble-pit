// The filter's rungs and the tower's are put in by a spare hand walked over
// from the yard, like every other station's. The purifier's post and the
// wizard's are where they work, so crediting either had the fan rung fill
// while the filter scrubbed and the hat rise while the wizard cast.

import { yard, group, ok, run, runUntil, openSites } from './helpers.mjs';

// Buys `key` through its row and watches the build frame by frame: whether the
// bar ever moved on a frame nobody was standing at the site as a builder, and
// whether the station's own gang left its post while it went up.
function watchBuild(key, site, gang, atPost) {
  const works = () => (yard.S.works[site] || []).find(w => w.key === key);
  const builderThere = () => yard.S.workers.some(w => w.type === 'builder' && w.goal === 'at' && w.site === site);
  const bought = window.__buy(key);
  let free = 0, off = 0, seen = false, prev = works()?.done ?? 0;
  let landed = false;
  for (let f = 0; f < 240 * 60 && !landed; f++) {
    // Either side of the frame: the reload check (test/helpers.mjs) brings a
    // builder back unseated for the frame after it, and it is re-sent at once.
    const before = builderThere();
    run(1 / 60);
    const w = works();
    if (!w) { landed = true; break; }
    if (w.done > prev && !before && !builderThere()) free++;
    if (builderThere()) seen = true;
    if (!yard.S.workers.some(o => o.type === gang && atPost(o))) off++;
    prev = w.done;
  }
  return { bought, landed, free, off, seen };
}

group('a fan rung is put in by a spare hand while the balloon goes on filtering', async () => {
  window.__reset();
  openSites();
  window.__crew(0, 2);
  window.__air({ open: true, haze: 1800, muck: 0 });
  window.__grant({ shards: 400, spores: 400, dust: 90000 });
  window.__buy('balloon'); window.__finish();
  window.__air({ purifiers: 1 });
  runUntil(() => yard.S.workers.some(w => w.type === 'purifier' && w.goal === 'aloft'), 60);
  const was = yard.S.fanLevel;
  const b = watchBuild('fan', 'filter', 'purifier', w => w.goal === 'aloft');

  return [
    ok(b.bought, 'the rung is bought off the filter\'s board'),
    ok(b.landed && yard.S.fanLevel === was + 1, 'and it lands', `${was} -> ${yard.S.fanLevel}`),
    ok(b.seen, 'a spare hand walked over to put it in'),
    ok(b.free === 0, 'and the bar never moved without one there', `${b.free} frames`),
    ok(b.off === 0, 'while the rider stayed up in its balloon the whole time', `${b.off} frames out`)
  ];
});

group('a tower rung is put in by a spare hand, not the wizard casting', async () => {
  window.__reset();
  openSites();
  window.__crew(0, 1, 0, 0, 0, 1);
  window.__grant({ sparks: 999, shards: 400, spores: 400, dust: 40000 });
  run(3);
  const was = yard.S.wizSpeedLevel;
  const b = watchBuild('wizspeed', 'tower', 'wizard', () => true);

  return [
    ok(b.bought, 'the rung is bought off the tower\'s board'),
    ok(b.landed && yard.S.wizSpeedLevel === was + 1, 'and it lands', `${was} -> ${yard.S.wizSpeedLevel}`),
    ok(b.seen, 'a spare hand walked over to put it in'),
    ok(b.free === 0, 'and the bar never moved without one there', `${b.free} frames`),
    ok(b.off === 0, 'and the wizard was never taken off the tower for it', `${b.off} frames`)
  ];
});
