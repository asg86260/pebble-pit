import { FARM_CORES, FARM_DUST } from '../config.js';
import { S, farm } from '../state.js';
import { nearly, seenACore, site } from './site.js';

const FARM = site({
  key: 'unlockfarm', name: 'break the ground',
  cores: FARM_CORES, dust: FARM_DUST, open: 'farmOpen',
  at: () => farm.x + farm.w / 2,                   // show them what they just bought
  // Revealed once you have been within reach of the price, and then it stays:
  // `nearly` reads the dust in the hole, so before this was split the door came
  // and went every time you spent, which walked the whole bench board sideways
  // for a reason that had nothing to do with the farm. See `revealed` in shop.js.
  once: () => seenACore() && nearly(FARM_DUST),
  show: () => !S.farmOpen
});

// The bench's farm rows. Data only: upgrades.js strings the files together
// into UPGRADES, in this order.
export const FARM_ROWS = [
  FARM
];
