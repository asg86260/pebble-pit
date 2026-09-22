import { P } from './yard.js';

// The shed's walls stand this many cells in from either side of its footprint;
// the eaves reach out over them. The spout is on the near wall and the dial
// hangs off the far one, and the balloons' mast is measured off the dial.
export const FILTER_WALL = 3;
// The spout: a stub out of the near wall this many courses up, two cells
// long, throwing its loads out onto the heap beside the building.
export const FILTER_PORT = 7;
export const FILTER_SPOUT = 2;
// The vent on the cupola, where the air goes in (`intake` in smog/band.js):
// courses down from the top of the footprint.
export const FILTER_VENT = 1;

// Set against SMOG_PER_DUST: the house takes specks out of a sky that is
// filled at the same pace, and what it is worth against the yard is the only
// number here that decides anything.
export let FILTER_PULL = 29.25;       // motes a second, per body in it -- per mote
// The draught you can see even when there is nothing in the air to be pulled:
// a few faint specks a second falling in to the cupola's vent, which are
// not pollution, are worth nothing, and are counted nowhere. A machine you
// cannot tell is running is a machine you stop believing in. Very faint on
// purpose, so it is never mistaken for the haze it is pulling. No reach: a
// mouth takes its share of the whole sky, not the yard of it over its own
// roof (`eat` in smog.js).
export const DRAUGHT_PER_S = 18;     // specks a second, per body inside
export const DRAUGHT_FROM = 190;     // how far out they come in from
export const DRAUGHT_PACE = 96;      // and pixels a second they close at
export const DRAUGHT_INK = 0.55;     // against the haze's own weight
// How far either side of the fan a climbing puff is close enough to be taken.
// Generous, because a plume goes up in a column and the house wants the whole
// of it, not the one mote that happened to line up with the vent.
export const FILTER_CATCH = 260;
// What the house puts out of the back before the recycler is fitted: the
// filters have to be emptied somewhere, and the crew shovel it like any other
// mess.
export const FILTER_PER_MUCK = 135;  // motes caught per load out of the back -- per mote
export const FILTER_MUCK = 1;        // and how much a load is, in cells deep
// The house's own ladder: a machine dirties the sky far harder than hands and
// never stops for a cigarette, so a house that could only pull at the rate it
// was built with stops being an answer the moment the yard is worth having
// one. What a fan pulls at each rung, and what each rung costs, is a list in
// config/rungs.js: if the sky comes under control too early on a real yard,
// that is the dial.
export const RECYCLE_SHARDS = 120;    // and what turns catching into keeping
export const RECYCLE_TONE = 4;      // the shade it comes back around: ordinary dust, give or take one
export const RECYCLE_PER = 42;      // motes caught per grain of dust it gives back -- per mote

export const TO_FILTER = -2586;       // past the lab, at the quiet end of the walk
// Nineteen cells across and twenty down: the shed and its eaves, and the
// cupola on its ridge. Odd across, so the ridge, the cupola and the door have
// a middle column to stand on. It grows upward (filter.y is the ground less
// the height), and the spout is measured off the foot.
export const FILTER_W = P * 19;
export const FILTER_H = P * 20;
// The slats across its front: three, open while somebody is inside, one of
// them swinging shut in turn and going round faster with every body up to
// four; nothing caps this roster the way a bench caps the cut, so a slat to a
// body would lie from four on, and the roster under the building already
// carries the number. All shut is rest only.
export const FILTER_SLATS = 3;
// The dial on the far wall, reading the sky from clean to brim. A needle two
// cells long can point sixteen ways; three quarters of a turn of those is
// twelve, and the needle lands on one of them.
export const DIAL_STEPS = 12;
// Its size. Here rather than in the drawing because the balloons' mast is
// stood clear of the dial, and the two have to agree on where the dial ends.
export const DIAL_CELLS = 7;          // across the gauge's face and ring
// The ring in three bands along its sweep, clean to brim: how bad the air is,
// read at a glance before the needle is.
export const DIAL_ZONES = ['#3aa655', '#e2c12b', '#d23b2e'];
export const DIAL_ZONE_NAMES = ['clean', 'dirty', 'filthy'];   // what its hover calls each band
export const DIAL_STUB = 1;           // and the stub it hangs on, out of the wall
export const DIAL_EASE = 1.5;         // share of the way to the reading it closes a second
export const DIAL_GIVE = 0.6;         // steps past its own the reading must be before it moves
export const FILTER_PUMP = 3.2;       // slats a second, at one body in the house

// The dev panel's row for the pull: the house's whole ladder scales off it,
// so it is the one dial that moves the sky bargain.
export const FILTER_KNOBS = [
  { key: 'FILTER_PULL', label: 'house pull', min: 2, max: 60, step: 0.25,
    get: () => FILTER_PULL, set: v => { FILTER_PULL = v; } }
];
