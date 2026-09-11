import { P } from './yard.js';

export const SCRUB_CHUTE = 5;        // cells the recycler arm reaches out from the wall
export const SCRUB_ARM = 3;          // courses of daylight kept under it: a body is three

// Halved along with SMOG_PER_DUST, and for its sake: the whole air cycle runs at
// half the pace it did, so the house takes half as many specks a second out of a
// sky that is being filled half as fast. What it is worth against the yard is
// untouched, which is the only number here that decides anything.
export let SCRUB_PULL = 29.25;       // motes a second, per body in it -- per mote
// The draught the house makes while it is manned. It is not a hand picking
// specks out of the band any more: the fan pulls on the whole sky, hardest near
// the mouth and fainter the further out you are, so the haze leans towards the
// house from one end of the world to the other, and what streams in comes off
// the part of it that has been dragged nearest.
//
// It bends where a mote is *placed* rather than pushing it about. The fan runs
// for minutes at a time and a force that accumulated would empty the band into
// the wall; a lean is a thing the sky holds while the fan is on and lets go of
// when it stops. Falls off with distance, so a bank twice as far away leans half
// as far.
// Pixels a second, per body inside, that the draught moves a speck -- and it is
// nearly the same wherever the speck is. A pull that fell off with distance left
// the far end of the band creeping a pixel a second while the near end tore in;
// what a fan in a still room actually does is move all the air, and that is what
// the sky should read as: everything sliding one way at once.
//
// It quickens close to the mouth, where the last of a journey is a thing being
// swallowed rather than carried.
// How far the house's throat reaches into the air over it. Nothing is dragged
// any more -- see `eat` in smog.js -- so this is the air the throat is counted
// as being in rather than a distance anything is pulled across.
//
// It replaces SCRUB_DRAG, SCRUB_NEAR and SCRUB_GRIP, which were the speed a
// speck was hauled at, the width of the zone it turned down in, and how close it
// had to get to go in. All three described a draught that moved the sky, and the
// sky is not moved.
// (No reach: a mouth takes its share of the whole sky, not the yard of it over
// its own roof. See `eat` in smog.js for why a reach was the wrong rule.)
// The draught you can see even when there is nothing in the air to be pulled.
//
// A fan with a clean sky over it was a building doing nothing: the suction is
// only visible when there is filth to drag, and a machine you cannot tell is
// running is a machine you stop believing in. So it moves the air as well, and
// the air is drawn -- a few faint specks a second falling in from all round the
// hood, which are not pollution, are worth nothing, and are counted nowhere.
//
// Very faint on purpose. What this says is "this thing is pulling", and it has
// to say it without ever being mistaken for the haze it is pulling.
export const DRAUGHT_PER_S = 18;     // specks a second, per body inside
export const DRAUGHT_FROM = 190;     // how far out they come in from
export const DRAUGHT_PACE = 96;      // and pixels a second they close at
export const DRAUGHT_INK = 0.55;     // against the haze's own weight
export const SCRUB_REACH = 1.1;      // seconds a caught mote takes to come in, over the
                                     // top of the house and down the middle of it
// How far either side of the fan a climbing puff is close enough to be taken.
// Generous, because a plume goes up in a column and the house wants the whole of
// it, not the one mote that happened to line up with the throat.
export const SCRUB_CATCH = 260;
// What the house puts out of the back before the recycler is fitted: the filters
// have to be emptied somewhere, and the crew shovel it like any other mess.
// Halved with the draught above, so a load still comes out of the back at the
// rate it always did: half the specks a second through a filter that fills on
// half as many of them is the same filter, emptied just as often.
export const SCRUB_PER_MUCK = 135;  // motes caught per load out of the back -- per mote
export const SCRUB_MUCK = 1;        // and how much a load is, in cells deep
// The house's own ladder, and the reason it needs one now.
//
// It was built to answer hand labour, which dirties the sky slowly. A machine
// dirties it a great deal harder and never stops for a cigarette -- and there
// are three of them -- so a house that could only ever pull at the rate it was
// built with is a house that stops being an answer the moment the yard is worth
// having one. A bigger fan is what keeps it in the argument.
export const FAN_COST = 90;          // shards for the first rung
export const FAN_RATE = 1.75;        // and how much steeper each one gets
export const RECYCLE_SHARDS = 120;    // and what turns catching into keeping
export const RECYCLE_TONE = 4;      // the shade it comes back around: ordinary dust, give or take one
// And halved for the same reason: the recycler hands back the same dust a second
// it did before the cycle slowed. Slowing the sky is not meant to be a quiet cut
// to a thing you bought.
export const RECYCLE_PER = 42;      // motes caught per grain of dust it gives back -- per mote

export const TO_SCRUB = -2586;       // past the lab, at the quiet end of the walk
// Nineteen cells across and nineteen down, which is the hood and the tower
// together: the tower is the eleven cells the hood has flared down to, and the
// four either side of it at the top are wall with sky behind them. Odd across on
// purpose -- the taper closes to one cell dead on the middle column, and on an
// even front it would close to two beside the middle or one off it, and there
// would be no middle column for the shaft and the door to stand on either.
//
// The twenty down is the front read off in order and nothing else: five courses
// of hood, the course the throat closes in, a solid course under it, eight of
// shaft for the bellows, a solid course under that, and four of foot for the
// door to stand in. Change any of those in render.js and this has to move with
// it -- which is why they are all named there, where the shape is.
//
// It was nineteen while the door was three courses. The door is DOOR_H now like
// every other door, and the extra course had to come from somewhere: taken out of
// the foot, the way in would have opened straight into the floor of the bellows'
// shaft, and a hole opening into a hole is one tall opening rather than a mouth
// over a works. So the building is a course taller instead. It grows upward --
// scrub.y is the ground less the height -- and the chute and the outlet are both
// measured off the foot, so neither of them moves.
export const SCRUB_W = P * 19;
export const SCRUB_H = P * 20;
// The bellows on its front: how many folds it has, and how fast they go. One
// bellows whoever is in there -- it is a machine running or a machine stopped,
// not a tally -- but it beats faster with every body up to four, which is the cap
// the lab's chimney smokes on. Nothing caps this roster the way a bench caps the
// cut, so one fold to a body would read right up to four and lie from five on,
// and the roster written under the building already carries the number.
export const SCRUB_FOLDS = 3;
export const SCRUB_PUMP = 3.2;       // folds a second, at one body in the house

// The scrubbing house wants more elbow room on this side than the standard gap
// gives it. Every building along the walk sits about a hundred and seventy from
// its neighbour, which is right for two plain sheds -- but the hood flares out
// as it goes up, the muck comes out of the back on this side, and the sky bends
// down through exactly this stretch on its way into the mouth. Three things in
// one gap read as the two buildings touching. So this one is doubled, and the
// room is found by widening the world's left end rather than by shuffling
// anything on the other side up against the lab: GROUND_LEFT and everything out
// past the casino move by the same amount, so the far end of the walk keeps the
// margin it had and only this gap changes.

// The dev panel's row for the pull: the house's whole ladder scales off it,
// so it is the one dial that moves the sky bargain (critics 2026-09-10, B2).
export const SCRUB_KNOBS = [
  { key: 'SCRUB_PULL', label: 'house pull', min: 2, max: 60, step: 0.25,
    get: () => SCRUB_PULL, set: v => { SCRUB_PULL = v; } }
];
