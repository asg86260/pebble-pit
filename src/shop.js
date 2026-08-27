// Turning a list of upgrades into rows on a board, and keeping them current.
//
// It knows nothing about what any upgrade does, and nothing about which board it
// is filling: the bench and the lab are the same code with a different list. A
// new upgrade appears without this file changing, and a third board would be
// three lines.

import { S } from './state.js';
import { showTipAt } from './board.js';
import { UPGRADES, SECTIONS, MARK, buy, gainText, billOf, canPay } from './upgrades.js';
import { closeBoard } from './board.js';
import { LAB_UPGRADES, LAB_SECTIONS } from './lab.js';
import { SCHOOL_UPGRADES, SCHOOL_SECTIONS } from './school.js';
import { CASINO_UPGRADES, CASINO_SECTIONS } from './casino.js';
import { SCRUB_UPGRADES, SCRUB_SECTIONS } from './scrubhouse.js';
import { QUARRY_UPGRADES, QUARRY_SECTIONS } from './quarry.js';
import { FARM_UPGRADES, FARM_SECTIONS } from './farm.js';
import { TOWER_UPGRADES, TOWER_SECTIONS } from './tower.js';
import { crewRows, crewSections } from './crewboard.js';

const shopEl = document.getElementById('shop');
const labEl = document.getElementById('labshop');
const schoolEl = document.getElementById('schoolshop');
const casinoEl = document.getElementById('casinoshop');
const crewEl = document.getElementById('crewshop');
const scrubEl = document.getElementById('scrubshop');
const quarryEl = document.getElementById('quarryshop');
const farmEl = document.getElementById('farmshop');
const towerEl = document.getElementById('towershop');

// What is on the board right now, as a string. If it has not changed there is
// nothing to build: the numbers on the rows are refreshed every frame anyway,
// and only the *set* of rows needs the DOM touched.
function shape(list, sections) {
  const out = [];
  for (const sect of sections) {
    const rows = sect.keys.filter(k => {
      const u = list.find(x => x.key === k);
      return u && u.show();
    });
    if (rows.length) out.push(sect.title, ...rows);
  }
  return out.join(',');
}

// Did that press do anything? A row is gone or greyed after a purchase, and the
// simplest honest test is whether the thing it sells is now had -- but rows do
// not all have such a thing, so it is asked the other way round: a row that can
// no longer be pressed is a row that just fired.
const bought = u => !u.show() || !canPay(u);

const built = new WeakMap();

// Set when the set of rows changed, read once by the board after it has filled
// them in. A flag rather than a call back into the board: this happens on a
// purchase or a hire, and what has to happen next is a measurement of a board
// with its words in, which is the frame loop's business and not this file's.
let rebuilt = false;
export const tookRows = () => { const was = rebuilt; rebuilt = false; return was; };

