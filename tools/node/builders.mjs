// The builders against a representative backlog: every row in the yard that
// raises a work pressed at once, and every builder's every frame put in one
// of a few buckets, so "builders did useful work N% of the time" names where
// the rest went.
//
//   node tools/node/builders.mjs [limit-s] [--open] [--spare N] [--log n] [--watch f0-f1]
//
// `--open` puts every place up first, so the backlog spans seven sites rather
// than an opening yard's four. `--spare` is how many hands are spare besides
// the stations' (0: every builder is a body lent off a station). `--log`
// prints one line a frame for one body (its index among the builders as
// first seen) while it is not hammering, plus every body given up off a work
// still standing; `--watch` prints every builder every tenth frame between
// two frames. See DESIGN.md, "The one bench carries two ladders' worth of
// waiting".

import { newYard } from './yard.mjs';

const args = process.argv.slice(2);
const num = (flag, d) => { const i = args.indexOf(flag); return i >= 0 ? +args[i + 1] : d; };
const LIMIT = +(args.find(a => /^\d+$/.test(a)) || 1500);
const SPARE = num('--spare', 8);
const LOG = num('--log', -1);
const WATCH = args.includes('--watch') ? args[args.indexOf('--watch') + 1].split('-').map(Number) : null;

const yard = await newYard();
const { S } = yard;
const works = await import('../../src/works.js');
const { rebalance } = await import('../../src/staffing.js');
const { syncWorkers } = await import('../../src/crew.js');

window.__seed(20250830);
window.__crew(3, 3, 5, 7); window.__machineGates();
window.__grant({ sparks: 99999, shards: 99999, spores: 99999, dust: 9e9 });
window.__shack();
S.crew += SPARE; rebalance(); syncWorkers();
yard.fast(2);
// `--open`: every place bought and put up first, so the backlog is spread
// over every station's site rather than the four an opening yard has.
// What the doors wait on is set, not played: the doors are not the subject.
if (args.includes('--open')) {
  window.__answered('props', 'net', 'arch');
  Object.assign(S, { boulderNo: Math.max(S.boulderNo, 3), rains: 1, seenAir: true, seenMess: true, seenSpore: true });
  window.__buy('jaw'); window.__finish();
  for (let pass = 0; pass < 6; pass++) {
    for (const r of window.__rows()) if (r.shown && !r.done && /^unlock/.test(r.key)) window.__buy(r.key);
    window.__finish(); yard.fast(1);
  }
}

// Press every shown row, three passes, so a ladder queues its next copies the
// way a player pressing a card again does.
const queued = () => works.SITES.flatMap(s => works.worksAt(s).map(w => ({ site: s, ...w })));
for (let pass = 0; pass < 3; pass++)
  for (const r of window.__rows()) if (r.shown && !r.done) window.__buy(r.key);
const backlog = queued();
const total = backlog.reduce((n, w) => n + (w.of - w.done), 0);
const bySite = {};
for (const w of backlog) bySite[w.site] = (bySite[w.site] || 0) + (w.of - w.done);
console.log(`backlog: ${backlog.length} works, ${total.toFixed(0)} worker-seconds over ${Object.keys(bySite).length} sites`);
console.log(' ', Object.entries(bySite).map(([s, n]) => `${s}:${n.toFixed(0)}`).join(' '));
// The floor: one body a site (room 1, effort 1), so the yard can be no
// quicker than its deepest site's queue.
const floor = Math.max(...Object.values(bySite));
console.log(`floor (deepest site's queue, one body at it): ${floor.toFixed(0)}s`);

// --- the buckets --------------------------------------------------------------
const ids = new Map();
const tally = {};
const bump = k => { tally[k] = (tally[k] || 0) + 1; };
let frames = 0, builderFrames = 0, prevSite = new Map(), switches = 0;
const wasAt = new Map(), siteIdle = {}, gap = {};
let orphaned = 0, siteFrames = 0;

