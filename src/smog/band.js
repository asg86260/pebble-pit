import { P, SCRUB_ARM, SCRUB_CHUTE, SCRUB_CLOG, SCRUB_PULL, SMOG_FLOOR, SMOG_TOP, FAN_TOP, LADDER } from '../config.js';
import { TYPE } from '../jobs.js';
import { S, scrub } from '../state.js';
import { colAt, muckCols } from './layer.js';

// Counted here rather than imported from `scrubhouse.js`, which is the same sum
// that file exports for everybody else. It is one line, and importing it made a
// ring -- the boards read the sky, the scrubbing house is a board, and the sky
// asked the scrubbing house how many were in it -- so whichever file in the ring
// happened to be reached first came up with its exports still empty.
const inScrub = () => S.workers.filter(w => w.type === TYPE.PURIFY && w.goal === 'in').length;

// Every mote in the air, climbing or arrived. This is the haze -- not a number
// with a picture of a cloud beside it, the actual things.
//
// One list, because there is one substance. A speck off a swing and a speck in
// the band used to be two kinds of thing in two arrays, with the first deleted
// and the second created at the top of the climb -- and however carefully that
// handover was written, it was a handover: the puff went out and the mote came
// up over the best part of a second, so what you actually watched was one cell
// blinking out and another blinking in beside it. The climb and the band are two
// things the *same* mote does, so it is one object from the swing to the rain,
// and `up` says which of them it is doing.
export const SKY = [];

// The ones with anything left to step.
//
// A settled mote's place is its anchor plus this frame's shared numbers -- see
// `moteX` -- so once it has finished arriving there is nothing in it to
// integrate and nothing to write. It comes off this list and `place` never
// touches it again. What is left on the list is what is genuinely moving: the
// plumes on their way up, the motes still easing into the band, and whatever a
// hand through the smoke has bent out of place. A lategame sky of six thousand
// specks steps a few dozen of them.
//
// A mote goes back on it by `wake`, which captures where it is being drawn
// *now* as its new state, so nothing jumps at the moment it starts moving again.
export const ACTIVE = [];

// The band's bodily creep along the sky, integrated once for the whole of it.
//
// It used to be a number on every mote, added to every frame: the same
// multiplication five thousand times over for a quantity that differs between
// motes only by a fixed share of the wind. So it is kept once here, and a mote
// remembers the reading it started from -- see `roam0` and `roamOf`.
export let drift = 0;
// Read anywhere -- an imported binding is live -- but written only here, because
// nothing outside the file that declares a `let` may assign to it. `sky.js` adds
// this frame's creep and `seedSmog` puts it back to nothing.
export const creep = d => { drift += d; };
export const resetDrift = () => { drift = 0; };

// The ones still on their way up, for anything that wants to ask.
export const climbing = () => { let n = 0; for (const m of SKY) if (m.up) n++; return n; };

// On their way down, as muck. A sky mote becomes one of these when it rains.
export const DROPS = [];

// Specks on their way out: taken by a mouth, and fading where they stood.
//
// A mote used to be spliced out of the sky on the frame it was swallowed, which
// is a cell blinking off. At one mouth that is a speck a frame popping somewhere
// in the window; at four it is a sky that crackles. Nothing else in this game
// disappears -- muck is carried, dust is banked, a rock is broken up -- and the
// haze should not either.
//
// **A separate list, and not a flag on the mote.** The haze *is* the specks --
// `reckon` is one line and it counts `SKY` -- so a fading mote left in the sky
// would still be counted as pollution that is not there any more, and the board
// would lag the truth by the length of the fade. It leaves the sky at once and
// what fades is a picture of it: position, colour and weight copied off the mote
// as it goes, because the mote itself is gone.
export const GOING = [];

// Nothing on its way into the house has a list of its own: the sky is what goes
// in, dragged there by the draught. See `pull`.

