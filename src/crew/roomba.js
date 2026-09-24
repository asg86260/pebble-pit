// The roombas: the janitors' closet's machine (DESIGN.md, "The janitors'
// roomba"). Low discs that drive out along the yard's floor to every patch of
// mess on open ground -- a body's leavings and the sky's muck alike -- take it
// into a bin, and drive home to a dock beside the closet, where the one
// janitor left tips the bin in at the closet's door.
//
// Not crew: a roomba is in `S.roombaBots`, never `S.workers`, like a forklift,
// so nothing that is about people (a break, the loo, a dance, the pointer, the
// crew board) ever sees one. Its claims are in the crew's own books
// (`muckTaken`, `poopTaken`), so a roomba and a shovel never go for the same
// patch.
//
// Nothing teleports. A roomba drives to every patch and takes in only what is
// under it; what it takes in rides home in its bin; and the mess leaves the
// yard only through the closet's door, a grain at a time, off the tender's
// shovel. With nobody at the closet the roombas drive home and sit on the dock:
// a station idles until somebody is standing there.

import { P, WORKER, MACHINE_FOUL, STACK_PUFFS, MUCK_SWEEP, MUCK_SWING,
         ROOMBA_MAX, ROOMBA_W, ROOMBA_H, ROOMBA_PACE, ROOMBA_BIN, ROOMBA_TIP_MS,
         ROOMBA_TIP_FLY_MS, ROOMBA_SUCK_FLY_MS, ROOMBA_DOCK_OFF, ROOMBA_PITCH,
         ROOMBA_DOCK_W, ROOMBA_OWED, ROOMBA_TONES } from '../config.js';
import { S, outhouse } from '../state.js';
import { JOB, TYPE } from '../jobs.js';
import { frames, now } from '../clock.js';
import { commutePace, machineRate } from '../levels.js';
import { machine } from '../machines.js';
import { foul, puffStack, nearestOpenMess, onOpenYard, messAt, muckCols, poopCols,
         colAt, dropMuckAt, MUCK_ELBOW } from '../smog.js';
import { inWorking } from '../route.js';
import { sfx } from '../audio.js';
import { rand } from '../rng.js';
import { stand } from './body.js';

const RW = ROOMBA_W * P;

// How many there are in the yard: the count owned, while the machine's record
// says it is bought (a hook that puts every machine back in the box takes the
// roombas with it).
export const roombasOf = () => (machine('roomba')?.bought ? Math.max(0, Math.min(ROOMBA_MAX, S.roombas | 0)) : 0);

// The dock, a slot a roomba in a row on the closet's rock side: where roomba
// `i` sits (its left edge), and the charge post standing a cell before it.
export const dockX = i => outhouse.x + outhouse.w + P * (ROOMBA_DOCK_OFF + 1 + i * ROOMBA_PITCH);
export const postX = i => dockX(i) - P;
// Where the tender stands to empty slot `i`: just past the machine, facing the
// closet, so the grains it lifts go back over the machine to the door.
export const tipX = i => dockX(i) + RW;
// The closet's door, where a tipped grain goes in.
const doorX = () => outhouse.x + outhouse.w / 2;
// The machine's mouth, and the stub its soot comes off.
const mouth = r => ({ x: r.x + (r.face > 0 ? RW - P / 2 : P / 2), y: S.groundY - P });
// The stub is over the dome's back cell (render/roomba.js).
const stack = r => ({ x: r.x + P * (r.face > 0 ? 1 : ROOMBA_W - 2) + P / 2, y: S.groundY - P * (ROOMBA_H + 1) });

export const binOf = r => (r.muck | 0) + (r.poop | 0);

function newRoomba(x) {
  return { roomba: true, type: TYPE.JANITOR, x, face: -1, muck: 0, poop: 0,
           goal: 'dock', patch: null, owed: 0, soundAt: 0 };
}

// One on the dock for every one owned. A new one is stood up on its own slot,
// which is where the builders put it together; one taken away (a hook, a save
// that says fewer) puts what is in its bin down where it stands.
export function syncRoombas() {
  if (!S.roombaBots) S.roombaBots = [];
  const want = roombasOf();
  while (S.roombaBots.length < want) S.roombaBots.push(newRoomba(dockX(S.roombaBots.length)));
  while (S.roombaBots.length > want) {
    const r = S.roombaBots.pop();
    if (r.muck) dropMuckAt(r.x + RW / 2, r.muck, 'muck');
    if (r.poop) dropMuckAt(r.x + RW / 2, r.poop, 'poop');
  }
}

