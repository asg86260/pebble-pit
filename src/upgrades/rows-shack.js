import { SHACK_DUST, SHACK_WORK } from '../config.js';
import { S, shack } from '../state.js';
import { lookAt } from '../world.js';
import { open, offered } from '../stations.js';

// The bench's shack row. Data only: upgrades.js strings the files together into
// UPGRADES, in this order. On the bench like every "open a place" row: the
// row that opens a place cannot sit on the board of the place it opens.
export const SHACK_ROWS = [
  {
    key: 'unlockshack',
    kind: 'building', site: 'yard', at: () => shack.x + shack.w / 2,
    // The hut's LIVE rect, not the slot the walk reserved (`S.placed.shack`):
    // `shackSpot` in world.js pulls the hut in toward the rock that is here,
    // and the tape, the bar and the builder must stand where it rises.
    box: () => ({ x: shack.x, w: shack.w, y: shack.y, h: shack.h }),
    name: 'build the shack',
    note: () => 'Digging upgrades',
    blurb: 'gear for the rock',
    cost: () => SHACK_DUST,
    // A third of a building: the first thing most players ever put up.
    work: () => SHACK_WORK,
    buy: () => { S.shackOpen = true; lookAt(shack.x + shack.w / 2); },
    // `once` reveals and `show` retires: the shack is a sticky door (its row
    // in stations.js), held by `revealed` in shop.js.
    once: () => offered('shack'),
    show: () => !open('shack')
  }
];
