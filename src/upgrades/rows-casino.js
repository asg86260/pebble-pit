import { CASINO_DUST, PLINKO_DUST, WORK_BASE } from '../config.js';
import { S, casino } from '../state.js';
import { lookAt } from '../world.js';
import { invested } from './site.js';
import { plinkoBox } from '../casino.js';

// The bench's casino rows. Data only: upgrades.js strings the files together
// into UPGRADES, in this order.
export const CASINO_ROWS = [
  {
    key: 'unlockcasino',
    kind: 'building', site: 'yard', at: () => casino.x + casino.w / 2,
    name: 'build the casino',
    note: () => 'a table that takes a stake and pays double or nothing',
    cost: () => CASINO_DUST,
    buy: () => { S.casinoOpen = true; lookAt(casino.x + casino.w / 2); },
    // The yard's "you have invested in this place" beat -- see `invested`.
    show: () => invested() && !S.casinoOpen
  },
  // The drop: the board on the roof. A building's worth of work, put up by the
  // yard's spare hands like the rest of them -- but it raises nothing on the
  // ground, so it is not in OPENS_PLACE and claims no slot in the walk; it
  // says what it raises itself, the way the bench does, and its box is the
  // tower's rect on the roof. See DESIGN.md, "The drop".
  {
    key: 'unlockplinko',
    kind: 'building', site: 'yard', at: () => casino.x + casino.w / 2,
    work: () => WORK_BASE.building,
    box: () => plinkoBox(),      // read late: casino.js may still be loading when this row is built
    raises: 'plinko',
    name: 'raise the drop',
    note: () => 'a board of pegs on the roof: one rock, eleven bins, half to thirty-nine times',
    cost: () => PLINKO_DUST,
    buy: () => { S.plinkoOpen = true; lookAt(casino.x + casino.w / 2); },
    show: () => S.casinoOpen && !S.plinkoOpen
  }
];
