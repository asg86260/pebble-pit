import { LOO_MUCK, OUTHOUSE_DUST } from '../config.js';
import { JOB } from '../jobs.js';
import { S, outhouse } from '../state.js';
import { staffDoor } from './site.js';
import { poopLeft } from '../smog.js';
import { lookAt } from '../world.js';

// The bench's outhouse row. Data only: upgrades.js strings the files together
// into UPGRADES, in this order.
//
// On the bench like every other "open a place" row, and for the same reason
// they are all here: the row that opens a place cannot sit on the board of the
// place it opens, because there is nowhere to press it. It lived on the
// janitor's closet for a while -- a stand nobody bought, invented exactly so
// this row had somewhere to be -- and the closet is gone: the outhouse is the
// one building the janitor's trade has, the shed that keeps the caps and the
// brooms as well as the seat, and its own board sells the rest of the ladder.
export const OUTHOUSE_ROWS = [
  {
    key: 'unlockouthouse',
    kind: 'building', site: 'yard', at: () => outhouse.x + outhouse.w / 2,
    // The building keeps its internal name -- keys, ids and save fields all say
    // outhouse -- but the player is sold a janitor's closet (wave7-crew, item 10).
    name: "build the janitor's closet",
    note: () => 'you\'ve seen enough poop, lets clean it up',
    cost: () => OUTHOUSE_DUST,
    // ...and one spare body picks up a cap, the way every door sends one (see `staffDoor`).
    buy: () => { S.outhouseOpen = true; lookAt(outhouse.x + outhouse.w / 2); staffDoor(JOB.JANITOR); },
    // Offered once you have seen why you want one -- which is a thing you can
    // point at rather than a guess about how far along you are.
    //
    // It used to appear on a headcount and a fraction of its price, which is the
    // game deciding you are ready. What makes somebody want a janitor is five
    // patches of mess on the ground that nobody is clearing up, so that is what
    // puts it on the board. It stays once seen: a yard that had five and then
    // was tidied is a yard that has learned what the job is for.
    show: () => !S.outhouseOpen && (S.seenMess || poopLeft() >= LOO_MUCK * 5)
  }
];
