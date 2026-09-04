import { MACHINE_TUNE } from '../config.js';
import { tuneRow } from '../machines.js';

// The bench's tuning rows. Data only: upgrades.js strings the files together
// into UPGRADES, in this order.
export const TUNING_ROWS = [

  // The hole is not something you buy any more. It is the whole pit from the
  // first frame -- see pit.js: what you could hold used to be what you had dug,
  // which made a hole in the ground the ceiling on every other price in the game.
  //
  // What it used to sell was how *finely* the hole held it -- red bought a
  // smaller grain, so the same hole took four times as much and then nine. That
  // row is cut. It made the pile a grey slab and bought back 0.09 ms a frame,
  // which is to say nothing, and capacity was the wrong thing to sell in the
  // first place. What stands here instead is the rift: the overflow goes
  // somewhere else entirely, and what you buy is how fast it goes.
  // The ram's ladder and the belt's, on the boards their machines stand on --
  // the rock and the crew. Neither has a station board of its own, the rock
  // being the rock and carrying being what everybody does. Endless, like the
  // other two: see `tuneRow` in machines.js.
  tuneRow('ram', 'tune the ram',
          () => `the ram strikes ${MACHINE_TUNE}x harder, again`, 'yard'),
  tuneRow('belt', 'tune the belt',
          () => `the belt runs ${MACHINE_TUNE}x faster, again`, 'yard')
];
