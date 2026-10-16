// A pad (DESIGN.md, "Controller support"): a third front end on the calls
// the mouse and the finger make, as touch is a second one. It reads the pad
// once a frame (padread.js), and turns presses into the same calls input.js
// makes -- `knockOff`, `lift` / `drop` / `shakeHeld`, `holdAt` / `dragArm`,
// `clickDeep`, `showPanel`, `hold`, `holdSkip`, a row's own click -- deciding
// nothing itself, as input.js decides nothing.
//
// The pad moves a focus between the things a click would land on, never a
// cursor at them: the stops (stops.js, the list the hop arrows and the digit
// keys walk), and inside a stop its own controls. What needs a place rather
// than a thing -- a sweep, a throw, a body dropped anywhere -- is the hand on
// a held RT, the pointer's own path (`sweep`, `track`, `release`) with the
// stick standing in for the pointer. The page's rows are padpage.js's.
//
// The mouse and the pad are both live, always: the last one touched wins. A
// press shows the marker and the pad's glyphs, a mouse move hides them, and
// nothing is a setting.

import { P, WORKER, MINE_DELAY, TOSS_DELAY, HOVER_SLOW_MS, PAD_DEAD, PAD_FLICK, PAD_REPEAT_WAIT_MS,
         PAD_REPEAT_MS, PAD_TRIGGER, PAD_HAND_SPEED, PAD_PAN, PAD_COIL_RATE, PAD_TIP_MS, PAD_HAND_BOX, PAD_PAN_MS, PAD_PAN_LEAD,
         ARM_LENGTH, ARM_SWING, COIL_SEGS } from './config.js';
import { S } from './state.js';
import { now } from './clock.js';
import { readPads, seeFamily, glyph, rumble, fakePad, BUTTON } from './padread.js';
import { stops, stopById, stopMid } from './stops.js';
import { station } from './stations.js';
import { showPanel, openBoard, showTip, showTipAt } from './board.js';
import { panTo, unfollow } from './world.js';
import { knockOff, topOfRock, overBoulder } from './rock.js';
import { sweep, release, track } from './hands.js';
import { workerAt, lift, lifted, drop, shakeHeld } from './crew.js';
import { dropTargets } from './crew/assign.js';
import { orbLiftOf } from './deep/phases.js';
import { rosterButtons, rosterHit } from './roster.js';
import { LEVERS, leverAt, leverBox, holdAt, dragArm, releaseArm, tapAt, signBox } from './levers.js';
import { canDrop } from './casino.js';
import { potBox } from './apothecary.js';
import { potPick } from './potpick.js';
import { clickDeep } from './deep/serpent.js';
import { coilAt, coilThick } from './deep/place.js';
import { goDeep, goUp, gliding } from './view.js';
import { skippable, holdSkip } from './skip.js';
import { shutOpts } from './shop.js';
import { closeWindow } from './modal.js';
import { card } from './crewboard.js';
import { crewView } from './prefs.js';
import { hear } from './audio.js';
import { hold, pan, viewTaken, whatIsAt } from './input.js';
import { aim, markAt, glideMs } from './padglide.js';
import { fillControls } from './controls.js';
import { wardrobePad } from './wardrobepage.js';
import { scope, focused, dropFocus, keepFocus, move as pageMove, pressA, pressX,
         enterBoard, enterCorner, paintPage, pickToward } from './padpage.js';

const mid = r => ({ x: r.x + r.w / 2, y: r.y + r.h / 2 });
const half = () => (S.view === 'deep' ? 'deep' : 'yard');
const onScreen = r => !!r && r.x + r.w > S.camX && r.x < S.camX + S.viewW && r.y + r.h > S.camY && r.y < S.camY + S.viewH;
const onGlassX = r => !!r && r.x + r.w > S.camX && r.x < S.camX + S.viewW;

// --- the stops, and what stands inside each ------------------------------------
// The build call (raise.js) stands over the yard as a button of its own until
// the bench is up: a stop like any other, its box read off the page.
function raiseStop() {
  const el = typeof document.getElementById === 'function' && document.getElementById('raise');
  if (!el || el.hidden || typeof el.getClientRects !== 'function' || !el.getClientRects().length) return null;
  const b = el.getBoundingClientRect();
  if (!b.width) return null;
  return { id: 'raise', kind: 'raise', key: 'raise', half: 'yard', el,
           r: { x: b.left / S.zoom + S.camX, y: b.top / S.zoom + S.camY, w: b.width / S.zoom, h: b.height / S.zoom } };
}
// The stops in the half on screen, left to right.
function yardStops() {
  const list = stops(half());
  const r = half() === 'yard' && raiseStop();
  if (r) { list.push(r); list.sort((a, b) => stopMid(a) - stopMid(b)); }
  return list;
}
const findStop = id => (id === 'raise' ? raiseStop() : stopById(id));

