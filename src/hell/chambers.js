// The run of chambers, the road down and the heat (DESIGN.md, "Acts 3 and 4",
// act 4, "The place: a run of chambers down to the cage room", "The pressure:
// the heat" and "The crew: the muster"). A stub of the scaffold: nothing here
// runs yet.
//
// What it will own: the chambers laid out inside hell's extent (hell/place.js),
// each lower, further right and hotter than the last, one a row of
// HELL_TIERS; the camera moving on into a new chamber as a glide when its
// barrier falls, the chambers behind still running; the stair between them,
// cut a flight a trip by builders; the road's foot, where the union's members
// come down a line at a time on the muster's card (who can do what on the
// surface is call 5, open); and the flare, a vent breaking out on its clock,
// warned, crusting faces and putting furnaces out -- a setback that costs
// time, never ore, bars or tools (call 4 open: whether the flares are Satan's).
// The chamber reached is `S.hell.chamber`, the stair's flights
// `S.hell.flights`, the muster's members `S.hell.muster`.

import { S } from '../state.js';
import { HELL_TIERS } from '../config.js';

// One frame of the run: the road, the muster, the stair and the flares.
export function stepChambers(c) {}

// How many chambers the run has: the table's length, so call 4's choice of
// four or five is one row of config.
export const chamberCount = () => HELL_TIERS.length;
// The deepest chamber open, 0 the landing.
export const chamberReached = () => (S.hell ? S.hell.chamber : 0);
