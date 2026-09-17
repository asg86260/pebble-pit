// The workbench board: where it sits on screen, when it opens, and the counter
// above the pit that chases the number.

import { P, PIP_EM, PIP_TONE, PIP_HOVER_LIFT, SHELF_SLOT, SHELF_SLOTS, SHELF_SLOTS_MIN, SHELF_STEP, SHELF_TOP, SHELF_FOOT, SHELF_AIR, SHELF_SIGN, SHELF_PLANK, SHELF_HOVER_MS, SHELF_FLOAT_MS, SUBMENU_GRACE_MS,
         SHEET_MS } from './config.js';
import { fmt } from './words.js';
import { S, bench } from './state.js';
import { STATIONS as ROWS, station, open, standRect, nearStation } from './stations.js';
import { crewRows, crewList } from './crewboard.js';
import { UPGRADES, lodgers, markSectionsSeen, canPay, inLine } from './upgrades.js';
import { maxed } from './words.js';
import { markDoneSeen } from './works.js';
import { callOut, raiseBench } from './raise.js';
import { cutsceneRunning } from './cutscene.js';
import { busy } from './casino.js';
import { SCRUB_UPGRADES } from './scrubhouse.js';
import { QUARRY_UPGRADES } from './quarry.js';
import { FARM_UPGRADES } from './farm.js';
import { APOTHECARY_UPGRADES } from './apothecary.js';
import { TOWER_UPGRADES } from './tower.js';
import { STATS_UPGRADES } from './stats.js';
import { OUTHOUSE_UPGRADES } from './outhouse.js';
import { shackRows } from './shack.js';
import { refresh, buildCrew, buildCrewList, buildShop, buildBoard, boardMoved,
         boardReworded, shutOpts } from './shop.js';
import { now } from './clock.js';
import { shown } from './tween.js';
import { JOB } from './jobs.js';
import { coarse } from './prefs.js';
import { sheetSeat } from './sheet.js';

const shopEl = document.getElementById('shop');
const crewShopEl = document.getElementById('crewshop');
const crewListEl = document.getElementById('crewlist');
const crewListRowsEl = document.getElementById('crewlistrows');
const scrubShopEl = document.getElementById('scrubshop');
const quarryShopEl = document.getElementById('quarryshop');
const farmShopEl = document.getElementById('farmshop');
const apothShopEl = document.getElementById('apothshop');
const towerShopEl = document.getElementById('towershop');
const statsShopEl = document.getElementById('statsshop');
const looShopEl = document.getElementById('looshop');
const shackShopEl = document.getElementById('shackshop');
const panelEl = document.getElementById('panel');
const purseEl = document.getElementById('purse');
const pages = { bench: document.getElementById('board'),
                house: document.getElementById('house'),
                scrub: document.getElementById('scrub'),
                quarry: document.getElementById('quarryboard'),
                farm: document.getElementById('farmboard'),
                apothecary: document.getElementById('apothboard'),
                tower: document.getElementById('towerboard'),
                stats: document.getElementById('statsboard'),
                outhouse: document.getElementById('looboard'),
                shack: document.getElementById('shackboard') };

// The pips' size and tone live in config and are handed to the stylesheet
// here, once, on the root, so no two boards can disagree about them.
document.documentElement.style.setProperty?.('--pip-em', `${PIP_EM}em`);
document.documentElement.style.setProperty?.('--pip-tone', String(PIP_TONE));
document.documentElement.style.setProperty?.('--pip-hover', String(PIP_HOVER_LIFT));
// The shelf's steps, the same way: config owns them, shelf.css reads them.
for (const [name, v] of [['slot', SHELF_SLOT], ['step', SHELF_STEP], ['top', SHELF_TOP], ['foot', SHELF_FOOT], ['air', SHELF_AIR], ['sign', SHELF_SIGN], ['plank', SHELF_PLANK]])
  document.documentElement.style.setProperty?.(`--shelf-${name}`, `${v}px`);
document.documentElement.style.setProperty?.('--shelf-hover-ms', `${SHELF_HOVER_MS}ms`);
document.documentElement.style.setProperty?.('--shelf-float-ms', `${SHELF_FLOAT_MS}ms`);
// Where you stand to open each board, and where the board goes up: the same
// place, for every station today, read off the table in stations.js. The
// house grows a room per body and the sheds move with the grounds, so a
// rectangle is read live, never gathered.
const anchor = which => station(which)?.stand?.();
// Read inside a function, not gathered at load: the imports come round in a
// ring, and a table built while the ring is still closing gets `undefined` for
// whichever list had not been reached yet.
const listFor = which =>
  // A row names the sheet it belongs to; the bench takes the rest.
  which === 'bench' ? UPGRADES.filter(u => !u.board) :
  which === 'scrub' ? SCRUB_UPGRADES :
  // The grounds' own rows and the kit row that lodges with each (`lodgers`).
  which === 'quarry' ? [...QUARRY_UPGRADES, ...lodgers('quarry')] :
  which === 'farm' ? [...FARM_UPGRADES, ...lodgers('farm')] :
  which === 'apothecary' ? APOTHECARY_UPGRADES :
  which === 'tower' ? TOWER_UPGRADES :
  which === 'stats' ? STATS_UPGRADES :
  which === 'outhouse' ? OUTHOUSE_UPGRADES :
  which === 'shack' ? shackRows() :
  which === 'house' ? crewRows() : [];

