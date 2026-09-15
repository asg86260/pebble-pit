// Turning a list of upgrades into rows on a board, and keeping them current.
//
// It knows nothing about what any upgrade does, and nothing about which board it
// is filling: the bench and the lab are the same code with a different list. A
// new upgrade appears without this file changing, and a third board would be
// three lines.

import { S } from './state.js';
import { SHELF_BOARDS, SHELF_INK, SHELF_DOT, SHELF_FLOAT_SPREAD, SHELF_FOLLOW } from './config.js';
import { drawGlyph, glyphFor } from './glyphs.js';
// The shelf's stylesheet rides along only when the boards are shelves, so a
// release ships none of it.
// It arrives after the first board has been built and its width pinned, so
// the sheet is measured again once the shelf's own width applies.
if (SHELF_BOARDS) import('./shelf.css').then(() => remeasure());
import { showTipAt, remeasure } from './board.js';
import { UPGRADES, lodgers, SECTIONS, MARK, buy, gainText, billOf, canPay, purse, priceText, rungOf, rungsOf, maxed, folds, building, inLine, lineAt } from './upgrades.js';
import { takesTime, stalled, BUILDER_SITES, rowFor } from './works.js';
import { closeSubmenu, keepSubmenu } from './board.js';
import { tookLook } from './world.js';
import { CASINO_UPGRADES, CASINO_SECTIONS } from './casino.js';
import { SCRUB_UPGRADES, SCRUB_SECTIONS } from './scrubhouse.js';
import { QUARRY_UPGRADES, QUARRY_SECTIONS } from './quarry.js';
import { FARM_UPGRADES, FARM_SECTIONS } from './farm.js';
import { APOTHECARY_UPGRADES, APOTHECARY_SECTIONS } from './apothecary.js';
import { TOWER_UPGRADES, TOWER_SECTIONS } from './tower.js';
import { STATS_UPGRADES, STATS_SECTIONS } from './stats.js';
import { OUTHOUSE_UPGRADES, OUTHOUSE_SECTIONS } from './outhouse.js';
import { shackRows, shackSections } from './shack.js';
import { crewRows, crewSections, crewList, crewListSections } from './crewboard.js';
import { shown } from './tween.js';

const shopEl = document.getElementById('shop');
const pinEl = document.getElementById('pin');
const casinoEl = document.getElementById('casinoshop');
const crewEl = document.getElementById('crewshop');
const crewListEl = document.getElementById('crewlistrows');
const scrubEl = document.getElementById('scrubshop');
const quarryEl = document.getElementById('quarryshop');
const farmEl = document.getElementById('farmshop');
const apothEl = document.getElementById('apothshop');
const towerEl = document.getElementById('towershop');
const statsEl = document.getElementById('statsshop');
const looEl = document.getElementById('looshop');
const shackEl = document.getElementById('shackshop');

// What is on the board right now, as a string. If it has not changed there is
// nothing to build: the numbers on the rows are refreshed every frame anyway,
// and only the *set* of rows needs the DOM touched.
// The sections a board actually draws: the ones it declares, and then a last
// group holding every row nobody named.
//
// The rows are the source of truth for what *exists*; the sections say how it is
// grouped and in what order. It used to be the other way about -- `shape` and
// `build` walked the sections and looked each key up -- which means a row is
// only real if somebody remembered to write its name a second time, in another
// file, in a list that has nothing to do with the row.
//
// Nine rows were lost to that. They were declared, priced, gated and buyable,
// and no board would draw them, because adding a row is two edits and only one
// of them is where the row is. Forgetting the second one should cost a *heading*
// -- the row lands at the bottom under "and" -- rather than costing the row.
const grouped = (list, sections) => {
  const named = new Set(sections.flatMap(x => x.keys));
  const rest = list.map(u => u.key).filter(k => !named.has(k));
  return rest.length ? [...sections, { title: 'and', keys: rest }] : sections;
};

// Revealing is a one-way door.
//
// A row may leave a board because you bought it or because you finished it.
// A row may NOT leave because a number dipped or a machine stopped -- that is
// the board rearranging itself behind you over something you did not do, and it
// is the second of the two ways these boards moved while you were reading them.
// The farm's door came and went with the dust in the hole, so spending walked it
// off the board; the scrubbing house's came and went with whether a machine
// happened to be turning.
//
// So the condition that REVEALS a row is written as `once`, and it is asked only
// until it is true. `show` is then about whether the row has been consumed,
// which is the one reason a row is allowed to go. A row with no `once` is
// unchanged: most rows' `show` is already monotonic until they are bought, and
// this is for the ones that are not.
export const revealed = u => {
  if (!u.once) return u.show();
  if (!S.shownRows.includes(u.key)) {
    if (!u.once()) return false;
    S.shownRows = [...S.shownRows, u.key];
    S.dirty = true;
  }
  return u.show();
};

function shape(list, sections) {
  const out = [];
  for (const sect of grouped(list, sections)) {
    const rows = sect.keys.filter(k => {
      const u = list.find(x => x.key === k);
      // The same two questions the building asks, and in the same order, or the
      // signature says the board is unchanged while the board it would build is
      // a different board. Folding the finished rows away used to do nothing at
      // all for exactly that reason: the switch flipped, the label changed, and
      // this said "same rows as last time" and never rebuilt them.
      return u && revealed(u) && !(S.hideDone && folds(u));
    });
    if (rows.length) out.push(sect.title, ...rows);
  }
  return out.join(',');
}

// Did that press do anything? A row is gone or greyed after a purchase, and the
// simplest honest test is whether the thing it sells is now had -- but rows do
// not all have such a thing, so it is asked the other way round: a row that can
// no longer be pressed is a row that just fired.
const built = new WeakMap();

// A count between a less and a more, in one cell rather than three.
//
// It used to be three cells of the row's own, which meant a job row and a price
// row had different numbers of columns and no board could line the two up
// without somebody cutting widths for both by hand. Wrapped, the two shapes
// agree: a name, and one thing on the right of it.
// --- the open option list -----------------------------------------------------
// A select's list is a popover laid over the board at the spot under the control
// that opened it -- not a fold in the sheet. Folded in, it pushed every row below
// it down the moment you pressed: the board changed height, and the option you
// were reaching for was no longer where you had aimed. Over the top, nothing
// under it moves.
//
// It hangs off `document.body`, not off the row, and this is not a detail: the
// board sits in a container that carries a *transform*, and a transform makes
// itself the containing block for anything `position: fixed` inside it. Built
// into the row, the list took its coordinates from the board rather than from
// the window -- the styles read `left: 435px` and it drew at 688. The note
// beside a row (`#tip`) lives outside the board for the same reason. Placed from
// the control's own rect once it is out there.
let openList = null;
let leaving = 0;                 // the wander-off timer, if one is running

