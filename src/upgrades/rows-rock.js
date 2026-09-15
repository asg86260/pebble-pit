import { S } from '../state.js';
import { rockhandBite, rockhandRate } from '../upgrades.js';
import { tierRows, named } from './tiers.js';

// The rock's rows. Data only: upgrades.js strings the files together into
// UPGRADES, in this order.
//
// They are drawn on the shack's board rather than the bench's -- `board:
// 'shack'` is what says so, and what takes them off the bench, which draws
// everything that has not named a sheet of its own. They sat on the bench for
// as long as the rock had nowhere to hang a sheet; the gang has a hut now. See
// shack.js, and "The shack at the rock" in DESIGN.md.
//
// And they are WORKED there too: `site: 'shack'` walks a spare hand -- a
// hauler off the dust -- to the hut for the duration, the bench's own rule
// (`shack` in SITE_JOB, works.js). For a while it claimed one of the rock's
// gang instead, and a gang capped at one by the ram had nobody to give.

// The gang's swing, in bands (CLAUDE.md, "Decided"): what makes a crew of
// miners hit faster is first a rhythm, then a song to keep it, then somebody
// standing over them.
const SPEED = tierRows({
  field: 'rockhandSpeedLevel',
  unit: 'hits/s', pct: true, does: 'hit',
  value: lvl => rockhandRate(lvl),
  site: 'shack', board: 'shack',
  show: () => S.crew > 0,
  bands: named('rockhandspeed', 'swing speed')
});

// And the gang's bite: whole pixels off its list (config/rungs.js),
// in bands like every other ladder. It was a flat three-rung row with one dust
// bill, the last of that shape on any board. What you are buying is the tool,
// not the number the tool moves: the row said "rockhand bite", which is the
// effect in the game's own jargon, and a player reads "pick" as a thing you
// can hold.
const BITE = tierRows({
  field: 'rockhandPickLevel',
  unit: 'px', does: 'per swing',
  value: lvl => rockhandBite(lvl),
  site: 'shack', board: 'shack',
  show: () => S.crew > 0,
  bands: named('rockhandpick', 'digger pick damage')
});

export const ROCK_ROWS = [
  ...BITE,
  ...SPEED
];
