import { FARM_CORES, FARM_DUST } from '../config.js';
import { S, farm } from '../state.js';
import { nearly, seenACore, site } from './site.js';

const FARM = site({
  key: 'unlockfarm', name: 'break the ground',
  cores: FARM_CORES, dust: FARM_DUST, open: 'farmOpen',
  at: () => farm.x + farm.w / 2,                   // show them what they just bought
  show: () => !S.farmOpen && seenACore() && nearly(FARM_DUST)
});

// The bench's farm rows. Data only: upgrades.js strings the files together
// into UPGRADES, in this order.
export const FARM_ROWS = [
  FARM
];
