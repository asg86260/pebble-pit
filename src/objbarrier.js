// The shield on the story's card (the owner's B and C, 2026-10-10): while the
// line is a shield step, the card under it sells that step's row. On offer it
// is the row's glyph in a column of its own, and beside it the name, the note,
// its bill as a checklist a coin a line, each line ticking as its coin is met,
// and a buy wearing the row's own price tag (the owner's layout B,
// 2026-10-10); bought, it is the name and the cancel the bench's strip offers
// (the build's progress is the queue card's, under it). Every press goes
// through the row (`pressRow` in shop.js), so the queue, the builders walking
// over, the bench's own tile and every cost rule are the one mechanism they
// are on the board.
//
// Read every frame off the yard, like the line above it (objline.js). A change
// of shape fades the block out and back in; a tick fades; nothing pops.

import { S } from './state.js';
import { OBJ_SWAP_MS } from './config.js';
import { rowFor, takesTime, workOn } from './works.js';
import { billOf, canPay, forSale, handBack, waitingOf, tintOf } from './upgrades.js';
import { MARK, purse, priceText } from './words.js';
import { drawGlyph, glyphFor, badgeFor } from './glyphs.js';
import { tagOf, pressRow, revealed, COIN_ORDER } from './shop.js';
import { onTap } from './tap.js';
import { setFill } from './billfill.js';
import { msg } from './lang.js';

const box = document.getElementById('objective')?.querySelector?.('.barrier') ?? null;

// Which shape the row is in: being built (a work in the yard's line, or the
// shield itself standing or being poured) or on offer. Neither, and the card
// carries the line alone -- the dome before there is a tower to sell it. A
// place step is the goal before the bench offers it (the owner, 2026-10-10),
// so its row is on the card from the step's first frame, its buy dimmed
// until the bench would sell it (`sells`).
function modeOf(u, step) {
  if (S.shield && S.shield.kind === u.key) return 'build';
  if (takesTime(u) && workOn(u.key)) return 'build';
  return step.place || u.show() ? 'offer' : null;
}

// The card's buy is the bench's: lit only when the bench shows the row and
// would take the press, so the card never sells what the board would not.
const sells = u => revealed(u) && forSale(u) && canPay(u);

// Written only when what it says changes, as the board's cells are.
const say = (el, text) => { if (el._said !== text) { el._said = text; el.textContent = text; } };
const sayHTML = (el, html) => { if (el._said !== html) { el._said = html; el.innerHTML = html; } };

let shown = '';            // page: what the DOM card shows, compared against the yard every frame -- `${key}:${mode}` drawn now, '' for nothing
let swapUntil = 0;         // page: the DOM card's fade -- the fade out in progress, when it ends
let parts = null;          // page: the DOM card's live cells -- the drawn block's live cells

export function seatBarrier(step, t) {
  if (!box) return;
  const u = step?.row ? rowFor(step.row) : null;
  const mode = u ? modeOf(u, step) : null;
  const want = mode ? `${u.key}:${mode}` : '';
  if (want !== shown) {
    if (shown && !swapUntil) { swapUntil = t + OBJ_SWAP_MS; box.classList.add('swap'); }
    if (shown && t < swapUntil) return;
    swapUntil = 0;
    shown = want;
    box.hidden = !want;
    parts = want ? draw(u, mode, step) : null;
    if (want) { box.classList.add('swap'); requestAnimationFrame(() => box.classList.remove('swap')); }
  }
  if (parts) update(u, mode);
}

// The coins in the order the yard hands them out.
const coinsOf = u => billOf(u).filter(([m]) => m !== 'time')
  .sort((a, b) => COIN_ORDER.indexOf(a[0]) - COIN_ORDER.indexOf(b[0]));

// Two columns: the glyph on the left, spanning the block, and every word,
// coin and button in one column on its right (`side`).
function draw(u, mode, step) {
  box.textContent = '';
  box.appendChild(drawGlyph(glyphFor(u.key), tintOf(u), '#000', badgeFor(u.key)));
  const side = document.createElement('div');
  side.className = 'side';
  box.appendChild(side);
  const name = document.createElement('span');
  name.className = 'name';
  name.textContent = u.name;
  box.dataset.mode = mode;
  box.dataset.key = u.key;

  if (mode === 'build') {
    // the cancel beside the name it hands back, not across the card from it
    const track = document.createElement('div');
    track.className = 'track';
    track.appendChild(name);
    const cancel = document.createElement('button');
    cancel.type = 'button';
    cancel.className = 'cancel';
    onTap(cancel, () => pressRow(u, handBack));
    track.appendChild(cancel);
    side.appendChild(track);
    return { cancel };
  }

  side.appendChild(name);
  // The step's own line above is the card's words; the row's description is
  // the card's only words when the step has none (a place step).
  if (u.note && !step.say) {
    const note = document.createElement('div');
    note.className = 'note';
    note.textContent = u.note();
    side.appendChild(note);
  }
  // The bill and the buy: side by side when the bill is one line, the buy
  // under the list when it is longer.
  const coins = coinsOf(u);
  const pay = document.createElement('div');
  pay.className = coins.length > 1 ? 'pay' : 'pay one';
  const list = document.createElement('ul');
  list.className = 'bill';
  const lines = [];
  for (const [money] of coins) {
    const li = document.createElement('li');
    li.className = 'fill';
    li.dataset.money = money;
    li.innerHTML = `<i class="tickbox"></i>${MARK[money]}<span class="num"></span>`;
    list.appendChild(li);
    lines.push(li);
  }
  // The coins only: the work's time is not a line here (the owner, 2026-10-10).
  pay.appendChild(list);
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'buy';
  btn.innerHTML = '<span class="cost"></span>';
  onTap(btn, () => { if (sells(u)) pressRow(u); });
  pay.appendChild(btn);
  side.appendChild(pay);
  return { lines, btn, cost: btn.firstChild };
}

function update(u, mode) {
  if (mode === 'build') {
    // The bench strip's word and its count: the copies still waiting their
    // turn, which are the ones a cancel can hand back.
    const n = waitingOf(u);
    if (n) say(parts.cancel, msg('obj-barrier-cancel', { n }));
    parts.cancel.classList.toggle('on', n > 0);
    if (parts.cancel.disabled !== !n) parts.cancel.disabled = !n;
    return;
  }
  const bill = billOf(u);
  for (const li of parts.lines) {
    const need = bill.find(([m]) => m === li.dataset.money)?.[1] ?? 0;
    const have = purse(li.dataset.money);
    setFill(li, have, need);
    say(li.lastChild, `${priceText(li.dataset.money, Math.min(have, need))} / ${priceText(li.dataset.money, need)}`);
  }
  sayHTML(parts.cost, tagOf(u, bill).bill);
  const off = !sells(u);
  if (parts.btn.disabled !== off) parts.btn.disabled = off;
}
