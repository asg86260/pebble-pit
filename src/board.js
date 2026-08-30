// The workbench board: where it sits on screen, when it opens, and the counter
// above the pit that chases the number.

import { P } from './config.js';
import { S, bench, lab, school, casino, scrub, quarry, farm, tower } from './state.js';
import { crewRows, crewList, houseRect } from './crewboard.js';
import { UPGRADES, markSectionsSeen, canPay, maxed } from './upgrades.js';
import { LAB_UPGRADES, markLabSeen } from './lab.js';
import { SCHOOL_UPGRADES, kitCount } from './school.js';
import { CASINO_UPGRADES, spinning } from './casino.js';
import { SCRUB_UPGRADES } from './scrubhouse.js';
import { QUARRY_UPGRADES } from './quarry.js';
import { FARM_UPGRADES } from './farm.js';
import { TOWER_UPGRADES } from './tower.js';
import { refresh, markRowsSeen, buildCrew, buildCrewList, tookRows } from './shop.js';
import { now } from './clock.js';

const shopEl = document.getElementById('shop');
const labShopEl = document.getElementById('labshop');
const schoolShopEl = document.getElementById('schoolshop');
const casinoShopEl = document.getElementById('casinoshop');
const crewShopEl = document.getElementById('crewshop');
const crewListEl = document.getElementById('crewlist');
const crewListRowsEl = document.getElementById('crewlistrows');
const scrubShopEl = document.getElementById('scrubshop');
const quarryShopEl = document.getElementById('quarryshop');
const farmShopEl = document.getElementById('farmshop');
const towerShopEl = document.getElementById('towershop');
const panelEl = document.getElementById('panel');
const purseEl = document.getElementById('purse');
const pages = { bench: document.getElementById('board'), lab: document.getElementById('lab'),
                school: document.getElementById('school'), casino: document.getElementById('casino'),
                house: document.getElementById('house'),
                scrub: document.getElementById('scrub'),
                quarry: document.getElementById('quarryboard'),
                farm: document.getElementById('farmboard'),
                tower: document.getElementById('towerboard') };
// The house is the only stand that is not a fixed rectangle: it grows a room per
// body, so where you have to be standing to read the list of who lives there
// depends on how many of them there are.
// The quarry is a hole, so what you stand at is its mouth rather than the whole
// shaft: a rectangle that reaches to the floor of it would put the board
// underground, and deeper every time you bought a bench. The plots are flat and
// need no such care.
const quarryMouth = { get x() { return quarry.x; }, get y() { return quarry.y; },
                      get w() { return quarry.w; }, get h() { return 0; } };
const anchor = which => standAt[which];

const standAt = { bench, lab, school, casino, scrub, farm, tower,
                  quarry: quarryMouth,
                  get house() { return houseRect(); } };
// Asked for when it is wanted, not gathered at load time. The quarry and the plots
// are drawn by files this one already reads, so the imports come round in a ring
// -- and a table built while the ring is still closing gets whichever of them
// had not been reached yet as `undefined`. Reading it inside a function is the
// same trick airboard.js hands its row out with.
const listFor = which =>
  which === 'bench' ? UPGRADES :
  which === 'lab' ? LAB_UPGRADES :
  which === 'school' ? SCHOOL_UPGRADES :
  which === 'casino' ? CASINO_UPGRADES :
  which === 'scrub' ? SCRUB_UPGRADES :
  which === 'quarry' ? QUARRY_UPGRADES :
  which === 'farm' ? FARM_UPGRADES :
  which === 'tower' ? TOWER_UPGRADES :
  which === 'house' ? crewRows() : [];

// Every station that has a board. One list, so that a thing which is true of all
// of them -- the mark under the foot of it, for one -- is written once, and the
// next station gets it by being added here.
export const STATIONS = ['bench', 'lab', 'school', 'casino', 'scrub', 'quarry',
                         'farm', 'tower', 'house'];

// whether a station is there at all yet
const standing = which =>
  which === 'bench' ? S.seenBench :
  which === 'lab' ? S.labOpen :
  which === 'school' ? S.schoolOpen :
  which === 'casino' ? S.casinoOpen :
  which === 'scrub' ? S.scrubOpen :
  which === 'quarry' ? S.quarryOpen :
  which === 'farm' ? S.farmOpen :
  which === 'tower' ? S.towerOpen :
  which === 'house' ? S.crew > 0 : false;

