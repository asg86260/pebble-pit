// The dance: how a body that has stopped for a full pile, a celebration or a
// hammer-swing moves on the spot. Extracted verbatim from crew.js; behavior
// unchanged. Owns the MOVES table and the jig/celebrate engine. It leans on
// two helpers the spine still owns (duck, stand), imported from crew.js, and
// on body.js for onYard; the spine in turn calls stopJig, workJig, celebrate
// and MOVE_KEYS from here.

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
// A rock is off and the gang have the ground to themselves. This used to be one
// hop on the spot with a fortieth of a pixel of sway on it, played by everybody
// at a half-beat offset -- which on five squares eighteen pixels tall did not
// read as dancing. It read as vibrating.
//
// What was wrong with it was not the size of the hop. It was that nobody *went*
// anywhere and nobody did anything twice. So it became three moves, held for a
// couple of beats each and then swapped, with a patch of ground each to do them
// on -- and the two that travelled turned out to be the wrong answer to that
// (item 21, feedback5): a gang that ambles sideways and turns on the spot reads
// as milling about, not as pleased. What a body does now is jump, higher and
// quicker than the old hop, and that is the whole table.
//
// Here is the whole of what a body has to dance with -- because the answer is
// short, and every move below is built out of it and nothing else:
//
//   **Where it is.** `w.x`, in whole cells.
//   **How high it is.** `w.y` off `w.foot`, in whole cells.
//
// That is the list. A body is a filled square, symmetrical, drawn from `x` and
// `y` alone -- `drawBody` takes no facing, and there is nothing on a body that
// is not the same on both sides of it. So facing draws *nothing* here: the old
// spin turned the body over twice a second and the screen did not change
// a pixel, and the old step travelled six hundredths of a cell a frame,
// undivided by frame time, so it barely went anywhere and went less of it the
// faster the display ran. Two of the three moves were invisible. What was left
// was a square changing height on the spot at two and a half beats a second --
// which is the definition of vibrating, and is exactly what it looked like.
//
// So a move is written in height, which can be seen, and every body rolls its
// own rate so the gang are not all pulsing on one tick. And it is a table rather
// than a chain of ifs: a move is a row, the next one is another row, and no row
// can quietly forget to move. It is one row long today; the builders' hammer is
// a second one, added below where the dance's own roll cannot reach it.
//
// --- and a move is counted in beats, from its own start -----------------------
// The third rewrite is about the seams rather than the moves. Every move used to
// be read off the wall clock -- `now / 1000 * rate` -- and every move has its own
// height: a cell for the step, two for the spin, three for the hop. So the swing
// a body was on when it swapped moves was whatever the clock happened to be
// showing, and the height it was swinging through changed at the same instant.
// The body did not move to the next thing. It *appeared* in it: measured jumps of
// fifteen pixels of height and five of ground in a single frame, on a body
// eighteen pixels tall -- three or four of them per body per celebration, plus
// one entering the dance and one leaving it. That is the glitching, and no amount
// of tuning the moves themselves would have touched it, because it was never in
// a move. It was in the joins.
//
// So the clock is gone from here. A move is measured from the instant it started
// and is a whole number of beats long, which fixes both ends of every join at
// once, because at a whole beat every move is in the same pose:
//
//   swing = |sin(beat * PI)| is zero at every whole beat -- the body is on the
//   ground, and every move draws it at `w.foot` there, whatever its height.
//
// A move therefore ends with the body standing on the ground on its mark, and
// the next one begins from exactly there. Nothing to jump across. It is a
// property of where the beats are cut, not a number anybody tuned, so another
// move added to the table below gets it without asking.
//
//   beat   how fast this move pulses, as a multiple of DANCE_BEAT. Nothing here
//          may run up to DANCE_BUZZ: a body crossing its own height two and a
//          half times a second is not dancing, it is buzzing, and that is the
//          other half of what was wrong.
//   beats  how many whole beats of it a body does before it swaps -- the low
//          and the high of the roll. Beats and not milliseconds, because the
//          join has to land on one.
//   at     one frame of it: where the body goes and how high, given the swing
//          (0..1, the pulse), the length of the frame, the ground under a
//          falling rock that it may not wander onto, and the beat it is on.
// --- and there is one of them, and it is jumping ------------------------------
// The dance was three moves: this one, a pace across the ground, and a turn on
// the spot. Both of the others travelled, and travelling is what was wrong with
// them (item 21, feedback5). A gang celebrating a finished rock by ambling
// sideways and turning round on the spot reads as a shuffle -- as bodies milling
// about -- and what it is meant to read as is delight. People jump when they are
// pleased. They do not pace.
//
// So the two that went sideways are gone, and what is left is the one that was
// always the clearest thing in the table: straight up, straight down, higher and
// quicker than before. No arc, no travel, nothing that has to be measured against
// the drop zone or the footing, and the whole of the join arithmetic below still
// holds -- a jump is on the ground at every whole beat, which is where the next
// one starts it.
const MOVES = {
  // Straight up and down. The one move that is all height and no ground.
  jump: {
    // Read through a getter, because it is derived from DANCE_BUZZ and the top
    // of the tempo roll (see config/effects.js) and the panel's dial moves the
    // room it is allowed rather than the beat itself. A plain field here would
    // freeze whatever the value was at import and the slider would go dead.
    get beat() { return danceJumpBeat(); },
    beats: [2, 4],
    at: (w, swing) => { w.y = w.foot - swing * DANCE_JUMP_H * P; }
  }
};
export const MOVE_KEYS = Object.keys(MOVES);      // the dance's own -- see below

