import { PROP_COST, NET_COST, ARCH_COST,
         PROP_WORK, NET_WORK, ARCH_WORK } from '../config.js';
import { S, tower } from '../state.js';
import { lookAt } from '../world.js';
import { raiseShield, shieldDone, shieldGround } from '../shield.js';
import { offered } from '../stations.js';

// The shields: what the yard puts between itself and the sky. Data only;
// upgrades.js strings the files together into UPGRADES.
//
// Every one is a `building` on the yard, so it goes through works.js and
// `buy` runs when the labor is in. `box` is the footprint, worked out the way
// `raiseShield` works it out, so the tape goes up around exactly that ground.
// Each is offered only once its predecessor has failed (its row in
// stations.js), and priced in the coin of the station before it (DESIGN.md,
// "The shields are the spine"). The dome is the tower's and lives on its
// board; nobody builds it, the tower pours it.
export const SHIELD_ROWS = [
  {
    key: 'props',
    kind: 'building', site: 'yard', at: () => S.cx, box: () => shieldGround('props'),
    work: () => PROP_WORK,
    name: 'wooden barrier',
    note: () => 'quickly try to build a barrier to save your sqwife',
    cost: () => PROP_COST,
    buy: () => raiseShield('props'),
    show: () => offered('props')
  },
  {
    key: 'net',
    kind: 'building', site: 'yard', at: () => S.cx, box: () => shieldGround('net'),
    work: () => NET_WORK,
    name: 'the net',
    note: () => 'that didn\'t work, try catching the rock with a net?',
    cost: () => NET_COST,
    currency: 'spore',
    buy: () => raiseShield('net'),
    show: () => offered('net')
  },
  {
    key: 'arch',
    kind: 'building', site: 'yard', at: () => S.cx, box: () => shieldGround('arch'),
    work: () => ARCH_WORK,
    name: 'cut the arch',
    note: () => 'still not sturdy enough. lets build a stone arch.',
    cost: () => ARCH_COST,
    currency: 'shard',
    buy: () => raiseShield('arch'),
    show: () => offered('arch')
  },
  // After the stone has failed the bench has nothing left to sell; the sign
  // walks your eye out to the tower, where the dome is sold.
  {
    key: 'askwizards',
    sign: true,
    bill: () => [],
    cost: () => 0,
    name: 'maybe the wizards would know?',
    note: () => 'everything of the ground has failed. what is left is not of the ground',
    buy: () => lookAt(tower.x + tower.w / 2),
    // gone for good once the dome has been and gone: it reads as done the way
    // the three that broke do (`shieldsDone`)
    show: () => !S.shield && shieldDone('arch') && !shieldDone('dome')
  }
];