// Every station that has a board; what is true of all of them (the mark under
// the foot, for one) is written once against this list.
export { BOARDS as STATIONS } from './stations.js';

// whether a station is there at all yet
const standing = which => open(which);

export { standRect };

export function stationFoot(which) {
  const r = standRect(which);
  return r && r.x + r.w / 2;
}

// Whether a station has something on its board worth the walk: one mark, one
// question.
export function hasOffer(which) {
  if (!standing(which)) return false;      // a place that is not there offers nothing
  // Something you could buy this second, and nothing else. Not an unseen row
  // (a new yard has seen none, so every station would point at itself from
  // the first frame), not a job count, not a maxed ladder, not a row already
  // bought and waiting its turn.
  return listFor(which).some(u => u.show && u.show() && !u.job && !u.dial &&
                                  !u.price && !maxed(u) && !u.dead?.() &&
                                  canPay(u) && !inLine(u));
}

// Whether a station's board holds a row you have never had on an open board:
// the same rule the card's turned-down corner answers to (shop.js, `fresh`),
// so the flag's waves and the corner say new about the same rows. Asked of a
// standing station only; the flag that carries the waves needs a roof.
export function hasNew(which) {
  if (!standing(which)) return false;
  return listFor(which).some(u => u.show && u.show() && !u.read && !S.seenRows.includes(u.key));
}

// Near enough to a station to be interested in it, for the checks that ask
// by name; the pointer asks `stationAt` (stations.js) instead.
export const nearQuarry = (x, y) => nearStation('quarry', x, y);
export const nearFarm = (x, y) => nearStation('farm', x, y);
export const nearHouse = (x, y) => nearStation('house', x, y);

// The board's size, measured when it opens, changes page or the window changes,
// never every frame: reading `offsetWidth` forces a layout.
let sized = { w: 0, h: 0 };

// How big the sheet is *now*. `sized` is a cache, not a second opinion: it
// holds the *last* board's height, which belongs to a different sheet, so the
// live measurement wins whenever there is one and the cache stands in only
// while the element is hidden (zero by zero).
const measured = () => ({ w: (panelEl.hidden ? 0 : mainWidth()) || sized.w,
                          h: panelEl.offsetHeight || sized.h });

// The whole panel, flyout included, for the safe-zone wedge and the tip's
// dodge: both have to cover the list of names, or crossing to it closes the
// board.
let full = { w: 0, h: 0 };

// The main board's own width: the open page and the purse. The crew list is out
// of the panel's flow, so it is not in this and cannot move the seat.
function mainWidth() {
  const sheet = panelEl.querySelector(':scope > .sheet:not(.flyout)');
  const purseW = purseEl.offsetWidth;
  return (sheet ? sheet.offsetWidth : 0) + (purseW ? purseW + panelGap() : 0);
}

// The panel's flex gap, read off the element. The node yard has elements but
// no layout engine, so zero there rather than a crash.
function panelGap() {
  if (typeof getComputedStyle !== 'function') return 0;
  return parseFloat(getComputedStyle(panelEl).columnGap) || 0;
}