// where the motes settle out: a band across the top of the window
// The sky the haze lives in: a couple of cells under the top of the window, down
// to a little clear air over the ground line.
//
// It was a thirteen-cell strip along the top with clean air beneath it, and that
// strip is the whole of what has changed here. Everything that made the band
// work -- the slots, the spread that opens with age, the sway, the creep, the
// settling, the plume that climbs into it -- is untouched and applies to the
// whole sky now, which is exactly what it was always doing, only over four times
// as much of it.
//
// Read off the ground line rather than off a depth, so the haze reaches the
// works whatever the window is: a fixed depth would leave a tall window with a
// clean gap under the sky and a short one with the haze in the dirt. Floored
// against the top, so a window too short to hold both still gives the band
// somewhere to be.
// Exported, because the balloon has to agree with the air about where the sky
// is: a craft with a cruising height of its own would ride above the haze on a
// tall window and in the dirt on a short one. See `laneY` in balloon.js.
export const bandTop = () => S.camY + SMOG_TOP * P;
export const bandLow = () => Math.max(bandTop() + P * 4, S.groundY - SMOG_FLOOR * P);

export const raining = () => !!S.raining;
// Bodies actually through the door, not bodies assigned to it. Somebody put on
// the house is somebody who has to walk the length of the yard to get there, and
// nothing comes out of the sky until they arrive -- the same rule the lab runs
// on. A station that started working the moment you clicked the button would be
// a station whose walk was decoration.
// A house with somebody in it, and somewhere to put what it takes out.
//
// It used to run whatever was lying about it, which is the one station in the
// yard with no such rule: the rock stops when its spoil is up to the limit, the
// cut stops, the plots stop, and this poured -- dust out of the spout with the
// recycler on, muck out of the back without it -- for as long as there was a
// body inside. What that looks like is a machine with no cost, and what it
// actually did was spray the walk: bare ground takes a scatter and no more, so
// every grain past the scatter went looking for a column with room somewhere
// else in the yard.
//
// Now it has its own strip, like every other station, and it clogs.
export const clogged = () => !!S.pileFull.scrub || outletMuck() >= SCRUB_CLOG;
export const scrubbing = () => S.scrubOpen && inScrub() > 0 && !clogged();

// Muck lying on the ground the spout reaches, which is what the back of the
// house leaves when there is no recycler on it.
export function outletMuck() {
  if (!S.scrubOpen) return 0;
  const m = muckCols();
  const from = colAt(scrub.x - P * (SCRUB_CHUTE + 2)), to = colAt(scrub.x + scrub.w);
  let n = 0;
  for (let c = from; c <= to; c++) n += m[c] || 0;
  return n;
}
// What one body in the house is worth, with whatever fan has been fitted:
// eased across the ladder to `FAN_TOP` of the bare pull.
export const fanPull = (lvl = S.fanLevel || 0) =>
  SCRUB_PULL * Math.pow(FAN_TOP, Math.max(0, Math.min(LADDER, lvl)) / LADDER);
export const scrubRate = () => (S.scrubOpen ? inScrub() * fanPull() : 0);
// Where the thread ends, and where the dust comes back out. Both are places on
// the building rather than numbers near it: the head of the throat, which is the
// cell the hood's taper closes to and the last of it you can see, and the lip of
// the recycler's chute at the foot. A thread that stopped a course above the
// mouth ended in mid-air, and a grain that came back out of the roof was the
// house giving to the sky the one thing it is there to take out of it.
// Both on the lattice, because a caught mote is drawn as a cell like everything
// else and a run of them converging on a half cell is the one off-grid thing in
// the yard. The middle column of an odd front is a whole column; the throat
// closes on to it two courses below the last course of hood.
export const intake = () => ({ x: scrub.x + Math.floor(scrub.w / (P * 2)) * P,
                        y: scrub.y + P * 5 });
// The clear cell under the lip of the chute, not the lip itself. It used to be
// the lip, and the grain was spawned there going *up* -- so a recycled grain was
// born inside solid black, climbed through the two courses of the arm painting
// itself across them on the way, and only then fell. A spout that turns down at
// its end and then delivers upward through its own elbow is a building doing the
// opposite of what its shape says.
export const outlet = () => ({ x: scrub.x - P, y: scrub.y + scrub.h - P * SCRUB_ARM });
