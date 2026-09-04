import { now } from '../clock.js';
import { DRAUGHT_FROM, DRAUGHT_PACE, DRAUGHT_PER_S, GOING_CAP, P, SCRUB_PULL, SMOG_GO_LEAN } from '../config.js';
import { rand } from '../rng.js';
import { S } from '../state.js';
import { windAt } from '../wind.js';
import { GOING, SKY, intake, scrubRate } from './band.js';
import { swallow } from './craft.js';
import { dropped, moteX, moteY } from './sky.js';
import { look } from './vents.js';

// --- the house --------------------------------------------------------------------
// The house does not pick specks out of the sky. It makes a draught.
//
// It used to reach out and take the nearest settled mote, whole, and put it on a
// curve to the mouth -- a hand plucking, one a frame, from a band that otherwise
// took no notice of the building at all. What a fan does is pull on everything
// in front of it, hardest close up and less the further out you are, so that is
// what this is: every mote in the world leans towards the mouth while there is
// somebody inside, from the plume climbing past the door to the far end of the
// band over the pit. You can see the whole sky sag towards the house.
//
// The lean and the swallowing are two things. Leaning is a bend in where the
// band puts a mote, so a bank drifts over the house rather than a speck being
// yanked out of it; swallowing is the house taking motes at the pace it is
// rated for, off the part of the sky the lean has brought nearest, and those
// are the ones you watch stream down the throat.
//
// The climbing ones are pulled by exactly the same field. They are the same
// objects now -- see SKY -- so a plume rising past the house bends into it
// without a word of code about plumes.
// The air itself, drawn in. Nothing in this list is worth anything or counted
// anywhere -- it is the one thing in this game that is a picture of something
// rather than the thing itself, and it earns that by being the only way a fan
// over a clean sky can say it is running.
export const DRAUGHT = [];

export function breathe(secs) {
  breatheAt(intake(), scrubRate() / SCRUB_PULL, secs, DRAUGHT_FROM);
}

// A few cells drawn in to a mouth, and nothing more than that.
//
// **This is the whole of what a working mouth looks like now.** The sky itself is
// not touched -- see `eat` -- so what says a house or a craft is doing anything
// is this: a handful of specks converging on it and gone at the lip. Metered by
// the real rate, so an unstaffed mouth makes none, a clogged one makes none, and
// a fifth-rung fan visibly pulls harder. It cannot say anything untrue about how
// hard the thing is working, which is the same bargain the machines' stack puffs
// make.
//
// Shared by the house and the craft: a mouth is a mouth, and the only things
// that differ are where it is and how far out its specks come from.
export function breatheAt(to, power, secs, from) {
  if (power <= 0) return;
  let n = DRAUGHT_PER_S * power * secs;
  while (n > 0) {
    if (n < 1 && rand() > n) break;
    n -= 1;
    // in from anywhere round the mouth, though mostly from above it: what a fan
    // facing the sky pulls on is the sky
    const a = -Math.PI / 2 + (rand() - 0.5) * Math.PI * 1.4;
    const d = from * (0.5 + rand() * 0.5);
    DRAUGHT.push({ x: to.x + Math.cos(a) * d, y: to.y + Math.sin(a) * d, t: 0,
                   tx: to.x, ty: to.y, from });
  }
  for (let i = DRAUGHT.length - 1; i >= 0; i--) {
    const k = DRAUGHT[i];
    const dx = k.tx - k.x, dy = k.ty - k.y;
    const d = Math.hypot(dx, dy) || 1;
    // it gathers pace as it goes, the way the haze does, and is gone at the mouth
    const step = DRAUGHT_PACE * secs * (1 + (1 - Math.min(1, d / k.from)));
    if (d < P * 2) { DRAUGHT.splice(i, 1); continue; }
    k.x += (dx / d) * step;
    k.y += (dy / d) * step;
    k.t = 1 - d / k.from;
  }
  if (DRAUGHT.length) S.dirty = true;
}

// Whether anything up there is carrying a draught offset at all.
//


