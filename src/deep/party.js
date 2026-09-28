// The party (docs/wave-party.md): the stations on the deep's floor, the
// fighter at each, the class and the ladder a station, and the fang that pays
// for the next one. The only writer of `S.stations`; every other module reads
// through the queries at the top.
//
// A station is a record, not a body: `fighter` names the body standing at it
// by its uid (`w.uid`, every body's own, beside `w.station` on a fighter).
// Whether it is manned is decided here, at the level of counts, the way
// `rebalance` decides how many carry; which body answers is the crew's
// catch-up (`bindFighters`, called from `syncWorkers`), so a station can be
// manned (`CALLED`) on a call before a body is chosen for it.

import { S } from '../state.js';
import * as CFG from '../config.js';
import { P, WORKER, DEEP_W, DEEP_GRAV, DEEP_DRAG, LADDER,
         STATION_WORK_S, FANG_BREAKS, FANG_KICK, PARTY_SLOTS_FALLBACK } from '../config.js';
import { CLASSES, PAIRS, STARTERS, FIRST_KINDS, FIGHT_STATIONS_MAX } from '../config/classes.js';
import * as place from './place.js';
import { deepX0, deepX1, deepFloor, spotX, standOf, bellyAt, tossX, inHopper } from './place.js';
import { SPRITES } from './sprites.js';
import { start, registerRows } from '../works.js';
import { TYPE } from '../jobs.js';
import { frames } from '../clock.js';
import { rand } from '../rng.js';
import { refund } from '../pit.js';
import { shed } from './scales.js';
import { swim, working, feet, mid } from './arms.js';
import { haulSpeed } from '../levels.js';
import { rebalance } from '../staffing.js';
import { syncWorkers } from '../crew/muster.js';
import { retask } from '../crew/commute.js';

const snap = v => Math.round(v / P) * P;

// --- the queries --------------------------------------------------------------------
export const stationById = id => S.stations.find(s => s.id === id) || null;
export const stationsBuilt = () => S.stations.filter(s => s.built);
export const classOf = st => (st && st.cls && CLASSES[st.cls]) || null;
// The fighter's body, if one has been bound to the station yet.
export const fighterAt = st =>
  (st && st.fighter && S.workers.find(w => w.type === TYPE.FIGHTER && w.uid === st.fighter)) || null;
// How many stations are manned: the fighters' count, the way `S.<job>` is
// every other job's.
export const fightersOn = () => S.stations.filter(s => s.fighter).length;

// The floor's slots, left to right as the player buys them. BOARD's list and
// `slotX` when they are there. TODO(merge): read `DEEP_SLOTS` and `slotX`
// straight, and drop the fallback.
const slots = () => CFG.DEEP_SLOTS || PARTY_SLOTS_FALLBACK;
export const slotAt = i => (place.slotX ? place.slotX(i) : snap(deepX0() + slots()[i] * DEEP_W));
// A station's middle on the floor.
export const stationMid = st => slotAt(st.slot);

// The lowest floor slot with no station on it, or -1 when the floor is full.
export const nextSlot = () => {
  const taken = new Set(S.stations.map(s => s.slot));
  for (let i = 0; i < slots().length; i++) if (!taken.has(i)) return i;
  return -1;
};
// The first station is free, from the snatch; every one after it takes a
// fang, up to the most there can be.
export const canBuild = () => !!S.snatched && nextSlot() >= 0 &&
  (S.stations.length === 0 || (S.fangs > 0 && S.stations.length < FIGHT_STATIONS_MAX));
// The kinds the button may offer: the three whose classes are the starters
// for the free first station, every kind after it.
export const kindsOffered = () => (S.stations.length === 0 ? FIRST_KINDS : Object.keys(PAIRS));
// A kind's classes the player may pick: the starters only, until a second station stands.
export const classesOpen = kind => (S.stationsBuilt >= 2 ? PAIRS[kind] || []
  : (PAIRS[kind] || []).filter(k => STARTERS.includes(k)));

