// How fast the story can be had by a player who plays well: the node yard
// with a greedy-but-sensible bot in it, run from the opening to the rescue
// and on through the drowning, the snatch and the portal into the deep, with
// the game time each milestone lands at printed as it lands.
//
//   node tools/node/speedrun.mjs                       # 8 clicks/s, to the deep or 16 h
//   node tools/node/speedrun.mjs --cps 0               # the idle bot: never touches the rock
//   node tools/node/speedrun.mjs --hours 6 --seed 2 --frac 0.03 --haul 0.35 --every 600
//   node tools/node/speedrun.mjs --keep ck.json         # a checkpoint every --every seconds
//   node tools/node/speedrun.mjs --from ck.json         # ...and on from it
//
// A run to the deep is about six minutes of wall at 8 clicks/s.
//
// The bot is a player, not a hook: everything it gets it gets the way the
// page gets it.
//   - It swings at the rock `--cps` times a game second (the click), or holds
//     the button once "hold to mine" is bought and the held swing is quicker
//     (`mineRate`), whichever is more.
//   - It buys through the rows (`__buy`, the press a card gets). The story's
//     next row (the shields, the doors they open, the tower's hat, the dome,
//     the portal) is the goal: bought the moment it can be paid. Anything else
//     shown is bought, cheapest first, when every coin it shares with the goal
//     either stays covered after the purchase or costs no more than `--frac`
//     (0.1) of the goal's price in that coin; never while the same row is
//     still waiting to be built, and never spending the dome's 27 cores.
//     The casino is never touched.
//   - It staffs every open station to its room through the roster's + (`__assign`),
//     wizards first and the rock last, keeping `--haul` of the yard's crew
//     carrying (at least two); a station short of hands takes one off the rock.
//     The idle bot (`--cps 0`) has its one body take turns on the rock and
//     carrying until there are three, and buys nothing for the hands.
//   - With the pit drowned and the snatch played it presses the portal (the
//     click on it, `goDeep`).
// It never tosses, sweeps, catches or skips a scene; a quicker human gets
// those for free, so the figures are a sensible player's, not a ceiling.
//
// The second half is forced on (`__serpentOn(true)`), so the drowning, the
// snatch and the portal are in the story whatever SERPENT_ON says. Crits roll
// as in play (the node yard switches them off; this switches them back).
// The reload harness never runs here: this does not go through helpers.mjs.
//
// Times are game time: the yard's own clock turned a frame at a time, which
// is what a player sitting at it would see on the wall. "rescued in" is the
// sheet's own number, `S.buriedMs`, which stops when the sqwife walks out.

import { newYard } from './yard.mjs';
import { readFileSync, writeFileSync } from 'node:fs';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const CPS = +arg('cps', 8);
const HOURS = +arg('hours', 16);
const SEED = +arg('seed', 1);
const FRAC = +arg('frac', 0.1);
const HAUL = +arg('haul', 0.35);
const EVERY = +arg('every', 1800);            // a status line every so many game seconds

const yard = await newYard();
const g = globalThis;
const { S } = yard;
const { mineRate } = await import('../../src/levels.js');
const { rockDown } = await import('../../src/rock.js');
const { objective } = await import('../../src/objectives.js');
const { goDeep } = await import('../../src/view.js');
const { JOBS, yardSpare } = await import('../../src/staffing.js');
const { roomAt } = await import('../../src/levels.js');
const { forceCrit } = await import('../../src/crit.js');
const { ABYSS_AT } = await import('../../src/config.js');

g.__seed(SEED);
g.__serpentOn(true);
forceCrit(null);
// The opening, played: the clock starts at the first rock, under the pair.
g.__reset(true);

