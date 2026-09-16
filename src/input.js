// Wiring the mouse, the wheel and the keyboard to the game.
//
// Nothing in here decides anything: it turns an event into a call on somebody
// else's module.

import { P, MINE_DELAY, WORKER, CORE_CELL, SHARD_CELL, SPORE_CELL, SPARK_CELL, findKind,
         FARM_H } from './config.js';
import { S, bench, floor, pit, table, outhouse, rift, shack } from './state.js';
import { clampCam, unfollow, bindScroller } from './world.js';
import { overBoulder, knockOff, topOfRock } from './rock.js';
import { sweep, release, track, overCore, dustUnder } from './hands.js';
import { startle, overBird } from './weather.js';
import { stirAir } from './air.js';
import { stirSmoke } from './smog.js';
import { colAt, muckCols, poopCols, muckFloor } from './smog.js';
import { at, inside, colOf, bottomY, isDust } from './grid.js';
import { nearBench, nearCasino, nearHouse, nearScrub, nearQuarry, nearFarm, nearApothecary, nearTower, nearStats, nearOuthouse, nearShack, showPanel, placeBoard, showTip,
         showTipAt, inSafeZone, onMenu, standRect, openBoard } from './board.js';
import { overPileMark, pileMarkAt, overDoneMark, doneMarkAt } from './render.js';
import { doneName } from './works.js';
import { reset } from './persist.js';
import { fadeIn, fadeOut } from './fade.js';
import { rosterHit, overRoster } from './roster.js';
import { overCount, countRect } from './render/counter.js';
import { potPick, potHover } from './potpick.js';
import { shutOpts } from './shop.js';
import { workerAt, lift, lifted, drop, shakeHeld } from './crew.js';
import { hoverAt } from './crew/pointer.js';
import './upgrades.js';
import { card, houseRect } from './crewboard.js';
import { now } from './clock.js';
import { MACHINES, running, specOf } from './machines.js';
import { CRAFT, craftY, BALLOON_W, BALLOON_H, BALLOON_BASKET, BALLOON_FILTER_H } from './balloon.js';
import { plotX } from './farm.js';
import { riftOpen } from './rift.js';
import { skipCutscene } from './cutscene.js';
import { holdSkip } from './skip.js';
import { markNoticesRead } from './notices.js';
import { sayStore, showPane } from './settings.js';
import { coarse } from './prefs.js';
import { isTap } from './tap.js';   // one definition of a tap for the whole page

const canvas = document.getElementById('c');
const resetEl = document.getElementById('reset');

// Every finger currently down, so a second one can mean something different
// from the first.
const down = new Map();
let panning = null;                        // where the fingers were last frame
// The middle button's pan. Apart from `panning` because it is one pointer, and
// must not be cancelled by the "fewer than two fingers" rule.
let wheelPan = null;
// On a phone the yard is scrolled from the grab bar along the bottom edge
// and from nowhere else (DESIGN.md, "Momentum scrolling"): the band is the
// platform's own scroller, a drag in it coasts the way every list on the
// phone coasts, and the game reads where it got to (world.js,
// `readScroll`). A finger on the yard itself sweeps, on dust, or taps, on
// anything else; it never moves the view, so a long sweep toward the pit
// cannot turn into a scroll halfway. bar.js draws the band; the elements
// are bound here because the rule for a view that has moved (`viewTaken`)
// is this file's.
const scroller = document.getElementById('scroller');
const spacer = document.getElementById('spacer');

const middle = () => {
  let x = 0, y = 0;
  for (const p of down.values()) { x += p.x; y += p.y; }
  return { x: x / down.size, y: y / down.size };
};

// a second finger means looking around, not digging: whatever the first one
// had started is dropped
function startPan() {
  S.mining = false;
  S.dragging = false;                      // the load stays on the cursor, unthrown
  panning = middle();
}

