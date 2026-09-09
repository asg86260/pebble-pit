// The shack's own board: everything about the rock, read standing at the rock.
//
// The rockhands were the one trade in the yard with no building. Their two
// ladders, the multiplier over their swing and the machine that works their
// face were all sold from the work bench, and the bench's own comments said why
// in as many words -- "the rock is the one station with no board of its own".
// That was true and it is not any more, so the rows come here, where the rule
// every other station follows already put them: a decision about a place is
// made at the place.
//
// The row that *builds* it cannot live here -- there is no board to press
// before the hut is up -- so that one is on the bench with every other "open a
// place" row: see upgrades/rows-shack.js.
//
// Read from UPGRADES rather than copied, the way the crew board reads its gear
// (see `CREW_GEAR` in crewboard.js): these are the same row objects the game
// already prices, gates and builds, and moving a row between boards is a
// question of which sheet draws it and nothing else. Each of them carries
// `board: 'shack'`, which is also what takes it off the bench.

import { UPGRADES } from './upgrades.js';

// In the order the board reads them: what the gang swings, how often, the
// multiplier over that, and then the machine that does the same job without
// them -- the ladder first and the thing that climbs past it last.
export const SHACK_GEAR = ['rockhandpick', 'rockhandspeed', 'labswing', 'ram', 'tuneram'];

// Asked for when it is wanted, never gathered at load: upgrades.js reaches this
// file's neighbors on the way to building UPGRADES, so a list gathered in this
// module's body would come back `undefined`. Same trick, same reason, as
// `gearRows` in crewboard.js and `listFor` in board.js.
export const shackRows = () =>
  SHACK_GEAR.map(k => UPGRADES.find(u => u.key === k)).filter(Boolean);

// One heading, and it names the trade rather than the hut: the board is called
// "the shack" and what is for sale on it is the gear the rock miners swing, so
// the heading is drawn. `lone` in shop.js only folds a heading away when it
// repeats the board's own title, which this does not.
//
// The list itself, not a maker of lists: every other station's sections are a
// module-level constant, and `unsection` (hooks.js) proves a board still draws a
// row by taking its key out of the section that names it. Handed a fresh array
// on every call it edited a copy nothing would ever read again, so the shack's
// only row group was the one no check could reach.
export const SHACK_SECTIONS = [{ title: 'rock miners', keys: SHACK_GEAR }];
export const shackSections = () => SHACK_SECTIONS;
