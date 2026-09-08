// Wiring the mouse, the wheel and the keyboard to the game.
//
// Nothing in here decides anything: it turns an event into a call on somebody
// else's module. If a new site needs a click, it gets a branch here and its own
// file for the behaviour.

import { P, MINE_DELAY, WORKER, CORE_CELL, SHARD_CELL, SPORE_CELL, SPARK_CELL, findKind,
         FARM_H } from './config.js';
import { S, bench, floor, pit, table, outhouse, rift } from './state.js';
import { clampCam, unfollow } from './world.js';
import { overBoulder, knockOff, topOfRock } from './rock.js';
import { sweep, release, track, overCore } from './hands.js';
import { startle, overBird } from './weather.js';
import { stirAir } from './air.js';
import { stirSmoke } from './smog.js';
import { colAt, muckCols, poopCols, muckFloor } from './smog.js';
import { at, inside, colOf, bottomY, isDust } from './grid.js';
import { nearBench, nearSchool, nearCasino, nearHouse, nearScrub, nearQuarry, nearFarm, nearApothecary, nearTower, nearStats, nearOuthouse, showPanel, placeBoard, showTip,
         showTipAt, inSafeZone, standRect } from './board.js';
import { overPileMark, pileMarkAt, overDoneMark, doneMarkAt } from './render.js';
import { doneName } from './works.js';
import { reset } from './persist.js';
import { rosterHit, overRoster } from './roster.js';
import { potPick, potHover } from './potpick.js';
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

const canvas = document.getElementById('c');
const resetEl = document.getElementById('reset');

// Every finger currently down, so a second one can mean something different
// from the first. A mouse only ever has one, so none of this gets in its way.
const down = new Map();
let panning = null;                        // where the fingers were last frame
// and the same for the middle button, which is a mouse's version of the two
// fingers: hold it down and the yard slides under the pointer. Kept apart from
// `panning` because it is one pointer rather than the middle of several, and
// because it must not be cancelled by the same "fewer than two fingers" rule.
let wheelPan = null;
const TAP_SLOP = 14;                       // pixels a tap may wander and still be a tap
const TAP_TIME = 500;

const middle = () => {
  let x = 0, y = 0;
  for (const p of down.values()) { x += p.x; y += p.y; }
  return { x: x / down.size, y: y / down.size };
};

// a second finger means the player wants to look around, not dig: whatever the
// first one had started is dropped, and the two of them move the view together
function startPan() {
  S.mining = false;
  S.dragging = false;                      // the load stays on the cursor, unthrown
  panning = middle();
}

// Where the pointer was on the glass last time it moved, for the draught it
// leaves in the dust. Kept here rather than on S: it is a fact about the mouse
// between two events, not about the yard, and nothing saves or reads it.
let lastSx = null, lastSy = null;
// and the same for the yard's own coordinates, for the smoke
let lastWx = null, lastWy = null;

export function pos(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - r.left) / S.zoom + S.camX,
    y: (e.clientY - r.top) / S.zoom + S.camY
  };
}

// The right button belongs to the crew and nothing else, so the menu the browser
// would put there is not wanted anywhere on the yard.
canvas.addEventListener('contextmenu', e => e.preventDefault());

// The middle button scrolls the view sideways, and the browser would rather use
// it to open its own autoscroll. Taken on `mousedown`, which is the event that
// starts that, rather than on the pointer events below -- preventing the default
// on a pointerdown does not stop it.
canvas.addEventListener('mousedown', e => { if (e.button === 1) e.preventDefault(); });
canvas.addEventListener('auxclick', e => { if (e.button === 1) e.preventDefault(); });

// Standing at any station at all. The click handler and the move handler ask the
// same question of the same list, so a station that answers one answers both.
const atStation = (x, y) =>
  nearBench(x, y) || nearSchool(x, y) || nearCasino(x, y) ||
  nearScrub(x, y) || nearQuarry(x, y) || nearFarm(x, y) || nearApothecary(x, y) || nearTower(x, y) ||
  nearHouse(x, y) || nearStats(x, y) || nearOuthouse(x, y);

