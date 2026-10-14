// The cutscenes: the camera taken to a one-time event, and given back.
//
// This module is the one thing allowed to point the camera, and only while a
// scene runs: the tearing of the rift, the drowning of the pit, and each
// shield's answer (DESIGN.md, "The cutscenes, fleshed out").
//
// A cutscene is a camera, not a stop. The sim keeps stepping and the moment
// plays out whether or not it is watched, so any click skips, and skipping
// releases the camera, never the moment. What the yard does around it while
// it holds -- the letterbox, the recede, the attackers standing still -- is
// `stepHush` below and stage.js. Nothing is saved but the name of a
// scene cut short (`S.beat.camera`, persist.js), which a reload plays over
// the event as it now stands.
//
// Which scene plays, and when, is a row of `BEATS` (beats.js) that owns the
// camera; this file is the framing -- `play` takes the shot, `stepShot` walks
// it a frame, `release` lets go -- and the two cues the rows watch.
//
// Letting go is a stretch, not a frame, and it does not go home: the seat
// stays on the event and the yard comes back around it over CUT_OUT_S.
// The player scrolls away when they are done looking.

import { CUT_TEAR_S, CUT_DROWN_S, CUT_SHIELD_TAIL_S, CUT_SHIELD_MAX_S, CUT_OUT_S,
         CUT_SNATCH_MAX_S, CUT_SNATCH_TAIL_S, CUT_SETTLE_S,
         CUT_MUCK_MAX_S, CUT_MUCK_TAIL_S, ABYSS_MAX_S, CUT_PAN_PX_S, CUT_PAN_MAX_S,
         CUT_KILL_SETTLE_S, CUT_BAND_SHARE, CUT_FRAME_MARGIN, CELL, WORKER } from './config.js';
import { muckSpot, muckOver, muckSubject } from './firstmuck.js';
import { mouthX } from './deep/place.js';
import { S, rift, pit } from './state.js';
import { clampCam, lockScroller } from './world.js';
import { arrived, holdDeepShot, gliding } from './view.js';
import { abyssLine } from './pit.js';
import { shieldTopY } from './shield.js';
import { introSubject } from './intro.js';
import { snatchSubject, killSubject } from './snatch.js';
import { abyssSubject } from './abyssintro.js';
import { finaleSubject } from './finale.js';
import { reducedMotion } from './prefs.js';
import { beatRunning, skipBeat } from './beats.js';
import { now, frameMs, setStill } from './clock.js';
import { keepCast, dropCast } from './stage.js';
import { outCubic as ease } from './motion.js';

// How long a scene may run, where it looks, and what it is about. `spot`
// is asked every frame where the thing watched moves (the disc grows under
// the tearing); a scene with no `spot` looks where it stood when it started.
// The drowning centers on the near stretch of the hole, where the surface and
// the counter are, since the whole mouth is wider than any window. The two
// are watched for their length after the camera has arrived (`arrived`),
// since the moment itself waits for it (rift.js, `due`). `front`
// is the layers (render.js, `LAYERS`) the scene is about beyond the ones
// every scene is (`FRONT`): they stay in full ink while the rest recedes.
//
// No scene zooms. The yard's zoom steps through whole cell sizes, so a pull
// in is a run of snaps with the ground line jumping on each; held at the
// yard's own size, the camera's one move is the glide (the owner's C).
const SCENES = {
  tear:  { s: CUT_TEAR_S, arrived: true, spot: () => rift.x + rift.w / 2, front: ['rift', 'pit', 'pit outline', 'abyss'] },
  drown: { s: CUT_DROWN_S, arrived: true, spot: () => pit.x + Math.min(700, pit.w) / 2, front: ['abyss', 'pit', 'pit outline', 'rift'] },
  // The snatch: on the edge of the plank, for as long as the beat runs.
  snatchcam: { s: CUT_SNATCH_MAX_S, spot: () => mouthX(), tail: CUT_SNATCH_TAIL_S,
               over: () => !beatRunning('snatch'), front: ['abyss', 'portal', 'pit outline'] },
  // The first muck: on the patch, the walker coming in from the open side,
  // over once the patch is clear and faded (firstmuck.js).
  firstmuck: { s: CUT_MUCK_MAX_S, spot: muckSpot, tail: CUT_MUCK_TAIL_S,
               over: () => muckOver(), front: ['muck'] },
  // The first trip down (abyssintro.js): in the deep, so its framing is the
  // deep's (`stepDeepShot`), and a click there is a blow, so only the held
  // space bar skips it.
  abyss: { s: ABYSS_MAX_S, deep: true, holdOnly: true },
};
// A shield's answer has no length of its own, so the scene ends on the fact
// (the shield gone, or a held rock set down) plus a tail to see the wreck fly.
// The ceiling is a safety.
const SHIELD = {
  s: CUT_SHIELD_MAX_S, tail: CUT_SHIELD_TAIL_S,
  over: c => {
    if (!S.shield) return true;                  // it broke: the four that fail
    if (S.rockHeld) c.held = true;               // it has hold of it
    // ...and has let it down, and the two of them have had their beat under
    // it (shield.js, `answer`): whichever finishes second ends the scene.
    return !!c.held && !S.rockHeld && S.rockFall <= 0 && !beatRunning('rescue');
  }
};
const sceneOf = name => SCENES[name] || SHIELD;

