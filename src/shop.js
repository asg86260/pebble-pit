// Turning a list of upgrades into rows on a board, and keeping them current.
//
// It knows nothing about what any upgrade does, and nothing about which board it
// is filling: the bench and the lab are the same code with a different list. A
// new upgrade appears without this file changing, and a third board would be
// three lines.

import { S } from './state.js';
import { UPGRADES, SECTIONS, UNITS, MARK, purse, buy } from './upgrades.js';
import { LAB_UPGRADES, LAB_SECTIONS, bookRows } from './lab.js';

const shopEl = document.getElementById('shop');
const labEl = document.getElementById('labshop');
const statsEl = document.getElementById('stats');

// one row per available upgrade, under a heading for whatever it belongs to
function build(el, list, sections) {
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
    const u = list.find(x => x.key === row.dataset.key);
    if (!u) continue;
    const cost = u.cost();
    const money = u.currency || 'dust';
    const [name, from, arrow, to, price] = row.children;
    const step = u.from ? `${u.from()}` : '';

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

// the lab's books, rebuilt whole because it is half a dozen short rows
export function refreshStats() {
  const rows = bookRows();
  if (statsEl.childElementCount !== rows.length * 2) {
    statsEl.textContent = '';
    for (const _ of rows) {
      statsEl.appendChild(document.createElement('span'));
      statsEl.appendChild(document.createElement('b'));
    }
  }
  rows.forEach(([label, value, mark], i) => {
    statsEl.children[i * 2].textContent = label;
    statsEl.children[i * 2 + 1].innerHTML =
      `${typeof value === 'number' ? value.toLocaleString('en-US') : value} ${mark ? MARK[mark] : ''}`;
  });
}

export { UPGRADES, LAB_UPGRADES };