// A stop's own controls, in rows top to bottom, each a list left to right:
// what ↓ steps into. A control is { id, r, press, held?, release? }, each
// press the call a click there makes.
const at = (r, fn) => () => { const c = mid(r); return fn(c.x, c.y); };
function rosterRow(postKey, parent) {
  const b = postKey && rosterButtons(postKey);
  if (!b) return null;
  return [{ id: `${parent}|ros:${postKey}:less`, r: b.less, press: at(b.less, rosterHit) },
          { id: `${parent}|ros:${postKey}:more`, r: b.more, press: at(b.more, rosterHit) }];
}
// The arm, held at rest: a point on the arm's own circle at the middle of
// its throw, so grabbing it does not move it. The stick then works it, its
// vertical as the drag's (down pulls, as dragging the knob down does).
function armPoint(s) {
  const l = LEVERS[0], a = leverAt(l), L = ARM_LENGTH * P, half = ARM_SWING / 2;
  const angle = half + Math.max(-1, Math.min(1, s)) * half;
  return { x: a.x + a.dir * Math.sin(angle) * L, y: a.y - Math.cos(angle) * L };
}
function innerRows(stop) {
  if (!stop) return [];
  const rows = [];
  const push = row => { if (row && row.length) rows.push(row); };
  if (stop.kind === 'rock') push(S.shackOpen ? null : rosterRow('mine', stop.id));
  if (stop.kind === 'station') {
    const row = station(stop.key);
    if (stop.key === 'casino' && S.casinoOpen) {
      const box = leverBox(LEVERS[0]);
      push([{ id: `${stop.id}|arm`, r: box, arm: true,
              press: () => { const p = armPoint(0); return holdAt(p.x, p.y); },
              held: s => { if (S.holding) { const p = armPoint(s); dragArm(p.x, p.y); } },
              release: () => releaseArm() }]);
      if (canDrop()) { const b = signBox(); push([{ id: `${stop.id}|sign`, r: b, press: at(b, tapAt) }]); }
    }
    if (stop.key === 'apothecary') {
      const pots = [];
      for (let i = 0; i < S.apothPots; i++) { const b = potBox(i); pots.push({ id: `${stop.id}|pot:${i}`, r: b, press: at(b, potPick) }); }
      push(pots);
    }
    push(rosterRow(row?.post?.key, stop.id));
  }
  return rows;
}

// --- the focus ----------------------------------------------------------------
// `S.padFocus` names it: a stop's id, a control's (`<stop>|<control>`), the
// coil's (`coil|<stop>`), or 'body'. A body and the coil's segment are kept
// here, as the pointer's hand is in input.js: they are what the focus is on,
// not facts about the yard.
let body = null;           // the body under crew sight
let seg = 0;               // the coil's segment, fractional, under the stick
const parentOf = id => (id && id.includes('|') ? id.split('|')[id.startsWith('coil|') ? 1 : 0] : id);

function controlOf(id) {
  const [parent] = id.split('|');
  for (const row of innerRows(findStop(parent))) for (const c of row) if (c.id === id) return c;
  return null;
}
// Where the focus is now, as a box in the world, or null if it is on nothing
// that stands.
function focusBox(id = S.padFocus) {
  if (!id) return null;
  if (id === 'body') {
    if (!body) return null;
    return { x: body.x, y: body.y - orbLiftOf(body) * P, w: WORKER, h: WORKER };
  }
  if (id.startsWith('coil|')) {
    const p = coilAt(Math.round(seg), now()), t = Math.max(P, coilThick(Math.round(seg)));
    return { x: p.x - t, y: p.y - t, w: t * 2, h: t * 2 };
  }
  if (id.includes('|')) return controlOf(id)?.r || null;
  return findStop(id)?.r || null;
}

