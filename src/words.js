// How a board says a number: the marks the coins are drawn as, what a unit
// looks like, what a row claims it gives, a price, a time left, an ordinal.
//
// Nothing here changes the game; every function takes what it is told and
// hands back a string. The one thing it asks a row is whether the ladder is
// finished (`maxed`), because a finished row has nothing left to promise.

import { msg, placeOf } from './lang.js';
import { S } from './state.js';
import { RUNGS } from './config.js';
import { isHellCoin, hellPurse } from './hell/coins.js';

// Every currency is a mark, never a word. Adding one is a line here and a line
// in the stylesheet. Time is a price like the coins and reads the same way.
// Short form for a count read at a glance: 872, 1.3k, 14k, 1.4m. One decimal
// while the leading figure is doing the work, none once three digits carry it.
// A row with no `rung` is not a ladder (a building, a one-off, a job) and is
// never finished.
export const rungOf = u => (u.rung ? u.rung() : 0);
// `RUNGS` unless the row says otherwise (the kit ladders are `KIT_MAX`). Read
// through one function because the pips, the count, "done" and the fold all
// ask, and a cap only some of them know about is a row that says 3/5 and
// cannot be bought.
export const rungsOf = u => (u.rungs ? u.rungs() : RUNGS);
export const maxed = u => !!u.rung && rungOf(u) >= rungsOf(u);

// Whether a finished row may be folded off its board by "finished: hidden".
// A kit row says `keep`: it is the only place to read how many hats a station
// owns, and that fact becomes final exactly when the ladder finishes.
export const folds = u => maxed(u) && !u.keep;

export const fmt = n => {
  const v = Math.round(n || 0), a = Math.abs(v);
  if (a < 1000) return String(v);
  for (const [d, s] of [[1e9, 'b'], [1e6, 'm'], [1e3, 'k']]) {
    if (a < d) continue;
    const q = Math.abs(v) / d;
    const t = q >= 99.95 ? Math.round(q) : Math.round(q * 10) / 10;
    // 999.96k rounds to "1000k"; that reading belongs to the next unit up
    if (t >= 1000) return (v < 0 ? '-' : '') + 1 + { k: 'm', m: 'b', b: 't' }[s];
    return (v < 0 ? '-' : '') + t + s;
  }
};

export const MARK = {
  dust: '<i class="dust"></i>',
  shard: '<i class="shard"></i>',
  spore: '<i class="spore"></i>',
  spark: '<i class="spark"></i>',
  scale: '<i class="scale"></i>',
  time: '<i class="clock"></i>'
};

// What you have of one. You cannot be short of time, so a bill asking for it
// is never the reason a row is out of reach.
export const purse = money =>
  money === 'time' ? Infinity :
  money === 'shard' ? S.shards :
  money === 'spore' ? S.spores :
  money === 'spark' ? S.sparks :
  // Every scale lying on the deep's floor, counted by the bed that holds them.
  money === 'scale' ? S.scales :
  // Hell's, off its store and its anvil (hell/coins.js).
  isHellCoin(money) ? hellPurse(money) :
  S.stored;

// What a unit is *drawn* as, for the units the yard has a coin for. A unit not
// in here is written out in the row's own word (see `gainText`).
export const UNITS = {
  'px': '<i class="dust"></i>',
  'px/s': msg('unit-per-s', { icon: '<i class="dust"></i>' }),
  'trips/min': msg('unit-per-min', { icon: '<i class="shard"></i>' }),
  'plots/min': msg('unit-per-min', { icon: '<i class="spore"></i>' }),
  'shards/dig': msg('unit-per-dig', { icon: '<i class="shard"></i>' }),
  'spores/cut': msg('unit-per-harvest', { icon: '<i class="spore"></i>' })
};

// And what the others are said as: a row keeps its unit as a key (the
// symbols, % and x, are compared against), and the words are the language's.
// A unit in neither table is written as it stands.
const UNIT_WORDS = {
  'hits/s': msg('unit-hits-s'), 'hit/s': msg('unit-hit-s'), 'throws/s': msg('unit-throws-s'),
  'bolts/min': msg('unit-bolts-min'), 'cells/bolt': msg('unit-cells-bolt'), 'motes/s': msg('unit-motes-s'),
  'plots': msg('unit-plots'), 'shovels': msg('unit-shovels'), 'pots': msg('unit-pots'), 'doses': msg('unit-doses'),
  's': msg('unit-s'), 'dmg': msg('unit-dmg'), 'dmg/s': msg('unit-dmg-s'),
  'faster': msg('unit-faster'), 'stronger': msg('unit-stronger'), 'crit': msg('unit-crit')
};

