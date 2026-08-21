// What the bench sells, and what each thing costs.
//
// One row is one object. Every field is a function of the current game, so a row
// never holds a stale number, and adding an upgrade is adding an object -- no
// other file has to know about it. `SECTIONS` decides the order and the grouping
// on the board.

import {
  CAP_BASE, CAP_STEP, MINE_BASE, MINE_FLOOR, MINER_BASE, MINER_FLOOR,
  HAUL_MS, HAUL_BASE, CAVE_FLOOR, TEND_FLOOR
} from './config.js';
import { S, cave, farm, lab, meteor } from './state.js';
import { spend, takeCoreCells } from './pit.js';
import { lookAt } from './world.js';
import { syncWorkers } from './crew.js';
import { caveMs, caveRate } from './cave.js';
import { mult } from './lab.js';
import { tendMs, tendRate } from './farm.js';
import { buildShop } from './shop.js';

// Every swing in the game is the same shape: a gap in milliseconds that shrinks
// by a fixed fraction per level and never goes below a floor. One function, five
// swings -- the next kind of worker gets its speed for a line.
const swing = (base, floor, per) => lvl => Math.max(floor, Math.round(base * Math.pow(per, lvl)));
const perSecond = ms => lvl => 1000 / ms(lvl);

export const capacity = () => CAP_BASE + S.carryLevel * CAP_STEP;

const mineGap = swing(MINE_BASE, MINE_FLOOR, 0.8);
const minerGap = swing(MINER_BASE, MINER_FLOOR, 0.82);
const scoopGap = swing(HAUL_MS, 30, 0.85);

export const mineMs = (lvl = S.speedLevel) => Math.max(1, mineGap(lvl) / mult('swing'));
export const mineRate = (lvl = S.speedLevel) => 1000 / mineMs(lvl);
export const minerMs = (lvl = S.minerSpeedLevel) => Math.max(1, minerGap(lvl) / mult('swing'));
export const minerRate = (lvl = S.minerSpeedLevel) => 1000 / minerMs(lvl);
export const haulCap = (lvl = S.haulCarryLevel) => 1 + lvl;
export const haulSpeed = (lvl = S.haulPaceLevel) => HAUL_BASE * (1 + 0.3 * lvl) * mult('haul');
export const scoopMs = (lvl = S.haulPaceLevel) => Math.max(1, scoopGap(lvl) / mult('haul'));
// Pixels a swing takes. Yours and theirs are two different tools now: one row
// that made every miner in the yard hit harder was doing two jobs at once, and
// it sat under `you` while half of what it bought was on the rock.
export const pickCount = () => 1 + S.pickLevel;         // pixels your own swing takes
export const minerBite = () => 1 + S.minerPickLevel;    // and what a miner takes

// Every currency is a mark, never a word. Adding one is a line here and a line
// in the stylesheet.
export const MARK = {
  dust: '<i class="dust"></i>',
  core: '<i class="core"></i>',
  shard: '<i class="shard"></i>',
  spore: '<i class="spore"></i>',
  spark: '<i class="spark"></i>'
};

// what you have of one
export const purse = money =>
  money === 'core' ? S.cores :
  money === 'shard' ? S.shards :
  money === 'spore' ? S.spores :
  money === 'spark' ? S.sparks : S.stored;

// units are the marks themselves: a grain of dust, a grain a second
export const UNITS = {
  'px': '<i class="dust"></i>',
  'px/s': '<i class="dust"></i>/s',
  'trips/min': '<i class="shard"></i>/min',
  'beds/min': '<i class="spore"></i>/min'
};

export const num = v => (v < 10 ? v.toFixed(1) : String(Math.round(v)));
export const rateText = lvl => num(mineRate(lvl));


// Hiring and putting to work are two different things now. You buy a body once
// — a core for the first, dust for the next — and it carries dust until you put
// it on something else. A job is a count, not a purchase, so every one of them
// can be taken back the moment you want the dust moving again.
export const JOBS = ['miners', 'spelunkers', 'farmhands'];

// bodies with nothing else to do. They are the haulers, always
export const idle = () => S.crew - JOBS.reduce((n, j) => n + S[j], 0);

// `haulers` is a fact on S rather than a sum worked out where it is read, so
// that the crew code can treat it like any other job. This is the one place it
// is set, and every path that moves a body goes through here.
export function rebalance() {
  S.haulers = Math.max(0, idle());
}

export function hire() {
  S.crew++;
  rebalance();
  syncWorkers();
  S.dirty = true;
  buildShop();
}