function setFocus(id, look = false) {
  if (id === S.padFocus) return;
  S.padFocus = id;
  showTipAt(null);
  tipAsked = false;
  focusAt = performance.now();
  if (look) { const r = focusBox(id); if (r) lookTo(mid(r).x); }
}
// The camera to the focus, in the middle of the window, by a pan eased in
// and out over PAD_PAN_MS. The marker's own glide is shorter (padglide.js),
// so it reaches the new thing while the camera is still on its way and rides
// in with it: both are seen to move (the owner, 2026-10-16: "i want both the
// camera glide and the bracket glide").
function lookTo(x) {
  unfollow();
  panTo(x, Math.max(PAD_PAN_MS, PAD_PAN_LEAD * glideMs(Math.abs(x - S.camX - S.viewW / 2) * S.zoom)));
  viewTaken();
}

// The stop nearest the middle of the window: where the focus lands first,
// and after a pan has taken the one it was on off the glass.
function nearestStop(x = S.camX + S.viewW / 2, list = yardStops()) {
  let best = null, d = Infinity;
  for (const s of list) {
    const e = Math.abs(stopMid(s) - x);
    if (e < d && onScreen(s.r)) { d = e; best = s; }
  }
  return best || list[0] || null;
}

// The focus on something standing in this half, or put on the nearest thing
// that is: a station sold out from under it, the deep gone up.
function settleFocus() {
  if (S.padFocus === 'body' && body && S.workers.includes(body)) return;
  const r = focusBox();
  const id = S.padFocus;
  const inHalf = r && (id === 'body' || id.startsWith('coil|') || (findStop(parentOf(id))?.half ?? 'yard') === half());
  if (r && inHalf) return;
  const s = (id === null || id === 'rock') && findStop('rock') && half() === 'yard' ? findStop('rock') : nearestStop();
  S.padFocus = s ? s.id : null;
  body = null;
}

// --- moving the focus ---------------------------------------------------------
// Everything a d-pad press can land on in the yard, as middles for the one
// rule (padpage.js, `pickToward`): the stops, and in the deep while the
// serpent is there to be struck, every segment of its coil, so the coil is
// as near or as far as it stands and no press is routed through it.
const coilLive = () => half() === 'deep' && S.snatched && !S.serpentFreed;
function places() {
  const out = yardStops().map(s => ({ ...mid(s.r), id: s.id }));
  if (coilLive()) {
    const t = now();
    for (let i = 0; i < COIL_SEGS; i++) out.push({ ...coilAt(i, t), seg: i });
  }
  return out;
}
// The focus on what a press picked: a stop, or a segment of the coil, which
// keeps the stop it was come to from as its parent.
function land(it, from) {
  if (it.seg == null) { setFocus(it.id, true); return; }
  seg = it.seg;
  if (!(S.padFocus || '').startsWith('coil|')) setFocus(`coil|${from}`);
  if (!onGlassX({ x: it.x - 1, y: it.y, w: 2, h: 2 })) lookTo(it.x);
}
// Up past the top of the yard: the corner cards over it, the row nearest the
// thing the focus stood on. Down from there comes back (`pagePresses`).
function upToCorner(r) {
  const c = r ? mid(r) : { x: S.camX + S.viewW / 2, y: S.camY };
  enterCorner(true, { x: (c.x - S.camX) * S.zoom, y: (c.y - S.camY) * S.zoom });
}

function hop(dir) {
  const id = S.padFocus;
  // On a station's own control: along its row, and up and down its rows.
  if (id && id.includes('|') && !id.startsWith('coil|')) {
    const stop = findStop(parentOf(id));
    const rows = innerRows(stop);
    const ri = rows.findIndex(row => row.some(c => c.id === id));
    if (ri < 0) { setFocus(stop ? stop.id : null); return; }
    const ci = rows[ri].findIndex(c => c.id === id);
    if (dir === 'left' || dir === 'right') {
      const next = rows[ri][ci + (dir === 'right' ? 1 : -1)];
      if (next) setFocus(next.id);
    } else if (dir === 'up') setFocus(ri > 0 ? rows[ri - 1][Math.min(ci, rows[ri - 1].length - 1)].id : stop.id);
    else if (rows[ri + 1]) setFocus(rows[ri + 1][Math.min(ci, rows[ri + 1].length - 1)].id);
    return;
  }
  const onCoil = !!id && id.startsWith('coil|');
  const cur = onCoil ? null : findStop(id);
  // Off the glass since a pan: the first press lands where you are looking.
  // Only along the yard, since a pan only moves the view along it: a stop
  // standing over the top of a short window is still the one the focus is on.
  if (!onCoil && (!cur || !onGlassX(cur.r))) { const s = nearestStop(); if (s) setFocus(s.id); return; }
  // Down into a station's own controls first: they stand inside it.
  if (!onCoil && dir === 'down') { const rows = innerRows(cur); if (rows.length) { setFocus(rows[0][0].id); return; } }
  const from = onCoil ? coilAt(Math.round(seg), now()) : cur.r;
  // The coil is one thing, lying along the deep: left and right travel it,
  // segment by segment, and up and down leave it for what stands over or
  // under it, as a press leaves any other thing.
  const across = dir === 'up' || dir === 'down';
  const it = pickToward(from, dir, places().filter(p => (onCoil ? (across ? p.seg == null : p.seg !== Math.round(seg)) : p.id !== id)));
  if (it) { land(it, onCoil ? parentOf(id) : id); return; }
  // Nothing over it: up past the top of the yard is the corner cards, so
  // every stop and the corner are a path of presses from every other.
  if (dir === 'up') upToCorner(focusBox());
}