// Where the pointer was on the glass last time it moved, for the draught it
// leaves in the air; and in the yard's own coordinates, for the smoke.
let lastSx = null, lastSy = null;
let lastWx = null, lastWy = null;

export function pos(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - r.left) / S.zoom + S.camX,
    y: (e.clientY - r.top) / S.zoom + S.camY
  };
}

// The right button belongs to the crew, so the browser's menu is not wanted.
canvas.addEventListener('contextmenu', e => e.preventDefault());

// The browser's middle-button autoscroll starts on `mousedown`; preventing the
// default on a pointerdown does not stop it.
canvas.addEventListener('mousedown', e => { if (e.button === 1) e.preventDefault(); });
canvas.addEventListener('auxclick', e => { if (e.button === 1) e.preventDefault(); });

// Standing at any station at all; the click and move handlers ask the same
// list.
const atStation = (x, y) =>
  nearShack(x, y) || nearBench(x, y) || nearCasino(x, y) ||
  nearScrub(x, y) || nearQuarry(x, y) || nearFarm(x, y) || nearApothecary(x, y) || nearTower(x, y) ||
  nearHouse(x, y) || nearStats(x, y) || nearOuthouse(x, y);

canvas.addEventListener('pointerdown', e => {
  // Held, the yard does not answer to anything.
  if (S.paused) return;
  // A click skips a running cutscene and does nothing else: a swing taken
  // while the camera is being handed back lands on whatever is under it.
  if (skipCutscene()) return;
  // The middle button looks around and the right button lifts (`lift`);
  // neither can mean any of the things the left button means.
  if (e.button === 1) {
    wheelPan = e.clientX;
    try { canvas.setPointerCapture(e.pointerId); } catch {}
    return;
  }
  if (e.button === 2) {
    const w = workerAt(...Object.values(pos(e)));
    if (w) {
      lift(w);
      try { canvas.setPointerCapture(e.pointerId); } catch {}
    }
    return;
  }
  down.set(e.pointerId, { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY,
                          at: now(), kind: e.pointerType });
  // Two fingers on a desk's touchscreen look about; on a phone they do not:
  // scrolling there is the grab bar's alone, so a second finger changes
  // nothing about the first.
  if (down.size === 2) { if (!coarse()) startPan(); return; }
  if (down.size > 2) return;

  const p = pos(e);
  S.mouse = p;
  // A click off a station puts any open board away, whatever else it means:
  // a click is a decision to stop reading. Before everything else, so it
  // happens whether or not the click lands on anything.
  if (!atStation(p.x, p.y)) showPanel(null, true);
  // the sky first, though nothing up there is ever over the rock
  if (startle(p.x, p.y)) return;
  // then the controls that stand in the yard, before the ground behind them:
  // the rosters and the machine levers, then the cauldrons' pickers
  if (rosterHit(p.x, p.y)) return;
  if (potPick(p.x, p.y)) return;
  if (overBoulder(p.x, p.y)) {                // false once the rock is finished
    // The nearest high point to the click, the same place a held swing lands:
    // a rock is worked from the top down.
    const at = topOfRock(p.x) || p;
    knockOff(at.x, at.y, undefined, false);   // your own hands: no smoke
    S.mining = S.autoMine;                      // holding only mines once unlocked
    S.nextHit = now() + MINE_DELAY;
    try { canvas.setPointerCapture(e.pointerId); } catch {}
    return;
  }
  // A finger off the dust is a tap, read at the release, and nothing while
  // it is down: it does not sweep and it does not move the view. A mouse
  // keeps its left button for the sweep everywhere.
  if (e.pointerType === 'touch' && !dustUnder(p.x, p.y)) return;
  S.dragging = true;
  S.trail = [];
  track(p.x, p.y);
  try { canvas.setPointerCapture(e.pointerId); } catch {}
  sweep(p.x, p.y);
});

