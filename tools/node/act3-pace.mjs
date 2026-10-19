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
//
// The player, the way the page has one:
//   - Pops the pair's bubbles: each one the pedestal sends up is popped with
//     chance `--pop`, through the hand's own press (`__gesture`).
//   - Works the stations by hand `--hand` of the time, at `--human` of each
//     motion's top speed, read off config/gestures.js: the furthest station
//     down the chain that has its input first (the press, the workshop, the
//     paper mill, the saws), else a tree, a stump, the heap. The work goes
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

import { newYard } from './yard.mjs';

const arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const MINUTES = +arg('minutes', 180);
const SEED = +arg('seed', 1);
const POP = +arg('pop', 0.85);
const HAND = +arg('hand', 0.25);
const HUMAN = +arg('human', 0.7);
const YARD = +arg('yard', 1);
const LOG = process.argv.includes('--log');

const yard = await newYard();
const g = globalThis;
const { S } = yard;
const C = await import('../../src/config.js');
const { workAfter } = await import('../../src/after/work.js');
const { chopTree, digStump, standing, stumped } = await import('../../src/after/grove.js');
const { tipSawdust, heapFull } = await import('../../src/after/mill.js');
const { bubbles } = await import('../../src/after/bubbles.js');
const { built } = await import('../../src/after/levels.js');
const { afterRow, afterBill, afterMaxed, postRebel } = await import('../../src/after/rows.js');
const { union, support } = await import('../../src/after/union.js');
const { wallSlots } = await import('../../src/after/place.js');

// A late yard's income, coins a second: a played yard at the deep's door
// (tools/node/speedrun.mjs, seed 1, its 2:00:00 checkpoint) left to run three
// game minutes buying nothing, as a finished yard does: everything on its
// boards bought, its crew digging and carrying. Act 3 comes after the
// serpent, later and richer still, so this is the floor of what the yard
// sends up. Its bank there was 69k dust, 265k crops, 106k ore and 60k sparks.
// The deep's scales, which the bills name from the ore band on: a seven-station
// party at its top rungs sheds about 25 a second (deep-pace.mjs --table) and
// its gatherers bank most of it; 15 a second is what reaches the purse.
const LATE_YARD = { dust: 920, spore: 238, shard: 296, scale: 15, spark: 67 };
// What the yard has banked when the house falls, in seconds of that income:
// a couple of minutes, so the case run is a player who has just spent it.
const BANK_S = +arg('bank', 120);

// --- the hand's speeds, off config/gestures.js -------------------------------------
// Seconds a unit of hand work at a motion's top speed; the player is HUMAN of it.
const HAND_S = {
  chop: (2 * C.GESTURE_SAW_END * C.GESTURE_SAW_AMP) / C.GESTURE_SAW_VMAX,   // a stroke end to end, a chop
  dig: C.GESTURE_STRAIN_S,                                                   // a root snapping, held up
  mill: C.GESTURE_WHEEL_LOG / (C.GESTURE_WHEEL_FEED * C.GESTURE_WHEEL_MAX_REV),
  chipper: C.GESTURE_FEED_LOG / C.GESTURE_FEED_FAST + C.GESTURE_FEED_RAMP_S / 2,
  papermill: C.GESTURE_STIR_TURNS / C.GESTURE_STIR_MAX_REV,
  workshop: C.GESTURE_SIGN_BLOWS * C.GESTURE_SWING_S,
  press: 1 / C.GESTURE_BAR_RATE + 1 / C.GESTURE_BAR_RETURN,
  tip: C.GESTURE_FLING_WINDOW_S * 4
};
// A person is slower than the cap, and no motion is quicker than a quarter second.
const handS = k => Math.max(0.25, HAND_S[k] / HUMAN);

