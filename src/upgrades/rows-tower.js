import { TOWER_CORES, TOWER_DUST } from '../config.js';
import { S, tower } from '../state.js';
import { lookAt } from '../world.js';
import { shieldOpened } from '../shield.js';

// The bench's tower rows. Data only: upgrades.js strings the files together
// into UPGRADES, in this order.
export const TOWER_ROWS = [
  // The one thing a core buys, and the only row in the game with a bill rather
  // than a price. A core out of the rock, the dust the yard makes, the stone the
  // cut gives up and the crop off the plots: everything the operation does, on
  // one row. You cannot buy it by being good at one thing.
  {
    key: 'unlocktower',
    kind: 'building', site: 'yard', at: () => tower.x + tower.w / 2,
    name: 'discover the tower',
    note: () => 'train some wizards',
    bill: () => [['core', TOWER_CORES], ['dust', TOWER_DUST]],
    cost: () => TOWER_DUST,                      // for anything that asks in one coin
    // Raising it raises a tower and nothing else. It used to call the first star
    // down with it, which put the sky there before there was anybody who could
    // reach it -- and made the wizards people who take an existing thing apart,
    // when making it is the whole of what they do. The first hat out of this
    // tower summons the first star, the same way every hat after it summons the
    // next one. See `stepTower`.
    buy: () => {
      S.towerOpen = true;
      lookAt(tower.x + tower.w / 2);
    },
    // Not offered until the ground is finished: the plots, the cut and the lab
    // all standing, and a core seen.
    //
    // A core is a core, so as soon as one was banked the tower stood on the
    // bench beside the plots -- and it is the most interesting row on the board
    // by a mile, so it took the whole chain in one step. The tower is the thing
    // that comes *after* the yard works: it is what a finished ground buys, and
    // the star it reaches is the tier above everything on the floor. Sold before
    // the lab, it is a wizard summoned by somebody with no quarry.
    //
    // Each of the three earns the next -- see the doors above -- and this is the
    // end of that chain rather than a fourth thing competing with it.
    //
    // What the arch's failure opens: rock cannot hold rock, nothing of the
    // ground will, and the tower is the first thing in the yard not of the
    // ground (DESIGN.md, "The shields are the spine"). The arch needs the
    // quarry and the quarry the farm, so the places before it are still
    // before it; the gate names the shield rather than the places because the
    // shield is the reason.
    show: () => !S.towerOpen && S.seenCore && shieldOpened('arch')
  }
];
