// The dance: how a body that has stopped for a celebration or a hammer-swing
// moves on the spot. Owns the MOVES table and the jig/celebrate engine.

import { frames, frameMs, now } from '../clock.js';
import { BUILD_HAMMER_H, BUILD_HAMMER_MS, BUILD_HITS_MAX, BUILD_HITS_MIN, BUILD_REST_MS, BUILD_SHIFT, BUILD_SHIFT_SPAN,
         DANCE_BEAT, DANCE_JUMP_H, DANCE_TEMPO_HI, DANCE_TEMPO_LO, danceJumpBeat,
         P, WORKER } from '../config.js';
import { at } from '../grid.js';
import { spawnGrit } from '../grit.js';
import { rand } from '../rng.js';
import { fallMs } from '../rock.js';
import { S, floor } from '../state.js';
import { commutePace } from '../upgrades.js';
import { siteBox } from '../works.js';
import { duck, stand } from '../crew.js';
import { onYard, surfaceUnder } from './body.js';
import { bridgeSpan } from '../world.js';
import { buriedAt } from '../intro.js';
import { MEET_CLEAR } from '../config.js';

// --- the dance ----------------------------------------------------------------
// A body is a symmetrical filled square drawn from `x` and `y` alone, so a
// move is written in height, the one thing that can be seen, and every body
// rolls its own rate so the gang are not all pulsing on one tick.
//
// A move is counted in beats from its own start, never off the wall clock:
// swing = |sin(beat * PI)| is zero at every whole beat, so every move has the
// body on the ground at `w.foot` there, and a move that ends on a whole beat
// hands the next one a body standing on its mark. That is what keeps the
// joins from teleporting, and it is a property of where the beats are cut, so
// another row in the table gets it unasked.
//
//   beat   how fast this move pulses, as a multiple of DANCE_BEAT. Nothing
//          here may run up to DANCE_BUZZ: a body crossing its own height two
//          and a half times a second is buzzing, not dancing.
//   beats  how many whole beats a body does before it swaps, low and high of
//          the roll. Beats, not milliseconds, because the join has to land on
//          one.
//   at     one frame of it, given the swing (0..1), the frame length, the
//          ground under a falling rock, and the beat it is on.
//
// One move, and it is jumping: a move that travels reads as milling about.
const MOVES = {
  jump: {
    // A getter, because it is derived from DANCE_BUZZ and the top of the tempo
    // roll (config/effects.js) and the panel's dial moves it; a plain field
    // would freeze the value at import and the slider would go dead.
    get beat() { return danceJumpBeat(); },
    beats: [2, 4],
    at: (w, swing) => { w.y = w.foot - swing * DANCE_JUMP_H * P; }
  }
};
export const MOVE_KEYS = Object.keys(MOVES);      // the dance's own -- see below

// The builders' move, added after `MOVE_KEYS` is taken so the celebration
// never rolls it. A short dip plus the lunge (`LOOK.builder` in render.js)
// throwing the body into the work, because the engine cannot draw an arm.
MOVES.build = {
  beat: 1000 / (BUILD_HAMMER_MS * DANCE_BEAT),
  beats: [1, 1],
  at: (w, swing) => { w.y = w.foot - swing * BUILD_HAMMER_H * P; }
};

// How long one beat of a move takes this body, at its own rolled tempo.
const beatMs = (w, move) => 1000 / (DANCE_BEAT * move.beat * (w.jigRate || 1));

// Whether a beat starting at `at` would still be in the air when the yard
// stops watching. The horizon is one frame earlier than `endsAt`: the dance
// draws while `now < endsAt`, so a beat landing on that frame never gets the
// frame that puts its feet down, and the body is switched off mid-air.
const overruns = (w, move, at, endsAt) =>
  at + beatMs(w, move) > endsAt - frameMs();

// Start a move at the instant the last one ended, not the instant this frame
// began, so a frame's overshoot is not thrown away and the beats stay flush.
function startMove(w, at, key) {
  const [lo, hi] = MOVES[key].beats;
  w.move = key;
  w.moveAt = at;
  w.moveFrom = w.x;
  w.moveBeats = lo + Math.floor(rand() * (hi - lo + 1));
}

// When the yard stops watching: a rock in the air is the nearer end, because
// the landing is what everybody turns back to work for; otherwise the clock.
// Every body reads the same instant, so the gang wind down together.
const danceEnd = now =>
  S.rockFall > 0 ? now + fallMs() : S.danceUntil;