canvas.addEventListener('pointermove', e => {
  const held = down.get(e.pointerId);
  if (held) { held.x = e.clientX; held.y = e.clientY; }

  if (wheelPan !== null) {                   // middle button: drag the view along
    pan((wheelPan - e.clientX) / S.zoom);
    wheelPan = e.clientX;
    return;
  }

  if (panning && down.size >= 2) {           // two fingers: drag the view along
    const now = middle();
    pan((panning.x - now.x) / S.zoom);
    panning = now;
    return;
  }

  // The air is stirred on the glass, where a mote lives: dragging the view
  // slides the pointer across the world without moving it across the window,
  // and should stir nothing.
  const r = canvas.getBoundingClientRect();
  const sx = e.clientX - r.left, sy = e.clientY - r.top;
  if (lastSx != null) stirAir(sx, sy, sx - lastSx, sy - lastSy);
  lastSx = sx; lastSy = sy;

  // the smoke lives in the yard, so it is stirred in world pixels
  const wm = pos(e);
  if (lastWx != null) stirSmoke(wm.x, wm.y, wm.x - lastWx, wm.y - lastWy);
  lastWx = wm.x; lastWy = wm.y;

  const wasWx = S.mouse ? S.mouse.x : null;
  S.mouse = pos(e);
  track(S.mouse.x, S.mouse.y);
  // there is no hovering on a touchscreen, so the board opens on a tap instead
  if (e.pointerType !== 'touch') {
    // a body under the cursor stands still while it is looked at; the stage
    // in crew/step.js does the rest
    hoverAt(S.mouse.x, S.mouse.y);
    potHover(S.mouse.x, S.mouse.y);
    const want = boardAt(S.mouse.x, S.mouse.y);
    // Standing at a station outranks being on the way to the open board: a
    // station under the pointer is an arrival, and the wedge is for the ground
    // *between* things, so it only has a say when the answer would otherwise
    // be nothing. Unless the cursor is on the menu itself: the strip between
    // the board and the crew list is bare canvas over whatever station is next
    // along, and crossing it is reading the menu, not arriving.
    if (want && !onMenu(e.clientX, e.clientY)) showPanel(want);
    else if (!inSafeZone(e.clientX, e.clientY)) showPanel(null);
    // a board opens because you walked up to a station, a tooltip because you
    // went and looked at a mark
    askedAbout(S.mouse.x, S.mouse.y, e.clientX, e.clientY);
    setCursor(S.mouse.x, S.mouse.y);
  }
  // somebody on the cursor goes where the cursor goes
  const up = lifted();
  if (up) {
    // waggled back and forth: counted in the hand, spent on the drop
    // (`shakeHeld`)
    if (wasWx != null) shakeHeld(up, S.mouse.x - wasWx);
    up.x = S.mouse.x - WORKER / 2;
    up.y = S.mouse.y - WORKER / 2;
    if (!(e.buttons & 2)) drop(up);            // the button let go somewhere else
    return;
  }
  if (e.buttons === 0 && (S.mining || S.dragging)) { endDrag(e); return; }
  if (S.dragging) sweep(S.mouse.x, S.mouse.y);
});

// The board a point on the ground asks for, in the order that settles which
// wins where two patches overlap. The house is a block that grows a room per
// body and its patch reaches the bench, so it goes after every smaller thing
// you might be standing at; the noticeboard stands on the busiest strip in
// the yard and goes last of all.
function boardAt(x, y) {
  return nearCasino(x, y) ? 'casino'
       : nearScrub(x, y) ? 'scrub'
       : nearQuarry(x, y) ? 'quarry'
       : nearFarm(x, y) ? 'farm'
       : nearApothecary(x, y) ? 'apothecary'
       : nearTower(x, y) ? 'tower'
       // the hut before the bench it stands in front of
       : nearShack(x, y) ? 'shack'
       : nearBench(x, y) ? 'bench'
       : nearOuthouse(x, y) ? 'outhouse'
       : nearHouse(x, y) ? 'house'
       : nearStats(x, y) ? 'stats' : null;
}

