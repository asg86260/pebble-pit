import { QUARRY_CORES, QUARRY_DUST } from '../config.js';
import { JOB } from '../jobs.js';
import { S, quarry } from '../state.js';
import { assign } from '../upgrades.js';
import { site } from './site.js';

// One place at a time. Banking a single core used to reveal every site in the
// game at once, which spoils the whole chain: each one is a surprise that the
// last one earns.
//
// And the plots earn the quarry, rather than the other way round: a crop feeds a
// body and a body swings a pick, so the place that makes bodies stronger opens
// before the place that gives them better tools.
const CAVE = site({
  key: 'unlockquarry', name: 'open the quarry',
  cores: QUARRY_CORES, dust: QUARRY_DUST, open: 'quarryOpen',
  at: () => quarry.x + quarry.w / 2,
  show: () => S.farmOpen && !S.quarryOpen,
  // The cut opens with one body already sent over -- through the same assign
  // the board's + button uses, so it walks there like anybody retrained. A
  // quarry bought and then standing empty read as a purchase that did nothing.
  then: () => assign(JOB.QUARRY, 1)
});

// The bench's quarry rows. Data only: upgrades.js strings the files together
// into UPGRADES, in this order.
export const QUARRY_ROWS = [

  // The rift -- the black hole in the pit -- is not sold here. It is summoned
  // from the tower, and its ladder is on the tower's board with it: see
  // `TOWER_UPGRADES` in tower.js, and `## The endgame pass` in DESIGN.md.

  CAVE
];