// What every scene is about: the two of them and the serpent in all its
// shapes, with what the pointer is holding. A shield's answer and the yard's
// own beats (the opening, the reunion) are about the rock as well, and
// whoever is under it; every other scene lets the rock recede with the yard
// -- the first muck is the walker, not the gang's hill behind it.
const FRONT = ['intro', 'snatch', 'serpent diving', 'serpent', 'barrier', 'freed', 'charge',
               'held', 'pointed', 'cursor'];
const ROCK = ['buried', 'rock', 'shield', 'rock sand', 'chips', 'shocks'];
// The finale (finale.js) is the two of them, her gear and the station it
// hangs on, the way up and the way out, the yard's own sky over the walk,
// and the house they walk to.
const FINALE = ['finale deep', 'hung kit', 'deep stations', 'deep portal', 'finale', 'fireworks', 'home',
                'abyss', 'pit outline', 'portal'];
const fronts = new Map();
export function frontLayers() {
  const key = S.finale && holding() ? 'finale' : S.shot && S.beat.camera ? S.shot.name : '';
  if (!fronts.has(key)) fronts.set(key, new Set([...FRONT, ...(key === 'finale' ? FINALE : SCENES[key] ? SCENES[key].front || [] : ROCK)]));
  return fronts.get(key);
}

// The two cues the camera's rows watch, read once a frame by `stepBeats`
// (beats.js) so an edge is seen exactly once. For the rift it is the *gulp
// starting*, which a restored save (its gulp already spent) never shows, so a
// reload replays nothing. For a shield it is the rock *leaving the sky*: the
// timber breaks on the frame the rock reaches it, so a camera that went on
// the answer would see a wreck.
let sawGulp = 0;
let sawFall = false;
export function cameraCues() {
  const gulp = (S.riftGulp || 0) > sawGulp;
  sawGulp = S.riftGulp || 0;
  const falling = S.rockFall > 0 && !S.rockHeld;
  const fall = falling && !sawFall;
  sawFall = falling;
  return { gulp, fall, arrive: arrived() };
}
// A gulp begun since the story last looked: the rift holds its moment for
// the frame it takes the beats to see it (rift.js, `due`).
export const cueUnread = () => (S.riftGulp || 0) > sawGulp;

// Whether a moment one of `keys`' scenes is about must still wait: that
// scene has the camera and has not yet arrived, the glide done and the yard
// settled around it. The rock waits in the sky on this (rock.js) and the
// tearing and the drowning wait on it (rift.js), so the camera is still when
// the thing happens. Let go or skipped, nothing waits.
export function awaitingShot(keys) {
  if (!keys.has(S.beat.camera)) return false;
  const c = S.shot;
  if (c && c.out) return false;
  return !(c && c.settled && S.hush >= 1);
}