export function endDrag(e) {
  if (wheelPan !== null && (e.button === 1 || e.type !== 'pointerup')) wheelPan = null;
  const up = lifted();
  if (up) { drop(up); return; }
  const held = down.get(e.pointerId);
  down.delete(e.pointerId);
  if (down.size < 2) panning = null;

  // A tap on a touchscreen is what a hover is on a desk: at a station it
  // opens (or shuts) the board, anywhere else it puts it away.
  if (held && held.kind === 'touch' && !panning &&
      isTap(held.x0, held.y0, e.clientX, e.clientY, now() - held.at)) {
    const p = pos(e);
    if (nearShack(p.x, p.y)) showPanel(S.shackBoardOpen ? null : 'shack', true);
    else if (nearBench(p.x, p.y)) showPanel(S.boardOpen ? null : 'bench', true);
    else if (nearCasino(p.x, p.y)) showPanel(S.casinoBoardOpen ? null : 'casino', true);
    else if (nearScrub(p.x, p.y)) showPanel(S.scrubBoardOpen ? null : 'scrub', true);
    else if (nearQuarry(p.x, p.y)) showPanel(S.quarryBoardOpen ? null : 'quarry', true);
    else if (nearFarm(p.x, p.y)) showPanel(S.farmBoardOpen ? null : 'farm', true);
    else if (nearApothecary(p.x, p.y)) showPanel(S.apothBoardOpen ? null : 'apothecary', true);
    else if (nearTower(p.x, p.y)) showPanel(S.towerBoardOpen ? null : 'tower', true);
    else if (nearHouse(p.x, p.y)) showPanel(S.houseBoardOpen ? null : 'house', true);
    else if (nearOuthouse(p.x, p.y)) showPanel(S.looBoardOpen ? null : 'outhouse', true);
    else if (nearStats(p.x, p.y)) showPanel(S.statsBoardOpen ? null : 'stats', true);
    else showPanel(null, true);
  }

  S.mining = false;
  if (!S.dragging) return;
  S.dragging = false;
  const p = pos(e);
  release(p.x, p.y);
}
canvas.addEventListener('pointerup', endDrag);
canvas.addEventListener('pointercancel', endDrag);
addEventListener('pointerup', endDrag);          // catch releases outside the canvas
addEventListener('blur', () => {
  down.clear();
  panning = null;
  wheelPan = null;
  S.mining = false;
  if (S.dragging) { S.dragging = false; release(S.mouse.x, S.mouse.y); }
});

// The cursor leaving the canvas takes any label with it.
canvas.addEventListener('pointerleave', () => showTipAt(null));


export function disarmReset() {
  S.resetArmed = 0;
  resetEl.classList.remove('armed');
  resetEl.textContent = 'reset progress';
}

resetEl.addEventListener('click', () => {
  if (!S.resetArmed) {
    S.resetArmed = setTimeout(disarmReset, 4000);
    resetEl.classList.add('armed');
    resetEl.textContent = 'erase everything?';
    return;
  }
  clearTimeout(S.resetArmed);
  disarmReset();
  reset();
});

// --- the hover registry ---------------------------------------------------------
// A label for whatever the cursor is over, in a word. The richer tooltips in
// `askedAbout` (a body's card, a stopped station's reason) keep winning; the
// label is shown once none of them has anything to say. `whatIsAt` draws
// nothing, so a check can ask it with no mouse anywhere near it.
const inRect = (r, x, y) => !!r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;

// The cell a grid holds at a world point, the same lookup `sweep` in hands.js
// makes: a row counted up from the grid's own floor, not down from its top.
function cellAt(b, wx, wy) {
  if (!b.grid) return 0;
  const c = colOf(b, wx);
  const r = Math.floor((bottomY(b) - wy) / P);
  return inside(b, c, r) ? at(b, c, r) : 0;
}