// Says whether there was one to shut: escape in input.js shuts a list before
// it holds the yard, and only holds it when there was nothing to shut.
export function shutOpts() {
  clearTimeout(leaving);
  leaving = 0;
  if (!openList) return false;
  openList.opts.hidden = true;
  openList.row?.classList.remove('open');
  openList = null;
  return true;
}

// Whether a given list is the one standing open. The pot picker has to know
// whether its own list is up before it decides whether hovering a cauldron is a
// thing to do -- opening it again every pointermove is a list that flickers.
export const optsOpen = list => !!openList && openList.opts === list;

// The cursor wandering off puts the list away, but not the instant it crosses
// the edge: the gap between the control and the list, and the width of a finger
// on the way down a column of options, are both places the pointer is briefly
// outside the thing it is using. So it is a short grace, cancelled the moment
// the pointer comes back to either the list or the control that opened it.
//
// Exported, because the second thing with a list to drop open is a cauldron in
// the yard and the grace is the same grace. It reads as board machinery only
// because boards were the only place that had one; what it is actually about is
// a pointer crossing the gap between a control and the list it opened, and there
// is no version of that this file should own twice. See potpick.js.
const LEAVE_MS = 450;
export function leaveSoon() {
  clearTimeout(leaving);
  leaving = setTimeout(shutOpts, LEAVE_MS);
}
export function stayOpen() { clearTimeout(leaving); leaving = 0; }

// Under the control, right edges lined up, and kept on the screen: flipped above
// when there is no room below, and pulled back inside the window at either edge.
//
// It takes a RECT rather than the element it hangs off, because the second thing
// in the game with a list of named options to pick from is not a board row at
// all: it is a cauldron in the yard, and a cauldron has no DOM to measure. Every
// rule about where a list may stand -- flush right, flipped when there is no room
// below, pulled back inside the window, measured pinned at the origin so nothing
// wraps it -- is a rule about the window, not about boards, and there is no
// version of it that should exist twice. See potpick.js.
export function openOptsAt(r, opts, row = null, align = 'right') {
  opts.hidden = false;
  opts.style.minWidth = `${Math.round(r.width)}px`;
  // Measured pinned at the origin, where nothing can wrap it: left where it
  // last stood, a list near the window's right edge folds its longest label
  // and reports a width the final position will not have, so the right edges
  // land 15-40px apart depending on which station's board opened it.
  opts.style.top = '0px';
  opts.style.left = '0px';
  const box = opts.getBoundingClientRect();
  const room = innerHeight - r.bottom - 4;
  // Flush with the control's edge, above it when there is no room below.
  const top = box.height <= room ? r.bottom : Math.max(4, r.top - box.height);
  // Flush right for a board's dial, whose control is the row's right-hand
  // column; centered for a thing in the yard, which has a middle and no row.
  const want = align === 'center'
    ? r.left + r.width / 2 - box.width / 2
    : r.right - box.width;
  const left = Math.max(4, Math.min(want, innerWidth - box.width - 4));
  opts.style.top = `${Math.round(top)}px`;
  opts.style.left = `${Math.round(left)}px`;
  row?.classList.add('open');
  openList = { row, opts };
}

// A board row's own: the control it hangs off is an element, and its rect is
// what `openOptsAt` wants.
const showOpts = (row, chosen, opts) =>
  openOptsAt(chosen.getBoundingClientRect(), opts, row);

// Anywhere else puts it away -- including a press on the yard behind the board.
// `pointerdown` rather than `click` so it is shut before whatever was pressed
// acts on it; a press inside the list is the one that chooses, and is left alone.
addEventListener('pointerdown', e => {
  if (!openList) return;
  if (openList.opts.contains(e.target) || openList.row?.contains(e.target)) return;
  shutOpts();
}, true);
// Escape shuts it too, from input.js's one keyboard handler, ahead of the hold.

// The picture a shelf row stands behind: a zero-width anchor on the tile's
// center line that the glyph hangs off (see `.tile .pic` in shelf.css).
const PIC = '<span class="pic"></span>';
const COIN_ORDER = ['dust', 'spore', 'shard', 'core', 'spark'];
const STEPPER = '<span class="name"><i class="what"></i><i class="ladder"></i></span>' +
  '<span class="step">' +
  '<button type="button" class="less">-</button>' +
  '<span class="count"></span>' +
  '<button type="button" class="more">+</button></span>';

// Set when the board changed shape under whoever is reading it, and read once by
// the board after it has filled its rows in. A flag rather than a call back into
// this file's caller: what has to happen next is a measurement of a board with
// its words already in, which is the frame loop's business and not this file's.
//
// A row arriving or leaving is one way. What a row *says* is the other, and it
// was missed: a bench row pressed now starts a piece of work, and the row then
// swaps its gain for "on the way" and its price for a bill with a clock in it.
// The set of rows is exactly what it was, so nothing said the board had moved --
// and the sheet stood eighteen pixels narrower than the board it was holding,
// for as long as the build lasted. It only ever looked right because the press
// used to rebuild the row set as a side effect of the board being stale.
//
// Cheap because `say` and `sayHTML` already refuse to write a cell whose words
// have not changed: a board nobody is doing anything to writes nothing and is
// measured never.
let moved = false;
export const boardMoved = () => { const was = moved; moved = false; return was; };

// And a softer word for a cell whose TEXT changed while the set of rows did
// not: a hover rewriting a note, a price ticking over. The board still measures
// itself after one of these -- the words may genuinely have widened the sheet --
// but when the width comes back unchanged it keeps its seat, so reading a board
// cannot walk it sideways. (feedback7, items 2 and 3; see hud in board.js.)
let reworded = false;
export const boardReworded = () => { const was = reworded; reworded = false; return was; };

