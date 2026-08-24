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

export const tradeCost = t =>
  Math.round(TRADE_COST * Math.pow(TRADE_RATE, S[t.count]));

// Somebody already doing that job goes and learns it, so there has to be one of
// them who has not. Nobody is hired here and nobody changes job: the count of
// people on the rock is the same after as before, and one of them now has a hat.
const spare = t => S[t.job] - S[t.count];

function train(t) {
  if (spare(t) < 1) return;
  S[t.count]++;
  rebalance();
  syncWorkers();
}

export const SCHOOL_UPGRADES = TRADES.map(t => ({
  key: t.key,
  name: t.name,
  unit: null,
  from: () => S[t.count],
  to: () => S[t.count] + 1,
  cost: () => tradeCost(t),
  currency: 'shard',
  buy: () => train(t),
  // A trade with nobody on that job to teach it is a row that would take your
  // shards and change nothing. It is greyed by the board's own affording rule
  // when you cannot pay; this is the other half of it.
  show: () => S.schoolOpen && spare(t) > 0
}));

export const SCHOOL_SECTIONS = [
  { title: 'the rock', keys: ['breaker'] },
  { title: 'the dust', keys: ['carter'] },
  { title: 'the ground', keys: ['blaster', 'grower'] }
];