function cellLabel(v) {
  if (!v) return null;
  if (v === CORE_CELL) return 'core';
  const k = findKind(v);
  if (k === SHARD_CELL) return 'ore';
  if (k === SPORE_CELL) return 'crop';
  if (k === SPARK_CELL) return 'spark';
  return isDust(v) ? 'pebble' : null;
}

// Every building `standRect` (board.js) answers "is it there, and where" for.
const BUILDING_NAME = {
  shack: 'the shack',
  bench: 'the bench', lab: 'the lab', casino: 'the casino',
  scrub: 'the scrubbing house', quarry: 'the quarry', farm: 'the farm', tower: 'the tower'
};

function buildingAt(x, y) {
  for (const key in BUILDING_NAME) if (inRect(standRect(key), x, y)) return BUILDING_NAME[key];
  if (S.outhouseOpen && inRect(outhouse, x, y)) return "the janitor's closet";
  // the drowned pit answers as the abyss; through the torn era, the disc
  // answers as the rift
  if (S.drowned && x > pit.x && x < pit.x + pit.w && y > S.groundY) return 'the abyss';
  if (riftOpen() && !S.drowned && inRect(rift, x, y)) return 'the rift';
  return null;
}

// A machine has no rect exported, so this is a generous box round the point
// `specOf` hands out.
const MACHINE_NAME = { jaw: 'the drill', ram: 'the ram', tiller: 'the tiller', belt: 'the belt' };
function machineAt(x, y) {
  for (const m of MACHINES) {
    if (!running(m.key)) continue;
    const spec = specOf(m.key);
    if (!spec) continue;
    if (Math.abs(x - spec.at()) < P * 6 && Math.abs(y - spec.y()) < P * 8) return MACHINE_NAME[m.key];
  }
  return null;
}

// Muck and poop share one layer of columns (MESS in smog.js) and stack to one
// height; poop is named first, since it is the one a janitor is sent for.
function messAt(x, y) {
  const c = colAt(x);
  const poo = poopCols()[c] || 0, muck = muckCols()[c] || 0;
  const n = poo + muck;
  if (!n) return null;
  const foot = muckFloor(c);
  if (y < foot - n * P || y > foot) return null;
  return poo ? 'poop' : 'muck';
}

// The pot is asked by cell, not by the strip of ground the grid reserves for
// it, which runs most of the width of the yard.
const potAt = (x, y) => S.casinoOpen && !!cellAt(table, x, y);

// A balloon's box, the way `drawBalloons` in render.js draws one.
function balloonAt(x, y) {
  if (!S.scrubOpen) return false;
  for (let i = 0; i < CRAFT.length; i++) {
    const by = craftY(i);
    const top = by - BALLOON_BASKET - BALLOON_FILTER_H - BALLOON_H;
    const left = CRAFT[i].x - BALLOON_W / 2;
    if (x >= left && x <= left + BALLOON_W && y >= top && y <= by + P * 2) return true;
  }
  return false;
}

// A plot's crop once it has grown, the box `drawFarm` in render.js fills.
function cropAt(x, y) {
  if (!S.farmOpen) return false;
  for (let i = 0; i < S.plots.length; i++) {
    if (S.plots[i] < 1) continue;
    const px = Math.round(plotX(i) / P) * P;
    const soil = S.groundY - P * 2;
    const top = soil - Math.round(FARM_H * S.plots[i] / P) * P;
    if (x >= px - P && x <= px + P * 2 && y >= top - P && y <= soil + P * 2) return true;
  }
  return false;
}

