// The workbench board: where it sits on screen, when it opens, and the counter
// above the pit that chases the number.

import { P } from './config.js';
import { S, bench, lab, school, casino, scrub } from './state.js';
import { crewRows, houseRect } from './crewboard.js';
import { UPGRADES, markSectionsSeen } from './upgrades.js';
import { LAB_UPGRADES, markLabSeen } from './lab.js';
import { SCHOOL_UPGRADES } from './school.js';
import { CASINO_UPGRADES, spinning } from './casino.js';
import { SCRUB_UPGRADES } from './scrubhouse.js';
import { refresh, markRowsSeen, buildCrew, tookRows } from './shop.js';
import { now } from './clock.js';

const shopEl = document.getElementById('shop');
const labShopEl = document.getElementById('labshop');
const schoolShopEl = document.getElementById('schoolshop');
const casinoShopEl = document.getElementById('casinoshop');
const crewShopEl = document.getElementById('crewshop');
const scrubShopEl = document.getElementById('scrubshop');
const panelEl = document.getElementById('panel');
const purseEl = document.getElementById('purse');
const pages = { bench: document.getElementById('board'), lab: document.getElementById('lab'),
                school: document.getElementById('school'), casino: document.getElementById('casino'),
                house: document.getElementById('house'),
                scrub: document.getElementById('scrub') };
// The house is the only stand that is not a fixed rectangle: it grows a room per
// body, so where you have to be standing to read the list of who lives there
// depends on how many of them there are.
const standAt = { bench, lab, school, casino, scrub, get house() { return houseRect(); } };
const LISTS = { bench: UPGRADES, lab: LAB_UPGRADES, school: SCHOOL_UPGRADES,
                casino: CASINO_UPGRADES, scrub: SCRUB_UPGRADES, house: [] };

// near enough to a thing on the ground to be interested in it
const near = (r, x, y) => x > r.x - P * 8 && x < r.x + r.w + P * 8 &&
                          y > r.y - P * 8 && y < r.y + r.h + P * 4;

export const nearBench = (x, y) => S.seenBench && near(bench, x, y);
export const nearLab = (x, y) => S.labOpen && near(lab, x, y);
export const nearSchool = (x, y) => S.schoolOpen && near(school, x, y);
export const nearCasino = (x, y) => S.casinoOpen && near(casino, x, y);
export const nearScrub = (x, y) => S.scrubOpen && near(scrub, x, y);
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

function place(el, at) {
  const w = sized.w || el.offsetWidth, h = sized.h || el.offsetHeight;
  const want = (at.x - S.camX) * S.zoom;
  const x = Math.round(Math.max(GAP, Math.min(want, S.W - w - GAP)));

  const stands = S.H - (at.y - S.camY) * S.zoom + P * 3;
  const bottom = Math.round(Math.max(GAP, Math.min(stands, S.H - h - GAP)));
  const y = Math.round(S.H - bottom - h);

  if (x === putX && y === putY) return;         // it has not moved: leave the layer alone
  putX = x;
  putY = y;
  el.style.transform = `translate3d(${x}px, ${y}px, 0)`;
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
const SAFE_SLACK = 12;             // and a little grace either side of that

// where the board actually is on screen, from the numbers `place` already keeps
const panelRect = () => putX === null ? null
  : { x: putX, y: putY, w: sized.w || panelEl.offsetWidth, h: sized.h || panelEl.offsetHeight };

// and where the station it belongs to is: the ground under the middle of it
function apexAt(which) {
  const r = standAt[which];
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
  if (at) place(panelEl, standAt[at]);
}

// Two readings for the checks. They are plain exports rather than `window.__`
// handles because this file is loaded by the node checks as well, where
// `import.meta.env` is a vite word that means nothing -- console.js hangs them
// on `window` behind the dev gate, and a build drops them, because with
// console.js gone nothing imports either one.

// seat both boards wherever they belong, open or not, so a check can look at
// where they would go without going through the whole opening dance
export const seatBoard = () => place(panelEl, standAt[at] || bench);

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
  const x = centred ? sx - w / 2 : sx;
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

export function showPanel(want) {
  if (want === at) return;
  const wasAt = at;
  at = want;
  S.boardOpen = want === 'bench';
  S.labBoardOpen = want === 'lab';
  S.schoolBoardOpen = want === 'school';
  S.casinoBoardOpen = want === 'casino';
  S.houseBoardOpen = want === 'house';
  S.scrubBoardOpen = want === 'scrub';

  if (!want) {                                   // fade out where it stands
    // Whatever was on it has now been seen. On the way out rather than on the
    // way in: a dot cleared as the board opened would be cleared in the frame it
    // was drawn -- see `markRowsSeen`.
    if (wasAt) markRowsSeen(LISTS[wasAt]);
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
  remeasure();

  if (wasAt) {                                   // walking from one to the other
    panelEl.classList.add('sliding');
    clearTimeout(slide);
    slide = setTimeout(() => panelEl.classList.remove('sliding'), 240);
  }
  place(panelEl, standAt[want]);
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
  if (which === 'school') refresh(schoolShopEl, SCHOOL_UPGRADES, null);
  if (which === 'casino') refresh(casinoShopEl, CASINO_UPGRADES, null);
  if (which === 'scrub') refresh(scrubShopEl, SCRUB_UPGRADES, null);
  // rebuilt as well as refreshed: the crew is a list that changes length, and
  // the other boards are lists that do not
  if (which === 'house') { buildCrew(); refresh(crewShopEl, crewRows(), null); }
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
  ['spore', () => S.seenSpore, () => S.spores]
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

