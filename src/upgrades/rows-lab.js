import { LAB_DUST } from '../config.js';
import { S, lab } from '../state.js';
import { site } from './site.js';

// The bench's lab rows. Data only: upgrades.js strings the files together
// into UPGRADES, in this order.
export const LAB_ROWS = [
  // A place like the other three, and priced like one: a core says so, and
  // dust on top of it like every row in the game. It used to ask for dust
  // alone, which put "the lab" on the same shelf as a rate upgrade -- see
  // DESIGN.md's "cores buy places, and only places". Built with `site(...)`
  // rather than written out by hand, so it gets the same bill shape the quarry
  // and the farm already have.
  site({
    key: 'unlocklab', name: 'build the lab',
    cores: 2, dust: LAB_DUST, open: 'labOpen',
    at: () => lab.x + lab.w / 2,
    // Still behind the quarry or the plots: the lab multiplies what a place does, so
    // it means nothing until there is a second place for it to be about.
    show: () => !S.labOpen && (S.seenShard || S.seenSpore)
  })
];
