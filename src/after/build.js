// The construction shack's work: a station bought is carried in and raised
// (the owner, 2026-10-18; docs/mocks/act3-unbuilt-2026-10-18, pile a). Until
// it is ordered its spot is open floor and nothing else. Ordered, members
// walk in from the camp's edge with its loads, planks and blocks, and set
// each down on its spot, where the pile grows a load at a time; once the
// pile is whole the first two stay on as builders and the station goes up
// AFTER_BUILD_PIECES bands from the floor up, each band two loads taken off
// the pile and laid in, fading in as the second lands, until the pile is
// gone and the station stands. The rest walk back out of the camp.
//
// The hands are members from the camp, up to AFTER_BUILD_CARRIERS of them.
// With nobody waiting there -- every member at a post -- the pair step down
// off the pedestal and carry and raise it themselves, and climb back up when
// it stands; so a camp with no free hands never leaves a bought station
// unbuilt.
//
// `S.after.raising` is each bought station's site: { n, at, claimed, brought,
// taken, laid, drop, pick } -- `n` the bands up and `at` when each landed
// (kept after it stands, so its last band finishes fading in); `claimed` the
// loads a carrier has set off with, `brought` those set down, `taken` those
// a builder has picked up again and `laid` those laid into a band; `drop` and
// `pick` when each load (by its place on the pile) was set down and taken,
// so it fades rather than pops.

import { S } from '../state.js';
import { AFTER_JOB } from '../jobs.js';
import { P, AFTER_BUILD_PIECES, AFTER_BUILD_A_BAND, AFTER_BUILD_CARRIERS, AFTER_BUILD_BUILDERS, AFTER_BUILD_DROP_S,
         AFTER_BUILD_LAY_S, AFTER_BUILD_HOLD_S } from '../config.js';
import { nextId } from './util.js';
import { built } from './levels.js';
import { campSpot, speakerAt, buildPileAt, buildLayAt } from './place.js';

// Every load a station takes: two a band.
export const BUILD_LOADS = AFTER_BUILD_PIECES * AFTER_BUILD_A_BAND;

// A station bought on the shack: its site started.
export function raiseStation(key) {
  const a = S.after;
  if (a.raising[key] || built(key)) return false;
  a.raising[key] = { n: 0, at: [], claimed: 0, brought: 0, taken: 0, laid: 0, drop: [], pick: [], whole: null };
  return true;
}
// A site as it stands, read over a blank: a save from before the carry
// stands its pile as if it had been brought whole and its bands built off it.
export function siteOf(key) {
  const r = S.after && S.after.raising[key];
  if (!r) return null;
  if (r.brought == null) {
    const used = r.n * AFTER_BUILD_A_BAND;
    Object.assign(r, { claimed: BUILD_LOADS, brought: BUILD_LOADS, taken: used, laid: used, drop: [], pick: [], whole: -1e9 });
  }
  return r;
}
const sites = () => Object.keys(S.after.raising).filter(k => !built(k));
export const pairBuilding = () => !!S.after && S.after.bodies.some(b => b.job === AFTER_JOB.BUILD && b.pair != null);
const crewOf = key => S.after.bodies.filter(b => b.job === AFTER_JOB.BUILD && b.site === key && b.state === 'work');

// Every site without hands gets them: members out of the camp, coming in at
// its edge nearest the site, or, with none waiting and the pair on the
// pedestal, the pair.
export function fillBuilders() {
  const a = S.after;
  for (const key of sites()) {
    if (crewOf(key).length || a.bodies.some(b => b.job === AFTER_JOB.BUILD && b.site === key && b.state === 'home')) continue;
    const r = siteOf(key);
    const pile = buildPileAt(key);
    if (a.camp > 0) {
      const n = Math.min(AFTER_BUILD_CARRIERS, a.camp);
      a.camp -= n;
      const at = campSpot(pile);
      for (let k = 0; k < n; k++)
        a.bodies.push({ id: nextId(), job: AFTER_JOB.BUILD, site: key, pair: null, builds: k < AFTER_BUILD_BUILDERS, x: at.x, y: at.y,
                        face: 1, state: 'work', t: 0, load: null, slot: null, target: null, n: 0, born: a.t + k * 0.6 });
    } else if (!pairBuilding()) {
      for (const k of [0, 1]) {
        const at = speakerAt(k);     // a speaker's spot is its left edge, a body's x its middle column
        a.bodies.push({ id: nextId(), job: AFTER_JOB.BUILD, site: key, pair: k, builds: true, x: at.x + P, y: at.y, face: -1,
                       state: 'work', t: 0, load: null, slot: null, target: null, n: 0 });
      }
    }
    if (r.brought >= BUILD_LOADS && r.whole == null) r.whole = a.t;
  }
}