const T0 = S.tick;
let t = 0;                                     // game seconds since the reset
const hms = s => { s = Math.round(s); return `${Math.floor(s / 3600)}:${String(Math.floor(s / 60) % 60).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };

// --- the milestones: a fact, said once, the first second it is true ---------
const marks = [];
const said = new Set();
const mark = (key, what) => {
  if (said.has(key)) return;
  said.add(key);
  marks.push([t, what]);
  console.log(`${hms(t).padStart(8)}  ${what}`);
};
const FACTS = [
  ['farm', () => S.farmOpen, 'the farm opens'],
  ['quarry', () => S.quarryOpen, 'the quarry opens'],
  ['tower', () => S.towerOpen, 'the tower stands'],
  ['apoth', () => S.apothecaryOpen, 'the apothecary opens'],
  ['shack', () => S.shackOpen, 'the shack opens'],
  ['filter', () => S.filterOpen, 'the air filter stands'],
  ['core', () => S.cores > 0, 'first core banked'],
  ['spore', () => S.spores > 0, 'first spore'],
  ['shard', () => S.shards > 0, 'first shard'],
  ['hat', () => S.wizardHats > 0, 'first wizard hat'],
  ['spark', () => S.sparks > 0, 'first spark'],
  ['machine', () => Object.values(S.machines || {}).some(m => m.bought), 'first machine bought'],
  ['props', () => S.shieldsDone.includes('props'), 'shield: the props fail'],
  ['net', () => S.shieldsDone.includes('net'), 'shield: the net fails'],
  ['arch', () => S.shieldsDone.includes('arch'), 'shield: the arch fails'],
  ['dome', () => S.shieldsDone.includes('dome'), 'shield: the dome holds'],
  ['rescued', () => S.rescued, 'RESCUED'],
  ['torn', () => S.riftOpen, 'the pit tears (torn era)'],
  ['eat25', () => S.riftAte >= ABYSS_AT / 4, 'the rift has eaten a quarter of ABYSS_AT'],
  ['eat50', () => S.riftAte >= ABYSS_AT / 2, 'the rift has eaten half'],
  ['drowned', () => S.drowned, 'DROWNED: the abyss'],
  ['snatched', () => S.snatched, 'the snatch: the deep has its crew'],
  ['portalbuy', () => S.portalPour > 0 || S.portalOpen, 'the portal bought (the pour starts)'],
  ['portal', () => S.portalOpen, 'the portal stands'],
  ['deep', () => S.view === 'deep', 'IN THE DEEP'],
];
let lastObj = null, lastRock = 1;
function watch() {
  for (const [k, f, what] of FACTS) if (f()) mark(k, what);
  const o = objective();
  const ok = o ? o.key : 'told';
  if (ok !== lastObj) { if (lastObj) mark('obj:' + ok, `objective -> ${ok}${o ? ` ("${o.say}")` : ''}`); lastObj = ok; }
  if (S.boulderNo !== lastRock) {
    lastRock = S.boulderNo;
    if (lastRock <= 10 || [20, 50, 100, 200, 500, 1000].includes(lastRock)) mark('rock' + lastRock, `rock #${lastRock} comes down`);
  }
}

// --- buying -------------------------------------------------------------------
// The story's own rows, in story order: the first of these shown is the goal.
const STORY = ['props', 'unlockfarm', 'net', 'unlockquarry', 'arch', 'unlocktower', 'wizard',
               'dome', 'portal'];
// Never pressed: a wager, a toggle, or a row that undoes something.
const NEVER = new Set(['unlockcasino', 'potkeep', 'askwizards']);
// and the idle bot buys nothing for hands it never uses
if (CPS === 0) for (const k of ['auto', 'speed', 'pick', 'autotoss', 'toss', 'reach']) NEVER.add(k);
const bal = () => ({ dust: S.stored, core: S.cores, shard: S.shards, spore: S.spores,
                     spark: S.sparks, scale: S.scales });
const coins = bill => bill.filter(([m]) => m !== 'time');
const affords = (bill, b) => coins(bill).every(([m, n]) => (b[m] ?? 0) >= n);
const pending = () => new Set(Object.values(S.works || {}).flat().filter(Boolean).map(w => w.key));
const weight = bill => coins(bill).reduce((a, [m, n]) => a + n * (m === 'dust' ? 1 : m === 'core' ? 5000 : 20), 0);
const bought = {};
// the dome's 25 and the tower's 2, while the dome is still to come
const CORE_KEEP_ALL = 27;
let CORE_KEEP = CORE_KEEP_ALL;
let goalKey = null;
const covered = {};

