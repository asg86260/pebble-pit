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
//
// Under the two of them, quieter, what the brew actually does -- the boards' own
// note register, a second line rather than a longer first one, so the names and
// the bills stay in their columns and the list stays scannable at a glance. The
// wording is `tonicGain`'s, in apothecary.js, which is the one place a brew's
// effect is put into words.
//
// And under the brews, who this pot's doses go to first: "for" and a row a
// job, only the jobs the set brew can reach, each with how many of them are
// under it out of how many there are. It was one dial on the board for the
// whole building, which with two pots on two brews could not say the stew is
// for the diggers and the brew for the carters -- and the count is what the
// dial never told you: whether the round is done or somebody is still waiting.

import { TONICS, potTonicOf, choosePotTonic, potAt, potBox, brewCost,
         tonicGain, tonicOf, tonicShown, canAffordBrew,
         potPreferOf, choosePotPrefer, preferableFor, preferLabel, doseCount } from './apothecary.js';
import { openOptsAt, shutOpts, optsOpen, stayOpen, leaveSoon } from './shop.js';
import { MARK, priceText, purse } from './upgrades.js';
import { screenAt } from './render/frame.js';
import { JOB } from './jobs.js';

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

// Every job a brew can favor, in the picker's order. The rows are built once
// for all of them and shown per pot (`openFor`), the way the brew rows are.
const FOR_JOBS = [JOB.ROCK, JOB.QUARRY, JOB.FARM, JOB.PURIFY, JOB.HAUL, JOB.WIZARD];

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
    // Everything the row says, in one column beside the swatch: the name and the
    // bill on a line, the effect under them.
    const says = document.createElement('span');
    says.className = 'says';
    const line = document.createElement('span');
    line.className = 'line';
    const what = document.createElement('span');
    what.className = 'what';
    what.textContent = t ? t.name : 'nothing';
    line.appendChild(what);
    // The bill and the effect hang on the row and are filled at every open, so
    // what they say is what the next batch will actually be charged and what it
    // will actually be worth -- both of which move under a rung. Turning a pot
    // off costs nothing and does nothing: a price and an effect beside "nothing"
    // would be a description of a thing that is not for sale.
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
  // Who it is for. A heading, then "whoever is nearest" and a row a job. The
  // rows are `for`, not `opt`: an option is a brew, and everything that counts
  // the brews on this list -- the check that there is a swatch a recipe -- goes
  // on counting brews.
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
    // The list stays up: setting who it is for is a tweak to the pot you
    // are already looking at, not a choice that ends the errand the way
    // picking a brew does, and the count beside the rows is what you want
    // to keep reading. The rows are re-marked in place.
    row.addEventListener('click', () => {
      if (onPot < 0 || row.classList.contains('only')) return;
      choosePotPrefer(onPot, job);
      markFor(onPot);
    });
    opts.appendChild(row);
  }
  // Crossing the gap from the cauldron to the list must not count as wandering
  // off, and neither must running the cursor down the options. Same two handlers
  // the board's dials hang on their own lists, and the same timer behind them.
  opts.addEventListener('pointerenter', stayOpen);
  opts.addEventListener('pointerleave', leaveSoon);
}

// Who pot `i` is for, on the rows: the trades the set brew reaches whose
// station stands (`preferableFor`), with the round's count on each. Read at
// every open and again on every pick, so the count is the yard as it stands.
// A trade with a station and nobody on it shows with "0/0" -- the brew will
// reach them the moment somebody is put on -- and a trade with no station is
// not on the list at all: the owner's call, 2026-09-15.
//
// A list with one trade on it -- an early yard where only the rock has hands
// -- has nobody to favor over anybody, so it offers no choice: the one row
// stands as a plain line saying who it is for and how the round is going, and
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
    // A shard recipe stays off the list until the quarry is open (item 24):
    // shard is the quarry's coin, and a row priced in a currency the player has
    // never seen is a row about nothing. Asked at every open, not at build, so
    // the list grows the moment the quarry does. The "nothing" row always shows.
    //
    // And a brew the purse cannot cover is off the list too: the picker shows
    // what a pot can be lit on right now, not the whole book. The one the pot is
    // already turned to stays whatever the purse says, so what it is set to can
    // be seen and turned off; a pot set to a brew you cannot afford would
    // otherwise show a list that pretends it is on nothing.
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