// A second is written 's' wherever it is a unit; the clock glyph is the bill's
// alone, because the same glyph meaning "per second" on the gain line and "a
// price in time" on the bill forty pixels below it read as two things.
export const unitText = unit => UNITS[unit] || UNIT_WORDS[unit] || unit;

export const num = v => (v < 10 ? v.toFixed(1) : String(Math.round(v)));

// --- what a row says it gives you -------------------------------------------
// A row says what buying it *changes*, never a number the game is keeping.
// Two shapes only: a count goes "a -> b" and a rate goes "+n%". The verb the
// number is about (`does`) leads the line, because "boots +45%" leaves the one
// word that matters to the player's guess; test/gain-verb.test.mjs holds
// every proportional row to having one.
// `verb` false leaves the verb off: a shelf tile's name is its verb.
export const gainText = (u, verb = true) => {
  // A finished ladder has nothing left to give, verb included.
  if (maxed(u)) return '';
  const amount = gainAmount(u);
  // A row with no amount that is waiting on something says what, where the
  // gain would go: the drill and the tiller before their set of hats.
  const waits = !amount && u.waits ? u.waits() : '';
  if (waits) return waits;
  // A door has no amount to print; it says what the place is for instead.
  if (!amount && u.blurb) return u.blurb;
  return amount && u.does && verb ? msg('gain-does', { does: u.does, amount }) : amount;
};
// What a machine row says until its station's set of hats is bought: the
// owner's words, the count the live one.
const UNLOCK = { grower: 'unlock-grower', blaster: 'unlock-blaster' };
export const unlockText = (left, bought, noun) => msg(UNLOCK[noun], { left, more: bought ? 'yes' : 'no' });

const gainAmount = u => {
  if (!u.to) return '';
  const b = Number(u.to());
  if (!isFinite(b)) return '';
  // The gain shares a narrow column with the bill, so the amount is glued to
  // its mark with a no-break space: the verb may wrap off, the amount never
  // breaks. A bare symbol (%, x) sits against its number like everywhere else.
  const NB = ' ';
  const mark = !u.unit ? '' : /^[%x]$/.test(u.unit) ? u.unit : NB + unitText(u.unit);
  // A `to` with no `from` is not a step up a ladder, it is what you get.
  if (!u.from) return `${Number.isInteger(b) ? b : num(b)}${mark}`;
  const a = Number(u.from());
  if (!isFinite(a)) return '';
  // A count says now and after: one to two is doubling, eleven to twelve is
  // not, and "+1" reads the same for both. Counts only; a rate is already a
  // comparison.
  if (!u.pct) {
    const say = v => (Number.isInteger(v) ? v : num(v));
    return `${say(a)}${NB}→${NB}${say(b)}${mark}`;
  }
  // A rate stepping onto its floor can gain a real amount and round to 0%,
  // which reads as broken, so the least a purchase claims is one per cent.
  // No mark after a proportion: the unit cancels out of it.
  const up = a > 0 ? Math.round((b / a - 1) * 100) : 0;
  return `+${b > a ? Math.max(1, up) : up}%`;
};

// A price in the words it is said in: coins in the counter's short form,
// time off a clock.
export const priceText = (money, n) =>
  money !== 'time' ? fmt(n) :
  n >= 60000 ? msg('price-min', { n: Math.round(n / 60000) }) : `${Math.ceil(n / 1000)}`;

// Time left on a build, to the second: `0:47`, `1:02:05`. Ceiling, so it
// reads 0:01 until the last blow and never 0:00 on a thing not up.
export const leftText = ms => {
  const s = Math.max(0, Math.ceil(ms / 1000)), m = Math.floor(s / 60) % 60, h = Math.floor(s / 3600);
  const two = n => String(n).padStart(2, '0');
  return h ? `${h}:${two(m)}:${two(s % 60)}` : `${m}:${two(s % 60)}`;
};
// How long a yard has been played (`playedS`, in seconds), the way the books
// and the saves page both say it: `3h 12m`, and only the minutes under an
// hour. Floored, so a yard reads the time it has actually had.
export const sayPlayed = sec => {
  const m = Math.floor(Math.max(0, sec || 0) / 60), h = Math.floor(m / 60);
  return h ? msg('played-hm', { h, m: m % 60 }) : msg('played-m', { m });
};
export const ordinal = n => msg('ordinal', { n: placeOf(n) });

// A signed change as arrows, against three steps: under the first is level,
// then one arrow, two, three. The air filter's board and the books both draw
// with it, so an arrow is the same kind of thing wherever it stands.
const UP = '▲', DOWN = '▼', LEVEL = '—';
export function arrowsFor(t, steps) {
  const size = Math.abs(t);
  if (size < steps[0]) return LEVEL;
  const n = size < steps[1] ? 1 : size < steps[2] ? 2 : 3;
  return (t > 0 ? UP : DOWN).repeat(n);
}