// On the bridge over the cut, which is a way, not the yard: a body stopped on
// the ramp dances on a slope and the stride back to work reads as a drop, so
// it comes down before it joins in. ON it, not under it: the span alone puts
// every quarrier on the floor of the cut "on the bridge", and the whole gang
// stands rigid through every celebration. The feet say which, the same line
// `wayAt` draws.
const onBridge = w => {
  if (!S.quarryOpen) return false;
  if (w.y + WORKER > S.groundY + 1) return false;
  const { x0, x1 } = bridgeSpan();
  return w.x + WORKER > x0 && w.x < x1;
};

function jig(w, now, zone, endsAt) {
  // `foot` is wiped by `settle` and by a landing, neither of which ends the
  // jig (no stepper runs while the yard celebrates); a body jumping off a foot
  // of `null` dances at the top of the window, so it joins again from where it
  // stands.
  if (w.jigAt != null && w.foot == null) w.jigAt = null;
  if (w.jigAt == null) {
    // A body on the bridge is on a slope and comes down before it joins in.
    if (onBridge(w)) return;
    // On its own surface before the foot is taken, or the stride back to work
    // climbs out of a heap in one frame (a saved body can be standing inside
    // ground that moved under it). The standing is done HERE, a climb's pace
    // a frame: the celebration sits above every stepper, so a body waiting for
    // its own stepper to ease it up stands rigid through the whole dance.
    if (Math.abs(w.y - surfaceUnder(w)) > P) { w.y = stand(w); return; }
    // Never latch a walking body's foot: mid-stride it is wherever the walk had
    // it, and if the ground question then moves (the camera, a route's own
    // footing) the body floats. On the yard the walk is given up and the body
    // stood first; off the yard (a face, a ladder) the walk keeps it and it
    // joins if it tops out.
    if (w.walking) {
      if (!onYard(w)) return;
      w.walking = false; w.legs = null; w.leg = 0;
      w.y = stand(w);
    }
    // The ground this body dances on: where it already is, not a fresh surface
    // lookup. Its own stepper put it there and knows things this does not (a
    // quarrier stands on the floor of the cut).
    w.foot = w.y;
    w.footAt = w.x;
    w.jigAt = w.x;
    w.jigDir = rand() < 0.5 ? -1 : 1;
    // its own tempo, so the gang are never all on one tick -- see `beatMs`
    w.jigRate = DANCE_TEMPO_LO + rand() * (DANCE_TEMPO_HI - DANCE_TEMPO_LO);
    w.jigBeat = null;                // no beat counted yet, and not winding down
    w.jigDown = false;
    startMove(w, now, MOVE_KEYS[Math.floor(rand() * MOVE_KEYS.length)]);
  }

  // The frame this body last danced. `jigAt` says it has a mark, which it
  // keeps through a fall; this says it actually danced, and is what anybody
  // measuring the dance should ask.
  w.jigOn = now;

  let move = MOVES[w.move] || MOVES.jump;
  let beat = (now - w.moveAt) / beatMs(w, move);

  // Nobody is caught mid-air by the end of the celebration: a body only goes
  // up if it can be back down first, asked at the top of every beat, the one
  // moment it is on the ground and the answer costs no jump. Winding down is
  // the same dance with the bounce taken out. Asked afresh each beat rather
  // than latched, because the end moves when a rock lands.
  const whole = Math.floor(beat);
  if (endsAt != null && whole !== w.jigBeat) {
    w.jigBeat = whole;
    w.jigDown = overruns(w, move, now, endsAt);
  }

  // A move ends on a whole beat and the next one starts from that same instant.
  if (beat >= w.moveBeats) {
    const ended = w.moveAt + w.moveBeats * beatMs(w, move);
    // On the ground before the next move reads `w.y`, so the join is exact.
    w.y = w.foot;
    // "Anything but this one, or this one again if there is nothing else", so
    // a second dance move added to the table is swapped to without coming
    // back here.
    const other = MOVE_KEYS.filter(m => m !== w.move);
    startMove(w, ended, other.length ? other[Math.floor(rand() * other.length)] : w.move);
    move = MOVES[w.move];
    beat = (now - w.moveAt) / beatMs(w, move);
    // The wind-down is asked AGAIN for the beat about to be drawn: the answer
    // above was for the beat that just finished, and acting on it here is
    // free because the body is on the ground at this exact instant. Without
    // this a last beat inside the final second takes off for one frame.
    // Measured against `w.moveAt` rather than `now`, because the frame's own
    // overshoot is not part of the question.
    w.jigBeat = Math.floor(beat);
    if (endsAt != null) w.jigDown = overruns(w, move, w.moveAt, endsAt);
    // something over its head now and then: five bodies all shouting at once
    // is noise
    if (rand() < 0.5)
      w.say = { mark: rand() < 0.5 ? 'note' : 'burst', until: now + 900, of: 'dance' };
  }
  if (w.say && now >= w.say.until) w.say = null;

  // The swing is the height, and a body winding down has none.
  const swing = w.jigDown ? 0 : Math.abs(Math.sin(beat * Math.PI));
  move.at(w, swing, frames(), zone, beat);
}

