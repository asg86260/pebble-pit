// The machines: the drill at the cut, the ram at the rock, the tiller at the plots.
//
// A machine is a **station**: a body walks to it and works it, and an unmanned
// machine produces nothing and smokes nothing (`stepMachines` in crew.js).
// What is per-machine is the geometry, the bite, the gate on its row and the
// drawing; the record, the capacity rule, the fouling and the stack live here
// once.
//
// **Nothing about a machine's position is ever stored.** `fillQuarry` zeroes
// every column, and a jaw with a remembered `y` would be under the new ground.
// Its `y` is `dugTopY(x) - height`, read every frame; the hoist reads
// `ladder()`, the ram `rockEdge(-1)`, the tiller the plot line.

import { S } from './state.js';
import { MACHINE_TUNE, MACHINE_TUNE_SPARKS, MACHINE_TUNE_RUNGS, DUST_PER_SPARK } from './config.js';
import { JOB } from './jobs.js';
import { now } from './clock.js';

// The job is the link to everything else: what `capOf` answers about, what
// `handsOf` reads, and what `restaff` puts back.
export const MACHINES = [
  // Keyed 'jaw', which is in every save; the name is what anybody reads.
  { key: 'jaw',    job: JOB.QUARRY, name: 'the drill' },
  { key: 'ram',    job: JOB.ROCK,    name: 'the ram' },
  { key: 'tiller', job: JOB.FARM, name: 'the tiller' },
  // The belt works the ground between the rock and the hole (dust.js), not a
  // face. `takesKit: false`: once a jaw or a ram stands, its face is worked by
  // the machine or not at all, so the helmets are spent buying it
  // (`buyMachine`). Carrying goes on everywhere the belt does not reach, so
  // the carts stay bought and the kit row goes on selling them (`kitDisplaced`).
  // `unmanned`: it runs from purchase with nobody posted at it. Its post is the
  // lip, where every hauler comes to tip, so a tender taken there is a laden
  // body that stands holding its load for the rest of the run
  // (test/fixtures/belt-lip.json).
  { key: 'belt',   job: JOB.HAUL,   name: 'the belt', takesKit: false, unmanned: true }
];
// The machines that run themselves, by key.
export const UNMANNED = new Set(MACHINES.filter(m => m.unmanned).map(m => m.key));

// Derived, not written out again.
export const JOB_MACHINE = Object.fromEntries(MACHINES.map(m => [m.job, m.key]));

// Whether the machine standing in for a job took that station's kit with it,
// which is the same question as whether the kit row should still sell it.
// Answers about the *job* so the purchase, the reload and the board share one
// fact.
export const kitDisplaced = job => {
  const m = MACHINES.find(x => x.job === job);
  return !!(m && m.takesKit !== false);
};

// A machine's record: a keyed object rather than flat fields on S, so the save
// format has four places to remember instead of thirty-six. `bought` and
// `tookKit` are facts about the yard; the rest are clocks the drawing reads.
const fresh = () => ({
  bought: false,
  // Kept on the record rather than read off the station, because the
  // station's hat count is nought afterwards and the machine still has to be
  // worth what that set made (`machineRate`).
  tookKit: false,
  beatAt: 0,             // when its next unit of work is due
  phase: 0,              // where it is in its own animation, 0..1
  soundAt: 0,            // and when it is next heard: a body's pace, not its own
  // Unused until a star's core can be turned into a heart; then it multiplies
  // exactly one number (`machineRate`).
  driven: false,
  // Three rungs of red; see `tuneGain`.
  tune: 0
});

export const freshMachines = () => Object.fromEntries(MACHINES.map(m => [m.key, fresh()]));

// Never null. Seeds itself, because a check that pokes at S directly or a save
// from before the machines existed would otherwise reach a `null` here, and a
// feature whose every read has to guard is read unguarded exactly once.
export const machine = key => {
  if (!S.machines) S.machines = freshMachines();
  return S.machines[key] || null;
};

// The machines, on the save (persist.js, `SAVERS`): facts only. Whether one
// is *running* is whether anybody is standing at it, and the crew is rebuilt
// from the counts on the way in.
export const SAVE = {
  fields: ['machines'],
  write(out) {
    out.machines = Object.fromEntries(MACHINES.map(m => {
      const r = (S.machines && S.machines[m.key]) || {};
      return [m.key, { bought: !!r.bought, driven: !!r.driven, tookKit: !!r.tookKit,
                       tune: r.tune || 0,
                       // Its clock, as distances, or a refresh hands every
                       // machine a free unit.
                       beatIn: r.beatAt ? Math.max(0, Math.round(r.beatAt - now())) : null,
                       workedAgo: r.workedAt ? Math.max(0, Math.round(now() - r.workedAt)) : null }];
    }));
  },
  read(s) {
    S.machines = freshMachines();
    for (const m of MACHINES) {
      const r = (s.machines && s.machines[m.key]) || {};
      const rec = S.machines[m.key];
      rec.bought = !!r.bought;
      // A machine is worked by whoever is standing at it, so only the fact
      // of the lever is read.
      rec.driven = !!r.driven;
      // Clamped to the ladder's length: the tune rows were endless once, and a
      // save from then holds a rung count no board can now sell or draw.
      rec.tune = Math.min(MACHINE_TUNE_RUNGS, Math.max(0, Math.round(+r.tune || 0)));
      // A machine that does not take kit never took any, whatever the save
      // says: a stale `true` has `stripKit` empty the stand every frame
      // under a row still selling carts.
      rec.tookKit = rec.bought && kitDisplaced(m.job) && !!r.tookKit;
      if (Number.isFinite(r.beatIn)) rec.beatAt = now() + r.beatIn;
      if (Number.isFinite(r.workedAgo)) rec.workedAt = now() - r.workedAgo;
    }
  },
  blank() { S.machines = freshMachines(); }   // a new yard has no machines in it
};