// One row per available upgrade, under a heading for whatever it belongs to.
//
// It is rebuilt only when the set of rows changes. Rebuilding throws away every
// row element and makes new ones, which takes the row under the cursor with it
// -- and the hover on it. A worker tipping a shard into the pit rebuilt the
// whole board, so the highlight blinked off every time anybody banked anything.
function build(el, list, sections, empty, heads) {
  // whether these rows are the submenu itself rather than a board -- see the
  // note further down about what a row hover means
  const inSubmenu = el === crewListEl;
  // The shelf (DESIGN.md, "The shelf"): the same rows, the same builder, a
  // different picture -- a section is a plank and a row is a thing standing
  // on it. The crew submenu is a list, not a shop, and keeps the cards; so
  // does the pin in the corner, which is one card on its own with no shelf
  // to stand on (the owner's call, 2026-09-14).
  // ...and the books are a ledger, not a shelf: a line a reading, the value
  // flush right. Nothing on that board is for sale, so nothing stands on a
  // plank (the owner's call, 2026-09-14). The card markup serves it; the
  // stylesheet lays the cells out as a line.
  const ledger = SHELF_BOARDS && el === statsEl;
  const shelf = SHELF_BOARDS && !inSubmenu && el !== pinEl && !ledger;
  el.classList.toggle('shelves', shelf);
  el.classList.toggle('ledger', ledger);
  // A board whose one heading repeats the name at the top of it says the same
  // thing twice with a rule between: a title reading "the tower" and, directly
  // under it, a heading reading "the tower", over a single row. Where there are
  // several headings they are doing their job -- telling the groups apart --
  // and one of them matching the board's name is fine.
  //
  // The name is read off the title once and kept, because the title may be
  // wearing a badge by the second time through, and a name read with the
  // number on the end of it would never match its own heading again.
  const titleEl = el.closest('.page')?.querySelector('.title');
  if (titleEl && !titleEl.dataset.name) titleEl.dataset.name = titleEl.textContent.trim();
  const title = titleEl?.dataset.name;
  const lone = grouped(list, sections).length === 1;
  // A board with a single group has no heading for a headcount to ride -- the
  // shack's one group is the rock miners, and the heading either folds into the
  // title or stands alone over every row on the sheet. Either way the sheet is
  // about one crew, and the count belongs to the sheet: `refresh` wears it on
  // the title instead. The board says whom it counts; a board that counts
  // nobody, or has several groups, keeps its title bare.
  el._titled = lone && heads && titleEl ? { el: titleEl, heads } : null;
  const now = shape(list, sections);
  if (built.get(el) === now) return;
  built.set(el, now);

  // A row going or arriving makes the sheet a different height, and the sheet is
  // seated by the height it was last measured at -- so buying the last upgrade
  // in a section left the board hanging where the taller version of it had
  // stood, with a gap under it and its foot off the bench.
  //
  // Said rather than done. The rows built below are empty until `refresh` puts
  // the words in, and a board measured between the two comes out shorter than
  // it will be -- the same trap opening one used to fall into. So the board is
  // told the set changed and measures itself after it has filled the rows in.
  moved = true;

  // Whatever list was open belonged to a row that is about to be thrown away --
  // and its popover is out on the body, so clearing the board would not take it
  // with it. Each row carries a handle to its own, and only this board's go.
  shutOpts();
  for (const old of el.querySelectorAll('[data-dial]')) old._opts?.remove();
  el.textContent = '';
  if (!now) {                              // nothing to show: say so rather than nothing
    const line = document.createElement('div');
    line.className = 'empty';
    line.textContent = empty;
    el.appendChild(line);
    return;
  }
  for (const sect of grouped(list, sections)) {
    const rows = sect.keys
      .map(k => list.find(u => u.key === k))
      .filter(u => u && revealed(u))
      // and, if asked, without the ones that are finished. A section with
      // nothing left in it goes with them -- a heading over an empty space is
      // worse than the rows were.
      .filter(u => !(S.hideDone && folds(u)));
    if (!rows.length) continue;

    if (!(lone && sect.title === title)) {
      const head = document.createElement('div');
      // The goal section -- the bench's shield on offer -- is the one heading
      // drawn differently, and its cards are drawn across the sheet in a frame
      // of their own; see `.goal` in style.css and `SECTIONS` in upgrades.js.
      head.className = sect.goal ? 'sect goal' : 'sect';
      head.dataset.sect = sect.title;
      el.appendChild(head);
    }

    for (const u of rows) {
      // A dial is the same shape as a job row -- a setting between two buttons --
      // for a setting that is not a headcount. The casino's chip is the only
      // one: how much goes on the table is chosen, and choosing spends nothing.
      if (u.dial) {
        const row = document.createElement('div');
        row.className = 'job';
        row.dataset.dial = u.key;

        // A setting with a list of named options is picked off the list, not
        // stepped onto with two buttons: seven stations is six presses to reach
        // the last one, and a press that walks past the one you wanted has to go
        // all the way round. A dial that declares `options` gets this; one that
        // does not -- a *number*, like the casino's chip -- keeps its two
        // buttons, which is what stepping is actually good at.
        if (u.options) {
          row.classList.add('pickrow');
          row.innerHTML = (shelf ? PIC : '') + '<span class="name"><i class="what"></i></span>' +
                          '<button type="button" class="chosen"></button>' +
                          (u.note ? '<span class="note"></span>' : '');
          if (shelf) row.classList.add('tile');
          row.querySelector('.what').textContent = u.name;
          const chosen = row.querySelector('.chosen');
          // Out on the body, clear of the board's transform (see `showOpts`).
          // The row keeps a handle on it so a rebuild can take it away again.
          const opts = document.createElement('div');
          opts.className = 'optspop';
          opts.hidden = true;
          opts.dataset.forDial = u.key;
          document.body.appendChild(opts);
          row._opts = opts;
          // Wandering off shuts it; coming back to either half calls that off.
          opts.addEventListener('pointerenter', stayOpen);
          opts.addEventListener('pointerleave', leaveSoon);
          row.addEventListener('pointerenter', stayOpen);
          row.addEventListener('pointerleave', leaveSoon);
          for (const o of u.options()) {
            const pick = document.createElement('button');
            pick.type = 'button';
            pick.className = 'opt';
            pick.dataset.opt = o.key;
            pick.textContent = o.label;
            // Picking closes the list: you came to set the thing, and the board
            // reads shorter with it shut.
            pick.addEventListener('click', () => { u.pick(o.key); shutOpts(); });
            opts.appendChild(pick);
          }
          // The list lies over the board, so opening one changes no row's place
          // and the sheet needs no reseating -- no `moved` here. Only one is open
          // at a time: a second list is the first one's answer put away.
          chosen.addEventListener('click', () => {
            const opening = opts.hidden;
            shutOpts();
            if (opening) showOpts(row, chosen, opts);
          });
          el.appendChild(row);
          continue;
        }

        row.innerHTML = (shelf ? PIC : '') + STEPPER + (u.note ? '<span class="note"></span>' : '');
        if (shelf) row.classList.add('tile');
        row.querySelector('.what').textContent = u.name;
        row.querySelector('.less').addEventListener('click', () => u.less());
        row.querySelector('.more').addEventListener('click', () => u.more());
        el.appendChild(row);
        continue;
      }

      // A job row moves bodies rather than spending anything, so it is a count
      // between two buttons instead of one button with a price on it.
      if (u.job) {
        const row = document.createElement('div');
        row.className = shelf ? 'job tile' : 'job';
        row.dataset.job = u.key;
        row.innerHTML = (shelf ? PIC : '') + STEPPER;
        row.querySelector('.what').textContent = u.name;
        row.querySelector('.less').addEventListener('click', () => u.less());
        row.querySelector('.more').addEventListener('click', () => u.more());
        el.appendChild(row);
        continue;
      }

      const b = document.createElement('button');
      b.type = 'button';
      b.dataset.key = u.key;
      // Three cells, not five. A row is a name, what buying it gives you, and
      // what it costs -- there is no before-and-after any more, so there is no
      // arrow between them and nothing to line the two halves up against.
      // The pips live *inside* the name rather than beside it, so they sit under
      // the title whatever the rest of the row is doing. As a cell of their own
      // they were placed after the price -- and a price of two coins is two
      // lines tall, which pushed the pips down past the words they belong to.
      // Three lines, two columns: the name and the pips, the gain and the
      // clock, the coins. The clock is a cell of its own rather than the last
      // coin of the bill, so the bill is coins only and the right-hand column
      // is the two facts about time -- see the card in style.css.
      // On a shelf the same cells stand in a column under a picture, and the
      // clock is a cell of the price's own box (`.tag`) rather than a corner
      // of the card. `refresh` finds every cell by class, so either shape
      // reads the same.
      b.innerHTML = shelf
        ? PIC + '<span class="name"><i class="what"></i><i class="ladder"></i></span>' +
          '<span class="gain"></span><span class="tag"><span class="cost"></span><span class="time"></span></span>' +
          (u.note ? '<span class="note"></span>' : '')
        : '<span class="name"><i class="what"></i><i class="ladder"></i></span>' +
          '<span class="gain"></span><span class="time"></span><span class="cost"></span>' +
          (u.note && !inSubmenu ? '<span class="note"></span>' : '');
      // A readout (`u.read`) is not for sale and does not answer the cursor:
      // no lean, no drift. The hover rule leaves `.stat` alone as well.
      if (shelf) { b.classList.add('tile'); if (!u.read) leanToCursor(b, u.key); }
      // A readout is not a purchase. It keeps the shape of a row so the board
      // still lines up, and gives up everything that says "press me": the class
      // takes the cursor and the hover off in the stylesheet, and there is no
      // click to hang on it in the first place.
      if (sect.goal) b.classList.add('goal');
      // The pin: a pushpin in the card's corner, and pressing it puts this
      // card in the top-right corner of the game (`fillPin`) -- or takes it
      // down again, if it is the one there. It is not a press on the card, so
      // the press is stopped here; and it is on every card that is a purchase,
      // because what you are saving for is yours to say. A readout has nothing
      // to wait for and a signpost has no price, so neither carries one.
      if (!u.read && !u.sign && !inSubmenu) {
        const pin = document.createElement('i');
        pin.className = 'pinmark';
        pin.title = 'pin this card to the corner';
        const press = e => { e.stopPropagation(); e.preventDefault(); togglePin(u.key); };
        pin.addEventListener('pointerdown', press);
        pin.addEventListener('click', e => { e.stopPropagation(); e.preventDefault(); });
        b.appendChild(pin);
      }
      if (u.read) b.classList.add('stat');
      // A purchase leaves the board up. It put the board away for a while
      // (feedback8 item 1): buying is a thing you do to the yard, and the
      // sheet got out of the light so you could see the dust arc and the gang
      // walk out. That was decided when a site took one work at a time, so
      // the next press was ten seconds off anyway. A site takes a line now
      // (DESIGN.md, "The queue"), and the point of a line is pressing the next
      // row while you are still standing here -- the owner's call, 2026-09-12.
      // Walking away is one step, and the card in the corner shows what the
      // yard is doing without the board having to get out of its way.
      else b.addEventListener('click', () => {
        tookLook();                            // anything the yard sent earlier
        buy(u);
        tookLook();                            // and whatever this purchase sent
      });
      // A row that has something to say says it on hover, in the same words in
      // the same box the yard uses for a mark you went and looked at. It is the
      // one place a *name* is not enough: a breaker is a word, and what a
      // breaker does is the reason you would buy one.
      // A row that leads somewhere rather than doing something. What is behind
      // it opens on the way in, not on the press: every other menu in this game
      // comes out because you walked up to the thing it belongs to, and a
      // submenu you had to click for would be the one place that asked twice.
      // The press is still wired up -- see the row itself -- because a finger
      // cannot hover, and the two together are how it works on both.
      // Every row on a *board* answers the question of which row you are
      // reading, including the ones with nothing behind them: hovering a row
      // that leads nowhere puts away whatever the last row led to.
      //
      // Rows inside the submenu are not asking that question -- they are the
      // answer to it. This same builder makes them, so without the exception
      // every name in the crew list carried an instruction to close the crew
      // list, and hovering a body to read it shut the sheet it was written on.
      if (u.over) { b.classList.add('door'); b.addEventListener('pointerenter', () => u.over()); }
      //
      // And it puts it away by being *stood on*, not crossed: the list stands
      // beside the board and this row is on the way to it, so the fold waits a
      // grace and leaving the row inside it is the pointer passing through.
      else if (!inSubmenu) {
        b.addEventListener('pointerenter', () => closeSubmenu());
        b.addEventListener('pointerleave', () => keepSubmenu());
      }
      // And the corner comes off the card you actually went and looked at.
      // Closing the board used to take every mark on it off at once, on the
      // grounds that the board had been open with the rows on it -- but "it was
      // on the screen" is not the same as "you read it", and on a board of a
      // dozen the one row you came for is the only one you looked at. Marking
      // the rest seen throws away the answer to "what is new here" for every row
      // you scrolled past. Hovering is the cheapest true evidence the page has
      // that a row was read, so it is the thing that clears it.
      //
      // A finger cannot hover, so the press clears it too -- the same pairing
      // the submenu rows use a few lines up, and for the same reason.
      b.addEventListener('pointerenter', () => markRowSeen(u));
      b.addEventListener('pointerdown', () => markRowSeen(u));
      // A board row wears its description inline (see the `.note` line above and
      // `sayNote`); the crew submenu keeps the hover, because a roster of a dozen
      // bodies is long enough without a line of prose under each -- and it is a
      // list you read, not a shop of things you buy. So the tip stays here, for
      // the submenu -- and for a shelf, where a tile has no line to wear its
      // description on (DESIGN.md, "The shelf": descriptions go to the tip).
      // The goal card is the exception and keeps its sentence in place.
      if ((inSubmenu || (shelf && !sect.goal)) && u.note) {
        const say = () => {
          const r = b.getBoundingClientRect();
          // `showTipAt` stands a note that would land on the sheet off beside
          // the board, where it is not under the board's layer
          showTipAt(u.note(), r.right + 8, r.top - 2);
        };
        b.addEventListener('pointerenter', say);
        b.addEventListener('pointermove', say);
        b.addEventListener('pointerleave', () => showTipAt(null));
      }
      el.appendChild(b);
    }
  }
}

