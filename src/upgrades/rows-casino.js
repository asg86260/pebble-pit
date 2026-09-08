import { CASINO_DUST } from '../config.js';
import { S, casino } from '../state.js';
import { lookAt } from '../world.js';

// The bench's casino rows. Data only: upgrades.js strings the files together
// into UPGRADES, in this order.
export const CASINO_ROWS = [
  {
    key: 'unlockcasino',
    kind: 'building', site: 'yard', at: () => casino.x + casino.w / 2,
    name: 'build the casino',
    cost: () => CASINO_DUST,
    buy: () => { S.casinoOpen = true; lookAt(casino.x + casino.w / 2); },
    // Gated on the trestle rather than on the lab, which is gone. It lands at
    // about the tier the lab used to and is now the yard's "you have invested
    // in this place" beat -- the same thing the lab was doing here.
    show: () => S.buildbenchOpen && !S.casinoOpen
  }
];
