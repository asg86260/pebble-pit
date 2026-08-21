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
  worldW: 0, worldH: 0,   // the world is wider than the window; the pit runs off it

  // --- where things stand ---
  cx: 0, cy: 0,           // the middle of the rock
  groundY: 0,             // the ground line: everything stands on it

  // --- the rock ---
  boulder: [],            // rows of ints: 0 empty, else the rock still stacked there
  gw: 0, gh: 0,           // its size in cells
  rockTops: [],           // topmost rock cell per column, for the crew to stand on
  boulderNo: 1,           // how many rocks in; each one is bigger than the last
  coreBuried: true,       // this rock still has its core inside it
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
  shownStored: 0,         // the counter chases the real number
  tweenFrom: 0, tweenTo: 0, tweenAt: 0, tweenMs: 300,
  pitStep: 0,             // how many times the pile has settled to a finer grain

  // --- cores ---
  cores: 0,
  seenCore: false,        // nothing about cores is shown until one is banked
  coreItem: null,         // a core loose in the world
  heldCore: false,        // carrying one on the cursor
  coreTaker: null,        // the worker that has claimed a loose one

  // --- what you have bought ---
  carryLevel: 0,
  speedLevel: 0,
  pickLevel: 0,
  autoMine: false,

  // --- the cave, and what comes out of it ---
  shards: 0,
  seenShard: false,       // nothing about shards is shown until one is brought up
  caveOpen: false,        // the cave has been opened
  finds: [],              // a shard rising over the mouth, on its way to being counted

  // --- the farm, and what grows in it ---
  spores: 0,
  seenSpore: false,
  farmOpen: false,
  beds: [],               // how far along each bed is, 0..1
  crop: [],               // a spore rising off a bed just harvested

  // --- the meteor ---
  sparks: 0,
  seenSpark: false,
  meteorOpen: false,
  meteorAt: 0,            // when the next spark comes loose
  falling: [],            // sparks on their way down

  // --- the lab ---
  labOpen: false,
  labBoardOpen: false,
  mult: { swing: 0, haul: 0, cave: 0, tend: 0, works: 0 },

  // --- the crew ---
  workers: [],            // little squares that mine and ferry dust
  miners: 0, minersUnlocked: false, minerSpeedLevel: 0,
  haulers: 0, haulersUnlocked: false, haulCarryLevel: 0, haulPaceLevel: 0,
  spelunkers: 0, cavePaceLevel: 0,
  farmhands: 0, tendLevel: 0,

  // --- what you are doing right now ---
  mouse: { x: 0, y: 0 },
  mining: false,
  dragging: false,
  nextHit: 0,
  boardOpen: false,       // the workbench board is showing
  resetArmed: 0,          // the reset button wants a second click

  // --- housekeeping ---
  dirty: false,           // something changed worth saving
  lastFrame: 0,           // for the length of the last frame
  dustSeen: 0, dustSeenAt: 0,   // a cached count, for how many motes drift about
  settleAt: 0,            // the column the pit settler got to last frame
  pitImage: null,         // the pit's pixels, one per grain
  pitPainted: false,      // false means repaint the whole pile
  pitLo: 0, pitHi: -1, pitTop: -1, pitBot: 0   // what has changed since the last paint
};

// The two sand grids -- the ground the dust lands on, and the pit dug into it --
// and the bench. These are mutated in place and never reassigned, so they are
// consts rather than fields on S. `p` is the size of one grain in that grid.
export const floor = { x: 0, y: 0, cols: 0, rows: 90, p: P, grid: null };
export const pit = { x: 0, y: 0, w: 0, h: 0, cols: 0, rows: 0, p: P, grid: null };
export const bench = { x: 0, y: 0, w: 0, h: 0 };
export const cave = { x: 0, y: 0, w: 0, h: 0 };
export const farm = { x: 0, y: 0, w: 0, h: 0 };
export const lab = { x: 0, y: 0, w: 0, h: 0 };
export const meteor = { x: 0, y: 0, r: 0 };