// --- the plan: what a sensible player buys, in order -------------------------------
// The axe and the saw mill first (the logs lie where a tree falls until a
// hauler carries them, so one goes with it), the workshop and a carrier to
// get signs into the crowd, then the chain's other stations and a post at
// each, then the upgrades. A post named twice is two posts.
const PLAN = [
  'after-axe', 'after-build-mill', 'after-post-hauler', 'after-post-sawyer', 'after-build-workshop',
  'after-post-carrier', 'after-shout', 'after-post-woodcutter', 'after-post-joiner', 'after-plot',
  'after-build-chipper', 'after-post-feeder', 'after-post-carrier', 'after-post-agitator', 'after-heap', 'after-blade', 'after-plot',
  'after-build-papermill', 'after-post-pulper', 'after-build-press', 'after-post-printer', 'after-post-paster',
  'after-stumps', 'after-grow', 'after-drum', 'after-vat', 'after-post-hauler', 'after-post-woodcutter',
  'after-bench', 'after-stack', 'after-spout', 'after-plot', 'after-dry', 'after-post-pulper',
  'after-post-carrier', 'after-post-paster', 'after-tree', 'after-signreach', 'after-posterreach'
];
// Past the plan, a post where the chain is short, as a player watching the
// piles would put one: a joiner while carriers wait on signs with timber in,
// a hauler while logs lie in the grove, a woodcutter while grown trees
// stand, a printer or a paster likewise at the press; else a carrier, the
// post that wins members, and an agitator every fourth.
let laterN = 0, laterKey = null;
// The most of an act's coin any row still on the plan asks: a post that would
// eat it (a joiner the timber, a printer the paper) waits until that is in.
function planNeeds(coin) {
  const count = {};
  let most = 0;
  for (const key of PLAN) {
    count[key] = (count[key] || 0) + 1;
    if (done(key, count[key])) continue;
    most = Math.max(most, (afterBill(afterRow(key)).find(([c]) => c === coin) || [0, 0])[1]);
  }
  return most;
}
function nextLater() {
  const a = S.after, st = a.stock, n = j => a.posts[j] || 0;
  const lying = a.plots.reduce((s, p) => s + p.logs, 0);
  const open = j => afterRow(`after-post-${j}`).show();
  const pick = (laterN % 4 === 3 ? 'agitator'
    : st.signs < n('carrier') && st.timber >= 8 * C.AFTER_SIGN_TIMBER + planNeeds('timber') && open('joiner') ? 'joiner'
    : st.timber < 10 * C.AFTER_SIGN_TIMBER && lying > 3 * C.AFTER_LOGS_A_TREE * Math.max(1, n('hauler')) ? 'hauler'
    : st.timber < 10 * C.AFTER_SIGN_TIMBER && a.plots.filter(standing).length > n('woodcutter') ? 'woodcutter'
    : st.posters < n('paster') && st.paper >= 8 * C.AFTER_POSTER_PAPER + planNeeds('paper') && open('printer') ? 'printer'
    : open('paster') && st.posters > 4 * C.AFTER_PASTE_LOAD && a.posters.length < wallSlots() - n('paster') * C.AFTER_PASTE_LOAD ? 'paster'
    : 'carrier');
  return open(pick) ? `after-post-${pick}` : null;
}

// --- the purse the yard keeps topping up --------------------------------------------
const YARD_COINS = C.AFTER_YARD_COINS;
const yardPurse = Object.fromEntries(YARD_COINS.map(c => [c, LATE_YARD[c] * YARD * BANK_S]));
const yardPaid = Object.fromEntries(YARD_COINS.map(c => [c, 0]));
const GRANT_KEY = { dust: 'dust', spore: 'spores', shard: 'shards', scale: 'scales', spark: 'sparks' };
const actHave = c => (c === 'rebel' ? S.after.rebel : S.after.stock[c] || 0);
const have = c => (YARD_COINS.includes(c) ? yardPurse[c] : actHave(c));
const shortOf = bill => bill.filter(([c, n]) => have(c) < n).map(([c]) => c);
// A row as the plan names it, the nth time: a post is had once n stand, the
// grove's plots once n are cleared, anything else once bought.
function done(key, n) {
  const u = afterRow(key);
  if (!u) return true;
  if (u.post) return u.from() >= n;
  if (key === 'after-plot') return afterMaxed(u) || u.rung() >= n;
  return afterMaxed(u);
}
function buy(key) {
  const u = afterRow(key);
  if (!u || !u.show() || u.dead?.() || afterMaxed(u)) return false;
  const bill = afterBill(u);
  if (shortOf(bill).length) return false;
  const yardPart = Object.fromEntries(bill.filter(([c]) => YARD_COINS.includes(c)).map(([c, n]) => [GRANT_KEY[c], n]));
  if (Object.keys(yardPart).length) g.__grant(yardPart);
  if (!g.__buy(key)) return false;
  for (const [c, n] of bill) if (YARD_COINS.includes(c)) { yardPurse[c] -= n; yardPaid[c] += n; }
  return true;
}

