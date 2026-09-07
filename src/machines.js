// The machines: the drill at the cut, the ram at the rock, the tiller at the plots.
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
// record, the capacity rule, the errand, the fouling, the stack, the
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
import { MACHINE_TUNE, MACHINE_TUNE_COST, MACHINE_TUNE_UP, DUST_PER_SPARK } from './config.js';
import { JOB } from './jobs.js';

// The three of them, and the job each one stands in for. The job is the link to
// everything else: it is what `capOf` answers about, what `handsOf` reads, and
// what `restaff` puts back.
export const MACHINES = [
  // Keyed 'jaw' still, which is what it was before it became a drill. The key
  // is in every save; the name is what anybody actually reads.
  { key: 'jaw',    job: JOB.QUARRY, name: 'the drill' },
  { key: 'ram',    job: JOB.ROCK,    name: 'the ram' },
  { key: 'tiller', job: JOB.FARM, name: 'the tiller' },
  // The fourth, and the odd one out twice over: it does not work a face -- it
  // works the *ground between* the rock and the hole, see the belt's spec in
  // dust.js -- and it is the one machine that leaves its station's kit alone.
  //
  // `takesKit` is what the other three do and the belt does not. A jaw stands in
  // the cut and a ram at the rock, and once one is there the face it works is
  // worked by the machine or not at all, so the helmets are spent buying it --
  // see `buyMachine`. Carrying is not a face. It is what a body does when it is
  // on nothing, and it goes on everywhere the belt does not reach: the weather's
  // muck, the far heaps, everything the yard drops away from the run between the
  // rock and the hole. So the carts stay bought, they stay useful, and the
  // school goes on selling them -- see `kitDisplaced`, which is what tells the
  // training grounds which rows to take down.
  { key: 'belt',   job: JOB.HAUL,   name: 'the belt', takesKit: false }
];

// Derived, not written out again: a hand-kept inverse of the table six lines
// above is a second place to forget.
export const JOB_MACHINE = Object.fromEntries(MACHINES.map(m => [m.job, m.key]));

// Whether the machine standing in for a job took that station's kit with it.
//
// Which is the same question as whether the school should still sell it: kit for
// a face a machine now works is kit with no head to go under, and a row offering
// it is a row selling nothing. Everything but the belt says yes -- see the note
// on `takesKit` in the table above for why carrying is the exception.
//
// It answers about the *job* rather than the record, so the one fact serves the
// purchase, the reload and the board, and a fifth machine is a line in the table
// rather than a third place to remember.
export const kitDisplaced = job => {
  const m = MACHINES.find(x => x.job === job);
  return !!(m && m.takesKit !== false);
};