// A board is as wide as what it HOLDS, not what it is SAYING this frame. The
// sheet is `nowrap` and sized by content, so left to itself the widest line
// sets the panel's width and `place` re-seats by it: a status word arriving
// walked the board sideways out from under the cursor. So the width is
// measured once, when the set of rows changes, and pinned. Cleared before it
// is read, or every measurement after the first is a measurement of the pin.
function pinWidth() {
  const sheet = panelEl.querySelector(':scope > .sheet:not(.flyout)');
  if (!sheet) return;
  // The room the sheet may take, written onto it so a stylesheet that sizes it
  // by content (the shelf) can cap itself without knowing the purse.
  // On a phone the sheet is the window's width and the purse lies inside it,
  // so the room is the glass (DESIGN.md, "Boards as bottom sheets").
  const purseW = coarse() ? 0 : purseEl.offsetWidth;
  sheet.style.setProperty('--sheet-room', `${S.W - (purseW ? purseW + panelGap() : 0) - 2 * GAP}px`);
  // A shelf is as many slots wide as its fullest plank or its longest sign,
  // capped. It cannot size itself: `auto-fill` needs a definite width to count
  // against. Signs are measured as a range, not as the box, since a sign's box
  // carries its plank, drawn the whole shelf wide.
  const shelf = sheet.querySelector(':scope > .page:not([hidden]) .rows.shelves');
  if (shelf) {
    let most = 0, run = 0;
    for (const el of shelf.children) {
      if (el.classList.contains('sect')) run = 0;
      else if (el.classList.contains('tile') && !el.classList.contains('goal')) {
        // A tile's span is read off the style, not kept as a second list.
        // `grid-column: span 2` lands on the start line; the end computes to auto.
        const span = /span (\d+)/.exec(getComputedStyle(el).gridColumnStart);
        most = Math.max(most, run += span ? +span[1] : 1);
      }
    }
    const range = document.createRange();
    for (const el of shelf.querySelectorAll(':scope > .sect, :scope > .empty')) {
      range.selectNodeContents(el);
      most = Math.max(most, Math.ceil(range.getBoundingClientRect().width / SHELF_SLOT));
    }
    sheet.style.setProperty('--shelf-slots', String(Math.max(SHELF_SLOTS_MIN, Math.min(SHELF_SLOTS, most))));
  }
  sheet.style.width = '';
  // A bottom sheet is as wide as the glass and the stylesheet says so; the
  // pin below is the popover's.
  if (coarse()) return;
  // The used width off the style, not the box: `offsetWidth` rounds a
  // fractional width off and the last word folds under; a client rect is
  // scaled while the board is still easing open. Rounded up, since a fraction
  // short is the fold.
  sheet.style.width = `${Math.ceil(parseFloat(getComputedStyle(sheet).width))}px`;      // border-box, so this is exact
}

// The crew list is one card wide, read off the board's layout (the door's width
// plus the sheet's border and padding) rather than restated in the stylesheet.
// Which side it stands on is `place`'s call.
function seatFlyout() {
  // Inside a bottom sheet the list is a page, and the stylesheet sizes it.
  if (coarse()) { crewListEl.style.width = ''; crewListEl.style.marginLeft = ''; crewListEl.style.maxHeight = ''; return; }
  const sheet = panelEl.querySelector(':scope > .sheet:not(.flyout)');
  const door = sheet && sheet.querySelector('.rows > button.door');
  if (!door) return;
  const rows = door.parentElement;
  // On a shelf the door is one slot, too narrow for cards: two slots wide.
  if (door.classList.contains('tile')) { crewListEl.style.width = `${2 * door.offsetWidth}px`; return; }
  crewListEl.style.width = `${door.offsetWidth + sheet.offsetWidth - rows.offsetWidth}px`;
}

// `repin: false` is for the caller that knows the rows did not move (a hover
// rewriting a note); re-pinning there would hand the width back to the words.
export function remeasure(repin = true) {
  // A hidden element is zero by zero, and taking that as the size would seat
  // the next open board off the window. Opening measures again.
  if (panelEl.hidden) return;
  if (repin) pinWidth();
  seatFlyout();
  full = { w: panelEl.offsetWidth, h: panelEl.offsetHeight };
  sized = { w: mainWidth(), h: full.h };
}

// The transform is written only when it moves: assigning the same one every
// frame invalidates the menu's layer over a canvas that is also repainting,
// and the menu flickers.
let putX = null, putY = null;

function place(el, at) {
  // The second seat (DESIGN.md, "Boards as bottom sheets"): on a phone the
  // board is a sheet from the bottom, chosen here and nowhere else, so both
  // seats share the open, the fill, the linger and every row.
  if (coarse()) return placeSheet();
  if (el.classList.contains('bottom')) leaveSheet();
  const { w, h } = measured();
  // Centered over the station: the farm is a row as wide as its furrows, and a
  // board pinned to its left edge read as belonging to whatever was next along.
  const mid = at.x + (at.w || 0) / 2;
  const want = (mid - S.camX) * S.zoom - w / 2;
  // `w` and `h` are the board's own; the crew list is out of the panel's flow.
  let x = Math.round(Math.max(GAP, Math.min(want, S.W - w - GAP)));

  // Which side the crew list stands on: right of the board; left of the purse
  // (`port`) when the right runs out; and when neither side has the room it
  // stays right and the board gives ground, just as far as it must.
  const listW = crewListEl.hidden ? 0 : crewListEl.offsetWidth + FLY_GAP;
  let port = false;
  if (listW && x + w + listW > S.W - GAP) {
    if (x - listW >= GAP) port = true;
    else x = Math.max(GAP, S.W - GAP - listW - w);
  }
  crewListEl.classList.toggle('port', port);
  // When even that is not enough, the list slides back over the board's edge
  // by the rest: readable over a corner beats off the glass.
  const over = listW && !port ? Math.max(0, x + w + listW - (S.W - GAP)) : 0;
  crewListEl.style.marginLeft = over ? `${-over}px` : '';

  const stands = S.H - (at.y - S.camY) * S.zoom + P * 3;

  // Clear of the rosters, which stand in their own strip under the ground line:
  // a board taller than the room above its station is pushed down by the
  // window clamp, and the counters are the worst thing it could land on.
  const strip = (S.groundY + P * 11 - S.camY) * S.zoom;      // where the counters begin
  const lowest = Math.max(GAP, S.H - strip);
  const highest = S.H - h - GAP;
  const bottom = Math.round(highest < lowest ? highest      // a window too short for both
                                             : Math.max(lowest, Math.min(stands, highest)));

  // Moved by its *bottom* edge: the height changes the instant a board swaps
  // pages, mid-glide, and a sheet moved by its top corner hangs its bottom
  // through the station for the slide. Off the bottom, a taller board grows
  // upward into the sky, where a menu has room.
  if (x === putX && bottom === putY) return;    // it has not moved: leave the layer alone
  putX = x;
  putY = bottom;
  el.style.transform = `translate3d(${x}px, ${-bottom}px, 0)`;
  // The crew list grows upward from the board's bottom edge, so its room is
  // whatever is between that edge and the top of the window.
  crewListEl.style.maxHeight = `min(46vh, ${S.H - bottom - GAP}px)`;
}