// One row per available upgrade, under a heading for whatever it belongs to.
//
// It is rebuilt only when the set of rows changes. Rebuilding throws away every
// row element and makes new ones, which takes the row under the cursor with it
// -- and the hover on it. A worker tipping a shard into the pit rebuilt the
// whole board, so the highlight blinked off every time anybody banked anything.
function build(el, list, sections, empty) {
  const now = shape(list, sections);
  if (built.get(el) === now) return;
  built.set(el, now);

  // A row going or arriving makes the sheet a different height, and the sheet is
  // seated by the height it was last measured at -- so buying the last upgrade
  // in a section left the board hanging where the taller version of it had
  // stood, with a gap under it and its foot off the bench.
  //
  // Said rather than done. The rows built below are empty until `refresh` puts
  // the words in, and a board measured between the two comes out shorter than
  // it will be -- the same trap opening one used to fall into. So the board is
  // told the set changed and measures itself after it has filled the rows in.
  rebuilt = true;

  el.textContent = '';
  if (!now) {                              // nothing to show: say so rather than nothing
    const line = document.createElement('div');
    line.className = 'empty';
    line.textContent = empty;
    el.appendChild(line);
    return;
  }
  for (const sect of sections) {
    const rows = sect.keys
      .map(k => list.find(u => u.key === k))
      .filter(u => u && u.show());
    if (!rows.length) continue;

    const head = document.createElement('div');
    head.className = 'sect';
    head.dataset.sect = sect.title;
    el.appendChild(head);

    for (const u of rows) {
      // A dial is the same shape as a job row -- a setting between two buttons --
      // for a setting that is not a headcount. The casino's chip is the only
      // one: how much goes on the table is chosen, and choosing spends nothing.
      if (u.dial) {
        const row = document.createElement('div');
        row.className = 'job';
        row.dataset.dial = u.key;
        row.innerHTML = '<span class="name"></span><button type="button" class="less">-</button>' +
                        '<span class="count"></span><button type="button" class="more">+</button>';
        row.children[0].textContent = u.name;
        row.children[1].addEventListener('click', () => u.less());
        row.children[3].addEventListener('click', () => u.more());
        el.appendChild(row);
        continue;
      }

      // A job row moves bodies rather than spending anything, so it is a count
      // between two buttons instead of one button with a price on it.
      if (u.job) {
        const row = document.createElement('div');
        row.className = 'job';
        row.dataset.job = u.key;
        row.innerHTML = '<span class="name"></span><button type="button" class="less">-</button>' +
                        '<span class="count"></span><button type="button" class="more">+</button>';
        row.children[0].textContent = u.name;
        row.children[1].addEventListener('click', () => u.less());
        row.children[3].addEventListener('click', () => u.more());
        el.appendChild(row);
        continue;
      }

      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.key = u.key;
      // Three cells, not five. A row is a name, what buying it gives you, and
      // what it costs -- there is no before-and-after any more, so there is no
      // arrow between them and nothing to line the two halves up against.
      b.innerHTML = '<span class="name"></span><span class="gain"></span>' +
                    '<span class="cost"></span>';
      // A readout is not a purchase. It keeps the shape of a row so the board
      // still lines up, and gives up everything that says "press me": the class
      // takes the cursor and the hover off in the stylesheet, and there is no
      // click to hang on it in the first place.
      if (u.read) b.classList.add('stat');
      // Buying is the end of what you came to the board for, so the board goes.
      // It used to stay open under the cursor with the row you just bought now
      // greyed or gone, which reads as the press not having landed -- and the
      // sheet then sits over the thing you just paid for.
      //
      // Only when something actually happened: a press on a row you cannot
      // afford leaves the board where it is, because you are still deciding.
      else b.addEventListener('click', () => {
        const before = S.dirty;
        buy(u);
        if (bought(u)) closeBoard();
      });
      // A row that has something to say says it on hover, in the same words in
      // the same box the yard uses for a mark you went and looked at. It is the
      // one place a *name* is not enough: a breaker is a word, and what a
      // breaker does is the reason you would buy one.
      if (u.note) {
        const say = () => {
          const r = b.getBoundingClientRect();
          showTipAt(u.note(), r.right + 8, r.top - 2);
        };
        b.addEventListener('pointerenter', say);
        b.addEventListener('pointermove', say);
        b.addEventListener('pointerleave', () => showTipAt(null));
      }
      el.appendChild(b);
    }
  }
}

// the numbers on the rows, every frame the board is open
// A cell is written only when what it says changes.
//
// This runs on every row of an open board, on every frame -- fifteen rows, five
// cells each -- and it used to write all of them every time. `innerHTML` is a
// parse, so a price that had not moved was parsed sixty times a second, and a
// text node was replaced for every name on the board. Nothing on a shop row
// changes more than a few times a minute. The board is careful about this in
// every other place; this is the one that was not.
const say = (el, text) => { if (el._said !== text) { el._said = text; el.textContent = text; } };
const sayHTML = (el, html) => { if (el._said !== html) { el._said = html; el.innerHTML = html; } };
const grey = (el, off) => { if (el.disabled !== off) el.disabled = off; };

