// The queue card: what the yard is building and what is in line behind it, on
// one small card in the corner of the window.
//
// It is a glance, not a board. One name a line, across every site, in the
// order things will land; the line at the top of each site's run carries the
// bar of the thing being built as a row of pips, and the ones below it are
// plain names. Nothing says which site a name is at -- hover it and the tip
// does. Every line carries a clock: the front one's is what is left of it at
// the pace the site is actually going, or its status when nobody is at it
// (`on the way`, `nobody on it` -- the row's own words), and a waiting one's
// is how long until IT lands, everything ahead of it counted. See DESIGN.md,
// "The queue".
//
// A name waiting its turn is a button, and pressing it hands the work back --
// through the same `buy` its row goes through, so the card and the board can
// never disagree about what a press does. The name at the front is committed
// and is not pressable.
//
// The card is absent when nothing is building anywhere. It comes and goes by
// a fade rather than a pop, and it stands top-left, under the boards: on a
// short window a board reaches the corner, and the board you walked up to read
// is the thing that should win it. It is as wide as its longest name and as
// tall as its line -- a card that sizes to what is on it (the owner's call).

import { S } from './state.js';
import { SITES, BUILDER_SITES, worksAt, roomAt, progressOf, rowFor, leftAt, stalled } from './works.js';
import { buy, priceText } from './upgrades.js';
import { showTipAt } from './board.js';
import { QUEUE_PIPS } from './config.js';

const el = document.getElementById('queue');

// What the card says a site is, when a name on it is hovered. The same words
// the yard answers with when you point at the building (`BUILDING_NAME` in
// input.js), because a name on the card is that building's work.
const SITE_NAME = {
  yard: 'the yard', bench: 'the bench',
  quarry: 'the quarry', farm: 'the farm', scrub: 'the scrubbing house',
  tower: 'the tower', lab: 'the lab', apothecary: 'the apothecary',
  shack: 'the shack'
};

// The pips of the work at the front of a site's line: filled for the share
// done, hollow for the rest, the same glyphs a ladder is drawn with on a row.
const pips = w => {
  const at = Math.round(progressOf(w) * QUEUE_PIPS);
  return '●'.repeat(at) + '○'.repeat(QUEUE_PIPS - at);
};

// What a line's clock says. A site's line is worked one at a time at one pace,
// so the time until any work lands is the sum of what is left of everything
// ahead of it plus its own -- each at the site's own rate (`leftAt`), so a lab
// line quotes the lab's pace and not the yard's. The front line with nobody at
// it says so instead of quoting a figure: a clock over a work nobody is doing
// is a promise the yard is not keeping.
const clockOf = (site, list, i) => {
  if (i < roomAt(site) && stalled(site))
    return BUILDER_SITES.includes(site) ? 'on the way' : 'nobody on it';
  let ms = 0;
  for (let j = 0; j <= i; j++) ms += leftAt(site, list[j].key);
  return `<i class="clock"></i><b>${priceText('time', ms)}</b>`;
};

// The lines are rebuilt only when the set of works changes -- a name arriving,
// a name leaving, a work stepping up -- and only the pips are rewritten
// between. A card rebuilt every frame would lose the hover under the cursor.
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
      // The station, on hover, in the board's own tip beside the line.
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
  // Present while there is anything to say, and faded rather than removed when
  // there is not: `hidden` would cut the fade short.
  const show = lines.length > 0 && !S.paused;
  if (show && el.hidden) el.hidden = false;
  el.classList.toggle('off', !show);
}
