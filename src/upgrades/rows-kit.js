import { TRADE_COST, TRADE_RATE } from '../config.js';
import { S } from '../state.js';
import { JOB } from '../jobs.js';
import { kitX } from '../world.js';
import { stockOf, kitMaxOf } from '../kit.js';
import { kitDisplaced, machineFor } from '../machines.js';
import { shieldOpened } from '../shield.js';
import { rebalance } from '../upgrades.js';
import { syncWorkers } from '../crew.js';

// The kit rows: a hat for the rock, a lamp for the cut, a brim for the plots, a
// cart for the lip. Data only: upgrades.js strings the files together into
// UPGRADES, in this order.
//
// Each row is drawn on the board of the station that wears the kit (`board`;
// the bench draws whichever row names none) and WORKED there (`site`), so the
// hat is made where it lands and has nowhere to teleport from. See DESIGN.md,
// "The school comes down".

// Every trade is the same object: a job, the count of that job already
// trained, and the thing it is twice as good at. `shield` is the try against
// the sky that opens the row (`learned`).
export const TRADES = [
  { key: 'breaker', name: 'breaker', job: JOB.ROCK, count: 'breakers',
    does: 'twice the bite', place: 'the rock',
    site: 'shack', board: 'shack', shield: 'props' },
  { key: 'carter', name: 'carter', job: JOB.HAUL, count: 'carters',
    does: 'twice the load', place: 'the pit',
    site: 'yard', board: null, shield: 'props' },
  { key: 'blaster', name: 'blaster', job: JOB.QUARRY, count: 'blasters',
    does: 'twice the trips', place: 'the quarry',
    site: 'quarry', board: 'quarry', shield: 'arch' },
  { key: 'grower', name: 'grower', job: JOB.FARM, count: 'growers',
    does: 'twice the tending', place: 'the farm',
    site: 'farm', board: 'farm', shield: 'net' }
];

// whether the trade's place is a place yet
const OPEN = { rockhands: () => true, haulers: () => true,
               quarriers: () => S.quarryOpen, farmhands: () => S.farmOpen };

export const tradeCost = t =>
  Math.round(TRADE_COST * Math.pow(TRADE_RATE, stockOf(t.job)));

// What is bought is the kit, and it stays at the station: whoever is sent
// there next picks up whatever the last one put down. Three to a station
// (`KIT_MAX`); a finished set is what the machine asks for (`kitFull`). The
// carts have no end, because carrying is never taken over.
function train(t) {
  if (taught(t) >= ceiling(t)) return;
  // Straight on to the station's stand: the body that made it is standing
  // there. `stepKit` sends the next bare head on the job over to pick it up.
  S[t.count]++;
  rebalance();
  syncWorkers();
}

// Read through the kit table so the board, the price and the ceiling all
// count the same hats the yard counts.
const taught = t => stockOf(t.job);

// `KIT_MAX` for three of the four and `Infinity` for the carts, off the kit
// table rather than the constant.
const ceiling = t => kitMaxOf(t.job);

// A trade with an end is a ladder; one without is a count that never
// finishes, and `'○'.repeat(Infinity)` is not a picture.
const ladder = t => isFinite(ceiling(t));

// The shields are the gate: the props open the rock's and the lip's kit, the
// net the plots', the arch the cut's. A yard that already owns kit keeps the
// row whatever the sky has said.
const learned = t => taught(t) > 0 || shieldOpened(t.shield);

export const KIT_ROWS = TRADES.map(t => ({
  key: t.key,
  // A rung, the shortest wait in the game: the carts have no ceiling, and a
  // set of six at a building's pace would be twenty minutes of standing about.
  kind: 'rung', site: t.site,
  // The carts are made at the lip's own stand.
  ...(t.site === 'yard' ? { at: () => kitX(t.job) } : {}),
  ...(t.board ? { board: t.board } : {}),
  name: t.name,
  note: () => `${t.name}: ${t.does}, at ${t.place}`,
  unit: null,
  from: () => taught(t),
  to: () => taught(t) + 1,
  // The carts have no ceiling, so no pips and never `done`; the price is the
  // only thing that ever says stop.
  ...(ladder(t) ? { rung: () => taught(t), rungs: () => ceiling(t) } : {}),
  // Stays on the board when finished, even with finished rows folded away
  // (`folds`): the only place the game says how much kit the station owns.
  keep: true,
  cost: () => tradeCost(t),
  currency: 'shard',
  buy: () => train(t),
  // Never before a shard has been seen, and never after the machine: a jaw, a
  // ram or a tiller caps its station at one body (`buyMachine`). The carts
  // stay for the run, since everything off the belt's line is still walked;
  // `kitDisplaced` knows which is which.
  show: () => S.seenShard && learned(t) && OPEN[t.job]() &&
              !(machineFor(t.job) && kitDisplaced(t.job))
}));