const GAP = 4;                             // never flush against the edge
const FLY_GAP = 8;                         // the panel's gap, between the board and the list beside it

// --- the sheet from the bottom ------------------------------------------------------
// On a phone a board is a sheet (sheet.js; DESIGN.md, "Boards as bottom
// sheets"): the panel through the one seat every sheet on the phone shares.
// What is the board's own here: its name beside the grip, the crew list as a
// page inside it rather than a card beside it, and the measuring the popover
// wants back when the pointer stops being a thumb.
const handleEl = document.getElementById('handle');
const handleName = handleEl.querySelector('.name');
const listBackEl = document.getElementById('listback');
const sheetList = () => (S.crewListOpen ? crewListEl : panelEl.querySelector(':scope > .sheet:not(.flyout)'));
const seat = sheetSeat(panelEl, {
  handle: handleEl,
  list: sheetList,
  open: () => panelEl.classList.contains('open'),
  dismiss: () => showPanel(null, true),
  // the popover's inline seat and the pinned width are not the sheet's
  enter: () => { putX = putY = null; remeasure(); },
});

function placeSheet() {
  seat.place();
  // The name beside the grip, and the crew list as a page: the board's own
  // title is hidden by the stylesheet in favor of this one.
  const name = at ? pages[at]?.querySelector('.title')?.dataset.name || pages[at]?.querySelector('.title')?.textContent : '';
  if (name && handleName.textContent !== name) handleName.textContent = name;
  const listing = !!S.crewListOpen;
  if (panelEl.classList.contains('listing') !== listing) {
    panelEl.classList.toggle('listing', listing);
    listBackEl.hidden = !listing;
  }
}

// Back to the popover: the switch on the sheet was turned off under an open
// board. The seat takes back what it wrote and the popover measures and
// seats itself afresh.
function leaveSheet() {
  seat.leave();
  panelEl.classList.remove('listing');
  putX = putY = null;
  remeasure();
}

const sheetRect = () => seat.rect();
listBackEl.addEventListener('click', () => showCrewList(false));

// For the checks: which stop the sheet stands at, how tall that is, and
// the rail's reading.
export const sheetStop = () => seat.stop();
export const sheetRail = () => seat.rail();

// --- the call to build the bench ----------------------------------------------
// The one button on this page that is not on a board; it stands over the bare
// patch the bench will go on until it is pressed (raise.js). Seated with the
// same arithmetic as `place`.
const raiseEl = document.getElementById('raise');
raiseEl.addEventListener('click', raiseBench);

// Measured when it appears and not again: its words change only for the arrow.
let callSize = { w: 0, h: 0 };
const CALL_TEXT = raiseEl.textContent;
let callAt = { x: null, y: null };

// Hidden while a board is up (its z-index assumes that never overlaps) and
// while a cutscene has the yard. When the bench's ground is off the window
// (a narrow window opens on the rock) it stays at the edge nearest the bench
// and says which way; pressing it turns the view there too (`raiseBench`).
export function seatCall() {
  if (!callOut() || !panelEl.hidden || cutsceneRunning()) {
    if (!raiseEl.hidden) { raiseEl.hidden = true; callAt = { x: null, y: null }; }
    return;
  }
  if (raiseEl.hidden) {
    raiseEl.hidden = false;
    callSize = { w: raiseEl.offsetWidth, h: raiseEl.offsetHeight };
  }
  const left = (bench.x - S.camX) * S.zoom, right = (bench.x + bench.w - S.camX) * S.zoom;
  const side = right <= GAP ? '◀ ' : left >= S.W - GAP ? '' : null;
  const say = side === null ? CALL_TEXT : side === '' ? `${CALL_TEXT} ▶` : `${side}${CALL_TEXT}`;
  if (raiseEl.textContent !== say) {
    raiseEl.textContent = say;
    callSize = { w: raiseEl.offsetWidth, h: raiseEl.offsetHeight };
  }
  // Centered on the bench and kept inside the window: the opening seat stands
  // the bench nearer the edge than half this is wide.
  const mid = bench.x + bench.w / 2;
  const want = (mid - S.camX) * S.zoom - callSize.w / 2;
  const x = Math.round(Math.max(GAP, Math.min(want, S.W - callSize.w - GAP)));
  // Its foot a couple of cells clear of the bench's top.
  const stands = S.H - (bench.y - S.camY) * S.zoom + P * 2;
  const bottom = Math.round(Math.max(GAP, Math.min(stands, S.H - callSize.h - GAP)));
  if (x === callAt.x && bottom === callAt.y) return;
  callAt = { x, y: bottom };
  raiseEl.style.transform = `translate3d(${x}px, ${-bottom}px, 0)`;
}

