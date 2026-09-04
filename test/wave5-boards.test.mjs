// Wave 5, Track F3: what the boards say, and what the books measure.
//
// Three subjects, and they are all about the *boards* rather than about the
// yard: seconds are a clock and never the letter s, the janitor's rows are filed
// under the janitor's closet, and the books over the pit report what the yard
// actually earned rather than what it ought to.
//
// The pips and the clock face itself are not in here and cannot be: no check in
// either tier can see how big a pip is or how many hands a clock has. Those are
// shots -- `node tools/look.mjs bench,books`.

import { group, ok, state, run, yard } from './helpers.mjs';
import { gainText, unitText, MARK, SECTIONS, UPGRADES } from '../src/upgrades.js';
import { LAB_UPGRADES } from '../src/lab.js';
import { TOWER_UPGRADES } from '../src/tower.js';
import { SCHOOL_UPGRADES } from '../src/school.js';
import { SCRUB_UPGRADES } from '../src/scrubhouse.js';
import { QUARRY_UPGRADES } from '../src/quarry.js';
import { FARM_UPGRADES } from '../src/farm.js';
import { APOTHECARY_UPGRADES } from '../src/apothecary.js';
import { bookRate, bookSpan } from '../src/stats.js';
import { showPanel, hud } from '../src/board.js';
import { buildBoard } from '../src/shop.js';

const ALL_ROWS = [...UPGRADES, ...LAB_UPGRADES, ...TOWER_UPGRADES, ...SCHOOL_UPGRADES,
                  ...SCRUB_UPGRADES, ...QUARRY_UPGRADES, ...FARM_UPGRADES,
                  ...APOTHECARY_UPGRADES];

// --- seconds are a clock ------------------------------------------------------
// The letter was on four rows across two stations -- "a longer dose, +14 s" --
// and on every rate that names a per-second unit. It is fixed in the one place
// that turns a row's unit into words (`unitText`), so a row written tomorrow
// gets it without knowing this check exists, which is the thing worth asserting.
group('no row spells a second with the letter s', async () => {
  window.__reset();
  window.__fullSites();
  window.__lab(true);

  const bad = [];
  for (const u of ALL_ROWS) {
    const text = gainText(u);
    if (!text) continue;
    // The unit is the tail of the line, so this is where a stray `s` would be:
    // a bare one after the number, or one hanging off a rate's slash.
    if (/\/s(\b|$)/.test(text) || /\ss$/.test(text)) bad.push(`${u.key}: ${text}`);
  }
  const clock = MARK.time;
  return [
    ok(unitText('s') === clock, 'a duration is the clock itself', unitText('s')),
    ok(unitText('px/s').endsWith(`/${clock}`),
       'and a rate is over one', unitText('px/s')),
    ok(unitText('motes/s').endsWith(`/${clock}`),
       'including a rate whose unit the board has no coin for', unitText('motes/s')),
    ok(unitText('plots/min').endsWith('/min'),
       'minutes are left alone -- it is the second that had no mark',
       unitText('plots/min')),
    ok(bad.length === 0, 'and no row on any board prints one',
       bad.join(', ') || 'none')
  ];
});

// --- the janitor's closet -----------------------------------------------------
// Bought the way a player buys it: the mess appears, the row appears with it,
// the row is pressed, and the yard builds the thing. Then the board is asked
// what heading it drew over it.
group('the closet is bought off the bench and filed under its own heading', async () => {
  window.__reset();
  window.__crew(3, 2);
  window.__tune('LOO_EVERY', 4000);            // so they go while we are watching
  window.__air({ haze: 0, muck: 0 });
  run(90);
  const messy = state();

  // The row is on the board because there is mess on the ground, which is the
  // only thing that puts it there -- see `show` on `unlockouthouse`.
  window.__give(20000);
  const pressed = window.__buy('unlockouthouse');
  window.__finish();                           // it is a building; the yard puts it up
  const built = state();

  // and what the bench actually drew over it
  buildBoard('bench');
  const shopEl = document.getElementById('shop');
  const heads = [...shopEl.children].map(c => c.dataset.sect).filter(Boolean);
  const sect = SECTIONS.find(x => x.title === "the janitor's closet");

  window.__reset();
  return [
    ok(messy.smog.poop > 0, 'there is mess, so the row is on the board',
       `${messy.smog.poop} cells`),
    ok(pressed && built.outhouseOpen, 'pressing it puts the closet up'),
    ok(!!sect && sect.keys.includes('unlockouthouse') && sect.keys.includes('loopost'),
       'both of the janitor rows are in the closet section',
       sect ? sect.keys.join(',') : 'no such section'),
    ok(!heads.includes('the outhouse'), 'and nothing on the bench says "the outhouse"',
       heads.join(', '))
  ];
});

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
  run(30);                                     // exactly one window's worth
  const after = yard.S.banked;
  const truth = (after - before) / 30;
  const said = bookRate('dust');

  return [
    ok(after > before, 'the yard is earning something', `${before} -> ${after}`),
    ok(bookSpan() > 20, 'and the books have a window to divide by',
       `${bookSpan().toFixed(1)}s`),
    ok(said > 0, 'so they report a rate', said.toFixed(2)),
    // A band rather than an equality: the window covers the same thirty seconds
    // but its edges are a sample either side of them.
    ok(said > truth * 0.6 && said < truth * 1.6,
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

// And what the board itself prints, through the board: the row is built by the
// same builder every other row goes through, and what it says is read back off
// the sheet rather than off the function behind it.
group('the books board prints a rate with a clock on it', async () => {
  window.__reset();
  window.__crew(3, 3);
  run(40);

  showPanel('stats', true);
  hud();
  const rows = [...document.getElementById('statsshop').children];
  const dust = rows.find(r => r.dataset.key === 'ratedust');
  const cost = dust && dust.children[2];
  const said = cost ? cost.innerHTML : '';
  showPanel(null, true);

  return [
    ok(state().statsBoardOpen === false, 'the board closes again when asked'),
    ok(!!dust, 'the books draw a row for dust', rows.map(r => r.dataset.key).join(',')),
    ok(said.includes('class="clock"'), 'and it says its rate over a clock', said),
    ok(!/\/s(\b|<|$)/.test(said), 'and never over the letter s', said)
  ];
});
