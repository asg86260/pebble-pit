// The barriers (DESIGN.md, "Acts 3 and 4", act 4, "The barriers: an attempt
// is work, not a fight"). A stub of the scaffold: nothing here runs yet.
//
// What it will own: a barrier across each chamber's far side, one a row of
// HELL_TIERS -- rubble, the bone wall, the lava gate, the anchor chains and,
// last, the cage (cage.js) -- each a body of cells that comes down a piece at
// a time over BARRIER_BLOWS blows, every piece landing and carried aside as
// spoil; worked only with the tool it yields to (a lesser tool rings off and
// nothing comes loose); the wall gang, miners taken off their faces, the act's
// one standing decision; and owing each fall's beat (`wall-<n>`, story.js),
// which moves the camera on and rings the tool off the next barrier. A
// barrier has no bill and no health bar. Each barrier's blows taken are
// `S.hell.blows`, so a reload draws the same hole; the gang's size
// `S.hell.gang`.

import { S } from '../state.js';
import { BARRIER_BLOWS } from '../config.js';

// One frame of the barriers and the wall gang.
export function stepBarriers(c) {}

// How far barrier `i` has come down, 0..1, off its blows taken.
export const barrierDown = i => (S.hell ? Math.min(1, (S.hell.blows[i] || 0) / BARRIER_BLOWS[i]) : 0);
