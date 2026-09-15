// --- effects: the black hole, a crit landing, and the dance -------------------
// Three things that are looked at rather than read: what the rift pulls and
// how it is drawn, what a crit throws up when it lands, and how a body
// celebrates a finished rock. All found on the dev panel or off a shot, so the
// rows at the bottom are part of the feature.

import { P } from './yard.js';
// The dance's own two rules -- the base beat and the pace that reads as a fault
// -- which the jump's tempo below is worked out from rather than set beside.
import { DANCE_BEAT, DANCE_BUZZ } from './rocks.js';

// --- the rift inhales ---------------------------------------------------------
// The rift takes the whole pile on the frame a grain lands; there is no rate
// and no ladder. The one number is a **ceiling on a frame**, not a balance
// figure: a hundred thousand grains dropped in one act are taken over a
// handful of frames rather than a million cells walked inside one. Anything
// the yard can earn is orders under it, which is what makes "nothing settles
// on the pit floor" true rather than nearly true.
export let RIFT_INHALE_MAX = 3000;   // grains it may take in one frame
// How many of them are drawn on their way in. The tearing's own figure is
// `RIFT_GULP_SHOW`; this is the same idea at the rate an ordinary frame arrives.
export const RIFT_INHALE_SHOW = 600;

// --- and what it looks like ---------------------------------------------------
// There is no darker black than the disc, so the way to deepen it is to take
// everything else away from around it: two cells of bare paper, then a
// thinning stipple, so the eye reads a well rather than a sticker.
export const RIFT_HALO = 2;          // cells of paper cleared round the rim

// The rim creeps in and out by a cell or so on a slow drift: the one motion
// the disc itself is allowed, because it is the disc saying it is a rip rather
// than a hole somebody cut.
export const RIFT_WAVER = 0.11;      // share of the radius the ripple is deep

// The ripple, as modes: [lobes round the rim, ms for one lap, share of the
// depth]. Lobes must be two or more: one lobe does not bend a circle, it
// *moves* it, and the rim stays exactly as round as it started. The counts are
// coprime and the lap times divide into one another nowhere, so the sum never
// returns to an outline it has already had; a negative lap runs the other way,
// so the modes cross instead of traveling as one wave. The shares add to one,
// so RIFT_WAVER stays the whole depth however many modes there are.
export const RIFT_RIM_MODES = [
  [2, -7300, 0.34],
  [3,  4900, 0.38],
  [5, -3100, 0.28],
];

// The sky seen through the tear is crowded outward toward the rim and thinned
// out of the middle, the way a lens piles an image up round its own edge.
// BELOW one pushes the field out to the rim; at one it is a flat window; above
// one it drags everything into the middle and the hole has a clot in it.
export const RIFT_BEND = 0.55;

// Each star's own slow fade, on its own phase, so the sky behind the tear is
// alive without anything traveling across it.
export const RIFT_TWINKLE_MS = 2800;

// --- the light bending --------------------------------------------------------
// The yard behind the hole, sampled and put back magnified in a few thin rings
// just outside the rim (`drawBend` in render/cores.js). Four rings is a budget,
// not a taste: each is a clipped blit at about 0.7 ms apiece on the heaviest
// part of the game, and the stepping between four still reads as a smear
// rather than as bands.
export const RIFT_BEND_RINGS = 4;    // rings the warp is stepped through
export const RIFT_BEND_R = 2.1;      // how far out it reaches, in disc radii
export const RIFT_BEND_AMT = 0.7;    // and how hard it magnifies at the rim

// The light piled up at the very edge. On the boundary, never across the
// middle: everything tried across the middle read as a face.
export const RIFT_RING_W = 2;        // screen px of it
export const RIFT_RING_INK = 0.75;
// --- what is on the other side ------------------------------------------------
// What the hole shows is somewhere else: a sky of stars, layered, each layer
// keeping less pace with the yard than the one in front of it.
//
// **The parallax is the whole idea.** Depth cannot be drawn on a flat black
// circle (every attempt read as a face) but it can be *shown* by having the
// far thing move less than the near one. The stars answer the camera rather
// than the clock: stand still and they stand still.
export const RIFT_DEEP_LAYERS = 3;    // skies behind the tear
export const RIFT_DEEP_NEAR = 0.55;   // how much of the yard's pace the nearest keeps
export const RIFT_DEEP_FAR = 0.12;    // ...and the furthest
export const RIFT_DEEP_SPACING = 21;  // world px between stars in the nearest sky