canvas.addEventListener('pointerdown', e => {
  // Held, the yard does not answer to anything. A paused game you can still
  // swing at is not a paused game; the only live thing is the sheet saying so,
  // and that is over the canvas rather than on it.
  if (S.paused) return;
  // A cutscene running eats the click and ends: any click skips, and the click
  // does nothing else -- a swing taken while the camera is being handed back
  // is a swing at whatever happened to be under the cursor.
  if (skipCutscene()) return;
  // The right button picks somebody up and puts them down again, and does
  // nothing else at all -- see `lift`. It is checked before anything, because
  // it can never mean any of the things the left button means.
  // The middle button looks around and does nothing else, the same deal the
  // right button has with the crew. Checked before the left button's business
  // for the same reason: it can never mean any of those things.
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
  if (down.size === 2) { startPan(); return; }
  if (down.size > 2) return;

  const p = pos(e);
  S.mouse = p;
  // A press on the yard puts any open board away, whatever else it goes on to
  // mean. A board opens by being walked up to and closes by being walked away
  // from, which is right while the cursor is drifting -- but a *click* is
  // somebody deciding to do something, and if what they decided to do is swing
  // at the rock or pick a body up then the sheet in the corner is over.
  //
  // Before everything else, so it happens whether or not the click lands on
  // anything: clicking bare ground is still a decision to stop reading.
  if (!atStation(p.x, p.y)) showPanel(null, true);
  // the sky is checked first, though nothing up there is ever over the rock
  if (startle(p.x, p.y)) return;
  // then the rosters: they stand well under the ground line, where a click has
  // nothing else to mean, but they are still controls and go before the yard
  // A lever on a machine, before the ground behind it. It is the only control in
  // the yard that is not on a board, and it has to be caught here or a bought
  // machine can never be switched off by anybody but a dev hook.
  if (rosterHit(p.x, p.y)) return;
  // A cauldron is a control as well as a picture: clicking one drops open the
  // picker for what that pot brews (item 17). Before the ground behind it, for
  // the machine lever's reason -- it is a thing you press, and the ground is
  // what is left when you have not pressed anything.
  if (potPick(p.x, p.y)) return;
  if (overBoulder(p.x, p.y)) {                // false once the rock is finished
    // The top, at the nearest high point to where you clicked -- the same place
    // a held swing lands. Clicking is aiming at the rock, not at a cell of it:
    // a rock is worked from the top down whether you tap or lean on the button.
    const at = topOfRock(p.x) || p;
    knockOff(at.x, at.y, undefined, false);   // your own hands: no smoke
    S.mining = S.autoMine;                      // holding only mines once unlocked
    S.nextHit = now() + MINE_DELAY;
    try { canvas.setPointerCapture(e.pointerId); } catch {}
    return;
  }
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

  // The air notices a hand going through it. Measured on the glass rather than in
  // the yard, because that is where a mote lives: dragging the view along slides
  // the pointer across the world without moving it across the window, and it
  // should stir nothing.
  const r = canvas.getBoundingClientRect();
  const sx = e.clientX - r.left, sy = e.clientY - r.top;
  if (lastSx != null) stirAir(sx, sy, sx - lastSx, sy - lastSy);
  lastSx = sx; lastSy = sy;

  // and the smoke, which lives in the yard rather than on the glass -- so it is
  // stirred in world pixels, off how far the pointer moved across the *yard*
  const wm = pos(e);
  if (lastWx != null) stirSmoke(wm.x, wm.y, wm.x - lastWx, wm.y - lastWy);
  lastWx = wm.x; lastWy = wm.y;

  const wasWx = S.mouse ? S.mouse.x : null;
  S.mouse = pos(e);
  track(S.mouse.x, S.mouse.y);
  // there is no hovering on a touchscreen, so the board opens on a tap instead
  if (e.pointerType !== 'touch') {
    // wave7-crew: a body under the cursor stands still while it is looked at,
    // so the card over its head is read off somebody who is not walking away.
    // The stamp refreshes every move; the stage in crew/step.js does the rest.
    hoverAt(S.mouse.x, S.mouse.y);
    // A cauldron drops its brew picker open when you stand at it, the same way a
    // station's board does -- and it does not fight the boards for the cursor,
    // because the apothecary's board answers to the hut and the pots are the
    // other end of the building. See potpick.js.
    potHover(S.mouse.x, S.mouse.y);
    // One menu: whichever station the cursor is standing at, or none -- unless
    // it is on its way to the one already open, in which case it is still on it.
    // See `inSafeZone`.
    // The house goes last, and it is the only one whose order matters. Every
    // other station is a thing standing on the ground with its own patch around
    // it; the house is a block that grows a room per body, and its patch reaches
    // the bench. Whoever you are actually standing at should win, and next to a
    // wall of rooms that is the smaller thing, not the bigger one.
    const want = nearSchool(S.mouse.x, S.mouse.y) ? 'school'
               : nearCasino(S.mouse.x, S.mouse.y) ? 'casino'
               : nearScrub(S.mouse.x, S.mouse.y) ? 'scrub'
               : nearQuarry(S.mouse.x, S.mouse.y) ? 'quarry'
               : nearFarm(S.mouse.x, S.mouse.y) ? 'farm'
               : nearApothecary(S.mouse.x, S.mouse.y) ? 'apothecary'
               : nearTower(S.mouse.x, S.mouse.y) ? 'tower'
               : nearBench(S.mouse.x, S.mouse.y) ? 'bench'
               : nearOuthouse(S.mouse.x, S.mouse.y) ? 'outhouse'
               : nearHouse(S.mouse.x, S.mouse.y) ? 'house'
               // and the books over the pit, which are a patch of air rather
               // than a building: anything actually standing on the ground wins
               // over them, the same way the house comes after the rest
               : nearStats(S.mouse.x, S.mouse.y) ? 'stats' : null;
    // Standing at a station outranks being on the way to the open board.
    //
    // These have been swapped round twice now and both extremes are wrong. With
    // the wedge second, the station next door took the menu off you halfway down
    // to the corner of an open sheet -- there are six buildings and the walk
    // crosses whatever is between. With the wedge *first*, which is what it has
    // been, the board you already had glued itself in place: hover the bench,
    // then go and stand at the houses, and the bench stayed up because the
    // houses are inside the wedge on the way to it.
    //
    // The distinction is what the cursor is actually over. A station under the
    // pointer is not a journey, it is an arrival, and it takes the board every
    // time. The wedge is for the ground *between* things -- which is all it was
    // ever meant to protect -- so it only gets a say when the answer would
    // otherwise be "nothing".
    if (want) showPanel(want);
    else if (!inSafeZone(e.clientX, e.clientY)) showPanel(null);
    // and whatever the cursor is asking about, which is not the same question:
    // a board opens because you walked up to a station, a tooltip opens because
    // you went and looked at a mark
    askedAbout(S.mouse.x, S.mouse.y, e.clientX, e.clientY);
    setCursor(S.mouse.x, S.mouse.y);
  }
  // somebody on the cursor goes where the cursor goes
  const up = lifted();
  if (up) {
    // waggled back and forth rather than carried: counted while it is in your
    // hand and spent when you let go. See `shakeHeld`.
    if (wasWx != null) shakeHeld(up, S.mouse.x - wasWx);
    up.x = S.mouse.x - WORKER / 2;
    up.y = S.mouse.y - WORKER / 2;
    if (!(e.buttons & 2)) drop(up);            // the button let go somewhere else
    return;
  }
  if (e.buttons === 0 && (S.mining || S.dragging)) { endDrag(e); return; }
  if (S.dragging) sweep(S.mouse.x, S.mouse.y);
});