// The janitor minding them: one at the closet, on its ground or the dock's,
// on its feet and not off on an errand. The same questions `tenderFor` asks of
// a machine's tender, plus the errand: a janitor gone after a patch of poop
// the roombas cannot reach is not at the closet.
export function tender() {
  const from = outhouse.x - P * 2, to = outhouse.x + outhouse.w + ROOMBA_DOCK_W;
  for (const w of S.workers) {
    if (w.type !== TYPE.JANITOR) continue;
    if (w.walking || w.inside || w.aloft || w.lifted || w.falling || w.looUntil) continue;
    if (w.goal === 'muck' || w.muckAt != null || inWorking(w)) continue;
    if (w.x + WORKER < from || w.x > to) continue;
    return w;
  }
  return null;
}

// The columns under a roomba standing at `x`, nearest its middle first.
function under(x) {
  const lo = colAt(x), hi = colAt(x + RW - 1), mid = (lo + hi) / 2;
  const out = [];
  for (let c = lo; c <= hi; c++) out.push(c);
  return out.sort((a, b) => Math.abs(a - mid) - Math.abs(b - mid));
}
// Where a roomba parks to work column `c`: centered over it, on a whole cell.
const parkOver = c => Math.round((c * P + P / 2 - RW / 2) / P) * P;
// Whether there is anything under a roomba parked over `c` that it may take.
const leftUnder = c => under(parkOver(c)).some(k => messAt(k) > 0 && onOpenYard(k));

// How many columns either side of its patch a roomba reserves in the books: its
// own half-width, and a body's elbow past that, so nobody shovels under it.
// Asked rather than kept: smog.js is still loading when this file is.
const elbow = () => Math.ceil(ROOMBA_W / 2) + MUCK_ELBOW;
const book = (c, col) => {
  for (let k = col - elbow(); k <= col + elbow(); k++) { c.muckTaken.add(k); c.poopTaken.add(k); }
};
// The roombas' claims, for the crew's books (`updateWorkers`), rebuilt a frame
// at a time with the rest.
export function bookRoombas(muckTaken, poopTaken) {
  for (const r of S.roombaBots || []) {
    if (r.patch == null) continue;
    for (let k = r.patch - elbow(); k <= r.patch + elbow(); k++) { muckTaken.add(k); poopTaken.add(k); }
  }
}

function drive(r, to) {
  const d = to - r.x;
  if (Math.abs(d) < 0.5) { r.x = to; return true; }
  r.x += Math.sign(d) * Math.min(ROOMBA_PACE * commutePace() * frames(), Math.abs(d));
  r.face = Math.sign(d);
  return Math.abs(to - r.x) < 0.5;
}

// A grain of mess in the air: into a mouth, or out of a bin into the door.
function fleck(x0, y0, x1, y1, ms, arc) {
  (S.roombaFlecks || (S.roombaFlecks = [])).push({
    x0, y0, x1, y1, at: now(), ms, arc,
    tone: ROOMBA_TONES[Math.floor(rand() * ROOMBA_TONES.length)]
  });
}

// Take what is under it, a whole grain at a time at the closet's machine rate:
// its own kind first (what a body left, which only the closet may shift),
// then the weather's.
function suck(r) {
  r.owed = Math.min(ROOMBA_OWED, (r.owed || 0) + MUCK_SWEEP * machineRate(JOB.JANITOR) * frames() / 60);
  let took = 0;
  const m = mouth(r);
  const muck = muckCols(), poop = poopCols();
  for (const c of under(r.x)) {
    if (r.owed < 1 || binOf(r) >= ROOMBA_BIN) break;
    if (!onOpenYard(c)) continue;
    for (const [layer, kind] of [[poop, 'poop'], [muck, 'muck']]) {
      while (layer[c] > 0 && r.owed >= 1 && binOf(r) < ROOMBA_BIN) {
        fleck(c * P + P / 2, S.groundY - (messAt(c) - 0.5) * P, m.x, m.y, ROOMBA_SUCK_FLY_MS, 0);
        layer[c]--;
        r[kind]++;
        r.owed--;
        took++;
      }
    }
  }
  if (!took) return 0;
  // All of it soot, off its stack, per grain of work, as every machine's is
  // per unit of its station's work (`stepMachines`).
  const s = stack(r);
  foul(MACHINE_FOUL * took, s.x, s.y, 'mach');
  if (now() >= (r.soundAt || 0)) {
    r.soundAt = now() + MUCK_SWING;
    puffStack(s.x, s.y, STACK_PUFFS);
    sfx('roomba-suck', { x: r.x + RW / 2 });
  }
  r.workedAt = now();
  return took;
}

