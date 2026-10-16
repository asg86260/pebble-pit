// A d-pad press goes to the nearest thing that way, and every stop the pad
// can stand on is reachable from every other by presses alone, and so are the
// corner cards over the yard (DESIGN.md, "Controller support", "The focus").
// The owner, 2026-10-15: "i cant get from the serpent to the portal to the
// top corner buttons", and "things should just jump to the nearest thing
// that direction. it should feel natural."
//
// A search over presses, the way a thumb finds its way: each place is
// reached by replaying the presses that found it from the starting stop, so
// the camera, the coil's segment and the corner are whatever the presses
// made them. Only the start is put down by hand.

import { group, ok, run } from './helpers.mjs';
import { S } from '../src/state.js';
import { setPref } from '../src/prefs.js';
import { stops } from '../src/stops.js';
import { coilAt } from '../src/deep/place.js';
import { now } from '../src/clock.js';
import { COIL_SEGS, PAD_ACROSS } from '../src/config.js';

const pad = () => window.__pad;
const DIRS = ['up', 'down', 'left', 'right'];
const V = { left: [-1, 0], right: [1, 0], up: [0, -1], down: [0, 1] };

// Where the focus is: a stop, a segment of the coil, a station's own
// control, or the corner.
function where() {
  if (pad().scope() === 'corner') return 'corner';
  const f = pad().focus();
  return f && f.startsWith('coil|') ? `coil#${pad().seg()}` : f;
}

function standAt(id) {
  pad().off();
  pad().on();
  pad().press('b');                 // wakes the pad
  S.padFocus = id;
  const b = pad().box();
  if (b) window.__look(b.x + b.w / 2 - S.viewW / 2);
}
function replay(start, path) {
  standAt(start);
  for (const d of path) pad().press(d);
  return where();
}

// The middles a press chooses among, worked out here from the boxes, not
// asked of pad.js: the stops of the half on screen, and the coil's segments
// while the serpent is there to be struck.
function middles() {
  const half = S.view === 'deep' ? 'deep' : 'yard';
  const out = stops(half).map(s => ({ id: s.id, x: s.r.x + s.r.w / 2, y: s.r.y + s.r.h / 2, hw: s.r.w / 2, hh: s.r.h / 2 }));
  if (half === 'deep' && S.snatched && !S.serpentFreed)
    for (let i = 0; i < COIL_SEGS; i++) { const p = coilAt(i, now()); out.push({ id: `coil#${i}`, x: p.x, y: p.y, hw: 0, hh: 0 }); }
  return out;
}
// The nearest that way: its middle past this one's edge that way, the least
// distance past plus PAD_ACROSS times its distance off the middle line.
function nearest(fromId, dir, list) {
  const from = list.find(m => m.id === fromId);
  const [ux, uy] = V[dir];
  let best = null, score = Infinity;
  // The coil is one thing: up and down leave it, left and right travel it.
  const leaving = fromId.startsWith('coil#') && !ux;
  for (const m of list) {
    if (m === from || (leaving && m.id.startsWith('coil#'))) continue;
    const dx = m.x - from.x, dy = m.y - from.y, ahead = dx * ux + dy * uy - (ux ? from.hw : from.hh);
    if (ahead <= 1) continue;
    const s = ahead + PAD_ACROSS * Math.abs(dx * uy + dy * ux);
    if (s < score) { score = s; best = m; }
  }
  return best && best.id;
}

// Every place reachable from `start`, and each press that was not the
// nearest thing that way. A press from a station down into its own controls
// is stepping into it, not a hop, and is not judged.
function reach(start) {
  const seen = new Map([[start, []]]);
  const queue = [[[], start]];
  const wrong = [];
  while (queue.length) {
    const [path, here] = queue.shift();
    for (const d of DIRS) {
      const p = [...path, d];
      replay(start, path);
      const list = middles();
      const at = replay(start, p);
      const inside = at && at.includes('|');
      if (list.some(m => m.id === here) && !inside) {
        const want = nearest(here, d, list) ?? (d === 'up' ? 'corner' : here);
        if (at !== want) wrong.push(`${here} ${d} -> ${at}, nearest ${want}`);
      }
      if (seen.has(at)) continue;
      seen.set(at, p);
      queue.push([p, at]);
    }
  }
  return { seen, wrong };
}

function judge(ids, extra) {
  const stuck = [], wrong = [];
  for (const id of ids) {
    const r = reach(id);
    const miss = [...extra, ...ids].filter(t => t !== id && !r.seen.has(t));
    if (miss.length) stuck.push(`${id} cannot reach ${miss.join(', ')}`);
    wrong.push(...r.wrong);
  }
  return { stuck, wrong: [...new Set(wrong)] };
}

function deepYard() {
  window.__fullSites();
  window.__snatch({ played: true });
  window.__crew(0, 4);
  window.__deepCrew({ spare: 1 });
  window.__party({ stations: ['s1', 's2', 's3'] });
  window.__serpent({ level: 1, stage: 0 });
  S.beatsDone.push('abyss');
  window.__view('deep');
  run(5);
  setPref('motion', true);
}

group('in the deep, every press is the nearest thing that way, and the serpent reaches the portal and the corner', async () => {
  deepYard();
  standAt(null);
  const ids = pad().stops();
  // The serpent, reached the way a player reaches it: up from a station.
  standAt('st:s2');
  pad().press('up');
  const coil = where();
  const { stuck, wrong } = judge(ids, ['way:portal:deep', 'corner']);
  const fromCoil = reach('st:s2').seen.has(coil) && judge(['st:s2'], []);
  // The portal's hands gone after the first round trip: its ring still a stop.
  window.__fast(0);
  S.portalHand = 0;
  const after = pad().stops();
  const gone = judge(after, ['way:portal:deep', 'corner']);
  pad().off();
  setPref('motion', null);
  return [
    ok(ids.includes('way:portal:deep'), "the deep's portal is a stop", ids.join(' ')),
    ok(coil.startsWith('coil#'), 'up from a station lands on the serpent', coil),
    ok(!!fromCoil, 'which is reached from the stations'),
    ok(stuck.length === 0, 'every stop reaches the portal, the corner and every other stop', stuck.join(' | ')),
    ok(wrong.length === 0, 'and every press went to the nearest thing that way', wrong.slice(0, 8).join(' | ')),
    ok(!after.includes('way:arrow:deep') && after.includes('way:portal:deep'), 'with the hands gone the portal is still a stop', after.join(' ')),
    ok(gone.stuck.length === 0 && gone.wrong.length === 0, 'and still reached from every stop, by the nearest each press',
       [...gone.stuck, ...gone.wrong].slice(0, 8).join(' | ')),
  ];
}, { reload: false });

group('in the yard, every press is the nearest thing that way, and the corner and every stop are reached', async () => {
  window.__crew(3, 3, 5, 7);
  window.__fullSites();
  run(1);
  setPref('motion', true);
  standAt(null);
  const ids = pad().stops();
  const { stuck, wrong } = judge(ids, ['corner']);
  pad().off();
  setPref('motion', null);
  return [
    ok(stuck.length === 0, 'every stop reaches the corner and every other stop', stuck.join(' | ')),
    ok(wrong.length === 0, 'and every press went to the nearest thing that way', wrong.slice(0, 8).join(' | ')),
  ];
}, { reload: false });
