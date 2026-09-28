// The serpent's fight as arithmetic: how long each stage holds against a
// party climbing its ladders on the scales the gatherers bank (DESIGN.md,
// "The deep is paced by its purse"). No yard, no bodies -- a second at a
// time, the wound against the heal, the purse against the next rung.
//
//   node tools/node/deep-pace.mjs                    # the breaks, config as written
//   node tools/node/deep-pace.mjs --gather 4         # at a banked rate, scales a second
//   node tools/node/deep-pace.mjs --solve 8,22,40,60 # the depths that break at these minutes
//   node tools/node/deep-pace.mjs --party sword,assassin,sapper,hexer
//   node tools/node/deep-pace.mjs --table            # a class's damage and shed, rung by rung
//
// What it leaves out: the dust, ore and spark on a rung's bill, the rung's
// build time, the fang's sink and carry, stuns, statuses and the Bard. So a
// break here is the earliest the purse and the damage allow.

import { LADDERS } from '../../src/config/rungs.js';
import { CLASSES } from '../../src/config/classes.js';
import { SERPENT_HEAL, SERPENT_WOUND, SERPENT_DEFENSE, SCALE_PER_DMG, SCALE_HIT_MAX,
         CLICK_DMG } from '../../src/config/deep.js';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const party = (arg('--party') || 'brawler,ranger,mage,monk').split(',');
const gather = arg('--gather') ? +arg('--gather') : Infinity;
const clicks = +(arg('--clicks') || 2);          // punches a second from the hand

// What a class's move adds to its plain hit on average, from rung 4 and from
// rung 8: a guess read off each class's row in config/classes.js (a haymaker
// x3 every 4th, three cut spots at 0.6, a sticky x3 ...), not a measurement.
const MOVE = { brawler: [1.5, 1.5], sword: [1.8, 2.4], monk: [1.5, 1.5], martial: [1.1, 1.1],
               ranger: [1.2, 1.2], assassin: [1, 1], hexer: [1, 1], sapper: [2.2, 2.6], mage: [1.25, 1.5] };
const tempo = c => (c === 'mage' ? 1 : CLASSES[c].every);   // the beam's ladder is already a second's
const moveK = (c, r) => (r >= 8 ? MOVE[c][1] : r >= 4 ? MOVE[c][0] : 1);
const hit = (c, r, st) => LADDERS[c].value[r] * SERPENT_DEFENSE[c][st] * moveK(c, r);
const dps = (c, r, st) => hit(c, r, st) / tempo(c);
// Scales shed a second: a hit sheds its damage, but no more than the cap.
const shed = (c, r, st) => dps(c, r, st) * Math.min(1, SCALE_HIT_MAX / (hit(c, r, st) * SCALE_PER_DMG)) * SCALE_PER_DMG;
const cost = (c, r) => LADDERS[c].dust[r];

// A second at a time. `depth` is the four depths; `ends`, if given, fixes the
// minute each stage breaks and the depth is read off instead.
function fight(depth, ends) {
  let st = 0, wound = 0, purse = 0, loose = 0, stood = 1;
  const rung = party.map(() => 0), made = [0, 0, 0, 0], at = [];
  for (let t = 0; st < 4 && t < 86400 * 3; t++) {
    let d = clicks * CLICK_DMG[rung[0]], y = d * SCALE_PER_DMG;
    for (let i = 0; i < stood; i++) { d += dps(party[i], rung[i], st); y += shed(party[i], rung[i], st); }
    loose += y;
    const g = Math.min(loose, gather); loose -= g; purse += g;
    made[st] += Math.max(0, d - SERPENT_HEAL[st]);
    wound = Math.max(0, wound + d - SERPENT_HEAL[st]);
    for (;;) {                                   // the cheapest rung standing, while the purse holds it
      let b = -1, bc = Infinity;
      for (let i = 0; i < stood; i++) if (rung[i] < 8 && cost(party[i], rung[i]) < bc) { bc = cost(party[i], rung[i]); b = i; }
      if (b < 0 || purse < bc) break;
      purse -= bc; rung[b]++;
    }
    const broke = ends ? t + 1 >= ends[st] * 60 : wound >= depth[st];
    if (broke) { at.push({ min: (t + 1) / 60, rungs: rung.slice(0, stood).join('') }); st++; wound = 0; stood = Math.min(party.length, stood + 1); }
  }
  return { at, made, loose };
}

const min = m => m.toFixed(1).padStart(5);
if (process.argv.includes('--table')) {
  console.log('damage a second, the class whole, by rung');
  for (const c of Object.keys(MOVE)) console.log(c.padEnd(9), LADDERS[c].value.map((_, r) => dps(c, r, 0).toFixed(1).padStart(7)).join(''));
  console.log('\nscales shed a second, by rung');
  for (const c of Object.keys(MOVE)) console.log(c.padEnd(9), LADDERS[c].value.map((_, r) => shed(c, r, 0).toFixed(1).padStart(7)).join(''));
} else if (arg('--solve')) {
  const ends = arg('--solve').split(',').map(Number);
  const r = fight(null, ends);
  console.log(`party ${party.join('+')}, banked ${gather}/s, breaks at ${ends.join(' / ')} min`);
  console.log('depths', r.made.map(x => Math.round(x / 1000) + 'k').join(' / '));
  console.log('rungs at each break', r.at.map(a => a.rungs).join('  '));
} else {
  const r = fight(SERPENT_WOUND);
  console.log(`party ${party.join('+')}, banked ${gather}/s`);
  for (const [i, a] of r.at.entries()) console.log(`stage ${i + 1} breaks at ${min(a.min)} min, rungs ${a.rungs}`);
  console.log(`left loose on the floor: ${Math.round(r.loose)}`);
}
