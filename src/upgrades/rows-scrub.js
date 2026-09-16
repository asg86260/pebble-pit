import { scrubCost } from '../scrubhouse.js';
import { JOB } from '../jobs.js';
import { S, scrub } from '../state.js';
import { staffDoor } from './site.js';
import { offered } from '../stations.js';
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
    show: () => offered('scrub')
  }
];
