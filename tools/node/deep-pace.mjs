// The serpent's fight as arithmetic: how long each stage holds against a
// party climbing its ladders on the scales the gatherers bank (DESIGN.md,
// "The deep is paced by its purse", and "The serpent heals whole: a phase is a
// window"). No yard, no bodies -- a second at a time, the wound against the
// window, the purse against the next rung. A window runs its length and then a
// meal, a little after (`MEAL_WAIT_S`, the stream's wait for a creature), puts
// the wound back to nothing.
//
//   node tools/node/deep-pace.mjs                    # the breaks, config as written
//   node tools/node/deep-pace.mjs --gather 4         # at a banked rate, scales a second
//   node tools/node/deep-pace.mjs --solve 8,22,40,60 # the depths that break at these minutes
//   node tools/node/deep-pace.mjs --party sword,assassin,sapper,hexer
//   node tools/node/deep-pace.mjs --depths 9000,23000,36000,80000 --windows 40,32,26,20
//   node tools/node/deep-pace.mjs --table            # a class's damage and shed, rung by rung
//   node tools/node/deep-pace.mjs --answered         # every phase's mechanic answered
//
// Each phase's mechanic (deep/phases.js) is played unanswered -- the lash takes the melee fighters off the hide for its
// length, the fall, the daze and the swim back (`LASH_OUT_S`), the sink takes
// every blow for as long as he is past half gone -- unless `--answered`.
// What it leaves out: the dust, ore and spark on a rung's bill, the rung's
// build time, the fang's sink and carry, stuns, statuses and the Bard. So a
// break here is the earliest the purse and the damage allow.

import { LADDERS } from '../../src/config/rungs.js';
import { CLASSES } from '../../src/config/classes.js';
import { SERPENT_WINDOW, SERPENT_WOUND, DAMAGE_KIND, RESISTS, RESIST_K, SCALE_PER_DECADE, SCALE_BASE,
         CLICK_DMG, MECHANICS } from '../../src/config/deep.js';

const arg = k => { const i = process.argv.indexOf(k); return i > 0 ? process.argv[i + 1] : null; };
const party = (arg('--party') || 'brawler,ranger,mage,monk').split(',');
const gather = arg('--gather') ? +arg('--gather') : Infinity;
const clicks = +(arg('--clicks') || 2);          // punches a second from the hand
const answered = process.argv.includes('--answered');
// Seconds a lashed fighter is off the hide past the lash itself: the sink to
// the floor and the swim back up, a guess, besides the daze.
const LASH_FALL_SWIM_S = 4;
// Seconds past a window's end before the creature reaches the mouth, on
// average: the near stream brings one every several seconds.
const MEAL_WAIT_S = 5;
// A depth is this share of what the party does in one window when it should
// break (DESIGN.md, "The numbers").
const WINDOW_SHARE = 0.7;

// What the phase's mechanic does in second `s` of the phase: the window's
// rate, the melee fighters' share still fighting, everyone's share.
function mechanic(st, s) {
  const m = MECHANICS[st];
  if (!m || answered) return { heal: 1, melee: 1, all: 1 };
  const t = s % m.every, on = m.every - m.last;
  if (m.kind === 'lash') {
    const out = m.last + m.daze + LASH_FALL_SWIM_S;
    return { heal: 1, melee: t >= on || t < out - m.last ? 0 : 1, all: 1 };
  }
  const under = t >= on + m.fade / 2 && t < m.every - m.fade / 2;
  return { heal: 1, melee: 1, all: under ? 0 : 1 };
}

// What a class's move adds to its plain hit on average, from rung 4 and from
// rung 8: a guess read off each class's row in config/classes.js (a haymaker
// x3 every 4th, three cut spots at 0.6, a sticky x3 ...), not a measurement.
const MOVE = { brawler: [1.5, 1.5], sword: [1.8, 2.4], monk: [1.5, 1.5], martial: [1.1, 1.1],
               ranger: [1.2, 1.2], assassin: [1, 1], hexer: [1, 1], sapper: [2.2, 2.6], mage: [1.25, 1.5] };
