// A refresh on any frame of a casino payout pays it coin for coin.
//
// reload.test.mjs catches one hand at one frame of its pay. This lands the
// refresh on every few frames of a hand, from the first bin paying to the
// last grain into the hole: each frame catches the pay somewhere else -- in
// a bin, falling, in the tray, over the yard -- and a place the save forgets
// is a frame that comes up short. Its own file because it is many hands,
// and the rest of the reload checks should not wait on them.
//
// The account is kept a coin at a time, in the purse, with nobody in the
// yard: a bin can pay in spores, and a crew banks the rock's dust into the
// same purse, so any sum with them in it is the pay plus whatever the
// carters happened to bring.

import { group, ok, state, run, runUntil, yard } from './helpers.mjs';

const purse = () => ({ dust: yard.S.stored, spore: yard.S.spores, shard: yard.S.shards, spark: yard.S.sparks });
const gained = p0 => { const p = purse(); return Object.fromEntries(Object.keys(p0).map(k => [k, p[k] - p0[k]])); };
const sameKinds = (a, b) => Object.keys(b).every(k => (a[k] || 0) === b[k]);
// anything of a hand's pay still on the building or over the yard
const payInPlay = () => !!(yard.S.drop || yard.S.paying || state().tray ||
  yard.S.tableAir.some(k => k.lands === 'tray' || k.lands === 'hole'));

// Seeded for a hand that pays in two coins.
const SEED = 2;
const STRIDE = 3;                              // frames between refreshes

group('a refresh on any frame of a payout pays it coin for coin', async () => {
  const S = yard.S;
  const frame = () => run(1 / 60);
  // a fresh hand, stood at the frame its first bin is due
  const hand = () => {
    window.__seed(SEED);
    window.__casino(true);
    window.__give(6000);
    run(1);
    window.__casinoStake(120);
    const p0 = purse();
    window.__tapSign();
    for (let f = 0; f < 60 * 40 && !(S.drop && S.drop.stage === 'pay'); f++) frame();
    return p0;
  };
  // the hand untouched: what it pays, and how many frames it is in play
  let p0 = hand(), frames = 0;
  while (payInPlay() && frames < 60 * 30) { frame(); frames++; }
  const whole = gained(p0);

  const short = [];
  for (let k = 0; k <= frames; k += STRIDE) {
    p0 = hand();
    for (let f = 0; f < k; f++) frame();
    // what has left the bins by now: the whole hand, once it has settled
    const owed = S.drop ? { ...S.drop.pays } : whole;
    window.__reload();
    runUntil(() => !payInPlay(), 30);
    const got = gained(p0);
    if (!sameKinds(got, owed)) short.push(`frame ${k}: ${JSON.stringify(owed)} owed, ${JSON.stringify(got)} landed`);
  }

  return [
    ok(frames > 60 && whole.dust > 0 && whole.spore > 0, 'the hand pays in dust and spores, over more than a second',
       `${JSON.stringify(whole)} over ${frames} frames`),
    ok(!short.length, 'and a refresh on any frame of it pays what had left the bins, coin for coin',
       `${short.length} frames short: ${short.slice(0, 3).join('; ')}`)
  ];
// Many hands, each followed across a reload of its own.
}, { seed: SEED, reload: false });
