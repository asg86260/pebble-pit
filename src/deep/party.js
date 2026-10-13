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

import { msg } from '../lang.js';
import { S } from '../state.js';
import { LEVELUP_S, LEVELUP_BURST_S, LEVELUP_RISE, LEVELUP_RISE_STEP } from '../config.js';
import { P, WORKER, DEEP_GRAV, DEEP_DRAG, LADDER, DEEP_SLOTS, PARTY_IDS,
         STATION_WORK_S, FANG_BREAKS, FANG_KICK, SERPENT_PHASES, FIGHT_STATIONS_MAX } from '../config.js';
import { CLASSES, RECRUIT, PAIRS, FIRST_KINDS, NEEDS_COMPANY, FORK_RUNG } from '../config/classes.js';
import { deepX0, deepX1, deepFloor, slotX, bellyAt, tossX, inHopper } from './place.js';
import { start, registerRows, worksAt } from '../works.js';
import { TYPE } from '../jobs.js';
import { frames, now } from '../clock.js';
import { onBreak, onRise, onRecoil } from './serpent.js';
import { rand } from '../rng.js';
import { refund } from '../pit.js';
import { refundScales } from './scales.js';
import { swim, working, feet, mid } from './arms.js';
import { haulSpeed } from '../levels.js';
import { rebalance } from '../staffing.js';
import { syncWorkers } from '../crew/muster.js';

// --- the queries --------------------------------------------------------------------
export const stationById = id => S.stations.find(s => s.id === id) || null;
export const stationsBuilt = () => S.stations.filter(s => s.built);
// The class a station fights as: the one taken at the fork, or below it the
// base unit's, which is its pair's first (DESIGN.md, "A fighter branches at
// rung 4"); before rung 1 has picked a kind, the Recruit (DESIGN.md, "Built
// first, a recruit, then two choices").
export const keyOf = st => (st ? st.cls || (st.kind ? PAIRS[st.kind]?.[0] : 'recruit') : null) || null;
export const classOf = st => { const k = keyOf(st); return k === 'recruit' ? RECRUIT : CLASSES[k] || null; };
// A station standing with its Recruit, its first choice still to make.
export const unchosen = st => !!st && st.built && !st.kind;
// The fighter's body, if one has been bound to the station yet.
// Whether a station's level-up is still playing: its Buy waits for it.
export const levelingUp = st => !!st && st.lvlAt != null && now() - st.lvlAt < (LEVELUP_S + LEVELUP_BURST_S) * 1000 && now() >= st.lvlAt;
// How many cells the fighter stands raised by its level-up: up a held step at
// a time, held, and down again to land as it ends. Drawing reads it; where
// the body is in the yard does not change.
export function riseOf(st) {
  if (!levelingUp(st)) return 0;
  const a = (now() - st.lvlAt) / 1000, left = LEVELUP_S + LEVELUP_BURST_S - a;
  return Math.min(LEVELUP_RISE, Math.floor(a / LEVELUP_RISE_STEP), Math.floor(left / LEVELUP_RISE_STEP));
}
export const fighterAt = st =>
  (st && st.fighter && S.workers.find(w => w.type === TYPE.FIGHTER && w.uid === st.fighter)) || null;
// How many stations are manned: the fighters' count, the way `S.<job>` is
// every other job's.
export const fightersOn = () => S.stations.filter(s => s.fighter).length;

// A station's middle on the floor: its slot's.
export const stationMid = st => slotX(st.slot);

// The lowest floor slot with no station on it, or -1 when the floor is full.
export const nextSlot = () => {
  const taken = new Set(S.stations.map(s => s.slot));
  for (let i = 0; i < DEEP_SLOTS.length; i++) if (!taken.has(i)) return i;
  return -1;
};
// The first station is free, from the snatch; every one after it takes a
// fang, up to the most there can be.
export const canBuild = () => !!S.snatched && nextSlot() >= 0 &&
  (S.stations.length === 0 || (S.fangs > 0 && S.stations.length < FIGHT_STATIONS_MAX));
// The kinds a Recruit may become at rung 1: until a station has a kind, one
// of the three whose base unit fights alone; every kind after it.
export const kindsOffered = () => (S.stations.some(st => st.kind) ? Object.keys(PAIRS) : FIRST_KINDS);
// The classes a kind's fork offers: both, but a class that needs company
// waits for a second station.
export const classesOpen = kind => (PAIRS[kind] || [])
  .filter(k => (S.stationsBuilt || 0) >= 2 || !NEEDS_COMPANY.includes(k));