// --- building one -------------------------------------------------------------------
// Ids are never reused, and a station is never taken down (a reset blanks
// its class and keeps it standing), so the ids there can ever be are
// s1..sMAX, and each has its work's row from the start: a work read back
// from a save finds its row (`rowFor`) before anything has been bought.
const idOf = n => `s${n}`;
const newId = () => idOf(S.stations.reduce((m, s) => Math.max(m, +s.id.slice(1) || 0), 0) + 1);

// The ground a station stands on: BOARD's `standOfStation` when it is there,
// and until then the kind's drawing moved to its slot (the armory wears the
// font's). TODO(merge): `place.standOfStation` only.
const spriteKey = kind => (SPRITES[kind] ? kind : kind === 'armory' ? 'font' : 'altar');
export function stationBox(st) {
  if (!st) return null;
  if (place.standOfStation) return place.standOfStation(st);
  const k = spriteKey(st.kind), b = standOf(k);
  return { ...b, x: b.x + stationMid(st) - spotX(k) };
}

const stationRow = id => ({
  key: `station-${id}`, kind: 'building', site: 'deep',
  get name() { const st = stationById(id); return st ? `raise the ${st.kind}` : 'raise a station'; },
  work: () => STATION_WORK_S,
  box: () => stationBox(stationById(id)),
  buy: () => stationLanded(id)
});
const ROWS = Array.from({ length: FIGHT_STATIONS_MAX }, (_, i) => stationRow(idOf(i + 1)));
registerRows(ROWS);

// The floating button's pick: a fang spent (the first station is free), the
// station written down unbuilt at the next free slot, and its work queued
// there for a delver to put up. Nothing stands until the work lands.
export function buildStation(kind) {
  if (!canBuild() || !kindsOffered().includes(kind)) return false;
  const slot = nextSlot();
  const id = newId();
  const row = ROWS.find(r => r.key === `station-${id}`);
  if (!row) return false;
  if (S.stations.length > 0) S.fangs--;
  S.stations = [...S.stations, { id, kind, slot, built: false, cls: null, rung: 0, paid: [], fighter: null }];
  start('deep', row, slotAt(slot));
  S.shopStale = true;
  return true;
}

// The work's land hook: it stands, and a spare hand swims over to it.
export function stationLanded(id) {
  const st = stationById(id);
  if (!st || st.built) return;
  st.built = true;
  S.stationsBuilt = (S.stationsBuilt || 0) + 1;
  seat();
  S.shopStale = true;
}

// --- who stands at one ------------------------------------------------------------
// A station manned before a body has been chosen for it: `rebalance` decides
// how many stand, and `syncWorkers` which ones, on the same call.
export const CALLED = 'called';

// Man up to `free` built stations with no fighter, oldest first; the count
// level of `seat`, asked by `rebalance` with the deep's spare hands less the
// ones its builds need. Answers how many it manned.
export function seatUpTo(free) {
  let n = 0;
  for (const st of S.stations) {
    if (n >= free) break;
    if (!st.built || st.fighter) continue;
    st.fighter = CALLED;
    n++;
  }
  return n;
}

// A spare pod resident to each built station with no fighter, oldest first;
// a station with nobody spare stands empty until one is free. The counts are
// `rebalance`'s and the walk `syncWorkers`'s.
export function seat() {
  rebalance();
  syncWorkers();
}

// A build down there with nobody spare to put it up borrows a fighter, the
// one standing nearest the work (`rebalance`): its station stands empty,
// and when the build lands `seat` mans it again, oldest station first.
export function unseatNearest(xs) {
  let best = null, dist = Infinity;
  for (const st of S.stations) {
    if (!st.fighter) continue;
    const w = fighterAt(st);
    const x = w ? mid(w) : stationMid(st);
    const d = xs.length ? Math.min(...xs.map(sx => Math.abs(x - sx))) : 0;
    if (d < dist) { dist = d; best = st; }
  }
  if (best) best.fighter = null;
  return !!best;
}