// the numbers on the rows, every frame the board is open
// A cell is written only when what it says changes.
//
// This runs on every row of an open board, on every frame -- fifteen rows, five
// cells each -- and it used to write all of them every time. `innerHTML` is a
// parse, so a price that had not moved was parsed sixty times a second, and a
// text node was replaced for every name on the board. Nothing on a shop row
// changes more than a few times a minute. The board is careful about this in
// every other place; this is the one that was not.
// A count in a cell, run through the tweener like every other number in the
// yard. A dial's value can be words ("batch after batch"), and words do not
// count: only a value that is a number runs.
const sayCount = (key, v) => typeof v === 'number' ? String(Math.round(shown('count:' + key, v))) : String(v);
const say = (el, text) => { if (el._said !== text) { el._said = text; el.textContent = text; reworded = true; } };
const sayHTML = (el, html) => { if (el._said !== html) { el._said = html; el.innerHTML = html; reworded = true; } };
const grey = (el, off) => { if (el.disabled !== off) el.disabled = off; };
// A row's description, in place of the hover it used to carry -- written into the
// `.note` line the builder hangs under any row whose upgrade has one. Written the
// same careful way as the rest: only when the words change. A row with no note
// has no `.note` element and this does nothing.
const sayNote = (row, u) => { const n = row.querySelector('.note'); if (n && typeof u.note === 'function') say(n, u.note()); };

