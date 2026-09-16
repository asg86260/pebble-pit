import { FARM_CORES, FARM_DUST } from '../config.js';
import { JOB } from '../jobs.js';
import { farm } from '../state.js';
import { site } from './site.js';

const FARM = site({
  key: 'farm', name: 'build the farm',
  note: () => 'grow some crops',
  blurb: 'crops, green coin',
  cores: FARM_CORES, dust: FARM_DUST, job: JOB.FARM,
  at: () => farm.x + farm.w / 2                    // show them what they just bought
});

// The bench's farm rows. Data only: upgrades.js strings the files together
// into UPGRADES, in this order.
export const FARM_ROWS = [
  FARM
];
