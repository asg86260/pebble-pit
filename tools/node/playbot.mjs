// A playthrough, driven: the node yard with a player in it. It clicks the
// rock, hires and staffs the crew, and buys every shown row it can pay for
// under a strategy — so a balance question ("when can this actually be
// bought?") is answered by a run rather than by reading the constants.
//
//   node tools/node/playbot.mjs greedy 360 1 4 > run.json
//
// arguments: strategy, game minutes, seed, clicks per second.
//   greedy — buy everything affordable, in board order
//   cheap  — buy cheapest first
//   none   — never buy: the income baseline
//
// The output is JSON: for every row, when it first showed, when it first
// became affordable, when it was first bought and how many times; plus a
// timeline of balances and rates every two game-minutes. The gap between
// `shown` and `afford` is the grind — see "The grind pass" in DESIGN.md,
// whose table is this file's output.
import { newYard } from './yard.mjs';

const [, , strat = 'greedy', minutes = '60', seedArg = '1', cpsArg = '4'] = process.argv;
const yard = await newYard();
const g = globalThis;
g.__seed(Number(seedArg));
const CPS = Number(cpsArg);
const TOTAL = Number(minutes) * 60;

// Balances under the names the bills use. The snapshot counts in plurals
// (`cores`), the bills charge in singulars (`core`) — matching them here is
// what lets affordability be read straight off a row's bill.
const bal = s => ({ dust: s.stored, core: s.cores, shard: s.shards, spore: s.spores, spark: s.sparks });
// `time` is labor, not a coin: every built row carries it and nobody's purse
// holds it.
const afford = (bill, b) => bill.every(([m, n]) => m === 'time' || (b[m] ?? 0) >= n);

const firstShown = {}, firstAfford = {}, boughtAt = {}, boughtBill = {}, buys = {};
const timeline = [];

function tryBuy(t) {
  const s = yard.state();
  const b = bal(s);
  const rows = g.__rows().filter(r => r.shown && r.bill.length);
  for (const r of rows) {
    if (!(r.key in firstShown)) firstShown[r.key] = t;
    if (!(r.key in firstAfford) && afford(r.bill, b)) firstAfford[r.key] = t;
  }
  if (strat === 'none') return;
  const buyable = rows.filter(r => afford(r.bill, bal(yard.state())));
  if (strat === 'cheap') buyable.sort((a, b2) => cost1(a) - cost1(b2));
  for (const r of buyable) {
    // balances moved with each buy this pass, so ask again before pressing
    if (!afford(g.__rows().find(x => x.key === r.key)?.bill ?? r.bill, bal(yard.state()))) continue;
    if (g.__buy(r.key)) {
      if (!(r.key in boughtAt)) { boughtAt[r.key] = t; boughtBill[r.key] = r.bill; }
      buys[r.key] = (buys[r.key] || 0) + 1;
      timeline.push([t, 'buy', r.key, JSON.stringify(r.bill)]);
    }
  }
}
const cost1 = r => r.bill.reduce((a, [, n]) => a + n, 0);

// Keep the stations staffed: a bench with nobody on it mints nothing, so an
// unstaffed run would measure the shop against an income no player has.
// Specialists first (they mint the scarcer coins), and always two haulers
// left standing — they are the spare hands every purchase is built with, and
// a yard with none deadlocks on its own bench.
function staff() {
  const s = yard.state();
  let spare = Math.max(0, (s.haulers ?? 0) - 2);
  const want = [
    ['quarriers', s.quarryOpen ? s.benches : 0],
    ['farmhands', s.farmOpen ? s.plotCount : 0],
    ['scholars', s.labOpen ? s.labRooms : 0],
    ['stirrers', s.apothecaryOpen ? s.apothPots : 0],
    ['wizards', s.wizardHats],
    ['rockhands', 2]
  ];
  for (const [job, n] of want) {
    let cur = s[job] ?? 0;
    let guard = 0;
    while (cur < n && spare > 0 && guard++ < 8) {
      g.__assign(job, 1);
      const now = yard.state()[job] ?? 0;
      if (now === cur) break;         // the roster said no: at a cap, or nobody free
      cur = now; spare--;
    }
  }
}

let clicksDone = 0;
for (let t = 0; t < TOTAL; t++) {
  const s = yard.state();
  if (s.rock > 0 && !s.rockFall && !s.dancing) { yard.swing(CPS); clicksDone += CPS; }
  yard.fast(1);
  if (t % 5 === 0) tryBuy(t);
  if (t % 30 === 0 && strat !== 'none') staff();
  if (t % 120 === 0) {
    const s2 = yard.state();
    timeline.push([t, 'bal', JSON.stringify(bal(s2)),
      `crew=${s2.crew} rock#${s2.boulderNo} rates=${JSON.stringify(s2.rates)} haze=${s2.smog?.haze}`]);
  }
}

const s = yard.state();
console.log(JSON.stringify({
  strat, minutes: Number(minutes), seed: Number(seedArg), cps: CPS, clicksDone,
  final: { ...bal(s), crew: s.crew, boulderNo: s.boulderNo, haze: s.smog?.haze },
  rows: Object.fromEntries(Object.keys(firstShown).map(k => [k, {
    shown: firstShown[k], afford: firstAfford[k] ?? null, bought: boughtAt[k] ?? null,
    n: buys[k] || 0, bill: boughtBill[k] ?? null
  }])),
  timeline
}, null, 1));
