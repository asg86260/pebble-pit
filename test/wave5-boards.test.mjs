// Wave 5, Track F3: what the boards say, and what the books measure.
//
// Three subjects, and they are all about the *boards* rather than about the
// yard: seconds are a clock and never the letter s, the janitor's rows are filed
// at the outhouse, and the books over the pit report what the yard
// actually earned rather than what it ought to.
//
// The pips and the clock face itself are not in here and cannot be: no check in
// either tier can see how big a pip is or how many hands a clock has. Those are
// shots -- `node tools/look.mjs bench,books`.

import { group, ok, state, run, yard } from './helpers.mjs';
import { UPGRADES } from '../src/upgrades.js';
import { gainText, unitText, MARK } from '../src/words.js';
import { TOWER_UPGRADES } from '../src/tower.js';
import { FILTER_UPGRADES } from '../src/filter.js';
import { QUARRY_UPGRADES } from '../src/quarry.js';
import { FARM_UPGRADES } from '../src/farm.js';
import { APOTHECARY_UPGRADES } from '../src/apothecary.js';
import { BOOK_ROWS } from '../src/stats.js';
import { bookRate, bookSpan } from '../src/income.js';
import { STATS_OVER_S, STATS_OVER_DEFAULT } from '../src/config.js';
import { buy } from '../src/upgrades.js';
import { refund } from '../src/pit.js';
import { showPanel, hud } from '../src/board.js';

const ALL_ROWS = [...UPGRADES, ...TOWER_UPGRADES,
                  ...FILTER_UPGRADES, ...QUARRY_UPGRADES, ...FARM_UPGRADES,
                  ...APOTHECARY_UPGRADES];

// --- seconds are a clock ------------------------------------------------------
// The letter was on four rows across two stations -- "a longer dose, +14 s" --
// and on every rate that names a per-second unit. It is fixed in the one place
// that turns a row's unit into words (`unitText`), so a row written tomorrow
// gets it without knowing this check exists, which is the thing worth asserting.
group('no row spells a second with the letter s', async () => {
  window.__reset();
  window.__fullSites();
  window.__invest();

  const bad = [];
  for (const u of ALL_ROWS) {
    const text = gainText(u);
    if (!text) continue;
    // The clock is the bill's mark for a price in time, and a gain line that
    // wore it too said two things with one glyph (critics 2026-09-10, C9): a
    // gain line never carries it.
    if (text.includes(MARK.time)) bad.push(`${u.key}: ${text}`);
  }
  return [
    ok(unitText('s') === 's', 'a duration is written in seconds', unitText('s')),
    ok(unitText('px/s').endsWith('/s'), 'and a rate is per second', unitText('px/s')),
    ok(unitText('plots/min').endsWith('/min'), 'and minutes are minutes', unitText('plots/min')),
    ok(bad.length === 0, "and no gain line on any board wears the bill's clock",
       bad.join(', ') || 'none')
  ];
});

// The janitor's closet used to be a section on the bench, and this file used to
// check that it was. It is a board of its own now -- see test/wave5-closet.test.mjs
// -- so the group moved there with the feature rather than being kept here
// asserting where the rows are not.

// --- the books ----------------------------------------------------------------
// Measured, not predicted. The point of this check is that the number on the
// board agrees with what the counter actually did over the same seconds -- if it
// were computed from what the yard *should* yield, an idle station would not
// move it and this would pass anyway, so the comparison is against `banked`.
group('the books report what the yard actually earned', async () => {
  window.__reset();
  window.__crew(3, 3);
  run(60);                                     // long enough to fill the window

  const before = yard.S.banked;
  run(STATS_OVER_DEFAULT);                     // exactly one window's worth
  const after = yard.S.banked;
  const truth = (after - before) / STATS_OVER_DEFAULT;
  const said = bookRate('dust');

  return [
    ok(after > before, 'the yard is earning something', `${before} -> ${after}`),
    ok(bookSpan() > 20, 'and the books have a window to divide by',
       `${bookSpan().toFixed(1)}s`),
    ok(said > 0, 'so they report a rate', said.toFixed(2)),
    // A band rather than an equality: the window covers the same seconds but
    // its edges are a bucket either side of them.
    ok(said > truth * 0.9 && said < truth * 1.1,
       'and it is the rate the counter actually moved at',
       `books ${said.toFixed(2)}/s against ${truth.toFixed(2)}/s`)
  ];
});

// Spending is not negative production. Reading a rate off a balance is the
// simplest thing to do and the wrong one: buying a forty-thousand-dust row would
// read as the yard running backwards for half a minute.
group('a purchase does not read as the yard running backwards', async () => {
  window.__reset();
  window.__crew(3, 3);
  run(45);
  const earning = bookRate('dust');

  window.__give(40000);
  yard.spend(40000);
  run(3);
  const after = bookRate('dust');

  return [
    ok(earning > 0, 'the yard was earning', earning.toFixed(2)),
    ok(after >= earning * 0.5,
       'and it still is after a big purchase', `${earning.toFixed(2)} -> ${after.toFixed(2)}`)
  ];
});