// The machine standing in for a job, if there is one. About *bought* rather
// than *manned*: see `capOf`.
export const machineFor = job => {
  const k = JOB_MACHINE[job];
  const m = k && machine(k);
  return m && m.bought ? m : null;
};

// --- tuning one --------------------------------------------------------------
// A machine's ladder is three rungs of red and it ends, like every other ladder
// on every other board (DESIGN.md, "Every upgrade is a ladder with an end").
// One multiplier on `machineRate` in upgrades.js, so a fifth machine gets a
// ladder by existing.
export const tuneOf = key => machine(key)?.tune || 0;
export const tuneGain = key => Math.pow(MACHINE_TUNE, tuneOf(key));
// The bill for the rung you are standing on. Clamped at the top so a topped
// row still has a price to draw against the purse rather than `undefined`.
export const tuneCost = key =>
  MACHINE_TUNE_SPARKS[Math.min(tuneOf(key), MACHINE_TUNE_RUNGS - 1)];

// The row, on the board of the place the machine stands.
//
// `site` is where the machine stands, because tuning one is work done ON it.
// `board` is which sheet draws it, `undefined` meaning the machine's own.
export const tuneRow = (key, name, note, site, board) => ({
  key: 'tune' + key,
  kind: 'rung', site, board,
  name,
  // What the multiplier stands at now and what the rung would make it, so the
  // card reads "1.3x -> 1.7x" the way its neighbors do.
  unit: 'x',
  from: () => tuneGain(key),
  to: () => tuneGain(key) * MACHINE_TUNE,
  note,
  // A ladder like any other: pips a rung, and an end to reach.
  rung: () => tuneOf(key),
  rungs: () => MACHINE_TUNE_RUNGS,
  bill: () => [['spark', tuneCost(key)], ['dust', tuneCost(key) * DUST_PER_SPARK]],
  buy: () => { const m = machine(key); if (m) m.tune = (m.tune || 0) + 1; },
  // A ladder for a thing you have not bought is a row about nothing.
  show: () => !!machine(key)?.bought
});

export const running = key => {
  const m = machine(key);
  return !!(m && m.bought);
};

// `handsOf`, `machineRate` and `restaff` live in upgrades.js beside `capOf`.
// This file imports nothing from there and is imported by it, so the
// dependency runs one way: `capOf` asks whether a machine is running, and
// nothing here asks `capOf` anything.

// --- switching one off -----------------------------------------------------------
// There is no switch. A machine is stopped by taking its tender off (the
// station's `-` button) and started by putting one back, because a station
// idles until somebody is standing at it (`runMachine`). There is no hand
// fallback: a station with a machine standing is worked by the machine or not
// at all.

// --- the runner -----------------------------------------------------------------
// The stations register themselves rather than being imported here: `capOf`
// has to ask whether a machine is running, so `upgrades.js` imports this file,
// and the stations all import `upgrades.js`. A runner that reached into them
// would close that ring.
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
// A machine is not offered until its station's hands have been given
// everything a ladder sells, so the kit ladder it spends is never made
// worthless halfway up. Which ladders those are is the station's own
// business, so the gate is a function per machine.
export function buyMachine(key) {
  const m = machine(key);
  if (!m || m.bought) return;
  m.bought = true;
  // The machine absorbs the specialists: it caps its station at one body, so
  // the hats would otherwise sit at the kit stand meaning nothing. Nothing has
  // to be written for this: the count goes to nought, `stepKit` sees heads
  // wearing kit the station no longer owns, and each walks over and hands it
  // in. The belt takes no face, so it takes no carts (`kitDisplaced`).
  const spec = MACHINES.find(x => x.key === key) || {};
  m.tookKit = kitDisplaced(spec.job);
  // It runs because it is bought. What it needs is the gang shifted off:
  // `capOf` answers 1 for a station with a machine standing, and nothing
  // recomputes that per frame, so the complement has to be walked to carrying
  // in the same breath or the whole gang stands at a station that now holds
  // one, for good. `rebalance` only ever clamps down.
  S.restaff = { job: spec.job, want: 1 };
}

// On the board while the station's own ladders are topped AND every hat it
// can hold is bought, and the machine is not. The hats matter because a machine caps its station
// at one body, so without that gate every helmet went into a drawer the
// moment it started; gated this way the machine is worth half again what the
// specialists were (`machineRate`).
//
// Gated on **bought**: a row that came and went with whether the machine was
// manned would rebuild the board every time its tender wandered off.
export const canBuy = (key, laddersFull, kitFull) => {
  const m = machine(key);
  return !!m && !m.bought && laddersFull() && kitFull();
};
