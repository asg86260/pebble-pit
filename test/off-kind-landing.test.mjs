// A good of another kind let go on a pile's strip (DESIGN.md, "One resource
// system for every act", section 1, "A pile is a strip of the ground"): it
// lies on the pile's mound by the heap rule as the unit it is, counted for
// no pile, and a body carries it home from the top -- never set down beside
// the strip as the step-2 landing did, and never taken out from under what
// rests on it.
//
// Reached the way a player reaches it: the yard's hand (hands.js) sweeps a
// log off the forestry pile and lets it go held still over the timber mound.
// The setup it is not about: the act on and its opening played, four members
// walked out, the saw mill standing, timber and logs granted.
import { group, ok, run, runUntil, yard, restartReloadClock } from './helpers.mjs';
import { goodCount } from '../src/after/piles.js';
import { P, AFTER_BLOCK, RIM_PIECES } from '../src/config.js';
import { track, sweep, release } from '../src/hands.js';
import { units, counted, stripOf, stripBox, lying, takeAt } from '../src/after/ground.js';
import { source } from '../src/flow.js';
import { putBlock, cellOf } from '../src/grid.js';
import { afterGround } from '../src/state.js';
import { AP } from '../src/after/place.js';

const S = yard.S;
const OPENING = ['house-fall', 'arrive', 'meet-god', 'refuse'];

function up() {
  window.__actsOn(true);
  window.__goPlace('after');
  for (const k of OPENING) if (!S.beatsDone.includes(k)) S.beatsDone.push(k);
  window.__grant({ dust: 1e6, spores: 2e5, shards: 2e5, scales: 2e4, sparks: 2e4 });
  S.after.speech = { next: 1e9, f0: 0, held: null };
  window.__afterCrowd((i, v) => (i < 4 ? RIM_PIECES : v));
  runUntil(() => window.__afterRead().walking === 0, 240);
  if (!S.after.built.includes('mill')) S.after.built.push('mill');
  S.carryLevel = 3;
  window.__afterGrant({ timber: 6, grovelogs: 3 });
  run(1);
  window.__emptyHand(); S.trail = [];
}
const done = () => { window.__emptyHand(); S.carryLevel = 0; window.__actsOn(null); };
const letGo = p => { S.trail = []; track(p.x, p.y); release(p.x, p.y); };
const press = p => { S.dragging = true; S.trail = []; track(p.x, p.y); S.mouse = { ...p }; sweep(p.x, p.y); S.dragging = false; };
const aloft = () => runUntil(() => !S.chips.some(c => c.place === 'after'), 10);
const inStrip = (u, what) => { const s = stripOf(what); return u.c0 >= s.c0 && u.c0 < s.c1; };

group('a log let go over the timber mound lies on the mound as a log, and a member carries it home from the top', async () => {
  up();
  restartReloadClock();
  const timber0 = goodCount('timber'), logs0 = goodCount('grovelogs');
  const from = stripBox('grovelogs');
  press({ x: from.x + from.w / 2, y: from.bottom - from.size * AP / 2 });
  const took = S.held, kind = S.motes[0] && S.motes[0].kind;
  const mound = stripBox('timber');
  letGo({ x: mound.x + mound.w / 2, y: mound.top - AP * 6 });
  const landed = aloft();
  run(2);                                   // to rest on the mound
  const log = units().find(u => u.kind === 'log' && inStrip(u, 'timber'));
  const beside = units().filter(u => u.kind === 'log' && !inStrip(u, 'timber') && !inStrip(u, 'grovelogs')).length;
  const rested = !!log && !counted(log) && log.r0 > 0;
  const counts = { timber: goodCount('timber'), logs: goodCount('grovelogs') };
  // a plank resting on it covers it: nobody takes a unit out from under another
  let covered = false, refused = false;
  if (log) {
    source('plank', 1, 'test setup');
    covered = putBlock(afterGround, log.c0, log.r0 + log.z, cellOf('plank'));
    const row = lying().find(q => q.id === log.ai);
    refused = !!row && row.free === false && takeAt(log.ai) === 0;
  }
  // (a plank on a lone log rolls off it by the heap rule, so the cover does not stay; the refusal above is the point)
  const home = runUntil(() => goodCount('grovelogs') === logs0 && !units().some(u => u.kind === 'log' && inStrip(u, 'timber')), 400);
  const back = goodCount('grovelogs');
  done();
  return [
    ok(took === 1 && kind === 'log', 'a log swept off the forestry pile is held', `${took} ${kind}`),
    ok(landed && rested && beside === 0, 'let go over the timber mound it lies on the mound, not beside the strip', `${!!log} on the mound, ${beside} beside`),
    ok(counts.timber === timber0 && counts.logs === logs0 - 1, 'counted for no pile: the mound is no fuller, the log pile one short', JSON.stringify(counts)),
    ok(covered && refused, 'with a plank on it a unit cannot be taken out from under', `${covered} ${refused}`),
    ok(home && back === logs0, 'and uncovered, it is carried home to the log pile', `${back} of ${logs0}`)
  ];
});
