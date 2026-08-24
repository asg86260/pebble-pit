// The casino: the one place in the yard that makes nothing.
//
// Everywhere else, a thing you buy does something for ever after. This takes
// what you have and hands some of it back, and the whole of it is a decision you
// keep making rather than a purchase you make once.
//
// **One table, one pot, and putting a chip down is the spin.** You pick how much
// -- ten, a hundred, a thousand, or everything you have -- and which of dust,
// shards or spores it comes out of, and the wheel goes round: six in ten it is
// doubled, four in ten it is gone. That is the whole of it, and it is one
// gesture, because putting something on a table and then pressing a second thing
// to find out what happened to it is a form rather than a bet.
//
// If it came off, the pot is sitting there and you decide again:
//
//   bank it       take it and walk out
//   spin again    six in ten it doubles, four in ten it is gone
//
// Six in ten is generous on any one spin and ruinous kept up, which is the whole
// of what a casino is: every spin is worth taking and taking them all ends at
// nothing with certainty. When to stop is the game, and it is the only thing in
// this yard you can actually lose.
//
// It is a building with a wheel in it: a block with one big round hole knocked
// out, which turns slowly while there is a pot sitting on the table and is spun
// in earnest while a ride is being settled. Everything you need to read is the
// wheel and two rows.

import { CASINO_ODDS, CASINO_SPIN_MS, CASINO_WHEEL,
         CASINO_CHIPS, CASINO_SAY_MS, SHARD_CELL, SPORE_CELL, someFind } from './config.js';
import { S, pit } from './state.js';
import { now } from './clock.js';
import { spend, bankDust, takeCoreCells, pitRoom } from './pit.js';
import { buildShop } from './shop.js';

// What is on the table right now, and nothing about it moves on its own: a pot
// is what the last spin left, until the next one.
export const pot = () => S.pot ? S.pot.n : 0;

// A spin is being settled: the wheel is going and nothing you press does
// anything until it stops. It is a second and a bit of nothing you can do, which
// is exactly what a wheel is for.
export const spinning = () => now() < S.spinUntil;

// --- the chip -----------------------------------------------------------------
// How much goes down is chosen, not worked out for you. Four chips, and the last
// of them is not a number: `all` is everything you are holding of whatever you
// stake, and it is the one the whole place is really for.
export const purseOf = cur =>
  cur === 'shard' ? S.shards : cur === 'spore' ? S.spores : S.stored;

export const chip = () => CASINO_CHIPS[Math.max(0, Math.min(CASINO_CHIPS.length - 1, S.chip))];
export const chipName = () => (chip() === 'all' ? 'all in' : String(chip()));

// A chip you cannot cover is a chip you cannot put down, so the row goes pale
// rather than quietly staking less than it says.
export const stakeOf = cur => chip() === 'all' ? purseOf(cur) : chip();

export function pickChip(d) {
  S.chip = Math.max(0, Math.min(CASINO_CHIPS.length - 1, S.chip + d));
  S.dirty = true;
  buildShop();
}

// Everything in this game ends up in the hole and the hole has a limit, so a
// pot has to have somewhere to land before it can be taken. That is checked
// when you go to bank it, not when you put the stake down: a pot the hole will
// not take *stays on the table* until it will, the same as a core the hole
// refuses waits on the ground by the lip. Nothing here is ever lost to a rule
// about sand, and a full hole is a reason to dig rather than a hand you lose.
export const canBank = () => !!S.pot && !spinning() && pitRoom() >= pot();

export const canStake = cur =>
  S.casinoOpen && !S.pot && !spinning() && stakeOf(cur) > 0 && purseOf(cur) >= stakeOf(cur);

// The chip goes down and the wheel goes round -- one gesture, not two. Putting
// something on the table and then having to press a second thing to find out
// what happened to it is a form to fill in, not a bet.
export function stake(cur) {
  if (!canStake(cur)) return;
  const n = stakeOf(cur);
  if (cur === 'dust') spend(n);
  else if (cur === 'shard') { S.shards -= n; takeCoreCells(n, SHARD_CELL); }
  else if (cur === 'spore') { S.spores -= n; takeCoreCells(n, SPORE_CELL); }
  S.pot = { cur, stake: n, n };
  spin();
}

// --- taking it, or not --------------------------------------------------------

// Paid the way everything else arrives: a grain at a time into the hole, so the
// pile shows exactly what you are holding and a win is a thing you watch land.
function payOut(cur, n) {
  const find = cur === 'shard' ? SHARD_CELL : cur === 'spore' ? SPORE_CELL : 0;
  // spread along the near end of the hole, where the crew tip everything else in
  for (let i = 0; i < n; i++) {
    const x = pit.x + ((i + 0.5) / n) * Math.min(700, pit.w);
    if (!bankDust(x, find ? someFind(find) : 4)) break;
  }
}

export function bank() {
  if (!canBank()) return;
  const n = pot();
  const cur = S.pot.cur;
  S.pot = null;
  S.hand = null;                                 // taken: there is nothing to report
  payOut(cur, n);
  S.dirty = true;
  buildShop();
}

