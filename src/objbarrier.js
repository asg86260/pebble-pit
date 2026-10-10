// The shield on the story's card (the owner's B and C, 2026-10-10): while the
// line is a shield step, the card under it sells that step's row. On offer it
// is the row's glyph, name and note, its bill as a checklist a coin a line,
// each line ticking as its coin is met, and a buy wearing the row's own price
// tag; bought, it is one bar of the build and the cancel the bench's strip
// offers. Every press goes through the row (`pressRow` in shop.js), so the
// queue, the builders walking over, the bench's own tile and every cost rule
// are the one mechanism they are on the board.
//
// Read every frame off the yard, like the line above it (objline.js). A change
// of shape fades the block out and back in; a tick fades; nothing pops.

import { S } from './state.js';
import { OBJ_SWAP_MS } from './config.js';
import { rowFor, takesTime, workOn, progressOf } from './works.js';
import { billOf, canPay, forSale, handBack, waitingOf, tintOf } from './upgrades.js';
import { MARK, purse, priceText } from './words.js';
import { drawGlyph, glyphFor, badgeFor } from './glyphs.js';
import { tagOf, pressRow, COIN_ORDER } from './shop.js';
import { domeAt } from './shield.js';
import { onTap } from './tap.js';

const box = document.getElementById('objective')?.querySelector?.('.barrier') ?? null;

// Which shape the row is in: being built (a work in the yard's line, or the
// shield itself standing or being poured) or on offer. Neither, and the card
// carries the line alone -- the dome before there is a tower to sell it.
function modeOf(u) {
  if (S.shield && S.shield.kind === u.key) return 'build';
  if (takesTime(u) && workOn(u.key)) return 'build';
  return u.show() ? 'offer' : null;
}

// How far along the build is: the builders' labor while it is a work, then
// the shield's own count (a carried one arrives whole; the dome's is the
// wizards' pour).
const progress = u => (S.shield && S.shield.kind === u.key ? domeAt() : progressOf(workOn(u.key)));

// Written only when what it says changes, as the board's cells are.
const say = (el, text) => { if (el._said !== text) { el._said = text; el.textContent = text; } };
const sayHTML = (el, html) => { if (el._said !== html) { el._said = html; el.innerHTML = html; } };

let shown = '';            // `${key}:${mode}` drawn now, '' for nothing
let swapUntil = 0;         // the fade out in progress, when it ends
let parts = null;          // the drawn block's live cells

export function seatBarrier(step, t) {
  if (!box) return;
  const u = step?.row ? rowFor(step.row) : null;
  const mode = u ? modeOf(u) : null;
  const want = mode ? `${u.key}:${mode}` : '';
  if (want !== shown) {
    if (shown && !swapUntil) { swapUntil = t + OBJ_SWAP_MS; box.classList.add('swap'); }
    if (shown && t < swapUntil) return;
    swapUntil = 0;
    shown = want;
    box.hidden = !want;
    parts = want ? draw(u, mode) : null;
    if (want) { box.classList.add('swap'); requestAnimationFrame(() => box.classList.remove('swap')); }
  }
  if (parts) update(u, mode);
}

// The coins in the order the yard hands them out.
const coinsOf = u => billOf(u).filter(([m]) => m !== 'time')
  .sort((a, b) => COIN_ORDER.indexOf(a[0]) - COIN_ORDER.indexOf(b[0]));

function draw(u, mode) {
  box.textContent = '';
  const head = document.createElement('div');
  head.className = 'head';
  head.appendChild(drawGlyph(glyphFor(u.key), tintOf(u), '#000', badgeFor(u.key)));
  const name = document.createElement('span');
  name.className = 'name';
  name.textContent = u.name;
  head.appendChild(name);
  box.appendChild(head);
  box.dataset.mode = mode;
  box.dataset.key = u.key;

  if (mode === 'build') {
    const track = document.createElement('div');
    track.className = 'track';
    const bar = document.createElement('div');
    bar.className = 'bar';
    const fill = document.createElement('i');
    bar.appendChild(fill);
    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.className = 'cancel';
    onTap(cancel, () => pressRow(u, handBack));
    track.append(bar, cancel);
    box.appendChild(track);
    return { fill, cancel };
  }

  if (u.note) {
    const note = document.createElement('div');
    note.className = 'note';
    note.textContent = u.note();
    box.appendChild(note);
  }
  const list = document.createElement('ul');
  list.className = 'bill';
  const lines = [];
  for (const [money] of coinsOf(u)) {
    const li = document.createElement('li');
    li.dataset.money = money;
    li.innerHTML = `<i class="box"></i>${MARK[money]}<span class="num"></span>`;
    list.appendChild(li);
    lines.push(li);
  }
  // The coins only: the work's time is not a line here (the owner, 2026-10-10).
  box.appendChild(list);
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'buy';
  btn.innerHTML = '<span class="cost"></span>';
  onTap(btn, () => pressRow(u));
  box.appendChild(btn);
  return { lines, btn, cost: btn.firstChild };
}

function update(u, mode) {
  if (mode === 'build') {
    const pct = `${Math.round(progress(u) * 1000) / 10}%`;
    if (parts.fill.style.width !== pct) parts.fill.style.width = pct;
    // The bench strip's word and its count: the copies still waiting their
    // turn, which are the ones a cancel can hand back.
    const n = waitingOf(u);
    if (n) say(parts.cancel, `cancel ×${n}`);
    parts.cancel.classList.toggle('on', n > 0);
    if (parts.cancel.disabled !== !n) parts.cancel.disabled = !n;
    return;
  }
  const bill = billOf(u);
  for (const li of parts.lines) {
    const need = bill.find(([m]) => m === li.dataset.money)?.[1] ?? 0;
    const have = purse(li.dataset.money);
    li.classList.toggle('done', have >= need);
    say(li.lastChild, `${priceText(li.dataset.money, Math.min(have, need))} / ${priceText(li.dataset.money, need)}`);
  }
  sayHTML(parts.cost, tagOf(u, bill).bill);
  const off = !forSale(u) || !canPay(u);
  if (parts.btn.disabled !== off) parts.btn.disabled = off;
}