// wiped when the dance ends, so the next one picks fresh ground
export function stopJig(w) {
  // A say names what made it, and the dance takes back only its own: wiping
  // `say` outright here silences the rock landing on the same frame.
  if (w.say && w.say.of === 'dance') w.say = null;
  w.jigAt = null;
  w.move = null;
  w.moveFrom = null;
  w.moveAt = 0;
  w.moveBeats = 0;
  w.jigRate = 0;
  w.jigBeat = null;
  w.jigDown = false;
  w.shiftTo = null;
}

// --- the builders' work jig ---------------------------------------------------
// One frame of a builder hammering at a busy site: the dance's own
// `MOVES`/`startMove` on the one move built for it, which never swaps and
// never winds down. The caller sets `w.foot` first. The rhythm is a burst,
// not a metronome: a few hits in one place, a step along, a few more, each
// strike throwing its own grit.

// The patch a body works across, in world x: the GROUND UNDERFOOT, less the
// body's own width so it never hangs off the far end. One number for
// everybody walks a body off the end of a bench and hammers on thin air.
function jigSpan(w, zone = null) {
  // A caller that knows its own ground says so (`zone`): a gang body at its
  // shed is on the shed's front, not on the site's box.
  const box = zone || siteBox(w.site);
  if (box && box.w > WORKER) return { from: box.x, to: box.x + box.w - WORKER };
  // No zone to speak of: back along the yard from the mark it arrived on, or
  // from where it stands on the frame there is no mark yet.
  const at = w.jigAt ?? w.x;
  return { from: at - BUILD_SHIFT_SPAN, to: at };
}

export function workJig(w, at, zone = null) {
  if (w.jigAt == null) {
    // On to the patch before the first blow: `stepBuilder` calls a body
    // arrived within a pixel of the mark, and that pixel can be off the near
    // end of the thing it is standing on. Every later patch is clamped below;
    // the first has to be clamped here.
    const span = jigSpan(w, zone);
    w.x = Math.max(span.from, Math.min(span.to, w.x));
    w.jigAt = w.x;              // the near end of the patch it is working
    // Away from the thing being built, not into it: `buildStationX` stands the
    // body off the footprint so it is not lost against the black of the
    // building.
    w.jigDir = -1;
    w.jigRate = 1;
    w.jigBeat = null;
    w.jigDown = false;
    w.hits = 0;
    w.hitsWanted = nextBurst();
    w.restUntil = 0;
    startMove(w, at, 'build');
  }
  w.jigOn = at;

  // Between bursts the body WALKS to its next patch; shifting `w.x` a whole
  // `BUILD_SHIFT` in one frame is a teleport.
  if (at < (w.restUntil || 0)) {
    w.y = w.foot;
    w.lunge = 0;
    if (w.shiftTo != null) {
      const d = w.shiftTo - w.x;
      const step = Math.min(commutePace() * frames(), Math.abs(d));
      if (Math.abs(d) < 0.5) w.shiftTo = null; else w.x += Math.sign(d) * step;
    }
    return;
  }

  const move = MOVES.build;
  let beat = (at - w.moveAt) / beatMs(w, move);
  if (beat >= w.moveBeats) {
    // The blow lands, with the same lunge a shovel's swing plants at the
    // bottom of its stroke (`sweepMuckAt`).
    const ended = w.moveAt + w.moveBeats * beatMs(w, move);
    w.y = w.foot;
    w.lunge = 1;
    // One puff per hit, off the body's waist rather than its feet: a chip at
    // ground level is drawn on the ground line, which is already black.
    spawnGrit(w.x + WORKER / 2, w.foot + WORKER / 2);
    if (++w.hits >= w.hitsWanted) {
      // Burst done: rest a beat, then the next patch a step along, turning
      // back at the edge of the span so a long build does not walk the body
      // off the site.
      w.hits = 0;
      w.hitsWanted = nextBurst();
      w.restUntil = ended + BUILD_REST_MS;
      const span = jigSpan(w, zone);
      let next = w.x + w.jigDir * BUILD_SHIFT;
      if (next > span.to || next < span.from) {
        w.jigDir = -w.jigDir;
        next = w.x + w.jigDir * BUILD_SHIFT;
      }
      // Aimed, not applied: the rest window above walks it there.
      w.shiftTo = Math.max(span.from, Math.min(span.to, next));
      w.lunge = 0;
      startMove(w, ended + BUILD_REST_MS, 'build');
      return;
    }
    startMove(w, ended, 'build');
    beat = (at - w.moveAt) / beatMs(w, move);
  }
  move.at(w, Math.abs(Math.sin(beat * Math.PI)));
}