// A headcount worn after a line of words -- a section heading, or the title of
// a board with one group. The words are the only text in the line's own
// textContent, so overwriting them can never leave a stale badge behind; the
// badge, when there is one, is appended after as its own element rather than
// folded into the words, so the count can be styled apart from a heading that
// stays dim.
//
// And only when it actually changes. This runs every frame the board is open,
// and building a fresh element sixty times a second lays the whole panel out
// sixty times a second, for a number that moves when you move somebody. The
// board is careful about this everywhere else; so is this.
function wearBadge(line, words, n) {
  n = Math.round(shown('badge:' + words, n));
  if (line.dataset.count === String(n)) return;
  line.dataset.count = n;
  moved = true;                            // a badge is a word, and words have a width
  line.textContent = words;
  if (n) {
    const badge = document.createElement('span');
    badge.className = 'badge';
    badge.textContent = n;
    line.appendChild(badge);
  }
}

export function refresh(el, list, headcount) {
  if (el._titled) wearBadge(el._titled.el, el._titled.el.dataset.name, el._titled.heads());
  for (const row of el.children) {
    if (row.dataset.sect) {
      wearBadge(row, row.dataset.sect, headcount ? headcount(row.dataset.sect) : 0);
      continue;
    }
    if (row.dataset.dial) {
      const u = list.find(x => x.key === row.dataset.dial);
      if (!u) continue;
      if (u.options) {
        // The shut list says which one is set; the open one also marks it, so
        // you can see what you are changing from.
        say(row.querySelector('.chosen'), u.value());
        const at = String(u.at ? u.at() : '');
        for (const o of row._opts?.querySelectorAll('.opt') || [])
          o.classList.toggle('on', o.dataset.opt === at);
      } else {
        grey(row.querySelector('.less'), u.lo());
        say(row.querySelector('.count'), sayCount(u.key, u.value()));
        grey(row.querySelector('.more'), u.hi());
      }
      sayNote(row, u);
      continue;
    }
    if (row.dataset.job) {
      const u = list.find(x => x.key === row.dataset.job);
      if (!u) continue;
      grey(row.querySelector('.less'), u.count() < 1);
      say(row.querySelector('.count'), sayCount(u.key, u.count()));
      grey(row.querySelector('.more'), u.spare() < 1);
      continue;
    }
    const u = list.find(x => x.key === row.dataset.key);
    if (!u) continue;
    row.classList.toggle('pinned', S.pinned === u.key);
    sayNote(row, u);
    // What it costs, as a mark and a number for each currency in the bill. Most
    // rows are priced in a single thing, and reading every price the same way is
    // what lets the ones that are not be read at all.
    //
    // Each price is its own cell rather than words in a line, so that a bill of
    // three reads as three prices and not as one long number.
    //
    // It used to stack them, two to a line, because the price column was cut for
    // a mark and a number and even two side by side ran out of it. The column is
    // measured now, so they fit -- and a bill that grows downwards was the last
    // thing on these boards making one row taller than the next.
    // And each coin says whether you have it. A bill of two is a row you cannot
    // press for one of two reasons, and "you are short of something" is not the
    // same information as "you are short of *this*": with the whole row dimmed
    // alike, a player with the stone and not the dust reads the same row as one
    // with neither, and has to go and count both piles to find out which.
    //
    // The price is not run through the tweener. A price only changes when the
    // rung it was for has landed and the next one is up, and a number counting
    // from the old bill to the new one read as the price of the thing you had
    // just bought going up under you, rather than as a different card with its
    // own price. A count runs because the thing it counts moved; a price is a
    // fact about the next rung, and the next rung did not move.
    const said = ([money, n]) =>
      `<span class="${purse(money) >= n ? 'have' : 'short'}">${MARK[money]} ${priceText(money, n)}</span>`;
    const full = billOf(u);
    // The coins in the order the yard hands them out, whatever order the row
    // wrote its bill in, so the same coin is in the same place on every row.
    const bill = full.filter(([m]) => m !== 'time')
      .sort((a, b) => COIN_ORDER.indexOf(a[0]) - COIN_ORDER.indexOf(b[0])).map(said).join('');
    const clock = full.filter(([m]) => m === 'time').map(said).join('');
    // By class, never by position: a shelf tile has a picture in front and
    // its clock inside the price's box, and a card has neither.
    const gain = row.querySelector('.gain'), time = row.querySelector('.time'), price = row.querySelector('.cost');
    const what = row.querySelector('.what'), ladder = row.querySelector('.ladder');
    // The picture, on a shelf, wears the deepest coin of the next rung's bill
    // as a stroke and goes grey once the ladder is climbed: it is the rung
    // marker (DESIGN.md, "The shelf"). Its ink pales with the title while a
    // coin of the bill is short, or while the bill names a coin the yard
    // cannot get yet, the same grey the tag goes, so a tile that is not yours
    // to press reads as one from across the plank and not only at its price.
    // Redrawn only when either changes.
    const waits = u.waits?.() || '';
    const pic = row.querySelector('.pic');
    if (pic) {
      const coins = full.map(([m]) => m);
      const tint = maxed(u) ? SHELF_INK.done
                 : coins.includes('spark') ? SHELF_INK.spark
                 : coins.includes('shard') ? SHELF_INK.shard
                 : coins.includes('spore') ? SHELF_INK.spore : null;
      const ink = waits || full.some(([m, n]) => m !== 'time' && purse(m) < n) ? SHELF_INK.short : '#000';
      const drawn = `${tint}/${ink}`;
      if (pic.dataset.tint !== drawn) { pic.dataset.tint = drawn; pic.replaceChildren(drawGlyph(glyphFor(u.key), tint, ink)); }
    }
    // Nothing counts the coins any more. The bill wraps inside the card's own
    // price cell when it runs out of room, which is a measurement of the words
    // actually in it rather than a guess about how many there will be -- see the
    // note by `.rows button .cost` in style.css.

    // The lab's own branch stood here: a piece of research under way said so in
    // place of its numbers, and nothing else on that board could be started
    // until it landed. It went with the lab, and nothing replaced it because
    // nothing had to -- a multiplier is a build now, so the branch below, which
    // every other site has always used, says the same thing about it.

    // A row past the bench is a thing the yard has to build, and while it is
    // building the row says so where the numbers go -- the same shape the lab
    // has used for research since the day it opened. The clock in its bill is
    // counting down what is left at the rate the site is actually going, so the
    // price cell is left standing rather than blanked: it is the one number you
    // came to the board to read.
    //
    // A row bought and waiting its turn at a site that is building something
    // else says where in the line it stands, with its ordinary price -- and it
    // stays pressable, because pressing it again is how it is handed back.
    // The site used to grey every other row on it while it built one thing;
    // see DESIGN.md, "The queue", for why that went.
    if (takesTime(u)) {
      const mine = building(u);
      if (mine) {
        say(what, u.name);
        // Nobody standing there is the one thing that stops it, and it is a
        // thing you can act on: an empty cut builds nothing however long you
        // leave it, and the roster under the cut is where you fix that.
        // ...except at a builders' site, where there is always somebody: the
        // nearest body is lent if nobody is spare, and the row says "building"
        // from the press, walk included -- a body on its way to a job is on
        // that job, and a second word for the walk was one status too many.
        //
        // The vocabulary is closed, and every word in it fits the tightest cell
        // on any board (see `pinWidth` in board.js and the width check in
        // selftest/boards.js): "queued up in 7", "building", "nobody on it". A
        // status is about the whole card, and the gain's line -- which it
        // takes over -- spans the card less the pips' corner (see `.gain` in
        // style.css).
        row.classList.add('waiting');
        const queued = inLine(u);
        sayHTML(gain, queued ? `queued up in ${lineAt(u)}` :
                stalled(u.site) && !BUILDER_SITES.includes(u.site) ? 'nobody on it' :
                'building');
        sayHTML(price, bill); sayHTML(time, clock);
        // Greyed while it is being built -- committed, nothing to press for --
        // and live while it waits, so a press can pull it back out.
        grey(row, !queued);
        // A queued row is pressable (to hand it back) but its price is not
        // one you are being offered: it wears `off` so the shelf's hover
        // leaves it alone with the rest you cannot pay for.
        row.classList.add('off');
        continue;
      }
    }
    // ...and the site is clear again, so the card goes back to a gain in a
    // column and the note about what was on it goes -- unless the card is
    // waiting on something of its own, below.
    if (!waits && row.classList.contains('waiting')) row.classList.remove('waiting');
    if (row.classList.contains('locked') !== !!waits) row.classList.toggle('locked', !!waits);


    // and a dot on anything that has not been on a board you have looked at
    // -- a purchase, that is: a readout on the books is not a thing to have
    // missed, and every one of the twelve wore the corner (critics C13)
    const fresh = !u.read && !S.seenRows.includes(u.key);
    if (row.classList.contains('new') !== fresh) row.classList.toggle('new', fresh);

    // The name, and where the row is on its ladder. Five rungs to nearly every
    // ladder in the game (see RUNGS; the kit is the one that is shorter, and says
    // so), so "3 of 5" means the same thing wherever it is read, and a finished
    // one says so and stays there rather than vanishing -- which is what the rate
    // rows used to do when they hit a floor nobody had been told about.
    say(what, u.name);
    // How far up the ladder, as a row of pips under the words rather than as a
    // number in the middle of them. "3/5" sat between the name and what the next
    // one buys, which is two numbers about different things a character apart --
    // and the eye has to stop and read it. Pips are counted at a glance and take
    // no column: they are drawn *under* the row, in the two pixels of space the
    // rows already have between them.
    if (ladder) {
      // How long the ladder is is the row's own business -- most are `RUNGS`,
      // the kit ladders are shorter -- so the pips are counted off the row
      // rather than off the constant. See `rungsOf`.
      const at = u.rung ? rungOf(u) : 0;
      const of = rungsOf(u);
      const pips = u.rung ? '●'.repeat(at) + '○'.repeat(Math.max(0, of - at)) : '';
      // A ladder sold in bands asks for its pips in groups of a band, one a
      // band, each group in its band's coin (the stylesheet tints them): the
      // pips are then the bill's legend as well as the count. Each group is an
      // element so it can be colored; a ladder with no groups is one run.
      // The gap between groups is what tells a band's pips from the next
      // band's, so a band one pip wide gets none -- there is nothing inside
      // it to set apart, and with the gap the row stood a pip's width open
      // between every mark and read as three marks rather than one row.
      const want = u.group && pips
        ? pips.match(new RegExp(`.{1,${u.group}}`, 'g')).map(g => `<b>${g}</b>`).join(u.group > 1 ? ' ' : '')
        : pips;
      if (ladder.innerHTML !== want) ladder.innerHTML = want;
      // No '3 of 5' on hover: the pips are the answer.
    }
    // A finished ladder has nothing left to say in the middle or on the right.
    // "done" rather than a price, because a price on a row you cannot buy is a
    // row that looks like you cannot afford it.
    if (maxed(u)) {
      sayHTML(gain, '');
      sayHTML(price, 'done'); sayHTML(time, '');
      grey(row, true); row.classList.add('off');
      continue;
    }
    // A ladder whose next rung is priced in a coin the yard has no source for
    // yet. The card stays -- the rungs bought are on it -- and says what it is
    // waiting on in the status line, the way a card being built does, with no
    // price: a bill in crops on a yard with no plots is not a price, it is a
    // word the player has not met (see `coinNeeds`).
    if (waits) {
      // `locked` is the shelf's word for it: the tile pales like one you
      // cannot pay for, since to the player it is the same news.
      row.classList.add('waiting');
      sayHTML(gain, waits);
      sayHTML(price, ''); sayHTML(time, '');
      grey(row, true); row.classList.add('off');
      continue;
    }
    // On a shelf the gain is the number alone -- the name is the verb.
    const g = gainText(u);
    sayHTML(gain, pic && u.does && g.startsWith(u.does + ' ') ? g.slice(u.does.length + 1) : g);
    // A row that is not a purchase says what it *pays* where a price would go.
    // The casino's two decisions are the only ones: neither costs anything, and
    // the number either of them is about is the one on the table.
    sayHTML(price, u.price ? u.price() : bill); sayHTML(time, u.price ? '' : clock);
    const off = u.price ? !!u.dead?.() : !canPay(u);
    grey(row, off);
    // `off` is the shelf's own word for "not yours to press right now": the
    // hover, the lift and the lean all key off it, never off `disabled`,
    // so a tile you cannot pay for does not answer the cursor whatever the
    // button's state is.
    row.classList.toggle('off', off);
  }
  if (el.classList.contains('shelves')) phaseDots(el);
}

