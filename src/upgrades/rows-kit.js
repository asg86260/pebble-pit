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
// They were the training grounds' board, and the training grounds was a
// building that existed to sell these four rows -- each of which is about
// somewhere else. The ram is on the shack's board and the three helmets it
// waits for were a thousand pixels away in a building whose only other job was
// to be walked to. So each row is drawn on the board of the station that wears
// the kit, beside the machine that ends the same ladder: `board` names the
// sheet, and the bench draws whichever row names none. See DESIGN.md, "The
// school comes down".
//
// And each is WORKED at that station -- `site` -- so the hat is made where it
// lands: the body doing the work stands at the station, and when the work is
// in the hat is on that station's stand. There used to be a shelf outside the
// school's door and a carrier to walk the hat across the yard, because a hat
// bought at the school appeared at the rock; a hat made at its own stand has
// nowhere to teleport from, so the shelf and the errand are gone with the
// building.

// Every trade is the same object: a job, the count of that job already trained,
// and the thing it is twice as good at. One line each -- what differs between a
// breaker and a blaster is a word and a multiplier at the place the work is
// done, not a mechanism.
//
// `site` and `board` are the station, in the yard's words for the place;
// `shield` is the try against the sky that opens the row -- see `learned`.
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

// and whether that place is a place yet. The rock and the lip are there from
// the first frame; the other two are bought.
const OPEN = { rockhands: () => true, haulers: () => true,
               quarriers: () => S.quarryOpen, farmhands: () => S.farmOpen };

export const tradeCost = t =>
  Math.round(TRADE_COST * Math.pow(TRADE_RATE, stockOf(t.job)));

// Nobody is taught and nobody is nailed down: what is bought is the kit, and it
// stays at the station. Whoever is standing there picks it up, and whoever is
// sent there next picks up whatever the last one put down.
//
// Three to a station, and no more -- `KIT_MAX`. A set of three is a thing you
// finish, and finishing it is what the machine asks for -- see `kitFull`. So
// the shards go somewhere with an end on it, and what is on the other side of
// that end is the ram, the jaw, the tiller and the belt. The carts have no end,
// because carrying is never taken over.
//
// Kit is not a person: a helmet on the stand is a helmet the next hire puts on
// the moment you take them on, and stocking the rock before you have staffed it
// is a perfectly sensible thing to do with a pile of shards. What has a number
// on it is how many helmets the rock will ever have, not how many heads are
// under them today.
function train(t) {
  if (taught(t) >= ceiling(t)) return;
  // Straight on to the station's stand: the body that made it is standing
  // there. `spareKit` counts it from this frame, and `stepKit` sends the next
  // bare head on the job over to pick it up.
  S[t.count]++;
  rebalance();
  syncWorkers();
}

// How many of this trade the station has, read through the kit table so that the
// board, the price and the ceiling all count the same hats the yard counts.
const taught = t => stockOf(t.job);

// And how many there are to buy, which is `KIT_MAX` for three of the four and
// `Infinity` for the carts. The row asks the kit table rather than the constant,
// so a trade with no end is a missing field in one table and not a branch here.
const ceiling = t => kitMaxOf(t.job);

// A trade with an end on it is a ladder -- pips under the name, `done` on the
// last rung. A trade without one is a count: the row says what it has and what
// the next one costs, and it never finishes. Pips are the wrong picture for a
// number with no end, and `'○'.repeat(Infinity)` is not a picture at all.
const ladder = t => isFinite(ceiling(t));

// The shields are the gate. Each try against the sky is the yard reaching for
// one of the things it makes, and when it fails the people who made the
// material are the ones who have learned something: the props open the rock's
// and the lip's kit, the net the plots', the arch the cut's. A yard that
// already owns kit keeps the row whatever the sky has said -- a finished set
// never leaves the board it stands on. With the shields not doors
// (SHIELD_GATES) every trade is learned from the start.
const learned = t => taught(t) > 0 || shieldOpened(t.shield);

export const KIT_ROWS = TRADES.map(t => ({
  key: t.key,
  // A rung rather than a place, and it is the shortest wait in the game on
  // purpose: a hat is a thing somebody is shown how to wear, not a building, and
  // the carts have no ceiling -- a set of six at a building's pace would be
  // twenty minutes of standing about for a purchase whose whole character is
  // that you make it again.
  kind: 'rung', site: t.site,
  // The carts are made at the lip's own stand -- the one yard row whose ground
  // is a stand rather than a site, named the way a machine row names its
  // ground.
  ...(t.site === 'yard' ? { at: () => kitX(t.job) } : {}),
  ...(t.board ? { board: t.board } : {}),
  name: t.name,
  // What it is for. A row here is one word -- breaker, carter -- and the word is
  // the name of the kit rather than the thing it does, which is fine on a board
  // you already know and useless on the first visit.
  note: () => `${t.name}: ${t.does}, at ${t.place}`,
  unit: null,
  // One more of that hat on the stand. What it is worth is in the note; what the
  // row says is what it does to the count.
  from: () => taught(t),
  to: () => taught(t) + 1,
  // A ladder like every other ladder on every other board, and shorter than most
  // -- three rungs rather than five, which is why it says how long it is. The
  // pips under the name are the whole of what the ceiling had to be told to the
  // player: a finished set reads "done" and stays on the board saying so.
  //
  // The carts have no ceiling, so they have no pips and never read `done`. What
  // that row shows instead is the count -- so many now, one more for this much
  // -- and the price, which climbs three fifths a cart and is the only thing
  // that ever says stop.
  ...(ladder(t) ? { rung: () => taught(t), rungs: () => ceiling(t) } : {}),
  // and it stays on the board when it is finished, even with the finished rows
  // folded away. See `folds`: this row is the only place the game says how much
  // kit the station owns, and that is the one thing you come to a board to
  // find out.
  keep: true,
  cost: () => tradeCost(t),
  currency: 'shard',
  buy: () => train(t),
  // Once the sky has taught the trade, never before the place it belongs to is
  // open, and never before a shard has been seen -- a shard price on a board
  // before the quarry has made one is a price in a coin that does not exist.
  //
  // ...and never after the machine. A jaw, a ram or a tiller caps its station
  // at one body and takes the set of hats it was gated behind with it -- see
  // `buyMachine` -- so a row still offering a fourth blaster is a row selling a
  // helmet for a face nobody stands at any more. The carts are the exception
  // and stay for the rest of the run: carrying is not a face, and everything
  // off the belt's line is still walked by hand. `kitDisplaced` is the one
  // place that knows which is which.
  show: () => S.seenShard && learned(t) && OPEN[t.job]() &&
              !(machineFor(t.job) && kitDisplaced(t.job))
}));