// Whether a fighter body is the one its station names.
const bound = w => { const st = stationById(w.station); return !!st && !!w.uid && st.fighter === w.uid; };
export const unbound = w => w.type === TYPE.FIGHTER && !bound(w);
// A manned station nobody answers to yet: just manned, or a save whose
// fighter is not among the bodies.
const waiting = st => !!st.fighter && !fighterAt(st);
const take = (st, w) => { st.fighter = w.uid; w.station = st.id; };

// The crew's catch-up, before it counts heads: every manned station with no
// body answering to it takes the unbound fighter nearest it, so a body that
// is a fighter already keeps the place it stands at. What is left unbound
// is stood down.
export function bindFighters() {
  const loose = S.workers.filter(unbound);
  for (const st of S.stations) {
    if (!waiting(st)) continue;
    let best = -1, dist = Infinity;
    loose.forEach((w, i) => { const d = Math.abs(mid(w) - stationMid(st)); if (d < dist) { dist = d; best = i; } });
    if (best < 0) break;
    take(st, loose.splice(best, 1)[0]);
  }
}

// A body about to become a fighter (stood down elsewhere, or made from
// nothing) is given the first manned station with nobody answering to it,
// before it is sent there: where it walks is read off `w.station`.
export function bindNew(w) {
  const st = S.stations.find(waiting);
  if (!st || !w.uid) return false;
  take(st, w);
  return true;
}

// The roster post's +/-: one fighter a station, moved between stations,
// never made or unmade. `-` sends this station's fighter to the oldest
// built station standing empty; `+` fetches the fighter of the newest other
// station that has one. Either swims.
export const canMoveOut = id => {
  const st = stationById(id);
  return !!st && !!st.fighter && S.stations.some(o => o !== st && o.built && !o.fighter);
};
export const canMoveIn = id => {
  const st = stationById(id);
  return !!st && st.built && !st.fighter && S.stations.some(o => o !== st && o.fighter);
};
export function moveFighter(id, dir) {
  const st = stationById(id);
  if (!st) return false;
  let from, to;
  if (dir < 0) {
    if (!canMoveOut(id)) return false;
    from = st;
    to = S.stations.find(o => o !== st && o.built && !o.fighter);
  } else {
    if (!canMoveIn(id)) return false;
    to = st;
    from = [...S.stations].reverse().find(o => o !== st && o.fighter);
  }
  const w = fighterAt(from);
  to.fighter = from.fighter;
  from.fighter = null;
  if (w) {
    w.station = to.id;
    // The same job at another place: sent there the way any body is.
    retask(w, TYPE.FIGHTER);
  }
  S.shopStale = true;
  return true;
}

// --- its ladder ---------------------------------------------------------------------
// A rung bought on the station's rails: the first commits the class, and the
// bill the rails took is kept on the station, summed a coin, so a Reset hands
// back exactly what was paid here and nothing of another station's.
export function buyRung(id, cls, bill = []) {
  const st = stationById(id);
  if (!st || !st.built || st.rung >= LADDER) return false;
  if (st.cls && st.cls !== cls) return false;
  if (!classesOpen(st.kind).includes(cls)) return false;
  st.cls = cls;
  st.rung++;
  const paid = st.paid.map(([m, n]) => [m, n]);
  for (const [money, n] of bill) {
    if (!(n > 0) || money === 'time') continue;
    const row = paid.find(([m]) => m === money);
    if (row) row[1] += n; else paid.push([money, n]);
  }
  st.paid = paid;
  S.shopStale = true;
  return true;
}

// Reset: every bill paid at this station handed back, the rung to nought and
// the class blank. The fighter stays, a base fighter standing guard until a
// class is bought again. Scales go back into the water they came out of.
export function resetStation(id) {
  const st = stationById(id);
  if (!st) return false;
  const x = stationMid(st), y = deepFloor() - P * 8;
  for (const [money, n] of st.paid) {
    if (money === 'scale') shed(x, y, n);
    else refund(money, n, x, y);
  }
  st.paid = [];
  st.rung = 0;
  st.cls = null;
  S.shopStale = true;
  return true;
}