// Under crew sight the focus hops between bodies instead: the nearest one
// on the glass in the pressed direction.
const pickable = w => !w.inside && !w.lifted && workerAt(w.x + WORKER / 2, w.y + WORKER / 2 - orbLiftOf(w) * P) === w;
function bodiesOnGlass() {
  if (crewView() === 'hide') return [];
  return S.workers.filter(w => onScreen({ x: w.x, y: w.y, w: WORKER, h: WORKER }) && pickable(w));
}
function nearestBody(from, dir = null) {
  const list = bodiesOnGlass().filter(w => w !== body)
    .map(w => ({ x: w.x + WORKER / 2, y: w.y + WORKER / 2, w }));
  if (dir) return pickToward(from, dir, list)?.w || null;
  let best = null, d = Infinity;
  for (const it of list) { const e = Math.hypot(it.x - from.x, it.y - from.y); if (e < d) { d = e; best = it.w; } }
  return best;
}
function focusBody(w) {
  if (!w) return;
  body = w;
  S.padFocus = null;      // so the next line is a change
  setFocus('body');
}

// --- the hand -----------------------------------------------------------------
// A point in the world the stick moves at the hand's speed, for RT held and
// for a body carried. Where a d-pad press sends a carried body, it goes at
// the same speed: a carry, never a placement.
let carryTo = null;       // where a d-pad hop is carrying the body, or null
let carried = null;       // the body the pad is carrying
let sweeping = false;     // A down with the hand out

function startHand(r) {
  const c = r ? mid(r) : { x: S.camX + S.viewW / 2, y: S.groundY - P * 6 };
  S.padHand = { x: c.x, y: c.y };
  S.trail = [];
}
function moveHand(dx, dy, dt) {
  const h = S.padHand;
  if (!h) return 0;
  let mx = 0, my = 0;
  if (carryTo) {
    const ex = carryTo.x - h.x, ey = carryTo.y - h.y, d = Math.hypot(ex, ey);
    const step = PAD_HAND_SPEED * dt;
    if (d <= step) { mx = ex; my = ey; carryTo = null; }
    else { mx = ex / d * step; my = ey / d * step; }
  } else {
    // Never faster than the hand, pushed diagonally included.
    const len = Math.hypot(dx, dy), k = len > 1 ? 1 / len : 1;
    mx = dx * k * PAD_HAND_SPEED * dt;
    my = dy * k * PAD_HAND_SPEED * dt;
  }
  h.x = Math.max(0, Math.min(S.worldW, h.x + mx));
  h.y = Math.max(S.camY, Math.min(S.camY + S.viewH, h.y + my));
  S.mouse = { x: h.x, y: h.y };
  track(h.x, h.y);
  return mx;
}
// The next station a carried body can be put down at, in a direction, by
// the drop's own table (crew/assign.js), aimed at its middle.
function carryHop(dir) {
  const h = S.padHand;
  if (!h) return;
  const list = dropTargets().map(t => ({ x: t.ring.x + t.ring.w / 2, y: t.ring.y + t.ring.h / 2 }))
    .sort((a, b) => a.x - b.x);
  const from = carryTo ? carryTo.x : h.x;
  const next = dir === 'right' ? list.find(p => p.x > from + P) : [...list].reverse().find(p => p.x < from - P);
  if (next) carryTo = next;
}
function letGo(throwIt) {
  const w = carried || lifted();
  carried = null;
  carryTo = null;
  if (!w) return;
  if (!throwIt) S.trail = [];       // set down: no flick to throw with
  drop(w);
  S.padHand = null;
  focusBody(w);
}

