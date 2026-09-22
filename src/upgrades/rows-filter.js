import { filterCost } from '../filter.js';
import { JOB } from '../jobs.js';
import { S, filter } from '../state.js';
import { staffDoor } from './site.js';
import { offered } from '../stations.js';
import { lookAt, refreshPiles } from '../world.js';

// The bench's filter rows. Data only: upgrades.js strings the files together
// into UPGRADES, in this order.
export const FILTER_ROWS = [
  // The one building that undoes something instead of making something.
  {
    key: 'unlockfilter',
    kind: 'building', site: 'yard', at: () => filter.x + filter.w / 2,
    name: 'build the air filter',
    note: () => 'somebody in it pulls the haze back out of the sky, before it falls again',
    blurb: 'clears the sky',
    cost: () => filterCost(),
    // `refreshPiles`: the ground under its spout becomes a station's strip
    // the moment it is up.
    buy: () => { S.filterOpen = true; refreshPiles(); lookAt(filter.x + filter.w / 2); staffDoor(JOB.PURIFY); },
    show: () => offered('filter')
  }
];
