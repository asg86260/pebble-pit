// The construction shack's work: a station bought is carried in and raised
// (the owner, 2026-10-18; docs/mocks/act3-unbuilt-2026-10-18, pile a). Until
// it is ordered its spot is open floor and nothing else. Ordered, members
// come in at the camp's edge, fetch its loads, planks and blocks, from the
// shack's door or that edge, whichever is nearer, and set each down on its
// spot, where the pile grows a load at a time; once the pile is whole the
// first two stay on as builders and the station goes up AFTER_BUILD_PIECES
// bands from the floor up, each band two loads taken off the pile and laid in, fading in as the second lands, until the pile is
// gone and the station stands. The rest walk back out of the camp.
//
// The hands are idle members, up to AFTER_BUILD_CARRIERS of them: those at
// the podium first, then those waiting in the crowd. With nobody idle --
// every member on a station's roster -- members step off their jobs to raise
// it, and go back to the podium when it stands, where their rosters take
// them again; so a camp with no free hands never leaves a bought station
// unbuilt. The pair never come down to build: they are the
// act's leads and stay up on the pedestal, speaking (the owner, 2026-10-20:
// "the Couple still arent rendered on the pedestal").
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
import { AFTER_SITE_LOAD } from '../config.js';
import { isEmpty, push, pop, clear } from '../cells.js';
import { nextId } from './util.js';
import { built } from './levels.js';
import { campSpot, speakerAt, stationDoor, buildPileAt, buildLayAt } from './place.js';

// A member with no job: at the podium, or walking there (bodies.js). A pair's
// builder, `pair` 0 or 1, is only ever one read from a save made while they
// still built, and is never idle.
// One out on an errand with its hands full (bodies.js) is not idle until it
// has put them down: put on a job then, what it carries would go with it.
export const isIdle = w => w.job == null && w.state === 'work' && w.pair == null && !(w.errand && !isEmpty(w));
// Nothing in the arms and nothing under way with them: a load carried, laid
// or a heap being tipped. A body may be taken off its job only like this.
export const handsFree = w => isEmpty(w) && !w.tipping && !w.phase;

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

// Every site without hands gets them: idle members off the podium, the
// nearest first, then members out of the crowd, coming in at the camp's edge
// nearest the site, or, with none idle, members off their jobs.
// A member is taken off its job empty-handed, the nearest the site first, so
// no load in hand is dropped (a tree or a log it was making for is only let
// go); with nobody idle or on a job the site waits for the first member to
// walk in. The job stays wanted on its roster, and takes the builder back
// when the station stands.
// (A pair's builder, `pair` 0 or 1, is only ever one read from a save made
// while they still built: it finishes and climbs back up.)
function offPosts(key, n) {
  const pile = buildPileAt(key);
  const free = S.after.bodies.filter(b => b.job && b.job !== AFTER_JOB.BUILD && b.state === 'work' && handsFree(b))
    .sort((p, q) => Math.abs(p.x - pile) - Math.abs(q.x - pile));
  return free.slice(0, n);
}
export function fillBuilders() {
  const a = S.after;
  for (const key of sites()) {
    const crew = crewOf(key);
    if (a.bodies.some(b => b.job === AFTER_JOB.BUILD && b.site === key && b.state === 'home')) continue;
    const r = siteOf(key);
    const pile = buildPileAt(key);
    // A site started with the camp still walking in is begun by whoever
    // reached it first; the rest, arriving after, join it while loads are
    // still to carry rather than leaving that one body to haul them all.
    const free = a.bodies.filter(isIdle).sort((p, q) => Math.abs(p.x - pile) - Math.abs(q.x - pile));
    if (crew.length && (r.claimed >= BUILD_LOADS || crew.length >= AFTER_BUILD_CARRIERS || (a.camp <= 0 && !free.length))) continue;
    if (free.length || a.camp > 0) {
      let builders = crew.filter(b => b.builds).length, n = AFTER_BUILD_CARRIERS - crew.length;
      for (const w of free.slice(0, n)) {
        Object.assign(w, { job: AFTER_JOB.BUILD, site: key, pair: null, builds: builders++ < AFTER_BUILD_BUILDERS, at: null, to: null,
                           swing: null, on: true, t: 0, load: [], carry: 0, phase: null, slot: null, target: null, n: 0 });
        n--;
      }
      n = Math.min(n, a.camp);
      a.camp -= n;
      const at = campSpot(pile);
      for (let k = 0; k < n; k++)
        a.bodies.push({ id: nextId(), job: AFTER_JOB.BUILD, site: key, pair: null, builds: builders + k < AFTER_BUILD_BUILDERS, x: at.x, y: at.y,
                        face: 1, state: 'work', t: 0, load: [], carry: 0, phase: null, slot: null, target: null, n: 0, born: a.t + k * 0.6 });
    } else if (!crew.length) {
      for (const w of offPosts(key, AFTER_BUILD_BUILDERS))
        Object.assign(w, { job: AFTER_JOB.BUILD, site: key, pair: null, builds: true, at: null, to: null, swing: null,
                           t: 0, load: [], carry: 0, phase: null, slot: null, target: null, n: 0 });
    }
    if (r.brought >= BUILD_LOADS && r.whole == null) r.whole = a.t;
  }
}

