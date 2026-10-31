// MOCK fighters-skills-on-the-hover
// Throwaway review code, never merged: the owner's "add the skills that
// fighters have to their hover menu and the hover for the def of the skill",
// as options on the review bench. A skill is a class's move (rung 4) and its
// capstone (rung 8), named and said in the language file (`skillsOf`,
// deep/rails.js).
//
// `globalThis.__skillsMock` picks the option, null is the game as it is; a
// reset puts it away. `{ opt, station, skill }`: `station` and `skill` (an
// index into the fighter's skills, -1 none) hold the fighter's card up as if
// the pointer rested on it and on that skill -- the body's card is the page's
// one tip (#tip), which takes no pointer today, so a real pointer cannot
// reach a skill in it yet.
//   a  the card, then a row of chips, one a skill; a hovered chip's line under them
//   b  the card, then a line a skill; a hovered line's definition beside it
//   c  the station's board: the skills under the fighter's name, each with
//      its line on hover, as the board's statuses have (deep/rails.js)

import { S } from '../state.js';
import { P, WORKER } from '../config.js';
import { held } from '../reset.js';
import { showTipAt } from '../board.js';
import { toScreen } from '../world.js';
import { card } from '../crewboard.js';
import { stationById } from './party.js';
import { skillsOf, skillTipOn } from './rails.js';

// (a link, not an import: the node tier may read this file too)
if (typeof document !== 'undefined' && document.head && !document.getElementById('skillsmock-style')) {
  const l = document.createElement('link');
  l.id = 'skillsmock-style'; l.rel = 'stylesheet'; l.href = new URL('./skillsmock.css', import.meta.url).href;
  document.head.appendChild(l);
}

held('skills-mock', () => { globalThis.__skillsMock = null; side?.setAttribute('hidden', ''); if (typeof document !== 'undefined') showTipAt(null); });

const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const mark = k => `<i class="${k.cap ? 'cp' : 'mv'}"></i>`;

// Option b's definition stands beside its line in the boards' own hover
// line (`.rl-tip`, deep/rails.js), one made here for the card.
let side = null;
function sideTip() {
  if (!side && typeof document !== 'undefined') {
    side = document.createElement('div');
    side.className = 'rl-tip skm-side';
    side.hidden = true;
    document.body.appendChild(side);
  }
  return side;
}

// The fighter's card with its skills, at (sx, sy) on the glass, skill `on`
// hovered (-1 none). False when the option is off or the body has none to
// show, and the card is the game's own.
export function skillsCard(w, sx, sy, on = -1) {
  const opt = globalThis.__skillsMock?.opt;
  if ((opt !== 'a' && opt !== 'b') || !w?.station) return false;
  const st = stationById(w.station), sk = skillsOf(st);
  if (!sk.length) return false;
  const tail = document.createElement('div');
  tail.className = `skm skm-${opt}`;
  tail.dataset.key = `${opt}${on}${st.cls}${st.rung}`;
  if (opt === 'a') {
    tail.innerHTML = `<div class="skm-chips">${sk.map((k, i) => `<span class="skm-chip${i === on ? ' on' : ''}${k.cap ? ' cap' : ''}">${mark(k)}${esc(k.name)}</span>`).join('')}</div>` +
      (sk[on] ? `<div class="skm-def">${esc(sk[on].line)}</div>` : '');
  } else {
    tail.innerHTML = sk.map((k, i) => `<div class="skm-line${i === on ? ' on' : ''}${k.cap ? ' cap' : ''}">${mark(k)}${esc(k.name)}</div>`).join('');
  }
  showTipAt(card(w), sx, sy, false, false, null, tail);
  const s = sideTip();
  if (opt !== 'b' || !sk[on]) { if (s) s.hidden = true; return true; }
  // beside the hovered line, on the side of the card with room
  const tip = document.getElementById('tip'), line = tip.querySelectorAll('.skm-line')[on];
  const cs = getComputedStyle(tip);
  s.style.fontFamily = cs.fontFamily;
  s.style.fontSize = cs.fontSize;
  s.style.textTransform = cs.textTransform;
  s.style.letterSpacing = cs.letterSpacing;
  // what it does alone: the line it stands beside names it
  s.textContent = sk[on].does;
  s.hidden = false;
  const t = tip.getBoundingClientRect(), b = line.getBoundingClientRect(), wd = s.offsetWidth, h = s.offsetHeight;
  // beside it on the right, else the left; with room on neither, over the card
  const right = t.right + 4 + wd <= innerWidth - 4, left = t.left - 4 - wd >= 4;
  const x = right ? t.right + 4 : left ? t.left - 4 - wd : Math.min(t.left, innerWidth - 4 - wd);
  const y = right || left ? b.top + b.height / 2 - h / 2 : t.top - 4 - h;
  s.style.left = `${Math.round(Math.max(4, x))}px`;
  s.style.top = `${Math.round(y)}px`;
  return true;
}
// The card leaving takes option b's line with it.
export const skillsCardGone = () => { if (side) side.hidden = true; };

// A scene's hold: every frame the card stands over the fighter at
// `station`, or the board's skill line is held up, as a resting pointer
// would keep them.
function hold() {
  const m = globalThis.__skillsMock;
  if (m?.station && S.view === 'deep') {
    if (m.opt === 'c') { showTipAt(null); skillsCardGone(); skillTipOn(m.station, m.skill ?? -1); }
    else {
      const w = S.workers.find(o => o.station === m.station);
      if (w) {
        const at = toScreen(w.x + WORKER + P * 2, w.y - P * 3);
        skillsCard(w, at.x, at.y, m.skill ?? -1);
      }
    }
  }
  requestAnimationFrame(hold);
}
if (typeof requestAnimationFrame === 'function') requestAnimationFrame(hold);
