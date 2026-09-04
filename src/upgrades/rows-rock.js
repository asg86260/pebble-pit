import { S } from '../state.js';
import { rockhandBite, rockhandRate, rungCost } from '../upgrades.js';

// The bench's rock rows. Data only: upgrades.js strings the files together
// into UPGRADES, in this order.
export const ROCK_ROWS = [
  // And the crew's is what the crew are fed on. The plots grow the only thing in
  // this yard anybody eats, so what a body can take out of the rock is bought in
  // spores -- which also keeps the green from piling up unspent, and gives the
  // two currencies a job each instead of one of them doing all the work.
  {
    key: 'rockhandpick',
    kind: 'rung', site: 'bench',
    // What you are buying is the tool, not the number the tool moves. The row
    // said "rockhand bite", which is the effect described in the game's own jargon
    // -- a player reads "bite" as a stat and "pickaxe" as a thing you can hold.
    name: 'pickaxe',
    unit: 'px',
    rung: () => S.rockhandPickLevel,
    from: () => rockhandBite(),
    to: () => rockhandBite(S.rockhandPickLevel + 1),
    bill: () => [['spore', rungCost(5, S.rockhandPickLevel)], ['dust', rungCost(300, S.rockhandPickLevel)]],
    cost: () => rungCost(300, S.rockhandPickLevel),
    buy: () => S.rockhandPickLevel++,
    show: () => S.seenSpore && S.crew > 0
  },
  {
    key: 'rockhandspeed',
    kind: 'rung', site: 'bench',
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
    cost: () => rungCost(70, S.rockhandSpeedLevel),
    buy: () => S.rockhandSpeedLevel++,
    show: () => S.crew > 0
  }
];
