// --- effects: the black hole, a crit landing, and the dance -------------------
// Track F4's numbers. Three things that are looked at rather than read: what the
// rift pulls and how it is drawn, what a crit throws up when it lands, and how a
// body celebrates a finished rock.
//
// Every one of these was found with the dev panel or off a `look.mjs` shot, so
// the rows at the bottom of the file are part of the feature rather than a
// nicety: none of them can be argued about on paper.

import { P } from './yard.js';

// --- the rift inhales ---------------------------------------------------------
// The pull is not a rate any more, and that is the point of it. A hole in the
// air that swallows twelve grains a second sits over a full pile doing
// arithmetic; what it is, and what everybody watching expects of it, is
// something nothing gets past. So it takes the whole pile, on the frame the
// grain lands, and there is no ladder because there is nothing left to buy.
//
// The one number is a **ceiling on a frame**, not a balance figure. It exists so
// that a hole with a hundred thousand grains dropped into it in one act does the
// taking over a handful of frames rather than walking a million cells inside
// one. Anything the yard can actually earn is orders under it, which is what
// makes "nothing settles on the pit floor" true rather than nearly true.
export let RIFT_INHALE_MAX = 3000;   // grains it may take in one frame
// And how many of them are drawn on their way in. The stream is the whole of
// what the thing looks like when the yard is feeding it, so it is generous --
// the tearing's own figure is `RIFT_GULP_SHOW`, and this is the same idea at the
// rate an ordinary frame arrives.
export const RIFT_INHALE_SHOW = 600;

// --- and what it looks like ---------------------------------------------------
// A disc is an absence; a black hole is an absence that is *pulling*. Three
// things say so, and all three are flat cells on the same grid as everything
// else: a rim of cleared paper so the core reads as the darkest thing on the
// page, streaks of stuff falling in around it, and a slow warp of the edge.
//
// The halo is what makes the core dark. There is no darker black available --
// the disc is already ink -- so the way to deepen it is to take everything else
// away from around it: two cells of bare paper, and then a thinning stipple, so
// the eye reads a well rather than a sticker.
export const RIFT_HALO = 2;          // cells of paper cleared round the rim
export const RIFT_STIPPLE = 2;       // and cells of thinning speckle past that
// How far round the ring of stipple a cell has to be to be drawn at all: the
// speckle is denser at the sides the infall comes from and thin at the top, so
// the ring is not a printed collar.
export const RIFT_STIPPLE_MS = 2600; // how long the speckle takes to turn once

// The lensing: the rim swells and shrinks, slowly, and not evenly round itself.
// Light bending round a thing this heavy is the one property of a black hole
// everybody knows by sight, and in a grid this coarse it can only be a warp of
// the silhouette. Slow, because a rim that pulses at a readable rate is a
// throbbing blob -- this should be something you notice is never quite still.
export let RIFT_LENS = 0.09;         // share of the radius it swells by
export const RIFT_LENS_MS = 3400;    // and how long one breath takes

// The infall streaks: short trails of stuff falling in, spiralling to the rim.
// They run whether or not the hole is eating anything, which is most of the
// endgame -- the pile is empty because the hole is doing its job, and a hole
// that only moves when it is fed looks broken exactly when it is working.
export let RIFT_STREAKS = 12;        // how many are falling in at once
export const RIFT_STREAK_MS = 1100;  // how long one takes to reach the rim
export const RIFT_STREAK_FROM = 2.6; // where it starts, in disc radii
export const RIFT_STREAK_TURN = 0.8; // turns of the spiral it makes on the way
export const RIFT_STREAK_LEN = 4;    // and how many cells long it is drawn

// And the smear on a grain that is actually going in: a few cells of tail
// pointing back the way it came, so the stream reads as being pulled rather than
// as beads on a wire. Only near the disc, where it is being dragged hardest.
export const RIFT_TAIL = 3;          // cells of tail behind a grain
export const RIFT_TAIL_R = 2.2;      // and how near the disc, in radii, it grows one