// --- the way over to it -------------------------------------------------------
// The board stands above the station that opened it, so reaching it means
// crossing bare canvas that is neither. While it is open the whole wedge
// between the station and the board counts as being on it: a wedge, not a box
// round the pair, so the menu still shuts when you step out sideways. The
// panel rectangle includes the crew list, so the wedge covers the submenu too.
// The grace is generous on purpose: a hand crossing to the names dips below the
// sheet and overshoots the gap, and a tight box shut the board mid-journey.
const SAFE_SLACK = 34;

// Where the board is on screen. `putY` is the bottom edge's height above the
// window's foot; readers want the top corner, so it is turned back here.
const panelRect = () => {
  if (panelEl.classList.contains('bottom')) return sheetRect();
  if (putX === null) return null;
  // The crew list is out of the panel's flow, so it is counted in by hand, gap
  // and all, or the strip between the board and the names would be outside the
  // menu. On the left (`port`) it pushes the left edge out instead.
  const list = crewListEl.hidden ? 0 : crewListEl.offsetWidth + FLY_GAP;
  const w = (panelEl.offsetWidth || full.w) + list;
  const h = Math.max(panelEl.offsetHeight || full.h, crewListEl.hidden ? 0 : crewListEl.offsetHeight);
  const x = putX - (crewListEl.classList.contains('port') ? list : 0);
  return { x, y: S.H - putY - h, w, h };
};

// The same rectangle for whatever is painted underneath it: the counter over
// the pit asks this and steps aside. Null while nothing is open.
export const openBoardRect = () => (panelEl.hidden ? null : panelRect());

// where the station is: the ground under the middle of it
function apexAt(which) {
  const r = anchor(which);
  if (!r) return null;
  return { x: (r.x + r.w / 2 - S.camX) * S.zoom, y: (r.y + r.h - S.camY) * S.zoom };
}

const side = (a, b, px, py) => (b.x - a.x) * (py - a.y) - (b.y - a.y) * (px - a.x);

// The wedge is the convex hull of the board and the station, whichever way
// round they lie: on a short window a tall sheet is clamped against the top
// and the station is behind it, so "the two bottom corners" is wrong there.
function hullOf(pts) {
  const ps = pts.slice().sort((u, v) => u.x - v.x || u.y - v.y);
  const half = list => {
    const h = [];
    for (const p of list) {
      while (h.length >= 2 && side(h[h.length - 2], h[h.length - 1], p.x, p.y) <= 0) h.pop();
      h.push(p);
    }
    return h;
  };
  const lower = half(ps), upper = half(ps.slice().reverse());
  return lower.slice(0, -1).concat(upper.slice(0, -1));
}

const inHull = (h, px, py) => {
  let neg = false, pos = false;
  for (let i = 0; i < h.length; i++) {
    const d = side(h[i], h[(i + 1) % h.length], px, py);
    if (d < 0) neg = true;
    if (d > 0) pos = true;
  }
  return !(neg && pos);
};

// is (px, py) on the menu itself? No slack: the rectangle the sheets are drawn
// on, not the way to it.
export function onMenu(px, py) {
  if (!at) return false;
  const r = panelRect();
  return !!r && px >= r.x && px <= r.x + r.w && py >= r.y && py <= r.y + r.h;
}

// is (px, py) on the board, or on the way to it from the station it belongs to?
export function inSafeZone(px, py) {
  if (!at) return false;
  const r = panelRect();
  const a = apexAt(at);
  if (!r || !a) return false;
  // A station scrolled off the window is not somewhere you are walking from:
  // the wedge to it would hold the menu open over half the yard.
  if (a.x < -SAFE_SLACK || a.x > S.W + SAFE_SLACK ||
      a.y < -SAFE_SLACK || a.y > S.H + SAFE_SLACK) {
    return px >= r.x - SAFE_SLACK && px <= r.x + r.w + SAFE_SLACK &&
           py >= r.y - SAFE_SLACK && py <= r.y + r.h + SAFE_SLACK;
  }
  const g = SAFE_SLACK;
  return inHull(hullOf([
    a,
    { x: r.x - g, y: r.y - g }, { x: r.x + r.w + g, y: r.y - g },
    { x: r.x - g, y: r.y + r.h + g }, { x: r.x + r.w + g, y: r.y + r.h + g }
  ]), px, py);
}

