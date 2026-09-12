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
import { RUNGS } from '../config.js';
import { rungCost } from '../upgrades.js';
import { STEP, levelOf, mult, workFor, finish } from '../mult.js';
import { invested } from './site.js';

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
// `site` says where it is worked, and by whom: the yard by default, which is a
// spare builder standing wherever the row's ground is. A row sold at a
// station's own board names that station instead, so the rule the boards
// already follow -- a decision about a place is made at the place -- holds
// for the work too, not just the purchase.
const ladder = ({ key, field, name, unit, does, cost, currency, board, site = 'yard', show, after }) => ({
  key,
  does,
  // The rung it sits under has to be finished first: a multiplier is the top of
  // the ladder it multiplies, not a rival row beside it. See `chained`.
  after,
  name,
  unit,
  pct: true,
  rung: () => levelOf(field),
  from: () => mult(field),
  to: () => mult(field) * STEP,
  rungs: () => RUNGS,
  cost,
  currency,
  kind: 'rung', site,
  board,
  // What it costs in somebody's time, climbing with the rung the way the price
  // does -- the same worker-seconds the research always asked for.
  work: () => workFor(key),
  buy: () => finish(key),
  show
});

// Every one of them waits on the yard being invested in.
//
// The lab was a building you bought before any multiplier was for sale, and that
// beat is worth keeping: a rate that multiplies the whole yard should cost you a
// decision first. The lab went, the trestle stood in for it, and the trestle has
// gone too -- so what these wait on is the decision itself rather than whichever
// building happens to be standing at that tier. See `invested` in site.js.
const standing = invested;

export const SWING_MULT = ladder({
  key: 'labswing', field: 'swing',
  // The rung it sits over is "speed" (rows-rock.js), so this one can be plain
  // "swing" -- it used to carry a × to keep the two apart when both wanted the
  // name.
  name: 'swing',
  unit: 'px/s',
  does: 'hit',
  cost: () => rungCost(15, levelOf('swing')),
  currency: 'shard',
  after: 'rockhandspeed3',
  // The shack draws it, directly under the rung it multiplies. The bench used
  // to, on the argument that the rock had no board of its own and the bench
  // stood at its flank -- which is the sentence the shack was built to make
  // false.
  board: 'shack',
  // And worked there, by one of the gang, the way its two rungs are (see
  // rows-rock.js). Left on the yard it had no ground of its own, so the guess
  // in `siteBox` centered it on the rock and a spare builder stood in the
  // middle of the boulder to fit a multiplier the hut had just sold.
  site: 'shack',
  // Not before a shard has been seen, or it is a row asking for a currency a
  // fresh yard has never been shown. See A8 in feedback3.md.
  show: () => standing() && S.seenShard
});

export const HAUL_MULT = ladder({
  key: 'labhaul', field: 'haul',
  name: 'pace ×',
  unit: 'px/s',
  does: 'walk',
  cost: () => rungCost(20, levelOf('haul')),
  currency: 'shard',
  after: 'haulpace3',
  // The bench, directly under the pace rung it multiplies -- the same shelf
  // `swing` sits on at the shack, for the same reason. It was sold at the
  // house for a while, which put the multiplier a board away from its rung.
  show: () => standing() && S.seenShard
});

// The cut's and the plots' used to be here too, sold as a rival row beside the
// rung each of them multiplied. They are band four of those ladders now -- the
// top of the only ladder rather than a second one -- and are built by
// `tierRows` in upgrades/tiers.js off the same `mult.js` machinery, keys and
// all. See DESIGN.md, "Band four is the multiplier".
export const MULT_ROWS = [SWING_MULT, HAUL_MULT];