// A machine's record. One shape, three of them, and it is a keyed object rather
// than nine flat fields on S for a reason worth writing down: it is four places
// to remember when the save format moves instead of thirty-six, and the note in
// `reset()` about the rift records exactly the bug that forgetting one gives
// you.
//
// `bought`, `on` and `was` are facts about the yard. `ask` is a request that has
// not been walked to yet. The rest are clocks the drawing reads.
const fresh = () => ({
  bought: false,
  // It was bought with a full set of specialists, and took them. Kept as a fact
  // on the record rather than read off the station, because the station's hat
  // count is nought afterwards and the machine still has to be worth what that
  // set made -- see `machineRate`.
  tookKit: false,
  beatAt: 0,             // when its next unit of work is due
  phase: 0,              // where it is in its own animation, 0..1
  puffAt: 0,             // and when the stack is next due to puff
  // Declared, and false, and unused until a star's core can be turned into a
  // heart. When that lands it multiplies exactly one number -- see `machineRate`
  // -- rather than arriving as a second feature wearing this one's coat.
  driven: false,
  // How many times this machine has been tuned. An endless ladder: see
  // `tuneGain` below, and `## The rift` / `## Economy` in DESIGN.md for why the
  // yard needs one row that never runs out.
  tune: 0
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
  return m && m.bought ? m : null;
};

// --- tuning one --------------------------------------------------------------
// The machines were the one thing in this yard you bought and then never
// thought about again. Every ladder in the game belonged to hands -- pick,
// swing, carry, harness, boots -- and a machine ran at the rate it was born at
// for ever, which made the biggest purchase in the game the end of a line
// rather than the start of one.
//
// So each of them has a ladder of its own, and the ladders **never end**. That
// is what makes them the yard's dust sink: every rung costs red and dust, the
// price grows on every rung, and there is always another. A finite ladder has a
// finite total cost and would put the surplus back exactly where it was.
//
// It is one multiplier on `machineRate` in upgrades.js and nothing else. Every
// machine's rate already runs through that one function, so a rung is a number
// in a record rather than four rate functions to keep in step -- and a fifth
// machine gets a ladder by existing.
export const tuneOf = key => machine(key)?.tune || 0;
export const tuneGain = key => Math.pow(MACHINE_TUNE, tuneOf(key));
export const tuneCost = key => Math.round(MACHINE_TUNE_COST * Math.pow(MACHINE_TUNE_UP, tuneOf(key)));

// The row, built once for all of them. A machine's ladder is the machine's, so
// the row lives on the board of the place the machine stands -- the jaw's at the
// quarry, the tiller's at the farm -- which is the rule the boards were supposed
// to have had all along.
//
// No `rung`, deliberately: `rungOf` calls a row without one "not a ladder at all
// ... and never finished", and never finished is the whole point. Pips over this
// would be the board drawing an end onto the one row that has none.
// `site` is where the machine stands, because tuning one is work done ON it: a
// spanner at the drill is a quarrier's afternoon, not a thing that happens the
// moment you press a button. It is the same site the machine's own row was
// built at, said again here because a row saying where it is fitted is what
// every row in this game does.
// `board` is which sheet draws it, and a tuning row is drawn wherever its
// machine's own row is: the belt is the crew's, so both of its rows are sold at
// the block the crew live in. Every other machine's tuning stays on the board it
// has always been on, which is what `undefined` means here.
export const tuneRow = (key, name, note, site, board) => ({
  key: 'tune' + key,
  kind: 'rung', site, board,
  name,
  unit: 'x',
  note,
  bill: () => [['spark', tuneCost(key)], ['dust', tuneCost(key) * DUST_PER_SPARK]],
  buy: () => { const m = machine(key); if (m) m.tune = (m.tune || 0) + 1; },
  // Only once the machine is actually standing. A ladder for a thing you have
  // not bought is a row about nothing.
  show: () => !!machine(key)?.bought
});

export const running = key => {
  const m = machine(key);
  return !!(m && m.bought);
};

// `handsOf`, `machineRate` and `restaff` live in upgrades.js beside `capOf`,
// which is the one place that knows what a station's floor plan is. This file
// imports nothing from there and is imported by it, so the dependency runs one
// way: `capOf` asks whether a machine is running, and nothing here asks `capOf`
// anything.

// --- switching one off -----------------------------------------------------------
// There is no switch. A machine is stopped by taking its tender off, which is
// the `-` button the station already has, and started by putting one back.
//
// This used to be a lever: a thing you clicked, which raised an *ask*, which a
// body walked over and answered, which flipped an `on` flag, which changed what
// `capOf` said, which walked the surplus gang to carrying or back again. Five
// moving parts and a save field, for a question the yard could already answer --
// because the oldest rule here is that a station idles until somebody is
// actually standing at it, and an unmanned machine has always produced nothing
// and smoked nothing. See `runMachine`. The lever was a second way to say the
// same thing, and the second way to say a thing is the one that gets it wrong.
//
// What it costs is the hand fallback: a station with a machine standing at it is
// worked by that machine or it is not worked, and there is no putting five
// bodies back on the face. That is the right trade. The machine is gated behind
// every slot and every hat the station can hold, so by the time you have one
// there is nothing the hands could go back to being better at, and a lever whose
// off position was strictly worse was a decision nobody made twice anyway.

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
  // The machine absorbs the specialists.
  //
  // It is gated behind a full set of hats, and it is worth what that set made --
  // so once it is standing, the hats have been *spent*. Leaving them on the shelf
  // gave you a drawer of helmets nobody could wear: a machine caps its station at
  // one body, so four of the five would sit at the kit stand for the rest of the
  // run, still counted, still drawn, meaning nothing.
  //
  // Nothing has to be written to make this look like anything: the count goes to
  // nought, `stepKit` sees heads wearing kit the station no longer owns, and each
  // one walks over and hands it in. The specialists trained the machine and then
  // took their helmets off, which is the truest thing this yard can say about
  // what a machine is.
  //
  // And it is worth half again what that set of specialists was, which is the
  // whole of why spending them is a trade rather than a loss -- see `machineRate`.
  //
  // All of which is about a machine that takes a face off its gang. The belt
  // takes none, so it takes no carts either: `kitDisplaced` is false for
  // carrying and the carters keep their kit and keep working the ground the
  // band never touches.
  const spec = MACHINES.find(x => x.key === key) || {};
  m.tookKit = kitDisplaced(spec.job);
  S.dirty = true;
  // And it runs, because it is bought. Nothing has to be thrown and nobody has
  // to walk anywhere to start it -- a machine that arrived switched off would
  // read as a purchase that did nothing.
  //
  // What it does need is the gang shifted off. `capOf` answers 1 for a station
  // with a machine standing, and nothing in the yard recomputes that per frame,
  // so the complement has to be walked to carrying in the same breath as the
  // purchase or the whole gang stands at a station that now holds one, for good.
  // `rebalance` only ever clamps down, which is all that is wanted here.
  S.restaff = { job: spec.job, want: 1 };
  S.dirty = true;
}

// A row is on the board while the station has been given everything hands can be
// given, and the machine is not yet bought.
//
// **Everything** is two things, and the second was missing. Every slot -- five
// benches, seven furrows, both of the rock's kit ladders -- and every *hat*: a
// specialist for each pair of hands the station holds.
//
// The hats matter for the same reason the slots do, only more so. A machine caps
// its station at one body, so without this gate every helmet you had bought went
// into a drawer the moment the machine started, and the trade ladder stopped
// being worth finishing halfway up. Gated this way round, the specialists are
// the last thing you buy before the machine and the machine is worth half again
// what they were -- see `machineRate`, which reads the hats for exactly this
// reason.
//
// Gated on **bought**: a row that came and went with whether the machine happened
// to be manned would rebuild the board every time its tender wandered off,
// dropping the hover and re-firing the new-row mark.
export const canBuy = (key, slotsFull, kitFull) => {
  const m = machine(key);
  return !!m && !m.bought && slotsFull() && kitFull();
};