// The crew list may not outlive the house's board. Said every frame as a fact
// rather than as a duty of every path that puts a board away, because a path
// that forgets leaves the list hanging with nothing that will ever take it
// down.
export function tidyBoards() {
  if (at !== 'house' && S.crewListOpen) showCrewList(false);
}

// Which board is up, by name, or null: the pan's rule and the sheet ask.
export const openBoard = () => at;

export function placeBoard() {
  if (!at) return;
  place(panelEl, anchor(at));
}

// Two readings for the checks. Plain exports rather than `window.__` handles:
// the node checks load this file too, where `import.meta.env` means nothing.
// console.js hangs them on `window` behind the dev gate.

// seat the board wherever it belongs, open or not
export const seatBoard = () => place(panelEl, anchor(at) || bench);

// the size the board is seated by against the size it actually is; they have
// to agree
export const boardFit = () => ({ w: sized.w, h: sized.h,
                                 realW: panelEl.offsetWidth, realH: panelEl.offsetHeight });

// The one bit of writing in the yard: words are cheap in a tooltip because it
// is not on screen until asked for.
const tipEl = document.getElementById('tip');
let tipFor = null;
// Where the view was when the tip was seated. A tip is seated in screen space
// once, off a pointer event, and the view can move under it without the
// pointer moving (arrow keys, the opening's camera, a glide). A tip whose view
// has moved is taken down; the next pointer move seats a fresh one.
let tipCam = null;
export function tipFollowsView() {
  if (tipFor === null || !tipCam) return;
  if (tipCam[0] !== S.camX || tipCam[1] !== S.camY || tipCam[2] !== S.zoom) showTipAt(null);
}

export function showTip(text, at) {
  if (!text) return showTipAt(null);
  showTipAt(text, (at.x - S.camX) * S.zoom, (at.y - S.camY) * S.zoom + P * 4, true);
}

// The same tip, seated in screen space for things on the page. `over` lets the
// note stand on the board: a shelf tile's note sits beside its tile, over the
// neighboring tiles, where standing clear of the whole board would put it on
// the far side of the sheet from the tile.
export function showTipAt(text, sx, sy, centred, over = false) {
  if (!text) {
    if (tipFor !== null) { tipEl.hidden = true; tipFor = null; }
    return;
  }
  if (text !== tipFor) { tipEl.textContent = text; tipEl.hidden = false; tipFor = text; }
  tipCam = [S.camX, S.camY, S.zoom];
  const w = tipEl.offsetWidth, h = tipEl.offsetHeight;
  let x = centred ? sx - w / 2 : sx;

  // A row's note stands clear of the whole board on the right, or on the left
  // when there is no room; clamped back inside the glass it would slide under
  // the board, where it is invisible. Only when it would actually land on the
  // sheet: tested on x alone, a yard label anywhere in the board's column was
  // flung to the far side of the window.
  if (!centred) {
    const r = panelRect();
    if (!over && r && !panelEl.hidden && x < r.x + r.w && x + w > r.x && sy < r.y + r.h && sy + h > r.y) {
      const right = r.x + r.w + 8;
      x = right + w <= S.W - GAP ? right
        : r.x - w - 8 >= GAP ? r.x - w - 8       // no room that side: stand on the other
        : x;                                     // nor that one: clamped below
    }
  }
  tipEl.style.left = `${Math.round(Math.max(GAP, Math.min(x, S.W - w - GAP)))}px`;
  tipEl.style.top = `${Math.round(Math.max(GAP, Math.min(sy, S.H - h - GAP)))}px`;
}

// One menu for every station: it fades up where you are and walks with you.
// The slide class is on only while it is moving between stations; the menu is
// re-seated every frame, and a standing transition would lag every scroll.
let at = null;
let slide = 0;
let closing = 0;
// The pointer has left a station but the board has not been given up on yet:
// leaving is decided a moment later, so crossing bare ground to the next
// station is one slide rather than a fade, a jump and a fade.
let leaving = 0;
const LINGER = 130;                    // and how long the moment is


// --- the sheet that opens off the house board ---------------------------------
// The one submenu. It is a second sheet *inside* the panel, so it walks and
// fades with the board and is part of every answer to "is the pointer on the
// menu" without a second rule anywhere.
// A row that leads nowhere asks the list to go, and it goes a moment later
// unless the pointer has left the row again (`keepSubmenu`, off the row's
// pointerleave and the list's own pointerenter): the row next to the door is
// between the door and the list, and a close that fired on the crossing made
// the list impossible to reach.
let folding = 0;
export function closeSubmenu() {
  if (folding || !S.crewListOpen) return;
  folding = setTimeout(() => { folding = 0; showCrewList(false); }, SUBMENU_GRACE_MS);
}
export function keepSubmenu() { clearTimeout(folding); folding = 0; }
crewListEl.addEventListener('pointerenter', keepSubmenu);

