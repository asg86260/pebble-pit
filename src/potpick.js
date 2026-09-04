// Setting a pot's brew at the pot.
//
// Item 17 asks for the choice to be made where the thing is: you click the
// cauldron and pick what goes in it. The board keeps its per-pot sections -- it
// is where the ladders and the figures live, and reading is a different errand
// from setting -- but the direct path is the pot itself, and a control you point
// at is worth more than a menu you go and find.
//
// The list is the SAME list the boards drop open (`openOptsAt` in shop.js). Every
// rule about where such a list may stand -- flush with the control's right edge,
// flipped above when there is no room below, pulled back inside the window,
// measured pinned at the origin so nothing wraps it while it is being sized --
// is a rule about the window rather than about boards, and it took three goes to
// get right. A cauldron simply has no DOM element to hang off, so `openOptsAt`
// takes the rect and this file works the rect out.
//
// The options are swatches: a block of the brew's own color and its name. That is
// the register the yard already reads tonics in -- the liquid in the bottles on
// the rack, the flame under the pot, the plume off a dosed body -- so the picker
// says which brew in the same word the rest of the building does.

import { TONICS, potTonicOf, choosePotTonic, potAt, potBox } from './apothecary.js';
import { openOptsAt, shutOpts } from './shop.js';
import { screenAt } from './render/frame.js';

const canvas = document.getElementById('c');

// The one list, built once and kept. Rebuilt content would drop the pointer
// handlers that keep it open while the cursor is crossing it.
let opts = null;
let onPot = -1;                      // which pot it is currently set for

function build() {
  opts = document.createElement('div');
  opts.className = 'optspop';
  opts.hidden = true;
  opts.dataset.potpick = '';
  document.body.appendChild(opts);
  // Nothing goes in the pot is a choice, not the absence of one: a pot has to be
  // turnable off, and on the board that is the set row toggling. A picker that
  // toggled on re-picking the option already marked would be a control that does
  // the opposite of what it shows, so turning off gets a row of its own.
  for (const t of [null, ...TONICS]) {
    const pick = document.createElement('button');
    pick.type = 'button';
    pick.className = 'opt';
    pick.dataset.opt = t ? t.key : '';
    const swatch = document.createElement('i');
    swatch.className = 'swatch';
    if (t) swatch.style.background = t.color;
    pick.appendChild(swatch);
    pick.appendChild(document.createTextNode(t ? t.name : 'nothing'));
    pick.addEventListener('click', () => {
      if (onPot >= 0) choosePotTonic(onPot, t ? t.key : null);
      shutOpts();
    });
    opts.appendChild(pick);
  }
}

// Where the pot is on the glass. The picker is `position: fixed`, so it wants
// client coordinates: `screenAt` gives canvas-relative pixels and the canvas's
// own rect puts them on the window.
function potRect(i) {
  const b = potBox(i);
  const c = canvas.getBoundingClientRect();
  const a = screenAt(b.x, b.y);
  const z = screenAt(b.x + b.w, b.y + b.h);
  return { left: c.left + a.x, top: c.top + a.y,
           right: c.left + z.x, bottom: c.top + z.y,
           width: z.x - a.x, height: z.y - a.y };
}

// A press in the yard, in world pixels. Answers whether it landed on a pot --
// input.js stops there if it did, so clicking a cauldron does not also do
// whatever clicking the ground behind it would have done.
export function potPick(x, y) {
  const i = potAt(x, y);
  if (i < 0) return false;
  if (!opts) build();
  onPot = i;
  const at = potTonicOf(i);
  for (const o of opts.querySelectorAll('.opt'))
    o.classList.toggle('on', o.dataset.opt === (at || ''));
  openOptsAt(potRect(i), opts);
  return true;
}
