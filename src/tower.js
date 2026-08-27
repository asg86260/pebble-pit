// The tower: the far end of the walk, and the only thing a core buys.
//
// What it sells is not a rate. Everything else in this yard makes a number go up
// faster; the tower makes a thing stop happening. There is no upgrade path here
// and no second tier -- one row, and what it buys is a chore you no longer have.

import { S } from './state.js';
import { MAGIC_LOO_DUST, MAGIC_LOO_SPORES } from './config.js';

export const TOWER_UPGRADES = [
  {
    key: 'magicloo',
    name: 'enchant the outhouse',
    // What it does, in the words of the thing it undoes. A row that said
    // "removes waste" would be a row about a system; this is about the shovel
    // you put down.
    note: () => 'and nobody has to shovel it ever again',
    bill: () => [['dust', MAGIC_LOO_DUST], ['spore', MAGIC_LOO_SPORES]],
    cost: () => MAGIC_LOO_DUST,
    buy: () => { S.magicLoo = true; },
    // Nothing to enchant until there is one, which is the joke: the tower's
    // first piece of magic is plumbing.
    show: () => S.outhouseOpen && !S.magicLoo
  }
];

export const TOWER_SECTIONS = [
  { title: 'the tower', keys: ['magicloo'] }
];
