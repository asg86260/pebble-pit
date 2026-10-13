import { CASINO_DUST } from '../config.js';
import { S, casino } from '../state.js';
import { lookAt } from '../world.js';
import { offered } from '../stations.js';
import { msg } from '../lang.js';

// The bench's casino rows. Data only: upgrades.js strings the files together
// into UPGRADES, in this order.
export const CASINO_ROWS = [
  {
    key: 'unlockcasino',
    kind: 'building', site: 'yard', at: () => casino.x + casino.w / 2,
    name: msg('row-unlockcasino'),
    note: () => msg('row-unlockcasino-note'),
    blurb: msg('row-unlockcasino-blurb'),
    cost: () => CASINO_DUST,
    buy: () => { S.casinoOpen = true; lookAt(casino.x + casino.w / 2); },
    show: () => offered('casino')
  }
];
