// What the bench sells, and what each thing costs.
//
// One row is one object. Every field is a function of the current game, so a
// row never holds a stale number. `SECTIONS` decides the order and the grouping
// on the board.
//
// This is the boards' file. What a ladder is worth is levels.js, who is on
// what job is staffing.js, and how a number is said is words.js; the sim
// imports those and never this, so a station's load order does not run
// through the shop.

import { P, SHELF_INK } from './config.js';
import { S } from './state.js';
import { maxed } from './words.js';
import { spend, spendHeld, payTo, refund } from './pit.js';
import { CORE_CELL, SHARD_CELL, SPORE_CELL, SPARK_CELL } from './config.js';
import { SPELL_THRIFT, HOUSE_COST0, HOUSE_RATE, HOUSE_WORK0, HOUSE_WORK_STEP, HOUSE_WORK_MAX } from './config.js';

import { spelled } from './tower.js';

import { takesTime, workOn, workFor, leftAt, start, registerRows, siteBox, waiting, placeOf, pullOut } from './works.js';
import { nextHouseAt } from './house.js';
import { DUST_PER } from './upgrades/price.js';
import { hire } from './staffing.js';
import { purse } from './words.js';

import { BENCH_ROWS } from './upgrades/rows-bench.js';
import { LUCK_ROWS } from './upgrades/rows-luck.js';
import { ROCK_ROWS } from './upgrades/rows-rock.js';
import { CREW_ROWS } from './upgrades/rows-crew.js';
import { FARM_ROWS } from './upgrades/rows-farm.js';
import { KIT_ROWS } from './upgrades/rows-kit.js';
import { FILTER_ROWS } from './upgrades/rows-filter.js';
import { TOWER_ROWS } from './upgrades/rows-tower.js';
import { CASINO_ROWS } from './upgrades/rows-casino.js';
import { APOTHECARY_ROWS } from './upgrades/rows-apothecary.js';
import { TUNING_ROWS } from './upgrades/rows-tuning.js';
import { QUARRY_ROWS } from './upgrades/rows-quarry.js';
import { OUTHOUSE_ROWS } from './upgrades/rows-outhouse.js';
import { SHACK_ROWS } from './upgrades/rows-shack.js';
import { SHIELD_ROWS } from './upgrades/rows-shields.js';

// A ladder sold in more than one row shows one row at a time: a row naming
// `after` stays off every board until that row's ladder is finished. Wraps
// `show` so everything that reads it (the sheet, `canAfford`, the bench's
// mark, `__rows`) gets the chain without a second gate.
export const chained = rows => {
  const byKey = new Map(rows.map(u => [u.key, u]));
  for (const u of rows) {
    if (!u.after) continue;
    const prev = byKey.get(u.after);
    if (!prev) throw new Error(`${u.key} comes after ${u.after}, which is not a row`);
    const own = u.show;
    u.show = () => maxed(prev) && own();
  }
  return rows;
};

// The one thing you hire, bought where the crew live: a hire is a room, and
// the settlement is drawn off the headcount. There is no row for the first
// body; the opening hands you one (intro.js).
export const HOUSE_ROW = {
  key: 'house',
  name: 'another house',
  kind: 'building', site: 'yard', at: () => nextHouseAt(),
  // Its own curve off how many rooms stand, because a `building` with no
  // `rung` would get one flat number from `workFor` for ever. Clamped at zero
  // so the body the intro hands you does not push the first bought house up
  // the curve.
  work: () => Math.min(HOUSE_WORK_MAX,
    HOUSE_WORK0 * Math.pow(HOUSE_WORK_STEP, Math.max(0, S.crew - 1))),
  from: () => S.crew,
  to: () => S.crew + 1,
  // Steeper than the ladders' rate on purpose: every body compounds the
  // income every ladder is priced against, so the crew is the one curve that
  // must outrun the shop's.
  cost: () => Math.round(HOUSE_COST0 * Math.pow(HOUSE_RATE, Math.max(0, S.crew - 1))
                         * (spelled('thrift') ? SPELL_THRIFT : 1)),
  // The hire is the roster's; the sheet that sells it is rebuilt here, since
  // a work landing by itself asks nobody to.
  buy: () => { hire(); S.shopStale = true; },
  show: () => S.crew > 0
};
// Not one of `UPGRADES` (it lives on the crew board), but a work coming out
// of a save still has to find its way back to this row's `buy`.
registerRows([HOUSE_ROW]);

