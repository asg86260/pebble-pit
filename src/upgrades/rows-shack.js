import { SHACK_DUST, SHACK_WORK } from '../config.js';
import { S, shack } from '../state.js';
import { lookAt } from '../world.js';
import { nearly } from './site.js';

// The bench's shack row. Data only: upgrades.js strings the files together into
// UPGRADES, in this order. On the bench like every "open a place" row: the
// row that opens a place cannot sit on the board of the place it opens.
export const SHACK_ROWS = [
  {
    key: 'unlockshack',
    kind: 'building', site: 'yard', at: () => shack.x + shack.w / 2,
    name: 'build the shack',
    note: () => 'Digging upgrades',
    blurb: 'gear for the rock',
    cost: () => SHACK_DUST,
    // A third of a building: the first thing most players ever put up.
    work: () => SHACK_WORK,
    buy: () => { S.shackOpen = true; lookAt(shack.x + shack.w / 2); },
    // `once` reveals and `show` retires: `nearly` reads the dust in the hole,
    // and as a `show` the row came and went every time you spent (`revealed`
    // in shop.js).
    once: () => S.crew > 0 && nearly(SHACK_DUST),
    show: () => !S.shackOpen
  }
];