// What the throat has not swallowed yet, in whole motes. The house's rate is a
// rate, and a rate below one a frame cannot be spent a frame at a time without
// being rounded away to nothing, so what is left over is carried.
export let gullet = 0;
// Emptied from `seedSmog`, through a door, for the same reason as everything
// else it puts back: only this file may assign to it.
export const resetGullet = () => { gullet = 0; };

// Where the walk starts, kept between frames. The sky is tens of thousands of
// specks and a mouth wants half of one a frame, so the list is walked from
// wherever it got to last time rather than from the top: starting at nought
// every frame would take the same few hundred specks over and over and leave the
// far end of the sky untouched for ever.
let sweep = 0;

// The house takes the sky in, and **it does not drag it about to do so.**
//
// This used to pull: every speck within `SCRUB_NEAR` of the throat was moved,
// every frame, sideways along the sky and then down the last of it -- a whole
// quarter of the band leaning towards one building. It was a fair picture of a
// fan and it was far too much to look at, because what moved was not the dozen
// specks actually being eaten but every speck in reach of the thing eating them.
//
// So nothing in the sky is moved at all. The house takes the specks it is rated
// to take, from the air around it, and they are gone -- and what you *see* is
// `breathe`: a few cells drawn in over the hood, metered by the same rate, which
// is a picture of a draught rather than the whole sky being bent into one.
//
// It is still local. A mouth eats the air it is in, so the sky thins where the
// works is cleaning it and fills back in as the band drifts and spreads -- which
// is the honest reading, and it is honest precisely because the specks *are* the
// sky. Nothing here pretends.
export function pull(secs) {
  gullet = Math.min(gullet + scrubRate() * secs, scrubRate());
  eat(() => gullet, n => { gullet = n; }, null);
}

// One mouth, taking what it is owed out of the sky.
//
// **From anywhere, and that is the point.** A mouth used to be given a reach and
// took only what was inside it, which is a fair picture of a fan and a bad rule:
// what a mouth can take then depends on how much sky happens to be floating near
// it, so the same house cleared its rating on one yard and a fortieth of it on
// another. The board quotes a rate. A rate that the shape of the sky can quietly
// veto is a number that lies.
//
// So the sky is one sky and a mouth takes its share of it, wherever those specks
// are. That is also the thing itself: a scrubbing house cleans *the air*, slowly
// and evenly, rather than the particular yard of it over its own roof -- the
// haze is a level, and what a mouth does is bring the level down. The specks it
// takes are picked off a rolling sweep, so it is the whole sky that thins rather
// than one part of it wearing out.
//
// `owe`/`pay` rather than a number in and out, so the caller keeps its own
// gullet: a house and three balloons each have their own, and one of them going
// hungry must not spend another's.
export function eat(owe, pay, craft) {
  if (owe() < 1 || !SKY.length) return;
  let left = owe();
  // Bounded, so a mouth cannot walk the whole sky in a frame looking for one
  // speck. With tens of thousands of them and four mouths that walk *is* the
  // frame -- and it buys nothing, because every speck it steps over is a speck
  // it could have taken.
  const look = Math.min(SKY.length, 400);
  for (let n = 0; n < look && left >= 1; n++) {
    sweep = SKY.length ? (sweep + 1) % SKY.length : 0;
    const m = SKY[sweep];
    // Nothing is taken on the way up. A mouth that reached into the plumes would
    // be catching smoke a foot off the swing that made it, and the sky over the
    // yard is what it is for.
    if (!m || m.up) continue;
    left -= 1;
    // Out of the sky now -- the level is the count, so it drops on this frame --
    // and a picture of it left behind to fade. See `GOING`.
    if (GOING.length < GOING_CAP) {
      // and it goes on drifting on the wind while it thins, because that is what
      // it was doing a moment ago and nothing up here stops.
      GOING.push({ x: moteX(m), y: moteY(m), kind: m.kind,
                   tone: m.tone, ink: m.ink, t: 1,
                   vx: windAt(now()) * SMOG_GO_LEAN * m.give, vy: 0 });
    }
    dropped(m);
    SKY.splice(sweep, 1);
    if (sweep >= SKY.length) sweep = 0;
    swallow(craft);
  }
  pay(left);
}
