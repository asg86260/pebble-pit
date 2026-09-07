// --- effects: the black hole, a crit landing, and the dance -------------------
// Track F4's numbers. Three things that are looked at rather than read: what the
// rift pulls and how it is drawn, what a crit throws up when it lands, and how a
// body celebrates a finished rock.
//
// Every one of these was found with the dev panel or off a `look.mjs` shot, so
// the rows at the bottom of the file are part of the feature rather than a
// nicety: none of them can be argued about on paper.

import { P } from './yard.js';
// The dance's own two rules -- the base beat and the pace that reads as a fault
// -- which the jump's tempo below is worked out from rather than set beside.
import { DANCE_BEAT, DANCE_BUZZ } from './rocks.js';

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
// A disc is an absence; a black hole is an absence that is *pulling*. What says
// so is the rim of cleared paper that makes the core the darkest thing on the
// page -- and the dust going into it, which is drawn where it actually is.
//
// The halo is what makes the core dark. There is no darker black available --
// the disc is already ink -- so the way to deepen it is to take everything else
// away from around it: two cells of bare paper, and then a thinning stipple, so
// the eye reads a well rather than a sticker.
export const RIFT_HALO = 2;          // cells of paper cleared round the rim
export const RIFT_STIPPLE = 2;       // and cells of thinning speckle past that
// Nothing about the disc itself moves. It had a lensing rim that swelled and
// leaned, a speckle collar that turned, eight strands for ever spiralling in
// whether or not anything was, and a song of purple rings going out of it --
// RIFT_LENS, RIFT_STIPPLE_MS, the RIFT_STREAK_* family and the RIFT_SONG_*
// family, all gone. Each was defensible alone and together they were an
// ornament that never stopped moving, on a thing that is idle most of the
// endgame because it is keeping up. The hole is a place, not a creature: what
// moves is the dust going into it. See `drawRift` in render/cores.js.

// And the smear on a grain that is actually going in: a few cells of tail
// pointing back the way it came, so the stream reads as being pulled rather than
// as beads on a wire. Only near the disc, where it is being dragged hardest.
export const RIFT_TAIL = 3;          // cells of tail behind a grain
export const RIFT_TAIL_R = 2.2;      // and how near the disc, in radii, it grows one

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
export const CRIT_RING_MS = 260;     // how long the ring takes to run out
export const CRIT_RING_R = P * 1.6;  // how far it reaches, per point of multiplier
export const CRIT_RING_WIDE = P;     // and how thick the ring is drawn
export const CRIT_MOTES = 3;         // specks thrown, per point of multiplier
export const CRIT_MOTE_LIFE = 0.35;  // seconds one lasts
export const CRIT_MOTE_SPEED = P * 0.6;  // world pixels a frame it leaves at
export const CRIT_MOTE_DRAG = 0.78;  // and how quickly it gives that up

// --- the dance ----------------------------------------------------------------
// A celebration is jumping up and down. It was three moves -- a hop, a pace
// across the ground, and a turn on the spot -- and the two that travelled read
// as a shuffle rather than as delight: a body pleased with itself does not amble
// sideways, it leaves the ground.
//
// So the dance is one move now, and it has one dial and one height.
//
// **The tempo is derived, not chosen.** `DANCE_BUZZ` is the pace at which a
// bouncing body stops reading as pleased and starts reading as faulty -- it is
// the rule, and it was already written down. What a body actually crosses its
// own height at is `DANCE_BEAT` times the move's multiple times the tempo that
// body rolled for itself, so the honest thing to set is how much of that ceiling
// the QUICKEST body in the yard may use, and to work the multiple back out of
// it. A hand-set multiple is a number that is right until somebody widens the
// tempo spread or nudges DANCE_BEAT, and then it is silently wrong in a way only
// a suite notices.
//
// Every body rolls its own tempo so that no two of them are ever quite together
// -- see `beatMs` in dance.js, which is the only reader. The two ends of that
// roll are here rather than in the module because the bound above is worked out
// from the top of it: if the roll and the bound lived apart they could drift,
// and the drift would be exactly this bug.
export const DANCE_TEMPO_LO = 0.85;  // the slowest tempo a body rolls for itself
export const DANCE_TEMPO_HI = 1.15;  // and the quickest
// A ninth of the ceiling is left over the fastest body in the yard, and it is
// not decoration: a crossing rate can only ever be measured as sixty over some
// whole number of frames, so a true 2.375 reads as 2.40 and a bound with no room
// in it is a bound that fails on the rounding. What this buys is a dance that
// still cannot buzz when somebody widens the tempo roll or nudges DANCE_BEAT.
export let DANCE_JUMP_ROOM = 0.88;   // how much of the buzz ceiling that quickest one may use
export const danceJumpBeat = () =>
  DANCE_BUZZ * DANCE_JUMP_ROOM / (DANCE_BEAT * DANCE_TEMPO_HI);
export let DANCE_JUMP_H = 3.5;       // and how many cells it clears at the top

// The dev panel's rows for the dials above. A row lives beside the binding it
// moves: an imported `let` is read-only everywhere else, so the get/set pair has
// to be written in the file that declares it.
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