// --- reading the pad, a frame -------------------------------------------------
let was = null;                 // last frame's reading
let lastT = null;
let flickArmed = true;
const repeatAt = { up: 0, down: 0, left: 0, right: 0 };
let focusAt = 0, tipAsked = false;
let held = null;                // the control A is holding (the arm), or 'rock'
let skipping = false;

const DIRS = ['up', 'down', 'left', 'right'];

// Any input at all from the pad: the marker and the glyphs come up, and the
// first time, the controls page gains its pad column.
let seen = false;
function wake() {
  if (!seen) {
    seen = true;
    try { fillControls(document.getElementById('controlslist'), true); } catch {}
  }
  if (!S.padOn) {
    S.padOn = true;
    document.body?.classList?.add('pad');
    if (!S.padFocus) settleFocus();
  }
}
// The mouse moved, or a finger landed: the pad steps back, as it came.
function sleep() {
  if (!S.padOn) return;
  S.padOn = false;
  document.body?.classList?.remove('pad');
  dropFocus();
  aim(null);                // the marker fades out where it stood
  showTipAt(null);
}
addEventListener('pointermove', e => { if (e.isTrusted && e.pointerType !== 'touch') sleep(); }, true);
addEventListener('pointerdown', e => { if (e.isTrusted) sleep(); }, true);

// A crit under your own hands, a knock in them (the owner, 2026-10-12).
hear(ev => { if (ev === 'rock-crit' && S.padOn) rumble(); });

// One frame of the pad. `t` is the wall clock: a held sheet is still worked
// with the pad, so nothing here waits on the yard's.
export function stepPad(t = performance.now()) {
  const p = readPads();
  const dt = lastT == null ? 1 / 60 : Math.min(0.1, Math.max(0, (t - lastT) / 1000));
  lastT = t;
  if (!p) { if (was) letAllGo(); was = null; return; }
  // A trigger is down past its pull, whatever the pad calls pressed.
  for (const n of ['lt', 'rt']) p.down[n] = p.value[n] >= PAD_TRIGGER || p.down[n];
  const prev = was;
  was = { down: { ...p.down } };
  const pressed = n => p.down[n] && !(prev && prev.down[n]);
  const released = n => !p.down[n] && !!(prev && prev.down[n]);
  const [lx, ly, rx, ry] = p.axes.map(v => (Math.abs(v) < PAD_DEAD ? 0 : v));
  const touched = Object.keys(p.down).some(n => p.down[n]) || lx || ly || rx || ry;
  if (touched) { seeFamily(p.id); wake(); }
  if (!S.padOn) return;

  // The directions: the d-pad, repeating while held, and a flick of the
  // left stick -- unless the stick is a hand, the arm or the coil just now.
  const dirs = [];
  for (const d of DIRS) {
    if (pressed(d)) { dirs.push(d); repeatAt[d] = t + PAD_REPEAT_WAIT_MS; }
    else if (p.down[d] && t >= repeatAt[d]) { dirs.push(d); repeatAt[d] = t + PAD_REPEAT_MS; }
  }
  const stickBusy = !!S.padHand || !!carried || (held && held.arm) || (S.padFocus || '').startsWith('coil|');
  if (!stickBusy) {
    const m = Math.max(Math.abs(lx), Math.abs(ly));
    if (m >= PAD_FLICK && flickArmed) {
      flickArmed = false;
      dirs.push(Math.abs(lx) > Math.abs(ly) ? (lx > 0 ? 'right' : 'left') : (ly > 0 ? 'down' : 'up'));
    } else if (m < PAD_DEAD) flickArmed = true;
  }

  // Menu holds the yard and lets it go, wherever the focus is, as Escape
  // does; a story's sheet is put away only by its own buttons.
  const sc = scope();
  if (pressed('menu') && !(sc && sc.kind === 'sheet')) { hold(!S.paused); return; }

  // A scene has the yard: A held is the space bar held, and nothing else
  // answers (skip.js).
  if (skippable() && !S.paused) {
    if (pressed('a')) { holdSkip(true); skipping = true; }
    if (released('a') && skipping) { holdSkip(false); skipping = false; }
    return;
  }
  if (skipping && !p.down.a) { holdSkip(false); skipping = false; }

  // The page's rows, when the pad is on one.
  if (sc) { pagePresses(sc, dirs, pressed, t); return; }
  if (focused()) dropFocus();

  // The camera: the right stick slides the view and lets go of any follow;
  // R3 glides back to the focus.
  if (rx) pan(rx * PAD_PAN * S.viewW * dt);
  if (pressed('r3')) { const r = focusBox(); if (r) lookTo(mid(r).x); }
  if (pressed('view')) { letAllGo(); enterCorner(true); return; }
  // L3: the way through the portal, from either half (the Deck's L5 is
  // mapped here by the shipped Steam Input config).
  if (pressed('l3') && S.portalOpen && !gliding()) { if (S.view === 'deep') goUp(); else goDeep(); return; }

  yardPresses(p, dirs, pressed, released, lx, ly, dt);
}

