// Act 3's pace, played: the node yard with the act begun and a player in it,
// run from the refusal to the strike, with the game minute each milestone
// lands at printed as a table. So "how long is act 3?" and "where does it
// stall?" are answered by a run, not by reading src/config/after.js.
//
//   node tools/node/act3-pace.mjs                      # the table, config as written
//   node tools/node/act3-pace.mjs --minutes 150 --seed 2
//   node tools/node/act3-pace.mjs --pop 0.85 --hand 0.25 --human 0.7
//   node tools/node/act3-pace.mjs --yard 0.5 --bank 0  # half the late yard's income, nothing banked
//   node tools/node/act3-pace.mjs --log                # every purchase, as it lands
//   node tools/node/act3-pace.mjs --carry 8            # the yard's carry bought to its top
//
// The player, the way the page has one:
//   - Pops the pair's bubbles: each one the pedestal sends up is popped with
//     chance `--pop`, through the hand's own press (`__gesture`).
//   - Works the stations by hand `--hand` of the time, at `--human` of each
//     motion's top speed, read off config/gestures.js: the furthest station
//     down the chain that has its input first (the workshop, the saw mill),
//     else a tree, a stump, the heap. The work goes
//     through the doors the hand's motions go through (`workAfter`,
//     `chopTree`, `digStump`, `tipSawdust`).
//   - Buys through `__buy`, greedily in PLAN's order: the first row on it
//     not yet had that can be paid is bought; a post is passed over while
//     nobody waits in the camp to take it. With the plan had, posts round
//     the chain's end as members wait.
//   - The yard keeps running down there, so its coins come in at the late
//     yard's rate (LATE_YARD, below, read off a played yard) times `--yard`,
//     into a purse this tool keeps; a bill's yard coins are granted onto the
//     yard's pile the moment its row is bought, and the row's own `take`
//     lifts them off again. The yard itself is the node yard's fresh one, so
//     a run is a minute or two of wall, not an hour.
//
// What it reports: when each milestone lands, the longest stretch with
// nothing bought, and what the plan's next row was short of while it
// waited -- the act's coins, or the yard's alone (DESIGN.md, "The yard pays
// too": they should matter but never block alone).

//
// The player itself is tools/node/act3-player.mjs, so the test tier plays the
// same one (test/after-hands-off.test.mjs).

import { newYard } from './yard.mjs';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const MINUTES = +arg('minutes', 180);
const SEED = +arg('seed', 1);
const POP = +arg('pop', 0.85);
const HAND = +arg('hand', 0.25);
const HUMAN = +arg('human', 0.7);
const YARD = +arg('yard', 1);
const BANK = +arg('bank', 120);
const LOG = process.argv.includes('--log');
// The yard's carry level (`haulCarryLevel`), which act 3's loads are counted in.
const CARRY = +arg('carry', 0);

const yard = await newYard();
const { S } = yard;
const { playAct3, mm } = await import('./act3-player.mjs');
const { union } = await import('../../src/after/union.js');
const { haulCap } = await import('../../src/levels.js');
const { goodsRead } = await import('../../src/after/piles.js');


const wall0 = Date.now();
const { marks, bought, longest, blocked, yardPaid, handDid, LATE_YARD, YARD_COINS, BANK_S } =
  playAct3({ minutes: MINUTES, seed: SEED, pop: POP, hand: HAND, human: HUMAN, yard: YARD, bank: BANK, carry: CARRY, log: LOG });
const a = S.after;

console.log(`act 3 pace: seed ${SEED}, pop ${POP}, hand ${HAND} at ${HUMAN}, yard x${YARD} (bank ${BANK_S} s), ` +
            `${Math.round((Date.now() - wall0) / 1000)} s wall`);
console.log('');
console.log('  minute  milestone');
for (const m of marks) console.log(`  ${mm(m.t).padStart(6)}  ${m.what}`);
console.log('');
console.log(`longest stretch with nothing bought: ${mm(longest.s)} (from ${mm(longest.from)}, ended by ${longest.by})`);
console.log(`the plan's next row waited ${mm(blocked.act)} short of the act's coins, ${mm(blocked.yard)} short of the yard's alone`);
console.log(`the yard paid up: ${YARD_COINS.map(c => `${c} ${Math.round(yardPaid[c])} (${(yardPaid[c] / (LATE_YARD[c] * YARD) / 60).toFixed(1)} min of it)`).join(', ')}`);
console.log(`the hand: ${Object.entries(handDid).map(([k, n]) => `${k} ${n}`).join(', ')}`);
console.log(`at the end: rebel ${Math.round(a.rebel)}, stock ${JSON.stringify(goodsRead())}, camp ${a.camp}, union ${union()}, ` +
            `signs ${a.signs.length}`);
console.log(`rosters: ${JSON.stringify(a.crew)}, seats bought: ${JSON.stringify(Object.fromEntries(Object.entries(a.ups).filter(([k]) => k.startsWith('after-seat-'))))}, the yard's carry ${haulCap()} a load`);
console.log(`bought ${bought.length}: ` + bought.map(b => `${mm(b.t)} ${b.key.replace('after-', '')}`).join(', '));