// A band laid at `key`: true when that was the last, the station standing.
export function layPiece(key) {
  const a = S.after, r = siteOf(key);
  if (!r || built(key)) return true;
  r.n += 1; r.at.push(a.t);
  if (r.n >= AFTER_BUILD_PIECES) { a.built.push(key); return true; }
  return false;
}

// One frame of a body raising a station, `go` its walk (bodies.js). A
// carrier fetches a load at the camp's edge and sets it down on the pile;
// once every load is claimed a builder takes them off the pile two a band
// and lays them in, and the rest walk back out of the camp. The station up,
// home: a member back out of the camp, the pair back up onto the pedestal.
export function stepBuilder(w, dt, go) {
  const a = S.after;
  if (w.state === 'home') {
    const at = speakerAt(w.pair);
    if (go(w, at.x + P, at.y, dt)) w.state = 'gone';
    return;
  }
  const r = siteOf(w.site);
  if (!r || built(w.site)) {
    if (w.pair != null) { w.state = 'home'; return; }
    w.job = null; w.state = 'out'; w.site = null; w.load = null; return;
  }
  if (w.born != null && a.t < w.born) return;                  // still to come in at the edge
  const fl = campSpot().y;
  // Carrying a load to the pile.
  if (w.load === 'carry') {
    if (!go(w, buildPileAt(w.site) + (w.slot % 3) * P, fl, dt)) return;
    w.t += dt;
    if (w.t < AFTER_BUILD_DROP_S) return;
    r.brought += 1; r.drop[w.slot] = a.t; w.load = null; w.slot = null; w.t = 0;
    if (r.brought >= BUILD_LOADS && r.whole == null) r.whole = a.t;
    return;
  }
  // Laying a load into the band going up.
  if (w.load === 'lay') {
    if (!go(w, buildLayAt(w.site, w.side), fl, dt)) return;
    w.t += dt;
    if (w.t < AFTER_BUILD_LAY_S) return;
    r.laid += 1; w.load = null; w.slot = null; w.t = 0;
    if (r.laid >= (r.n + 1) * AFTER_BUILD_A_BAND) layPiece(w.site);
    return;
  }
  // Empty-handed: a load still to fetch, fetched at the camp's edge.
  if (r.claimed < BUILD_LOADS) {
    const edge = campSpot(buildPileAt(w.site));
    if (!go(w, edge.x, fl, dt)) return;
    w.load = 'carry'; w.slot = r.claimed++; w.t = 0;
    return;
  }
  if (!w.builds) { w.job = null; w.state = 'out'; w.site = null; return; }
  // A builder: the pile whole and stood a beat, a load off its top.
  const crew = S.after.bodies.filter(b => b.job === AFTER_JOB.BUILD && b.site === w.site && b.builds);
  w.side = Math.max(0, crew.indexOf(w)) % 2;
  if (r.brought < BUILD_LOADS || r.whole == null || a.t - r.whole < AFTER_BUILD_HOLD_S) { go(w, buildPileAt(w.site) - P * 2 + w.side * P * 14, fl, dt); return; }
  if (r.taken >= BUILD_LOADS) return;
  if (!go(w, buildPileAt(w.site) + P * 2, fl, dt)) return;
  w.slot = BUILD_LOADS - 1 - r.taken; r.taken += 1; r.pick[w.slot] = a.t; w.load = 'lay'; w.t = 0;
}
