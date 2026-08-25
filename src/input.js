// Wiring the mouse, the wheel and the keyboard to the game.
//
// Nothing in here decides anything: it turns an event into a call on somebody
// else's module. If a new site needs a click, it gets a branch here and its own
// file for the behaviour.

import { P, MINE_DELAY, WORKER } from './config.js';
import { S, bench } from './state.js';
import { clampCam } from './world.js';
import { overBoulder, knockOff } from './rock.js';
import { sweep, release, track, overCore } from './hands.js';
import { startle, overBird } from './weather.js';
import { nearBench, nearLab, nearSchool, nearCasino, showPanel, placeBoard, showTip } from './board.js';
import { overPileMark, pileMarkAt, overLabMark, labMarkAt,
         overPitMark, pitMarkAt } from './render.js';
import { doneName } from './lab.js';
import { reset } from './persist.js';
import { rosterHit, overRoster } from './roster.js';
import { mineMs } from './upgrades.js';
import { pitFull } from './pit.js';
import { now } from './clock.js';

const canvas = document.getElementById('c');
const resetEl = document.getElementById('reset');

// Every finger currently down, so a second one can mean something different
// from the first. A mouse only ever has one, so none of this gets in its way.
const down = new Map();
let panning = null;                        // where the fingers were last frame
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

export function pos(e) {
  const r = canvas.getBoundingClientRect();
  return {
    x: (e.clientX - r.left) / S.zoom + S.camX,
    y: (e.clientY - r.top) / S.zoom + S.camY
  };
}

canvas.addEventListener('pointerdown', e => {
  down.set(e.pointerId, { x: e.clientX, y: e.clientY, x0: e.clientX, y0: e.clientY,
                          at: now(), kind: e.pointerType });
  if (down.size === 2) { startPan(); return; }
  if (down.size > 2) return;

  const p = pos(e);
  S.mouse = p;
  // the sky is checked first, though nothing up there is ever over the rock
  if (startle(p.x, p.y)) return;
  // then the rosters: they stand well under the ground line, where a click has
  // nothing else to mean, but they are still controls and go before the yard
  if (rosterHit(p.x, p.y)) return;
  if (overBoulder(p.x, p.y)) {                // false once the rock is finished
    knockOff(p.x, p.y);
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

  if (panning && down.size >= 2) {           // two fingers: drag the view along
    const now = middle();
    pan((panning.x - now.x) / S.zoom);
    panning = now;
    return;
  }

  S.mouse = pos(e);
  track(S.mouse.x, S.mouse.y);
  // there is no hovering on a touchscreen, so the board opens on a tap instead
  if (e.pointerType !== 'touch') {
    // one menu: whichever station the cursor is standing at, or none
    showPanel(nearLab(S.mouse.x, S.mouse.y) ? 'lab'
            : nearSchool(S.mouse.x, S.mouse.y) ? 'school'
            : nearCasino(S.mouse.x, S.mouse.y) ? 'casino'
            : nearBench(S.mouse.x, S.mouse.y) ? 'bench' : null);
    // and whatever the cursor is asking about, which is not the same question:
    // a board opens because you walked up to a station, a tooltip opens because
    // you went and looked at a mark
    askedAbout(S.mouse.x, S.mouse.y);
    setCursor(S.mouse.x, S.mouse.y);
  }
  if (e.buttons === 0 && (S.mining || S.dragging)) { endDrag(e); return; }
  if (S.dragging) sweep(S.mouse.x, S.mouse.y);
});

export function endDrag(e) {
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
    if (nearBench(p.x, p.y)) showPanel(S.boardOpen ? null : 'bench');
    else if (nearLab(p.x, p.y)) showPanel(S.labBoardOpen ? null : 'lab');
    else if (nearSchool(p.x, p.y)) showPanel(S.schoolBoardOpen ? null : 'school');
    else if (nearCasino(p.x, p.y)) showPanel(S.casinoBoardOpen ? null : 'casino');
    else showPanel(null);
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
  S.mining = false;
  if (S.dragging) { S.dragging = false; release(S.mouse.x, S.mouse.y); }
});


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

// A stopped station says why, in the one place words are cheap: under the
// cursor, and only when the cursor goes looking.
//
// This stopped being called for a while. The three lines that opened the bench
// board, the lab board and this became one `showPanel`, and it went with them --
// the words, the element and the styling all still there, and nothing reaching
// them. A board opens because you walked up to a station; a tooltip opens
// because you went and looked at a mark. Two questions, asked separately.
function askedAbout(x, y) {
  for (const p of S.piles) {
    if (!S.pileFull[p.key] || !overPileMark(p.key, x, y)) continue;
    showTip('pile is full', pileMarkAt(p.key));
    return true;
  }
  // the hole stops the haulers the way a full pile stops a gang, and it owes
  // the same explanation
  if (pitFull() && overPitMark(x, y)) {
    showTip('the hole is full', pitMarkAt());
    return true;
  }
  if (S.labDone && overLabMark(x, y)) {
    showTip(doneName(), labMarkAt());
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
  [() => S.heldCore || S.dragging, 'grabbing'],
  // a core lying about is the one thing here you pick up yourself
  [(x, y) => overCore(x, y), 'grab'],
  // the counts under a station, and the places with a board on them
  [(x, y) => overRoster(x, y), 'pointer'],
  [(x, y) => nearBench(x, y) || nearLab(x, y) || nearSchool(x, y) || nearCasino(x, y), 'pointer'],
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
  if (pitFull() && overPitMark(x, y)) return true;
  return !!(S.labDone && overLabMark(x, y));
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
  const was = S.camX;
  S.camX += dx;
  clampCam();
  if (S.camX !== was && S.boardOpen) placeBoard();
}

canvas.addEventListener('wheel', e => {
  e.preventDefault();
  pan((Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY) * 0.8);
}, { passive: false });

// the cursor leaving the menu itself closes it, whichever station it is at
document.getElementById('panel').addEventListener('pointerleave', () => showPanel(null));
addEventListener('keydown', e => {
  // ctrl+R is the browser reloading, not the player asking for a new game
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  // and a bare r wipes a run with no way back, so it stays a dev shortcut: what
  // a player gets is the reset button, which asks twice
  if (import.meta.env.DEV && (e.key === 'r' || e.key === 'R')) reset();
  if (e.key === 'ArrowRight') pan(P * 12);
  if (e.key === 'ArrowLeft') pan(-P * 12);
});