// How many blows this burst gets, rolled every time so no two builders are in
// step.
const nextBurst = () =>
  BUILD_HITS_MIN + Math.floor(rand() * (BUILD_HITS_MAX - BUILD_HITS_MIN + 1));

// --- the celebration ------------------------------------------------------------
// A rock is off, and every body in the yard stops what it is doing and dances.
// While the yard celebrates this is the ONLY thing that moves a body: the
// stage sits above the commute, the work and the mess, so no clamp, no elbow
// and no stepper can fight it. Two things moving one body on one frame is the
// judder. Bodies may stand in each other for a few seconds, which is smaller.
export function celebrate(w, now, zone) {
  w.resting = false;                   // a dance is not a break
  w.idleAt = null;
  w.lunge = 0;

  // The reunion is not a party: the camera is moving and a body latched
  // mid-camera-move floats. Everyone but the pair steps clear of the meeting
  // zone as they would a falling rock, and stands.
  if ((S.intro === 'meet' || S.intro === 'part') && !S.reunionDone) {
    if (w.jigAt != null && MOVE_KEYS.includes(w.move)) stopJig(w);
    if (!w.met && onYard(w)) {
      const at = buriedAt();
      const mz = { from: at.x - MEET_CLEAR, to: at.x + WORKER + MEET_CLEAR };
      // clear of the meeting first, and of a rock already on its way second:
      // during `part` the next boulder is falling on the same spot
      if (!duck(w, mz) && zone) duck(w, zone);
    }
    w.y = stand(w);
    return;
  }

  // A body that was hammering arrives with a jig already running, and
  // inheriting it has a builder celebrate at a hammer's beat. Asked of the
  // move rather than of the job, so a second work jig gets it too.
  if (w.jigAt != null && !MOVE_KEYS.includes(w.move)) stopJig(w);
  // The footing, taken ONCE when the body joins in: read afresh every frame it
  // is a third thing moving a dancing body, a whole cell at the lip of the
  // hole or the toe of a pile.
  w.footAt = w.x;

  // Out from under a coming rock BEFORE any of the dance runs, and dancing
  // nothing while it goes; ducking and dancing the same body on one frame is
  // the judder. Only a body on the open yard: `duck` has no notion of walls,
  // and shoves a quarrier on the floor of the cut out through its side. Asked
  // as `onYard`, never `upTop`: a pixel tolerance at the ground line is
  // crossed by the idle bob, and a miner half way through a bob then stands in
  // the footprint for the whole fall.
  if (onYard(w) && duck(w, zone)) {
    w.jigAt = null;                    // it will take its mark where it ends up
    w.y = stand(w);
    return;
  }

  // The mark is never under the rock either: a zone announced mid-celebration
  // pushes it to the near edge rather than re-taking it, so the dance carries
  // on instead of restarting.
  if (zone && w.jigAt != null && w.jigAt + WORKER > zone.from && w.jigAt < zone.to)
    w.jigAt = w.x + WORKER / 2 < (zone.from + zone.to) / 2 ? zone.from - WORKER - P : zone.to + P;

  jig(w, now, zone, danceEnd(now));
}
