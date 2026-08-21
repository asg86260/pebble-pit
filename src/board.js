// The workbench board: where it sits on screen, when it opens, and the counter
// above the pit that chases the number.

import { P } from './config.js';
import { S, bench } from './state.js';
import { UPGRADES, UNITS } from './upgrades.js';

const shopEl = document.getElementById('shop');
const boardEl = document.getElementById('board');

export const nearBench = (x, y) => x > bench.x - P * 8 && x < bench.x + bench.w + P * 8 &&
                            y > bench.y - P * 8 && y < bench.y + bench.h + P * 4;

export function placeBoard() {
  boardEl.style.left = `${(bench.x - S.camX) * S.zoom}px`;
  boardEl.style.top = 'auto';
  boardEl.style.bottom = `${S.H - (bench.y - S.camY) * S.zoom + P * 3}px`;
}

export function showBoard(open) {
  if (open === S.boardOpen) return;
  S.boardOpen = open;
  boardEl.hidden = !open;
  if (open) placeBoard();
}

export const fmt = n => n.toLocaleString('en-US');

// the count runs to its new value and eases in at the end, taking longer for a
// bigger jump so a purchase reads as a real withdrawal
export function tweenCount(now) {
  if (S.stored !== S.tweenTo) {
    S.tweenFrom = S.shownStored;
    S.tweenTo = S.stored;
    S.tweenAt = now;
    S.tweenMs = Math.max(220, Math.min(900, 180 + Math.abs(S.tweenTo - S.tweenFrom) * 1.6));
  }
  const t = Math.max(0, Math.min(1, (now - S.tweenAt) / S.tweenMs));
  const ease = 1 - Math.pow(1 - t, 3);                  // out-cubic
  S.shownStored = S.tweenFrom + (S.tweenTo - S.tweenFrom) * ease;
}

export function hud() {
  tweenCount(performance.now());
  if (!S.boardOpen) return;

  for (const el of shopEl.children) {
    if (el.dataset.sect) {                       // heading, with the headcount
      const crew = el.dataset.sect === 'workers' ? S.haulers
                 : el.dataset.sect === 'miners' ? S.miners : 0;
      el.textContent = crew ? `${el.dataset.sect}  ×${crew}` : el.dataset.sect;
      continue;
    }
    const u = UPGRADES.find(x => x.key === el.dataset.key);
    const cost = u.cost();
    const core = u.currency === 'core';
    const [name, from, arrow, to, price] = el.children;
    const step = u.from ? `${u.from()}` : '';

    name.textContent = u.name;
    from.textContent = step;
    arrow.textContent = step ? '→' : '';
    to.innerHTML = step ? `${u.to()}${u.unit ? ' ' + UNITS[u.unit] : ''}` : '';
    price.innerHTML = core ? `<i class="core"></i> ${cost}` : `<i class="dust"></i> ${cost}`;
    el.disabled = (core ? S.cores : S.stored) < cost;
  }
}

