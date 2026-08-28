// The school: where a body learns one trade and stops being able to do anything
// else.
//
// A job is a count, not a purchase. You buy a body once and put it where you
// like, and every one of them can be taken back the moment you want the dust
// moving again. That makes an assignment free, and something that is free is
// never really chosen -- so the one question this game says it is about, who is
// doing what, costs nothing to answer and can be answered again a second later.
//
// A trade is the exception, and it is the first thing a shard is good for.
// Everything the quarry gave up used to sit in the counter doing nothing until
// the lab was built -- three cores and a farm away -- and a currency you cannot
// spend reads as scenery. Shards build the school; after that a shard sends
// somebody to it, and what comes back works twice as hard at one thing and will
// not do anything else. You paid for the staying as much as for the work.
//
// It is a place in the yard with a board on it, like the bench and the lab, and
// not a section on the bench: the bench is the shop and this is a decision about
// people, and they read differently for standing in different places.

import { S } from './state.js';
import { TRADE_COST, TRADE_RATE } from './config.js';
import { rebalance } from './upgrades.js';
import { syncWorkers } from './crew.js';

// Every trade is the same object: a job, the count of that job already trained,
// and the thing it is twice as good at. One line each -- what differs between a
// breaker and a blaster is a word and a multiplier at the place the work is
// done, not a mechanism.
export const TRADES = [
  { key: 'breaker', name: 'breaker', job: 'miners', count: 'breakers',
    does: 'twice the bite' },
  { key: 'carter', name: 'carter', job: 'haulers', count: 'carters',
    does: 'twice the load' },
  { key: 'blaster', name: 'blaster', job: 'quarriers', count: 'blasters',
    does: 'twice the trips' },
  { key: 'grower', name: 'grower', job: 'farmhands', count: 'growers',
    does: 'twice the tending' }
];

// where each trade's kit lives, in the words the yard uses for the place
const WHERE = { miners: 'the rock', haulers: 'the pit', quarriers: 'the quarry',
                farmhands: 'the farm' };

// and whether that place is a place yet. The rock and the lip are there from
// the first frame; the other two are bought.
const OPEN = { miners: () => true, haulers: () => true,
               quarriers: () => S.quarryOpen, farmhands: () => S.farmOpen };

export const tradeCost = t =>
  Math.round(TRADE_COST * Math.pow(TRADE_RATE, S[t.count]));

// Nobody is taught here any more and nobody is nailed down: what is bought is
// the kit, and it stays at the station. Whoever is standing there picks it up,
// and whoever is sent there next picks up whatever the last one put down.
//
// There is no ceiling on it. There used to be one -- a hat a bench, a hat a plot,
// and never more of either than there were bodies in the yard -- from back when
// a hat was a body that had been upgraded, and buying one more than you had
// people for was buying nothing. Kit is not a person: a helmet on the stand is a
// helmet the next hire puts on the moment you take them on, and stocking the
// rock before you have staffed it is a perfectly sensible thing to do with a
// pile of shards. What limits it is the price, which doubles-and-a-bit every
// time, and that is limit enough.
function train(t) {
  S[t.count]++;
  rebalance();
  syncWorkers();
}

export const SCHOOL_UPGRADES = TRADES.map(t => ({
  key: t.key,
  name: t.name,
  // What it is for. A row here is one word -- breaker, carter -- and the word is
  // the name of the kit rather than the thing it does, which is fine on a board
  // you already know and useless on the first visit.
  note: () => `${t.name}: ${t.does}, at ${WHERE[t.job]}`,
  unit: null,
  // One more of that hat on the stand. What it is worth is in the note; what the
  // row says is what it does to the count.
  from: () => S[t.count],
  to: () => S[t.count] + 1,
  cost: () => tradeCost(t),
  currency: 'shard',
  buy: () => train(t),
  // and never before the place it belongs to is open: kit for a farm you have
  // not broken the ground for is kit for somewhere that does not exist
  show: () => S.schoolOpen && OPEN[t.job]()
}));

// One heading per place, and the same four the yard already has. "The ground"
// held the quarry and the plots together, which is two different sites under one
// word -- and the plots are a good half hour behind the quarry, so anybody reading
// that heading on the day the quarry opens is reading a heading with one row
// under it and a name that promises two.
//
// A heading with nothing showing under it is left out, so the plots turn up as
// their own line on the day the ground is broken. See `shape` in shop.js.
export const SCHOOL_SECTIONS = [
  { title: 'the rock', keys: ['breaker'] },
  { title: 'the dust', keys: ['carter'] },
  { title: 'the quarry', keys: ['blaster'] },
  { title: 'the farm', keys: ['grower'] }
];

// How much of that kit the station owns, for the badge on the heading.
//
// A row on this board says what buying it gives you and what it costs, like
// every other row in the game -- which leaves nowhere to read what you already
// have, and kit is the one purchase where that is the whole question. A helmet
// is worth buying because of how many are already on the rock; a rate upgrade
// never was.
//
// The bench puts a count of bodies on the same headings, and the two do not
// collide: over there a heading is a place you send people, here it is a place
// you leave kit, and the board itself says which building you are standing in.
//
// Worked off the row under the heading rather than a second table of places. A
// section here is one trade and a trade already knows what it is counted in, so
// a fifth trade is a line in `TRADES` and a line in `SCHOOL_SECTIONS` and this
// keeps working.
export const kitCount = title => {
  const sect = SCHOOL_SECTIONS.find(s => s.title === title);
  const t = sect && TRADES.find(x => x.key === sect.keys[0]);
  return t ? S[t.count] : 0;
};
