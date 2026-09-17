// The queue card: what the yard is building and what is in line behind it, on
// one small card in the corner of the window (DESIGN.md, "The queue").
//
// One name a line, across every site, in the order things will land; the line
// at the front of each site's run carries the bar as pips. A waiting name is a
// button, and pressing it hands the work back through the same `buy` its row
// goes through, so the card and the board cannot disagree. It stands top-left,
// under the boards: on a short window a board reaches the corner, and the
// board you walked up to read should win it.

import { S } from './state.js';
import { SITES, worksAt, roomAt, progressOf, rowFor, leftAt, stalled } from './works.js';
import { buy } from './upgrades.js';
import { leftText } from './words.js';
import { placeWord } from './shop.js';
import { showTipAt } from './board.js';
import { QUEUE_PIPS } from './config.js';

const el = document.getElementById('queue');

// The same words the yard answers with when you point at the building
// (`BUILDING_NAME` in input.js).
const SITE_NAME = {
  yard: 'the yard', bench: 'the bench',
  quarry: 'the quarry', farm: 'the farm', scrub: 'the scrubbing house',
  tower: 'the tower', lab: 'the lab', apothecary: 'the apothecary',
  shack: 'the shack'
};

// The same glyphs a ladder is drawn with on a row.
const pips = w => {
  const at = Math.round(progressOf(w) * QUEUE_PIPS);
  return '●'.repeat(at) + '○'.repeat(QUEUE_PIPS - at);
};

// A site's line is worked one at a time at one pace, so the time until a work
// lands is the sum of what is left of everything ahead of it plus its own,
// each at the site's own rate (`leftAt`). The words are the tile's: a waiting
// line says its place before its clock.
const clockOf = (site, list, i) => {
  const going = roomAt(site);
  // A front line nobody is at says `queued` and no clock: a clock over a work
  // nobody is doing is a promise the yard is not keeping.
  if (i < going && stalled(site)) return 'queued';
  let ms = 0;
  for (let j = 0; j <= i; j++) ms += leftAt(site, list[j].key);
  const place = i < going ? '' : `<em>${placeWord(i - going + 1)}</em> `;
  return `${place}<i class="clock"></i><b>${leftText(ms)}</b>`;
};

// Rebuilt only when the set of works changes; a card rebuilt every frame
// would lose the hover under the cursor.
let built = '';

export function fillQueue() {
  const lines = [];
  for (const site of SITES) {
    const list = worksAt(site);
    const going = roomAt(site);
    list.forEach((w, i) => lines.push({ site, key: w.key, w, front: i < going, clock: clockOf(site, list, i) }));
  }
  const key = lines.map(l => `${l.site}:${l.key}:${l.front ? 1 : 0}`).join('|');
  if (key !== built) {
    built = key;
    el.replaceChildren();
    for (const l of lines) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = l.front ? 'front' : 'wait';
      b.disabled = l.front;
      const name = rowFor(l.key)?.name || l.key;
      if (l.front) {
        const p = document.createElement('span');
        p.className = 'pips';
        p.textContent = pips(l.w);
        b.appendChild(p);
      }
      const n = document.createElement('span');
      n.className = 'name';
      n.textContent = name;
      b.appendChild(n);
      const c = document.createElement('span');
      c.className = 'left';
      c.innerHTML = l.clock;
      b.appendChild(c);
      // A press on a waiting name hands the work back, by the row's own path.
      if (!l.front) b.addEventListener('click', () => { const u = rowFor(l.key); if (u) buy(u); });
      const say = () => {
        const r = b.getBoundingClientRect();
        showTipAt(SITE_NAME[l.site] || l.site, r.right + 8, r.top - 2);
      };
      b.addEventListener('pointerenter', say);
      b.addEventListener('pointerleave', () => showTipAt(null));
      el.appendChild(b);
    }
  } else {
    let i = 0;
    for (const l of lines) {
      const b = el.children[i++];
      if (l.front) b.firstChild.textContent = pips(l.w);
      const c = b.lastChild;
      if (c.innerHTML !== l.clock) c.innerHTML = l.clock;
    }
  }
  // Faded rather than removed: `hidden` would cut the fade short.
  const show = lines.length > 0 && !S.paused;
  if (show && el.hidden) el.hidden = false;
  el.classList.toggle('off', !show);
}
