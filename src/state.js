// Everything that changes while the game runs, in one place.
//
// It is one plain object rather than a module full of `let`s because the game is
// split across files and they all need to read and write the same game. Modules
// own behaviour; this owns the facts. If you are adding a module, put its state
// here and its code in its own file, and two people can work on two files
// without meeting in the middle.
//
// Fixed things -- the numbers that never change while the game runs -- are in
// config.js. The two grids and the bench are objects that are mutated in place,
// so they live here as consts rather than as fields on S.

import { P } from './config.js';

export const S = {
  // --- the window and the view ---
  W: 0, H: 0,             // the window, in screen pixels
  zoom: 1,                // shrinks to fit a small window, never rearranges
  dpr: 1,                 // device pixels per screen pixel
  viewW: 0, viewH: 0,     // what the window covers, in world units
  camX: 0, camY: 0,       // how far the view has been scrolled over the world
  camTo: null,            // somewhere the view is gliding to, or null
  // A knock the view is still rocking through, and where that has it this
  // frame. It is not part of the camera: the camera is where you are looking
  // and this is the ground moving under it, so it is added at the last moment
  // and clamped by nothing.
  shake: 0,               // how much of a knock is left, in world pixels
  shakePh: 0,             // where in the rocking it is
  shakeX: 0, shakeY: 0,   // and what that comes to this frame
  worldW: 0, worldH: 0,   // the world is wider than the window; the pit runs off it

  // --- where things stand ---
  cx: 0, cy: 0,           // the middle of the rock
  groundY: 0,             // the ground line: everything stands on it

  // --- the rock ---
  boulder: [],            // rows of ints: 0 empty, else the rock still stacked there
  gw: 0, gh: 0,           // its size in cells
  rockTops: [],           // topmost rock cell per column, for the crew to stand on
  tick: 0,                // frames, for the things not worth doing in all of them
  floorGrains: 0,         // dust lying about the yard, counted now and then
  floorMarks: [],         // and where anything in it that is not dust has come to rest
  // Every station piles to its right, into a strip of ground of its own. The
  // strips are worked out when the world is laid out and when the rock changes
  // size; what is lying in each is counted twice a second, with the rest of the
  // survey of the ground.
  piles: [],              // each station's strip: { key, from, to }
  pileCount: {},          // what is lying in each of them
  pileFull: {},           // and which of them have stopped their station
  boulderNo: 1,           // how many rocks in; each one is bigger than the last
  coreBuried: true,       // this rock still has its core inside it
  rockFall: 0,            // world pixels a new rock still has to come down
  rockFallV: 0,           // how fast it is coming
  danceUntil: 0,          // the crew are celebrating the last one until this moment
  nextBoulderAt: 0,       // backstop, in case a core never falls clear
  peakRow: 0,             // the highest standing rock, recomputed each frame

  // --- dust in the air and on the cursor ---
  chips: [],              // knocked loose, still flying
  paid: [],               // flying out of the pit to the bench, on the way to being spent
  motes: [],              // the load drifting round the cursor
  trail: [],              // recent cursor positions, for the throw
  held: 0,                // how much dust is on the cursor

  // --- the hole ---
  stored: 0,              // dust in the hole: the whole point
  banked: 0,              // and every grain ever put in it, which only goes up
  shownStored: 0,         // the counter chases the real number
  tweenFrom: 0, tweenTo: 0, tweenAt: 0, tweenMs: 300,
  pitStep: 0,             // how many times the pile has settled to a finer grain
  pitLevel: 0,            // how many times the hole has been dug out

  // --- cores ---
  cores: 0,
  seenCore: false,        // nothing about cores is shown until one is banked
  coreItem: null,         // a core loose in the world
  heldCore: false,        // carrying one on the cursor
  coreTaker: null,        // the worker that has claimed a loose one

  // --- what you have bought ---
  // Bodies that cannot be moved. A job is a count, not a purchase -- except for
  // these: a body sent to the school comes back knowing one trade and only that
  // trade, and what the shards bought is the fact that it stays.
  schoolOpen: false,      // the school is built and the trades can be learnt
  schoolBoardOpen: false, // and you are standing at it
  breakers: 0,            // of the miners, this many are nailed to the rock
  carters: 0,             // of the haulers, to the dust
  growers: 0,             // of the farmhands, to the beds
  blasters: 0,            // of the quarriers, to the face

  carryLevel: 0,
  speedLevel: 0,
  pickLevel: 0,
  autoMine: false,

  // --- the quarry, and what comes out of it ---
  shards: 0,
  seenShard: false,       // nothing about shards is shown until one is brought up
  quarryOpen: false,        // the quarry has been opened

  // --- the farm, and what grows in it ---
  spores: 0,
  seenSpore: false,
  farmOpen: false,
  beds: [],               // how far along each bed is, 0..1

  // --- the lab ---
  // what the lab is working on, if anything: one piece at a time, and it only
  // moves while somebody is in there
  research: null,         // { key, done } -- worker-seconds put in so far
  smoke: [],              // puffs off the chimney while it is being worked
  smokeAt: 0,
  houseSmokeAt: 0,      // and when the crew's own chimney last had a puff
  shutters: [],         // rooms with the curtain across, by room number
  shutterAt: 0,         // when the next one of them changes its mind
  shutterN: 0,          // how many have, which is what picks the next
  skyShown: false,        // the thing in the sky is benched; the dev panel can put it back
  labOpen: false,
  labBoardOpen: false,
  // A finished piece of research nobody has been to see yet. The crew are
  // inside the lab where you cannot watch them, so the one moment worth
  // reporting is the moment the work is done -- and it is kept until it is
  // read, because it usually happens while you are looking somewhere else.
  labDone: null,
  // When the lab last had somebody in it with nothing to research. Nothing else
  // takes a body off the lab, so this is what eventually does: it is a stopwatch
  // rather than a fact about the game, so it is not worth saving.
  labIdleAt: 0,
  mult: { swing: 0, haul: 0, quarry: 0, tend: 0 },

  // --- the crew ---
  // One pool of bodies, hired once and put wherever you like. A job is a count
  // of how many are on it, and carrying dust is what the rest do: `haulers` is
  // always the ones left over, never a job you hire into. That is what makes
  // putting somebody on the rock a decision rather than a purchase.
  workers: [],            // little squares that mine and ferry dust
  crew: 0,                // bodies hired, all told
  miners: 0, minerSpeedLevel: 0, minerPickLevel: 0,
  haulers: 0, haulCarryLevel: 0, haulPaceLevel: 0,    // haulers: whatever is spare
  quarriers: 0, quarryPaceLevel: 0,
  labbers: 0,             // and the ones standing in the lab, working on the research
  farmhands: 0, tendLevel: 0,

  // --- what you are doing right now ---
  mouse: { x: 0, y: 0 },
  mining: false,
  dragging: false,
  nextHit: 0,
  // The bench is not there until there is something on it worth buying, and it
  // carries a mark when there is: a dot for something you can afford now, a
  // flag for a whole group of rows you have never seen.
  seenBench: false,       // the bench has been earned and stays from then on
  seenSects: [],          // headings that were on the board last time it was open
  boardOpen: false,       // the workbench board is showing
  resetArmed: 0,          // the reset button wants a second click

  // --- housekeeping ---
  dirty: false,           // something changed worth saving
  lastFrame: 0,           // for the length of the last frame
  dustSeen: 0, dustSeenAt: 0,   // a cached count, for how many motes drift about
  settleAt: 0             // the column the pit settler got to last frame
};

// The two sand grids -- the ground the dust lands on, and the pit dug into it --
// and the bench. These are mutated in place and never reassigned, so they are
// consts rather than fields on S. `p` is the size of one grain in that grid.
export const floor = { x: 0, y: 0, cols: 0, rows: 90, p: P, grid: null, painter: null };
export const school = { x: 0, y: 0, w: 0, h: 0 };
export const pit = { x: 0, y: 0, w: 0, h: 0, cols: 0, rows: 0, p: P, grid: null, painter: null };
export const bench = { x: 0, y: 0, w: 0, h: 0 };
export const quarry = { x: 0, y: 0, w: 0, h: 0 };
export const farm = { x: 0, y: 0, w: 0, h: 0 };
export const lab = { x: 0, y: 0, w: 0, h: 0 };
export const sky = { x: 0, y: 0, r: 0 };   // the thing hanging out past the farm
