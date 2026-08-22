// Turning a list of upgrades into rows on a board, and keeping them current.
//
// It knows nothing about what any upgrade does, and nothing about which board it
// is filling: the bench and the lab are the same code with a different list. A
// new upgrade appears without this file changing, and a third board would be
// three lines.

import { S } from './state.js';
import { UPGRADES, SECTIONS, UNITS, MARK, purse, buy } from './upgrades.js';
import { LAB_UPGRADES, LAB_SECTIONS, progress } from './lab.js';

const shopEl = document.getElementById('shop');
const labEl = document.getElementById('labshop');

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
function build(el, list, sections) {
  const now = shape(list, sections);
  if (built.get(el) === now) return;
  built.set(el, now);

  el.textContent = '';
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
      el.appendChild(b);
    }
  }
}

// the numbers on the rows, every frame the board is open
export function refresh(el, list, headcount) {
  for (const row of el.children) {
    if (row.dataset.sect) {
      const n = headcount ? headcount(row.dataset.sect) : 0;
      row.textContent = n ? `${row.dataset.sect}  x${n}` : row.dataset.sect;
      continue;
    }
    if (row.dataset.job) {
      const u = list.find(x => x.key === row.dataset.job);
      if (!u) continue;
      row.children[1].disabled = u.count() < 1;
      row.children[2].textContent = u.count();
      row.children[3].disabled = u.spare() < 1;
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
      name.textContent = u.name;
      from.textContent = mine ? 'working' : '';
      arrow.textContent = '';
      to.textContent = mine ? `${Math.round(progress() * 100)}%` : '';
      price.innerHTML = mine ? '' : `${MARK[money]} ${cost}`;
      row.disabled = true;
      continue;
    }

    name.textContent = u.name;
    from.textContent = step;
    arrow.textContent = step ? '→' : '';
    to.innerHTML = step ? `${u.to()}${u.unit ? ' ' + UNITS[u.unit] : ''}` : '';
    price.innerHTML = `${MARK[money]} ${cost}`;
    row.disabled = purse(money) < cost;
  }
}

export function buildShop() {
  build(shopEl, UPGRADES, SECTIONS);
  build(labEl, LAB_UPGRADES, LAB_SECTIONS);
}



export { UPGRADES, LAB_UPGRADES };
