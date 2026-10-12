import { filterCost } from '../filter.js';
import { S, filter } from '../state.js';
import { offered } from '../stations.js';
import { giveCraft } from '../balloon.js';
import { staffDoor } from '../staffing.js';
import { JOB } from '../jobs.js';
import { lookAt } from '../world.js';

// The bench's filter rows. Data only: upgrades.js strings the files together
// into UPGRADES, in this order.
export const FILTER_ROWS = [
  // The one building that undoes something instead of making something.
  {
    key: 'unlockfilter',
    kind: 'building', site: 'yard', at: () => filter.x + filter.w / 2,
    name: 'build the air filter',
    note: () => 'sells the balloons that pull the haze back out of the sky, and reads the sky',
    blurb: 'clears the sky',
    cost: () => filterCost(),
    buy: () => {
      S.filterOpen = true;
      lookAt(filter.x + filter.w / 2);
      // The house comes with its first balloon, and a body to ride it.
      if (giveCraft()) staffDoor(JOB.PURIFY);
    },
    show: () => offered('filter')
  }
];
