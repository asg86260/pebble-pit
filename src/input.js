// Wiring the mouse, the wheel and the keyboard to the game.
//
// Nothing in here decides anything: it turns an event into a call on somebody
// else's module.

import { msg } from './lang.js';
import { held as heldState } from './reset.js';
import { closeWindow } from './modal.js';
import { P, MINE_DELAY, WORKER, SHARD_CELL, SPORE_CELL, SPARK_CELL, findKind,
         FARM_H, TOSS_DELAY, THUMB, BRUSH } from './config.js';
import { S, bench, floor, pit, outhouse, rift, shack } from './state.js';
import { clampCam, unfollow, bindScroller, lookAt, lockScroller, toWorld, toScreen } from './world.js';
import { overBoulder, knockOff, topOfRock } from './rock.js';
import { sweep, release, track, dustUnder } from './hands.js';
import { startle, overBird } from './weather.js';
import { stirAir } from './air.js';
import { stirSmoke, airReadout } from './smog.js';
import { dialRect, dialZone } from './render/filter.js';
import { colAt, muckCols, poopCols, muckFloor } from './smog.js';
import { at, inside, colOf, bottomY, isDust } from './grid.js';
import { showPanel, placeBoard, showTip,
         showTipAt, inSafeZone, onMenu, standRect, openBoard } from './board.js';
import { station, stationAt, STATIONS, here, nearStation } from './stations.js';
import { overPileMark, pileMarkAt, overDoneMark, doneMarkAt } from './render.js';
import { statusAt } from './render/statusicons.js';
import { overChooseMark, chooseMarkAt } from './render/deep.js';
const CHOOSE_SAYS = msg('hover-choose');
import { markedPiles, fullSays } from './render/pilemarks.js';
import { doneName } from './works.js';
import { fadeIn, fadeOut } from './fade.js';
import { rosterHit, overRoster, rosterSays } from './roster.js';
import { overCount, countRect } from './render/counter.js';
import { potPick, potHover } from './potpick.js';
import { shutOpts } from './shop.js';
import { workerAt, lift, lifted, drop, shakeHeld } from './crew.js';
import { holdAt, dragArm, releaseArm, tapAt, leverUnder, signUnder } from './levers.js';
import { hoverAt, grabAt, inHand, holdBody } from './crew/pointer.js';
import './upgrades.js';
import { card } from './crewboard.js';
import { houseRect } from './house.js';
import { now } from './clock.js';
import { MACHINES, running, specOf } from './machines.js';
import { CRAFT, craftAt, BALLOON_W, BALLOON_H, BALLOON_BASKET, BALLOON_LINES } from './balloon.js';
import { plotX } from './farm.js';
import { riftOpen } from './rift.js';
import { skipCutscene, cutsceneRunning } from './cutscene.js';
import { holdSkip } from './skip.js';
import { markNoticesRead } from './notices.js';
import { sayStore, showPane, pane } from './settings.js';
import { isTap } from './tap.js';   // one definition of a tap for the whole page
import { reducedMotion } from './prefs.js';
import { goDeep, goUp, gliding } from './view.js';
import { isActView } from './acts.js';
import { portalAt, handAt, throughPortal } from './portals.js';
import { sayGoOn } from './actbeats.js';
import { onGoOn } from './render/portals.js';
import * as AFTER_PLACE from './after/index.js';
import { gestureDown, gestureMove, gestureUp, gestureHeld, gestureUnder, gestureHover, pressTaken } from './after/gestures.js';
import * as HELL_PLACE from './hell/index.js';
import { onShaftArrow } from './render/shaftway.js';
import { onPortal } from './render/portal.js';
import { clickDeep, onOrb } from './deep/serpent.js';
import { startleFauna, overFauna } from './deep/fauna.js';
import { nearestSeg, coilThick } from './deep/place.js';
import { stops, stopMid } from './stops.js';

const canvas = document.getElementById('c');

// Every finger currently down, so a second one can mean something different
// from the first.
const down = new Map();
let panning = null;                        // where the fingers were last frame
// The middle button's pan. Apart from `panning` because it is one pointer, and
// must not be cancelled by the "fewer than two fingers" rule.
let wheelPan = null;
// One finger on the yard scrolls it, with the platform's own momentum
// (DESIGN.md, "Momentum scrolling"): the canvas sits inside a scroller, a
// finger the game did not claim at `touchstart` scrolls it natively, coast
// and rubber band and all, and the game reads where it got to (world.js,
// `readScroll`). The one decision here is which touches are the game's, and
// it is made at `touchstart` below, where the platform commits: a finger
// that lands on dust is a sweep for its whole length, whatever it passes
// over, so a long sweep toward the pit never turns into a scroll halfway.
// The elements are bound here because the rule for a view that has moved
// (`viewTaken`) is this file's.
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
  return toWorld(e.clientX - r.left, e.clientY - r.top);
}