// Where a station's mark goes: the middle of it, on the ground. The quarry is the
// exception in the one way it always is -- it is a hole, so the middle of it is
// thin air and the mark would hang over nothing. Its mark stands at the near
// lip, which is the end you walk up to.
// The ground a station stands on, for the checks: where you have to be to open
// its board is the game's business, not arithmetic written out again in a check.
export function standRect(which) {
  if (!standing(which)) return null;
  const r = standAt[which];
  return r && { x: r.x, y: r.y, w: r.w, h: r.h };
}

export function stationFoot(which) {
  if (!standing(which)) return null;
  const r = standAt[which];
  if (!r) return null;
  return which === 'quarry' ? r.x : r.x + r.w / 2;
}

// Whether a station has anything for you.
//
// One mark and one question: is there something on that board worth the walk.
// It was two for a while -- a flag for a heading you had never read, a dot for
// something you could afford -- and two marks is a thing to learn before the
// yard can be read at a glance, for a difference that changes nothing about
// what you do next. You go and look either way.
export function hasOffer(which) {
  if (!standing(which)) return false;      // a place that is not there offers nothing
  // Something you could buy this second, and nothing else. A row you have not
  // seen before used to count too, which sounds right and is not: a yard you
  // have just started has never seen any row, so every station would stand
  // there pointing at itself from the first frame, and a mark that is always up
  // is a mark nobody reads. This one goes up when there is something to do
  // about it and comes down when you have done it.
  //
  // A row that moves bodies about spends nothing, and a ladder at the top of
  // itself cannot be bought however much you are holding: neither is something
  // you would cross the yard for.
  return listFor(which).some(u => u.show && u.show() && !u.job && !u.dial &&
                                  !u.price && !maxed(u) && !u.dead?.() && canPay(u));
}

// near enough to a thing on the ground to be interested in it
const near = (r, x, y) => x > r.x - P * 8 && x < r.x + r.w + P * 8 &&
                          y > r.y - P * 8 && y < r.y + r.h + P * 4;

export const nearBench = (x, y) => S.seenBench && near(bench, x, y);
export const nearLab = (x, y) => S.labOpen && near(lab, x, y);
export const nearSchool = (x, y) => S.schoolOpen && near(school, x, y);
export const nearCasino = (x, y) => S.casinoOpen && near(casino, x, y);
export const nearScrub = (x, y) => S.scrubOpen && near(scrub, x, y);
// The quarry is the hole, and only the hole.
//
// A bridge crosses it -- a ramp up, a deck straight over the mouth, a ramp down
// -- and the crew walk every foot of that. Aiming at the mouth meant aiming at
// the deck, which is a thing you cross on the way to somewhere else: walking a
// hauler over the quarry opened the quarry's board every time. So what you point at is
// the ground that is missing. Below the line and between the walls, padded a
// cell sideways and no further, because a cell further either way is the ramp.
const hole = () => ({ x: quarry.x, y: S.groundY, w: quarry.w, h: quarry.h });
export const nearQuarry = (x, y) => {
  if (!S.quarryOpen) return false;
  const r = hole();
  return x > r.x - P && x < r.x + r.w + P && y > r.y && y < r.y + r.h + P * 2;
};
export const nearFarm = (x, y) => S.farmOpen && near(farm, x, y);
export const nearTower = (x, y) => S.towerOpen && near(tower, x, y);
// And the house, once anybody lives in it -- with a tight right edge rather than
// the usual eight cells.
//
// Every other station is a small thing with bare ground either side of it, so it
// can afford to claim eight cells all round. The house is a wall of rooms, and
// the gap between its right side and the bench is eight cells exactly: padded
// like the rest it claimed the whole of that gap, including the ground the
// cursor crosses on its way down to the corner of the bench's own board. Two
// cells is still comfortably more than nothing, and it leaves the strip between
// the two of them belonging to neither -- which is what the safe wedge needs.
const HOUSE_PAD_IN = P * 2;
export const nearHouse = (x, y) => {
  if (S.crew < 1) return false;
  const r = houseRect();
  // A band at the door rather than the whole face of the block. The block is the
  // one thing here that grows: by twenty rooms it is taller than the rock, and a
  // region drawn round the whole of it reaches up into the air the boards hang
  // in -- so walking down to the far corner of the bench's board crossed the
  // roof of the house and the house took the menu. You stand at a door to go in
  // somewhere. That is all this needs to be.
  const top = Math.max(r.y, S.groundY - P * 10);
  return x > r.x - P * 8 && x < r.x + r.w + HOUSE_PAD_IN &&
         y > top && y < S.groundY + P * 4;
};

