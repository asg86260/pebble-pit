// The shack's own board: everything about the rock, read standing at the rock.
//
// The row that *builds* it cannot live here (there is no board to press before
// the hut is up), so that one is on the bench: upgrades/rows-shack.js.
//
// Read from UPGRADES rather than copied: these are the same row objects the
// game prices, gates and builds. Each carries `board: 'shack'`, which is also
// what takes it off the bench.

import { UPGRADES } from './upgrades.js';
import { registerBoard } from './boardrows.js';
import { S } from './state.js';

// In the order the board reads them: the ladder first, the machine that climbs
// past it last. The breaker's helmets sit between the ladder and the ram they
// are the price of: kit is sold where it is worn (upgrades/rows-kit.js).
export const SHACK_GEAR = ['rockhandpick', 'rockhandspeed', 'breaker', 'ram', 'tuneram'];

// Asked for when it is wanted, never gathered at load: upgrades.js reaches this
// file's neighbors on the way to building UPGRADES, so a list gathered in this
// module's body would come back `undefined`. Same as `listFor` in board.js.
export const shackRows = () =>
  SHACK_GEAR.map(k => UPGRADES.find(u => u.key === k)).filter(Boolean);

// The heading names the trade, not the hut, so `lone` in shop.js draws it.
//
// The list itself, not a maker of lists: `unsection` (hooks.js) proves a board
// still draws a row by taking its key out of the section that names it, and a
// fresh array on every call would hand it a copy nothing reads again.
export const SHACK_SECTIONS = [{ title: 'diggers', keys: SHACK_GEAR }];
export const shackSections = () => SHACK_SECTIONS;

registerBoard('shack', { rows: shackRows, sections: shackSections, count: () => S.rockhands });
