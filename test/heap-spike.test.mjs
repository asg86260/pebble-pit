// A pile filled the way a player fills it never ends as a spike (DESIGN.md,
// "One resource system for every act", the heap rule): no column of blocks
// stands two or more blocks over both of its neighbors while there is room
// beside it. Found on the forestry shack's log pile, a single column three
// logs tall with one log either side: a block rolling into a slot beside a
// pile's lower flank was refused because the column it left was over that
// slot's ceiling, not because of where it would rest.
//
// Reached the way a player reaches it: logs swept off one pile with the yard's
// hand and let go over another a few at a time, and the pile granted (the
// setup it is not about).
import { group, ok, run, runUntil, yard, restartReloadClock } from './helpers.mjs';
import { goodCount } from '../src/after/piles.js';
import { AFTER_PILES, RIM_PIECES } from '../src/config.js';
import { track, sweep, release } from '../src/hands.js';
import { units, counted, stripOf, stripBox } from '../src/after/ground.js';
import { AP } from '../src/after/place.js';

const S = yard.S;
const OPENING = ['house-fall', 'arrive', 'meet-god', 'refuse'];
const press = p => { S.dragging = true; S.trail = []; track(p.x, p.y); S.mouse = { ...p }; sweep(p.x, p.y); S.dragging = false; };
const letGo = p => { S.trail = []; track(p.x, p.y); release(p.x, p.y); };

// Each slot's stack of the pile's own units, left to right, and the most a slot may hold.
function stacks(what) {
  const s = stripOf(what), n = (s.c1 - s.c0) / s.z, out = Array(n).fill(0);
  for (const u of units()) if (u.c0 >= s.c0 && u.c0 < s.c1 && counted(u)) out[Math.floor((u.c0 - s.c0) / s.z)]++;
  return out;
}
const spikes = k => k.map((h, i) => [h, k[i - 1] ?? Infinity, k[i + 1] ?? Infinity]).filter(([h, l, r], i) => h - Math.min(l, k[i - 1] === undefined ? h : l) >= 2 && h - Math.min(r, k[i + 1] === undefined ? h : r) >= 2 && (k[i - 1] !== undefined || k[i + 1] !== undefined)).length;

group('a pile filled by the hand and by grants never ends as a spike', async () => {
  window.__actsOn(true);
  window.__goPlace('after');
  for (const k of OPENING) if (!S.beatsDone.includes(k)) S.beatsDone.push(k);
  window.__grant({ dust: 1e6, spores: 2e5, shards: 2e5, scales: 2e4, sparks: 2e4 });
  S.after.speech = { next: 1e9, f0: 0, held: null };
  window.__afterCrowd((i, v) => (i < 2 ? RIM_PIECES : v));
  runUntil(() => window.__afterRead().walking === 0, 240);
  if (!S.after.built.includes('mill')) S.after.built.push('mill');
  S.carryLevel = 3;
  restartReloadClock();
  const out = {};
  // every count a pile can stand at, granted a block at a time as the camp's
  // bodies set them down, left to settle between
  for (const what of ['grovelogs', 'logs', 'timber', 'benchtimber']) {
    for (let n = 1; n <= AFTER_PILES[what].brim; n++) {
      window.__afterGrant({ [what]: 1 });
      run(2);
      out[`${what} at ${n}`] = stacks(what);
    }
    window.__afterGrant({ [what]: -AFTER_PILES[what].brim });
  }
  // the hand: logs lifted off the log pile and let go over the forestry pile, a few at a time
  window.__afterGrant({ grovelogs: -AFTER_PILES.grovelogs.brim });
  const from = stripBox('logs'), to = stripBox('grovelogs');
  for (let k = 0; k < 12; k++) {
    const t = units().filter(u => u.kind === 'log' && counted(u) && u.c0 >= stripOf('logs').c0 && u.c0 < stripOf('logs').c1).sort((a, b) => b.r0 - a.r0)[0];
    if (!t) break;
    press({ x: afterX(t.c0, t.z), y: from.bottom - AP * (t.r0 + t.z / 2) });
    letGo({ x: to.x + ((k * 7) % 5 + 0.5) * (to.w / 5), y: to.top - AP * 6 });
    runUntil(() => !S.chips.some(c => c.place === 'after'), 10);
    run(1);
  }
  run(4);
  out.hand = stacks('grovelogs');
  window.__emptyHand(); S.carryLevel = 0; window.__actsOn(null);
  return Object.entries(out).map(([what, k]) => ok(spikes(k) === 0, `${what} stands as a mound, no column two over both neighbors`, `${what} ${k}`));
});
const afterX = (c0, z) => stripBox('logs').x + (c0 - stripOf('logs').c0 + z / 2) * AP;
