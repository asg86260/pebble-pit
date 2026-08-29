// The machines: the jaw at the cut, the ram at the rock, the tiller at the plots.
//
// A machine here is not the thing that replaces you. It is a **station**: a body
// walks to it and works it, the way a body works the scrubbing house, and it is
// faster than the same station worked by hand and it smokes. So the yard's two
// oldest rules survive it intact -- nobody teleports, and a station idles until
// somebody is actually standing there -- and the second of those turns out to be
// the whole safety net this feature needs: an unmanned machine produces nothing
// and smokes nothing. See `stepMachines` in crew.js, which is where that is
// enforced.
//
// The three of them share everything that can be shared. What is genuinely
// per-machine is a short list and it is worth naming, because the temptation is
// to write three machines and call it one feature: the *geometry* (where the
// thing stands, which is read off the station's own functions every frame), the
// *bite* (one unit of the station's own work, done by calling the station's own
// code), the *gate* on its shop row, and the *drawing*. Everything else -- the
// record, the capacity rule, the lever, the errand, the fouling, the stack, the
// walk back to carrying -- lives here once.
//
// One prohibition, stated up front because it is what keeps the jaw from being
// buried alive: **nothing about a machine's position is ever stored.** The
// quarry falls in behind the last body out and `fillQuarry` zeroes every column;
// a jaw with a remembered `y` would be under the new ground. Its `y` is
// `dugTopY(x) - height`, read every frame, so when the ground comes back the jaw
// comes up with it exactly the way a quarrier's feet do. The same goes for the
// hoist off `ladder()`, the ram off `rockEdge(-1)` and the tiller along the plot
// line. Geometry is derived, never remembered.

import { S } from './state.js';

// The three of them, and the job each one stands in for. The job is the link to
// everything else: it is what `capOf` answers about, what `handsOf` reads, and
// what `restaff` puts back.
export const MACHINES = [
  { key: 'jaw',    job: 'quarriers', name: 'the jaw' },
  { key: 'ram',    job: 'miners',    name: 'the ram' },
  { key: 'tiller', job: 'farmhands', name: 'the tiller' }
];

// Derived, not written out again: a hand-kept inverse of the table six lines
// above is a second place to forget.
export const JOB_MACHINE = Object.fromEntries(MACHINES.map(m => [m.job, m.key]));

// A machine's record. One shape, three of them, and it is a keyed object rather
// than nine flat fields on S for a reason worth writing down: it is four places
// to remember when the save format moves instead of thirty-six, and the note in
// `reset()` about `S.pitFine` records exactly the bug that forgetting one gives
// you.
//
// `bought`, `on` and `was` are facts about the yard. `ask` is a request that has
// not been walked to yet. The rest are clocks the drawing reads.
const fresh = () => ({
  bought: false,
  on: false,
  // A lever thrown is a *request*, not a change: somebody has to walk over and
  // do it. This lives on S rather than on the body walking, because no body is
  // ever persisted -- so a reload drops the walk, and an ask that outlived it
  // would be an ask nobody was ever going to arrive for.
  ask: null,
  // What the station held when the lever went on, so that throwing it off can
  // put the gang back. `rebalance` only ever clamps *down* -- it walks the
  // surplus to carrying and nothing walks them home again -- so without this,
  // every "off" would cost five clicks on the roster and nobody would ever
  // throw the lever twice.
  was: 0,
  beatAt: 0,             // when its next unit of work is due
  phase: 0,              // where it is in its own animation, 0..1
  puffAt: 0,             // and when the stack is next due to puff
  // Declared, and false, and unused until a star's core can be turned into a
  // heart. When that lands it multiplies exactly one number -- see `machineRate`
  // -- rather than arriving as a second feature wearing this one's coat.
  driven: false
});

export const freshMachines = () => Object.fromEntries(MACHINES.map(m => [m.key, fresh()]));

// The record for a key, and never null. It seeds itself rather than relying on
// something having run first: `restore` and both `reset` paths lay the records
// down, but a check that pokes at S directly, or a save from before the machines
// existed, would otherwise reach a `null` here -- and a feature whose every read
// has to guard is a feature that will be read unguarded exactly once.
export const machine = key => {
  if (!S.machines) S.machines = freshMachines();
  return S.machines[key] || null;
};

// The machine standing in for a job, if there is one and it is running. This is
// the question every other file asks, and it is deliberately about *on* rather
// than about *manned*: see `capOf`.
export const machineFor = job => {
  const k = JOB_MACHINE[job];
  const m = k && machine(k);
  return m && m.bought && m.on ? m : null;
};