// Where a site's loads are made: the construction shack's door, the one
// named source of every load (DESIGN.md, "One resource system for every act",
// section 4), however far the site stands from it. The unit is made as a
// member's hands close on it (`AFTER_SITE_LOAD`) and unmade when a band is laid.
const fetchAt = () => stationDoor('shack');
// A band laid at `key`: true when that was the last, the station standing.
export function layPiece(key) {
  const a = S.after, r = siteOf(key);
  if (!r || built(key)) return true;
  r.n += 1; r.at.push(a.t);
  if (r.n >= AFTER_BUILD_PIECES) { a.built.push(key); return true; }
  return false;
}

// One frame of a body raising a station, `go` its walk (bodies.js). A
// carrier fetches a load at the shack's door and sets it down on the pile;
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
    w.job = null; w.on = false; w.site = null; clear(w); w.phase = null; return;
  }
  if (w.born != null && a.t < w.born) return;                  // still to come in at the edge
  const fl = campSpot().y;
  // Carrying a load to the pile.
  if (w.phase === 'carry') {
    if (!go(w, buildPileAt(w.site) + (w.slot % 3) * P, fl, dt)) return;
    w.t += dt;
    if (w.t < AFTER_BUILD_DROP_S) return;
    pop(w); r.brought += 1; r.drop[w.slot] = a.t; w.phase = null; w.slot = null; w.t = 0;
    if (r.brought >= BUILD_LOADS && r.whole == null) r.whole = a.t;
    return;
  }
  // Laying a load into the band going up.
  if (w.phase === 'lay') {
    if (!go(w, buildLayAt(w.site, w.side), fl, dt)) return;
    w.t += dt;
    if (w.t < AFTER_BUILD_LAY_S) return;
    pop(w); r.laid += 1; w.phase = null; w.slot = null; w.t = 0;
    if (r.laid >= (r.n + 1) * AFTER_BUILD_A_BAND) layPiece(w.site);
    return;
  }
  // Empty-handed: a load still to fetch, fetched where it is nearest the
  // site -- the shack's door, or the camp's edge it comes in at.
  if (r.claimed < BUILD_LOADS) {
    if (!go(w, fetchAt(), fl, dt)) return;
    push(w, AFTER_SITE_LOAD); w.phase = 'carry'; w.slot = r.claimed++; w.t = 0;
    return;
  }
  if (!w.builds) { w.job = null; w.on = false; w.site = null; return; }
  // A builder: the pile whole and stood a beat, a load off its top.
  const crew = S.after.bodies.filter(b => b.job === AFTER_JOB.BUILD && b.site === w.site && b.builds);
  w.side = Math.max(0, crew.indexOf(w)) % 2;
  if (r.brought < BUILD_LOADS || r.whole == null || a.t - r.whole < AFTER_BUILD_HOLD_S) { go(w, buildPileAt(w.site) - P * 2 + w.side * P * 14, fl, dt); return; }
  if (r.taken >= BUILD_LOADS) return;
  if (!go(w, buildPileAt(w.site) + P * 2, fl, dt)) return;
  w.slot = BUILD_LOADS - 1 - r.taken; r.taken += 1; r.pick[w.slot] = a.t; push(w, AFTER_SITE_LOAD); w.phase = 'lay'; w.t = 0;
}

// --- orders: a bill paid in timber, carried (DESIGN.md, "Act 3's goods are
// blocks, and bodies carry every one", settled 2026-10-27) -----------------------
// A row whose bill names timber does not lift its blocks off the mound when
// it is bought: it is an order, and idle members carry its blocks there a
// load at a time (bodies.js, the orderer's errand), its effect landing when
// the last is set down, as a station's raising lands when its last band is
// laid. Its blocks stay on the mound until a body takes them up, spoken for:
// `reserved` is read off the orders, never kept beside them, so the purse
// (words.js) and the mound can never drift apart.
//
// `S.after.orders` is each order: { id, key, card, n, claimed, brought } --
// the row it lands, the station it is carried to, its blocks, those a body
// has taken up off the mound and those set down at the station.
export const orders = () => (S.after ? S.after.orders : []);
// A row bought with `n` timber blocks on its bill, to be carried to `card`.
export function placeOrder(key, card, n) {
  S.after.orders.push({ id: nextId(), key, card, n, claimed: 0, brought: 0 });
}
// How many of a row's orders are still being carried.
export const orderedOf = key => orders().filter(o => o.key === key).length;
// Blocks on the mound spoken for and not yet taken up.
export const timberReserved = () => orders().reduce((s, o) => s + Math.max(0, o.n - o.claimed), 0);
// The oldest order with a block still to take up, or null.
export const nextOrder = () => orders().find(o => o.claimed < o.n) || null;
export const orderOf = id => orders().find(o => o.id === id) || null;
// Where an order is set down: its station's door, the grove's at the
// forestry shack, whose board sells it.
export const orderAt = o => stationDoor(o.card === 'grove' ? 'forestry' : o.card);
// What lands a row when its order is in: the cards register it (rows.js), so
// the sim never imports the cards that sell it.
let landRow = null;   // the cards' landing, set once at load by rows.js
export const onOrderLanded = fn => { landRow = fn; };
// A block of order `o` set down at its station: the last lands the row.
export function orderBrought(o) {
  o.brought += 1;
  if (o.brought < o.n) return;
  S.after.orders = orders().filter(q => q !== o);
  landRow?.(o.key);
}
