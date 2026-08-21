// The board that opens at the workbench.
//
// It knows how to turn `UPGRADES` into rows and keep them current; it does not
// know what any of them do. A new upgrade appears here without this file
// changing.

import { P } from './config.js';
import { S, bench } from './state.js';
import { UPGRADES, SECTIONS, UNITS, buy } from './upgrades.js';

const shopEl = document.getElementById('shop');
const boardEl = document.getElementById('board');

// one row per available upgrade, under a heading for the crew it belongs to
export function buildShop() {
  shopEl.textContent = '';
  for (const sect of SECTIONS) {
    const rows = sect.keys
      .map(k => UPGRADES.find(u => u.key === k))
      .filter(u => u && u.show());
    if (!rows.length) continue;

    const head = document.createElement('div');
    head.className = 'sect';
    head.dataset.sect = sect.title;
    shopEl.appendChild(head);

    for (const u of rows) {
      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.key = u.key;
      b.innerHTML = '<span class="name"></span><span class="from"></span>' +
                    '<span class="arrow"></span><span class="to"></span>' +
                    '<span class="cost"></span>';
      b.addEventListener('click', () => buy(u));
      shopEl.appendChild(b);
    }
  }
}



// the board is grouped by who the upgrade is for, not by what it costs