// The right button belongs to the crew, so the browser's menu is not wanted.
canvas.addEventListener('contextmenu', e => e.preventDefault());

// The browser's middle-button autoscroll starts on `mousedown`; preventing the
// default on a pointerdown does not stop it.
canvas.addEventListener('mousedown', e => { if (e.button === 1) e.preventDefault(); });
canvas.addEventListener('auxclick', e => { if (e.button === 1) e.preventDefault(); });

// The constrict's orb hangs inside its fighter's station ground, and is the
// thing to press there: a board opened under it would cover it and its bar.
const overOrb = (x, y) => S.view === 'deep' && !!onOrb(x, y);
// The station whose board the pointer asks for: the hover, the click and the
// tap all ask this one.
const boardAt = (x, y) => (overOrb(x, y) ? null : stationAt(x, y));
// Standing at any station at all; the click and move handlers ask the same
// table.
const atStation = (x, y) => boardAt(x, y) !== null;

const onCoil = (x, y) => {
  if (S.view !== 'deep') return false;
  const near = nearestSeg(x, y, now());
  return near.d <= coilThick(near.seg);
};

canvas.addEventListener('pointerdown', e => {
  // Held, the yard does not answer to anything.
  if (S.paused) return;
  // A click skips a running cutscene and does nothing else: a swing taken
  // while the camera is being handed back lands on whatever is under it.
  if (skipCutscene()) return;
  wheelOwed = 0;                             // a hand on the yard takes the view from the wheel
  // The middle button looks around and the right button looks at the crew;
  // neither can mean any of the things the left button means.
  if (e.button === 1) {
    wheelPan = e.clientX;
    try { canvas.setPointerCapture(e.pointerId); } catch {}
    return;
  }
  // The right button, held, looks at the crew until it is let go; it lifts
  // nobody by itself (the owner, 2026-10-09).
  if (e.button === 2) {
    S.crewSight = now();
    try { canvas.setPointerCapture(e.pointerId); } catch {}
    return;
  }
  // With the right button held, the left takes the body under the hand, for
  // as long as both are down.
  if (e.button === 0 && S.crewSight != null) {
    const p = pos(e);
    const w = grabAt(p.x, p.y);
    if (w) {
      lift(w);
      try { canvas.setPointerCapture(e.pointerId); } catch {}
      return;
    }
  }
  down.set(e.pointerId, { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY,
                          at: now(), kind: e.pointerType });
  // A second finger while a sweep is on: the pair look about through the
  // game's own pan (the touchstart gate has claimed both from the platform).
  // With no sweep on, two fingers are the platform's and scroll natively.
  if (down.size === 2) { if (S.dragging) startPan(); return; }
  if (down.size > 2) return;

  const p = pos(e);
  S.mouse = p;
  // A click off a station puts any open board away, whatever else it means:
  // a click is a decision to stop reading. Before everything else, so it
  // happens whether or not the click lands on anything. A finger is judged
  // at the release instead (`endDrag`): a press that turns into a scroll is
  // not a decision to stop reading.
  if (!atStation(p.x, p.y) && e.pointerType !== 'touch') showPanel(null, true);
  // The camera between the halves answers nothing until it is in one. Then
  // the way through the surface, the arrow at the shaft (the corner's square
  // is the other way; the surface and the sky themselves take no click);
  // and in the deep a click is the serpent's first, the way one in the yard
  // is the rock's, and only the ordinary handling's if it missed the coil.
  if (gliding()) return;
  // The acts' portals, at whichever end is on screen, and their hands: the
  // camera through by the ripple (portals.js). The go-on card over the house.
  const way = portalAt(p.x, p.y) || handAt(p.x, p.y);
  if (way && throughPortal(way)) return;
  if (onGoOn(p.x, p.y) && sayGoOn()) return;
  // The acts' places: a click up there is the afterlife's (after/index.js,
  // `clickAfter`), down in hell hell's (hell/index.js, `clickHell`), each
  // asked only once its act's track exports it; nothing of the yard's stands
  // in either.
  if (isActView(S.view)) {
    // Up there a press on a station's moving part works it where it stands
    // (after/gestures.js) and is held until the release, wherever that is;
    // a plain click on a station opens its board, as the yard's do. A finger
    // opens a board at its tap's release (`endDrag`), since a press may be
    // the start of a swipe. Anything else is the place's click.
    // The rosters under the stations first: the yard's own (roster.js), a
    // press on a button never a swing at what stands behind it.
    if (rosterHit(p.x, p.y)) return;
    if (S.view === 'after' && gestureDown(p.x, p.y)) {
      if (gestureHeld()) try { canvas.setPointerCapture(e.pointerId); } catch {}
      return;
    }
    // Down there the pick's blow on a face or a barrier is the hand's, asked
    // before the station's board, which a walk-up has opened already.
    if (S.view === 'hell' && HELL_PLACE.clickHell(p.x, p.y)) return;
    const at = boardAt(p.x, p.y);
    if (at) { if (e.pointerType !== 'touch') showPanel(at, true); return; }
    if (S.view === 'after' && typeof AFTER_PLACE.clickAfter === 'function') AFTER_PLACE.clickAfter(p.x, p.y);
    return;
  }
  if (onShaftArrow(p.x, p.y)) { if (S.view === 'deep') goUp(); else goDeep(); return; }
  if (onPortal(p.x, p.y)) { if (S.view === 'deep') goUp(); else goDeep(); return; }
  if (S.view === 'deep' && clickDeep(p.x, p.y)) return;
  // A creature of the deep, a zone's or the stream's, startles as a bird
  // does, unless a station stands over it: the station is drawn in front, so
  // the click is the station's.
  if (S.view === 'deep' && !atStation(p.x, p.y) && startleFauna(p.x, p.y)) return;
  // the sky first, though nothing up there is ever over the rock
  if (startle(p.x, p.y)) return;
  // then the controls that stand in the yard, before the ground behind them:
  // the rosters and the machine levers, then the cauldrons' pickers
  if (rosterHit(p.x, p.y)) return;
  // The casino's arm: a press on it, pointer or finger, grabs it, the drag
  // works it and the release lets it go, wherever that is. The sign: a click drops
  // the stake at once; a finger is judged at the release, through the
  // page's one tap gate, since a press there may be the start of a scroll.
  if (holdAt(p.x, p.y)) { try { canvas.setPointerCapture(e.pointerId); } catch {} return; }
  if (e.pointerType !== 'touch' && tapAt(p.x, p.y)) return;

  if (potPick(p.x, p.y)) return;
  if (overBoulder(p.x, p.y)) {                // false once the rock is finished
    // The nearest high point to the click, the same place a held swing lands:
    // a rock is worked from the top down.
    const at = topOfRock(p.x) || p;
    knockOff(at.x, at.y, undefined, false);   // your own hands: no smoke
    S.handChipped = true;
    S.mining = S.autoMine;                      // holding only mines once unlocked
    S.nextHit = now() + MINE_DELAY;
    try { canvas.setPointerCapture(e.pointerId); } catch {}
    return;
  }
  // A finger off the dust is the platform's: it scrolls the view if it
  // moves, and a tap is read at the release. A mouse keeps its left button
  // for the sweep everywhere. The same reach as the touchstart gate, so
  // the two never disagree about one finger.
  if (e.pointerType === 'touch' && !dustUnder(p.x, p.y, fingerReach())) return;
  S.dragging = true;
  S.nextToss = now() + TOSS_DELAY;         // a held sweep throws by itself once unlocked
  S.trail = [];
  track(p.x, p.y);
  try { canvas.setPointerCapture(e.pointerId); } catch {}
  sweep(p.x, p.y);
});

