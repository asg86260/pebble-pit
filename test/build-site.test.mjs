// A build site is a strip of the ground (DESIGN.md, "One resource system for
// every act", section 4): its loads are `load` units made at one named
// source, the construction shack's door, carried in by members and set down
// on the site's strip, and taken off its top by the builders to be laid in a
// band. How many there are is read off the cells and the arms; the site keeps
// no counters of them, and the drawing is the ground's.
//
// Reached the way a player reaches it: the saw mill bought on the shack's
// board (`__buy`). The setup it is not about: the act on and its opening
// played, members walked out, coins granted.
import { group, ok, run, runUntil, yard } from './helpers.mjs';
import { P, RIM_PIECES, AFTER_BUILD_PIECES, AFTER_BUILD_A_BAND } from '../src/config.js';
import { units, colX } from '../src/after/ground.js';
import { siteLoads } from '../src/after/build.js';
import { stationDoor, buildPileAt, BUILD_PILE_W, AP } from '../src/after/place.js';
import { loadKind } from '../src/carry.js';
import { flowBy } from '../src/flow.js';

const S = yard.S;
const OPENING = ['house-fall', 'arrive', 'meet-god', 'refuse'];
const BILL = AFTER_BUILD_PIECES * AFTER_BUILD_A_BAND;

group('a station\'s loads are made at the shack\'s door, carried to its strip as units, and laid in bands off the top', async () => {
  window.__actsOn(true);
  window.__goPlace('after');
  for (const k of OPENING) if (!S.beatsDone.includes(k)) S.beatsDone.push(k);
  window.__grant({ dust: 1e7, spores: 2e6, shards: 2e6, scales: 2e5, sparks: 2e5 });
  S.after.speech = { next: 1e9, f0: 0, held: null };
  window.__afterCrowd((i, v) => (i < 6 ? RIM_PIECES : v));
  runUntil(() => window.__afterRead().walking === 0, 240);
  window.__afterGrant({ rebel: 9000 });
  const door = stationDoor('shack'), x0 = buildPileAt('mill');
  const bought = window.__buy('after-build-mill');
  let atDoor = true, peak = 0, onStrip = true, made = 0, fresh = 0, lastArms = 0;
  for (let k = 0; k < 6000 && !window.__afterRead().built.includes('mill'); k++) {
    run(0.1);
    // every load made this tick is in the arms of a body standing at the door
    const arms = S.after.bodies.filter(b => loadKind(b) === 'load');
    const was = made;
    made = flowBy()['load:shack'] || 0;
    if (made > was && !arms.some(b => Math.abs(b.x - door) < P * 6)) atDoor = false;
    fresh += made - was;
    peak = Math.max(peak, siteLoads('mill'));
    // and every load lying about is on the site's strip
    for (const u of units()) if (u.kind === 'load' && (colX(u.c0) < x0 - AP * 2 || colX(u.c0) > x0 + (BUILD_PILE_W + 2) * AP)) onStrip = false;
    lastArms = arms.length;
  }
  const by = flowBy();
  const r = S.after.raising.mill;
  run(2);
  const left = units().filter(u => u.kind === 'load').length;
  window.__actsOn(null);
  return [
    ok(bought, 'the saw mill is bought on the shack\'s board'),
    ok(fresh === BILL && atDoor, 'its eight loads are made at the shack\'s door, one at a time, in a member\'s arms', `${fresh} made, at the door ${atDoor}`),
    ok(peak === BILL && onStrip, 'and set down on the site\'s strip as units of the ground, all eight lying there at once', `${peak} of ${BILL}, on the strip ${onStrip}`),
    ok(by['load:band'] === -BILL && left === 0 && r.n === AFTER_BUILD_PIECES, 'the builders take them off the top and lay them in bands: none left, the station up', `${by['load:band']} laid, ${left} left, ${r.n} bands`),
    ok(!['claimed', 'brought', 'taken', 'drop', 'pick'].some(k => k in r), 'the site keeps no counters of loads', Object.keys(r).join(' '))
  ];
});
