import { P } from './yard.js';

// --- the quarry ---------------------------------------------------------------
// A mouth in the ground away to the left. Crew walk in, are gone a while, and
// come back out with a shard. The trip time is the whole of the mechanic: it is
// what an upgrade shortens, and what makes sending somebody in a decision.
export const QUARRY_W = 156;       // the mouth, in world pixels
export const QUARRY_H = 126;      // and how deep the first cut goes
// How many bodies a cut holds, and how it comes to hold more.
//
// A fresh quarry is two benches of standing room and no more, so the third body
// you want down there is a thing you have to buy rather than a slider you drag.
// What buys it is a shard -- the quarry paying for its own next bench is the
// whole reason to open the quarry at all, and it is a place growing rather than
// a number going up: every bench taken out is another step down the wall you
// can see from the rim.
export const QUARRY_BENCH0 = 2;    // bodies a fresh quarry has room for
export const QUARRY_BENCH_MAX = 5; // and the deepest it is ever worked

export const LIP_GANG = 6;
export const QUARRY_DEEPEN = P * 4;  // how much further down each one goes
// Spores for the first of them (the farm feeds the cut -- the comment here said
// shards for a year while the row spent spores), and priced against a farm that
// mints them by the hundred: the grind pass measured a spore glut two hundred
// times the shard trickle, with both coins priced as equals.
export const BENCH_COST = 10;      // spores for the first of them
export const BENCH_RATE = 1.7;     // and how much steeper each one gets
export const QUARRY_PACE_COST = 12; // the dig-speed ladder's first rung, spores
// It is a worked cut, not a hole somebody cut with a square. Both walls come
// down in benches and the floor they leave is uneven, which is what months of
// working a face does to one. The shape is a pattern rather than a scatter: a
// quarry that reshuffled itself every frame would be a different quarry every
// time you looked at it, so this is worked out once and kept.
// Each bench is [how far in, how far down], as a share of the mouth. The drops
// are normalised, so they always land the last one exactly on the floor.
export const QUARRY_NEAR_BENCH = [[0.00, 0.30], [0.05, 0.22], [0.03, 0.20], [0.03, 0.28]];
export const QUARRY_FAR_BENCH = [[0.00, 0.36], [0.04, 0.24], [0.03, 0.22], [0.02, 0.18]];
export const QUARRY_FLOOR_STEP = 4;   // cells of floor per stretch
export const QUARRY_FLOOR_JAG = [0, 1, 2, 1, 0, 2, 1, 0];  // and cells of relief on each
// How often a quarrier swings, as opposed to how often the face gives anything
// up. They were the same number, so at pace 0 a worker hit the rock once every
// eleven seconds and stood there the rest of the time. A quarry should look
// busy whether or not it is being productive.
export const QUARRY_SWING = 620;
export const QUARRY_SHUFFLE = 0.35;   // and how fast it works along the face
export let QUARRY_BASE = 11000;  // a shard off the face at pace 0
// --- what the quarry is for ------------------------------------------------------
// Shards used to trickle: a quarrier swung, and every so often one came off the
// face and went over the rim, for ever, at a steady rate. Which made blue a tap
// rather than a find -- and a tap is a number going up, not a thing you went and
// got.
//
// So a cut is a *job*: full of dirt, worked down through, and the ground falls
// back in behind the last one out. Deeper cut, more stone in it. What that first
// bought was a seam at the bottom -- dig the lot out, then stand there and throw
// a handful over the rim -- and that overshot in the other direction. A minute
// of swinging that pays on its last frame is a loading bar with people drawn on
// it, and the pile outside only ever moved while nobody was digging.
//
// What is here now is the middle of the two: the stone is *in the ground*,
// scattered through the cells of the cut, and a swing either turns some up or
// does not. A dig is still a bounded thing you finish, and still worth exactly
// CUT_SEAM a bench -- see `findShards`, which deals the scatter rather than
// rolling it, so the amount never drifts and a dig never ends owing you any.
// The swinging in one dig, at pace nought. What a dig actually takes is this
// plus the walking between cells, which is real and is meant to be: a cut is
// worked by people crossing it, not by a number filling.
export let CUT_DIG_MS = 16000;   // to get from the surface to the bottom, at pace 0
// Three, not two.
//
// Blue was the thing everybody waited on. A plot comes on by itself while you
// watch and a dig has to be worked out end to end for its handful, so green
// arrived in a steady trickle and blue in lumps that were a long way apart -- and
// with the two grounds now paying for each other (the cut is deepened with
// spores and the plots are broken with shards) the slower of the two sets the
// pace of both. Half again per bench is the smallest change that fixes it
// without touching what a dig *is*.
export const CUT_SEAM = 3;         // shards in the ground, per bench of depth
export const QUARRY_FLOOR = 2200;  // the quickest a trip will ever be
export const QUARRY_WALK = 1.1;    // a quarrier's walking speed, px per frame
// And how fast it steps between the cells of its own face, which is a different
// thing: crossing the yard is a journey and shifting along a course you are
// working is a shuffle. Slower than walking, because that is what it is -- a
// body with a pick moving a pace and a half to the next bit of ground.
//
// It was three times a walking pace once, and double that for a blaster, which
// made the fastest thing in the yard a man in a hole. That number came from
// wanting a dig to take a certain time, which is no reason for anything in the
// world to move at a speed: a dig takes as long as digging takes. What makes it
// affordable is that a body picks a cell from the few nearest it, so the walks
// are a pace or two and a slow pace costs almost nothing.
export let CUT_STEP = 0.6;

// The dev panel's rows for the knobs above. A row lives beside the binding it
// moves because nothing but this file can assign to one: an imported `let` is
// read-only everywhere else, so the get/set pair has to be written where the
// `let` is. config.js gathers every file's rows into one TUNABLE.
export const QUARRY_KNOBS = [
  { key: 'CUT_DIG_MS', label: 'a dig takes', min: 3000, max: 120000, step: 1000,
    get: () => CUT_DIG_MS, set: v => { CUT_DIG_MS = v; } },
  { key: 'CUT_STEP', label: 'pace along a face', min: 0.1, max: 3, step: 0.05,
    get: () => CUT_STEP, set: v => { CUT_STEP = v; } },
  { key: 'QUARRY_BASE', label: 'quarry pace', min: 200, max: 20000, step: 200,
    get: () => QUARRY_BASE, set: v => { QUARRY_BASE = v; } }
];