canvas.addEventListener('pointermove', e => {
  const held = down.get(e.pointerId);
  if (held) { held.x = e.clientX; held.y = e.clientY; }

  // A second button pressed while one is already down arrives as a move,
  // not a press (Pointer Events: a chord): the left going down with the
  // right held takes the body under the hand.
  if (S.crewSight != null && e.button === 0 && (e.buttons & 3) === 3 && !inHand()) {
    const p = pos(e);
    const w = grabAt(p.x, p.y);
    if (w) { S.mouse = p; lift(w); setCursor(p.x, p.y); return; }
  }

  if (wheelPan !== null) {                   // middle button: drag the view along
    pan((wheelPan - e.clientX) / S.zoomShow);
    wheelPan = e.clientX;
    return;
  }

  if (panning && down.size >= 2) {           // two fingers: drag the view along
    const now = middle();
    pan((panning.x - now.x) / S.zoomShow);
    panning = now;
    return;
  }
  // the arm in hand follows the pointer, and nothing else reads the drag
  if (S.holding) { const p = pos(e); S.mouse = p; dragArm(p.x, p.y); return; }
  // and so does a station up there under the hand's motion
  if (gestureHeld()) { const p = pos(e); S.mouse = p; gestureMove(p.x, p.y); return; }

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
    // with the right button held, a body under the cursor walks slow; the
    // stage in crew/step.js does the rest
    if (S.crewSight != null && !(e.buttons & 2)) S.crewSight = null;
    hoverAt(S.mouse.x, S.mouse.y);
    potHover(S.mouse.x, S.mouse.y);
    gestureHover(S.mouse.x, S.mouse.y);
    // The table's order settles which wins where two patches overlap.
    const want = boardAt(S.mouse.x, S.mouse.y);
    // Standing at a station outranks being on the way to the open board: a
    // station under the pointer is an arrival, and the wedge is for the ground
    // *between* things, so it only has a say when the answer would otherwise
    // be nothing. Unless the cursor is on the menu itself: the strip between
    // the board and the crew list is bare canvas over whatever station is next
    // along, and crossing it is reading the menu, not arriving.
    if (want && !onMenu(e.clientX, e.clientY)) showPanel(want);
    // The orb is reached across its station's ground, which opened the board
    // over it: it goes at once, not after the linger or the wedge.
    else if (overOrb(S.mouse.x, S.mouse.y)) showPanel(null, true);
    else if (!inSafeZone(e.clientX, e.clientY)) showPanel(null);
    // a board opens because you walked up to a station, a tooltip because you
    // went and looked at a mark
    askedAbout(S.mouse.x, S.mouse.y, e.clientX, e.clientY);
    setCursor(S.mouse.x, S.mouse.y);
  }
  // somebody on the cursor goes where the cursor goes
  const up = inHand();
  if (up) {
    // waggled back and forth: counted in the hand, spent on the drop
    // (`shakeHeld`)
    if (wasWx != null) shakeHeld(up, S.mouse.x - wasWx);
    holdBody(up, S.mouse.x, S.mouse.y);
    if ((e.buttons & 3) !== 3) drop(up);       // either button let go somewhere else
    return;
  }
  if (e.buttons === 0 && (S.mining || S.dragging)) { endDrag(e); return; }
  if (S.dragging) sweep(S.mouse.x, S.mouse.y);
});