// Each tile's own dots, phased to the sheet's: the sheet draws a dot every
// SHELF_DOT px from its padding edge, and a tile standing at (left, top) inside it
// draws the same tile shifted back by its own offset modulo SHELF_DOT, so the two
// coincide to the pixel. Measured off the layout, never guessed, because a
// tile's top depends on the signs and planks above it. Written only when the
// offset changes; a board is laid out once and then only reseated.
// A lifted tile leans toward the cursor: up to SHELF_FOLLOW px at the tile's
// edge, in whole pixels so the dots stay on their grid, eased by the
// stylesheet. And it drifts at a rate and in a direction of its own, hashed
// off the row's key, so a plank of tiles never breathes in unison.
function leanToCursor(b, key) {
  let h = 0; for (const ch of key) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  b.style.setProperty('--sway-rate', String(1 + ((h % 1000) / 1000 * 2 - 1) * SHELF_FLOAT_SPREAD));
  b.style.setProperty('--sway-dir', (h >> 10) & 1 ? 'reverse' : 'normal');
  b.addEventListener('pointermove', e => {
    // a tile you cannot pay for, or that is not for sale, does not lean
    if (b.disabled || b.classList.contains('off') || b.classList.contains('stat')) return;
    const r = b.getBoundingClientRect();
    const dx = (e.clientX - (r.left + r.right) / 2) / (r.width / 2);
    const dy = (e.clientY - (r.top + r.bottom) / 2) / (r.height / 2);
    b.style.setProperty('--follow-x', `${Math.round(Math.max(-1, Math.min(1, dx)) * SHELF_FOLLOW)}px`);
    b.style.setProperty('--follow-y', `${Math.round(Math.max(-1, Math.min(1, dy)) * SHELF_FOLLOW)}px`);
  });
  b.addEventListener('pointerleave', () => { b.style.setProperty('--follow-x', '0px'); b.style.setProperty('--follow-y', '0px'); });
}

