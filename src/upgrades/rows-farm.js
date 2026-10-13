import { FARM_DUST } from '../config.js';
import { JOB } from '../jobs.js';
import { farm } from '../state.js';
import { site } from './site.js';
import { msg } from '../lang.js';

const FARM = site({
  key: 'farm', name: msg('row-unlockfarm'),
  note: () => msg('row-unlockfarm-note'),
  blurb: msg('row-unlockfarm-blurb'),
  dust: FARM_DUST, job: JOB.FARM,
  at: () => farm.x + farm.w / 2                    // show them what they just bought
});

// The bench's farm rows. Data only: upgrades.js strings the files together
// into UPGRADES, in this order.
export const FARM_ROWS = [
  FARM
];
