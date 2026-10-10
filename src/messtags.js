// The mess tags: a black card at the top edge for each kind of mess lying on
// the ground, with how many cells of it are left, up from the first cell and
// gone with the last. DOM in the shell; the count is the layer's own
// (`messCounts`, smog/layer.js), so the card cannot say something the ground
// does not show.
//
// Where they stand is worked out every frame from what is already on the
// glass rather than kept in a table: centered at the top edge, under the
// toast while a notice is up, and under whichever corner card -- the story's
// line and its queue, the corner squares -- the row would otherwise sit on.
// A card coming or going changes the row's width, and the cards that stay
// glide to their new seats (style.css) instead of jumping.

import { S } from './state.js';
import { messCounts } from './smog.js';
import { fadeIn, fadeOut } from './fade.js';
import { gliding } from './view.js';
import { cutsceneRunning } from './cutscene.js';
import { MESS_TAG_CAP } from './config.js';

const holder = document.getElementById('messtags');
const toast = document.getElementById('toast');
const topleft = document.getElementById('topleft');
const corner = document.getElementById('corner');

const tags = [...holder.querySelectorAll('.messtag')].map(el =>
  ({ el, kind: el.dataset.kind, n: el.querySelector('.n'), said: null, up: false, at: '' }));

// The page's own spacing, read once: the gap between two cards and under a
// card the row ducks below is the gap every floating card here keeps.
const gap = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--gap')) || 0;

// Off wherever the rest of the yard's furniture is off: down in the deep,
// on the way there, while a beat or a cutscene has the yard, and under the
// held sheet, as the skip hint is.
const showing = () => S.view === 'yard' && !S.paused && !gliding() && !cutsceneRunning()
  && !(S.beat.yard || S.beat.camera || S.beat.sheet);

// Once a frame, from `frame()` in main.js, after the toast has been seated.
export function stepMessTags() {
  const counts = showing() ? messCounts() : null;
  for (const t of tags) {
    const n = counts ? counts[t.kind] | 0 : 0;
    // written only when it changes, so a still count is a still card; and
    // never nought, so a card fading out says the last figure it had
    if (n > 0 && n !== t.said) {
      t.said = n;
      t.n.textContent = n > MESS_TAG_CAP ? `${MESS_TAG_CAP}+` : String(n);
    }
    t.up = n > 0;
    if (!t.up) fadeOut(t.el);
  }
  seat();
}

// The boxes the row must not stand on, in screen pixels.
function furniture() {
  const out = [];
  const add = el => {
    if (!el || el.hidden || el.classList.contains('off')) return;
    const r = el.getBoundingClientRect();
    if (r.width && r.height) out.push(r);
  };
  if (topleft) for (const el of topleft.children) add(el);
  if (corner) for (const el of corner.children) add(el);
  return out;
}

function seat() {
  const ups = tags.filter(t => t.up);
  if (!ups.length) return;
  // A card coming up is shown before it is measured, and stood in its seat
  // with no glide, so it fades in where it belongs rather than flying there.
  const fresh = ups.filter(t => t.el.hidden);
  for (const t of fresh) t.el.hidden = false;
  const ws = ups.map(t => t.el.offsetWidth);
  const h = Math.max(...ups.map(t => t.el.offsetHeight));
  const total = ws.reduce((a, w) => a + w, 0) + gap * (ups.length - 1);
  const top = holder.getBoundingClientRect().top;
  const mid = holder.getBoundingClientRect().left;
  // Under the toast while it is up: both hang from the same edge.
  let y = toast && toast.classList.contains('up') ? toast.offsetHeight + gap : 0;
  const boxes = furniture();
  for (let pass = 0; pass < boxes.length; pass++) {
    const x0 = mid - total / 2, x1 = mid + total / 2, y0 = top + y, y1 = y0 + h;
    const hit = boxes.find(b => b.left < x1 && x0 < b.right && b.top < y1 && y0 < b.bottom);
    if (!hit) break;
    y = Math.ceil(hit.bottom - top + gap);
  }
  let x = -total / 2;
  ups.forEach((t, i) => {
    const at = `${Math.round(x)}px ${Math.round(y)}px`;
    x += ws[i] + gap;
    if (at === t.at) return;
    t.at = at;
    if (fresh.includes(t)) {
      t.el.style.transition = 'none';
      t.el.style.translate = at;
      void t.el.offsetWidth;
      t.el.style.transition = '';
    } else t.el.style.translate = at;
  });
  for (const t of ups) fadeIn(t.el);
}