function shop() {
  CORE_KEEP = S.shieldsDone.includes('dome') ? 0 : CORE_KEEP_ALL;
  let rows = g.__rows().filter(r => r.shown && !r.done && !NEVER.has(r.key));
  const building = pending();
  // the goal: the first story row on a board and not yet on its way
  const goal = STORY.map(k => rows.find(r => r.key === k)).find(r => r && !building.has(r.key)
    && !(r.key === 'wizard' && S.wizardHats > 0));
  goalKey = goal?.key ?? null;
  // When each coin of the goal's bill was first in the purse: the last of
  // them to come is the gate the wait was on.
  if (goal) {
    const b = bal(), seen = (covered[goal.key] ||= { from: t });
    for (const [m, n] of coins(goal.bill)) if (!(m in seen) && (b[m] ?? 0) >= n) seen[m] = t;
  }
  if (goal && affords(goal.bill, bal()) && g.__buy(goal.key)) {
    bought[goal.key] = (bought[goal.key] || 0) + 1;
    const c = covered[goal.key] || {};
    const gates = Object.entries(c).filter(([m]) => m !== 'from').sort((a, b) => a[1] - b[1])
      .map(([m, at]) => `${m} ${hms(at - c.from)}`).join(', ');
    mark('buy:' + goal.key, `bought ${goal.key} (goal for ${hms(t - (c.from ?? t))}; each coin in hand after: ${gates})`);
    rows = g.__rows().filter(r => r.shown && !r.done && !NEVER.has(r.key));
  }
  const need = goal ? Object.fromEntries(coins(goal.bill)) : {};
  // The tower's hat is the story's once; every hat after is a row like any other.
  const rest = rows.filter(r => r.key !== goalKey && (!STORY.includes(r.key) || r.key === 'wizard') && r.bill.length
                                && !building.has(r.key))
                   .sort((a, b) => weight(a.bill) - weight(b.bill));
  for (const r of rest) {
    const b = bal();
    if (!affords(r.bill, b)) continue;
    // A coin the goal also wants is spent freely while the goal's share of it
    // is already in the purse after, and otherwise only in small change.
    if (coins(r.bill).some(([m, n]) => need[m] && b[m] - n < need[m] && n > FRAC * need[m])) continue;
    // and the dome's cores are kept back: they come one a rock
    if (coins(r.bill).some(([m, n]) => m === 'core' && S.cores - n < CORE_KEEP)) continue;
    if (g.__buy(r.key)) bought[r.key] = (bought[r.key] || 0) + 1;
  }
}

// --- staffing -----------------------------------------------------------------
// Every open station filled to its room, the specialists first, with a share of the
// yard left carrying. Only stations already standing: the roster's + opens
// nothing (the hook's `assign` would open a shut quarry or farm, so they are
// asked only when they are open).
// The rock has no floor plan and takes every body offered, so it is asked
// last and gets what the stations leave.
const ORDER = ['wizards', 'farmhands', 'quarriers', 'stirrers', 'janitors', 'purifiers', 'scholars', 'rockhands'];
function staff() {
  const yardCrew = S.crew - (S.deepCrew || 0);
  const keep = Math.max(2, Math.ceil(HAUL * yardCrew));
  // The idle bot never touches the rock, so somebody has to: its first body
  // goes on the rock whatever that leaves carrying.
  // With one body it takes turns: on the rock until the rock's pile is full,
  // then carrying until it is not.
  if (CPS === 0 && yardCrew < 3) {
    if (S.pileFull?.rock) { if (S.rockhands > 0) g.__assign('rockhands', -1); }
    else if (S.rockhands < 1 && yardSpare() > 0) g.__assign('rockhands', 1);
    return;
  }
  for (const job of ORDER) {
    if (!JOBS.includes(job)) continue;
    if (job === 'quarriers' && !S.quarryOpen) continue;
    if (job === 'farmhands' && !S.farmOpen) continue;
    for (let guard = 0; guard < 40 && roomAt(job) > 0; guard++) {
      // a station short of hands takes one off the rock before the carriers
      let pulled = false;
      if (yardSpare() <= keep) {
        if (job === 'rockhands' || S.rockhands < (CPS === 0 ? 2 : 1)) break;
        g.__assign('rockhands', -1);
        pulled = true;
      }
      const was = S[job];
      g.__assign(job, 1);
      if (S[job] === was) { if (pulled) g.__assign('rockhands', 1); break; }
    }
  }
}

