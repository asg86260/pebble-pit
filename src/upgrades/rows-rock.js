import { S } from '../state.js';
import { rockhandBite, rockhandRate } from '../levels.js';
import { tierRows, named } from './tiers.js';
import { msg } from '../lang.js';

// The rock's rows. Data only: upgrades.js strings the files together into
// UPGRADES, in this order.
//
// Drawn on the shack's board (`board: 'shack'`; DESIGN.md, "The shack at the
// rock") and WORKED there (`site: 'shack'`) by a spare hand, not one of the
// rock's gang: a gang capped at one by the ram has nobody to give.

const SPEED = tierRows({
  field: 'rockhandSpeedLevel',
  unit: 'hits/s', pct: true, does: msg('does-hit'),
  value: lvl => rockhandRate(lvl),
  site: 'shack', board: 'shack',
  show: () => S.crew > 0,
  bands: named('rockhandspeed', msg('row-rockhandspeed'))
});

// The gang's bite: whole pixels off its list (config/rungs.js).
const BITE = tierRows({
  field: 'rockhandPickLevel',
  unit: 'px', does: msg('does-per-swing'),
  value: lvl => rockhandBite(lvl),
  site: 'shack', board: 'shack',
  show: () => S.crew > 0,
  bands: named('rockhandpick', msg('row-rockhandpick'))
});

export const ROCK_ROWS = [
  ...BITE,
  ...SPEED
];