function pagePresses(sc, dirs, pressed, t) {
  keepFocus(sc, t);
  // The picker's rows take left and right as their own, and LB, RB and Y
  // (wardrobepage.js).
  if (sc.kind === 'held') dirs = wardrobePad(dirs, pressed);
  for (const d of dirs) {
    // Down past the corner's last row is the yard again, where the focus was.
    if (!pageMove(sc, d) && sc.kind === 'corner' && d === 'down') { enterCorner(false); dropFocus(); return; }
  }
  if (pressed('a')) pressA();
  if (pressed('x')) pressX();
  if (sc.kind === 'board' && (pressed('lb') || pressed('rb'))) { turnBoard(pressed('rb') ? 1 : -1); return; }
  if (pressed('b') || (sc.kind === 'corner' && pressed('view'))) back(sc);
}

// B, one layer at a time.
function back(sc) {
  if (sc.kind === 'list') { shutOpts(); return; }
  if (sc.kind === 'modal') { closeWindow(); return; }
  if (sc.kind === 'board') {
    const key = openBoard();
    showPanel(null, true);
    enterBoard(false);
    dropFocus();
    if (key) setFocus(`st:${key}`);
    return;
  }
  if (sc.kind === 'corner') { enterCorner(false); dropFocus(); return; }
  if (sc.kind === 'held') {
    // A page of the sheet goes back to its front; the front lets the yard go.
    const paste = document.getElementById('nevermind');
    if (paste && !paste.closest('[hidden]') && paste.getClientRects().length) { paste.click(); return; }
    const backBtn = [...document.querySelectorAll('#held button[id$="back"]')].find(b => !b.hidden && b.getClientRects().length);
    if (backBtn) { backBtn.click(); return; }
    hold(false);
  }
}

// LB / RB: the neighbor station's board, open, the page turned.
function turnBoard(dir) {
  const list = yardStops().filter(s => s.kind === 'station' && s.board);
  const key = openBoard();
  const from = key ? list.findIndex(s => s.key === key) : -1;
  let next;
  if (from >= 0) next = list[from + dir];
  else {
    const r = focusBox(), x = r ? mid(r).x : S.camX + S.viewW / 2;
    next = dir > 0 ? list.find(s => stopMid(s) > x + 1) : [...list].reverse().find(s => stopMid(s) < x - 1);
  }
  if (!next) return;
  setFocus(next.id, true);
  showTipAt(null);
  showPanel(next.key, true);
  dropFocus();
  enterBoard(true);
}

