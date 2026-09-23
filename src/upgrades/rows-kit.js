import { TRADE_COST, TRADE_RATE, LIFT_BILL, LADDER } from '../config.js';
import { S } from '../state.js';
import { JOB } from '../jobs.js';
import { stockOf, kitMaxOf, LIFT } from '../kit.js';
import { kitFull, liftCap, liftSpeed } from '../levels.js';
import { tierRows, named } from './tiers.js';
import { kitDisplaced, machineFor } from '../machines.js';
import { shieldOpened } from '../shield.js';
import { rebalance } from '../staffing.js';
import { syncWorkers } from '../crew.js';

// The kit rows: a hat for the rock, a lamp for the cut, a brim for the plots, a
// cart for the lip. Data only: upgrades.js strings the files together into
// UPGRADES, in this order.
//
// Each row is drawn on the board of the station that wears the kit (`board`;
// the bench draws whichever row names none) and WORKED there (`site`), so the
// hat is made where it lands and has nowhere to teleport from. The cart is
// the exception: it is sold and worked at the bench like any other upgrade,
// not built at the lip -- a specialist is an upgrade, not construction. See
// DESIGN.md, "The school comes down".

// Every trade is the same object: a job, the count of that job already
// trained, and the thing it is twice as good at. `shield` is the try against
// the sky that opens the row (`learned`).
export const TRADES = [
  { key: 'breaker', name: 'breaker', job: JOB.ROCK, count: 'breakers',
    does: 'twice the bite', place: 'the rock',
    site: 'shack', board: 'shack', shield: 'props' },
  { key: 'carter', name: 'carter', job: JOB.HAUL, count: 'carters',
    does: 'twice the load', place: 'the pit',
    site: 'bench', board: null, shield: 'props' },
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

// --- the forklift --------------------------------------------------------------
// A forklift that drives itself: sold beside the carts and worked at the bench
// like them, a count with a price and never `done` (DESIGN.md, "The forklifts
// drive themselves"). Priced in the machines' coin, rising a lift at a time
// the way a hat does. It is not kit any more: nobody wears it.
const lifts = () => S[LIFT.trade] || 0;
export const liftCost = (n = lifts()) =>
  LIFT_BILL.map(([money, at]) => [money, Math.round(at * Math.pow(TRADE_RATE, n))]);

KIT_ROWS.push({
  key: 'driver',
  kind: 'rung', site: 'bench',
  name: 'forklift',
  note: () => 'a forklift that drives itself: it hauls to the pit with nobody aboard, and smokes',
  unit: null,
  from: lifts,
  to: () => lifts() + 1,
  keep: true,
  bill: liftCost,
  // It rolls off the stand at the bench (`syncWorkers` stands it up there).
  buy: () => { S[LIFT.trade] = lifts() + 1; syncWorkers(); },
  // The belt's gate: a full set of carts and both of the haulers' ladders
  // topped, so the two open together and which comes first is the player's.
  // Owned, it stays, like every kit row.
  show: () => lifts() > 0 ||
              (kitFull(JOB.HAUL) && S.haulCarryLevel >= LADDER && S.haulPaceLevel >= LADDER)
});

// Its two ladders, in bands like every ladder: what a forklift carries and
// how fast it drives, every forklift at once. Offered once there is one.
KIT_ROWS.push(...tierRows({
  field: 'liftLoadLevel',
  unit: 'px', does: 'carry',
  value: lvl => liftCap(lvl),
  site: 'bench',
  show: () => lifts() > 0,
  bands: named('liftload', 'forklift load')
}), ...tierRows({
  field: 'liftPaceLevel',
  unit: 'px/s', pct: true, does: 'drive',
  value: lvl => liftSpeed(lvl) * 60,
  site: 'bench',
  show: () => lifts() > 0,
  bands: named('liftpace', 'forklift speed')
}));