// A bill handed back is the player's own coin coming home. The books once read
// every rise in a balance as income, so five hundred ore handed back read as a
// quarry for as long as the window held it. `refund` is what a row pressed
// back out of the line calls (`buy` in upgrades.js).
group('a bill handed back is not income', async () => {
  window.__reset();
  window.__fullSites();
  window.__crew(4, 4, 4, 0);
  run(90);
  const ore = bookRate('shard'), dust = bookRate('dust');
  const had = yard.S.shards;

  refund('shard', 500, 0, 0);
  refund('dust', 5000, 0, 0);
  run(1);

  return [
    ok(yard.S.shards >= had + 500, 'the ore came back to the purse', `${had} -> ${yard.S.shards}`),
    ok(bookRate('shard') < ore + 1, 'and the ore rate did not jump for it',
       `${ore.toFixed(2)} -> ${bookRate('shard').toFixed(2)}`),
    ok(bookRate('dust') < dust + 5, 'nor the pebbles',
       `${dust.toFixed(2)} -> ${bookRate('dust').toFixed(2)}`)
  ];
});

// The window is picked on the board. Pressed the way the board presses a row
// (`buy`, which is what the tap calls), it steps through every window and
// round again, each rate is what came in over that many seconds, and the
// choice comes back after a reload.
group('the books can be read over a window the player picks', async () => {
  window.__reset();
  window.__crew(3, 3);
  run(Math.max(...STATS_OVER_S) + 10);         // a record longer than any window

  const row = BOOK_ROWS.find(u => u.key === 'ratesover');
  const steps = [], says = [], spans = [];
  for (let i = 0; i < STATS_OVER_S.length; i++) {
    buy(row);
    steps.push(yard.S.booksOver);
    says.push(row.price());
    spans.push(bookSpan());
  }

  // Just the arithmetic: the same record, cut at two lengths.
  const before = yard.S.banked;
  run(30);
  const truth = (yard.S.banked - before) / 30;
  const short = bookRate('dust', 30);

  const picked = yard.S.booksOver;
  buy(row);
  const next = yard.S.booksOver;
  window.__reload();

  const want = [...STATS_OVER_S.slice(STATS_OVER_S.indexOf(STATS_OVER_DEFAULT) + 1),
                ...STATS_OVER_S.slice(0, STATS_OVER_S.indexOf(STATS_OVER_DEFAULT) + 1)];
  return [
    ok(row && steps.join(',') === want.join(','), 'pressing it steps through every window and round',
       steps.join(',')),
    ok(says.every(w => /min$/.test(w)), 'and says each in minutes',
       says.join(' | ')),
    ok(spans.every((sp, i) => Math.abs(sp - steps[i]) <= 1), 'each rate is divided by the seconds it names',
       spans.map(x => x.toFixed(1)).join(',')),
    ok(short > truth * 0.9 && short < truth * 1.1, 'and is what came in over them',
       `books ${short.toFixed(2)}/s against ${truth.toFixed(2)}/s`),
    ok(yard.S.booksOver === next && next !== picked, 'and the choice is still there after a reload',
       `${picked} -> ${next} -> ${yard.S.booksOver}`)
  ];
});

// And what the board itself prints, through the board: the row is built by the
// same builder every other row goes through, and what it says is read back off
// the sheet rather than off the function behind it.
group('the books board prints a rate as a mark and a number under a heading that says a second', async () => {
  window.__reset();
  window.__crew(3, 3);
  run(40);

  showPanel('stats', true);
  hud();
  const rows = [...document.getElementById('statsshop').children];
  const dust = rows.find(r => r.dataset.key === 'ratedust');
  // The rate rides the price cell as a mark and a number. "A second" is the
  // heading's word, said once over the rates rather than as a clock on every
  // line -- the books are a ledger (DESIGN.md, "The shelf", the books). The
  // browser twin of this check is in src/selftest/boards.js.
  const cost = dust && dust.querySelector('.cost');
  const said = cost ? cost.innerHTML : '';
  // (Off the board's own children: the node yard's DOM knows `.cls` selectors
  // and nothing else.)
  const heading = rows.filter(r => r.dataset.sect).map(r => r.dataset.sect).join(' | ');
  showPanel(null, true);

  return [
    ok(state().statsBoardOpen === false, 'the board closes again when asked'),
    ok(!!dust, 'the books draw a row for dust', rows.map(r => r.dataset.key).join(',')),
    ok(/class="dust"/.test(said) && /\d/.test(said) && !/class="clock"/.test(said), 'and it says its rate as a mark and a number', said),
    ok(/a second/.test(heading), 'and the heading says the rate is a second', heading),
    ok(!/\/s(\b|<|$)/.test(said), 'and never over the letter s', said)
  ];
});
