import { OUTHOUSE_DUST } from '../config.js';
import { JOB } from '../jobs.js';
import { S, outhouse } from '../state.js';
import { staffDoor } from './site.js';
import { offered } from '../stations.js';
import { lookAt } from '../world.js';

// The bench's outhouse row. Data only: upgrades.js strings the files together
// into UPGRADES, in this order. On the bench like every "open a place" row:
// the row that opens a place cannot sit on the board of the place it opens.
export const OUTHOUSE_ROWS = [
  {
    key: 'unlockouthouse',
    kind: 'building', site: 'yard', at: () => outhouse.x + outhouse.w / 2,
    // Keys, ids and save fields say outhouse; the player is sold a closet.
    name: "build the janitor's closet",
    note: () => 'you\'ve seen enough poop, lets clean it up',
    blurb: 'poop, cleaned up',
    cost: () => OUTHOUSE_DUST,
    buy: () => { S.outhouseOpen = true; lookAt(outhouse.x + outhouse.w / 2); staffDoor(JOB.JANITOR); },
    show: () => offered('outhouse')
  }
];
