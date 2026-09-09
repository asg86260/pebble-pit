import { SHACK_DUST, SHACK_WORK } from '../config.js';
import { S, shack } from '../state.js';
import { lookAt } from '../world.js';
import { nearly } from './site.js';

// The bench's shack row. Data only: upgrades.js strings the files together into
// UPGRADES, in this order.
//
// On the bench like every other "open a place" row, and for the same reason
// they are all there: the row that opens a place cannot sit on the board of the
// place it opens, because there is nowhere to press it. Everything else about
// the rock has moved to the shack's own sheet -- see shack.js.
export const SHACK_ROWS = [
  {
    key: 'unlockshack',
    kind: 'building', site: 'yard', at: () => shack.x + shack.w / 2,
    name: 'put up the shack',
    note: () => 'somewhere for the gang to keep their gear.',
    cost: () => SHACK_DUST,
    // A third of what a building takes. It is a third of a building, and it is
    // the first thing most players will ever put up: a first build that outlasts
    // your patience teaches you that building things is not worth it.
    work: () => SHACK_WORK,
    buy: () => { S.shackOpen = true; lookAt(shack.x + shack.w / 2); },
    // Offered once there is a gang to keep gear for -- the condition the rows
    // inside it already carry -- and once the price is within reach, which is
    // the rule every other door on this board follows: a price you have no idea
    // is coming is a price you cannot save for. See `nearly` in site.js.
    //
    // In practice the money is the gate. The yard starts with one pair of hands,
    // so the crew clause is only ever false in a save that has none; what
    // actually puts this row on the board is the first seventy-five grains in
    // the hole, which is early, and meant to be -- this is the first thing most
    // players will ever put up.
    // Split the way every other door on this board is split: `once` reveals and
    // `show` retires. `nearly` reads the dust in the hole, so asked as `show` the
    // row came and went every time you spent on anything at all -- which walked
    // the bench sideways for a reason that had nothing to do with the shack. See
    // `revealed` in shop.js.
    once: () => S.crew > 0 && nearly(SHACK_DUST),
    show: () => !S.shackOpen
  }
];
