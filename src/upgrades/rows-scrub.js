import { MACHINES, running } from '../machines.js';
import { scrubCost } from '../scrubhouse.js';
import { JOB } from '../jobs.js';
import { S, scrub } from '../state.js';
import { staffDoor } from './site.js';
import { lookAt, refreshPiles } from '../world.js';

// The bench's scrub rows. Data only: upgrades.js strings the files together
// into UPGRADES, in this order.
export const SCRUB_ROWS = [
  // The one building that undoes something instead of making something.
  {
    key: 'unlockscrub',
    kind: 'building', site: 'yard', at: () => scrub.x + scrub.w / 2,
    name: 'build the scrubbing house',
    note: () => 'somebody in it pulls the haze back out of the sky, before it falls again',
    blurb: 'clears the sky',
    cost: () => scrubCost(),
    // `refreshPiles`: the ground under its spout becomes a station's strip
    // the moment it is up.
    buy: () => { S.scrubOpen = true; refreshPiles(); lookAt(scrub.x + scrub.w / 2); staffDoor(JOB.PURIFY); },
    // Offered after the first rain (the problem arriving), after the sky's
    // readout has been seen (you know what the house has to keep up with),
    // and after the first machine is running, which is what makes the house
    // the bill for the thing you just switched on rather than a chore.
    show: () => !S.scrubOpen && S.rains > 0 && S.seenAir && MACHINES.some(m => running(m.key))
  }
];