export function refresh(el, list, headcount) {
  for (const row of el.children) {
    if (row.dataset.sect) {
      // The heading is the only text in the row's own textContent, so overwriting
      // it here can never leave a stale badge behind; the badge, when there is
      // one, is appended after as its own element rather than folded into the
      // words, so the count can be styled apart from a title that stays dim.
      const n = headcount ? headcount(row.dataset.sect) : 0;
      // And only when it actually changes. This runs every frame the board is
      // open, and building a fresh element sixty times a second lays the whole
      // panel out sixty times a second, for a number that moves when you move
      // somebody. The board is careful about this everywhere else; so is this.
      if (row.dataset.count === String(n)) continue;
      row.dataset.count = n;
      row.textContent = row.dataset.sect;
      if (n) {
        const badge = document.createElement('span');
        badge.className = 'badge';
        badge.textContent = n;
        row.appendChild(badge);
      }
      continue;
    }
    if (row.dataset.dial) {
      const u = list.find(x => x.key === row.dataset.dial);
      if (!u) continue;
      grey(row.children[1], u.lo());
      say(row.children[2], u.value());
      grey(row.children[3], u.hi());
      continue;
    }
    if (row.dataset.job) {
      const u = list.find(x => x.key === row.dataset.job);
      if (!u) continue;
      grey(row.children[1], u.count() < 1);
      say(row.children[2], String(u.count()));
      grey(row.children[3], u.spare() < 1);
      continue;
    }
    const u = list.find(x => x.key === row.dataset.key);
    if (!u) continue;
    // What it costs, as a mark and a number for each currency in the bill. All
    // but one row in the game is priced in a single thing; the tower is priced
    // in all four, and reading every price the same way is what lets it be.
    const bill = billOf(u).map(([money, n]) => `${MARK[money]} ${n}`).join(' ');
    const [name, gain, price] = row.children;

    // A piece of research under way says so in place of its numbers, and
    // nothing else on that board can be started until it is finished.
    if (S.research && list === LAB_UPGRADES) {
      const mine = S.research.key === u.key;
      say(name, u.name);
      sayHTML(gain, mine ? 'working' : '');   // how far along is a bar over the lab now
      sayHTML(price, mine ? '' : bill);
      grey(row, true);
      continue;
    }

    // and a dot on anything that has not been on a board you have looked at
    const fresh = !S.seenRows.includes(u.key);
    if (row.classList.contains('new') !== fresh) row.classList.toggle('new', fresh);

    say(name, u.name);
    sayHTML(gain, gainText(u));
    // A row that is not a purchase says what it *pays* where a price would go.
    // The casino's two decisions are the only ones: neither costs anything, and
    // the number either of them is about is the one on the table.
    sayHTML(price, u.price ? u.price() : bill);
    grey(row, u.price ? !!u.dead?.() : !canPay(u));
  }
}

// --- what is new on it --------------------------------------------------------
// A row appearing is the game telling you something, and it used to tell you by
// making the list one longer. Which is fine if you had the old list memorised
// and invisible otherwise: the board is a dozen rows and they are all the same
// shape, so a new one among them is a needle.
//
// So a row you have never had on a board carries a dot until you have had the
// board open with it on. Marked when the board *closes*, not when it opens --
// clearing it on open would clear it in the same frame it was drawn, and you
// would never once see one.
export function markRowsSeen(list) {
  const seen = new Set(S.seenRows);
  let added = false;
  for (const u of list) {
    if (!u.show || !u.show() || seen.has(u.key)) continue;
    seen.add(u.key);
    added = true;
  }
  if (!added) return;
  S.seenRows = [...seen];
  S.dirty = true;
}

// The crew board, rebuilt from the people who are actually here. Its own call
// because the list is people rather than upgrades: it changes length whenever
// anybody is hired, and `build` is already careful about only touching the DOM
// when the set of rows changes.
export function buildCrew() {
  build(crewEl, crewRows(), crewSections(), 'nobody lives here yet');
}

export function buildShop() {
  build(shopEl, UPGRADES, SECTIONS, 'nothing to sell');
  // The table is empty between hands, and says so rather than standing blank.
  build(casinoEl, CASINO_UPGRADES, CASINO_SECTIONS, 'nothing on the table');
  build(labEl, LAB_UPGRADES, LAB_SECTIONS, 'nothing to look into');
  build(scrubEl, SCRUB_UPGRADES, SCRUB_SECTIONS, 'nothing to fit');
  // The cut and the plots run out: there is only so far down and only so much
  // ground. A board with nothing left on it says so rather than standing blank.
  build(quarryEl, QUARRY_UPGRADES, QUARRY_SECTIONS, 'the cut is as deep as it goes');
  build(farmEl, FARM_UPGRADES, FARM_SECTIONS, 'the ground is all broken');
  build(towerEl, TOWER_UPGRADES, TOWER_SECTIONS, 'nothing stirs in here yet');
  // The school runs out on purpose: one trade per job, and once everybody doing
  // a job has it there is nobody left to send.
  build(schoolEl, SCHOOL_UPGRADES, SCHOOL_SECTIONS, 'nobody left to teach');
}



export { UPGRADES, LAB_UPGRADES, SCHOOL_UPGRADES, CASINO_UPGRADES, QUARRY_UPGRADES, FARM_UPGRADES };