// Put the whole of it back on. Same wheel, same six in ten, and the pot is
// twice what it was or it is nothing.
export const ride = () => { if (S.pot && !spinning()) spin(); };

// What it lands on is decided now and shown in a second: a wheel that decided
// when it stopped would be a wheel you could watch for a tell, and the spin is
// a beat rather than a simulation.
function spin() {
  S.hand = null;                                 // the last one is old news now
  S.spinWon = Math.random() < CASINO_ODDS;
  S.spinUntil = now() + CASINO_SPIN_MS;
  S.dirty = true;
  buildShop();
}

// The wheel turns while there is a pot on the table and spins while a ride is
// being settled. It is the whole of the signal: the rows say what the numbers
// are and this says whether anything is happening.
export function stepCasino(dt) {
  if (!S.casinoOpen) return;
  const fast = spinning();
  if (S.pot || fast) S.wheel = (S.wheel + CASINO_WHEEL * (fast ? 14 : 1) * (dt / 1000)) % (Math.PI * 2);
  if (!fast && S.spinUntil) {                    // it has just come to rest
    S.spinUntil = 0;
    const cur = S.pot?.cur;
    if (S.spinWon) S.pot = { ...S.pot, n: S.pot.n * 2 };
    else S.pot = null;
    // and it says which way it went, for a few seconds, over the building --
    // a wheel that stopped and told you nothing is a wheel you had to have been
    // watching, and you are usually somewhere else in the yard.
    S.hand = { won: S.spinWon, n: S.spinWon ? pot() : 0, cur, at: now() };
    S.dirty = true;
    buildShop();
  }
  if (S.hand && now() - S.hand.at > CASINO_SAY_MS) { S.hand = null; S.dirty = true; }
}

// what the yard should be showing over the building, if anything
export const saying = () => S.hand ? (S.hand.won ? 'won' : 'lost') : null;

// --- the board ---------------------------------------------------------------
// Three rows to put something down and two to decide what happens to it, and
// never both sets at once: a table with a pot on it is not a table you can
// stake at.
//
// A stake row is priced like any other row on any other board -- a mark and a
// number -- because that is exactly what it is: this much, out of your hands,
// now. The two decisions are not priced at all, so they carry what they would
// pay instead, which is the number the decision is actually about.
const STAKES = [
  { key: 'stakedust', name: 'stake', cur: 'dust' },
  { key: 'stakeshard', name: 'stake', cur: 'shard' },
  { key: 'stakespore', name: 'stake', cur: 'spore' }
];

const seen = cur => cur === 'shard' ? S.seenShard : cur === 'spore' ? S.seenSpore : true;

export const CASINO_UPGRADES = [
  // How much goes down, on a dial rather than as four rows a currency. It is the
  // one row on this board that spends nothing, exactly like the roster's job
  // rows: a setting between two buttons, not a purchase.
  {
    key: 'chip',
    name: 'chips',
    dial: true,
    value: chipName,
    less: () => pickChip(-1),
    more: () => pickChip(1),
    lo: () => S.chip <= 0,
    hi: () => S.chip >= CASINO_CHIPS.length - 1,
    show: () => S.casinoOpen && !S.pot && !spinning()
  },
  // A stake is written like a price -- a mark and a number, this much out of
  // your hands, now -- but it is not a purchase and it does not go through the
  // buying machinery: `stake` takes what it takes, and the row is dead when it
  // could not.
  ...STAKES.map(t => ({
    key: t.key,
    name: t.name,
    price: () => `${MARKOF(t.cur)} ${stakeOf(t.cur)}`,
    cost: () => stakeOf(t.cur),
    currency: t.cur,
    dead: () => !canStake(t.cur),
    buy: () => stake(t.cur),
    // A row for a currency you have never seen is a row naming a thing you have
    // not met, which is the one rule every board in this game keeps.
    show: () => S.casinoOpen && !S.pot && !spinning() && seen(t.cur)
  })),
  {
    key: 'bank',
    name: 'bank it',
    price: () => `${MARKOF(S.pot?.cur)} ${pot()}`,
    cost: () => 0,
    // the wheel is going, or the hole would not take it: either way the pot
    // stays where it is
    dead: () => !canBank(),
    buy: bank,
    show: () => S.casinoOpen && !!S.pot
  },
  {
    key: 'ride',
    name: 'spin again',
    // What it is worth if it comes off, which is the number the decision is
    // about. The odds are not written anywhere: they are the same every time,
    // and a percentage on a row would turn a wheel into a spreadsheet.
    //
    price: () => `${MARKOF(S.pot?.cur)} ${pot() * 2}`,
    cost: () => 0,
    dead: spinning,
    buy: ride,
    show: () => S.casinoOpen && !!S.pot
  }
];

// the mark of whatever is on the table, written the way the boards write marks
const MARKOF = cur => `<i class="${cur || 'dust'}"></i>`;

export const CASINO_SECTIONS = [
  { title: 'the table', keys: ['chip', 'stakedust', 'stakeshard', 'stakespore'] },
  { title: 'the pot', keys: ['bank', 'ride'] }
];