export function endDrag(e) {
  if (wheelPan !== null && (e.button === 1 || e.type !== 'pointerup')) wheelPan = null;
  const up = lifted();
  if (up) { drop(up); return; }
  const held = down.get(e.pointerId);
  down.delete(e.pointerId);
  if (down.size < 2) panning = null;

  // A tap on a touchscreen is what a hover is on a desk: near the bench it opens
  // the board, anywhere else it puts it away.
  if (held && held.kind === 'touch' && !panning &&
      Math.hypot(e.clientX - held.x0, e.clientY - held.y0) < TAP_SLOP &&
      now() - held.at < TAP_TIME) {
    // one board at a time: two of them open at once on a phone screen would
    // simply sit on top of each other
    const p = pos(e);
    if (nearBench(p.x, p.y)) showPanel(S.boardOpen ? null : 'bench', true);
    else if (nearSchool(p.x, p.y)) showPanel(S.schoolBoardOpen ? null : 'school', true);
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

// The cursor leaving the canvas is the cursor leaving everything it could have
// been asking about, so whatever label was up goes with it -- see D1. Left as
// a bare clear rather than routed through `askedAbout`: there is no longer a
// spot in the yard to ask about at all.
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
// D1 in wave-feedback3.md (#1): a label for whatever the cursor is over, in a
// word. `askedAbout` below already has richer tooltips for the handful of
// things worth more than a word -- a body's whole card, a stopped station's
// reason -- and those keep winning: a plain label is only shown once none of
// them has anything to say.
//
// One function, asked for a label and nothing else, and nothing about it draws
// anything -- it is a question about a spot in the yard, so a check can ask it
// directly with no mouse anywhere near it.
const inRect = (r, x, y) => !!r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;

// The cell a grid is holding at a world point, the same lookup `sweep` in
// hands.js makes for the brush: a column off `colOf`, a row counted up from
// the grid's own floor rather than down from its top.
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
  if (k === SHARD_CELL) return 'shard';
  if (k === SPORE_CELL) return 'spore';
  if (k === SPARK_CELL) return 'spark';
  return isDust(v) ? 'dust' : null;
}

// Every building that has a name on its own board, plus the two that do not
// (the rift). `standRect` answers "is it there, and where" for
// every one of them now -- including the farm and the quarry, whose shed is
// the whole answer to where you stand, where you click and where the board
// hangs (see #1, "Wave 3.1" in wave-feedback3.md; `standAt` in board.js).
const BUILDING_NAME = {
  bench: 'the bench', lab: 'the lab', school: 'the school', casino: 'the casino',
  scrub: 'the scrubbing house', quarry: 'the quarry', farm: 'the farm', tower: 'the tower'
};

function buildingAt(x, y) {
  for (const key in BUILDING_NAME) if (inRect(standRect(key), x, y)) return BUILDING_NAME[key];
  if (S.outhouseOpen && inRect(outhouse, x, y)) return "the janitor's closet";
  // the drowned pit: anywhere over the liquid answers as the abyss -- and
  // through the torn era, the disc itself answers as the rift
  if (S.drowned && x > pit.x && x < pit.x + pit.w && y > S.groundY) return 'the abyss';
  if (riftOpen() && !S.drowned && inRect(rift, x, y)) return 'the rift';
  return null;
}

// A machine has no rect exported anywhere the way a building does, so this is
// a padded box round the one point every machine already hands `specOf` --
// generous rather than exact, which is what the spec asks for on anything
// here with no cheap hit-test today.
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

// Muck and poop share one layer of columns (see MESS in smog.js) and stack to
// one height, so which word applies is which of the two is actually sitting
// there -- a body's own leavings named first, since that is the one a janitor
// is sent for and the one worth telling apart from what the weather dropped.
function messAt(x, y) {
  const c = colAt(x);
  const poo = poopCols()[c] || 0, muck = muckCols()[c] || 0;
  const n = poo + muck;
  if (!n) return null;
  const foot = muckFloor(c);
  if (y < foot - n * P || y > foot) return null;
  return poo ? 'poop' : 'muck';
}

// The pot: a heap of real sand in `table` (see casino.js), in the same shape
// of grid the floor and the hole are. It is asked the same way they are -- a
// cell under the cursor -- rather than as the whole strip of ground the grid
// reserves for it, which runs most of the width of the yard and would tag
// bare ground as the pot as readily as the pile actually sitting on it.
const potAt = (x, y) => S.casinoOpen && !!cellAt(table, x, y);

// A balloon's box, built the way `drawBalloons` in render.js draws one: the
// envelope's crown down to the basket, centred on the craft's own x.
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

// A plot's crop, once it has actually grown -- the same box `drawFarm` fills
// with a stalk and a mark, in render.js.
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

// The one function everything above exists for: what is at a spot, in a word,
// or nothing. Asked in the order a thing would actually catch your eye first --
// somebody moving, before the ground under them; a grain in a pile, before the
// building the pile stands beside; the rock and what is working it, before the
// weather lying on the ground next to them.
export function whatIsAt(x, y) {
  const w = lifted() || workerAt(x, y);
  if (w) return w.type;
  if (overCore(x, y)) return 'core';
  const grain = cellLabel(cellAt(floor, x, y) || cellAt(pit, x, y));
  if (grain) return grain;
  if (S.crew >= 1 && inRect(houseRect(), x, y)) return 'house';
  const building = buildingAt(x, y);
  if (building) return building;
  // wave7-crew: the mess before the rock it lies on. Poop lands on the rock's
  // flank as readily as on the yard, and the rock answered first for the whole
  // of its own footprint -- so the one patch a player is pointing at to have
  // cleared was the one patch the label refused to name.
  const mess = messAt(x, y);
  if (mess) return mess;
  if (overBoulder(x, y)) return 'rock';
  const machine = machineAt(x, y);
  if (machine) return machine;
  if (overBird(x, y)) return 'bird';
  if (potAt(x, y)) return 'pot';
  if (balloonAt(x, y)) return 'balloon';
  if (cropAt(x, y)) return 'food';
  return null;
}

// Recomputed every fourth call rather than every one: a label costs a handful
// of rects and a couple of grid lookups, cheap enough once a frame and not
// worth paying on every one of however many `pointermove` events a fast mouse
// fires between two of them. The one it last found stands in the gap, which
// is also what keeps it from flickering off between polls that would only
// have found the same thing again.
//
// But it is an answer about a SPOT, and it may only stand in for the spot it
// was an answer about. It used to be kept on the call count alone -- three
// calls in four handed back the last label wherever the cursor had got to --
// which is harmless while a mouse is drifting a few pixels and wrong the moment
// it jumps. And it jumps often: the camera glides out from under a still
// cursor, a touch lands somewhere new, a fresh game starts with the last game's
// answer still sitting in the variable. That last one is how a hover over bare
// sky three hundred pixels from the rock answered "the farm" -- the label had
// been cached over the farm's shed, in a different game, and nothing since had
// landed on a fourth call to replace it.
//
// So the cache is keyed on where it was taken. Within a cell of the same spot
// it stands, and the poll rate is what it was; a cursor that has moved further
// than that is asking a different question and gets it answered. A cell is the
// yard's own unit of "the same place" -- `whatIsAt` reads grains by cell -- so
// there is nothing to tune here.
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
// A board's sheet sits on top of the canvas in screen space, not the yard's --
// so whether the cursor is over it is a question about the page, and asked of
// it directly. Cheap because it is only asked while a board is actually open.
function overOpenBoard(cx, cy) {
  if (panelEl.hidden || cx == null) return false;
  const r = panelEl.getBoundingClientRect();
  return cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom;
}

// A stopped station says why, in the one place words are cheap: under the
// cursor, and only when the cursor goes looking.
//
// This stopped being called for a while. The three lines that opened the bench
// board, the lab board and this became one `showPanel`, and it went with them --
// the words, the element and the styling all still there, and nothing reaching
// them. A board opens because you walked up to a station; a tooltip opens
// because you went and looked at a mark. Two questions, asked separately.
// What a body has to say for itself: a name, an age, where it spends its time,
// and what it has shifted. None of it does anything -- there is no number here
// that feeds a rate -- it is there so that the four on the rock are four people
// rather than the number four.
function askedAbout(x, y, cx, cy) {
  // Somebody standing under the cursor comes first: they are the only thing in
  // the yard that moves, so a mark they happen to be over is a mark you can
  // still read a moment later.
  // Whoever is in your hand, or whoever is under the cursor. In your hand comes
  // first: a body being carried is the one you are asking about, and the ones it
  // is passing over are not.
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
  // Nothing has more to say than a word -- which is `whatIsAt`'s question, not
  // this one -- unless a board is standing over the same spot on the page, in
  // which case there is nothing to add to what it is already saying.
  if (overOpenBoard(cx, cy)) { showTipAt(null); return false; }
  const label = polledWhatIsAt(x, y);
  if (label) {
    showTipAt(label, (x - S.camX) * S.zoom + P * 2, (y - S.camY) * S.zoom - P * 2);
    return true;
  }
  showTip(null);
  return false;
}

// --- what the cursor says ------------------------------------------------------
// The yard is one canvas, so nothing drawn in it can carry a cursor of its own
// the way a button on a page does. Everything in here has to be asked, every
// time the mouse moves -- which is cheap, and worth it: a game where half the
// things on screen do something when you click them and none of them say so is a
// game you have to poke at to find out.
//
// Crosshair is the ground state, because the ground state of this game is aiming
// at a rock. Everything below is something else you can do instead.
const CURSORS = [
  // carrying something: the hand is closed
  [() => S.heldCore || S.dragging || lifted(), 'grabbing'],
  // a core lying about is the one thing here you pick up yourself
  [(x, y) => overCore(x, y), 'grab'],
  // the counts under a station, and the places with a board on them
  [(x, y) => overRoster(x, y), 'pointer'],
  [(x, y) => nearBench(x, y) || nearSchool(x, y) || nearCasino(x, y) ||
             nearHouse(x, y) || nearScrub(x, y) || nearQuarry(x, y) || nearFarm(x, y) ||
             nearApothecary(x, y) || nearTower(x, y) || nearStats(x, y) ||
             nearOuthouse(x, y), 'pointer'],
  // a mark that will tell you why something has stopped
  [(x, y) => overAnyMark(x, y), 'help'],
  // and a bird, which is a thing to notice rather than a thing to farm
  [(x, y) => overBird(x, y), 'pointer']
];

// The same three marks `askedAbout` shows a tooltip for, asked without showing
// one -- the cursor changes on the way *towards* the mark, and a tooltip that
// appeared at the same moment would be the yard answering a question nobody had
// finished asking.
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
  if (S.boardOpen) placeBoard();
}

