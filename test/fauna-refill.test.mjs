// The deep stays populated through the serpent's meals (the owner,
// 2026-10-15: "it looks like we are at a deficit for abyss creatures now.
// theres only one i see and all of them are getting eaten"). Every meal
// takes a slot's swimmer; as the haul begins the slot's next kind swims in
// from just off the side of the glass (FAUNA_REFILL), never fading in (the
// owner, 2026-10-16: "they should just swim in off the side of the screen"),
// rather than from beyond an end of the deep, which at the deep's paces took
// longer than a window. So over minutes of meals the deep holds its turns, a
// slot short only while a meal has its creature, and the same after a refresh.
//
// A swimmer counts as present while any part of it is over the deep (one out
// past an end on its lap's wrap is the turns' own). A newcomer's near edge
// starts FAUNA_REFILL.off cells off the glass, inside the deep's extent
// wherever the camera stands short of an end, so it counts from its first
// step: present means at most a cell or two from being seen.
//
// `reload: false` because the group makes its own refresh at a chosen point,
// the way serpent-reload.test.mjs does: a real refresh starts the page's
// clock again near nought.

import { group, ok, yard } from './helpers.mjs';
import { FAUNA_TURNS, FAUNA_REFILL, P } from '../src/config.js';
import { SLOTS, COLS, wanderAt, visitAt, reachOf, faunaAt, spanOf } from '../src/deep/fauna.js';
import { mouthAt } from '../src/deep/meals.js';
import { deepX0 } from '../src/deep/place.js';
import { drawDeepFauna } from '../src/render/fauna.js';
import { paintOn } from '../src/render/ctx.js';
import { now } from '../src/clock.js';

const S = yard.S;
const frame = () => yard.fast(1 / 60);
const refresh = () => window.__cold({ clock: 1000 });

// The swimmers with any part over the deep, not in the serpent's keeping.
function swimming() {
  const t = now() / 1000;
  return SLOTS.filter(c => { const w = wanderAt(c, t); return !w.gone && w.x > -reachOf(visitAt(c, t)) && w.x < COLS; }).length;
}

// The lowest opacity anything of the deep's creatures is drawn at: a sheet
// that answers every call and notes `globalAlpha` at each fill and image,
// and how many there were.
let drawn = 0;
function lowestAlpha() {
  let alpha = 1, low = 1;
  const note = () => { drawn++; low = Math.min(low, alpha); };
  const g = new Proxy({}, {
    get: (o, k) => (k === 'globalAlpha' ? alpha : k === 'fillRect' || k === 'drawImage' ? note
      : k in o ? o[k] : () => ({})),
    set: (o, k, v) => { if (k === 'globalAlpha') alpha = v; else o[k] = v; return true; },
  });
  paintOn({ getContext: () => g, width: S.W, height: S.H }, drawDeepFauna);
  return low;
}

group('through minutes of meals the deep keeps its turns, a slot short only while a meal holds one, across a refresh', async () => {
  window.__fullSites();
  window.__snatch({ played: true });
  // the last phase's window, the shortest: the most meals a minute
  window.__serpent({ stage: 3, wound: 0 });
  window.__view('deep');
  const N = FAUNA_TURNS.slots, secs = 360, m0 = S.meal;
  let short = 0, run = 0, longest = 0, total = 0, lowest = N, alpha = 1;
  const arrivals = [], held = SLOTS.map(() => false);
  for (let s = 1; s <= secs; s++) {
    for (let f = 0; f < 60; f++) {
      frame();
      // a slot let go this frame: where its newcomer is, against the glass
      const t = now() / 1000;
      SLOTS.forEach((c, k) => {
        const gone = wanderAt(c, t).gone;
        if (held[k] && !gone) {
          const l = (S.camX - deepX0()) / P, r = (S.camX + S.viewW - deepX0()) / P, tip = (mouthAt(now()).tip.x - deepX0()) / P;
          const kind = visitAt(c, t).kind, p = faunaAt(c, t);
          arrivals.push({ k, t, l, r, tip, kind, span: spanOf(kind, p.dir), x: p.x });
        }
        held[k] = gone;
      });
    }
    if (s === secs / 2) { refresh(); held.fill(false); }
    alpha = Math.min(alpha, lowestAlpha());
    const n = swimming();
    total += n;
    lowest = Math.min(lowest, n);
    // one out past an end on its lap's wrap is the turns' own; two short is
    // the deficit
    if (n < N - 1) short++;
    // and a slot held by a meal, how long it stays empty
    const t = now() / 1000;
    run = SLOTS.some(c => wanderAt(c, t).gone) ? run + 1 : 0;
    longest = Math.max(longest, run);
  }
  // each newcomer first stands wholly off the glass on the side away from the
  // mouth, then swims in: its next moments each nearer the middle
  const bad = arrivals.filter(a => {
    const left = a.tip > (a.l + a.r) / 2;
    const outside = left ? a.x + a.span.r <= a.l + 0.5 : a.x + a.span.l >= a.r - 0.5;
    const path = [0.25, 0.5, 1, 1.5].map(d => faunaAt(SLOTS[a.k], a.t + d).x);
    const inward = [a.x, ...path].every((x, i, xs) => i === 0 || (left ? x > xs[i - 1] : x < xs[i - 1]));
    return !outside || !inward;
  });
  const meals = S.meal - m0, mean = total / secs;
  return [
    ok(meals >= 10, 'the serpent eats through the run', `${meals} meals in ${secs}s`),
    ok(short <= secs * 0.05, `the deep is seldom down to fewer than ${N - 1} swimmers`, `${short}s of ${secs} below, lowest ${lowest}`),
    ok(mean >= N - 0.5, `and holds ${N} most of the time`, `mean ${mean.toFixed(2)} of ${N}`),
    ok(longest <= FAUNA_REFILL.emptyS, `an eaten swimmer's slot is filled again within ${FAUNA_REFILL.emptyS}s`, `longest ${longest}s empty`),
    ok(drawn > 0 && alpha === 1, 'no creature is ever drawn faded', `lowest opacity ${alpha} over ${drawn} draws`),
    ok(arrivals.length >= meals - 1 && !bad.length, 'every newcomer comes in from wholly off the glass, away from the mouth, and swims in',
       `${arrivals.length} arrivals; off: ${bad.map(a => `${a.kind} x ${a.x.toFixed(1)} glass ${a.l.toFixed(0)}..${a.r.toFixed(0)} mouth ${a.tip.toFixed(0)}`).join('; ')}`),
  ];
}, { reload: false });
