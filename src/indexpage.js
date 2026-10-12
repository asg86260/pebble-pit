// The index's page on the held sheet (DESIGN.md, "The index"): every entry
// met, down the left under its group, and the chosen one on the right -- its
// drawing, its name, its group, its words. A group with nothing met is not
// shown, and nothing unmet is named. On a narrow window the two halves do not
// fit side by side, so the list is the page and picking an entry pushes it
// over the list, with its own back (style.css, `.index.reading`).
//
// What is met is met.js's; the words are config/index.js's alone.

import { GROUPS } from './config/index.js';
import { metEntries, unread, markRead } from './met.js';
import { deepOn } from './snatch.js';
import { GLYPHS } from './glyphs.js';
import { MARK } from './words.js';

const listed = () => metEntries(deepOn());
// The entry open on the right, kept across openings so the page comes back
// where it was left.
let chosen = null;

// The front's button carries a dot while any entry met has never been opened.
export const indexFresh = () => listed().some(unread);
export function sayIndexButton(btn) {
  btn.replaceChildren(document.createTextNode('index'));
  if (indexFresh()) btn.appendChild(Object.assign(document.createElement('i'), { className: 'newdot' }));
}

// The drawing, in the page's own ink: a coin's mark where the entry is a
// coin, else its glyph, else nothing at all.
function picture(e) {
  if (!e.glyph) return null;
  if (e.glyph.startsWith('mark:')) {
    const s = document.createElement('span');
    s.className = 'mark';
    s.innerHTML = MARK[e.glyph.slice(5)] || '';
    return s;
  }
  const rows = GLYPHS[e.glyph];
  if (!rows) return null;
  // One canvas pixel a cell, sized up by a whole number in style.css, so the
  // drawing is crisp in the list and on the entry alike.
  const ink = getComputedStyle(document.documentElement).getPropertyValue('--ink').trim() || '#000';
  const c = document.createElement('canvas');
  c.width = rows[0].length; c.height = rows.length;
  c.className = 'glyph';
  const g = c.getContext('2d');
  g.fillStyle = ink;
  rows.forEach((r, y) => [...r].forEach((ch, x) => { if (ch === '#') g.fillRect(x, y, 1, 1); }));
  return c;
}

function pick(el, key) {
  chosen = key;
  markRead(key);
  el.classList.add('reading');
  fill(el);
}

// The list and the entry, built afresh: the book grows behind your back.
function fill(el) {
  const all = listed();
  if (!all.some(e => e.key === chosen)) chosen = all[0]?.key ?? null;
  const list = document.createElement('div');
  list.className = 'list';
  for (const g of GROUPS) {
    const mine = all.filter(e => e.group === g);
    if (!mine.length) continue;
    list.appendChild(Object.assign(document.createElement('div'), { className: 'grp', textContent: g }));
    for (const e of mine) {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'it' + (e.key === chosen ? ' on' : '');
      b.dataset.key = e.key;
      b.append(Object.assign(document.createElement('span'), { className: 'nm', textContent: e.name }));
      if (unread(e)) b.appendChild(Object.assign(document.createElement('i'), { className: 'newdot' }));
      b.addEventListener('click', () => pick(el, e.key));
      list.appendChild(b);
    }
  }
  const entry = document.createElement('div');
  entry.className = 'entry';
  const e = all.find(x => x.key === chosen);
  if (e) {
    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'ixback';
    back.textContent = 'back';
    back.addEventListener('click', () => { el.classList.remove('reading'); fill(el); });
    const head = document.createElement('div');
    head.className = 'head';
    const p = picture(e);
    if (p) head.appendChild(Object.assign(document.createElement('span'), { className: 'pic' })).appendChild(p);
    const t = document.createElement('div');
    t.append(Object.assign(document.createElement('div'), { className: 'name', textContent: e.name }),
             Object.assign(document.createElement('div'), { className: 'grp', textContent: e.group }));
    head.appendChild(t);
    entry.append(back, head, Object.assign(document.createElement('div'), { className: 'text', textContent: e.text }));
    entry.dataset.key = e.key;
  }
  el.replaceChildren(list, entry);
  // a remembered choice that is off the list's view is scrolled to
  list.querySelector('.it.on')?.scrollIntoView?.({ block: 'nearest' });
}

// Turned to: the list on a phone, the list and the chosen entry beside it on
// a desk, where the entry on show is the one being read.
// Whether the entry is on show is asked of the stylesheet, which owns the
// width the two halves stop fitting at.
export function showIndex(el) {
  el.classList.remove('reading');
  fill(el);
  const entry = el.querySelector('.entry');
  if (chosen && entry && getComputedStyle(entry).display !== 'none') { markRead(chosen); fill(el); }
}
