import { TOWER_CORES, TOWER_DUST } from '../config.js';
import { S, tower } from '../state.js';
import { lookAt } from '../world.js';
import { offered } from '../stations.js';

// The bench's tower rows. Data only: upgrades.js strings the files together
// into UPGRADES, in this order.
export const TOWER_ROWS = [
  {
    key: 'unlocktower',
    kind: 'building', site: 'yard', at: () => tower.x + tower.w / 2,
    name: 'discover the tower',
    note: () => 'train some wizards',
    blurb: 'wizards live here',
    bill: () => [['core', TOWER_CORES], ['dust', TOWER_DUST]],
    cost: () => TOWER_DUST,                      // for anything that asks in one coin
    // Raises a tower and nothing else: the first hat out of it summons the
    // first star (`stepTower`).
    buy: () => {
      S.towerOpen = true;
      lookAt(tower.x + tower.w / 2);
    },
    show: () => offered('tower')
  }
];
