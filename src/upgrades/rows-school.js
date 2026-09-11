import { SCHOOL_COST, SCHOOL_DUST } from '../config.js';
import { S, school } from '../state.js';
import { lookAt } from '../world.js';

// The bench's school rows. Data only: upgrades.js strings the files together
// into UPGRADES, in this order.
export const SCHOOL_ROWS = [
  // Growing a place you already have does not move the view.
  //
  // Opening one does, and should: four cores and a row in a menu, and the thing
  // bought is off the left of the screen -- without the glide, nothing appears
  // to happen. A bench or a plot is not that. You are standing at the bench with
  // the board open, buying the next one and the one after that, and the view
  // walking off to the far end of the yard between each of them is the game
  // taking the board out from under you to show you something you have already
  // seen. Nothing here is a surprise worth interrupting for.
  //
  // The quarry's own two rows -- how deep it goes and how fast it works -- are on
  // a board at the quarry now, along with the farm's at the farm. See quarry.js.
  // The school is a building you put up, like the lab, and it is priced in what
  // the quarry gives so that the quarry's output has somewhere to go the day it
  // starts arriving.
  {
    key: 'unlockschool',
    kind: 'building', site: 'yard', at: () => school.x + school.w / 2,
    name: 'build the training grounds',
    note: () => 'makes the hats: a hat doubles whoever wears it at their station',
    // Priced in what the quarry gives, and in dust, because every row is priced
    // in dust -- see the note on the machine bills in config.js. This was the
    // one row in the game that asked for no dust at all.
    bill: () => [['shard', SCHOOL_COST], ['dust', SCHOOL_DUST]],
    cost: () => SCHOOL_DUST,
    buy: () => { S.schoolOpen = true; lookAt(school.x + school.w / 2); },
    show: () => S.seenShard && !S.schoolOpen
  }
];
