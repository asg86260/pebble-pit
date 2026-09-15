// Setting a pot's brew at the pot: point at the cauldron and pick what goes in
// it. The picker drops open on hover like a station's board; a press opens it
// too, because a touchscreen has no hover.
//
// The list is the SAME list the boards drop open (`openOptsAt` in shop.js), so
// every rule about where such a list may stand is kept in one place. A
// cauldron has no DOM element to hang off, so `openOptsAt` takes a rect and
// this file works the rect out.
//
// Each option is a swatch of the brew's color, its name, the bill for a batch
// (marks and all, greyed when you cannot pay), and under those what the brew
// does, in `tonicGain`'s words. Under the brews, who this pot's doses go to
// first: a row a job the set brew can reach, with how many are dosed out of
// how many there are.

import { TONICS, potTonicOf, choosePotTonic, potAt, potBox, brewCost,
         tonicGain, tonicOf, tonicShown, canAffordBrew,
         potPreferOf, choosePotPrefer, preferableFor, preferLabel, doseCount } from './apothecary.js';
import { openOptsAt, shutOpts, optsOpen, stayOpen, leaveSoon } from './shop.js';
import { MARK, priceText, purse } from './upgrades.js';
import { screenAt } from './render/frame.js';
import { JOB } from './jobs.js';

const canvas = document.getElementById('c');

// The one list, built once and kept: rebuilt content would drop the pointer
// handlers that keep it open while the cursor is crossing it.
let opts = null;
let onPot = -1;                      // which pot it is currently set for
// The pot the cursor was last over, so a hover opens the list once per pot
// ENTERED rather than once per pointermove: otherwise every move over the
// same cauldron tears the list down and stands it up again, and every move
// over bare ground restarts the wander-off grace so it never closes.
let over = -1;

// Every job a brew can favor, in the picker's order; built once, shown per pot.
const FOR_JOBS = [JOB.ROCK, JOB.QUARRY, JOB.FARM, JOB.PURIFY, JOB.HAUL, JOB.WIZARD];

function build() {
  opts = document.createElement('div');
  opts.className = 'optspop';
  opts.hidden = true;
  opts.dataset.potpick = '';
  document.body.appendChild(opts);
  // Turning the pot off is a row of its own: a picker that toggled on
  // re-picking the marked option would do the opposite of what it shows.
  for (const t of [null, ...TONICS]) {
    const pick = document.createElement('button');
    pick.type = 'button';
    pick.className = 'opt';
    pick.dataset.opt = t ? t.key : '';
    const swatch = document.createElement('i');
    swatch.className = 'swatch';
    if (t) swatch.style.background = t.color;
    pick.appendChild(swatch);
    const says = document.createElement('span');
    says.className = 'says';
    const line = document.createElement('span');
    line.className = 'line';
    const what = document.createElement('span');
    what.className = 'what';
    what.textContent = t ? t.name : 'nothing';
    line.appendChild(what);
    // The bill and the effect are filled at every open, because both move
    // under a rung.
    const bill = document.createElement('span');
    bill.className = 'bill';
    line.appendChild(bill);
    says.appendChild(line);
    const gain = document.createElement('span');
    gain.className = 'note';
    says.appendChild(gain);
    pick.appendChild(says);
    pick.addEventListener('click', () => {
      if (onPot >= 0) choosePotTonic(onPot, t ? t.key : null);
      shutOpts();
    });
    opts.appendChild(pick);
  }
  // The rows are `for`, not `opt`: everything that counts the brews on this
  // list (the check that there is a swatch a recipe) goes on counting brews.
  const head = document.createElement('span');
  head.className = 'forhead';
  head.textContent = 'for';
  opts.appendChild(head);
  for (const job of [null, ...FOR_JOBS]) {
    const row = document.createElement('button');
    row.type = 'button';
    row.className = 'for';
    row.dataset.for = job || '';
    const who = document.createElement('span');
    who.className = 'who';
    who.textContent = job ? preferLabel(job) : 'whoever is nearest';
    row.appendChild(who);
    const n = document.createElement('span');
    n.className = 'count';
    row.appendChild(n);
    // The list stays up: setting who it is for is a tweak to the pot you are
    // already looking at, and the count beside the rows is what you want to
    // keep reading. The rows are re-marked in place.
    row.addEventListener('click', () => {
      if (onPot < 0 || row.classList.contains('only')) return;
      choosePotPrefer(onPot, job);
      markFor(onPot);
    });
    opts.appendChild(row);
  }
  // Crossing the gap from the cauldron to the list must not count as wandering
  // off; same handlers and timer the board's dials use.
  opts.addEventListener('pointerenter', stayOpen);
  opts.addEventListener('pointerleave', leaveSoon);
}

// Who pot `i` is for: the trades the set brew reaches whose station stands
// (`preferableFor`), with the round's count on each, read at every open and
// every pick. A trade with a station and nobody on it shows "0/0"; a trade
// with no station is not on the list.
//
// One trade on the list is no choice: the row stands as a plain line and
// "whoever is nearest" is off, since nearest and that trade are the same
// people.
function markFor(i) {
  const can = preferableFor(i);
  const favor = potPreferOf(i) || '';
  const only = can.length === 1;
  for (const r of opts.querySelectorAll('.for')) {
    const job = r.dataset.for;
    const c = job ? doseCount(i, job) : null;
    r.hidden = job ? !can.includes(job) : only;
    r.classList.toggle('only', only);
    r.classList.toggle('on', !only && job === favor);
    r.querySelector('.count').textContent = c ? `${c.dosed}/${c.of}` : '';
  }
}

// The picker is `position: fixed`, so it wants client coordinates: `screenAt`
// gives canvas-relative pixels and the canvas's own rect puts them on the
// window.
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
    // A shard recipe stays off until the quarry is open, asked at every open
    // so the list grows the moment the quarry does. A brew the purse cannot
    // cover is off too, except the one the pot is already on, which stays so
    // it can be seen and turned off. The "nothing" row always shows.
    const t = tonicOf(o.dataset.opt);
    const on = o.dataset.opt === (at || '');
    o.hidden = !!t && !(tonicShown(t) && (on || canAffordBrew(t.key)));
    o.classList.toggle('on', on);
    o.querySelector('.bill').innerHTML = brewCost(o.dataset.opt).map(([money, n]) =>
      `<span class="${purse(money) >= n ? 'have' : 'short'}">` +
      `${MARK[money]} ${priceText(money, n)}</span>`).join('');
    o.querySelector('.note').innerHTML = tonicGain(tonicOf(o.dataset.opt));
  }
  markFor(i);
  stayOpen();                       // whatever grace was running, this cancels it
  openOptsAt(potRect(i), opts, null, 'center');
}

// A press in the yard, in world pixels. Answers whether it landed on a pot;
// input.js stops there if it did, so a click on a cauldron does not also hit
// the ground behind it.
export function potPick(x, y) {
  const i = potAt(x, y);
  if (i < 0) return false;
  over = i;
  openFor(i);
  return true;
}

// Acts on the pot under the cursor CHANGING and on nothing else, so the list
// is stood up once per cauldron entered and the wander-off grace started once
// on the way out.
export function potHover(x, y) {
  const i = potAt(x, y);
  if (i < 0) {
    if (over >= 0 && optsOpen(opts)) leaveSoon();
    over = -1;
    return false;
  }
  // Already on this one with its list up: leave the timer alone. Down means
  // something else closed it, and pointing at a pot is a request to see its
  // brews whatever happened before.
  if (i === over && optsOpen(opts)) return true;
  over = i;
  openFor(i);
  return true;
}
