// The shelf: a board drawn as planks with things standing on them. A second
// renderer over the same rows the card builder draws (DESIGN.md, "The shelf"),
// built beside it on shelf.html and swapped in when it is right. It reads a
// row through the same `billOf`, `gainText`, `maxed` and `canPay` the cards
// read it through, so the two can never disagree about a price.
//
// Every cell is found by class, never by position: the card builder's habit of
// reading `row.children` by index is what made every mock of this layout fall
// apart the moment a picture was added to a row.
import { MARK, billOf, gainText, maxed, canPay, purse, priceText } from './upgrades.js';
import { SHELF_INK } from './config.js';
import { drawGlyph, glyphFor } from './glyphs.js';

// The bill's coins in the order the yard hands them out, so the same coin is
// in the same place in every tag. A row's own bill is written in whatever
// order its author wrote it.
const COIN_ORDER = ['dust', 'spore', 'shard', 'core', 'spark'];
const inOrder = bill => [...bill].sort((a, b) => COIN_ORDER.indexOf(a[0]) - COIN_ORDER.indexOf(b[0]));

// The deepest coin on the bill, which is what the glyph's stroke wears.
const deepest = bill => {
  const coins = bill.map(([m]) => m);
  return coins.includes('spark') ? 'spark' : coins.includes('shard') ? 'shard' : coins.includes('spore') ? 'spore' : null;
};

const el = (tag, cls, html) => { const e = document.createElement(tag); e.className = cls; if (html != null) e.innerHTML = html; return e; };

// One item: the picture, the name, what it gives, the tag. The goal card is the
// same cells laid on their side (see the stylesheet), plus its sentence.
function tile(u, goal) {
  const b = el('button', goal ? 'tile goal' : 'tile');
  b.type = 'button'; b.dataset.key = u.key;
  b.append(el('span', 'pic'), el('span', 'what'), el('span', 'gain'));
  if (goal && u.note) b.append(el('span', 'note'));
  const tag = el('span', 'tag'); tag.append(el('span', 'cost'), el('span', 'time'));
  b.append(tag);
  return b;
}

// Build the shelves for a board: one per section with any row showing, the
// goal section first as a card with no sign.
export function mountShelf(root, sections, rows, shown = u => u.show()) {
  root.innerHTML = '';
  root.classList.add('shelves');
  const byKey = new Map(rows.map(u => [u.key, u]));
  for (const sect of sections) {
    const list = sect.keys.map(k => byKey.get(k)).filter(u => u && shown(u));
    if (!list.length) continue;
    const shelf = el('div', sect.goal ? 'shelf goalshelf' : 'shelf');
    shelf.dataset.sect = sect.title;
    if (!sect.goal) shelf.append(el('div', 'sign', sect.title));
    const items = el('div', 'items');
    for (const u of list) items.append(tile(u, !!sect.goal));
    shelf.append(items);
    root.append(shelf);
  }
  refreshShelf(root, rows);
  return root;
}

// Fill every tile from its row. Cheap enough to run each frame the board is
// open, and it only touches a cell whose words changed.
export function refreshShelf(root, rows) {
  const byKey = new Map(rows.map(u => [u.key, u]));
  const say = (node, html) => { if (node.innerHTML !== html) node.innerHTML = html; };
  for (const b of root.querySelectorAll('.tile')) {
    const u = byKey.get(b.dataset.key); if (!u) continue;
    const done = maxed(u);
    const full = billOf(u);
    const bill = inOrder(full.filter(([m]) => m !== 'time'));
    const clock = full.filter(([m]) => m === 'time');
    // The picture, redrawn only when its stroke changes coin.
    const tint = done ? SHELF_INK.done : SHELF_INK[deepest(bill)] || null;
    const pic = b.querySelector('.pic');
    if (pic.dataset.tint !== String(tint)) { pic.dataset.tint = String(tint); pic.replaceChildren(drawGlyph(glyphFor(u.key), tint)); }
    say(b.querySelector('.what'), u.name);
    // The number alone: the name is the verb.
    const g = gainText(u);
    say(b.querySelector('.gain'), u.does && g.startsWith(u.does + ' ') ? g.slice(u.does.length + 1) : g);
    const note = b.querySelector('.note'); if (note && typeof u.note === 'function') say(note, u.note());
    const coin = ([m, n]) => `<span class="${purse(m) >= n ? 'have' : 'short'}">${MARK[m]} ${priceText(m, n)}</span>`;
    say(b.querySelector('.cost'), done ? 'done' : bill.map(coin).join(''));
    say(b.querySelector('.time'), done ? '' : clock.map(coin).join(''));
    b.classList.toggle('wide', bill.length >= 3);
    b.classList.toggle('done', done);
    b.disabled = done || !canPay(u);
  }
  // A shelf on which nothing has a gain drops the line; one where some do keeps
  // it on all, so the tags stay level.
  for (const shelf of root.querySelectorAll('.shelf')) {
    const tiles = [...shelf.querySelectorAll('.tile')];
    shelf.classList.toggle('nogain', tiles.every(t => !t.querySelector('.gain').textContent.trim()));
  }
}