// --- building one -------------------------------------------------------------------
// Ids are never reused, and a station is never taken down (a reset blanks
// its class and keeps it standing), so the ids there can ever be are
// `PARTY_IDS`, minted in order; each is its own row in the station table
// (stations.js) -- a board, a roster post, a site -- and its build is worked
// at that site, so its work finds its row (`rowFor`) out of a save before
// anything has been bought.
const newId = () => PARTY_IDS.find(id => !stationById(id)) || null;

const stationRow = id => ({
  key: `station-${id}`, kind: 'building', site: id,
  name: msg('row-raise-station'),
  work: () => STATION_WORK_S,
  // Paid for in a fang, or nothing for the first, spent on the press; the
  // work itself asks no coin, which the bar over it and its tint read.
  bill: () => [],
  buy: () => stationLanded(id)
});
const ROWS = PARTY_IDS.map(stationRow);
registerRows(ROWS);

// The floating button's press: a fang spent (the first station is free) and
// the station's build queued at the next free slot at once, for a delver to
// put up. Nothing is chosen until it stands: its Recruit fights there, and
// rung 1 on its board picks the base unit.
export function layStation() {
  if (!canBuild()) return null;
  const slot = nextSlot(), id = newId(), row = ROWS.find(r => r.key === `station-${id}`);
  if (!id || !row) return null;
  if (S.stations.length > 0) S.fangs--;
  S.stations = [...S.stations, { id, kind: null, slot, built: false, cls: null, rung: 0, paid: [], fighter: null }];
  start(id, row, slotX(slot));
  S.shopStale = true;
  return id;
}
// The first station, standing from the snatch (snatch.js, `giveBack`): free,
// and hers from the moment she is down, so she fights from then on whether
// or not anybody has come down to watch, and the first trip down finds her
// at it (DESIGN.md, "The first trip down"). Built as it is laid: nobody is
// down there to see a scaffold, and she is the only one who could put it
// up. A Recruit, its first choice still to make on its board. Its id, or
// null where a station already stands.
export function standFirst() {
  if (S.stations.length || !S.snatched) return null;
  const slot = nextSlot(), id = newId();
  if (!id || slot < 0) return null;
  S.stations = [{ id, kind: null, slot, built: true, cls: null, rung: 0, paid: [], fighter: null }];
  S.stationsBuilt = Math.max(1, S.stationsBuilt || 0);
  S.shopStale = true;
  return id;
}
// The scenes' way to put a station up as the player would.
export const buildStation = () => !!layStation();
// A station of `kind` put up without its rung 1 bought: the setup hook's way
// (`__party`) to stand any base unit at rung 0, as an older save may.
export function raiseStation(kind) {
  if (!PAIRS[kind]) return false;
  const id = layStation();
  if (!id) return false;
  stationById(id).kind = kind;
  return true;
}
// A lot laid by an older build and never picked has no work to put it up:
// its fang is spent, so it is queued now and lands as a Recruit.
export function raiseLots() {
  for (const st of S.stations) {
    const row = ROWS.find(r => r.key === `station-${st.id}`);
    if (!st.built && !st.kind && row && !worksAt(st.id).length) start(st.id, row, slotX(st.slot));
  }
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

// --- its ladder ---------------------------------------------------------------------
// A rung bought on the station's board. A Recruit's rung 1 takes `cls` as
// the kind it becomes, one `kindsOffered` offers; below the fork a rung is
// the base unit's and names no class; the fork's rung takes `cls`, one the
// kind offers and has open; above it `cls` is the class taken, or left out. The
// bill the board took is kept on the station, summed a coin, so a Reset hands
// back exactly what was paid here and nothing of another station's.
export function buyRung(id, cls, bill = []) {
  const st = stationById(id);
  if (!st || !st.built || st.rung >= LADDER) return false;
  const next = st.rung + 1;
  if (!st.kind) {
    // the Recruit's rung: `cls` is the kind it becomes
    if (!kindsOffered().includes(cls)) return false;
    st.kind = cls;
    cls = null;
  } else if (next === FORK_RUNG) {
    if (!classesOpen(st.kind).includes(cls)) return false;
    st.cls = cls;
  } else if (next > FORK_RUNG && cls && cls !== st.cls) return false;
  st.rung = next;
  st.lvlAt = now();               // the level-up's blaze, and the wait before the next rung
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
// the kind and the class blank. The fighter stays, a Recruit again. Scales go
// back into the crusher.
export function resetStation(id) {
  const st = stationById(id);
  if (!st) return false;
  const x = stationMid(st), y = deepFloor() - P * 8;
  for (const [money, n] of st.paid) {
    if (money === 'scale') refundScales(n, x, y);
    else refund(money, n, x, y);
  }
  st.paid = [];
  st.rung = 0;
  st.kind = null;
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
// Heard from the serpent's own break (`onBreak`), with the stage it reached;
// `fangsDropped` is the guard, so a break heard twice, or one a hook set the
// stage past, drops nothing it has dropped already.
function dropFangs(stage, t = now()) {
  const due = Math.min(FANG_BREAKS, stage | 0);
  if (S.fangsDropped >= due) return;
  const add = [];
  while (S.fangsDropped < due) {
    S.fangsDropped++;
    add.push(fangAtBelly(t));
  }
  S.fangsLoose = [...S.fangsLoose, ...add];
}
const fangAtBelly = t => {
  const at = bellyAt(t);
  return { x: at.x, y: at.y, vx: (rand() * 2 - 1) * FANG_KICK, vy: 0, rest: false, by: null, held: false };
};

// And one at the story's kill and at each level's bar emptied after it
// (DESIGN.md, "Endless serpent"), for as long as a slot is free: a fang held
// or lying on the floor already promises one, and a station is never taken
// down, so a bar emptied with no room owes nothing later.
// `killFangs` is the guard, as `fangsDropped` is the breaks': asked on the
// kill, on each recoil, and again on the return, the other moment the belly
// is whole and in place, which is how a save from before the endless serpent
// drops its story kill's fang. A bar emptied counts from its recoil's first
// frame; the level goes up at its last.
export const killsHad = () => Math.max(0, (S.serpentLevel | 0) - 1) + (S.serpentFreed || S.recoilT != null ? 1 : 0);
export function dropKillFang(t = now()) {
  const room = FIGHT_STATIONS_MAX - S.stations.length - (S.fangs | 0) - S.fangsLoose.length;
  const due = Math.min(killsHad(), (S.killFangs | 0) + Math.max(0, room));
  if ((S.killFangs | 0) >= due) return;
  const add = [];
  while ((S.killFangs | 0) < due) {
    S.killFangs = (S.killFangs | 0) + 1;
    add.push(fangAtBelly(t));
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
  const hands = new Set(S.workers.filter(w => w.type === TYPE.GATHER || w.type === TYPE.FIGHTER).map(w => w.name));
  for (const g of [...S.fangsLoose]) {
    // A claim nobody answers any more -- the hand stood down, or moved to a
    // job that does not carry -- is let go where it is, and a fang let go
    // sinks again.
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

// Listening starts once both files are read, not at this one's load:
// serpent.js is read before this file on some import orders and after it on
// others, and asked while it is still being read it has no list to hand the
// listener to. game.js calls this as it is read, which is before the first
// frame -- a save's first frame can be a rise, whose fang is owed -- and the
// frame asks again for a yard stood up without it.
let listening = false;
export function listenFangs() {
  if (listening) return;
  onBreak(stage => { dropFangs(stage); if (stage >= SERPENT_PHASES) dropKillFang(); });
  onRise(() => dropKillFang());
  onRecoil(() => dropKillFang());
  listening = true;
}
export function stepParty() {
  listenFangs();
  if (!S.snatched) return;
  raiseLots();
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

// With no gatherer to fetch it, a fang on the floor is fetched by the
// fighter nearest it (the owner, 2026-09-28): it leaves its station for the
// errand, carries the fang to the crusher, and swims back to its work. A
// gatherer with scales in its arms takes the fang once they are in, so any
// gatherer down there is enough to leave the fighters at their work. True
// while this fighter is on the errand, which is the whole of its frame.
// A fighter whose station's gear is hung up for it (the finale's heir) takes
// the gear up first: it is not sent for a fang meanwhile, and a fang it
// claimed while it gathered is let go where it is.
const claimed = w => S.fangsLoose.some(f => f.by === w.name);
const freeGatherer = () => S.workers.some(o => o.type === TYPE.GATHER && working(o));
const gearHung = w => !!stationById(w.station)?.hung;
export function fetchFang(w) {
  if (gearHung(w)) {
    for (const g of S.fangsLoose) if (g.by === w.name) { g.by = null; if (g.held) { g.held = false; g.rest = false; } }
    return false;
  }
  if (!claimed(w)) {
    const g = S.fangsLoose.find(f => f.rest && !f.by);
    if (!g || !working(w) || freeGatherer() || gearHung(w)) return false;
    let best = null, dist = Infinity;
    for (const o of S.workers) {
      if (o.type !== TYPE.FIGHTER || !working(o) || claimed(o) || gearHung(o)) continue;
      const d = Math.hypot(mid(o) - g.x, o.y - g.y);
      if (d < dist) { dist = d; best = o; }
    }
    if (best !== w) return false;
  }
  // Nothing in its hands but the fang: the swing in the air and the beam go.
  w.pose = null;
  w.beam = null;
  return carryFang(w);
}
