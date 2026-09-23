import { CLOUD_MURK_POW, P, SMOG_CAP, SMOG_FLOOR, SMOG_TOP, rungValue } from '../config.js';
import { S } from '../state.js';

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
// And out of a balloon, as muck: a load let fall from under its basket, on
// its way to wherever it lands (`stepClods`).
export const CLODS = [];

// Specks on their way out: taken by a mouth, and fading where they stood.
// A separate list, not a flag on the mote: `reckon` counts `SKY`, so a fading
// mote left in the sky is pollution that is not there any more, and the board
// lags the truth by the length of the fade. What fades is a copy (position,
// color, weight); the mote itself is gone.
export const GOING = [];

// The smoke off a working stack: decoration, not haze -- a puff is thrown
// on a beat, rises, and fades, and is never counted (`puffStack` in vents.js).
export const STACK = [];

// Nothing on its way into the house has a list of its own: the sky is what goes
// in, dragged there by the draught. See `pull`.

// The sky the haze lives in: a couple of cells under the top of the window,
// down to a little clear air over the ground line. Read off the ground line
// rather than off a depth so the haze reaches the works whatever the window
// is; floored against the top so a window too short to hold both still gives
// the band somewhere to be.
export const bandTop = () => S.camY + SMOG_TOP * P;
export const bandLow = () => Math.max(bandTop() + P * 4, S.groundY - SMOG_FLOOR * P);

export const raining = () => !!S.raining;
// How dirty the whole sky is, nought to one: the one number the clouds are the
// readout of (DESIGN.md, "The sky is the clouds"), and the air filter's dial
// too. Not a mote's place -- the murk is the sky's total, and every cloud
// takes it together.
export const murk = () => Math.pow(Math.min(1, S.haze / SMOG_CAP), CLOUD_MURK_POW);
// What one balloon pulls at the power it has been bought: motes a second off
// its list (config/rungs.js), the foot being the bare pull.
export const balloonPull = (lvl = S.powerLevel || 0) => rungValue('power', lvl);
