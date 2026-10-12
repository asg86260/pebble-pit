// A bill line that fills grey as its coin comes in: the story card's lines
// (objbarrier.js) and the bench's unlock tiles (shop.js) share this, and the
// stylesheet's `.fill` (style.css), so "how close am I" is drawn one way.
// Written onto a line that stays in the page, so the fill slides rather than
// being rebuilt a step wider.

import { MARK, purse, priceText } from './words.js';

// have over need, 0..1; a coin that costs nothing is met.
export const shareOf = (have, need) => (need > 0 ? Math.min(1, have / need) : 1);

// Fill one line to `have` of `need`, and mark it done once the coin is met.
export function setFill(el, have, need) {
  el.classList.toggle('done', have >= need);
  el.style.setProperty('--p', shareOf(have, need));
}

// The coins of a bill as filled lines inside `host`, a line a coin, each
// kept between frames and reused by coin. `coins` is [[money, need], ...] in
// the order to be drawn.
export function wearBill(host, coins) {
  const key = coins.map(([m]) => m).join();
  if (host._bill !== key) {
    host._bill = key;
    host.replaceChildren(...coins.map(([m]) => {
      const el = document.createElement('span');
      el.className = 'fill';
      el.dataset.money = m;
      return el;
    }));
  }
  coins.forEach(([m, need], i) => {
    const el = host.children[i], have = purse(m);
    setFill(el, have, need);
    el.classList.toggle('have', have >= need);
    el.classList.toggle('short', have < need);
    const said = `${MARK[m]} ${priceText(m, need)}`;
    if (el._said !== said) { el._said = said; el.innerHTML = said; }
  });
}