// --- the act stood up, as the opening leaves it --------------------------------------
g.__seed(SEED);
g.__actsOn(true);
g.__goPlace('after');
for (const k of ['house-fall', 'arrive', 'meet-god', 'refuse']) if (!S.beatsDone.includes(k)) S.beatsDone.push(k);
// The yard's own counters emptied: this tool's purse is the yard's.
S.shards = 0; S.spores = 0; S.sparks = 0; S.scales = 0;

// --- the milestones ------------------------------------------------------------------
const marks = [];
const said = new Set();
let t = 0;
const mm = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
function mark(key, what) {
  if (said.has(key)) return;
  said.add(key);
  marks.push({ t, what });
}
function watch() {
  const a = S.after;
  if (a.axe) mark('axe', 'axe in hand');
  const raised = a.built.filter(k => !C.AFTER_START_BUILT.includes(k));
  if (raised.length) mark('first', `first station (${raised[0]})`);
  for (const k of Object.keys(C.AFTER_BUILDS)) if (built(k)) mark(`b-${k}`, `${k} stands`);
  if (a.signs.length) mark('sign', 'first sign planted');
  if (a.posters.length) mark('poster', 'first poster pasted');
  if (union() > C.AFTER_FIRST_MEMBERS) mark('member', 'first member won');
  for (let k = 0; k < a.gate; k++) mark(`g-${k}`, `gate: ${C.AFTER_GATES[k]}`);
}

// --- the hand ------------------------------------------------------------------------
let handAcc = 0;
const handDid = {};
// Where the hand goes: the furthest station down the chain with its input in,
// then the grove. Null with nothing to work.
function handJob() {
  const a = S.after, st = a.stock;
  // Signs and posters piling up at the door are the carriers' wait, not the
  // hand's: it makes more only while there are few, and leaves the timber
  // and paper alone while the next thing on the plan is short of them.
  const want = wanted()[0], short = want ? shortOf(afterBill(afterRow(want))) : [];
  if (built('press') && st.paper >= C.AFTER_POSTER_PAPER && st.posters < 8 && !short.includes('paper')) return 'press';
  if (built('workshop') && st.timber >= C.AFTER_SIGN_TIMBER && st.signs < 3 && !short.includes('timber')) return 'workshop';
  if (built('papermill') && st.sawdust >= C.AFTER_PULP_SAWDUST) return 'papermill';
  if (built('mill') && st.logs > 0 && !heapFull()) return 'mill';
  if (built('chipper') && st.chiplogs > 0 && !heapFull()) return 'chipper';
  if (heapFull()) return 'tip';
  if (a.axe && a.plots.some(standing)) return 'chop';
  if (a.plots.some(stumped)) return 'dig';
  return null;
}
function handWork(dt) {
  handAcc += dt * HAND;
  for (let guard = 0; guard < 20; guard++) {
    const job = handJob();
    if (!job) { handAcc = Math.min(handAcc, 1); return; }
    const s = handS(job);
    if (handAcc < s) return;
    handAcc -= s;
    const a = S.after;
    if (job === 'chop') chopTree(a.plots.findIndex(standing), true);
    else if (job === 'dig') digStump(a.plots.findIndex(stumped), true);
    else if (job === 'tip') tipSawdust();
    else workAfter(job, 1, true);
    handDid[job] = (handDid[job] || 0) + 1;
  }
}
// The bubbles: each one popped once, or let go, as it first shows.
const seen = new Set();
let rng = SEED * 9301 + 49297;
const roll = () => ((rng = (rng * 9301 + 49297) % 233280) / 233280);
function popBubbles() {
  for (const b of bubbles()) {
    if (!b.open || seen.has(b.id)) continue;
    seen.add(b.id);
    if (roll() >= POP) continue;
    g.__gesture('down', b.x + b.w / 2, b.y + b.h / 2);
    g.__gesture('up', b.x + b.w / 2, b.y + b.h / 2);
  }
}