// The builders' move, added after `MOVE_KEYS` is taken rather than into the table
// above, so the rock's own celebration never rolls it by chance -- see B2 in
// wave-feedback3.md and, for the rewrite, the hammer note in config.js.
//
// A builder swings a hammer. The body dips and drives rather than leaping: the
// engine cannot draw an arm, so the strike is a short drop plus the lunge
// (`LOOK.builder` in render.js) throwing the body into the work. It hopped two
// cells on a 1400ms beat before, which at any speed reads as a body bouncing
// on the spot rather than one hitting something.
MOVES.build = {
  beat: 1000 / (BUILD_HAMMER_MS * DANCE_BEAT),
  beats: [1, 1],
  at: (w, swing) => { w.y = w.foot - swing * BUILD_HAMMER_H * P; }
};

// How long one beat of a move takes this body, in milliseconds. A body's own
// tempo is in here: the gang used to be spread across the beat by the slot they
// held on the rock, which is a number a hauler has not got -- so anybody who had
// never been on the rock danced on the same tick as everybody who had. Every
// body rolls its own rate instead, so no two of them are ever quite together and
// nobody needs a slot to join in.
const beatMs = (w, move) => 1000 / (DANCE_BEAT * move.beat * (w.jigRate || 1));

// Whether a beat starting at `at` would still be in the air when the yard stops
// watching -- which is the question both wind-down sites below ask, written once
// because they were two copies of it and only one of them was ever read closely.
//
// The horizon is one frame earlier than `endsAt`, and that is the whole of it.
// The dance draws while `now < endsAt` (`dancing`, step.js), so the frame at
// `endsAt` is the first one it does not draw, and a beat whose landing falls on
// that frame -- or anywhere in the gap before it -- never gets the frame that
// would have put its feet down. The body's last drawn position is wherever the
// arc had reached.
//
// It read `at + beatMs(w, move) > endsAt`, which calls a beat landing exactly on
// `endsAt` "in time". Measured on the stuck-yard fixture: a hauler's beat began
// at 4517 and ran 500ms against a `danceUntil` of 5017, so the test was
// `5017 > 5017` -- false -- and the body was switched off 1.2px off the ground,
// one frame short of landing. A quarrier beside it went the same way.
const overruns = (w, move, at, endsAt) =>
  at + beatMs(w, move) > endsAt - frameMs();

// Start a move at a given instant -- which is the instant the last one ended,
// not the instant this frame began, so the overshoot of a frame is not thrown
// away and the beats stay flush with each other.
function startMove(w, at, key) {
  const [lo, hi] = MOVES[key].beats;
  w.move = key;
  w.moveAt = at;
  w.moveFrom = w.x;
  w.moveBeats = lo + Math.floor(rand() * (hi - lo + 1));
}