// What the bench sells, in the order it is written down. A new row is a row in
// one of the `src/upgrades/rows-*.js` files; a new section is a file and a
// line here.
export const UPGRADES = chained([
  ...BENCH_ROWS,
  ...LUCK_ROWS,
  ...ROCK_ROWS,
  ...CREW_ROWS,
  ...FARM_ROWS,
  ...KIT_ROWS,
  ...FILTER_ROWS,
  ...TOWER_ROWS,
  ...CASINO_ROWS,
  ...APOTHECARY_ROWS,
  ...TUNING_ROWS,
  ...QUARRY_ROWS,
  ...OUTHOUSE_ROWS,
  ...SHACK_ROWS,
  ...SHIELD_ROWS
]);

registerRows(UPGRADES);

// The rows on this list that another station's sheet draws (`u.board`).
export const lodgers = board => UPGRADES.filter(u => u.board === board);

// The order and grouping on the bench. A section with nothing to show is left
// out. The shield on offer is the goal card: its own frame, above everything
// for sale. Everything not yet built is under one "build" heading, because
// those are the one group that cannot be sold at the place they belong to --
// the place is what they buy.
export const SECTIONS = [
  { title: 'the sky', goal: true, keys: ['props', 'net', 'arch', 'askwizards'] },
  { title: 'you', keys: ['carry', 'autotoss', 'toss', 'reach', 'auto', 'speed', 'pick'] },
  { title: 'lucky swings', keys: ['critchance', 'critmult'] },
  { title: 'the haulers', keys: ['haulcarry', 'haulpace', 'carter', 'driver', 'belt'] },
  { title: 'build', keys: [
    'unlockquarry', 'unlockfarm', 'unlockapothecary', 'unlockcasino',
    'unlockshack', 'unlockouthouse', 'unlocktower',
    'unlockfilter'
  ] }
];

// What the bench has to say for itself without being opened. One place
// decides it, so the drawing and the check that reads it cannot drift.

export const openSections = () =>
  SECTIONS.filter(sect => sect.keys.some(k => {
    const u = UPGRADES.find(x => x.key === k);
    return u && u.show();
  })).map(sect => sect.title);

// Something you could buy and actually press this second: a row bought and
// waiting its turn is not one, since pressing it hands it back.
export const canAfford = () =>
  UPGRADES.some(u => !u.job && u.show() && !u.dead?.() && canPay(u) && !inLine(u));

export const unseenSection = () =>
  openSections().some(title => !S.seenSects.includes(title));

export const benchMark = () =>
  !S.seenBench ? '' : unseenSection() ? 'flag' : canAfford() ? 'dot' : '';

export function markSectionsSeen() {
  S.seenSects = openSections();
}

// Take one currency out of wherever it is kept. Dust is lifted out of the
// pile; every other coin is a grain in that pile, so paying lifts that many
// grains out of it. `spendHeld` takes off what the rift is holding for
// whatever the hole did not have, the same order paying in dust keeps.
export function take(money, n) {
  if (!n) return;
  if (money === 'dust') spend(n);
  else if (money === 'core') { S.cores -= n; spendHeld(n, CORE_CELL); }
  else if (money === 'shard') { S.shards -= n; spendHeld(n, SHARD_CELL); }
  else if (money === 'spore') { S.spores -= n; spendHeld(n, SPORE_CELL); }
  else if (money === 'spark') { S.sparks -= n; spendHeld(n, SPARK_CELL); }
}