export function showCrewList(on) {
  // Only ever out beside the house.
  const want = !!on && at === 'house';
  // Judged against the sheet as well as the flag: a new game blanks the flag
  // before it puts the board away, and a check on the flag alone left the list
  // standing into the next run.
  keepSubmenu();
  if (want === S.crewListOpen && crewListEl.hidden === !want) return;
  S.crewListOpen = want;
  crewListEl.hidden = !want;
  // Filled before it is measured: an empty sheet measures narrower than it
  // will be.
  if (want) { buildCrewList(); refresh(crewListRowsEl, crewList(), null); }
  remeasure();
  placeBoard();
}


// `now` is for a close that was *asked for* rather than wandered out of: a tap
// on bare ground, a new game, the floor opening. Those are answers, and an
// answer that takes a tenth of a second to arrive reads as a control that did
// not take. Only the pointer drifting off a station gets the benefit of LINGER.
export function showPanel(want, now = false) {
  // A key that is not a station (the lab that was), or a station with no
  // board (the casino, whose decisions are levers on the building), is
  // nowhere to hang a board: it is asked for as nothing.
  if (want && !station(want)?.board) want = null;
  // Back where it was, before it had gone anywhere: nothing happened.
  if (want === at) { clearTimeout(leaving); leaving = 0; return; }

  // An option list hangs off the body, not the board (`showOpts`), so it goes
  // the moment the board is asked to leave, not when the linger settles.
  if (!want) shutOpts();

  // Off to bare ground: hold the board for LINGER rather than closing on the
  // spot.
  if (!want && !now) {
    if (leaving) return;
    leaving = setTimeout(() => { leaving = 0; settle(null); }, LINGER);
    return;
  }
  clearTimeout(leaving);
  leaving = 0;
  settle(want);
}

// What actually moves the board, once it is settled where it is going.
function settle(want) {
  if (want === at) return;
  shutOpts();                  // and a board swapped for another takes its lists with it
  // Before `at` moves, so the list is put away while it still belongs to the
  // board it is standing beside.
  if (want !== 'house') showCrewList(false);
  const wasAt = at;
  at = want;
  // Each station's own flag, for the save and the checks that read one.
  for (const r of ROWS) if (r.board) S[r.board] = want === r.key;

  if (!want) {                                   // fade out where it stands
    // Closing does not mark rows seen; a row is cleared by being hovered
    // (the listeners in shop.js's `build`).
    panelEl.classList.remove('open');
    clearTimeout(closing);
    // The sheet goes down over SHEET_MS; the popover fades over its own beat.
    if (panelEl.classList.contains('bottom')) placeSheet();
    closing = setTimeout(() => {
      if (at) return;                            // opened again on the way out
      panelEl.hidden = true;
      for (const k of Object.keys(pages)) pages[k].hidden = true;
    }, panelEl.classList.contains('bottom') ? SHEET_MS : 140);
    return;
  }

  clearTimeout(closing);
  for (const k of Object.keys(pages)) pages[k].hidden = k !== want;
  // opening the bench reads every heading on it
  if (want === 'bench') markSectionsSeen();
  panelEl.hidden = false;
  // Fill it before measuring it: measured with every row still blank, a board
  // is seated short for as long as it stays open.
  fill(want);
  sayHideDone();          // and the switch under it, before anything is measured
  fillPurse();
  remeasure();

  // Walking from one station to another slides; arriving after the last board
  // has faded out does not, or an invisible sheet travels the yard and fades
  // up somewhere along the way. `open` is the class the fade hangs off, so it
  // is exactly "can this be seen"; `hidden` is set only when the fade is done.
  const showing = !panelEl.hidden && panelEl.classList.contains('open');
  if (showing) {
    panelEl.classList.add('sliding');
    clearTimeout(slide);
    // a shade longer than the slide itself, so the class is never taken off
    // mid-glide
    slide = setTimeout(() => panelEl.classList.remove('sliding'), 340);
  } else {
    // no transition left over from the last move, or the placing below is a
    // glide from wherever it happened to be standing
    clearTimeout(slide);
    panelEl.classList.remove('sliding');
  }
  place(panelEl, anchor(want));
  requestAnimationFrame(() => panelEl.classList.add('open'));
}


// The dust count as the card shows it, kept on `S` for the report.
export function tweenCount(at) {
  S.shownStored = shown('dust', S.stored, at);
}

// how many bodies a section has, so a heading can say so
const headcount = title =>
  title === 'the crew' ? S.crew :
  title === 'the rock' ? S.rockhands :
  title === 'the quarry' ? S.quarriers :
  title === 'the farm' ? S.farmhands : 0;

const apothHeads = title => title === 'the pot' ? S.stirrers : 0;