export const running = key => {
  const m = machine(key);
  return !!(m && m.bought && m.on);
};

// `handsOf`, `machineRate` and `restaff` live in upgrades.js beside `capOf`,
// which is the one place that knows what a station's floor plan is. This file
// imports nothing from there and is imported by it, so the dependency runs one
// way: `capOf` asks whether a machine is running, and nothing here asks `capOf`
// anything.

// --- the lever ------------------------------------------------------------------
// A machine can be shut off, and its station goes straight back to hand work --
// which is why nothing in `stepQuarrier`, `stepFarmhand` or the miner branch is
// deleted when a machine is bought. The shovels are the fallback, and the lever
// picks which of the two is running.
//
// Throwing it is a **job**, not a setting. You ask; the nearest body free to go
// walks over and does it. Nothing in this yard happens without hands, and a
// switch that flipped the moment you clicked it would be the one thing in the
// game that did.
//
// An earlier draft promised that off could be instant, on the grounds that a
// running machine always has its tender standing at it. That is not true here
// and should not be made true: `takeMuck` pulls the tender off for a mess on its
// own site, `stepKit` sends it for a spare hat, `relieve` stops it where it
// stands, and the player can pick it up and carry it across the yard. Every one
// of those is a rule the yard already keeps. So there is one mechanism, and its
// cost simply *happens* to be nil in the common case, because the tender is
// usually standing right there.
//
// What that promise was trying to close -- a yard choking on smoke with nobody
// free to go and stop it -- is closed better by a rule the yard already has: an
// unmanned machine produces nothing and smokes nothing. The moment the last body
// walks away from it, it stops. See `runMachine`.
export function askLever(which, on) {
  const m = machine(which);
  if (!m || !m.bought) return false;
  if (m.on === !!on) { m.ask = null; return false; }   // already the way you want it
  m.ask = { on: !!on };
  S.dirty = true;
  return true;
}

// The ask is dropped when it is answered, and also when it stops making sense --
// a machine sold, a save loaded, a check resetting the yard.
export const clearAsk = which => { const m = machine(which); if (m) m.ask = null; };

// What the lever is set to be, counting an ask that has not been walked to yet.
// The drawing wants this so a thrown lever can read as *thrown and on its way*
// rather than as nothing having happened.
export const asked = which => {
  const m = machine(which);
  return m ? (m.ask ? m.ask.on : m.on) : false;
};

// --- the runner -----------------------------------------------------------------
// One beat, three machines, and the station's own work done by the station's own
// code.
//
// The stations register themselves rather than being imported here, and that is
// not a style choice: `capOf` has to ask whether a machine is running, so
// `upgrades.js` imports this file -- and the quarry, the farm and the rock all
// import `upgrades.js`. A runner that reached into them would close that ring.
// So the dependency is turned round: each station hands this file the two or
// three things only it can answer, and this file never learns where any of them
// live.
const SPEC = {};

// `at`    -- where the machine stands, derived, never stored
// `ms`    -- how long one unit of its station's work takes it, at this rate
// `bite`  -- do exactly one unit of the station's own work, through the station's
//            own function, so that everything underneath keeps applying
// `ready` -- anything else that has to be true: the pile not full, the muck
//            cleared, the ground still there to work
export const defineMachine = (key, spec) => { SPEC[key] = spec; };
export const specOf = key => SPEC[key] || null;


// --- buying one ------------------------------------------------------------------
// A machine is not offered until its station has been given everything hands can
// be given. That is the gate, and it is what stops a machine hollowing out the
// ladder underneath it: `the next plot` can never be made worthless by a tiller
// you were able to buy instead of it, because the tiller is the thing you get
// *for* buying the last plot.
//
// The gate is a function per machine rather than a rule here, because what
// "every slot" means is the station's own business -- benches, plots, or a pair
// of kit ladders. What is shared is everything around it.
export function buyMachine(key) {
  const m = machine(key);
  if (!m || m.bought) return;
  m.bought = true;
  // And it starts. Somebody walks over and throws the lever, which is the same
  // journey as any other -- a machine that arrived already running would be the
  // one thing in the yard that did something without hands, and one that arrived
  // switched off would read as a purchase that did nothing.
  m.ask = { on: true };
  S.dirty = true;
}

// A row is on the board while the station is full and the machine is not yet
// bought. It is gated on **bought**, never on running: a row that came and went
// with the lever would rebuild the board every time somebody threw it, dropping
// the hover and re-firing the new-row mark.
export const canBuy = (key, slotsFull) => {
  const m = machine(key);
  return !!m && !m.bought && slotsFull();
};