canvas.addEventListener('wheel', e => {
  e.preventDefault();
  pan((Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * 0.8);
}, { passive: false });

// The cursor leaving the menu closes it -- unless it has left it towards the
// station it belongs to, which is the same wedge in the other direction: coming
// back down off the sheet is not walking away from it.
document.getElementById('panel').addEventListener('pointerleave', e => {
  if (!inSafeZone(e.clientX, e.clientY)) showPanel(null);
});
addEventListener('keydown', e => {
  // ctrl+R is the browser reloading, not the player asking for a new game
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  // There is no reset key. There used to be a bare r, dev builds only, and it
  // wiped a run with no way back for anybody playing off the dev server -- one
  // slip of a finger reaching for t or e. Erasing everything is the one act in
  // this game that must never be quicker than two deliberate clicks, so the
  // armed button in the corner is the whole of it. The checks reset through
  // __reset, which never went through the keyboard.
  // The yard stops where it is. Nothing is saved, nothing is skipped: the clock
  // simply does not advance, so a held game comes back exactly where it was left.
  if (e.code === 'Space' || e.key === ' ') {
    e.preventDefault();
    hold(!S.paused);
  }
  if (e.key === 'ArrowRight') pan(P * 12);
  if (e.key === 'ArrowLeft') pan(-P * 12);
});

// One flag, set here and read everywhere. The sheet that says so is not set
// here at all -- the frame keeps it in step with the flag, so anything that
// clears the flag (a reset, say) clears the sheet without knowing it exists.
export function hold(on) {
  S.paused = on;
  document.getElementById('held').hidden = !on;   // now, not next frame
  S.dirty = true;
}
document.getElementById('resume').addEventListener('click', () => hold(false));
