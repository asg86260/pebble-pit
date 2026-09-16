import { QUARRY_CORES, QUARRY_DUST } from '../config.js';
import { JOB } from '../jobs.js';
import { quarry } from '../state.js';
import { site } from './site.js';

// One place at a time, and the plots earn the quarry: each site is a surprise
// the last one earns.
const CAVE = site({
  key: 'quarry', name: 'build the quarry',
  note: () => 'start digging for ore',
  blurb: 'dig for ore',
  cores: QUARRY_CORES, dust: QUARRY_DUST,
  at: () => quarry.x + quarry.w / 2,
  job: JOB.QUARRY
});

// The bench's quarry rows. Data only: upgrades.js strings the files together
// into UPGRADES, in this order. The rift is sold from the tower (tower.js).
export const QUARRY_ROWS = [

  CAVE
];
