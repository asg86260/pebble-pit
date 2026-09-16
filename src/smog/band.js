import { P, SCRUB_ARM, SCRUB_CHUTE, SCRUB_CLOG, SCRUB_PULL, SMOG_FLOOR, SMOG_TOP, rungValue } from '../config.js';
import { TYPE } from '../jobs.js';
import { speedBoost, strengthBoost } from '../apothecary.js';
import { S, scrub } from '../state.js';
import { colAt, muckCols } from './layer.js';

// Counted here rather than imported from `scrubhouse.js`: that import is a
// ring (the boards read the sky, the scrubbing house is a board) and whichever
// file is reached first comes up with its exports still empty.
const inHouse = w => w.type === TYPE.PURIFY && w.goal === 'in';
const inScrub = () => S.workers.filter(inHouse).length;

// Every mote in the air, climbing or arrived. This is the haze: the actual
// things, not a number. One list, because the climb and the band are two
// things the *same* mote does; `up` says which. Two lists with a handover at
// the top of the climb is one cell blinking out and another blinking in.
export const SKY = [];

// The ones with anything left to step. A settled mote's place is its anchor
// plus this frame's shared numbers (`moteX`), so it comes off this list and
// `place` never touches it again; a lategame sky of six thousand specks steps
// a few dozen. A mote goes back on by `wake`, which captures where it is drawn
// *now* as its new state so nothing jumps.
export const ACTIVE = [];

// The band's bodily creep along the sky, integrated once for the whole of it
// rather than on every mote; a mote remembers the reading it started from
// (`roam0`, `roamOf`).
export let drift = 0;
// Written only here (nothing outside the declaring file may assign a `let`).
// `sky.js` adds this frame's creep and `seedSmog` puts it back to nothing.
export const creep = d => { drift += d; };
export const resetDrift = () => { drift = 0; };

export const climbing = () => { let n = 0; for (const m of SKY) if (m.up) n++; return n; };

// On their way down, as muck. A sky mote becomes one of these when it rains.
export const DROPS = [];

// Specks on their way out: taken by a mouth, and fading where they stood.
// A separate list, not a flag on the mote: `reckon` counts `SKY`, so a fading
// mote left in the sky is pollution that is not there any more, and the board
// lags the truth by the length of the fade. What fades is a copy (position,
// color, weight); the mote itself is gone.
export const GOING = [];

// Nothing on its way into the house has a list of its own: the sky is what goes
// in, dragged there by the draught. See `pull`.

// The sky the haze lives in: a couple of cells under the top of the window,
// down to a little clear air over the ground line. Read off the ground line
// rather than off a depth so the haze reaches the works whatever the window
// is; floored against the top so a window too short to hold both still gives
// the band somewhere to be. Exported because the balloon has to agree with
// the air about where the sky is (`laneY` in balloon.js).
export const bandTop = () => S.camY + SMOG_TOP * P;
export const bandLow = () => Math.max(bandTop() + P * 4, S.groundY - SMOG_FLOOR * P);

export const raining = () => !!S.raining;
// A house with somebody through the door (never the assigned count: nothing
// comes out of the sky until they arrive) and somewhere to put what it takes
// out. It has its own strip like every other station, and it clogs; without
// that it sprays the walk, and every grain past the scatter goes looking for
// a column with room elsewhere.
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
// motes a second off its list (config/rungs.js), the foot being the bare pull.
export const fanPull = (lvl = S.fanLevel || 0) => rungValue('fan', lvl);
// Summed a body at a time rather than `inScrub() * fanPull()`, because the
// apothecary reaches in here: a stew and a strong brew both multiply one
// body's rate. The bodies counted are the ones through the door (`inHouse`).
export const scrubRate = () => (S.scrubOpen
  ? S.workers.reduce((n, w) => n + (inHouse(w) ? fanPull() * speedBoost(w) * strengthBoost(w) : 0), 0)
  : 0);
// Where the thread ends and where the dust comes back out, both places on the
// building and both on the lattice: a caught mote is drawn as a cell, and a
// run of them converging on a half cell is the one off-grid thing in the
// yard. The middle column of an odd front is a whole column; the throat
// closes on to it two courses below the last course of hood.
export const intake = () => ({ x: scrub.x + Math.floor(scrub.w / (P * 2)) * P,
                        y: scrub.y + P * 5 });
// The clear cell under the lip of the chute, not the lip: a grain spawned on
// the lip is born inside solid black and climbs through the arm before it
// falls.
export const outlet = () => ({ x: scrub.x - P, y: scrub.y + scrub.h - P * SCRUB_ARM });
