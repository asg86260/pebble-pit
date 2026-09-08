// The yard's four multipliers, each sold at the thing it multiplies.
//
// They were the lab's, and they were the lab: its own section in DESIGN.md said
// it sells "faster" where the bench sells "more", and that it is the only place
// a multiplier lives. That is the whole building, so taking the multipliers out
// of it and keeping the room was never one of the options -- see "The lab is
// deleted". What is left of the lab is here and at the four boards that draw
// these rows.
//
// Each one sits under the ladder it multiplies, which is the thing three
// separate boards made impossible to see: the bench, the school and the lab all
// sold a row called "speed" for the crew, under a heading called "the crew", and
// telling them apart meant holding three boards in your head across a walk.
//
// The keys keep their old names. They are internal -- `S.seenRows`, `S.siteDone`
// and a work coming back out of a save all quote them -- and renaming a key
// would strand a piece of research that was in flight when the game was saved.
// The same call the outhouse made when it stopped being called that.
import { S } from '../state.js';
import { RUNGS, LAB_CAVE_COST, LAB_TEND_COST } from '../config.js';
import { rungCost } from '../upgrades.js';
import { STEP, levelOf, mult, workFor, finish } from '../mult.js';

// A multiplier's row, which is the same row four times over a different rate.
//
// `site: 'yard'` is the change that lets the lab go. Buying one of these still
// starts a piece of work that bodies have to stand and finish -- that was the
// lab's actual bargain, and DESIGN.md is blunt about it: "a multiplier you can
// simply buy is a number; a multiplier that costs you four bodies off the rock
// for a minute is a decision". It is a BUILD now, done by builders, because
// works.js already drove the lab and the yard through one engine --
// `handsAt(site) * effortAt(site)` -- and the lab was a second name for it.
//
// `board` says which sheet draws it; the bench takes the rows that name none.
const ladder = ({ key, field, name, unit, cost, currency, board, show }) => ({
  key,
  name,
  unit,
  pct: true,
  rung: () => levelOf(field),
  from: () => mult(field),
  to: () => mult(field) * STEP,
  rungs: () => RUNGS,
  cost,
  currency,
  kind: 'rung', site: 'yard',
  board,
  // What it costs in somebody's time, climbing with the rung the way the price
  // does -- the same worker-seconds the research always asked for.
  work: () => workFor(key),
  buy: () => finish(key),
  show
});

// Every one of them waits on the construction bench.
//
// The lab was a building you bought before any multiplier was for sale, and that
// beat is worth keeping: a rate that multiplies the whole yard should cost you a
// decision first. The trestle is the thing that does the work now, it lands at
// about the tier the lab used to (a core and some thousands of dust), and it is
// the honest gate -- you cannot research without somewhere to research from.
const standing = () => S.buildbenchOpen;

export const SWING_MULT = ladder({
  key: 'labswing', field: 'swing',
  // Beside "swing" on the rock, so the two cannot both be called it. The mark
  // says which is the rung and which is the multiplier over it, and it is the
  // one new character these boards have taken on.
  name: 'swing ×',
  unit: 'px/s',
  cost: () => rungCost(3, levelOf('swing')),
  currency: 'shard',
  // The bench draws it: the rock has no board of its own, and the bench stands
  // at the rock's left flank, which is what makes it the rock's board.
  board: undefined,
  // Not before a shard has been seen, or it is a row asking for a currency a
  // fresh yard has never been shown. See A8 in feedback3.md.
  show: () => standing() && S.seenShard
});

export const HAUL_MULT = ladder({
  key: 'labhaul', field: 'haul',
  name: 'speed ×',
  unit: 'px/s',
  cost: () => rungCost(4, levelOf('haul')),
  currency: 'shard',
  board: 'house',
  show: () => standing() && S.seenShard
});

export const QUARRY_MULT = ladder({
  key: 'labcave', field: 'quarry',
  name: 'speed ×',
  unit: 'trips/min',
  cost: () => rungCost(LAB_CAVE_COST, levelOf('quarry')),
  currency: 'spore',
  // Drawn by the quarry's own board, which builds its list directly rather than
  // filtering UPGRADES -- so this one is named in QUARRY_SECTIONS instead.
  board: 'quarry',
  show: () => standing() && S.quarryOpen
});

export const FARM_MULT = ladder({
  key: 'labtend', field: 'tend',
  name: 'speed ×',
  unit: 'plots/min',
  cost: () => rungCost(LAB_TEND_COST, levelOf('tend')),
  currency: 'spore',
  board: 'farm',
  show: () => standing() && S.seenSpore
});

export const MULT_ROWS = [SWING_MULT, HAUL_MULT, QUARRY_MULT, FARM_MULT];