// What a row costs, as [currency, amount] pairs. A row says `cost` and
// `currency` (or `bill` for several coins at once); the dust every row also
// costs is derived here from `DUST_PER`, so no row can forget it -- a row
// that wants a different dust number names dust itself. A row past the bench
// gets its time appended the same way: what is left of the build if it is on,
// else the whole of it. `time` is not a coin and buys no dust.
export const billOf = u => {
  let bill = u.bill ? u.bill() : [[u.currency || 'dust', u.cost()]];
  if (!bill.some(([money]) => money === 'dust')) {
    let dust = 0;
    for (const [money, n] of bill) dust += (DUST_PER[money] || 0) * n;
    if (dust > 0) bill = [...bill, ['dust', Math.round(dust)]];
  }
  if (!takesTime(u)) return bill;
  const on = workOn(u.key);
  return [...bill, ['time', on ? leftAt(u.site, u.key) : workFor(u) * 1000]];
};

// The stroke round a row's glyph: the deepest coin on its next rung's bill,
// the rung's legend rather than a verdict on it (SHELF_INK); null while it
// asks nothing but dust. A finished ladder keeps its last rung's stroke (its
// bill clamps to the top band), so a done row still shows what it took; the
// row being greyed is what says done. The card and the mark over a station
// that finished the row wear the same one.
export const tintOf = u => {
  const coins = billOf(u).map(([m]) => m);
  return coins.includes('spark') ? SHELF_INK.spark
       : coins.includes('shard') ? SHELF_INK.shard
       : coins.includes('spore') ? SHELF_INK.spore : null;
};

// Being built, or bought and waiting its turn; only the second can be pressed
// again to hand it back. A site takes a line, so no row is refused for what
// its neighbor is doing.
export const building = u => takesTime(u) && !!workOn(u.key);
export const inLine = u => takesTime(u) && waiting(u.site, u.key);
export const lineAt = u => placeOf(u.site, u.key);

export const canPay = u => billOf(u).every(([money, n]) => purse(money) >= n);

// True when something was actually bought. The board reads it to decide
// whether to put itself away; a press that bought nothing must leave it open,
// or a sheet shutting on a bill you cannot pay looks like it took the money.
export function buy(u) {
  if (u.job || u.dial) return false;   // a job row moves bodies and a dial sets a number
  // A signpost costs nothing; pressing it only points somewhere.
  if (u.sign) { if (u.show() && !u.dead?.()) u.buy(); return false; }
  // A row with a payout on it instead of a price is not a purchase: nothing is
  // taken, and what it does is its own business. The casino's decisions -- let
  // it go, bank it, drop again -- are the only ones in the game.
  if (u.price) {
    if (!u.show() || u.dead?.()) return false;
    u.buy(); S.shopStale = true;
    // A payout row is one of the casino's decisions: it is a thing you do at
    // the table, not a thing you take away, so the board stays up for the next
    // hand.
    return false;
  }
  // Pressing a row in line hands it back: the bill comes back in full and
  // arcs from where it would have stood to the pile. Not a purchase.
  if (inLine(u)) {
    const box = siteBox(u.site, workOn(u.key));
    const bill = billOf(u);
    if (!pullOut(u.site, u.key)) return false;
    const x = box ? box.x + box.w / 2 : S.cx, y = (box?.y ?? S.groundY) - P * 2;
    for (const [money, n] of bill) if (money !== 'time') refund(money, n, x, y);
    S.shopStale = true;
    return false;
  }
  if (!u.show() || u.dead?.() || maxed(u) || !canPay(u)) return false;
  if (building(u)) return false;
  // Past the bench, paying starts the yard building; the row's own `buy`
  // runs when the work lands. The work is started BEFORE the bill is taken:
  // a yard row's dust flies to the ground the thing goes up on, and that
  // ground does not exist until `start` reserves it. A start that comes to
  // nothing returns before a coin is touched.
  if (takesTime(u) && !start(u.site, u, u.at?.())) return false;

  // What is spent flies to where it is going -- the row's own site, or the
  // box of the work just started -- and `payTo` is cleared straight after so
  // a spend with nobody's destination around it falls back to the bench.
  const box = u.site === 'yard' ? siteBox('yard', workOn(u.key))
            : u.site           ? siteBox(u.site)
            : null;
  if (box) payTo(box.x + box.w / 2, (box.y ?? S.groundY) - P * 2);
  // Nothing is taken until all of it can be (`canPay` above).
  for (const [money, n] of billOf(u)) if (money !== 'time') take(money, n);
  payTo();

  if (!takesTime(u)) u.buy();
  S.shopStale = true;
  return true;
}

