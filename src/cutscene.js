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
// camera; this file is the scene -- `play` takes the shot, `stepShot` walks it a
// frame on what the scene is about, `release` lets go -- and the two cues the
// rows watch. The camera itself is shot.js's: a scene names a box and the
// shot frames it, the same way for every scene. A yard beat with no camera
// of its own (the opening, the kill, the finale) asks the same shot for its
// frame every frame it holds the yard (`shoot`).
//
// Letting go is a stretch, not a frame, and it does not go home: the seat
// stays on the event and the yard comes back around it over CUT_OUT_S.
// The player scrolls away when they are done looking.

import { CUT_TEAR_S, CUT_DROWN_S, CUT_SHIELD_TAIL_S, CUT_SHIELD_MAX_S, CUT_OUT_S,
         CUT_SNATCH_MAX_S, CUT_SNATCH_TAIL_S, CUT_SETTLE_S,
         CUT_MUCK_MAX_S, CUT_MUCK_TAIL_S, ABYSS_MAX_S, CUT_PAN_PX_S,
         CUT_KILL_SETTLE_S, CUT_FRAME_MARGIN, WORKER } from './config.js';
import { muckSpot, muckOver, muckSubject } from './firstmuck.js';
import { mouthX } from './deep/place.js';
import { S, rift, pit } from './state.js';
import { clampCam, lockScroller } from './world.js';
import { arrived, gliding } from './view.js';
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
import { easeInOut, bandWorld, restY, newAim, dropAim, stepAim, aiming, aimArrived, aimBox } from './shot.js';
export { bandCells } from './shot.js';

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
// What each is framed on is its subject (`subjects` below), which the shot
// glides to and holds (shot.js); `move` says when the subject walks and the
// shot is to keep with it instead. A scene that `asks` names its frame itself,
// every frame, with its own zoom (`stepShot`'s request).
const SCENES = {
  tear:  { s: CUT_TEAR_S, arrived: true, spot: () => rift.x + rift.w / 2, front: ['rift', 'pit', 'pit outline', 'abyss'] },
  drown: { s: CUT_DROWN_S, arrived: true, spot: () => pit.x + Math.min(700, pit.w) / 2, front: ['abyss', 'pit', 'pit outline', 'rift'] },
  // The snatch: on the edge of the plank, for as long as the beat runs.
  snatchcam: { s: CUT_SNATCH_MAX_S, spot: () => mouthX(), tail: CUT_SNATCH_TAIL_S,
               over: () => !beatRunning('snatch'), front: ['abyss', 'portal', 'pit outline'], move: () => 'follow' },
  // The first muck: on the patch, the walker coming in from the open side,
  // over once the patch is clear and faded (firstmuck.js).
  firstmuck: { s: CUT_MUCK_MAX_S, spot: muckSpot, tail: CUT_MUCK_TAIL_S,
               over: () => muckOver(), front: ['muck'], move: () => 'follow' },
  // The first trip down (abyssintro.js): its frames are its own phases'
  // requests, and a click in the deep is a blow, so only the held space bar
  // skips it.
  abyss: { s: ABYSS_MAX_S, asks: true, holdOnly: true },
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
// A scene whose row is kept by the module that plays it (actbeats.js, the
// acts' beats), registered on first play and read like every other.
export function addScene(name, row) {
  SCENES[name] = row;
  fronts.delete(name);
}

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
  S.shot = { name, at: 0, s: sc.s };
  // A move of the shot's from wherever the camera stands now.
  newAim();
  // The scroller is shut for the run: a fling in flight would fight the seat.
  lockScroller(true);
}
// The shot is aiming for a scene that still has the camera. A shot a new
// game or a read save took away (`S.shot` gone) is let go of here.
function shotHolds() {
  if (!aiming()) return false;
  if ((S.shot && !S.shot.out) || shotNow || shotLive) return true;
  dropAim();
  return false;
}
// A yard beat's frame, asked this frame (`shoot`), and asked last frame: the
// shot is the beat's for as long as it goes on asking. Read once a frame by
// `stepHush`, which lets an aim nobody asked for go.
let shotNow = false, shotLive = false;

// A scene on its way out has let go as far as the player is concerned: the
// click that would have skipped it lands in the yard instead.
export const cutsceneRunning = () => !!S.shot && !S.shot.out;

// Any click while a scene runs lands here first -- see `input.js`.
export function skipCutscene() {
  if (!cutsceneRunning() || sceneOf(S.shot.name).holdOnly) return false;
  skipBeat(now(), 'camera');
  return true;
}

