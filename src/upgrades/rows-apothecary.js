import { APOTHECARY_CORES, APOTHECARY_DUST, APOTH_HUT_W } from '../config.js';
import { JOB } from '../jobs.js';
import { apothecary } from '../state.js';
import { site } from './site.js';

// The bench's apothecary rows. Data only: upgrades.js strings the files together
// into UPGRADES, in this order.
export const APOTHECARY_ROWS = [

  // Opens once the plots are broken; it is the reason they are worth breaking
  // (DESIGN.md, "The apothecary").
  site({
    key: 'apothecary', name: 'build the apothecary',
    note: () => 'brew temporary boosts for your sqworkers',
    blurb: 'brews crew tonics',
    cores: APOTHECARY_CORES, dust: APOTHECARY_DUST, job: JOB.STIR,
    // Built at the hut, not the middle of the plot, which is bare ground
    // between the hut and the pots.
    at: () => apothecary.x + APOTH_HUT_W / 2
  })
];