// --- the run -------------------------------------------------------------------------
// What is wanted now: every row on the plan not yet had, in order, whose
// station stands and (a post) with a member waiting to take it; past the
// plan, the next post round the chain's end. The members are few until the
// signs win more, so the plan's posts are taken in its order: past the first
// row still to have, only stations and upgrades are bought ahead. A post
// round the chain's end is taken once no post on the plan is wanted, and
// while the plan still waits on something only with RESERVE members idle.
const RESERVE = 3;
// The members waiting in the camp that no post bought already has sent for:
// a post is filled on the frame after it is bought.
const free = () => S.after.camp - Object.entries(S.after.posts).reduce((n, [j, k]) => n + k - S.after.bodies.filter(b => b.job === j).length, 0);
const wanted = () => {
  const count = {}, out = [];
  let ahead = false;
  for (const key of PLAN) {
    count[key] = (count[key] || 0) + 1;
    if (done(key, count[key])) continue;
    const u = afterRow(key);
    if (u.post && (free() <= 0 || ahead)) continue;
    if (!u.show() || u.dead?.()) { ahead = true; continue; }
    if (!out.includes(key)) out.push(key);
    ahead = true;
  }
  const planPost = out.some(k => afterRow(k).post);
  const next = nextLater();
  // ...and not while the plan saves its rebel for a dearer row: a post
  // then only if it is a small share of that row's.
  const first = out[0], firstRebel = first ? (afterBill(afterRow(first)).find(([c]) => c === 'rebel') || [0, 0])[1] : 0;
  const saving = first && shortOf(afterBill(afterRow(first))).includes('rebel') && postRebel() * 4 > firstRebel;
  laterKey = next && !planPost && !saving && S.after.posts.carrier && free() >= (out.length ? RESERVE : 1) ? next : null;
  if (laterKey) out.push(laterKey);
  return out;
};
const bought = [];
let lastBuy = 0, longest = { s: 0, from: 0, by: null };
const blocked = { act: 0, yard: 0 };      // seconds the plan's next row waited, by who it was short of
const wall0 = Date.now();
const STEP = 0.5;
for (; t < MINUTES * 60 && S.after.gate < C.AFTER_GATES.length; t += STEP) {
  for (const c of YARD_COINS) yardPurse[c] += LATE_YARD[c] * YARD * STEP;
  popBubbles();
  handWork(STEP);
  g.__fast(STEP);
  watch();
  // The first thing wanted that can be paid, bought; again while one can.
  for (let k = 0; k < 8; k++) {
    const want = wanted();
    const key = want.find(w => !shortOf(afterBill(afterRow(w))).length);
    if (!key || !buy(key)) {
      if (want.length) {
        const sh = shortOf(afterBill(afterRow(want[0])));
        if (sh.length && sh.every(c => YARD_COINS.includes(c))) blocked.yard += STEP;
        else if (sh.length) blocked.act += STEP;
      }
      break;
    }
    bought.push({ t, key });
    if (LOG) console.log(`${mm(t).padStart(6)}  bought ${key}  (rebel ${Math.round(S.after.rebel)}, camp ${S.after.camp}, ` +
                         `union ${union()}, stock ${JSON.stringify(S.after.stock)})`);
    if (key === laterKey) laterN++;
    if (t - lastBuy > longest.s) longest = { s: t - lastBuy, from: lastBuy, by: key };
    lastBuy = t;
  }
}
watch();
if (process.env.DEBUG) { const r = S.after.rims, h = {}; for (const ch of r) h[ch] = (h[ch] || 0) + 1; const live = S.after.signs.filter(s => { for (let dr = -1; dr <= 1; dr++) for (let df = -1; df <= 1; df++) { const i = (s.r + dr) * 40 + s.f + df; if (i >= 0 && i < r.length && r[i] !== "9") return true; } return false; }).length; console.log("DEBUG rims", JSON.stringify(h), "signs", S.after.signs.length, "live", live, "askew", S.after.signs.filter(s => s.askew).length, "ranks", Math.ceil(r.length / 40)); }
const a = S.after;
if (t - lastBuy > longest.s) longest = { s: t - lastBuy, from: lastBuy, by: '(the end)' };
mark('end', a.gate >= C.AFTER_GATES.length ? 'the strike' : `NOT STRUCK in ${MINUTES} min (support ${(support() * 100).toFixed(1)}%)`);

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
console.log(`at the end: rebel ${Math.round(a.rebel)}, stock ${JSON.stringify(a.stock)}, camp ${a.camp}, union ${union()}, ` +
            `signs ${a.signs.length}, posters ${a.posters.length}`);
console.log(`posts: ${JSON.stringify(a.posts)}`);
console.log(`bought ${bought.length}: ` + bought.map(b => `${mm(b.t)} ${b.key.replace('after-', '')}`).join(', '));