// The board stands on the bench, but it is a real element on a real screen: on a
// phone the bench can be near an edge, or there can be less room above it than
// the board is tall. So it is put where the bench is and then pushed back inside
// the window rather than being allowed to hang off it.
// Moved with a transform rather than with `left` and `bottom`. Those are layout:
// animating them makes the browser lay the page out again every frame of the
// slide, which is exactly what a menu sliding along in steps looks like. A
// transform is handed to the compositor and moves smoothly.
// Measured when it opens, when it changes page and when the window changes --
// not every frame. Reading `offsetWidth` forces the browser to lay the page out,
// and doing that sixty times a second for a menu whose size did not change is
// work for nothing.
let sized = { w: 0, h: 0 };
export function remeasure() {
  // A board nobody is looking at measures nothing: a hidden element is zero by
  // zero, and taking that as the size would seat the next open board off the
  // bottom corner of the window. Rows are rebuilt whether or not the panel is
  // up -- buying a core-priced row grows the lab's list while you are standing
  // at the bench -- so this has to be able to say no. Opening measures it
  // again, which is where a board that was rebuilt out of sight gets its size.
  if (panelEl.hidden) return;
  sized = { w: panelEl.offsetWidth, h: panelEl.offsetHeight };
}

// And it is only written when it actually moves. Assigning the same transform
// every frame invalidates the layer the menu is drawn on, sixty times a second,
// over a canvas that is also repainting -- which is a good way to make a menu
// flicker for no reason anybody can see in the code.
let putX = null, putY = null;

// Which side of the board the submenu stands on, and whether it stands beside it
// at all.
//
// The list is a flex sibling of the board, so by default it sits to the right of
// it and the two of them together are the panel. On a narrow window that panel
// is wider than the glass, and what a flex row does about that is *squash its
// children* -- which looked like the list rendering behind the board, or not
// opening. A menu is not a thing that gets narrower when the window does.
//
// So nothing shrinks (see the CSS), and the list is put wherever there is room
// for it: on the right by preference, on the left if the right-hand side would
// run off the glass and the left would not, and on a line of its own if neither
// will take it. Worked out from the widths the two sheets actually are, before
// the panel is placed, because where the panel *can* stand depends on how wide
// it has decided to be.
function seatFlyout(el, at) {
  if (crewListEl.hidden) {
    el.classList.remove('flip', 'stack');
    return;
  }
  const board = el.querySelector('.sheet:not(.flyout)');
  const purse = el.querySelector('.purse');
  const listW = crewListEl.offsetWidth;
  const restW = (board ? board.offsetWidth : 0) + (purse ? purse.offsetWidth : 0) + 16;
  const want = (at.x - S.camX) * S.zoom;

  // where the board itself would like to stand, ignoring the list
  const room = S.W - GAP * 2;
  el.classList.toggle('stack', listW + restW > room);
  // and on the left when the right-hand side has run out of window
  el.classList.toggle('flip',
    listW + restW <= room && want + restW + listW > S.W - GAP && want - listW > GAP);
}

