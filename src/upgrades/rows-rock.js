import { ROCKHAND_RUNGS } from '../config.js';
import { S } from '../state.js';
import { rockhandBite, rockhandRate, rungCost } from '../upgrades.js';
import { ROCKHAND_SPEED_COST } from '../config.js';

// The rock's rows. Data only: upgrades.js strings the files together into
// UPGRADES, in this order.
//
// They are drawn on the shack's board rather than the bench's -- `board:
// 'shack'` is what says so, and what takes them off the bench, which draws
// everything that has not named a sheet of its own. They sat on the bench for
// as long as the rock had nowhere to hang a sheet; the gang has a hut now. See
// shack.js, and "The shack at the rock" in DESIGN.md.
//
// And they are WORKED there too: `site: 'shack'` claims one of the gang to the
// hut for the duration, the quarry's and the farm's rule (shedhand.js). The
// site was the bench for a while after the board moved, so the row you bought
// at the hut was fitted a walk away by whoever was spare.
export const ROCK_ROWS = [
  // And the crew's is what the crew are fed on. The plots grow the only thing in
  // this yard anybody eats, so what a body can take out of the rock is bought in
  // spores -- which also keeps the green from piling up unspent, and gives the
  // two currencies a job each instead of one of them doing all the work.
  {
    key: 'rockhandpick',
    kind: 'rung', site: 'shack', board: 'shack',
    // What you are buying is the tool, not the number the tool moves. The row
    // said "rockhand bite", which is the effect described in the game's own jargon
    // -- a player reads "bite" as a stat and "pickaxe" as a thing you can hold.
    name: 'pickaxe',
    unit: 'px',
    rung: () => S.rockhandPickLevel,
    // Its own short ladder: three rungs, each a whole pixel of bite (see
    // rockhandBite), each eight times the old base -- fewer, dearer, and every
    // one visible on the row. (feedback7, item 19)
    rungs: () => ROCKHAND_RUNGS,
    from: () => rockhandBite(),
    to: () => rockhandBite(S.rockhandPickLevel + 1),
    bill: () => [['spore', rungCost(200, S.rockhandPickLevel)], ['dust', rungCost(2400, S.rockhandPickLevel)]],
    cost: () => rungCost(2400, S.rockhandPickLevel),
    buy: () => S.rockhandPickLevel++,
    show: () => S.seenSpore && S.crew > 0
  },
  {
    key: 'rockhandspeed',
    kind: 'rung', site: 'shack', board: 'shack',
    // Two words do the work of every rate on these boards now: a **swing** is a
    // pick hitting rock, and **speed** is how often anything else happens. Each
    // one means one thing, and a row under "the rock" saying "rockhand" was saying
    // what the heading already said.
    name: 'swing',
    unit: 'px/s',
    pct: true,
    rung: () => S.rockhandSpeedLevel,
    from: () => rockhandRate(),
    to: () => rockhandRate(S.rockhandSpeedLevel + 1),
    cost: () => rungCost(ROCKHAND_SPEED_COST, S.rockhandSpeedLevel),
    buy: () => S.rockhandSpeedLevel++,
    show: () => S.crew > 0
  }
];
