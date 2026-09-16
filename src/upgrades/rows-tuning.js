import { MACHINE_TUNE } from '../config.js';
import { tuneRow } from '../machines.js';

// The bench's tuning rows. Data only: upgrades.js strings the files together
// into UPGRADES, in this order.
export const TUNING_ROWS = [

  // The ram's ladder and the belt's, each beside the row that buys its
  // machine: the ram's on the shack's board, the belt's on the bench under the
  // haulers' heading. Endless (`tuneRow` in machines.js).
  tuneRow('ram', 'tune the ram',
          () => `the ram strikes ${MACHINE_TUNE}x harder, again`, 'yard', 'shack'),
  tuneRow('belt', 'tune the belt',
          () => `the belt runs ${MACHINE_TUNE}x faster, again`, 'yard')
];
