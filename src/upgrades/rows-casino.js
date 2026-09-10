import { CASINO_DUST } from '../config.js';
import { S, casino } from '../state.js';
import { lookAt } from '../world.js';
import { invested } from './site.js';

// The bench's casino rows. Data only: upgrades.js strings the files together
// into UPGRADES, in this order.
export const CASINO_ROWS = [
  {
    key: 'unlockcasino',
    kind: 'building', site: 'yard', at: () => casino.x + casino.w / 2,
    name: 'build the casino',
    cost: () => CASINO_DUST,
    buy: () => { S.casinoOpen = true; lookAt(casino.x + casino.w / 2); },
    // The yard's "you have invested in this place" beat -- see `invested`.
    show: () => invested() && !S.casinoOpen
  }
];
