import { CASINO_DUST } from '../config.js';
import { S, casino } from '../state.js';
import { lookAt } from '../world.js';
import { offered } from '../stations.js';

// The bench's casino rows. Data only: upgrades.js strings the files together
// into UPGRADES, in this order.
export const CASINO_ROWS = [
  {
    key: 'unlockcasino',
    kind: 'building', site: 'yard', at: () => casino.x + casino.w / 2,
    name: 'build the casino',
    note: () => 'a table that takes a stake and pays double or nothing',
    blurb: 'double or nothing',
    cost: () => CASINO_DUST,
    buy: () => { S.casinoOpen = true; lookAt(casino.x + casino.w / 2); },
    show: () => offered('casino')
  }
];