function stepOne(r, i, minder, taken, c) {
  // Home when there is nobody minding, or the bin is full.
  if (!minder || binOf(r) >= ROOMBA_BIN) r.patch = null;
  else {
    if (r.patch != null && !leftUnder(r.patch)) r.patch = null;
    if (r.patch == null) {
      const col = nearestOpenMess(r.x + RW / 2, taken);
      if (col != null) { r.patch = col; book(c, col); }
    }
  }
  if (r.patch != null) {
    r.goal = 'out';
    if (drive(r, parkOver(r.patch)) && !suck(r) && !leftUnder(r.patch)) r.patch = null;
    return;
  }
  // Nothing to fetch, or nobody minding: back on its own slot, facing the door.
  if (r.goal === 'dock') return;
  r.goal = 'home';
  if (drive(r, dockX(i))) { r.goal = 'dock'; r.face = -1; }
}

// Held off the ground a rock is coming down on, like the crew (`holdTheLine`):
// a roomba outside the footprint at the frame's start is not inside it after.
function holdOff(r, x0, zone) {
  if (!zone) return;
  const inside = x => x + RW > zone.from && x < zone.to;
  if (!inside(x0) && inside(r.x)) r.x = x0;
}

// A frame of them, inside the crew's frame (`updateWorkers`), on the crew's own
// books in `c`.
export function stepRoombas(c) {
  syncRoombas();
  const minder = tender();
  const taken = col => c.muckTaken.has(col) || c.poopTaken.has(col);
  (S.roombaBots || []).forEach((r, i) => {
    const x0 = r.x;
    stepOne(r, i, minder, taken, c);
    holdOff(r, x0, c.zone);
  });
  stepFlecks();
}

function stepFlecks() {
  const f = S.roombaFlecks;
  if (!f || !f.length) return;
  const t = now();
  S.roombaFlecks = f.filter(k => t - k.at < k.ms);
}

// --- the tender's half ------------------------------------------------------------
// The janitor at the closet empties any roomba sitting on the dock with
// something in its bin: it walks over to it, and each beat lifts one grain out
// and throws it in at the door. Returns true while it is doing that, so the
// janitor's own idling at the shed does not also move it (`janitorWork`).
export function tipBins(w) {
  const bots = S.roombaBots || [];
  const i = bots.findIndex(r => r.goal === 'dock' && binOf(r) > 0);
  if (i < 0 || w !== tender()) return false;
  const r = bots[i];
  const to = tipX(i);
  const d = to - w.x;
  w.resting = false;
  if (Math.abs(d) > 0.5) {
    w.x += Math.sign(d) * Math.min(commutePace() * frames(), Math.abs(d));
    w.y = stand(w);
    return true;
  }
  w.x = to;
  w.y = stand(w);
  w.face = -1;
  const t = now();
  if (t >= (w.tipAt || 0)) {
    w.tipAt = t + ROOMBA_TIP_MS;
    if (r.poop > 0) r.poop--; else r.muck--;
    w.lunge = 1;
    fleck(r.x + RW / 2, S.groundY - P * ROOMBA_H, doorX(), S.groundY - P * 2, ROOMBA_TIP_FLY_MS, P * 5);
  }
  return true;
}

// On the save: where each one is and what is in its bin. The count is
// `S.roombas`, a plain field; this is the machines, so a reload does not put
// every roomba back on its slot with its bin emptied.
export const SAVE = {
  fields: ['roombaBots'],
  write(out) {
    out.roombaBots = (S.roombaBots || []).map(r => ({
      x: Math.round(r.x), face: r.face || -1, muck: r.muck | 0, poop: r.poop | 0,
      docked: r.goal === 'dock'
    }));
  },
  read(s) {
    S.roombaBots = [];
    S.roombaFlecks = [];
    for (const k of s.roombaBots || []) {
      if (!k || !Number.isFinite(k.x)) continue;
      const r = newRoomba(k.x);
      r.face = k.face || -1;
      r.muck = Math.max(0, k.muck | 0);
      r.poop = Math.max(0, k.poop | 0);
      // A patch is a claim, and claims are the frame's: it picks again.
      r.goal = k.docked ? 'dock' : 'home';
      S.roombaBots.push(r);
    }
    syncRoombas();
  },
  blank() { S.roombaBots = []; S.roombaFlecks = []; }
};