export function endDrag(e) {
  if (wheelPan !== null && (e.button === 1 || e.type !== 'pointerup')) wheelPan = null;
  if (!(e.buttons & 2) && S.crewSight != null) {  // the right button let go
    S.crewSight = null;
    if (S.mouse) setCursor(S.mouse.x, S.mouse.y);
  }
  // the arm let go, wherever the pointer has got to, and any station's motion
  releaseArm();
  if (gestureHeld()) { const p = pos(e); gestureUp(p.x, p.y); }
  const up = inHand();
  if (up) { drop(up); return; }
  const held = down.get(e.pointerId);
  down.delete(e.pointerId);
  if (down.size < 2) panning = null;

  // A tap on a touchscreen is what a hover is on a desk: at a station it
  // opens (or shuts) the board, anywhere else it puts it away. A tap is a
  // release (tap.js): a touch the platform took for a scroll is cancelled,
  // not released, and closes nothing.
  if (held && held.kind === 'touch' && !panning && e.type === 'pointerup' &&
      isTap(held.x0, held.y0, e.clientX, e.clientY, now() - held.at)) {
    const p = pos(e);
    if (tapAt(p.x, p.y)) { S.mining = false; return; }
    // Up there a tap the hand work took is no tap on a station.
    const which = S.view === 'after' && pressTaken() ? null : boardAt(p.x, p.y);
    // A second tap on the station whose board is up puts it away.
    showPanel(which && !S[station(which).board] ? which : null, true);
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
// The cursor answers a press or a release where it happens, not on the next
// move: a hand closes the moment a button goes down. After the handlers above
// have said what the press was.
for (const type of ['pointerdown', 'pointerup'])
  canvas.addEventListener(type, () => { if (S.mouse) setCursor(S.mouse.x, S.mouse.y); });
addEventListener('blur', () => {
  S.crewSight = null;
  down.clear();
  panning = null;
  wheelPan = null;
  S.mining = false;
  releaseArm();
  gestureUp();
  if (S.dragging) { S.dragging = false; release(S.mouse.x, S.mouse.y); }
});

// The cursor leaving the canvas takes any label with it.
canvas.addEventListener('pointerleave', () => { showTipAt(null); gestureHover(null); });


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
  const k = findKind(v);
  if (k === SHARD_CELL) return msg('hover-ore');
  if (k === SPORE_CELL) return msg('hover-crop');
  if (k === SPARK_CELL) return msg('hover-spark');
  return isDust(v) ? msg('hover-pebble') : null;
}

// Every building `standRect` (board.js) answers "is it there, and where" for.
function buildingAt(x, y) {
  // Every standing place by its own row's name (`STATIONS`).
  for (const r of STATIONS) {
    if (!r.name || !r.stand || !here(r) || !r.open()) continue;
    // A station that sells from a sign is worked by hand where it stands, and
    // a label over it there is in the way of the work (the owner,
    // 2026-10-21); its board says its name.
    if (r.sign) continue;
    // a row that says its hit is named over what is drawn there
    if (r.hit) { if (nearStation(r.key, x, y)) return r.name; continue; }
    const rect = standRect(r.key);
    if (rect && inRect(rect, x, y)) return r.name;
  }
  // the drowned pit answers as the abyss; through the torn era, the disc
  // answers as the rift
  if (S.drowned && x > pit.x && x < pit.x + pit.w && y > S.groundY) return msg('hover-abyss');
  if (riftOpen() && !S.drowned && inRect(rift, x, y)) return msg('hover-rift');
  return null;
}

// A machine has no rect exported, so this is a generous box round the point
// `specOf` hands out.
const MACHINE_NAME = { jaw: msg('machine-jaw'), ram: msg('machine-ram'), tiller: msg('machine-tiller'), belt: msg('machine-belt') };
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
  return poo ? msg('hover-poop') : msg('hover-muck');
}