// What is at a spot, in a word, or nothing. Asked in the order a thing would
// catch your eye: somebody moving before the ground under them, a grain before
// the building the pile stands beside.
export function whatIsAt(x, y) {
  const w = lifted() || workerAt(x, y);
  if (w) return w.type;
  if (overCore(x, y)) return 'core';
  const grain = cellLabel(cellAt(floor, x, y) || cellAt(pit, x, y));
  if (grain) return grain;
  if (S.crew >= 1 && inRect(houseRect(), x, y)) return 'house';
  const building = buildingAt(x, y);
  if (building) return building;
  // the mess before the rock it lies on: poop lands on the rock's flank, and
  // the rock would otherwise answer for the whole of its footprint
  const mess = messAt(x, y);
  if (mess) return mess;
  if (overBoulder(x, y)) return 'rock';
  const machine = machineAt(x, y);
  if (machine) return machine;
  if (overBird(x, y)) return 'bird';
  if (potAt(x, y)) return 'pot';
  if (balloonAt(x, y)) return 'balloon';
  if (cropAt(x, y)) return 'crop';
  return null;
}

// Recomputed every fourth call, not every `pointermove` a fast mouse fires.
// The cache is keyed on where it was taken: it is an answer about a SPOT, and
// kept on the call count alone it answered "the farm" over bare sky after the
// camera glided or a new game started. Within a cell it stands; a cell is the
// yard's own unit of "the same place".
let tipTick = 0, tipWas = null, tipAt = null;
function polledWhatIsAt(x, y) {
  const same = tipAt && Math.abs(x - tipAt[0]) < P && Math.abs(y - tipAt[1]) < P;
  if (same && ++tipTick % 4 !== 0) return tipWas;
  tipTick = 0;
  tipAt = [x, y];
  tipWas = whatIsAt(x, y);
  return tipWas;
}

const panelEl = document.getElementById('panel');
// The sheet is in screen space, so this is a question about the page.
function overOpenBoard(cx, cy) {
  if (panelEl.hidden || cx == null) return false;
  const r = panelEl.getBoundingClientRect();
  return cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom;
}

// The tooltip: what the cursor went and looked at. Not the board, which opens
// because you walked up to a station; two questions, asked separately.
function askedAbout(x, y, cx, cy) {
  // Somebody first: they are the only thing that moves, so a mark they are
  // over can still be read a moment later. In your hand before under the
  // cursor: a body being carried is the one you are asking about.
  const w = lifted() || workerAt(x, y);
  if (w) {
    showTipAt(card(w), (w.x + WORKER + P * 2 - S.camX) * S.zoom,
                       (w.y - P * 3 - S.camY) * S.zoom);
    return true;
  }
  for (const p of S.piles) {
    if (!S.pileFull[p.key] || !overPileMark(p.key, x, y)) continue;
    showTip('pile is full', pileMarkAt(p.key));
    return true;
  }
  const finished = overDoneMark(x, y);
  if (finished) {
    showTip(doneName(finished), doneMarkAt(finished));
    return true;
  }
  // A board over the same spot has nothing to add to.
  if (overOpenBoard(cx, cy)) { showTipAt(null); return false; }
  // The counter says what it counts: nothing else names the coin.
  if (overCount(cx, cy)) {
    const r = countRect();
    showTipAt('pebbles in the pit: what everything costs', r.x + r.w / 2, r.y - P * 5, true);
    return true;
  }
  const label = polledWhatIsAt(x, y);
  if (label) {
    showTipAt(label, (x - S.camX) * S.zoom + P * 2, (y - S.camY) * S.zoom - P * 2);
    return true;
  }
  showTip(null);
  return false;
}