// The shot: how far in, on what, and how far along it is. Ephemeral -- a
// reload takes it again from the beat's name.
export function play(name) {
  const sc = sceneOf(name);
  const fromX = S.camX + S.viewW / 2;
  const spotX = S.shield ? S.shield.x + S.shield.w / 2 : fromX;
  // The glide takes the settle, or longer over a long way: its top speed,
  // halfway along an ease in and out, is twice the average, and held under
  // CUT_PAN_PX_S so a long pan reads as a pan, not a whip -- within reason.
  const to = !sc.deep && sc.spot ? sc.spot() : spotX;
  const glideS = Math.max(CUT_SETTLE_S, Math.min(CUT_PAN_MAX_S, 2 * Math.abs(to - fromX) / CUT_PAN_PX_S));
  S.shot = { name, at: 0, s: sc.s, fromX, spotX, glideS };
  // The scroller is shut for the run: a fling in flight would fight the seat.
  lockScroller(true);
}

// A scene on its way out has let go as far as the player is concerned: the
// click that would have skipped it lands in the yard instead.
export const cutsceneRunning = () => !!S.shot && !S.shot.out;

// Any click while a scene runs lands here first -- see `input.js`.
export function skipCutscene() {
  if (!cutsceneRunning() || sceneOf(S.shot.name).holdOnly) return false;
  skipBeat(now(), 'camera');
  return true;
}

const easeInOut = k => k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;

// One frame of the camera's beat: true while it still has the camera, the
// way out included.
export function stepShot(t) {
  // A scene the last sitting closed the tab on: the cues never fire for it,
  // so the save says which was owed (`S.beat.camera`) and it plays once over
  // the event as it now stands.
  if (!S.shot) play(S.beat.camera);

  const c = S.shot;
  const sc = sceneOf(c.name);
  if (!c.at) c.at = t;
  if (!c.out) {
    const from = sc.arrived ? c.settledAt : c.at;
    if (from != null && t - from >= c.s * 1000) release();
    else if (sc.over) {
      if (!c.overAt && sc.over(c)) c.overAt = t;
      if (c.overAt && t - c.overAt >= sc.tail * 1000) release();
    }
  }

  // Own the view every frame, not once: the follow or a purchase glide would
  // otherwise wrestle the camera mid-scene.
  S.follow = null;
  S.camTo = null;
  S.camLockY = null;
  // Letting go does not move the seat: the scene ends on the thing it was
  // about, and the yard comes back around it (`stepHush`) over CUT_OUT_S.
  // The camera is the beat's until the yard is all the way back, so the
  // bands are never up with no scene behind them.
  if (c.out) {
    if (!reducedMotion() && S.hush > 0) return true;
    S.shot = null;
    return false;
  }
  // A glide on an ease, from where the player was looking to the spot, over
  // the settle; then held there, following the spot exactly if it moves. Not
  // a chase: a share of the gap a frame is fast at the start and still
  // sliding when the thing it went to see happens. Under reduced motion the
  // framing is taken on the first frame.
  const want = sc.spot ? sc.spot() : c.spotX;
  const k = reducedMotion() ? 1 : easeInOut(Math.min(1, (t - c.at) / ((c.glideS || CUT_SETTLE_S) * 1000)));
  if (k >= 1 && !c.settled) { c.settled = true; c.settledAt = t; }
  const from = c.fromX ?? want;
  S.camX = from + (want - from) * k - S.viewW / 2;
  clampCam();
  return true;
}

// --- held still, letterboxed --------------------------------------------------
// While a scene holds the yard the background settles and stands still: the
// bands step in, the yard recedes, the bystanders fade, the attackers hold
// (stage.js) and the ambient clocks slow to a stop (clock.js, `setStill`).
// `S.hush` walks to one over CUT_SETTLE_S and back to nought over CUT_OUT_S;
// everything that reads it reads the same number, so nothing pops in or out
// ahead of anything else.
//
// A scene holds while a camera beat has the camera and has not let go, and
// while a yard beat with no camera of its own runs: the opening, the
// reunion, and the kill in the deep. The rescue and the snatch hold through
// their cameras, so a skipped camera lets the yard go with it.
// The kill and the finale after it hold the yard through the sheet that
// ends them, until that is put down; and the kill settles at once, the
// background still from its first frame (CUT_KILL_SETTLE_S).
const HUSH_YARD = new Set(['leave', 'chat', 'fall', 'down', 'up', 'show', 'meet', 'part', 'freed', 'finale']);
const AT_ONCE = new Set(['freed', 'finale']);
export const holding = () =>
  (!!S.beat.camera && !!S.shot && !S.shot.out) || HUSH_YARD.has(S.beat.yard) || S.beat.sheet === 'freedsheet'
  || (!!S.finale && S.finale.phase === 'held');