function bucket(w) {
  if (!w.site) return 'no site';
  const work = works.worksAt(w.site).find(x => x.id === w.workId);
  if (!work) return 'work gone';
  if (w.goal !== 'at') return 'walking';
  const own = works.handsOn(w.site, w.workId);
  if (works.builderManned(w.site)) return own > 0 ? 'hammering' : 'at, not credited';
  // A station's own site, lent a builder because its gang is empty.
  return works.handsAt(w.site) > 0 ? 'hammering (station)' : 'at, not credited';
}

let cleared = null;
for (let f = 0; f < LIMIT * 60; f++) {
  yard.fast(1 / 60);
  frames++;
  const builders = S.workers.filter(w => w.type === 'builder');
  // A body that was hammering last frame and is not a builder now, while its
  // work is still standing: stood down off a work somebody must walk back to.
  for (const [w, k] of prevSite)
    if (!builders.includes(w) && wasAt.get(w)) {
      const [site, id] = k.split('#');
      if (works.worksAt(site).some(x => String(x.id) === id)) { orphaned++; if (LOG >= 0) console.log(`f${f} stood down off ${k} (body ${ids.get(w)})`); }
      prevSite.delete(w);
    }
  // Every builder-manned site with a work on the go, and whether anybody is
  // credited at it this frame: what the clear time is actually made of.
  for (const site of works.busyBuilderSites()) {
    siteFrames++;
    const g = gap[site] ||= { seen: false, run: 0, worst: 0 };
    if (works.handsAt(site) > 0) { g.seen = true; g.run = 0; }
    else {
      siteIdle[site] = (siteIdle[site] || 0) + 1;
      if (g.seen) g.worst = Math.max(g.worst, ++g.run);
    }
  }
  for (const w of builders) {
    if (!ids.has(w)) ids.set(w, ids.size);
    builderFrames++;
    const b = bucket(w);
    bump(b);
    const key = `${w.site}#${w.workId}`;
    if (prevSite.has(w) && prevSite.get(w) !== key) switches++;
    prevSite.set(w, key);
    wasAt.set(w, w.goal === 'at');
    if (ids.get(w) === LOG && b !== 'hammering')
      console.log(`f${f} ${b} site=${w.site} work=${w.workId} goal=${w.goal} x=${w.x.toFixed(0)} to=${w.route?.to ?? '-'}`);
  }
  if (WATCH && f >= WATCH[0] && f <= WATCH[1] && f % 10 === 0)
    console.log(`f${f} ` + builders.map(w => `${ids.get(w)}:${w.site}#${w.workId}/${w.goal}@${w.x | 0}`).join(' ')
                + ' | ' + works.busyBuilderSites().map(s => `${s}=${works.handsAt(s)}`).join(' '));
  if (!queued().length) { cleared = frames / 60; break; }
}

const left = queued().reduce((n, w) => n + (w.of - w.done), 0);
console.log(cleared != null ? `cleared in ${cleared.toFixed(0)}s` : `NOT cleared in ${LIMIT}s, ${left.toFixed(0)} worker-seconds left`);
console.log(`builder-frames ${builderFrames} (mean ${(builderFrames / frames).toFixed(2)} builders), slot switches ${switches}, bodies seen ${ids.size}`);
for (const [k, n] of Object.entries(tally).sort((a, b) => b[1] - a[1]))
  console.log(`  ${k.padEnd(22)} ${(100 * n / builderFrames).toFixed(1)}%`);
const idle = Object.values(siteIdle).reduce((a, b) => a + b, 0);
console.log(`busy site-frames with nobody credited: ${(100 * idle / Math.max(1, siteFrames)).toFixed(1)}%`,
            Object.entries(siteIdle).map(([k, n]) => `${k}:${(n / 60).toFixed(0)}s`).join(' '));
console.log('longest gap after a site was first manned:',
            Object.entries(gap).map(([k, g]) => `${k}:${(g.worst / 60).toFixed(1)}s`).join(' '));
console.log(`bodies stood down off a standing work: ${orphaned}`);
console.log('sites still busy:', works.busyBuilderSites().join(' '), '| builders', S.builders, 'haulers', S.haulers);
