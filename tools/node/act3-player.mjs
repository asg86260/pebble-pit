// Act 3's player, the one tools/node/act3-pace.mjs times and
// test/after-hands-off.test.mjs holds to a bound: the node yard with the act
// begun, played from the refusal to the strike. What the player does is
// written out at the top of act3-pace.mjs.
//
// `playAct3(opts)` runs it on the yard already standing (tools/node/yard.mjs,
// or the test tier's), turning the clock through `tick`, and hands back what
// happened: the milestones, every purchase, the longest wait and who it
// waited on.

import { S } from '../../src/state.js';
import * as C from '../../src/config.js';
import { workAfter } from '../../src/after/work.js';
import { chopTree, digStump, standing, stumped } from '../../src/after/grove.js';
import { tipSawdust, heapFull } from '../../src/after/mill.js';
import { bubbles } from '../../src/after/bubbles.js';
import { built } from '../../src/after/levels.js';
import { afterRow, afterBill, afterMaxed, postRebel } from '../../src/after/rows.js';
import { union, support } from '../../src/after/union.js';
import { wallSlots } from '../../src/after/place.js';

export const mm = s => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;

export function playAct3({ minutes = 180, seed = 1, pop = 0.85, hand = 0.25, human = 0.7, yard = 1, bank = 120,
                           log = false, tick = s => globalThis.__fast(s) } = {}) {
  const MINUTES = minutes, SEED = seed, POP = pop, HAND = hand, HUMAN = human, YARD = yard, LOG = log;
  const g = globalThis;
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
  const BANK_S = bank;

  // --- the hand's speeds, off config/gestures.js -------------------------------------
  // Seconds a unit of hand work at a motion's top speed; the player is HUMAN of it.
  const HAND_S = {
    chop: (2 * C.GESTURE_SAW_END * C.GESTURE_SAW_AMP) / C.GESTURE_SAW_VMAX,   // a stroke end to end, a chop
    dig: C.GESTURE_STRAIN_S,                                                   // a root snapping, held up
    mill: C.GESTURE_WHEEL_LOG / (C.GESTURE_WHEEL_FEED * C.GESTURE_WHEEL_MAX_REV),
    chipper: C.GESTURE_ARM_LOG / C.GESTURE_ARM_FEED + C.GESTURE_ARM_POSES * C.GESTURE_ARM_SPRING_S,
    papermill: C.GESTURE_STIR_TURNS / C.GESTURE_STIR_MAX_REV,
    workshop: C.GESTURE_NAILS * C.GESTURE_NAIL_TAPS * C.GESTURE_SWING_S,
    press: 1 / C.GESTURE_BAR_RATE + 1 / C.GESTURE_BAR_RETURN,
    tip: C.GESTURE_FLING_WINDOW_S * 4
  };
  // A person is slower than the cap, and no motion is quicker than a quarter second.
  // A name gone from config/gestures.js is NaN here, and a NaN wait lets the
  // hand work twenty times a step whatever --hand says: refuse to run.
  for (const [k, s] of Object.entries(HAND_S)) if (!Number.isFinite(s)) throw new Error(`act3-pace: the hand's ${k} reads NaN off config/gestures.js`);
  const handS = k => Math.max(0.25, HAND_S[k] / HUMAN);

  // --- the plan: what a sensible player buys, in order -------------------------------
  // The axe and the saw mill first (the logs lie where a tree falls until a
  // hauler carries them, so one goes with it), the workshop and a carrier to
  // get signs into the crowd, then the chain's other stations and a post at
  // each, then the upgrades. A post named twice is two posts.
  const PLAN = [
    'after-axe', 'after-build-mill', 'after-post-hauler', 'after-post-sawyer', 'after-build-workshop',
    'after-post-carrier', 'after-podium', 'after-post-woodcutter', 'after-post-joiner', 'after-plot',
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
      // A rung waiting on the union's support (the podium ladder's marks) is
      // passed over, not waited on: the posts after it are what win the
      // support it waits for.
      if (u.dead?.() && u.waits?.()) continue;
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
  const STEP = 0.5;
  for (; t < MINUTES * 60 && S.after.gate < C.AFTER_GATES.length; t += STEP) {
    for (const c of YARD_COINS) yardPurse[c] += LATE_YARD[c] * YARD * STEP;
    popBubbles();
    handWork(STEP);
    tick(STEP);
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
  const a = S.after;
  if (t - lastBuy > longest.s) longest = { s: t - lastBuy, from: lastBuy, by: '(the end)' };
  mark('end', a.gate >= C.AFTER_GATES.length ? 'the strike' : `NOT STRUCK in ${MINUTES} min (support ${(support() * 100).toFixed(1)}%)`);
  return { marks, bought, longest, blocked, yardPaid, handDid, t, struck: a.gate >= C.AFTER_GATES.length,
           LATE_YARD, YARD_COINS, BANK_S };
}