// --- the tonic on a body ------------------------------------------------------
// The haze a dosed body gives off, drawn **on the body's own box** and derived
// from the clock: no list, no stepping, nothing saved. See `drawDoseHaze`.
//
// The plume used to be let go into the yard as world-space motes, which is why
// these numbers are here at all: a mote dropped where the head was stays there,
// so a walking body trailed its buff behind it in a streak that got longer the
// faster it went, and which way it pointed depended on which way the body
// happened to be facing. The same tonic looked like four different things.
export const DOSE_HAZE_MOTES = 5;    // motes of it in the air over a fresh dose
export const DOSE_HAZE_MS = 900;     // how long one takes to rise and go
export const DOSE_HAZE_RISE = 3.5;   // cells it climbs in that time
export const DOSE_HAZE_SPREAD = 0.9; // and how far it wanders to either side

// --- a crit landing -----------------------------------------------------------
// The crit already throws its own spoil up as a fountain (see `critToss`), and
// that is the part of it that is *real*: those are the grains the work turned
// up, and they land and bank like any other dust. What was missing was the blow
// itself -- the moment reads as a taller throw rather than as a hit.
//
// So a crit also lets go of a shockwave and a scatter of motes. Neither is dust
// and neither is counted: this yard's one unbreakable rule is that one grain is
// one dust, so anything decorative must be plainly not a grain. They are drawn
// as an outline ring and as specks that never land.
//
// Everything here scales with the crit's multiplier, which is the size of the
// thing that happened: a three-times blow is a ring you notice and a six-times
// one is a ring that crosses the yard.
export const CRIT_RING_MS = 500;     // how long the ring takes to run out
export const CRIT_RING_R = P * 4;    // how far it reaches, per point of multiplier
export const CRIT_RING_WIDE = P;     // and how thick the ring is drawn
export const CRIT_MOTES = 3;         // specks thrown, per point of multiplier
export const CRIT_MOTE_LIFE = 0.55;  // seconds one lasts
export const CRIT_MOTE_SPEED = P * 0.5;  // world pixels a frame it leaves at
export const CRIT_MOTE_DRAG = 0.9;   // and how quickly it gives that up

// --- the dance ----------------------------------------------------------------
// A celebration is jumping up and down. It was three moves -- a hop, a pace
// across the ground, and a turn on the spot -- and the two that travelled read
// as a shuffle rather than as delight: a body pleased with itself does not amble
// sideways, it leaves the ground.
//
// So the dance is one move now, and these are its two numbers. The beat is a
// multiple of DANCE_BEAT like every other move's, and it is quicker than the old
// hop's 1.2 without reaching DANCE_BUZZ -- the pace at which a bouncing body
// stops reading as pleased and starts reading as faulty.
export let DANCE_JUMP_BEAT = 1.5;    // jumps a beat, as a multiple of DANCE_BEAT
export let DANCE_JUMP_H = 3.5;       // and how many cells it clears at the top

// The dev panel's rows for the dials above. A row lives beside the binding it
// moves: an imported `let` is read-only everywhere else, so the get/set pair has
// to be written in the file that declares it.
export const EFFECT_KNOBS = [
  { key: 'RIFT_INHALE_MAX', label: 'rift bite', min: 100, max: 20000, step: 100,
    get: () => RIFT_INHALE_MAX, set: v => { RIFT_INHALE_MAX = v; } },
  { key: 'RIFT_LENS', label: 'rift lensing', min: 0, max: 0.4, step: 0.01,
    get: () => RIFT_LENS, set: v => { RIFT_LENS = v; } },
  { key: 'RIFT_STREAKS', label: 'rift streaks', min: 0, max: 48, step: 1,
    get: () => RIFT_STREAKS, set: v => { RIFT_STREAKS = v; } },
  { key: 'DANCE_JUMP_BEAT', label: 'jumps a beat', min: 0.5, max: 2.4, step: 0.05,
    get: () => DANCE_JUMP_BEAT, set: v => { DANCE_JUMP_BEAT = v; } },
  { key: 'DANCE_JUMP_H', label: 'jump height', min: 1, max: 6, step: 0.25,
    get: () => DANCE_JUMP_H, set: v => { DANCE_JUMP_H = v; } }
];
