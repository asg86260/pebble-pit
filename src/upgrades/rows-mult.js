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

// There are no multiplier rows here any more.
//
// The crew's two -- the swing over the diggers' speed (and your own click), the
// pace over the haulers' walk -- were a second ladder over a number that
// already had one, sold in shards under a row that had just finished: exactly
// the shape the hauler merge took out (load then a harness, pace then boots).
// Dropped 2026-09-12. The grounds' four multipliers are band four of their own
// ladders, built by `tierRows` in upgrades/tiers.js off `mult.js`, keys and
// all -- see DESIGN.md, "Band four is the multiplier". A save carrying
// `S.mult.swing` or `S.mult.haul` reads them and nothing multiplies by them.
export const MULT_ROWS = [];