export function stepHush(t) {
  const on = holding();
  if (on && !S.hushOn) S.hushAt = t;
  S.hushOn = on;
  const step = frameMs() / 1000;
  const settle = AT_ONCE.has(S.beat.yard) ? CUT_KILL_SETTLE_S : CUT_SETTLE_S;
  S.hush = reducedMotion() ? (on ? 1 : 0)
         : on ? Math.min(1, S.hush + step / settle)
         : Math.max(0, S.hush - step / CUT_OUT_S);
  if (on) keepCast();
  else if (S.hush <= 0) dropCast();
  setStill(easeInOut(S.hush));
  stepLift(step);
}
// How far the yard has receded, eased, for the drawing.
export const recede = () => easeInOut(S.hush);

// --- the window between the bands ---------------------------------------------
// The bands cover the top and the foot of the glass, so a scene is framed in
// what is left between them, not in the whole window. Every framing in the
// game -- the yard's pit floor on the foot of the window, the deep's floor on
// it, the opening's and the deep scenes' own heights -- is asked once more
// here (`frameHeight`, from world.js `clampCam`) whether what the scene is
// about is inside that window, and the camera is let down or up by as little
// as puts it there. The bands step in with the hush, so the move comes in
// with them, and the camera glides it; it never cuts.

// How many cells deep each band stands at full: a share of the window's
// height, in whole cells of the window's grid.
export const bandCells = () => Math.max(1, Math.round(S.H * CUT_BAND_SHARE / CELL));
// ...and in the world's pixels at the zoom the view stands at.
const bandWorld = () => bandCells() * CELL / S.zoom;

// What a scene is about, as one box in the world: what its camera is aimed
// at. Each scene's own file says who that is; this is the one table of them.
// Null when nothing holds the yard, or while the view is between the halves.
const SHIELDS = new Set(['props', 'net', 'arch', 'dome']);
function subjects() {
  if (S.finale) return finaleSubject();
  if (S.beat.yard === 'freed') return killSubject();
  const cam = S.beat.camera;
  if (cam === 'abyss') return abyssSubject();
  if (cam === 'snatchcam' || S.beat.yard === 'snatch') return snatchSubject();
  if (cam === 'firstmuck') return muckSubject();
  // The tearing is the disc; the drowning is wider than any window, and what
  // is watched is the stretch the camera is on (`SCENES`), from the ground to
  // the surface.
  if (cam === 'tear') return [{ x: rift.x, y: rift.y, w: rift.w, h: rift.h }];
  if (cam === 'drown') {
    const x = SCENES.drown.spot(), w = Math.min(S.viewW / 2, Math.min(700, pit.w));
    const top = S.groundY - WORKER, foot = Math.max(S.groundY, abyssLine());
    return [{ x: x - w / 2, y: top, w, h: foot - top }];
  }
  if (SHIELDS.has(cam)) {
    if (!S.shield) return [];
    const y = shieldTopY(S.shield);
    return [{ x: S.shield.x, y, w: S.shield.w, h: S.groundY - y }];
  }
  if (S.beat.yard) return introSubject();
  return [];
}
// A scene whose subject has gone from under it -- a shield broken, the
// serpent back under with him -- is still about where it was for the tail it
// holds on the wreck: the last box it named is kept for as long as the same
// scene holds the same half.
let kept = null;
export function subject() {
  if (!holding() || gliding()) return null;
  const key = S.finale ? 'finale' : S.beat.camera || S.beat.yard || S.beat.sheet;
  const at = subjects();
  if (!at.length) return kept && kept.key === key && kept.view === S.view ? kept.box : null;
  const x = Math.min(...at.map(r => r.x)), y = Math.min(...at.map(r => r.y));
  const box = { x, y, w: Math.max(...at.map(r => r.x + r.w)) - x, h: Math.max(...at.map(r => r.y + r.h)) - y };
  kept = { key, view: S.view, box };
  return box;
}