function place(el, at) {
  const w = sized.w || el.offsetWidth, h = sized.h || el.offsetHeight;
  // Centred over the station, not hung off its left edge.
  //
  // For a building the two are nearly the same thing and nobody noticed. The
  // farm is not a building: it is a *row*, as wide as however many furrows you
  // have bought, so a board pinned to its left edge sat a long way off the end
  // of the plots and read as belonging to whatever was next along. Measuring
  // from the middle puts every board over the thing it is about, and the farm
  // stops being the odd one out.
  const mid = at.x + (at.w || 0) / 2;
  const want = (mid - S.camX) * S.zoom - w / 2;
  const x = Math.round(Math.max(GAP, Math.min(want, S.W - w - GAP)));

  const stands = S.H - (at.y - S.camY) * S.zoom + P * 3;

  // Clear of the rosters, which stand in their own strip under the ground line.
  //
  // A board is seated just above the station it belongs to, and then held inside
  // the window -- and a board taller than the room above its station is pushed
  // back down by that second rule. The quarry feels it first because it is the
  // one station whose stand-point is the ground line itself (the quarry is a hole,
  // so what you stand at is its mouth), so its board starts lowest and is the
  // first to land on the counters. The counters are how you put somebody on the
  // job the board is about, so covering them with it is the worst thing it could
  // land on.
  const strip = (S.groundY + P * 11 - S.camY) * S.zoom;      // where the counters begin
  const lowest = Math.max(GAP, S.H - strip);
  // The top clamp takes the board at its tallest. `sized` is what the sheet
  // measured when it was filled, and `offsetHeight` is what the browser is
  // actually laying out right now -- and they part company whenever the window
  // being reasoned about is not the window on the screen. Clamping on the
  // smaller of the two lets the taller reality poke out of the top.
  const highest = S.H - Math.max(h, el.offsetHeight) - GAP;
  const bottom = Math.round(highest < lowest ? highest      // a window too short for both
                                             : Math.max(lowest, Math.min(stands, highest)));

  // Moved by its *bottom* edge, not its top.
  //
  // A board is seated on the bottom edge -- that is what keeps it standing on
  // its station while the purse beside it grows a row. But it was being moved by
  // the top-left corner, with the top worked out from the height, and the height
  // is the one thing about a board that changes the instant you arrive: the
  // contents are swapped in one frame and the glide across takes a third of a
  // second. So a walk from the bench to the house -- two stations close enough
  // that the box barely travels -- put a taller sheet at the old top corner and
  // hung its bottom through the bench for the whole of the slide.
  //
  // Off the bottom, a taller board grows *upwards* into the empty sky, which is
  // where a menu has room, and the edge it stands on never moves at all.
  if (x === putX && bottom === putY) return;    // it has not moved: leave the layer alone
  putX = x;
  putY = bottom;
  el.style.transform = `translate3d(${x}px, ${-bottom}px, 0)`;
}

const GAP = 4;                             // never flush against the edge

// --- the way over to it -------------------------------------------------------
// The board opens because the cursor is standing at a station, and it stands
// *above* that station -- so getting to it means crossing a strip of bare canvas
// that is neither. Aim for a row in the far bottom corner of the sheet and the
// diagonal takes you out of the station's patch of ground before it takes you
// into the board, and the thing you were reaching for shuts in your face.
//
// The fix is the one every menu that has ever had a submenu uses: while it is
// open, the whole wedge between the station and the near edge of the board
// counts as being on it. Move anywhere inside that wedge and you are on your way
// there; step outside it and you have gone somewhere else.
//
// A wedge rather than a box round the pair: a box would hold the board open
// while the cursor was well off to one side, which is a menu that will not go
// away. The wedge is exactly the ground you would cross heading for it, and no
// more -- step out of it sideways and it shuts as it always did.
//
// And the submenu is covered by the same wedge without a word being said about
// it here. The board's rectangle below is the whole panel, and the house's list
// of people opens as a second sheet *inside* that panel -- so the moment it is
// out, the rectangle is wider by the width of it and the wedge reaches the far
// corner of the list, the gap between the two sheets included. Hovering the
// names, and walking across to them, is being on the board.
// And the grace either side of it, which is generous on purpose.
//
// Twelve pixels is what a rectangle needs and not what a hand needs. A pointer
// crossing from the board to the names beside it does not travel in a straight
// line -- it dips below the sheet, overshoots the gap, arcs round the corner --
// and every one of those is a frame or two spent a few pixels outside a box that
// is *right there on the screen*. Which shut the board, and took the list with
// it, while the cursor was plainly on its way into it.
//
// Nothing is lost by being generous here. The zone only holds the board open
// while it is already open; stepping properly away still shuts it, because
// properly away is further than this.
const SAFE_SLACK = 34;

// Where the board actually is on screen, from the numbers `place` already keeps.
// `putY` is how far its bottom edge stands above the foot of the window -- that
// is what the board is seated by, see `place` -- and everything that reads this
// wants the top corner, so it is turned back here rather than in four places.
const panelRect = () => {
  if (putX === null) return null;
  const h = sized.h || panelEl.offsetHeight;
  return { x: putX, y: S.H - putY - h, w: sized.w || panelEl.offsetWidth, h };
};