// Layout offsets, never rects: a rect carries the tile's transform, and a
// lifted tile re-phased off its moving rect every frame had its dots pinned
// to the ground while the plate moved -- the one thing the dots are for.
const laidAt = e => { let x = 0, y = 0; for (; e; e = e.offsetParent) { x += e.offsetLeft; y += e.offsetTop; } return [x, y]; };
function phaseDots(el) {
  // The dots are painted on the sheet, from its padding edge; on a page with
  // no sheet (the bench) the rows paint them and the rows are the box.
  const ground = el.closest('.sheet') || el;
  const [gx0, gy0] = laidAt(ground);
  const gx = gx0 + ground.clientLeft, gy = gy0 + ground.clientTop;   // clientLeft/Top: the border
  for (const t of el.querySelectorAll('.tile')) {
    // A tile that went dear under the cursor keeps no lean: the reset is on
    // pointer-leave, and the pointer has not left.
    if ((t.disabled || t.classList.contains('off')) && t.style.getPropertyValue('--follow-x')) { t.style.removeProperty('--follow-x'); t.style.removeProperty('--follow-y'); }
    const [tx, ty] = laidAt(t);
    const left = tx - gx, top = ty - gy;
    const key = `${left},${top}`;
    if (t._dots === key) continue;
    t._dots = key;
    t.style.setProperty('--dot-x', `${-(((left % SHELF_DOT) + SHELF_DOT) % SHELF_DOT)}px`);
    t.style.setProperty('--dot-y', `${-(((top % SHELF_DOT) + SHELF_DOT) % SHELF_DOT)}px`);
  }
}

// --- what is new on it --------------------------------------------------------
// A row appearing is the game telling you something, and it used to tell you by
// making the list one longer. Which is fine if you had the old list memorised
// and invisible otherwise: the board is a dozen rows and they are all the same
// shape, so a new one among them is a needle.
//
// So a card you have never had on a board carries a turned-down corner until you
// have gone and looked at it. Cleared by the hover on that one card and by
// nothing else: it used to be cleared for every row on the board when the board
// closed, which said "it was on the screen" when the question was "did you read
// it". The first thing that had to be avoided is still avoided -- a mark cleared
// as the board opened would go in the frame it was drawn, and you would never
// once see one -- because a hover cannot happen before the card is under the
// cursor.
export function markRowSeen(u) {
  if (!u || S.seenRows.includes(u.key)) return;
  // A fresh array rather than a push: `seenRows` is a saved field, and the save
  // notices a new array where it can miss a mutation in place.
  S.seenRows = [...S.seenRows, u.key];
  S.dirty = true;
}

// The crew board, rebuilt from the people who are actually here. Its own call
// because the list is people rather than upgrades: it changes length whenever
// anybody is hired, and `build` is already careful about only touching the DOM
// when the set of rows changes.
export function buildCrew() {
  build(crewEl, crewRows(), crewSections(), 'nobody lives here yet');
}

// And the sheet of names that opens off it. The same call for the same reason:
// it is a list of people rather than of upgrades, and it grows a row every time
// another house goes up.
export function buildCrewList() {
  build(crewListEl, crewList(), crewListSections(), 'nobody lives here yet');
}

