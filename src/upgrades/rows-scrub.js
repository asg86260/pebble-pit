import { MACHINES, running } from '../machines.js';
import { scrubCost } from '../scrubhouse.js';
import { S, scrub } from '../state.js';
import { lookAt, refreshPiles } from '../world.js';

// The bench's scrub rows. Data only: upgrades.js strings the files together
// into UPGRADES, in this order.
export const SCRUB_ROWS = [
  // The one building that undoes something instead of making something. It is
  // offered the first time the sky is visibly dirty rather than on a schedule:
  // the haze is the advertisement, and a row selling you a cure for a thing you
  // have not noticed yet is a row that means nothing.
  {
    key: 'unlockscrub',
    kind: 'building', site: 'yard', at: () => scrub.x + scrub.w / 2,
    name: 'build the scrubbing house',
    note: () => 'somebody in it pulls the haze back out of the sky, before it falls again',
    cost: () => scrubCost(),
    // and the ground under its spout becomes a station's strip the moment it is
    // up: what the house makes has to have somewhere of its own to heap.
    buy: () => { S.scrubOpen = true; refreshPiles(); lookAt(scrub.x + scrub.w / 2); },
    // Offered after the first rain, and after the lab has been told to watch the
    // sky. Two things have to have happened, in that order, and neither of them
    // is a threshold quietly passing somewhere.
    //
    // The rain is the problem arriving. Until it has come down once, the haze
    // overhead is a thing you have noticed and not a thing that has cost you
    // anything, and a cure sold before the disease is a cure for a number.
    //
    // The readout is you going and looking into it. It is the one piece of
    // research in the lab that is not a multiplier: it tells you how fast the yard
    // fouls, how fast a house would clean, and how long you have. Making it the
    // key to the building means you buy the house knowing what it has to keep up
    // with -- and it means the answer to a bad sky is a walk to the lab first,
    // which is what the lab is for.
    //
    // It was a share of the way to a downpour before, which is a threshold nobody
    // can see passing, and at a quarter it was twenty minutes of honest work: a
    // quarter of an hour watching the sky dirty with nothing on any board about
    // it, which reads as the game not having noticed.
    // ...and after the first machine is running.
    //
    // That is the third thing, and it is the one that makes the house an answer
    // rather than a chore. Hand labour dirties the sky slowly; a machine dirties
    // it three times over per unit of work and never stops for a cigarette. Sold
    // before then, the house is a building you buy to fix a number that was
    // creeping; sold after, it is the bill for the thing you just switched on --
    // and the two land in the same part of the game, which is what the smoke
    // curve in DESIGN.md is trying to arrange.
    show: () => !S.scrubOpen && S.rains > 0 && S.seenAir && MACHINES.some(m => running(m.key))
  }
];
