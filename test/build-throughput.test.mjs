// The builders against a backlog: every row the yard sells pressed at once,
// the way a player with a full purse presses a whole board, so seven sites
// each have a line of works and the builders are spread one a site. See
// DESIGN.md, "The one bench carries two ladders' worth of waiting".
//
// The fault this guards: a build landing makes one builder fewer, and the
// body given up was whichever builder stood last in the crew's list --
// usually one hammering at another site -- so the body just freed walked the
// yard to take over the work its neighbor was pulled off, and that site stood
// empty for the walk.
//
// Reload off: the group follows each builder body across the run, and a load
// makes every body fresh.

import { yard, group, ok, run } from './helpers.mjs';
import { SITES, worksAt, onTheGo, handsAt, handsOn, effortAt, busyBuilderSites } from '../src/works.js';
import { TYPE } from '../src/jobs.js';
import { rebalance } from '../src/staffing.js';
import { syncWorkers } from '../src/crew.js';

const S = yard.S;

// The doors' conditions are set, not played: what is under test is the
// backlog, not how the yard came to have seven places.
function wideYard() {
  window.__crew(3, 3, 5, 7); window.__machineGates();
  window.__grant({ sparks: 99999, shards: 99999, spores: 99999, dust: 9e9 });
  window.__shack();
  window.__answered('props', 'net', 'arch');
  Object.assign(S, { boulderNo: Math.max(S.boulderNo, 3), rains: 1, seenAir: true, seenMess: true, seenSpore: true });
  window.__buy('jaw'); window.__finish();
  for (let pass = 0; pass < 6; pass++) {
    for (const r of window.__rows()) if (r.shown && !r.done && /^unlock/.test(r.key)) window.__buy(r.key);
    window.__finish(); run(1);
  }
  // Spare hands besides, so the builders are the yard's spares rather than
  // bodies lent off the stations.
  S.crew += 8; rebalance(); syncWorkers();
  run(2);
}

group('a backlog over every site clears at one body a site, nobody pulled off a work', async () => {
  wideYard();
  // Three passes over every board, so a ladder has its next copies queued
  // behind the first, as a card pressed again queues them.
  for (let pass = 0; pass < 3; pass++)
    for (const r of window.__rows()) if (r.shown && !r.done) window.__buy(r.key);
  const queued = () => SITES.flatMap(s => worksAt(s));
  const bySite = {};
  for (const s of SITES) {
    const left = worksAt(s).reduce((n, w) => n + (w.of - w.done), 0);
    if (left > 0) bySite[s] = left / effortAt(s);
  }
  const sites = Object.keys(bySite).length;
  // The floor: one body to a work and one work on the go a site, so the
  // backlog can clear no sooner than its deepest site's line.
  const floor = Math.max(...Object.values(bySite));

  const builders = () => S.workers.filter(w => w.type === TYPE.BUILD);
  const last = new Map();          // body -> the work it was at last frame
  let frames = 0, bodyFrames = 0, hammering = 0, pulled = 0, cleared = null;
  const gap = {};                  // site -> { manned, run, worst } in frames
  const pulledOff = [];
  while (frames < (floor + 120) * 60) {
    run(1 / 60);
    frames++;
    const now = builders();
    // A body that was at a work last frame and is no builder now, while that
    // work is still on the go: given up off a work somebody must walk back to.
    for (const [w, at] of last) {
      if (now.includes(w)) continue;
      if (at && onTheGo(at.site).some(x => x.id === at.id)) { pulled++; pulledOff.push(`${at.site}#${at.id}@${frames}`); }
      last.delete(w);
    }
    for (const w of now) {
      bodyFrames++;
      if (w.goal === 'at' && w.site && handsOn(w.site, w.workId) > 0) hammering++;
      last.set(w, w.goal === 'at' && w.site ? { site: w.site, id: w.workId } : null);
    }
    for (const site of busyBuilderSites()) {
      const g = gap[site] ||= { manned: false, run: 0, worst: 0 };
      if (handsAt(site) > 0) { g.manned = true; g.run = 0; }
      else if (g.manned) g.worst = Math.max(g.worst, ++g.run);
    }
    if (!queued().length) { cleared = frames / 60; break; }
  }
  const share = hammering / Math.max(1, bodyFrames);
  // The walk to a site is the yard's, the same however short the work is, so
  // the check is on the seconds it costs, not on a share of a backlog that
  // shrinks when builds do (the owner, 2026-10-29: 30 s at most).
  const WALK_TO_SITE_S = 10;
  const idle = (bodyFrames - hammering) / 60;
  const worstGap = Object.entries(gap).sort((a, b) => b[1].worst - a[1].worst)[0] || ['-', { worst: 0 }];

  return [
    ok(sites >= 6, 'the backlog spans the yard\'s sites', `${sites} sites: ${JSON.stringify(bySite)}`),
    ok(pulled === 0, 'no builder is given up off a work still going up', pulledOff.join(' ')),
    // A site whose work lands takes its next with the body already there; the
    // one walk inside a line is the yard's own, between two buildings that
    // stand apart (measured 2.7 s). A body sent across the yard to cover for
    // one pulled away was 3 to 11 s.
    ok(worstGap[1].worst <= 5 * 60, 'and once a site is manned it is never left waiting on a walk from another site',
       `${worstGap[0]} ${(worstGap[1].worst / 60).toFixed(1)}s`),
    // The floor and one walk the length of the yard at a trip's pace, which is
    // what the deepest site's first builder can be owed (measured up to 18 s).
    ok(cleared != null && cleared <= floor + 20, 'the backlog clears within one walk of its deepest line',
       `${cleared?.toFixed(0) ?? 'not cleared'}s against a floor of ${floor.toFixed(0)}s`),
    // Measured 47 body-seconds with the fix, nearly all of it the first walk to each site.
    ok(idle <= sites * WALK_TO_SITE_S, 'and the builders are hammering but for the first walk to each site', `${idle.toFixed(0)} body-s not hammering, ${(100 * share).toFixed(1)}% hammering, ${sites} sites`)
  ];
}, { reload: false });