// Every board there is, by the name the panel knows it by. One table rather
// than eight calls in a row, because it is read two ways now: `buildShop` walks
// the lot, and the frame loop asks for whichever board is open.
//
// Each row is asked for rather than held. farm.js and quarry.js import this file
// back, so their row lists are still being built when this line runs -- naming
// them here outright is a reference to a binding that does not exist yet, and
// the whole game fails to load.
const BOARDS = {
  // Everything that has not moved to a board of its own -- see `listFor` in
  // board.js, which asks the same question.
  bench:  () => [shopEl, UPGRADES.filter(u => !u.board), SECTIONS, 'nothing to sell'],
  // The table is empty between hands, and says so rather than standing blank.
  casino: () => [casinoEl, CASINO_UPGRADES, CASINO_SECTIONS, 'nothing on the table'],
  scrub:  () => [scrubEl, SCRUB_UPGRADES, SCRUB_SECTIONS, 'nothing to fit'],
  // The quarry and the plots run out: there is only so far down and only so much
  // ground. A board with nothing left on it says so rather than standing blank.
  //
  // Each draws the kit row that moved in with it -- the blaster's lamps, the
  // grower's brims -- beside its own: see `lodgers` in upgrades.js.
  quarry: () => [quarryEl, [...QUARRY_UPGRADES, ...lodgers('quarry')], QUARRY_SECTIONS, 'the quarry is as deep as it goes'],
  farm:   () => [farmEl, [...FARM_UPGRADES, ...lodgers('farm')], FARM_SECTIONS, 'the ground is all broken'],
  apothecary: () => [apothEl, APOTHECARY_UPGRADES, APOTHECARY_SECTIONS, 'the pot stands cold'],
  tower:  () => [towerEl, TOWER_UPGRADES, TOWER_SECTIONS, 'nothing stirs in here yet'],
  // The books. Nothing on them is for sale, and a currency you have never seen
  // is not on them either -- so an early yard reads one row, which is honest.
  // The books AND the record, on the one sheet the noticeboard hangs. They
  // are two questions asked at the same place -- what is coming in, and what
  // has happened -- so they are two sections rather than two boards: the
  // yard already groups a sheet by heading, and a second sheet would have
  // wanted a control to open it that no board in the game has.
  stats:  () => [statsEl, STATS_UPGRADES, STATS_SECTIONS, 'nothing has come in yet'],
  // Nothing on it until there is mess on the ground to want a janitor for --
  // see `show` on the outhouse row, which is the board's whole first offer.
  outhouse: () => [looEl, OUTHOUSE_UPGRADES, OUTHOUSE_SECTIONS, 'the brooms are all on their hooks'],
  // The rock's board. Its rows are gathered from UPGRADES when asked rather
  // than held -- see shack.js -- so this row asks for them the same way the
  // house's does.
  //
  // The fifth thing is whom the sheet counts. The bench's headings each carry
  // the bodies under them (`headcount`, board.js); the shack has one group and
  // so no heading to hang the rockhands on, and a crew you can see swinging
  // with no number anywhere is the one count in the yard you would have to
  // take by eye. It rides the title -- see `build`.
  shack:  () => [shackEl, shackRows(), shackSections(), 'the tools are all on the rock', () => S.rockhands]
};

// One board, rebuilt if the set of rows on it has moved. The frame loop calls
// this for whichever board is open, right before it writes the words in.
//
// It is here because a board went stale and nothing noticed. Nearly every row
// past the bench is a piece of *work* now: the press starts a build, and the row
// takes effect seconds later when somebody has finished it -- and the only
// rebuild was on the press. So the farm's row sat on the bench with the farm
// already standing behind it, priced and pressable, while the quarry's row that
// the farm had just unlocked was not on the board at all. Every path that
// changes a board had to remember to say so, and the one path that cannot
// remember -- a work landing by itself, frames later, with nobody's finger on
// anything -- is the one that had just been given to thirteen rows at once.
//
// So the open board asks, every frame, instead of being told. `build` walks the
// row list and returns without touching the DOM unless the *set* has changed,
// which is a dozen `show()` calls and no layout at all. The crew board has been
// rebuilt this way since it was written, and for the same reason: its list
// changes length behind your back.
export function buildBoard(which) {
  const board = BOARDS[which];
  if (board) build(...board());
}

export function buildShop() {
  for (const which of Object.keys(BOARDS)) buildBoard(which);
}

// Draw a handful of rows into any element, with no yard behind them: the card
// bench (cards.html) hands this plain row objects -- a name, a bill, a rung
// count -- and gets back the real markup under the real stylesheet. It is to
// the boards what preview.html is to the effects: the shot that used to cost a
// yard, a crew and a walk to the bench costs a page load.
// `sections` is for the shelf bench (shelf.html), which hands the bench's own
// rows and its own sections through so the planks are the real planks.
export function mountRows(el, rows, title = 'the bench', sections = null) {
  const list = rows.map(u => ({ show: () => true, ...u }));
  build(el, list, sections || [{ title, keys: list.map(u => u.key) }], '', null);
  refresh(el, list, null);
}

// --- the pin ------------------------------------------------------------------
// One card, in the top-right corner of the game, that you chose: the thing you
// are saving for, with its live price, dashed when you are short and pressable
// when you are not, so you can watch the number climb toward it and buy it from
// the yard without opening a board. It is the same row through the same
// builder as the board's, so the corner and the board cannot disagree.
//
// One at a time -- pinning a second takes the first down -- and it comes down
// by itself when the row retires: bought, finished, or gone from every board.
// `S.pinned` is the key, saved, so the pin survives a reload; a key no build
// knows any more reads as nothing pinned.
//
// The goal pins itself. When a shield row arrives and the corner is empty, it
// goes up there -- which is what puts the story on the screen for a player who
// has not opened the bench in ten minutes. Once: going up in the corner is
// being seen (`markRowSeen`, the same fact hovering it on the bench records),
// and a shield you have seen does not climb back into a corner you emptied.
// The player's pin always wins over the story's.
export const togglePin = key => {
  S.pinned = S.pinned === key ? null : key;
  S.dirty = true;
};

const goalRow = () => {
  const goal = SECTIONS.find(s => s.goal);
  if (!goal) return null;
  return UPGRADES.find(u => goal.keys.includes(u.key) && !u.sign && revealed(u)
                            && !S.seenRows.includes(u.key)) || null;
};

export function fillPin() {
  if (!pinEl) return;
  let u = S.pinned ? rowFor(S.pinned) : null;
  if (u && !(revealed(u) && !maxed(u))) { u = null; S.pinned = null; S.dirty = true; }
  // ...but not while a scene has the camera: the next shield's row arrives on
  // the frame the last one breaks, which is the middle of its cutscene, and a
  // card in the corner of that is a card over the thing being watched. It
  // goes up once the scene has let go all the way.
  if (!u && !S.cine) {
    u = goalRow();
    if (u) { S.pinned = u.key; markRowSeen(u); S.dirty = true; }
  }
  pinEl.hidden = !u;
  if (!u) { built.delete(pinEl); return; }
  build(pinEl, [u], [{ title: '', keys: [u.key] }], '', null);
  refresh(pinEl, [u], null);
}



export { UPGRADES, CASINO_UPGRADES, QUARRY_UPGRADES, FARM_UPGRADES };
