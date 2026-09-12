import { ROCKHAND_RUNGS, ROCKHAND_PICK_COST, ROCKHAND_SPEED_COST } from '../config.js';
import { S } from '../state.js';
import { rockhandBite, rockhandRate, rungCost } from '../upgrades.js';
import { tierRows } from './tiers.js';

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
  unit: 'px/s', pct: true, does: 'hit',
  value: lvl => rockhandRate(lvl),
  first: ROCKHAND_SPEED_COST,
  site: 'shack', board: 'shack',
  show: () => S.crew > 0,
  bands: [
    { key: 'rockhandspeed',  name: 'a rhythm' },
    { key: 'rockhandspeed2', name: 'a work song' },
    { key: 'rockhandspeed3', name: 'a foreman' }
  ]
});

export const ROCK_ROWS = [
  {
    key: 'rockhandpick',
    kind: 'rung', site: 'shack', board: 'shack',
    // What you are buying is the tool, not the number the tool moves. The row
    // said "rockhand bite", which is the effect described in the game's own jargon
    // -- a player reads "bite" as a stat and "pickaxe" as a thing you can hold.
    name: 'pickaxe',
    unit: 'px',
    does: 'per swing',
    rung: () => S.rockhandPickLevel,
    // Its own short ladder: three rungs, each a whole pixel of bite (see
    // rockhandBite), fewer and dearer, and every one visible on the row
    // (feedback7, item 19). Three rungs is one card, and a first card is dust.
    rungs: () => ROCKHAND_RUNGS,
    from: () => rockhandBite(),
    to: () => rockhandBite(S.rockhandPickLevel + 1),
    cost: () => rungCost(ROCKHAND_PICK_COST, S.rockhandPickLevel),
    buy: () => S.rockhandPickLevel++,
    show: () => S.crew > 0
  },
  ...SPEED
];
