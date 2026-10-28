// One conservation rule (DESIGN.md, "One resource system for every act",
// sections 5 and 8; verify.js rule 23): a unit of act 3 appears or vanishes
// only at a named source or sink -- a tree felled, a cut at the saw, a sign
// joined, a tip through the hatch, a sign planted, an order laid, a band
// laid, a load made at the shack's door -- and every group in the node tier
// asks it on every frame. These checks are about the rule itself: it is quiet
// through the played chain, with every door named, and red for a unit written
// or erased round the doors.
//
// Reached the way a player reaches it: both stations ordered off the shack
// (`__buy`), the posts put on through the roster's + (`__afterPress`), a tree
// sawn through the grove's own door. The deliberate strays are the point.
import { group, ok, run, runUntil, yard } from './helpers.mjs';
import { RIM_PIECES } from '../src/config.js';
import { putBlock, takeUnit, addGrain, cellOf } from '../src/grid.js';
import { afterGround } from '../src/state.js';
import { stripOf, slotTop } from '../src/after/ground.js';
import { heapPlot } from '../src/after/mill.js';
import { chopTree } from '../src/after/grove.js';
import { push } from '../src/cells.js';
import { flowBy } from '../src/flow.js';

const S = yard.S;
const OPENING = ['house-fall', 'arrive', 'meet-god', 'refuse'];

function camp(n) {
  window.__actsOn(true);
  window.__goPlace('after');
  for (const k of OPENING) if (!S.beatsDone.includes(k)) S.beatsDone.push(k);
  window.__grant({ dust: 1e7, spores: 2e6, shards: 2e6, scales: 2e5, sparks: 2e5 });
  S.after.speech = { next: 1e9, f0: 0, held: null };
  window.__afterCrowd((i, v) => (i < n ? RIM_PIECES : v));
  runUntil(() => window.__afterRead().walking === 0, 240);
  window.__afterGrant({ rebel: 9000 });
}
const raise = st => { window.__buy(`after-build-${st}`); return runUntil(() => window.__afterRead().built.includes(st), 600); };
// What running a frame says: the rule's complaint, or nothing.
const says = () => { try { run(1 / 30); return ''; } catch (e) { return e.message; } };
const red = msg => /appeared or vanished/.test(msg);

group('the played chain is quiet, and every door that made or unmade a unit is named', async () => {
  camp(8);
  const raised = raise('mill') && raise('workshop');
  window.__afterAxe();
  window.__afterGrant({ grovelogs: 4 });
  for (let k = 0; k < 12; k++) chopTree(0, true);
  window.__afterPress('sawyer'); window.__afterPress('joiner'); window.__afterPress('carrier');
  let quiet = true;
  try { for (let k = 0; k < 1200; k++) run(1); } catch (e) { quiet = false; console.log(e.message); }
  const by = flowBy();
  const doors = ['log:tree', 'log:saw', 'plank:saw', 'sawdust:saw', 'plank:sign', 'sign:workshop', 'load:shack', 'load:band'];
  const missing = doors.filter(d => !(d in by));
  window.__actsOn(null);
  return [
    ok(raised, 'the saw mill and the workshop raised off the shack'),
    ok(quiet, 'twenty minutes of the chain, a tree felled, logs cut, signs joined: not one frame breaks the rule'),
    ok(!missing.length, 'and every door on the way spoke up', `missing ${missing.join(' ')} of ${JSON.stringify(by)}`)
  ];
});

group('a unit written or erased round the doors turns the rule red', async () => {
  camp(2);
  window.__afterGrant({ timber: 4, logs: 2 });
  run(1);
  const s = stripOf('timber'), c = s.c0 + Math.floor((s.c1 - s.c0) / s.z / 2) * s.z;
  const out = [];
  // a block written onto the ground
  putBlock(afterGround, c, slotTop(c, s.z), cellOf('plank'));
  out.push(['a block written onto the ground', says()]);
  // a block erased from it
  const lo = afterGround.blockSet && [...afterGround.blockSet][0];
  takeUnit(afterGround, lo % afterGround.cols, Math.floor(lo / afterGround.cols));
  out.push(['a block erased from the ground', says()]);
  // a grain on the sawdust heap
  addGrain(heapPlot(), heapPlot().x + 4, undefined, 3, true);
  out.push(['a grain written on the heap', says()]);
  // a unit conjured into a member's arms
  const w = S.after.bodies.find(b => b.state === 'work');
  push(w, cellOf('sign'));
  out.push(['a sign conjured into a member\'s arms', says()]);
  // a unit in the hand
  S.motes.push({ s: cellOf('log'), kind: 'log', place: 'after', a: 0, d: 1, spin: 0, bob: 0, sway: 1 }); S.held = 1;
  out.push(['a log conjured onto the cursor', says()]);
  window.__emptyHand();
  window.__actsOn(null);
  return out.map(([what, msg]) => ok(red(msg), `${what} is red`, msg.slice(0, 120)));
});