function yardPresses(p, dirs, pressed, released, lx, ly, dt) {
  settleFocus();
  const sight = p.down.lt;

  // RT held: the hand. The focus's own box is where it starts.
  if (pressed('rt') && !carried) startHand(focusBox());
  if (released('rt') && !carried) {
    if (sweeping) { S.dragging = false; release(S.padHand.x, S.padHand.y); sweeping = false; }
    S.padHand = null;
  }

  // LT held: crew sight, the right button held. The focus goes to bodies.
  if (pressed('lt')) {
    S.crewSight = now();
    const r = focusBox();
    focusBody(nearestBody(r ? mid(r) : { x: S.camX + S.viewW / 2, y: S.groundY }));
  }
  if (released('lt')) {
    S.crewSight = null;
    if (carried) letGo(true);
    if (S.padFocus === 'body') { const s = body ? nearestStop(body.x) : nearestStop(); body = null; S.padFocus = s ? s.id : null; }
  }
  if (sight && S.padFocus === 'body' && body && !carried) body.slowUntil = now() + HOVER_SLOW_MS;

  // A body in the hand: the stick carries it, a waggle shakes it, a d-pad
  // hop carries it to the next station, A let go drops it, B sets it down.
  if (carried) {
    for (const d of dirs) if (d === 'left' || d === 'right') carryHop(d);
    if (!lifted()) { carried = null; S.padHand = null; carryTo = null; return; }
    const moved = moveHand(lx, ly, dt);
    shakeHeld(carried, moved);
    carried.x = S.padHand.x - WORKER / 2;
    carried.y = S.padHand.y - WORKER / 2;
    if (released('a')) { letGo(true); return; }
    if (pressed('b')) { letGo(false); return; }
    return;
  }

  // The hand out: the stick moves it; A sweeps and its release throws.
  if (S.padHand) {
    moveHand(lx, ly, dt);
    if (pressed('a')) {
      sweeping = true;
      S.dragging = true;
      S.nextToss = now() + TOSS_DELAY;
      S.trail = [];
      track(S.padHand.x, S.padHand.y);
      sweep(S.padHand.x, S.padHand.y);
    } else if (sweeping && p.down.a) sweep(S.padHand.x, S.padHand.y);
    if (released('a') && sweeping) { sweeping = false; S.dragging = false; release(S.padHand.x, S.padHand.y); }
    return;
  }

  // Under sight, the d-pad goes from body to body, and A lifts the one on.
  if (sight) {
    for (const d of dirs) {
      const r = focusBox();
      const w = nearestBody(r || { x: S.camX + S.viewW / 2, y: S.groundY }, d);
      if (w) focusBody(w);
    }
    if (pressed('a') && S.padFocus === 'body' && body && lift(body)) {
      carried = body;
      startHand({ x: body.x, y: body.y, w: WORKER, h: WORKER });
    }
    return;
  }

  for (const d of dirs) hop(d);

  // The coil under the stick: the focus slides along it as it moves.
  if ((S.padFocus || '').startsWith('coil|') && lx) seg = Math.max(0, Math.min(COIL_SEGS - 1, seg + lx * PAD_COIL_RATE * dt));

  // A held arm is worked by the stick's vertical.
  if (held && held.arm) held.held(ly);

  if (pressed('a')) pressFocus();
  if (released('a')) letAllGo();
  if ((pressed('lb') || pressed('rb')) && !carried) turnBoard(pressed('rb') ? 1 : -1);
}

// A on the focus: the click it stands for.
function pressFocus() {
  const id = S.padFocus;
  if (!id) return;
  if (id.startsWith('coil|')) { const pt = coilAt(Math.round(seg), now()); clickDeep(pt.x, pt.y); return; }
  if (id.includes('|')) {
    const c = controlOf(id);
    if (!c) return;
    c.press();
    if (c.release) held = c;
    return;
  }
  const s = findStop(id);
  if (!s) return;
  if (s.kind === 'rock') {
    // The click on the rock: a swing at its nearest high point, and held, the
    // held mining once it is bought, at the same spot (game.js, `holdToMine`).
    const c = mid(s.r);
    const pt = topOfRock(c.x) || c;
    S.mouse = { x: pt.x, y: Math.min(s.r.y + s.r.h - 1, Math.max(s.r.y + 1, pt.y)) };
    if (!overBoulder(S.mouse.x, S.mouse.y)) S.mouse = { x: c.x, y: s.r.y + s.r.h - P };
    knockOff(pt.x, pt.y, undefined, false);
    S.handChipped = true;
    S.mining = S.autoMine;
    S.nextHit = now() + MINE_DELAY;
    held = 'rock';
    return;
  }
  if (s.kind === 'way') { if (!gliding()) { if (S.view === 'deep') goUp(); else goDeep(); } return; }
  if (s.kind === 'orb') { const c = mid(s.r); clickDeep(c.x, c.y); return; }
  if (s.kind === 'raise') { s.el.click(); return; }
  if (s.kind === 'station') {
    if (s.board) { showTipAt(null); showPanel(s.key, true); dropFocus(); enterBoard(true); return; }
    // A place with no board (the casino): A steps into its controls.
    const rows = innerRows(s);
    if (rows.length) setFocus(rows[0][0].id);
  }
}

// Every hold the pad has on the yard, let go.
function letAllGo() {
  if (held === 'rock') S.mining = false;
  else if (held && held.release) held.release();
  held = null;
  if (sweeping && S.padHand) { S.dragging = false; release(S.padHand.x, S.padHand.y); }
  sweeping = false;
  if (carried) letGo(true);
}

