// Turning a list of upgrades into rows on a board, and keeping them current.
//
// It knows nothing about what any upgrade does, and nothing about which board it
// is filling: the bench and the lab are the same code with a different list. A
// new upgrade appears without this file changing, and a third board would be
// three lines.

import { S } from './state.js';
import { showTipAt } from './board.js';
import { UPGRADES, SECTIONS, UNITS, MARK, purse, buy } from './upgrades.js';
import { LAB_UPGRADES, LAB_SECTIONS } from './lab.js';
import { SCHOOL_UPGRADES, SCHOOL_SECTIONS } from './school.js';
import { CASINO_UPGRADES, CASINO_SECTIONS } from './casino.js';

const shopEl = document.getElementById('shop');
const labEl = document.getElementById('labshop');
const schoolEl = document.getElementById('schoolshop');
const casinoEl = document.getElementById('casinoshop');

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

const built = new WeakMap();

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
      b.innerHTML = '<span class="name"></span><span class="from"></span>' +
                    '<span class="arrow"></span><span class="to"></span>' +
                    '<span class="cost"></span>';
      b.addEventListener('click', () => buy(u));
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
    const cost = u.cost();
    const money = u.currency || 'dust';
    const [name, from, arrow, to, price] = row.children;
    const step = u.from ? `${u.from()}` : '';

    // A piece of research under way says so in place of its numbers, and
    // nothing else on that board can be started until it is finished.
    if (S.research && list === LAB_UPGRADES) {
      const mine = S.research.key === u.key;
      say(name, u.name);
      say(from, mine ? 'working' : '');
      say(arrow, '');
      say(to, '');                         // how far along is a bar over the lab now
      sayHTML(price, mine ? '' : `${MARK[money]} ${cost}`);
      grey(row, true);
      continue;
    }

    // and a dot on anything that has not been on a board you have looked at
    const fresh = !S.seenRows.includes(u.key);
    if (row.classList.contains('new') !== fresh) row.classList.toggle('new', fresh);

    say(name, u.name);
    say(from, step);
    say(arrow, step ? '→' : '');
    sayHTML(to, step ? `${u.to()}${u.unit ? ' ' + UNITS[u.unit] : ''}` : '');
    // A row that is not a purchase says what it *pays* where a price would go.
    // The casino's two decisions are the only ones: neither costs anything, and
    // the number either of them is about is the one on the table.
    sayHTML(price, u.price ? u.price() : `${MARK[money]} ${cost}`);
    grey(row, u.price ? !!u.dead?.() : purse(money) < cost);
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

export function buildShop() {
  build(shopEl, UPGRADES, SECTIONS, 'nothing to sell');
  // The table is empty between hands, and says so rather than standing blank.
  build(casinoEl, CASINO_UPGRADES, CASINO_SECTIONS, 'nothing on the table');
  build(labEl, LAB_UPGRADES, LAB_SECTIONS, 'nothing to look into');
  // The school runs out on purpose: one trade per job, and once everybody doing
  // a job has it there is nobody left to send.
  build(schoolEl, SCHOOL_UPGRADES, SCHOOL_SECTIONS, 'nobody left to teach');
}



export { UPGRADES, LAB_UPGRADES, SCHOOL_UPGRADES, CASINO_UPGRADES };