// When the yard stops watching. Two things hold a dance open and they are asked
// in order rather than taken the later of: a rock in the air is the nearer end
// of the two, because the landing is what everybody in the yard turns back to
// work for -- see the mess walk, which takes its body back the moment the rock
// is down, and takes it back mid-hop if the dance has not put its feet on the
// ground first. With nothing in the air it is the five seconds on the clock.
//
// Every body reads the same instant, so the gang wind down together rather than
// one at a time.
const danceEnd = now =>
  S.rockFall > 0 ? now + fallMs() : S.danceUntil;

// `zone` is the ground the next rock is coming down on, when there is one. The
// dance itself no longer travels -- it is jumping on the spot -- so nothing in
// here walks a body into the drop zone any more; it is still taken, because
// `celebrate` above ducks a body clear before it joins in and wants the same
// answer this does.
//
// `endsAt` is when the yard stops celebrating, and it is here for the last join
// of all: a body still in the air when the dance is switched off lands by
// teleport. It is the same rule as every other join, asked one beat early.
// On the bridge over the cut -- a ramp or the deck -- which is a way, not the
// yard: the walk keeps a body there until it comes down, the way it keeps one
// on a face or a ladder. A body stopped on the ramp danced on a slope, and the
// stride that took it back to work was a cell of height for the ramp's own
// twenty degrees, which read as the dance dropping it.
const onBridge = w => {
  if (!S.quarryOpen) return false;
  const { x0, x1 } = bridgeSpan();
  return w.x + WORKER > x0 && w.x < x1;
};

