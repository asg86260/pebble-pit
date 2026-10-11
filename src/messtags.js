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
import { cornerCards, clearBelow, GAP } from './dodge.js';

const holder = document.getElementById('messtags');
const toast = document.getElementById('toast');

const tags = [...holder.querySelectorAll('.messtag')].map(el =>
  ({ el, kind: el.dataset.kind, n: el.querySelector('.n'), said: null, up: false, at: '' }));

const gap = GAP;

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
  // Under the toast while it is up: both hang from the same edge, and the
  // toast may itself have stepped down under the story's card (toast.js).
  const under = toast && toast.classList.contains('up')
    ? toast.offsetHeight + (parseFloat(toast.style.getPropertyValue('--toast-dy')) || 0) + gap : 0;
  const y = clearBelow(mid - total / 2, mid + total / 2, top + under, h, cornerCards(), gap) - top;
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

