// Setting a pot's brew at the pot.
//
// Item 17 asks for the choice to be made where the thing is: you point at the
// cauldron and pick what goes in it. Pointing is enough -- the picker drops open
// on hover, the way a station's board opens when you walk up to it, because a
// pot is a thing you are standing at rather than a thing you have to remember to
// click. A press opens it too, and has to: a touchscreen has no hover. The board keeps its per-pot sections -- it
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
//
// And what a batch of it costs, on the end of the row: the same bill every board
// in the game prints, marks and all, greyed when you cannot pay it. Setting a pot
// is spending, and a control that asks you to spend without saying how much is a
// control you have to go and look something up for.

import { TONICS, potTonicOf, choosePotTonic, potAt, potBox, brewCost } from './apothecary.js';
import { openOptsAt, shutOpts, optsOpen, stayOpen, leaveSoon } from './shop.js';
import { MARK, priceText, purse } from './upgrades.js';
import { screenAt } from './render/frame.js';

const canvas = document.getElementById('c');

// The one list, built once and kept. Rebuilt content would drop the pointer
// handlers that keep it open while the cursor is crossing it.
let opts = null;
let onPot = -1;                      // which pot it is currently set for
// The pot the cursor was last over, so a hover opens the list once per pot
// ENTERED rather than once per pointermove. Every move over the same cauldron
// would otherwise tear the list down and stand it up again sixty times a second,
// and every move over bare ground would restart the wander-off grace and the
// thing would never close at all.
let over = -1;

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
    const what = document.createElement('span');
    what.className = 'what';
    what.textContent = t ? t.name : 'nothing';
    pick.appendChild(what);
    // The bill hangs on the row and is filled at every open, so what it says is
    // what the next batch will actually be charged -- and whether you can pay it
    // is a fact about the pile a moment ago, not about when the list was built.
    // Turning a pot off costs nothing and says nothing: an empty bill beside
    // "nothing" would be a price on a thing that is not for sale.
    const bill = document.createElement('span');
    bill.className = 'bill';
    pick.appendChild(bill);
    pick.addEventListener('click', () => {
      if (onPot >= 0) choosePotTonic(onPot, t ? t.key : null);
      shutOpts();
    });
    opts.appendChild(pick);
  }
  // Crossing the gap from the cauldron to the list must not count as wandering
  // off, and neither must running the cursor down the options. Same two handlers
  // the board's dials hang on their own lists, and the same timer behind them.
  opts.addEventListener('pointerenter', stayOpen);
  opts.addEventListener('pointerleave', leaveSoon);
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

// Stand the list over pot `i`, with the brew it is on marked.
function openFor(i) {
  if (!opts) build();
  onPot = i;
  const at = potTonicOf(i);
  for (const o of opts.querySelectorAll('.opt')) {
    o.classList.toggle('on', o.dataset.opt === (at || ''));
    o.querySelector('.bill').innerHTML = brewCost(o.dataset.opt).map(([money, n]) =>
      `<span class="${purse(money) >= n ? 'have' : 'short'}">` +
      `${MARK[money]} ${priceText(money, n)}</span>`).join('');
  }
  stayOpen();                       // whatever grace was running, this cancels it
  openOptsAt(potRect(i), opts, null, 'center');
}

// A press in the yard, in world pixels. Answers whether it landed on a pot --
// input.js stops there if it did, so clicking a cauldron does not also do
// whatever clicking the ground behind it would have done. Kept alongside the
// hover because a touchscreen has no hover: a tap is the only way in there.
export function potPick(x, y) {
  const i = potAt(x, y);
  if (i < 0) return false;
  over = i;
  openFor(i);
  return true;
}

// The cursor crossing the yard. Acts on the pot it is over CHANGING and on
// nothing else, so the list is stood up once per cauldron entered and the
// wander-off grace is started once, on the way out, rather than restarted by
// every move over open ground.
export function potHover(x, y) {
  const i = potAt(x, y);
  if (i < 0) {
    if (over >= 0 && optsOpen(opts)) leaveSoon();
    over = -1;
    return false;
  }
  // Already on this one with its list up: leave the timer alone. Down, though,
  // means something else closed it -- a pick, a press elsewhere -- and pointing
  // at a pot is a request to see its brews whatever happened before.
  if (i === over && optsOpen(opts)) return true;
  over = i;
  openFor(i);
  return true;
}