// and where the station it belongs to is: the ground under the middle of it
function apexAt(which) {
  const r = anchor(which);
  if (!r) return null;
  return { x: (r.x + r.w / 2 - S.camX) * S.zoom, y: (r.y + r.h - S.camY) * S.zoom };
}

const side = (a, b, px, py) => (b.x - a.x) * (py - a.y) - (b.y - a.y) * (px - a.x);

// The wedge is worked out rather than assumed. It would be easy to say the board
// stands above the station and take its two bottom corners -- and that is true
// on a roomy window and false on a short one, where a tall sheet is clamped
// against the top and the station is somewhere behind it. So: the shape is the
// board *and* the station and everything between them, which is the convex hull
// of the rectangle and the point, whichever way round they happen to lie. Five
// points is not a computation worth being clever about.
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

// is (px, py) on the board, or on the way to it from the station it belongs to?
export function inSafeZone(px, py) {
  if (!at) return false;
  const r = panelRect();
  const a = apexAt(at);
  if (!r || !a) return false;
  // A station scrolled off the side of the window is not somewhere you are
  // walking from. The board is clamped inside the window and the station is not,
  // so the wedge between them would stretch across the whole screen and hold the
  // menu open over half the yard. No station in sight, no journey to protect.
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

export function placeBoard() {
  if (!at) return;
  // the side the submenu stands on is a question about the window, so it is
  // asked again whenever the board is seated -- which includes the window
  // changing shape underneath it
  seatFlyout(panelEl, anchor(at));
  place(panelEl, anchor(at));
}

// Two readings for the checks. They are plain exports rather than `window.__`
// handles because this file is loaded by the node checks as well, where
// `import.meta.env` is a vite word that means nothing -- console.js hangs them
// on `window` behind the dev gate, and a build drops them, because with
// console.js gone nothing imports either one.

// seat both boards wherever they belong, open or not, so a check can look at
// where they would go without going through the whole opening dance
export const seatBoard = () => place(panelEl, anchor(at) || bench);

// the size the board is seated by against the size it actually is. They have to
// agree, or the sheet is standing where a board of some other height would
// stand -- which is what buying a row out from under it used to do.
export const boardFit = () => ({ w: sized.w, h: sized.h,
                                 realW: panelEl.offsetWidth, realH: panelEl.offsetHeight });

// The one bit of writing in the yard. Everything else here is a mark you learn,
// but a station that has stopped needs to say why in words the first time, and a
// tooltip is the only place words are cheap: it is not on screen until asked for.
const tipEl = document.getElementById('tip');
let tipFor = null;

export function showTip(text, at) {
  if (!text) return showTipAt(null);
  showTipAt(text, (at.x - S.camX) * S.zoom, (at.y - S.camY) * S.zoom + P * 4, true);
}

// The same words, put where a thing on the *page* is rather than where a thing
// in the yard is. A row on a board is not at a world position and never will be,
// and the alternative was a second tooltip that looked the same and was not.
export function showTipAt(text, sx, sy, centred) {
  if (!text) {
    if (tipFor !== null) { tipEl.hidden = true; tipFor = null; }
    return;
  }
  if (text !== tipFor) { tipEl.textContent = text; tipEl.hidden = false; tipFor = text; }
  const w = tipEl.offsetWidth, h = tipEl.offsetHeight;
  let x = centred ? sx - w / 2 : sx;

  // Off the other side of the row when there is no room on this one.
  //
  // A row's note is put to the right of it. On a narrow window there is often
  // nothing there, and clamping it back inside the glass slid it *under the
  // board* -- where, being a lower layer than the menu, it was not merely in the
  // way but invisible. A note nobody can read is worse than no note: the row
  // looks like it has something to say and says nothing.
  //
  // So a note that will not fit on the right goes to the left of the thing it
  // belongs to, which is what every menu in the world does with a submenu that
  // has run out of screen. `sx` is the right-hand edge of the row it came from,
  // so the left-hand side is that edge less the row's own width -- which is not
  // known here, so the panel's left edge is used: the note stands off the whole
  // board rather than off the row, and on that side that is the honest anchor.
  if (!centred) {
    const r = panelRect();
    // A note about a row stands clear of the whole board, not just clear of the
    // row. Anchored on the row's own right edge it lands *inside* the sheet --
    // over the rows below it -- because the row ends where the board does.
    if (r && !panelEl.hidden && x < r.x + r.w) {
      const right = r.x + r.w + 8;
      x = right + w <= S.W - GAP ? right
        : r.x - w - 8 >= GAP ? r.x - w - 8       // no room that side: stand on the other
        : x;                                     // nor that one: clamped below
    }
  }
  tipEl.style.left = `${Math.round(Math.max(GAP, Math.min(x, S.W - w - GAP)))}px`;
  tipEl.style.top = `${Math.round(Math.max(GAP, Math.min(sy, S.H - h - GAP)))}px`;
}

// One menu for both stations. It is a thing standing in the yard rather than two
// things blinking on and off: it fades up where you are, and when you walk from
// the bench to the lab it walks with you.
//
// The slide is only switched on while it is actually moving between stations.
// The menu is re-seated every frame -- it has to be, or scrolling would leave it
// behind -- and a transition on `left` would turn every one of those into a
// two-hundred-millisecond lag behind the yard.
let at = null;
let slide = 0;
let closing = 0;
// The pointer has left a station but the board has not been given up on yet.
//
// Two stations with bare ground between them is the ordinary case -- there are
// nine of them along one yard -- and crossing that ground used to take the board
// off you and give it back: the sheet faded out where it stood, the box jumped
// to the new station without a transition (the slide only runs when the board
// knows where it came *from*, and by then it had forgotten), and the new sheet
// faded in. Three separate animations to walk two paces.
//
// So leaving is not decided in the frame it happens. The board holds its place
// for a moment; arrive somewhere else inside that moment and it is a move, which
// slides, and walking back to where you were is not even that.
let leaving = 0;
const LINGER = 130;                    // and how long the moment is

// Shut whatever is open. Called when a press on a row has done its work: see
// shop.js. It goes through the same path a walk away goes through, so the fade
// and the seating are the ones the board already has.
export const closeBoard = () => showPanel(null, true);

// --- the sheet that opens off the house board ---------------------------------
// The one submenu in the game. It stands beside the board it belongs to, inside
// the same panel, which is the whole trick: the panel is what carries the
// transform that seats the menu on the ground, it is what the wedge below is
// measured from, and it is what the cursor has to leave for anything to close.
// So a second sheet put inside it walks with the board, fades with the board,
// and is already part of every answer to "is the pointer still on the menu" --
// there is no second rule anywhere for the submenu, because to everything that
// asks, the submenu *is* the menu.
//
// The alternative was a floating element of its own, positioned against the
// board's rectangle every frame. That is two things pretending to be one: it
// would need its own hover handling to stop the board closing under it, its own
// copy of the seating, and it would have got them subtly wrong on the day a
// short window clamped the board and not it.
// Whatever a row had opened beside the board, put away. Rows that lead somewhere
// open it by being hovered (see `over` in shop.js), and a row that leads nowhere
// used to leave the last one standing: you hovered the crew, walked down to the
// row below, and the names stayed out beside a board that was no longer about
// them. Hovering anything is an answer to "which row am I reading", and only one
// row can be the answer.
export const closeSubmenu = () => showCrewList(false);

export function showCrewList(on) {
  // Only ever out beside the house. Asked for while any other board is up -- or
  // none -- the answer is no rather than a sheet of names hanging off the lab.
  const want = !!on && at === 'house';
  if (want === S.crewListOpen) return;
  S.crewListOpen = want;
  crewListEl.hidden = !want;
  // Filled before it is measured, for the reason opening a board is: an empty
  // sheet measures narrower than it will be, and the panel is seated by the
  // size it was last measured at.
  if (want) { buildCrewList(); refresh(crewListRowsEl, crewList(), null); }
  remeasure();
  placeBoard();       // which seats the list on whichever side has room for it
}

// `now` is for a close that was *asked for* rather than wandered out of: a tap
// on bare ground, a new game, the wheel starting. Those are answers, and an
// answer that takes a tenth of a second to arrive reads as a control that did
// not take. Only the pointer drifting off a station gets the benefit of LINGER.
export function showPanel(want, now = false) {
  // Back where it was, before it had gone anywhere: nothing happened.
  if (want === at) { clearTimeout(leaving); leaving = 0; return; }

  // Off to bare ground. Hold the board where it is for a moment -- see LINGER --
  // rather than closing on the spot, so that walking to the next station along
  // is one movement instead of a close and an open.
  if (!want && !now) {
    if (leaving) return;
    leaving = setTimeout(() => { leaving = 0; settle(null); }, LINGER);
    return;
  }
  clearTimeout(leaving);
  leaving = 0;
  settle(want);
}

// What actually moves the board, once it is settled where it is going: the same
// thing `showPanel` always did, with the question of whether it is really
// leaving answered above it.
function settle(want) {
  if (want === at) return;
  // Walking off to another station, or off to nothing, takes the submenu with
  // it. Done before `at` moves, so the list is put away while it still belongs
  // to the board it is standing beside.
  if (want !== 'house') showCrewList(false);
  const wasAt = at;
  at = want;
  S.boardOpen = want === 'bench';
  S.labBoardOpen = want === 'lab';
  S.schoolBoardOpen = want === 'school';
  S.casinoBoardOpen = want === 'casino';
  S.houseBoardOpen = want === 'house';
  S.scrubBoardOpen = want === 'scrub';
  S.quarryBoardOpen = want === 'quarry';
  S.farmBoardOpen = want === 'farm';
  S.towerBoardOpen = want === 'tower';

  if (!want) {                                   // fade out where it stands
    // Whatever was on it has now been seen. On the way out rather than on the
    // way in: a dot cleared as the board opened would be cleared in the frame it
    // was drawn -- see `markRowsSeen`.
    if (wasAt) markRowsSeen(listFor(wasAt));
    panelEl.classList.remove('open');
    clearTimeout(closing);
    closing = setTimeout(() => {
      if (at) return;                            // opened again on the way out
      panelEl.hidden = true;
      for (const k of Object.keys(pages)) pages[k].hidden = true;
    }, 140);
    return;
  }

  clearTimeout(closing);
  for (const k of Object.keys(pages)) pages[k].hidden = k !== want;
  // opening the bench reads every heading on it, the same as it always did
  if (want === 'bench') markSectionsSeen();
  panelEl.hidden = false;
  // Fill it before measuring it. The rows are written by `refresh`, which runs
  // in the frame loop -- so a board that was measured the moment it opened was
  // measured with every row still blank, came out shorter than it would be, and
  // was seated by that height for as long as it stayed open. It only looked
  // wrong the first time: the next open measured a board that already had its
  // words in. Which is why it read as a bug that fixed itself.
  fill(want);
  fillPurse();
  seatFlyout(panelEl, anchor(want));
  remeasure();

  // Walking from one station to another slides. Arriving at one after the last
  // board has *gone* does not.
  //
  // What decides it is whether there is anything on the screen to slide. A box
  // standing at the lab that jumps to the school is the jank; a box that has
  // already faded out has no place any more, and sliding it means an invisible
  // sheet travelling the length of the yard and fading up somewhere along the
  // way -- the board arrives late and from the wrong direction, which reads
  // worse than the jump did. Gone is gone: it is placed where it belongs and
  // fades in there.
  //
  // `open` is the class the fade hangs off, so it is exactly the question "can
  // this be seen right now". `hidden` is no good for it -- that is only set a
  // seventh of a second later, when the fade has finished.
  const showing = !panelEl.hidden && panelEl.classList.contains('open');
  if (showing) {
    panelEl.classList.add('sliding');
    clearTimeout(slide);
    // a shade longer than the slide itself, so the class is never taken off
    // mid-glide and the box never finishes the move in one jump
    slide = setTimeout(() => panelEl.classList.remove('sliding'), 340);
  } else {
    // and it must not be carrying a transition from the last time it moved, or
    // the placing below is a glide from wherever it happened to be standing
    clearTimeout(slide);
    panelEl.classList.remove('sliding');
  }
  place(panelEl, anchor(want));
  requestAnimationFrame(() => panelEl.classList.add('open'));
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

// how many bodies a section has, so a heading can say so
const headcount = title =>
  title === 'the crew' ? S.crew :
  title === 'the rock' ? S.miners :
  title === 'the quarry' ? S.quarriers :
  title === 'the farm' ? S.farmhands : 0;

// The numbers on whichever board is open. Pulled out of `hud` so that opening a
// board can fill it before it is measured, rather than a frame after.
function fill(which) {
  if (which === 'bench') refresh(shopEl, UPGRADES, headcount);
  // the lab board being open is what reads its news, whether it was already
  // open when the work finished or you walked over because of the mark
  if (which === 'lab') { markLabSeen(); refresh(labShopEl, LAB_UPGRADES, null); }
  // and the school's headings count kit rather than bodies: what is on the
  // stand there is the thing you are deciding about
  if (which === 'school') refresh(schoolShopEl, SCHOOL_UPGRADES, kitCount);
  if (which === 'casino') refresh(casinoShopEl, CASINO_UPGRADES, null);
  if (which === 'scrub') refresh(scrubShopEl, SCRUB_UPGRADES, null);
  if (which === 'quarry') refresh(quarryShopEl, QUARRY_UPGRADES, null);
  if (which === 'farm') refresh(farmShopEl, FARM_UPGRADES, null);
  if (which === 'tower') refresh(towerShopEl, TOWER_UPGRADES, null);
  // rebuilt as well as refreshed: the crew is a list that changes length, and
  // the other boards are lists that do not
  if (which === 'house') {
    buildCrew();
    refresh(crewShopEl, crewRows(), null);
    // And the people beside it, while they are out. Where a body is standing is
    // the one thing on either of these sheets that moves on its own, so the list
    // is written every frame the same as any other open board -- a name whose
    // "at the pit" went stale the moment you opened it would be the board
    // telling you where somebody used to be.
    if (S.crewListOpen) { buildCrewList(); refresh(crewListRowsEl, crewList(), null); }
  }
}

// What you have to spend, beside the board that is asking for it. Every price on
// these boards is a mark and a number, and the only place you could see what you
// *had* of that mark was the counter over the pit -- the other end of the yard,
// in the corner of the window, and as often as not behind the board itself.
//
// A currency appears the first time you have seen one, which is the same rule
// the counter over the pit goes by: nothing in this game names a thing you have
// not met.
const PURSE = [
  ['dust', () => true, () => S.stored],
  ['core', () => S.seenCore, () => S.cores],
  ['shard', () => S.seenShard, () => S.shards],
  ['spore', () => S.seenSpore, () => S.spores],
  ['spark', () => S.seenSpark, () => S.sparks]
];

// Written only when it changes. This runs every frame a board is open, and
// `innerHTML` is a parse: re-parsing four rows sixty times a second for a number
// that moves when a worker tips a load in is the same waste the shop rows were
// careful about.
let purseWas = null;
function fillPurse() {
  let html = '';
  for (const [mark, seen, count] of PURSE) {
    if (!seen()) continue;
    html += `<div class="coin"><i class="${mark}"></i><b>${fmt(count())}</b></div>`;
  }
  if (html === purseWas) return;
  // A row appearing or going makes the panel a different size, and the panel is
  // seated by the size it was measured at. A digit does not: the count sits in a
  // slot of its own width so the board cannot twitch as the dust comes in.
  const resized = purseWas === null || purseWas.length !== html.length;
  purseWas = html;
  purseEl.innerHTML = html;
  if (resized) remeasure();
}

// A spin in progress hushes the board wherever it is standing. It is not closed
// -- nothing has been decided, and it is the same board when it comes back --
// it is out of the way of the one thing in this game you are meant to watch.
let hushed = false;
function hush() {
  const want = spinning();
  if (want === hushed) return;
  hushed = want;
  panelEl.classList.toggle('hushed', want);
}

export function hud() {
  hush();
  tweenCount(now());
  fillPurse();
  fill(at);
  // A row bought out of the list, or a body hired into it, leaves the sheet a
  // different height than the one it is seated by. The rows are filled in by
  // `fill` just above, so by here there is a whole board to measure.
  if (tookRows()) remeasure();
  // A board is placed when it opens, and it is empty at that moment: its rows
  // are filled on the next frame, and a board that grew a row after being
  // seated could end up hanging off the top of a short window. Seating it every
  // frame is a couple of style writes and it can never be wrong.
  placeBoard();
}

