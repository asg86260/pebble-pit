import { FARM_CORES, FARM_DUST } from '../config.js';
import { JOB } from '../jobs.js';
import { S, farm } from '../state.js';
import { nearly, seenACore, site } from './site.js';
import { shieldOpened } from '../shield.js';

const FARM = site({
  key: 'unlockfarm', name: 'build the farm',
  note: () => 'grow some crops',
  blurb: 'crops, green coin',
  cores: FARM_CORES, dust: FARM_DUST, open: 'farmOpen', job: JOB.FARM,
  at: () => farm.x + farm.w / 2,                   // show them what they just bought
  // `once`, not `show`: `nearly` reads the dust in the hole, and as a `show`
  // the door came and went every time you spent (`revealed` in shop.js). Not
  // before the props have failed: the farm is what they open (DESIGN.md, "The
  // shields are the spine"), unless SHIELD_GATES is off.
  once: () => shieldOpened('props') && seenACore() && nearly(FARM_DUST),
  show: () => !S.farmOpen
});

// The bench's farm rows. Data only: upgrades.js strings the files together
// into UPGRADES, in this order.
export const FARM_ROWS = [
  FARM
];
