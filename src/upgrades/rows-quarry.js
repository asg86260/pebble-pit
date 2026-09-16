import { QUARRY_CORES, QUARRY_DUST } from '../config.js';
import { JOB } from '../jobs.js';
import { S, quarry } from '../state.js';
import { site } from './site.js';
import { shieldOpened } from '../shield.js';

// One place at a time, and the plots earn the quarry: each site is a surprise
// the last one earns.
const CAVE = site({
  key: 'unlockquarry', name: 'build the quarry',
  note: () => 'start digging for ore',
  blurb: 'ore, blue coin',
  cores: QUARRY_CORES, dust: QUARRY_DUST, open: 'quarryOpen',
  at: () => quarry.x + quarry.w / 2,
  // The net's failure opens it; `shieldOpened` keeps the chain whether or not
  // the shields are doors (SHIELD_GATES).
  show: () => shieldOpened('net') && S.seenCore && !S.quarryOpen,
  job: JOB.QUARRY
});

// The bench's quarry rows. Data only: upgrades.js strings the files together
// into UPGRADES, in this order. The rift is sold from the tower (tower.js).
export const QUARRY_ROWS = [

  CAVE
];