// The window between the bands at full, in the world, for a view whose top
// stands at `camY`.
export function bandWindow(camY = S.camY) {
  const band = bandWorld();
  return { top: camY + band, bottom: camY + S.viewH - band };
}
// How far the view at `camY` must be let down (less than nought: up) to put
// `box` inside that window, CUT_FRAME_MARGIN clear of both bands; a box
// taller than the window is centered in it.
function need(camY, box) {
  const m = CUT_FRAME_MARGIN, { top, bottom } = bandWindow(camY);
  if (box.h + m * 2 > bottom - top) return box.y + box.h / 2 - (top + bottom) / 2;
  if (box.y - m < top) return box.y - m - top;
  if (box.y + box.h + m > bottom) return box.y + box.h + m - bottom;
  return 0;
}

// The move, in world pixels: `want` what the scene's box needs with the
// bands all the way in, `lift` how far the camera has come toward it. The
// bands come in on the hush, so the move does too; and it is walked at the
// glide's own top speed, so a box that changes hands (a finale's phase, the
// way through the portal) is a glide and never a jump. A scene letting go
// keeps the last box's move and gives it back with the bands. Ephemeral: a
// reload takes it again from the scene.
let want = 0, lift = 0;
export function frameHeight(camY) {
  if (S.hush > 0) {
    const box = subject();
    if (box) want = need(camY, box);
  }
  return camY + lift;
}
function stepLift(step) {
  // Asked every frame the bands are up, not only when a scene happens to
  // frame: a view nobody is pointing (the yard come back through the portal)
  // still has its subject put between them.
  if (S.hush > 0) clampCam();
  else want = 0;
  const to = want * S.hush, most = CUT_PAN_PX_S * step;
  const was = lift;
  lift = reducedMotion() ? to : lift + Math.max(-most, Math.min(most, to - lift));
  if (lift !== was) clampCam();
}
// A view framed afresh (view.js, `frameOn`): the way between the halves has
// had the window, and the move starts again from the new framing.
export function dropLift() { want = 0; lift = 0; }
// For the checks: whether the move has come all the way to what the subject
// needs from the view as it stands now.
export function liftArrived() {
  const box = subject();
  return Math.abs(lift - (box ? need(S.camY - lift, box) : want) * S.hush) < 0.5;
}

// One frame of a scene in the deep: `want` is where its own beat looks this
// frame, `{ k, x, y }` -- pulled in by `k` over the deep's fit, its middle on
// (x, y) in the world -- and this holds the deep's camera on it
// (`holdDeepShot`). The yard's framing above does not reach the deep: its
// ground line is the yard's and its zoom goes back to the yard's, and the deep
// takes back its own every frame (view.js, `stepView`). Letting go is the same
// stretch as the yard's, and no more going home: the pull eases back to the
// deep's fit and the height to its floor over CUT_OUT_S, on the last thing
// looked at. True while it still has the camera.
export function stepDeepShot(t, want) {
  if (!S.shot) play(S.beat.camera);
  const c = S.shot;
  if (!c.at) c.at = t;
  if (!c.out && t - c.at >= c.s * 1000) release();
  S.follow = null;
  S.camTo = null;
  if (!c.out && want) c.last = want;
  if (c.out) c.outAt ??= t;
  const out = !c.out ? 0
            : reducedMotion() ? 1
            : ease(Math.min(1, (t - c.outAt) / (CUT_OUT_S * 1000)));
  const f = c.last;
  if (out < 1 && f) {
    holdDeepShot({ k: f.k + (1 - f.k) * out, x: f.x, y: f.y, w: 1 - out });
    return true;
  }
  holdDeepShot(null);
  S.shot = null;
  return false;
}

// A deep scene whose deep has gone from under it (the way up taken while it
// played): the camera is the yard's again at once, nothing held.
export function dropDeepShot() {
  holdDeepShot(null);
  S.shot = null;
  lockScroller(false);
}

// Over or skipped: owed nothing more, and on its way out. The camera is
// still the beat's until the way out is walked, so the beat carries on
// (false) rather than ending on the click.
export function release() {
  if (S.shot) S.shot.out = true;
  lockScroller(false);
  return false;
}
