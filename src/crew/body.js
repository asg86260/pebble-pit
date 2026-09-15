// What is true of every body, whatever it does for a living: where its feet go,
// what stops it, and whether it is out in the yard at all.
//
// These are the answers the stages, the jobs and the dance all want, and they
// belong under all of them: a rule about standing is not a rule about mining.

import { P, WORKER, DUCK_PACE } from '../config.js';
import { S } from '../state.js';
import { feetOn, wayAt, climbTo, inWorking } from '../route.js';
import { doorAt } from '../house.js';
import { frames } from '../clock.js';

// Where a body's feet go when it is standing still or walking: on whatever it is
// standing on.
//
// This used to be `walkY` everywhere -- the ground line and the bridge, which do
// not know the rock is there. So anybody crossing the hill's footprint walked
// *through* the hill: measured, a hundred and twenty pixels inside it, buried to
// well over its own height, and it surfaced only on arriving at the far side or
// at work. What that looks like is a body running to the middle of the rock and
// then rising out of it, which is exactly what it was doing.
//
// Then it was one surface for everybody, the hill included, and that fixed the
// burying and broke the yard the other way about: with the hill in the floor,
// the shortest path from one side of the yard to the other goes over the crest,
// so every hauler and every janitor ramped up and over the summit on every
// errand. A hill that everybody walks over is a road.
//
// Both of those are the same mistake -- deciding a body's footing from its x
// alone -- and the answer is not to go back to asking its job. A body's footing
// comes from the *way it is on*: the floor of the yard, the floor of a working,
// or the face of the hill, and `wayAt` says which from where the body actually
// is. Two bodies at the same x, one at ground level and one up on the crest,
// are in two different places and get two different answers, and neither of
// them was asked what it does for a living.
//
// Which way a body ends up on is decided when it is sent somewhere: a route on
// to the hill puts it on the hill, and it stays there until it walks off the
// end or climbs down a flank. See route.js.
export const surfaceUnder = w => feetOn(wayAt(w.x, w.y), w.x);
export const stand = w => climbTo(w, surfaceUnder(w));

// Get out from under it. A body is in the way while any part of its square is
// over the ground the next rock is coming down on, and it leaves by whichever
// side it is nearer -- crossing under a falling rock to reach the far side is
// not getting out of the way. Returns whether it is still moving, so whatever
// the worker was doing waits until it is clear.
// Which side of a coming rock a spot is on: -1 clear to the left, 1 clear to the
// right, 0 under it. A body already ducked out is never 0.
export const sideOf = (zone, x) => x + WORKER <= zone.from ? -1 : x >= zone.to ? 1 : 0;

// Would getting there mean walking under it? A rock is coming down between here
// and where this body wants to be, so the answer is to stand still and let it
// land -- not to set off and be shoved back by the duck every other frame, which
// is what used to happen: out, in, out, in, all the way down, and a body still
// half in the footprint when the rock arrived.
// And only while there is something overhead. The zone stands for the whole
// beat between rocks -- the crew's five seconds on the bare ground as well as
// the fall -- because a body has to be *out* of the footprint before the rock
// starts coming down. But standing still for all of it stopped the whole yard
// dead every time a rock finished: the dance is the rock hands' business, and a
// hauler halfway to the lip has no reason to wait on it. Nobody may cross while
// the rock is in the air; before that the ground is bare and they carry on.
export const across = (zone, x, target) =>
  !!zone && S.rockFall > 0 && sideOf(zone, x) !== sideOf(zone, target);

export function duck(w, zone) {
  if (!zone) return false;
  const mid = w.x + WORKER / 2;
  if (w.x + WORKER <= zone.from || w.x >= zone.to) return false;
  // A cell past the edge rather than exactly on it. The zone is worked out from
  // the size the coming rock *will* be, and that is a rounded number: a body
  // walked to the line lands a pixel inside it as often as not, and a body
  // stood with its shoulder against the rock does not read as out of the way.
  const out = mid < (zone.from + zone.to) / 2 ? zone.from - WORKER - P : zone.to + P;
  w.x += Math.sign(out - w.x) * Math.min(DUCK_PACE * frames(), Math.abs(out - w.x));
  return true;
}

// Where a body hired into the crew steps into the yard: the door of the shacks
// the crew live in. Somebody taken on now comes out of the place the crew come
// from and walks to the work, rather than appearing at it -- which is the whole
// of why the housing is there, and why the door is an address the housing keeps
// rather than a number this file holds a copy of.
export const hireSpot = () => doorAt();

// A body that has knocked off and gone in. It is the same idea as a scholar
// through the door or a quarrier down the quarry: out of sight, still counted, and
// still on the same job the moment it comes back out.
export const atHome = w => !!w.inside;
export const homeCount = () => S.workers.filter(atHome).length;

// Up in the open rather than down a working: the one question the dodge, the
// dance and the idle all want, and it is asked of where the body is rather than
// of a flag anybody has to remember to set.
//
// The hill counts as the open, because it is: a gang standing on the crest is
// standing under the sky in the middle of the drop zone, and they are the ones
// with the most reason to get out from under a rock coming down. Only a body on
// a rung or on the floor of a hole has something over its head.
export const onYard = w => !inWorking(w);

// Up on the surface, rather than down on the floor of a working. A quarrier at
// the bottom of the cut walks to the ladder and climbs it first -- see
// `stepQuarrier` -- and arrives up here on the ground like anybody else.
export const upTop = w => w.y + WORKER <= S.groundY + 1;