// One frame of the camera's beat: true while it still has the camera, the
// way out included. A scene that `asks` hands its frame in as `req`, the
// request `shoot` takes.
export function stepShot(t, req = null) {
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
  // otherwise wrestle the camera mid-scene. A height the yard was held at
  // (the opening's) is let go of; a place that frames itself by height (the
  // afterlife's dive, view.js) keeps its own, and the shot frames off it.
  S.follow = null;
  S.camTo = null;
  if (S.view === 'yard') S.camLockY = null;
  // Letting go does not move the seat: the scene ends on the thing it was
  // about, and the yard comes back around it (`stepHush`) over CUT_OUT_S,
  // the height the shot lifted it by going back with the bands. The camera
  // is the beat's until the yard is all the way back, so the bands are never
  // up with no scene behind them.
  if (c.out) {
    if (aiming()) dropAim();
    if (!reducedMotion() && S.hush > 0) return true;
    S.shot = null;
    return false;
  }
  // What the scene is about, framed by the shot: glided to and held, or kept
  // with as it moves. A scene with nothing to name holds where it stands.
  const box = req ? req.frame : sceneBox(sc);
  if (box) aimAt(t, box, req ? req.move : sc.move ? sc.move() : 'glide', req || {});
  if (aimArrived() && !c.settled) { c.settled = true; c.settledAt = t; }
  return true;
}

// A yard beat's frame for this one frame, as a camera scene's: `frame` the
// box in the world, `move` 'glide' or 'follow', and the rest of shot.js's
// request (`zoom`, `middle`, `s`, `key`). Asked every frame the beat wants
// the camera; once it stops asking the shot lets go and the bands' lift goes
// back with them. A camera scene, or the ripple, has the window over it.
export function shoot(t, req) {
  if ((S.shot && !S.shot.out) || gliding() || !req || !req.frame) return;
  shotNow = true;
  S.follow = null;
  S.camTo = null;
  aimAt(t, req.frame, req.move, req);
}

// The shot's window for this frame, written: across as the left edge, up and
// down as the lift off the place's resting height, which is how the bands'
// framing hands the height back when the scene lets go.
function aimAt(t, box, move = 'glide', how = {}) {
  const at = stepAim(t, box, move, how);
  S.camX = at.x;
  want = lift = at.y - restY();
  clampCam();
}
// What a scene is about this frame: the box its row names, else the one the
// table of subjects below names for it.
function sceneBox(sc) {
  if (sc.frame) return sc.frame();
  return subject();
}
// ...for the readout (`__shot`): the frame of the scene that has the camera,
// null with none, or on its way out.
export const shotFrame = () => {
  if (S.shot && !S.shot.out) return sceneOf(S.shot.name).asks ? aimBox() : sceneBox(sceneOf(S.shot.name));
  return (shotNow || shotLive) && aiming() ? aimBox() : null;
};

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
  shotLive = shotNow;
  shotNow = false;
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

// The bands' depth is shot.js's (`bandCells`, `bandWorld`): one number for
// the drawing, the framing and the checks.

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
  // A scene kept by the module that plays it may name its own box (the acts'
  // beats, actbeats.js): what it looks at put between the bands.
  const row = S.shot && SCENES[S.shot.name];
  if (row && row.frame) return [row.frame()];
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
// While the shot is aiming the lift is the shot's own (`aimAt`), held as it
// set it.
export function frameHeight(camY) {
  if (S.hush > 0 && !shotHolds()) {
    const box = subject();
    if (box) want = need(camY, box);
  }
  return camY + lift;
}
function stepLift(step) {
  if (shotHolds()) return;
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
// A shot under way starts its move again from the new framing.
export function dropLift() { want = 0; lift = 0; if (shotHolds()) newAim(); }
// For the checks: whether the move has come all the way to what the subject
// needs from the view as it stands now -- for the shot, its glide arrived.
export function liftArrived() {
  if (shotHolds()) return aimArrived();
  const box = subject();
  return Math.abs(lift - (box ? need(S.camY - lift, box) : want) * S.hush) < 0.5;
}

// A scene whose place has gone from under it (the first trip down's deep,
// the way up taken while it played): nothing is held any more, at once.
export function dropShot() {
  S.shot = null;
  dropAim();
  lockScroller(false);
}

// Over or skipped: owed nothing more, and on its way out. The camera is
// still the beat's until the way out is walked, so the beat carries on
// (false) rather than ending on the click.
export function release() {
  if (S.shot) S.shot.out = true;
  dropAim();
  lockScroller(false);
  return false;
}