// A balloon's box, where render/balloon.js draws it: at its size, among the
// clouds or at its post.
function balloonAt(x, y) {
  if (!S.filterOpen) return false;
  for (let i = 0; i < CRAFT.length; i++) {
    const a = craftAt(i);
    const top = a.y - (BALLOON_BASKET + BALLOON_LINES + BALLOON_H) * a.s;
    const half = BALLOON_W / 2 * a.s;
    if (x >= a.x - half && x <= a.x + half && y >= top && y <= a.y + P * 2 * a.s) return true;
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

// A body reads as what it is.
const TYPE_SAID = {
  rockhand: msg('hover-rockhand'),
  hauler: msg('hover-hauler'),
  quarrier: msg('hover-quarrier'),
  farmhand: msg('hover-farmhand'),
  scholar: msg('hover-scholar'),
  purifier: msg('hover-purifier'),
  stirrer: msg('hover-stirrer'),
  janitor: msg('hover-janitor'),
  wizard: msg('hover-wizard'),
  builder: msg('hover-builder'),
  fighter: msg('hover-fighter'),
  gatherer: msg('hover-gatherer'),
  delver: msg('hover-delver'),
};

// What is at a spot, in a word, or nothing. Asked in the order a thing would
// catch your eye: somebody moving before the ground under them, a grain before
// the building the pile stands beside.
export function whatIsAt(x, y) {
  const w = lifted() || workerAt(x, y);
  if (w) return TYPE_SAID[w.type] || w.type;
  // Down there nothing of the yard is under the pointer: the way up, and the
  // serpent.
  // The arrow at the portal stands in both halves.
  if (onShaftArrow(x, y)) return S.view === 'deep' ? msg('other-corner-up') : msg('other-corner-down');
  if (onPortal(x, y)) return S.view === 'deep' ? msg('hover-portal-up') : msg('hover-portal-down');
  if (S.view === 'deep') {
    if (onCoil(x, y)) return msg('hover-serpent');
    return null;
  }
  const grain = cellLabel(cellAt(floor, x, y) || cellAt(pit, x, y));
  if (grain) return grain;
  if (S.crew >= 1 && inRect(houseRect(), x, y)) return msg('hover-house');
  const building = buildingAt(x, y);
  if (building) return building;
  // the mess before the rock it lies on: poop lands on the rock's flank, and
  // the rock would otherwise answer for the whole of its footprint
  const mess = messAt(x, y);
  if (mess) return mess;
  if (overBoulder(x, y)) return msg('hover-rock');
  const machine = machineAt(x, y);
  if (machine) return machine;
  if (overBird(x, y)) return msg('hover-bird');
  if (balloonAt(x, y)) return msg('hover-balloon');
  if (cropAt(x, y)) return msg('hover-crop');
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
    const at = toScreen(w.x + WORKER + P * 2, w.y - P * 3);
    showTipAt(card(w), at.x, at.y);
    return true;
  }
  for (const p of markedPiles()) {
    if (!S.pileFull[p.key] || !overPileMark(p.key, x, y)) continue;
    showTip(fullSays(p.key), pileMarkAt(p.key));
    return true;
  }

  const roster = rosterSays(x, y);
  if (roster) {
    showTip(roster.text, roster.at);
    return true;
  }

  // A station whose Recruit still waits on its first choice says so.
  const waiting = overChooseMark(x, y);
  if (waiting) {
    const m = chooseMarkAt(waiting);
    showTip(CHOOSE_SAYS, { x: m.x + m.w / 2, y: m.y + m.h });
    return true;
  }

  const finished = overDoneMark(x, y);
  if (finished) {
    showTip(doneName(finished), doneMarkAt(finished));
    return true;
  }
  // A board over the same spot has nothing to add to.
  if (overOpenBoard(cx, cy)) { showTipAt(null); return false; }
  // A status's icon, under the serpent's bar or up a station's post.
  const icon = cx != null && statusAt(cx, cy);
  if (icon) {
    showTipAt(icon.text, icon.x + icon.w / 2, icon.y + icon.h + 8, true);
    return true;
  }
  // The air filter's gauge: the band the needle is in and which way it is
  // going. How full and how fast are the books' business.
  if (inRect(dialRect(), x, y)) {
    const r = dialRect(), a = airReadout();
    const way = a.fouling > a.filtering ? msg('hover-dial-worse') : a.filtering > a.fouling ? msg('hover-dial-better') : msg('hover-dial-steady');
    showTip(msg('hover-dial', { zone: dialZone(), way }), { x: r.x + r.w / 2, y: r.y + r.h });
    return true;
  }
  // The counter says what it counts: nothing else names the coin.
  if (overCount(cx, cy)) {
    const r = countRect();
    showTipAt(msg('hover-counter'), r.x + r.w / 2, r.y - P * 5, true);
    return true;
  }
  const label = polledWhatIsAt(x, y);
  if (label) {
    const at = toScreen(x, y);
    showTipAt(label, at.x + P * 2, at.y - P * 2);
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
  [() => S.dragging || inHand(), 'grabbing'],
  // the right button held, looking at the crew: the hand open, ready to take
  // one, and closed while the left is down too (the owner, 2026-10-09)
  [() => S.crewSight != null && S.mining, 'grabbing'],
  [() => S.crewSight != null, 'grab'],
  // the counts under a station, and the places with a board on them
  [(x, y) => overRoster(x, y), 'pointer'],
  // the way through the surface, from either side, and the serpent to hit
  [(x, y) => onShaftArrow(x, y) || onPortal(x, y) || onCoil(x, y) || overOrb(x, y), 'pointer'],
  // the acts' portals and their hands, asked as the press is (heaven's gates
  // only once they are the player's to take)
  [(x, y) => !gliding() && !!(portalAt(x, y) || handAt(x, y)), 'pointer'],
  // up in act 3, a part the hand works: open on it, closed while it is held
  [() => gestureHeld(), 'grabbing'],
  [(x, y) => S.view === 'after' && gestureUnder(x, y), 'grab'],
  [(x, y) => atStation(x, y), 'pointer'],
  // a mark that will tell you why something has stopped
  [(x, y) => overAnyMark(x, y), 'help'],
  [(x, y) => inRect(dialRect(), x, y), 'help'],
  [(x, y) => overBird(x, y), 'pointer'],
  [(x, y) => S.view === 'deep' && overFauna(x, y), 'pointer']
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

// Exported for the pad's right stick (pad.js), which pans the same way.
export function pan(dx) {
  S.camTo = null;                          // the player takes the view back
  unfollow();                              // including from whoever it was on
  const was = S.camX;
  S.camX += dx;
  clampCam();
  if (S.camX === was) return;
  viewTaken();
}

// The player has moved the view -- by a drag, the wheel, the keys or the
// platform's own fling (world.js reads that back and calls this). A board
// comes down when its station is scrolled out of the window: a sheet that
// follows you two windows off it is a menu that will not go away.
export function viewTaken() {
  const open = openBoard();
  if (!open) return;
  const r = standRect(open);
  if (r && (r.x + r.w < S.camX || r.x > S.camX + S.viewW)) showPanel(null, true);
  else placeBoard();
}
bindScroller(scroller, spacer, viewTaken);

// --- which touches are the game's --------------------------------------------
// The platform commits to scrolling at `touchstart`, so the game decides
// there too: a finger on dust is a sweep and the touch is claimed, which
// cancels the platform's scroll for that touch and nothing else, however far
// it then travels; a finger on anything else is left to the platform, which
// scrolls. A second finger landing while a sweep is on is claimed too, so
// two fingers on a heap pan through the game's own `panning` rather than
// half through the platform. Not passive, on purpose: a passive listener
// cannot say no -- and on the window rather than the canvas: a listener on
// the canvas alone left the platform treating the touch as uncancelable
// (measured over the protocol, tools/fling.mjs), and only a blocking
// listener at the window made the touch the page's to refuse.
// How far, in cells, a finger claims dust from: a thumb's width on the
// glass (`THUMB`), never less than the brush itself. A press that lands a
// little off the pile is still a sweep, since the thumb's contact point is
// not where the player sees it; only clear ground and sky scroll.
const fingerReach = () => Math.max(BRUSH, Math.ceil(THUMB / (S.zoomShow * P)));
// Claiming is two things, because saying no was not enough on its own:
// iPhone Safari, with the game framed in itch's page, went on scrolling the
// yard under a sweep whose touchstart and every touchmove had been refused
// (2026-09-17, 2026-09-20). So the scroller is also shut for the length of
// the claimed touch -- a scroller that cannot scroll has nothing for the
// platform to commit to -- and opened again when the last finger lifts. A
// finger the game did not claim never shuts it, so the platform's own
// scroll is untouched.
let claimed = false;
function claim(e) {
  e.preventDefault();
  if (claimed) return;
  claimed = true;
  lockScroller(true, 'touch');
}
addEventListener('touchstart', e => {
  if (e.target !== canvas) return;
  if (S.paused || cutsceneRunning()) return;
  if (S.dragging) { claim(e); return; }
  for (const t of e.changedTouches) {
    const p = pos(t);
    // ...and a finger on the casino's arm, or on its sign while it is a
    // button: a hold on the arm must never scroll the page
    if (dustUnder(p.x, p.y, fingerReach()) || leverUnder(p.x, p.y) || signUnder(p.x, p.y)) { claim(e); return; }
    // ...and on a station up there worked by its motion: a drag on it is the motion
    if (S.view === 'after' && gestureUnder(p.x, p.y)) { claim(e); return; }
  }
}, { passive: false });
addEventListener('touchmove', e => {
  if (e.target !== canvas) return;
  if (S.dragging || S.holding || gestureHeld()) e.preventDefault();
}, { passive: false });
const unclaim = e => {
  if (!claimed || e.touches.length) return;
  claimed = false;
  lockScroller(false, 'touch');
};
addEventListener('touchend', unclaim);
addEventListener('touchcancel', unclaim);

// The wheel: a vertical wheel is the yard's own sideways pan, as it always
// was. A sideways delta -- a trackpad's two-finger swipe -- is left to the
// platform, which scrolls the scroller with its own momentum. A notch is
// owed rather than taken: `stepPan` eases the view through it over a few
// frames, the way a page smooth-scrolls, instead of jumping the whole notch
// at once. Instant under reduced motion, as a page is.
canvas.addEventListener('wheel', e => {
  if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
  e.preventDefault();
  const d = e.deltaY * WHEEL_GAIN;
  if (reducedMotion()) pan(d);
  else wheelOwed += d;
}, { passive: false });

// The cursor leaving the menu closes it, unless it left toward the station:
// the same wedge in the other direction. A cursor, never a finger: a touch
// does not leave, it ends, and the platform raises its leave from wherever
// the finger lifted -- a scroll of the rows that ended over the yard read
// as the cursor walking off the board and shut the sheet.
document.getElementById('panel').addEventListener('pointerleave', e => {
  if (e.pointerType === 'touch') return;
  if (!inSafeZone(e.clientX, e.clientY)) showPanel(null);
});
addEventListener('keydown', e => {
  // ctrl+R is the browser reloading
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  // No reset key: erasing a yard must never be quicker than a save's delete
  // and its confirm. Escape holds the yard; a list
  // standing open on a board, then an open window, answers to it first, so
  // the key never does two things at once. A held yard lets go first of all:
  // the held sheet stands over the window.
  if (e.key === 'Escape') {
    e.preventDefault();
    if (shutOpts()) return;
    if (!S.paused && closeWindow()) return;
    hold(!S.paused);
  }
  // The letters and the digits only while not typing: the settings sheet
  // has a box a save is pasted into.
  const key = typing(e.target) ? '' : e.key;
  // The arrows and A/D pan while held (stepPan, once a frame) rather
  // than hopping on every repeat the platform sends: a held key slides
  // the view at one speed instead of stuttering at the repeat rate.
  const dir = panDir(e, key);
  if (dir) { if (key) e.preventDefault(); if (!e.repeat) keysHeld.add(dir); }
  // A digit jumps the view to a place: 1 is the rock, 2 onward the buildings
  // standing along from it, in yard order.
  if (key.length === 1 && key >= '1' && key <= '9') jumpTo(+key - 1);
  // `i` is the index: the held sheet straight on its page, and again to put
  // the sheet away. Held on another page, it turns to the index.
  if ((key === 'i' || key === 'I') && !e.repeat) {
    if (S.paused && pane() === 'index') hold(false);
    else { if (!S.paused) hold(true); showPane('index'); }
  }
  // Space, held, skips the running scene (skip.js); the browser's repeats are
  // ignored. Not while typing: the settings sheet has a box a save is pasted
  // into.
  if (e.key === ' ' && !typing(e.target)) {
    e.preventDefault();
    if (!e.repeat) holdSkip(true);
  }
});
addEventListener('keyup', e => {
  if (e.key === ' ') holdSkip(false);
  const dir = panDir(e, e.key);
  if (dir) keysHeld.delete(dir);
});
addEventListener('blur', () => { keysHeld.clear(); wheelOwed = 0; });   // a key let go on another window never arrives

// --- panning by key -----------------------------------------------------------
// Which way a key pans, or '' for a key that does not.
function panDir(e, key) {
  if (e.key === 'ArrowRight' || key === 'd' || key === 'D') return 'right';
  if (e.key === 'ArrowLeft' || key === 'a' || key === 'A') return 'left';
  return '';
}
const keysHeld = new Set();
const KEY_PAN = 0.5;                          // views a second, held: the same feel at any zoom
const WHEEL_GAIN = 1.0;                       // world units a pixel of wheel delta is worth
let wheelOwed = 0;                            // held: world units the wheel has asked for and not yet had
const WHEEL_EASE = 80;                        // ms for the owed distance to fall to 1/e
heldState('wheel', () => { wheelOwed = 0; });
let panAt = 0;
// One frame of the keys and the wheel: the view slides at KEY_PAN while
// either key is down (still when both are), and eases through whatever the
// wheel is owed. On the wall clock, not the yard's: a held yard pans too
// (main.js, every frame).
export function stepPan() {
  const t = performance.now();
  const dt = Math.min(100, t - panAt);       // a tab-out is not one long frame
  panAt = t;
  const dir = (keysHeld.has('right') ? 1 : 0) - (keysHeld.has('left') ? 1 : 0);
  if (dir) pan(dir * KEY_PAN * S.viewW * dt / 1000);
  if (wheelOwed) {
    // the last couple of units at once: a glide that creeps a pixel a frame
    // to the very end reads as a stuck wheel
    const step = Math.abs(wheelOwed) < 2 ? wheelOwed : wheelOwed * (1 - Math.exp(-dt / WHEEL_EASE));
    const was = S.camX;
    pan(step);
    // the rest, unless the edge took it: a notch into the wall is spent
    wheelOwed = S.camX === was ? 0 : wheelOwed - step;
  }
}

// The places a digit can send the view: the rock, then every building that
// stands today, right to left. Read on the press rather than kept, off the
// one list the hop arrows and the pad walk (stops.js), so a building that
// went up since is on the list by existing. The noticeboard is furniture,
// not a place, and stands in the house's own gap anyway. The rock is where
// it stands even between rocks, which the stops' own rock box is not.
function jumpStops() {
  const places = stops().filter(s => s.kind === 'station' && s.key !== 'stats').map(stopMid);
  return [S.cx, ...places.sort((p, q) => q - p)];
}
function jumpTo(i) {
  const x = jumpStops()[i];
  if (x == null) return;
  unfollow();
  lookAt(x);
  viewTaken();
}
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
}
document.getElementById('resume').addEventListener('click', () => hold(false));
