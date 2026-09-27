// The queue card: what the yard is building and what is in line behind it, on
// one small card in the corner of the window (DESIGN.md, "The queue").
//
// One name a line, across every site, in the order things will land; copies
// of one row queued back to back are one line with `×n` (DESIGN.md, "The same
// row, queued again"). The line at the front of each site carries the bar as
// pips. A line with a copy waiting is a button, and pressing it hands back
// that row's newest waiting copy through the same `handBack` its card's
// refund strip calls, so the card and the board cannot disagree. It stands top-left,
// under the boards: on a short window a board reaches the corner, and the
// board you walked up to read should win it.

import { S } from './state.js';
import { SITES, worksAt, roomAt, progressOf, rowFor, leftAt, stalled } from './works.js';
import { handBack } from './upgrades.js';
import { leftText } from './words.js';
import { placeWord } from './shop.js';
import { showTipAt } from './board.js';
import { QUEUE_PIPS } from './config.js';
import { nameOf } from './stations.js';

const el = document.getElementById('queue');

// A site's name is its station's (`nameOf`, the same words the pointer
// answers with); these are the sites that are not a station.
const NOT_A_STATION = { yard: 'the yard', deep: 'the deep', sphere: 'the sphere', lab: 'the lab' };
const siteName = site => nameOf(site) || NOT_A_STATION[site] || site;

// The same glyphs a ladder is drawn with on a row.
const pips = w => {
  const at = Math.round(progressOf(w) * QUEUE_PIPS);
  return '●'.repeat(at) + '○'.repeat(QUEUE_PIPS - at);
};

// A site's line is worked one at a time at one pace, so the time until a work
// lands is the sum of what is left of everything ahead of it plus its own,
// each at the site's own rate (`leftAt`). A run's clock is to the last of it
// landing. The words are the tile's: a waiting line says its place before its
// clock.
const clockOf = (site, list, i, end) => {
  const going = roomAt(site);
  // A front line nobody is at says `queued` and no clock: a clock over a work
  // nobody is doing is a promise the yard is not keeping.
  if (i < going && stalled(site)) return 'queued';
  let ms = 0;
  for (let j = 0; j <= end; j++) ms += leftAt(site, list[j]);
  const place = i < going ? '' : `<em>${placeWord(i - going + 1)}</em> `;
  return `${place}<i class="clock"></i><b>${leftText(ms)}</b>`;
};

// The site's line as runs: copies of one row back to back are one line.
const runsOf = list => {
  const out = [];
  list.forEach((w, i) => {
    const last = out[out.length - 1];
    if (last && last.key === w.key) { last.n++; last.end = i; }
    else out.push({ key: w.key, w, start: i, end: i, n: 1 });
  });
  return out;
};

// Rebuilt only when the set of works changes; a card rebuilt every frame
// would lose the hover under the cursor.
let built = '';

export function fillQueue() {
  const lines = [];
  for (const site of SITES) {
    const list = worksAt(site);
    const going = roomAt(site);
    for (const r of runsOf(list)) {
      // A run at the front holds a copy waiting behind the one being built
      // once it is two long: that one can be handed back.
      const front = r.start < going;
      const back = r.end >= going;
      lines.push({ site, key: r.key, w: r.w, n: r.n, front, back, clock: clockOf(site, list, r.start, r.end) });
    }
  }
  const key = lines.map(l => `${l.site}:${l.key}:${l.n}:${l.front ? 1 : 0}`).join('|');
  if (key !== built) {
    built = key;
    el.replaceChildren();
    for (const l of lines) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = [l.front ? 'front' : '', l.back ? 'wait' : ''].join(' ').trim();
      b.disabled = !l.back;
      const name = (rowFor(l.key)?.name || l.key) + (l.n > 1 ? ` ×${l.n}` : '');
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
      // A press on a line with a copy waiting hands the newest back, by the
      // path the card's refund strip takes.
      if (l.back) b.addEventListener('click', () => { const u = rowFor(l.key); if (u) handBack(u); });
      const say = () => {
        const r = b.getBoundingClientRect();
        showTipAt(siteName(l.site), r.right + 8, r.top - 2);
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
