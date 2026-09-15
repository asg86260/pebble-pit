import { APOTHECARY_CORES, APOTHECARY_DUST, APOTH_HUT_W } from '../config.js';
import { S, apothecary } from '../state.js';
import { site } from './site.js';

// The bench's apothecary rows. Data only: upgrades.js strings the files together
// into UPGRADES, in this order.
export const APOTHECARY_ROWS = [

  // The apothecary: a pot on a fire, standing right after the farm whose crop it
  // takes. It opens once the plots are broken -- it is the reason they are worth
  // breaking -- and it is priced the farm's way, a core and a little dust, because
  // it stands early, not late. See DESIGN.md, "The apothecary".
  site({
    key: 'unlockapothecary', name: 'build the apothecary',
    note: () => 'brew temporary boosts for your sqworkers',
    cores: APOTHECARY_CORES, dust: APOTHECARY_DUST, open: 'apothecaryOpen',
    // Built at the hut, not at the middle of the plot. The building is the hut;
    // the shelves and the row of pots to its right are what the hut goes on to
    // fill, and the middle of all that is bare ground with nothing standing on
    // it (item 17).
    at: () => apothecary.x + APOTH_HUT_W / 2,
    show: () => !S.apothecaryOpen && S.farmOpen && S.seenSpore
  })
];