const groundHeads = title =>
  title === JOB.QUARRY ? S[JOB.QUARRY] :
  title === JOB.FARM ? S[JOB.FARM] : 0;

// The numbers on whichever board is open. Out of `hud` so that opening a board
// can fill it before it is measured.
function fill(which) {
  // The rows first, then the words in them: a work landing on its own has
  // nobody to rebuild the board for it, so the open board asks every frame.
  buildBoard(which);
  // a station's board being open is what reads its news
  markDoneSeen(which);
  if (which === 'bench') refresh(shopEl, UPGRADES, headcount);
  if (which === 'scrub') refresh(scrubShopEl, SCRUB_UPGRADES, null);
  if (which === 'quarry') refresh(quarryShopEl, listFor('quarry'), groundHeads);
  if (which === 'farm') refresh(farmShopEl, listFor('farm'), groundHeads);
  if (which === 'apothecary') refresh(apothShopEl, APOTHECARY_UPGRADES, apothHeads);
  if (which === 'tower') refresh(towerShopEl, TOWER_UPGRADES, null);
  if (which === 'stats') refresh(statsShopEl, STATS_UPGRADES, null);
  if (which === 'outhouse') refresh(looShopEl, OUTHOUSE_UPGRADES, null);
  if (which === 'shack') refresh(shackShopEl, shackRows(), null);
  // rebuilt as well as refreshed: the crew is a list that changes length
  if (which === 'house') {
    buildCrew();
    refresh(crewShopEl, crewRows(), null);
    // and the list beside it while it is out: where a body stands moves on
    // its own
    if (S.crewListOpen) { buildCrewList(); refresh(crewListRowsEl, crewList(), null); }
  }
}

// What you have to spend, beside the board asking for it. A currency appears
// the first time you have seen one: nothing here names a thing you have not
// met.
const PURSE = [
  ['dust', () => true, () => S.stored],
  ['core', () => S.seenCore, () => S.cores],
  ['shard', () => S.seenShard, () => S.shards],
  ['spore', () => S.seenSpore, () => S.spores],
  ['spark', () => S.seenSpark, () => S.sparks]
];

// Written only when it changes: this runs every frame a board is open, and
// `innerHTML` is a parse.
let purseWas = null;
function fillPurse() {
  let html = '';
  for (const [mark, seen, count] of PURSE) {
    if (!seen()) continue;
    html += `<div class="coin"><i class="${mark}"></i><b>${fmt(shown('purse:' + mark, count()))}</b></div>`;
  }
  if (html === purseWas) return;
  // A row appearing or going resizes the panel; a digit does not, since the
  // count sits in a slot of its own width.
  const resized = purseWas === null || purseWas.length !== html.length;
  purseWas = html;
  purseEl.innerHTML = html;
  if (resized) remeasure();
}

// The switch that folds finished ladders away. It lives under the pages rather
// than on one of them because it is about whichever board is open, and it
// stands on every board: a control that came and went would appear under the
// cursor the moment the last rung was bought.
const hideEl = document.getElementById('hidedone');

// Written only when it changes; `hud` asks every frame.
let said = null;
export function sayHideDone() {
  if (S.hideDone === said) return;
  said = S.hideDone;
  // A verb, what pressing does, not a state.
  hideEl.textContent = S.hideDone ? 'show finished' : 'hide finished';
  hideEl.classList.toggle('on', S.hideDone);
}

hideEl.addEventListener('click', () => {
  S.hideDone = !S.hideDone;
  // Every board, not the open one: a board that only rebuilt when you walked
  // up would fold its rows away under your eyes on arrival.
  buildShop();
  sayHideDone();
});

// A hand in progress hushes the board wherever it is standing. It is not closed
// -- nothing has been decided, and it is the same board when it comes back --
// it is out of the way of the one thing in this game you are meant to watch.
//
// From the chip going down, not from the floor opening: the pot pouring into
// the hopper is the front half of the same gesture, and a board that stayed up
// through it would be a board offering rows for a bet already made. It comes
// back when the tray is standing.
let hushed = false;
function hush() {
  const want = busy();
  if (want === hushed) return;
  hushed = want;
  panelEl.classList.toggle('hushed', want);
}

export function hud() {
  hush();
  tipFollowsView();
  tweenCount(now());
  fillPurse();
  fill(at);
  // read from state every frame: a save restored after load would otherwise
  // leave the button out of step with the board
  sayHideDone();
  // After `fill`, so there is a whole board to measure.
  if (boardMoved()) remeasure();
  // Words alone may not move the board unless they genuinely widened it: the
  // board is measured, and when the width comes back the same the old seat
  // stands, height nudges and all.
  else if (boardReworded()) {
    const was = sized;
    remeasure(false);                      // words do not get to set the width
    if (sized.w === was.w) sized = was;
  }
  // Seated every frame: a board is empty when it opens, and one that grew a
  // row after seating could hang off the top of a short window.
  placeBoard();
  seatCall();
}