// --- what the cursor says ------------------------------------------------------
// The yard is one canvas, so nothing drawn in it carries a cursor of its own;
// everything here is asked on every move. Crosshair is the ground state,
// because the ground state of this game is aiming at a rock.
const CURSORS = [
  // carrying something: the hand is closed
  [() => S.heldCore || S.dragging || lifted(), 'grabbing'],
  // a core lying about is the one thing here you pick up yourself
  [(x, y) => overCore(x, y), 'grab'],
  // the counts under a station, and the places with a board on them
  [(x, y) => overRoster(x, y), 'pointer'],
  [(x, y) => nearShack(x, y) || nearBench(x, y) || nearCasino(x, y) ||
             nearHouse(x, y) || nearScrub(x, y) || nearQuarry(x, y) || nearFarm(x, y) ||
             nearApothecary(x, y) || nearTower(x, y) || nearStats(x, y) ||
             nearOuthouse(x, y), 'pointer'],
  // a mark that will tell you why something has stopped
  [(x, y) => overAnyMark(x, y), 'help'],
  [(x, y) => overBird(x, y), 'pointer']
];

// The marks `askedAbout` shows a tooltip for, asked without showing one: the
// cursor changes on the way *toward* the mark.
function overAnyMark(x, y) {
  for (const p of S.piles) if (S.pileFull[p.key] && overPileMark(p.key, x, y)) return true;
  return !!overDoneMark(x, y);
}

let wearing = '';
function setCursor(x, y) {
  let want = 'crosshair';
  for (const [is, name] of CURSORS) if (is(x, y)) { want = name; break; }
  if (want === wearing) return;                // only when it actually changes
  wearing = want;
  canvas.style.cursor = want;
}

function pan(dx) {
  S.camTo = null;                          // the player takes the view back
  unfollow();                              // including from whoever it was on
  const was = S.camX;
  S.camX += dx;
  clampCam();
  if (S.camX === was) return;
  S.dirty = true;                          // where you are looking is worth writing down
  viewTaken();
}

// The player has moved the view -- by a drag, the wheel, the keys or the
// platform's own fling (world.js reads that back and calls this). A board
// comes down when its station is scrolled out of the window: a sheet that
// follows you two windows off it is a menu that will not go away.
function viewTaken() {
  const open = openBoard();
  if (!open) return;
  const r = standRect(open);
  if (r && (r.x + r.w < S.camX || r.x > S.camX + S.viewW)) showPanel(null, true);
  else placeBoard();
}
bindScroller(scroller, spacer, viewTaken);

canvas.addEventListener('wheel', e => {
  e.preventDefault();
  pan((Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * 0.8);
}, { passive: false });

// The cursor leaving the menu closes it, unless it left toward the station:
// the same wedge in the other direction.
document.getElementById('panel').addEventListener('pointerleave', e => {
  if (!inSafeZone(e.clientX, e.clientY)) showPanel(null);
});
addEventListener('keydown', e => {
  // ctrl+R is the browser reloading
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  // No reset key: erasing everything must never be quicker than two
  // deliberate clicks on the armed button. Escape holds the yard; a list
  // standing open on a board answers to it first, so the key never does two
  // things at once.
  if (e.key === 'Escape') {
    e.preventDefault();
    if (shutOpts()) return;
    hold(!S.paused);
  }
  if (e.key === 'ArrowRight') pan(P * 12);
  if (e.key === 'ArrowLeft') pan(-P * 12);
  // Space, held, skips the running scene (skip.js); the browser's repeats are
  // ignored. Not while typing: the settings sheet has a box a save is pasted
  // into.
  if (e.key === ' ' && !typing(e.target)) {
    e.preventDefault();
    if (!e.repeat) holdSkip(true);
  }
});
addEventListener('keyup', e => { if (e.key === ' ') holdSkip(false); });
// A window that loses focus never sees its key come up.
addEventListener('blur', () => holdSkip(false));
const typing = el =>
  !!el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable);

// One flag, set here and read everywhere; the frame keeps the sheet in step
// with it, so anything that clears the flag clears the sheet.
export function hold(on) {
  S.paused = on;
  (on ? fadeIn : fadeOut)(document.getElementById('held'));   // now, not next frame
  // The sheet comes up on its front page, and opening it reads the record.
  if (on) { showPane('main'); markNoticesRead(); sayStore(); }
  S.dirty = true;
}
document.getElementById('resume').addEventListener('click', () => hold(false));