// --- the hands ----------------------------------------------------------------
let clicks = 0;
function hands(seconds) {
  // A second of play: the swings spread over it, a frame-group a swing.
  // the idle bot (`--cps 0`) never holds the button either
  const held = S.autoMine && CPS > 0 ? mineRate() : 0;
  const n = Math.max(CPS, held);
  if (n <= 0 || !rockDown()) { yard.fast(seconds); return; }
  const per = Math.max(1, Math.round(n * seconds));
  const frames = Math.round(seconds * 60);
  let done = 0;
  for (let i = 0; i < per; i++) {
    const upto = Math.round(((i + 1) * frames) / per);
    if (rockDown()) { g.__swing(1); clicks++; }
    yard.fast((upto - done) / 60);
    done = upto;
  }
}

// --- the run ------------------------------------------------------------------
const LIMIT = HOURS * 3600;
const wall0 = Date.now();
console.log(`speedrun: ${CPS} clicks/s, seed ${SEED}, frac ${FRAC}, haul ${HAUL}, limit ${HOURS} h`);
let wentDown = false;
// A checkpoint, for working on the late game without replaying the early one:
// `--keep f` writes the save and the bot's notes every `--every` seconds,
// `--from f` starts there. A resumed run is a reload in the middle, so the
// figures to quote are a straight run's.
const KEY = 'boulder-clicker/v4';
if (arg('from')) {
  const c = JSON.parse(readFileSync(arg('from'), 'utf8'));
  localStorage.setItem(KEY, c.raw); yard.restore(); g.__build();
  t = c.t; c.said.forEach(k => said.add(k)); marks.push(...c.marks); lastObj = c.lastObj; lastRock = c.lastRock;
  console.log(`resumed at ${hms(t)}`);
}
const keep = () => {
  if (!arg('keep')) return;
  yard.persist();
  writeFileSync(arg('keep'), JSON.stringify({ t, said: [...said], marks, lastObj, lastRock, raw: localStorage.getItem(KEY) }));
};
for (; t < LIMIT; t++) {
  hands(1);
  watch();
  if (t % 2 === 0) shop();
  if (t % 10 === 0) staff();
  if (S.portalOpen && !wentDown && S.view !== 'deep') { goDeep(); wentDown = true; }
  if (said.has('deep')) break;
  if (t % EVERY === 0 && t > 0) {
    keep();
    const b = bal();
    console.log(`${hms(t).padStart(8)}  .. rock#${S.boulderNo} (${S.boulder.flat().reduce((a, c) => a + c, 0)} px) crew ${S.crew} (rock ${S.rockhands}, carry ${S.haulers}) dust ${Math.round(b.dust)} core ${b.core} `
      + `shard ${Math.round(b.shard)} spore ${Math.round(b.spore)} spark ${Math.round(b.spark)} `
      + `wiz ${S.wizards}/${S.wizardHats} sky ${S.meteorOpen ? 'open' : 'shut'} ate ${Math.round(S.riftAte || 0)} goal ${goalKey} [${Math.round((Date.now() - wall0) / 1000)}s wall]`);
  }
}

console.log('');
console.log(`ended at ${hms(t)} game, ${Math.round((Date.now() - wall0) / 1000)} s wall; ${clicks} swings`);
console.log(`rescued in (sheet clock, S.buriedMs): ${S.rescued ? hms(S.buriedMs / 1000) : 'not rescued'}`);
if (!said.has('deep')) {
  const o = objective();
  console.log(`STALLED: objective ${o ? o.key : 'none'}, goal row ${goalKey}, bal ${JSON.stringify(bal())}`);
}
console.log('bought: ' + Object.entries(bought).map(([k, n]) => `${k}x${n}`).join(' '));
