// What is true of every body, whatever it does for a living: where its feet go,
// what stops it, and whether it is out in the yard at all. A rule about
// standing is not a rule about mining, so these sit under the jobs.

import { P, WORKER, DUCK_PACE } from '../config.js';
import { S } from '../state.js';
import { feetOn, wayAt, climbTo, inWorking } from '../route.js';
import { doorAt } from '../house.js';
import { frames } from '../clock.js';

// Where a body's feet go: on whatever it is standing on. Footing comes from
// the *way it is on* (the yard's floor, a working's floor, the hill's face),
// never from x alone -- one surface for everybody buries a body crossing the
// hill's footprint, and the hill in the floor turns the crest into a road.
// Which way a body is on is decided when it is sent somewhere (route.js).
export const surfaceUnder = w => feetOn(wayAt(w.x, w.y), w.x);
export const stand = w => climbTo(w, surfaceUnder(w));

// Which side of a coming rock a spot is on: -1 clear to the left, 1 clear to the
// right, 0 under it. A body already ducked out is never 0.
export const sideOf = (zone, x) => x + WORKER <= zone.from ? -1 : x >= zone.to ? 1 : 0;

// Would getting there mean walking under it? Then stand still and let it land,
// rather than set off and be shoved back by the duck every other frame. Only
// while the rock is in the air: the zone stands for the whole beat between
// rocks, and holding everybody for all of it stops the yard dead.
export const across = (zone, x, target) =>
  !!zone && S.rockFall > 0 && sideOf(zone, x) !== sideOf(zone, target);

// Get out from under it, by the nearer side. Returns whether it is still
// moving, so whatever the worker was doing waits until it is clear.
export function duck(w, zone) {
  if (!zone) return false;
  const mid = w.x + WORKER / 2;
  if (w.x + WORKER <= zone.from || w.x >= zone.to) return false;
  // A cell past the edge rather than exactly on it: the zone is a rounded
  // number, and a body walked to the line lands a pixel inside it.
  const out = mid < (zone.from + zone.to) / 2 ? zone.from - WORKER - P : zone.to + P;
  w.x += Math.sign(out - w.x) * Math.min(DUCK_PACE * frames(), Math.abs(out - w.x));
  return true;
}

// Where a body hired into the crew steps into the yard: the shacks' door, an
// address the housing keeps rather than a number copied here.
export const hireSpot = () => doorAt();

// A body that has knocked off and gone in: out of sight, still counted, and
// still on the same job the moment it comes back out.
export const atHome = w => !!w.inside;
export const homeCount = () => S.workers.filter(atHome).length;

// Up in the open rather than down a working, asked of where the body is rather
// than of a flag. The hill counts as the open: a gang on the crest is under
// the sky in the middle of the drop zone. Only a body on a rung or on the
// floor of a hole has something over its head.
export const onYard = w => !inWorking(w);

// Up on the surface, rather than down on the floor of a working.
export const upTop = w => w.y + WORKER <= S.groundY + 1;