// A few motes of the wizards' own purple drawn in toward the rim and gone at
// it. A handful on purpose: what it has to say is "this is pulling", and a
// crowd says "this is busy". Inward, never out: a ring going out of a hole is
// a hole broadcasting, and this one takes.
export const RIFT_PULL_MOTES = 6;     // in the air at once
export const RIFT_PULL_MS = 3400;     // how long one takes to come in
export const RIFT_PULL_FROM = 2.4;    // where it starts, in disc radii
export const RIFT_PULL_INK = 0.9;     // and the strongest it is drawn

// Nothing else about the disc moves. The hole is a place, not a creature: what
// moves is the dust going into it. See `drawRift` in render/cores.js.

// The smear on a grain that is actually going in: a few cells of tail pointing
// back the way it came, so the stream reads as being pulled rather than as
// beads on a wire. Only near the disc, where it is being dragged hardest.
export const RIFT_TAIL = 3;          // cells of tail behind a grain
export const RIFT_TAIL_R = 2.2;      // and how near the disc, in radii, it grows one

// --- a crit landing -----------------------------------------------------------
// The crit's fountain of spoil (`critToss`) is real dust and banks like any
// other; the blow itself is a shockwave and a scatter of motes, neither of
// which is counted. One grain is one dust, so anything decorative must be
// plainly not a grain: an outline ring, and specks that never land.
// Everything scales with the crit's multiplier, which is the size of the thing
// that happened.
export const CRIT_RING_MS = 260;     // how long the ring takes to run out
export const CRIT_RING_R = P * 1.6;  // how far it reaches, per point of multiplier
export const CRIT_RING_WIDE = P;     // and how thick the ring is drawn
export const CRIT_MOTES = 3;         // specks thrown, per point of multiplier
export const CRIT_MOTE_LIFE = 0.35;  // seconds one lasts
export const CRIT_MOTE_SPEED = P * 0.6;  // world pixels a frame it leaves at
export const CRIT_MOTE_DRAG = 0.78;  // and how quickly it gives that up

// --- the dance ----------------------------------------------------------------
// A celebration is jumping up and down: one move, one dial, one height.
//
// **The tempo is derived, not chosen.** `DANCE_BUZZ` is the pace at which a
// bouncing body stops reading as pleased and starts reading as faulty. A body
// crosses its own height at `DANCE_BEAT` times the move's multiple times the
// tempo it rolled for itself, so what is set is how much of that ceiling the
// QUICKEST body may use, and the multiple is worked back out of it. A hand-set
// multiple goes silently wrong the moment somebody widens the tempo spread or
// nudges DANCE_BEAT.
//
// Every body rolls its own tempo so no two are ever quite together (`beatMs`
// in dance.js, the only reader). The roll's ends are here because the bound
// above is worked out from the top of it; apart, they could drift.
export const DANCE_TEMPO_LO = 0.85;  // the slowest tempo a body rolls for itself
export const DANCE_TEMPO_HI = 1.15;  // and the quickest
// A ninth of the ceiling is left over the fastest body: a crossing rate can
// only be measured as sixty over some whole number of frames, so a true 2.375
// reads as 2.40 and a bound with no room in it fails on the rounding.
export let DANCE_JUMP_ROOM = 0.88;   // how much of the buzz ceiling that quickest one may use
export const danceJumpBeat = () =>
  DANCE_BUZZ * DANCE_JUMP_ROOM / (DANCE_BEAT * DANCE_TEMPO_HI);
export let DANCE_JUMP_H = 3.5;       // and how many cells it clears at the top

// The dev panel's rows for the dials above, beside the bindings because an
// imported `let` is read-only everywhere else.
export const EFFECT_KNOBS = [
  { key: 'RIFT_INHALE_MAX', label: 'rift bite', min: 100, max: 20000, step: 100,
    get: () => RIFT_INHALE_MAX, set: v => { RIFT_INHALE_MAX = v; } },
  // The dial is how near the buzz the quickest body is allowed to get, not the
  // beat itself: whatever this is set to, the bound holds by construction.
  { key: 'DANCE_JUMP_ROOM', label: 'jump tempo', min: 0.3, max: 1, step: 0.01,
    get: () => DANCE_JUMP_ROOM, set: v => { DANCE_JUMP_ROOM = v; } },
  { key: 'DANCE_JUMP_H', label: 'jump height', min: 1, max: 6, step: 0.25,
    get: () => DANCE_JUMP_H, set: v => { DANCE_JUMP_H = v; } }
];