const tempo = c => (c === 'mage' ? 1 : CLASSES[c].every);   // the beam's ladder is already a second's
const moveK = (c, r) => (r >= 8 ? MOVE[c][1] : r >= 4 ? MOVE[c][0] : 1);
// A phase's resist on a class, over the phase: the fading's two turns
// averaged, since it spends as long in each.
const guard = (c, st) => {
  const r = RESISTS[st];
  return r.length ? r.reduce((g, k) => g + (DAMAGE_KIND[c] === k ? RESIST_K : 1), 0) / r.length : 1;
};
const hit = (c, r, st) => LADDERS[c].value[r] * guard(c, st) * moveK(c, r);
const dps = (c, r, st) => hit(c, r, st) / tempo(c);
// Scales shed a second: a hit sheds a few more for each tenfold of its
// damage (`scalesOf` in src/deep/serpent.js).
const scalesOf = d => Math.max(1, Math.round(SCALE_BASE + SCALE_PER_DECADE * Math.log10(d)));
const shed = (c, r, st) => scalesOf(hit(c, r, st)) / tempo(c);
const cost = (c, r) => LADDERS[c].dust[r];

// A second at a time. `depth` is the four depths; `ends`, if given, fixes the
// minute each stage breaks and the depth is read off instead: the damage of
// the last window before it, a share of it.
function fight(depth, ends, windows = SERPENT_WINDOW) {
  let st = 0, wound = 0, purse = 0, loose = 0, stood = 1, from = 0, win = 0;
  const rung = party.map(() => 0), made = [0, 0, 0, 0], at = [], last = [];
  for (let t = 0; st < 4 && t < 86400 * 3; t++) {
    const mk = mechanic(st, t - from);
    let d = clicks * CLICK_DMG[rung[0]] * mk.all, y = clicks * scalesOf(CLICK_DMG[rung[0]]) * mk.all;
    for (let i = 0; i < stood; i++) {
      const k = mk.all * (CLASSES[party[i]].melee ? mk.melee : 1);
      d += dps(party[i], rung[i], st) * k; y += shed(party[i], rung[i], st) * k;
    }
    loose += y;
    const g = Math.min(loose, gather); loose -= g; purse += g;
    wound += d;
    last.push(d); if (last.length > windows[st]) last.shift();
    win += mk.heal;
    if (win >= windows[st] + MEAL_WAIT_S) { wound = 0; win = 0; }
    for (;;) {                                   // the cheapest rung standing, while the purse holds it
      let b = -1, bc = Infinity;
      for (let i = 0; i < stood; i++) if (rung[i] < 8 && cost(party[i], rung[i]) < bc) { bc = cost(party[i], rung[i]); b = i; }
      if (b < 0 || purse < bc) break;
      purse -= bc; rung[b]++;
    }
    const broke = ends ? t + 1 >= ends[st] * 60 : wound >= depth[st];
    if (broke) { made[st] = WINDOW_SHARE * last.reduce((a, b) => a + b, 0); win = 0; last.length = 0; at.push({ min: (t + 1) / 60, rung: rung.slice(0, stood), rungs: rung.slice(0, stood).join('') }); st++; wound = 0; from = t + 1; stood = Math.min(party.length, stood + 1); }
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
  // The rungs bought by each break hang on the purse alone, so the breaks are
  // fixed and each depth is read off the window before it.
  const ends = arg('--solve').split(',').map(Number);
  const r = fight(null, ends);
  console.log(`party ${party.join('+')}, banked ${gather}/s, breaks at ${ends.join(' / ')} min, windows ${SERPENT_WINDOW.join(' / ')} s`);
  console.log('depths', r.made.map(x => Math.round(x)).join(' / '));
  console.log('rungs at each break', r.at.map(a => a.rungs).join('  '));
} else {
  // `--depths` and `--windows` try numbers before they go in config.
  const list = (k, dflt) => (arg(k) ? arg(k).split(',').map(Number) : dflt);
  const r = fight(list('--depths', SERPENT_WOUND), null, list('--windows', SERPENT_WINDOW));
  console.log(`party ${party.join('+')}, banked ${gather}/s`);
  for (const [i, a] of r.at.entries()) console.log(`stage ${i + 1} breaks at ${min(a.min)} min, rungs ${a.rungs}`);
  console.log(`left loose on the floor: ${Math.round(r.loose)}`);
}