// --- the marker and the tip, a frame --------------------------------------------
// After the frame is drawn and the page written: the marker aimed at the
// focus, the page's marker painted, and a settled focus's tip.
export function paintPad(t = performance.now()) {
  const sc = S.padOn ? scope() : null;
  paintPage(t, S.padOn && !!sc);
  if (!S.padOn || sc) return;
  if (S.paused || skippable()) { aim(null); return; }
  let box, id;
  if (S.padHand) {
    const c = S.padHand, s = PAD_HAND_BOX * P;
    box = carried ? { x: carried.x, y: carried.y, w: WORKER, h: WORKER } : { x: c.x - s / 2, y: c.y - s / 2, w: s, h: s };
    id = carried ? 'carry' : 'hand';
  } else {
    box = focusBox();
    // A segment of the coil is a place of its own, so a hop along it glides.
    id = S.padFocus === 'body' ? `body:${S.workers.indexOf(body)}`
       : (S.padFocus || '').startsWith('coil|') ? `${S.padFocus}#${Math.round(seg)}` : S.padFocus;
  }
  aim(id, box, 'yard', t);
  const m = markAt(t);
  if (!m || !m.landed || tipAsked || S.padHand || t - focusAt < PAD_TIP_MS || !box) return;
  tipAsked = true;
  sayTip(box);
}

// The hover's words, for the thing the focus has settled on, with the button
// that acts on it in front. Nothing new is written: a station says its name
// (the pointer's label), the rest whatever `whatIsAt` says under a pointer.
function sayTip(box) {
  const id = S.padFocus;
  if (id === 'body' && body) {
    showTipAt(card(body), (body.x + WORKER + P * 2 - S.camX) * S.zoom, (body.y - P * 3 - S.camY) * S.zoom, false, false, glyph('a'));
    return;
  }
  if (!id || id.includes('|')) return;
  const s = findStop(id);
  if (!s || s.kind === 'raise') return;
  const c = mid(box);
  const words = s.kind === 'station' ? station(s.key)?.name : whatIsAt(c.x, c.y);
  if (!words) return;
  const acts = s.kind !== 'station' || s.board || innerRows(s).length;
  showTip(words, { x: c.x, y: box.y + box.h }, acts ? glyph('a') : null);
}

// --- the checks' handle ---------------------------------------------------------
// A pad of the checks' own, read exactly as a real one is: `__pad` presses
// and holds its buttons and pushes its sticks, and `step` turns the pad's
// frame by hand, as `__fast` turns the yard's.
const fake = { id: 'check pad', connected: true, buttons: Object.values(BUTTON).map(() => ({ pressed: false, value: 0 })),
               axes: [0, 0, 0, 0] };
let fakeT = 0;
// On the wall clock where it is ahead, so a check's frames and the page's
// own (main.js) agree about when a glide began.
const fakeStep = (dt = 1 / 60) => { fakeT = Math.max(fakeT + dt * 1000, performance.now()); stepPad(fakeT); paintPad(fakeT); };
export const PAD_HANDLE = {
  on() { fakePad(fake); return true; },
  // Unplugged, and the pad put to sleep as a mouse move would, so a check
  // after this one finds no marker over its picture.
  off() { fakePad(null); for (const b of fake.buttons) { b.pressed = false; b.value = 0; } fake.axes = [0, 0, 0, 0];
          letAllGo(); was = null; enterCorner(false); enterBoard(false); sleep(); return true; },
  down(name) { fakePad(fake); const b = fake.buttons[BUTTON[name]]; b.pressed = true; b.value = 1; },
  up(name) { const b = fake.buttons[BUTTON[name]]; b.pressed = false; b.value = 0; },
  stick(x = 0, y = 0, right = false) { fakePad(fake); fake.axes[right ? 2 : 0] = x; fake.axes[right ? 3 : 1] = y; },
  // A press is a frame down and a frame up.
  press(name) { this.down(name); fakeStep(); this.up(name); fakeStep(); },
  step: fakeStep,
  focus: () => S.padFocus,
  seg: () => Math.round(seg),
  body: () => body,
  carried: () => carried,
  hand: () => S.padHand && { ...S.padHand },
  box: () => focusBox(),
  mark: () => markAt(fakeT),
  // The marker as the page's own frames draw it, on the wall clock.
  markNow: () => markAt(performance.now()),
  page: () => focused(),
  scope: () => scope()?.kind || null,
  inner: id => innerRows(findStop(id)).map(row => row.map(c => c.id)),
  stops: () => yardStops().map(s => s.id)
};