// move one body on to a job, or off it and back to carrying dust
export function assign(job, d) {
  if (d > 0 && idle() < 1) return;
  if (d < 0 && S[job] < 1) return;
  S[job] += d;
  rebalance();
  syncWorkers();
  S.dirty = true;
  buildShop();
}

// A row that moves bodies rather than spending anything. The board draws it as
// a count with a less and a more beside it; nothing else on the bench does that.
const jobRow = (key, name, count, show) => ({
  key, name, job: count, show,
  count: () => S[count],
  spare: () => idle(),
  less: () => assign(count, -1),
  more: () => assign(count, 1)
});

// The one thing you hire. Everything else is where you put them.
const HIRE = [
  {
    key: 'firstworker',
    name: 'first worker',
    cost: () => 1,
    currency: 'core',
    buy: hire,
    show: () => S.seenCore && S.crew === 0
  },
  {
    key: 'worker',
    name: 'workers',
    from: () => S.crew,
    to: () => S.crew + 1,
    // One pool pays for every job now, so the curve is gentler than the four
    // it replaced: 1.7 a body was steep because it was steep four times over,
    // and the same eight bodies came to about 1,500 dust between them.
    cost: () => Math.round(60 * Math.pow(1.35, Math.max(0, S.crew - 1))),
    buy: hire,
    show: () => S.crew > 0
  }
];

// A site is a place, bought once with cores. It comes with nobody in it: who
// works it is the same question as who works the rock.
const site = ({ key, name, cores, open, at, show }) => ({
  key, name, cost: () => cores, currency: 'core',
  buy: () => { S[open] = true; lookAt(at()); },
  show
});

const CAVE = site({
  key: 'unlockcave', name: 'open the cave', cores: 3, open: 'caveOpen',
  at: () => cave.x + cave.w / 2,               // show them what they just bought
  show: () => S.seenCore && !S.caveOpen
});
// One place at a time. Banking a single core used to reveal every site in the
// game at once, which spoils the whole chain: each one is a surprise that the
// last one earns.
const FARM = site({
  key: 'unlockfarm', name: 'break the ground', cores: 5, open: 'farmOpen',
  at: () => farm.x + farm.w / 2,
  show: () => S.caveOpen && !S.farmOpen
});

export const UPGRADES = [
  {
    key: 'carry',
    name: 'carry',
    from: () => capacity(),
    to: () => capacity() + CAP_STEP,
    cost: () => Math.round(8 * Math.pow(1.35, S.carryLevel)),
    buy: () => S.carryLevel++,
    show: () => true
  },
  {
    key: 'auto',
    name: 'hold to mine',
    cost: () => 25,
    buy: () => { S.autoMine = true; },
    show: () => !S.autoMine
  },
  {
    key: 'speed',
    name: 'swing',
    unit: 'px/s',
    from: () => rateText(S.speedLevel),
    to: () => rateText(S.speedLevel + 1),
    cost: () => Math.round(20 * Math.pow(1.9, S.speedLevel)),
    buy: () => S.speedLevel++,
    show: () => mineMs() > MINE_FLOOR
  },
  {
    key: 'pick',
    name: 'pick',
    unit: 'px',
    from: () => pickCount(),
    to: () => pickCount() + 1,
    cost: () => 2 + S.pickLevel,
    currency: 'core',
    buy: () => S.pickLevel++,
    show: () => S.seenCore
  },
  ...HIRE,
  jobRow('mine', 'on the rock', 'miners', () => S.crew > 0),
  {
    key: 'minerpick',
    name: 'miner bite',
    unit: 'px',
    from: () => minerBite(),
    to: () => minerBite() + 1,
    cost: () => 3 + S.minerPickLevel,
    currency: 'core',
    buy: () => S.minerPickLevel++,
    show: () => S.crew > 0
  },
  {
    key: 'minerspeed',
    name: 'miner swing',
    unit: 'px/s',
    from: () => num(minerRate()),
    to: () => num(minerRate(S.minerSpeedLevel + 1)),
    cost: () => Math.round(70 * Math.pow(1.8, S.minerSpeedLevel)),
    buy: () => S.minerSpeedLevel++,
    show: () => S.crew > 0 && minerMs() > MINER_FLOOR
  },
  {
    key: 'haulcarry',
    name: 'worker load',
    from: () => haulCap(),
    to: () => haulCap(S.haulCarryLevel + 1),
    cost: () => Math.round(50 * Math.pow(1.5, S.haulCarryLevel)),
    buy: () => S.haulCarryLevel++,
    show: () => S.crew > 0
  },
  {
    key: 'haulpace',
    name: 'worker pace',
    unit: 'px/s',
    from: () => num(haulSpeed() * 60),
    to: () => num(haulSpeed(S.haulPaceLevel + 1) * 60),
    cost: () => Math.round(60 * Math.pow(1.7, S.haulPaceLevel)),
    buy: () => S.haulPaceLevel++,
    show: () => S.crew > 0
  },
  CAVE,
  jobRow('cavejob', 'down the cave', 'spelunkers', () => S.caveOpen),
  {
    key: 'cavepace',
    name: 'cave lamps',
    unit: 'trips/min',
    from: () => num(caveRate()),
    to: () => num(caveRate(S.cavePaceLevel + 1)),
    cost: () => Math.round(180 * Math.pow(1.75, S.cavePaceLevel)),
    buy: () => S.cavePaceLevel++,
    show: () => S.caveOpen && caveMs() > CAVE_FLOOR
  },
  {
    key: 'unlocklab',
    name: 'build the lab',
    cost: () => 7,
    currency: 'core',
    buy: () => { S.labOpen = true; lookAt(lab.x + lab.w / 2); },
    show: () => S.seenCore && !S.labOpen && (S.seenShard || S.seenSpore)
  },
  {
    key: 'unlockmeteor',
    name: 'call it down',
    cost: () => 9,
    currency: 'core',
    buy: () => { S.meteorOpen = true; S.meteorAt = 0; lookAt(meteor.x); },
    show: () => S.labOpen && !S.meteorOpen
  },
  FARM,
  jobRow('farmjob', 'at the beds', 'farmhands', () => S.farmOpen),
  {
    key: 'tend',
    name: 'tending',
    unit: 'beds/min',
    from: () => num(tendRate()),
    to: () => num(tendRate(S.tendLevel + 1)),
    cost: () => Math.round(320 * Math.pow(1.75, S.tendLevel)),
    buy: () => S.tendLevel++,
    show: () => S.farmOpen && tendMs() > TEND_FLOOR
  }
];