function jig(w, now, zone, endsAt) {
  // the mark it dances on, taken once: where it stands. It used to be a spot
  // rolled a few cells either side, because the dance paced across it and the
  // roll is what spread the gang out; jumping goes nowhere, so a body's mark is
  // its own feet and there is nothing to spread.
  if (w.jigAt == null) {
    // Never latch a walking body's foot (wave7-sky, A2). `w.foot` is taken from
    // `w.y` below and every move measures its height off it, so a body handed
    // to the dance mid-stride latches wherever its walk happened to have it --
    // and if anything then moves the ground question out from under it (the
    // cutscene's camera, a route's own footing), the body floats on a foot that
    // was never the ground. On the yard the celebration owns the frame, so the
    // walk is given up and the body stood on its own ground before the foot is
    // taken -- "wait for the walk to finish" was tried and a commute the dance
    // itself preempts never finishes, so nobody mid-errand ever danced. Off the
    // yard (a face, a ladder) the walk keeps the body; it joins if it tops out.
    // ...nor a body on the bridge, walking or between strides: it is on a
    // slope, and it comes down before it joins in.
    if (onBridge(w)) return;
    // And on its own surface before the foot is taken. A body loaded from a
    // save keeps the y it was saved at, and the ground under that x may have
    // changed under it -- the walk closes up and spreads out as the yard's
    // spacing changes -- so a farmhand saved on bare yard can be standing a
    // cell and a half into a heap. Latched there, the stride that took it back
    // to work climbed out of the heap in one frame, which read as the dance
    // dropping it. So it does not join until its own stepper has it standing
    // where it stands: the climb is eased, and nothing jumps. `surfaceUnder`
    // asks the way the body is on, so a quarrier on the floor of the cut and a
    // rockhand on the crest are on their surfaces and join at once.
    if (Math.abs(w.y - surfaceUnder(w)) > P) return;
    if (w.walking) {
      if (!onYard(w)) return;
      w.walking = false; w.legs = null; w.leg = 0;
      w.y = stand(w);
    }
    // The ground this body will dance on, for as long as it dances. Everything
    // below turns on it: the height of every move is measured off `foot`, and
    // the step turns back where the footing changes.
    //
    // Where the body already is, and not a fresh lookup of the surface. Its own
    // stepper put it there and knows things this does not -- a quarrier stands
    // on the floor of the cut, which `surfaceUnder` answered with the yard's
    // own line, so the first frame of the dance lifted four bodies out of the
    // cut and stood them on the ground above it. Nothing in here knows better
    // than the job about where that job stands.
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

  // The frame this body last danced. `jigAt` says a body has a mark to dance
  // around, which it keeps hold of through a fall even on the frames something
  // else is moving it; this says it actually danced, and it is what anybody
  // measuring the dance should ask.
  w.jigOn = now;

  let move = MOVES[w.move] || MOVES.jump;
  let beat = (now - w.moveAt) / beatMs(w, move);

  // Nobody is caught in mid-air by the end of the celebration. A body only goes
  // up if it can be back down before the yard has something else to look at, and
  // it is asked at the top of every beat -- which is the only moment it is on the
  // ground and so the only moment the answer can be acted on without a jump.
  // Asked at any other moment it would be answered by dropping the body wherever
  // it happened to be, which is the fifteen-pixel teleport this whole rewrite is
  // about, moved to the end of the dance.
  //
  // What it does then is not stop. It is the same dance with the bounce taken
  // out: the feet stay down and the ground travel carries on, so a body winds
  // down rather than being switched off. See `swing` at the bottom.
  // Asked afresh each beat rather than latched, because the end moves: a rock
  // lands and the five seconds on the clock are the horizon again, which is
  // further off than the beat this body is standing out. A body that has stood
  // one beat out is on the ground, so it can join back in without a jump -- the
  // same reason it could stand out without one.
  const whole = Math.floor(beat);
  if (endsAt != null && whole !== w.jigBeat) {
    w.jigBeat = whole;
    w.jigDown = overruns(w, move, now, endsAt);
  }

  // A move ends on a whole beat and the next one starts from that same instant.
  // Never the one it is already doing.
  if (beat >= w.moveBeats) {
    const ended = w.moveAt + w.moveBeats * beatMs(w, move);
    // The body is on the ground at a whole beat, whatever the move was doing on
    // the way there. Put it there before the next move reads `w.y` off it, so
    // the join is exact rather than a frame's worth of near enough.
    w.y = w.foot;
    // The next move, which is another run of the same one while the dance has
    // only jumping in it. Written as "anything but this one, or this one again
    // if there is nothing else" rather than as `startMove(w, ended, 'jump')`,
    // because a second dance move added to the table gets swapped to without
    // anybody having to come back here.
    const other = MOVE_KEYS.filter(m => m !== w.move);
    startMove(w, ended, other.length ? other[Math.floor(rand() * other.length)] : w.move);
    move = MOVES[w.move];
    beat = (now - w.moveAt) / beatMs(w, move);
    // And the wind-down is asked AGAIN, here, for the beat the body is about to
    // draw -- because the beat it was asked about a few lines up is not that
    // beat, it is the one that has just finished.
    //
    // What that cost, when the dance had three moves to roll between, was
    // invisible: the answer above was made against the old move's length, the
    // swap happened, and the new move drew its first frame under it. Now that
    // there is only jumping, the seam shows -- a body whose last beat lands
    // inside the final second takes off for exactly one frame (a pixel and a
    // half of lift, measured), is told to stand down on the next, and comes back
    // to the ground. Nobody could see it and a peak-finder can: it makes a
    // second bump half a beat after a real one, which reads as a body crossing
    // its own height twice as often as it does. The blip is the bug either way,
    // and this is where it was made -- the body is on the ground at this exact
    // instant, so this is the one moment the answer can be acted on for free.
    //
    // Measured against `w.moveAt` rather than `now`: the question is whether the
    // beat that starts *there* has landed by `endsAt`, and the frame's own
    // overshoot is not part of it.
    w.jigBeat = Math.floor(beat);
    if (endsAt != null) w.jigDown = overruns(w, move, w.moveAt, endsAt);
    // and something over its head, now and then rather than every time: five
    // bodies all shouting at once is noise
    if (rand() < 0.5)
      w.say = { mark: rand() < 0.5 ? 'note' : 'burst', until: now + 900 };
  }
  if (w.say && now >= w.say.until) w.say = null;

  // The swing is the height, and a body winding down has none: its feet are on
  // the ground for the rest of the celebration and everything else about the
  // move goes on as it was.
  const swing = w.jigDown ? 0 : Math.abs(Math.sin(beat * Math.PI));
  move.at(w, swing, frames(), zone, beat);
}

// wiped when the dance ends, so the next one picks fresh ground
export function stopJig(w) {
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
// One frame of a builder hammering at a busy site (B2, wave-feedback3.md,
// rewritten). It is the dance's own `MOVES`/`startMove` read a different way
// rather than a second animator: the same beat-and-swing arithmetic `jig`
// uses, on the one move built for it (`MOVES.build`, above), which never swaps
// to another and never winds down -- a body at a bench works until the bench
// is done, not until a clock five seconds out says the party is over.
//
// The caller sets `w.foot` first -- the bench's top edge or the ground beside
// the site, whichever this body is standing on -- the same way `heldUp` sets
// it before handing off to `jig`.
//
// The rhythm is a burst, not a metronome: a few hits in one place, a step
// along, a few more. A body striking the same pixel at a fixed rate for three
// minutes is a machine; a body that works a patch, moves, and works the next
// one is somebody building something. Each strike throws its own grit, which
// is why the dust comes off the blow rather than off a timer of its own.
// The patch a body works across, in world x. A burst walks the body a few cells
// along and the next burst a few more, and this is what says how far it may get.
//
// It is the GROUND UNDERFOOT that answers, not one number for everybody. A
// build site has the open yard beside it and the span is whatever reads as
// working a stretch of it. A bench is twelve cells of timber standing on two
// legs, and a body allowed the same span walks off the end of it and hammers on
// thin air -- which is what it did: the patch ran sixty pixels back from the
// middle of a seventy-two pixel top, so an eighteen pixel body finished a
// couple of cells clear of the near end.
//
// Widening the bench would have fixed the bench and left the next narrow thing
// anybody stands on to be found by looking at it. Asking the footing is the
// same question every time.
function jigSpan(w) {
  // The whole of the ground the work is on, less the body's own width so it
  // never hangs off the far end. One rule for every site: a bench top, a
  // building's footprint, the strip of yard a machine is being fitted along.
  //
  // It used to be the bench's slab as a special case and, everywhere else, ten
  // cells back from wherever the body happened to arrive -- which is a patch
  // about the walk rather than about the thing being built, and on a wide site
  // it left the builder working one corner of it.
  const box = siteBox(w.site);
  if (box && box.w > WORKER) return { from: box.x, to: box.x + box.w - WORKER };
  // No zone to speak of: back along the yard from the mark it arrived on --
  // or, on the frame the jig starts and there is no mark yet, from where it is
  // standing, which is the same spot a moment earlier.
  const at = w.jigAt ?? w.x;
  return { from: at - BUILD_SHIFT_SPAN, to: at };
}

export function workJig(w, at) {
  if (w.jigAt == null) {
    // On to the patch before the first blow, not merely near it.
    //
    // `stepBuilder` calls a body arrived when it is within a pixel of the mark,
    // and it has to: testing arrival against the exact pixel puts the walk and
    // the hammer in a tug of war (the note there says it at length). But a
    // pixel of slack in *arriving* was also a pixel of slack in *standing*: the
    // body stopped wherever its last step left it and started work there, so
    // it could begin up to a pixel off the near end of the very thing it is
    // standing on. Every patch after the first is clamped into the span below;
    // the one it walked to was not.
    //
    // Which end of the mark that pixel fell on was decided by how far the body
    // had walked to get there -- so it changed when the yard's spacing changed,
    // and a builder that had always started just inside the bench started just
    // outside it. A tolerance that depends on the length of a walk is not a
    // tolerance about the bench at all.
    const span = jigSpan(w);
    w.x = Math.max(span.from, Math.min(span.to, w.x));
    w.jigAt = w.x;              // the near end of the patch it is working
    // Away from the thing being built, not into it. `buildStationX` stands the
    // body off the footprint's left edge precisely so it is not lost against
    // the black of the building; a burst that walked the other way put it back
    // inside within two shifts and undid that.
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

  // Between bursts the body WALKS to its next patch. It does not appear there.
  //
  // This shifted `w.x` by a whole `BUILD_SHIFT` -- four cells -- in the single
  // frame the burst ended, which is a body teleporting, and this yard has one
  // rule it has never broken: every body walks. It was also invisible as a bug
  // and measurable as one, which is why `tools/node/walk-pace.mjs` reads the
  // fastest frame of travel rather than an average: a 24px hop in one frame
  // stood out of that reading instantly and stood out of the picture not at all.
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
    // The blow lands. The lunge is the same one a shovel's swing plants at the
    // bottom of its stroke (see `sweepMuckAt`), so the strike reads as a body
    // driving into the work rather than settling out of a hop.
    const ended = w.moveAt + w.moveBeats * beatMs(w, move);
    w.y = w.foot;
    w.lunge = 1;
    // One puff per hit, off the point of impact -- at the body's feet, which is
    // where the head of a hammer is if the body is swinging one.
    // Off the body's waist rather than its feet. A chip leaving at ground level
    // is a chip drawn on the ground line, which is already black.
    spawnGrit(w.x + WORKER / 2, w.foot + WORKER / 2);
    if (++w.hits >= w.hitsWanted) {
      // Burst done: rest a beat, then take the next patch a step along. It
      // turns back at the edge of its span the way the dance's `step` turns at
      // the edge of its patch -- otherwise a long build walks the body clean
      // off the site it is meant to be putting up.
      w.hits = 0;
      w.hitsWanted = nextBurst();
      w.restUntil = ended + BUILD_REST_MS;
      // The patch is whatever the body is standing on -- see `jigSpan`. It
      // turns back at either end of it the way the dance's `step` turns at the
      // edge of its patch.
      const span = jigSpan(w);
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

// How many blows this burst gets. Its own roll every time, so two builders on
// two sites are never in step and one builder never falls into a rhythm you
// can predict.
const nextBurst = () =>
  BUILD_HITS_MIN + Math.floor(rand() * (BUILD_HITS_MAX - BUILD_HITS_MIN + 1));

// --- the celebration ------------------------------------------------------------
// A rock is off, and every body in the yard stops what it is doing and dances.
// One function, called from one stage (see `celebrate` in STAGES), and that is
// the whole arrangement.
//
// It was five: a `held` row on the rockhand, an idle branch on the hauler, and
// three errand call sites that handed a body to the dance when a rock cut
// across its walk -- with every other job having no row at all, so half the
// yard went on working through the party. The judder everybody kept seeing was
// never in the moves. It was two things moving one body on the same frame: the
// duck walking it out of the drop zone while the spin pulled it back onto its
// mark; the elbow shoving it apart while the same marks dragged it home; a
// step drifting toward a mark that lay under the rock while the zone wall
// flipped it away. Each was patched where it was found -- by dragging the marks
// along with the duck, in three places, each with its own re-anchoring rule --
// and each patch left the collision itself in place.
//
// So the collision is what goes. While the yard is celebrating this is the ONLY
// thing that moves a body, because the stage sits above the commute, the work
// and the mess and nothing below it runs. No clamp, no elbow, no work stepper.
// There is nothing left to fight.
//
// Bodies may now stand in each other for a few seconds. That is a smaller thing
// to look at than either of them juddering, and the marks are spread wide
// enough that it is rare.
export function celebrate(w, now, zone) {
  w.resting = false;                   // a dance is not a break
  w.idleAt = null;
  w.lunge = 0;

  // The reunion is not a party (wave7-sky, A2). During the first-rock meeting
  // the camera is moving and the moment belongs to the pair, so nobody jumps:
  // a body latched mid-camera-move floated, and five squares bouncing around a
  // reunion read as noise over it. Everyone but the pair steps clear of the
  // meeting zone exactly as they duck a falling rock, and stands. The ordinary
  // celebration -- every rock after this one -- keeps the dance.
  if ((S.intro === 'meet' || S.intro === 'part') && !S.reunionDone) {
    if (w.jigAt != null && MOVE_KEYS.includes(w.move)) stopJig(w);
    if (!w.met && onYard(w)) {
      const at = buriedAt();
      const mz = { from: at.x - MEET_CLEAR, to: at.x + WORKER + MEET_CLEAR };
      // clear of the meeting first, and of a rock already on its way second --
      // during `part` the next boulder is falling on the same spot, and the
      // wider of the two is whichever this body is still inside
      if (!duck(w, mz) && zone) duck(w, zone);
    }
    w.y = stand(w);
    return;
  }

  // A body that was hammering arrives with a jig already running: the builders'
  // work jig is this same machinery on a move of its own (`MOVES.build`), and
  // inheriting it had a builder celebrate at a hammer's beat -- twice the pace
  // anything here is allowed to move at, which is the definition of the buzzing
  // this whole arrangement is against. Anything that is not one of the dance's
  // own moves is put away, and the join below takes fresh marks. Asked of the
  // move rather than of the job, so a second work jig added later gets it too.
  if (w.jigAt != null && !MOVE_KEYS.includes(w.move)) stopJig(w);
  // The footing, taken ONCE when this body joins in and then left alone -- see
  // the join below, where `jigAt` is taken. Read afresh every frame, as the old
  // `heldUp` read it, it is a third thing moving a dancing body: the dance
  // travels, the ground under the yard is not flat, and a body stepping over
  // the lip of the hole or the toe of a pile had its feet moved a whole cell
  // between two frames. Measured at 36px on one body in the fixture yard, which
  // is twice its own height, and at up to thirty crossings a second on another
  // -- the judder, arriving by a route nobody had looked at because until now
  // only the gang on the flat yard ever danced.
  w.footAt = w.x;

  // Out from under a coming rock BEFORE any of the dance runs, and dancing
  // nothing while it goes. This is the one ordering that matters in here: the
  // old code ducked and danced the same body on the same frame, which is the
  // judder itself. A body walks clear, and only then joins in.
  // ...and only a body out under the open sky. `duck` walks a body sideways
  // with no notion of walls, which is right on the yard and wrong everywhere
  // else: a quarrier dancing on the floor of the cut is nowhere near a rock
  // coming down on the surface, and shoving it toward the edge of the
  // footprint walked it out through the side of the cut -- the one thing
  // `route.test.mjs` exists to forbid.
  //
  // Asked as `onYard`, the same question the walk's own duck (commute.js) and
  // the fall rule ask. It used to be `upTop` -- feet within a pixel of the
  // ground line -- and a pixel is a tolerance, not a fact about the world: this
  // one was crossed by the body's own idle bob. A miner half way through a bob
  // sits 1.17px below its footing, `upTop` read false by 0.17px, the duck was
  // skipped, and `jig` then baked the bob into the footing so it stayed false
  // for every frame of the fall -- the rock landed on a body standing in its
  // own footprint, which is the buried miner in TODO.md. The two predicates
  // differ only for a body at ground level over a mouth, and no mouth is
  // reachable from a footprint: the drop zone is `S.cx` +/- 300 at the widest
  // rock the game allows (ROCK_W_MAX / 2 + ROCK_CLEAR), the pit's lip is
  // TO_LEDGE = 636 away and the cut's mouth 1,434 the other way. What is left
  // of the difference is exactly the bug: a body on the yard whose feet are a
  // hair low now ducks.
  if (onYard(w) && duck(w, zone)) {
    w.jigAt = null;                    // it will take its mark where it ends up
    w.y = stand(w);
    return;
  }

  // And the mark it dances around is never under the rock either. It is taken
  // once, out here where the body is standing and therefore already clear; a
  // zone that appears later -- the next rock is announced mid-celebration --
  // can put it back under one, and then it is pushed to the near edge rather
  // than re-taken on the body, so the dance carries on from where it is instead
  // of restarting.
  if (zone && w.jigAt != null && w.jigAt + WORKER > zone.from && w.jigAt < zone.to)
    w.jigAt = w.x + WORKER / 2 < (zone.from + zone.to) / 2 ? zone.from - WORKER - P : zone.to + P;

  jig(w, now, zone, danceEnd(now));
}