// --- the fang -----------------------------------------------------------------------
// The serpent drops one at each of its first FANG_BREAKS phase breaks. It
// sinks like a scale and lies on the floor until a gatherer carries it to the
// crusher, where it is counted (`S.fangs`). `fangsDropped` is how many breaks
// have dropped theirs, saved, so a reload drops none twice.
//
// A fang is `{ x, y, vx, vy, rest, by, held }`: (x, y) its foot, `by` the
// name of the gatherer who has claimed it and `held` whether it is in that
// one's arms. The claim is saved with the fang rather than on the body, so a
// reload finds the same hand carrying it.
//
// TODO(merge): FIGHT's phase-break export, when there is one. Until then the
// break is read as the stage rising, asked here once a frame.
function dropFangs(t) {
  const due = Math.min(FANG_BREAKS, S.serpentStage | 0);
  if (S.fangsDropped >= due) return;
  const add = [];
  while (S.fangsDropped < due) {
    S.fangsDropped++;
    const at = bellyAt(t);
    add.push({ x: at.x, y: at.y, vx: (rand() * 2 - 1) * FANG_KICK, vy: 0, rest: false, by: null, held: false });
  }
  S.fangsLoose = [...S.fangsLoose, ...add];
}

// Counted: the coin is the crusher's to hold, as a scale is.
function crushFang(f) {
  S.fangsLoose = S.fangsLoose.filter(g => g !== f);
  S.fangs = (S.fangs || 0) + 1;
  S.seenFang = true;
  S.shopStale = true;
}

function sinkFangs() {
  const f = frames();
  const lo = deepX0() + P, hi = deepX1() - P;
  const hands = new Set(S.workers.filter(w => w.type === TYPE.GATHER).map(w => w.name));
  for (const g of [...S.fangsLoose]) {
    // A claim nobody answers any more -- the hand stood down, or put on a
    // station -- is let go where it is, and a fang let go sinks again.
    if (g.by && !hands.has(g.by)) { g.by = null; if (g.held) { g.held = false; g.rest = false; } }
    if (g.held || g.rest) continue;
    g.vx *= Math.pow(DEEP_DRAG, f);
    g.vy = g.vy * Math.pow(DEEP_DRAG, f) + DEEP_GRAV * f;
    g.x = Math.max(lo, Math.min(hi, g.x + g.vx * f));
    g.y += g.vy * f;
    // Anything that falls into the hopper is crushed, whoever let it go.
    if (inHopper(g.x, g.y)) { crushFang(g); continue; }
    if (g.y >= deepFloor()) { g.y = deepFloor(); g.vx = g.vy = 0; g.rest = true; }
  }
}

export function stepParty(c) {
  if (!S.snatched) return;
  dropFangs(c.now);
  sinkFangs();
}

// A gatherer's frame, before its scales: a fang lying on the floor is
// fetched first, by the one who claimed it, and carried to the crusher. True
// while this body is busy with one. A gatherer already carrying scales takes
// them in first.
export function carryFang(w) {
  if (!working(w)) return false;
  let g = S.fangsLoose.find(f => f.by === w.name);
  if (!g) {
    if ((w.carry || 0) > 0) return false;
    g = S.fangsLoose.find(f => f.rest && !f.by);
    if (!g) return false;
    g.by = w.name;
  }
  const pace = haulSpeed();
  if (!g.held) {
    if (!swim(w, g.x - WORKER / 2, feet(), pace)) { w.goal = 'fang'; return true; }
    g.held = true;
    g.rest = false;
  }
  w.goal = 'fang';
  const there = swim(w, tossX() - WORKER / 2, feet(), pace);
  // In its arms, a cell over its head.
  g.x = mid(w);
  g.y = w.y;
  if (!there) return true;
  crushFang(g);
  w.goal = 'seek';
  return true;
}