// The order and the grouping on the board. A section with nothing to show in it
// is left out, so rows appear as they are unlocked.
export const SECTIONS = [
  { title: 'you', keys: ['carry', 'auto', 'speed', 'pick'] },
  { title: 'the crew', keys: ['firstworker', 'worker', 'haulcarry', 'haulpace'] },
  { title: 'the rock', keys: ['mine', 'minerpick', 'minerspeed'] },
  { title: 'the cave', keys: ['unlockcave', 'cavejob', 'cavepace'] },
  { title: 'the farm', keys: ['unlockfarm', 'farmjob', 'tend'] },
  { title: 'the lab', keys: ['unlocklab'] },
  { title: 'the sky', keys: ['unlockmeteor'] }
];

// What the bench has to say for itself, without opening it. The board is built
// from the same two questions, so a new upgrade or a new section is picked up
// here without this ever being touched.

// the sections that have any row showing right now
export const openSections = () =>
  SECTIONS.filter(sect => sect.keys.some(k => {
    const u = UPGRADES.find(x => x.key === k);
    return u && u.show();
  })).map(sect => sect.title);

// something on the board you could buy this second
export const canAfford = () =>
  UPGRADES.some(u => !u.job && u.show() && purse(u.currency || 'dust') >= u.cost());

// a whole heading you have not seen yet -- worth more of a nudge than one more
// row under a heading you have already read
export const unseenSection = () =>
  openSections().some(title => !S.seenSects.includes(title));

// What the bench is showing without being opened. One place decides it, so the
// drawing and the check that reads it can never drift apart.
export const benchMark = () =>
  !S.seenBench ? '' : unseenSection() ? 'flag' : canAfford() ? 'dot' : '';

// the board has been looked at: every heading on it now counts as read
export function markSectionsSeen() {
  S.seenSects = openSections();
  S.dirty = true;
}

// Buying is the same shape whatever the row and whatever it is priced in: check
// you can afford it, take the price out of wherever that currency is kept, then
// let the row do its one thing.
export function buy(u) {
  if (u.job) return;                             // a job row moves bodies, not dust
  const cost = u.cost();
  const money = u.currency || 'dust';
  if (!u.show() || purse(money) < cost) return;

  if (money === 'dust') spend(cost);              // lifted back out of the pile
  else if (money === 'core') { S.cores -= cost; takeCoreCells(cost); }
  else if (money === 'shard') S.shards -= cost;
  else if (money === 'spore') S.spores -= cost;
  else if (money === 'spark') S.sparks -= cost;

  u.buy();
  S.dirty = true;
  buildShop();
}
