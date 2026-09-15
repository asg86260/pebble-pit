// Where the crew go when two heaps are backing up at once: over both of
// them. Each new trip goes to the grain farthest from where the rest of the
// crew are headed (`firstPick` in crew/hauler.js), so the crew fan out rather than read
// one answer and set off for it as a convoy -- which is what they did when
// the pick was the fullest heap: six bodies walked two thousand pixels for
// eight grains each while the heap beside the hole climbed past its limit
// with nobody on it. The carters bench (`tools/node/carters.mjs`,
// quarry-jam) measures the same yard row by row; this is the one fact out
// of it that must stay true.

import { group, ok, state, run, openSites, P } from './helpers.mjs';
import { PILE_LIMIT } from '../src/config.js';
import { S } from '../src/state.js';
import { rand } from '../src/rng.js';

// The quarry-jam yard: nothing mines, nothing digs, the check feeds the strips
// itself. The quarry's heap starts over its limit and the rock's at half, and
// the rock's heap is fed a little faster than the quarry's; a crew of six at
// the same hands and pace the bench uses is let loose on it.
const FEED = { rock: 6, quarry: 5 };
const START = { rock: 0.5, quarry: 1 };
const within = (key) => {
  const p = state().piles.find(p => p.key === key);
  return p.from + P * 2 + rand() * (p.to - p.from - P * 4);
};
const jammedYard = () => {
  window.__seed(20250913);
  window.__reset();
  openSites();
  window.__crew(0, 6);
  window.__levels({ haulCarryLevel: 4, haulPaceLevel: 4 });
  window.__clearFloor();
  run(0.5);
  for (const key of Object.keys(START)) {
    const want = Math.round(START[key] * PILE_LIMIT[key]);
    // a frame between handfuls: the count is tallied once a frame
    for (let i = 0; i < 400 && state().pileCount[key] < want; i++) { window.__pile(within(key), 10); run(1 / 60); }
  }
  run(1);
};

// Which strip a claim is on -- the same reading `armfulsComing` takes.
const stripOf = c => {
  const x = c * P + P / 2;
  return state().piles.find(p => x + P > p.from && x < p.to)?.key;
};

group('two jammed heaps get the crew between them, not one after the other', async () => {
  jammedYard();
  const acc = { rock: 0, quarry: 0 };
  // departures: a body's claim landing on a strip it was not claiming a frame ago
  const went = { rock: 0, quarry: 0 };
  const was = new Map();
  let full = 0, frames = 0;
  for (let i = 0; i < 60 * 60; i++) {
    for (const key of Object.keys(FEED)) {
      acc[key] += FEED[key] / 60;
      while (acc[key] >= 1) { acc[key] -= 1; window.__pile(within(key), 1); }
    }
    run(1 / 60);
    frames++;
    if (state().pileFull.rock) full++;
    for (const w of S.workers) {
      if (w.type !== 'hauler') continue;
      const key = w.claim >= 0 ? stripOf(w.claim) : null;
      if (key && key !== was.get(w) && key in went) went[key]++;
      was.set(w, key);
    }
  }
  const s = state();
  window.__reset();
  return [
    ok(s.pileCount.quarry >= PILE_LIMIT.quarry * 0.75, 'the quarry heap is still backing up, so there is a choice to make',
       `${s.pileCount.quarry} of ${PILE_LIMIT.quarry}`),
    // Before, every trip went to the quarry: the crew read one fullest heap
    // and went there together. Now one or two hold the rock while the rest
    // walk to the quarry, and each heap gets a fair share of the trips.
    ok(went.rock >= 0.2 * (went.rock + went.quarry) && went.quarry >= 0.2 * (went.rock + went.quarry),
       'each heap gets a fair share of the trips', `${went.rock} to the rock, ${went.quarry} to the quarry`),
    // The rock's heap stands beside the hole. Fed six grains a second from
    // half full, it sat full 46% of the run while everybody walked to the
    // quarry; held by the one or two bodies the walk makes it worth, it never
    // reaches its limit.
    ok(full / frames < 0.05, 'the heap beside the hole is not left to fill while the crew are away',
       `full ${(100 * full / frames).toFixed(0)}% of the run`)
  ];
});
