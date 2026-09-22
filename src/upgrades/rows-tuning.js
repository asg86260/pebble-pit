import { MACHINE_TUNE } from '../config.js';
import { tuneRow } from '../machines.js';

// The bench's tuning rows. Data only: upgrades.js strings the files together
// into UPGRADES, in this order.
export const TUNING_ROWS = [

  // The ram's ladder, beside the row that buys its machine, on the shack's
  // board. Three rungs of red (`tuneRow` in machines.js).
  //
  // The belt has no ladder. Its scoop only lifts what is lying loose, and the
  // rock's spoil lands on the band straight off the shovel (`catchBelt`), so a
  // faster scoop finds nothing faster: the rung bought nothing you could see.
  tuneRow('ram', 'ram strike',
          () => `the ram strikes ${MACHINE_TUNE}x harder`, 'yard', 'shack')
];
