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
  // Where the view was left last time, if the save had it. Only read once, at
  // boot: coming back to a game should put you back where you were looking,
  // not march you off to the rock again. Null on a game that has never been
  // played, and the opening view is what that gets. See main.js.
  camWas: null,
  follow: null,           // somebody the view is keeping up with, or null
  camLockY: null,         // and a height it is held at, for the opening only
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
  rockSand: null,         // and what is lying on top of it: a stack of shades per column
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
  // --- the opening, and the one under the rock ---
  // Nothing about this is scenery: the body under the boulder is why there is a
  // crew, a pit and a rock that keeps coming. See intro.js.
  intro: null,            // 'chat' while the two of them are talking, then never again
  introDone: false,
  reunionDone: false,     // and the one beat after the first rock, also once only
  // A scene owns the yard: no rock rolls in on its own and the ground under the
  // rock is not a place to be got out of, because nothing is coming until the
  // scene drops it. A fact rather than a call into intro.js, so that rock.js and
  // core.js can ask without either of them having to know that scenes exist.
  sceneHolds: false,
  introAt: 0,
  introSaid: 0,
  pair: [],               // the two of them, before the rock
  buried: false,          // somebody is under it, and still alive
  buriedSay: null,
  buriedSayAt: 0,
  boulderNo: 1,           // how many rocks in; each one is bigger than the last
  coreBuried: true,       // this rock still has its core inside it
  rockFall: 0,            // world pixels a new rock still has to come down
  rockFallV: 0,           // how fast it is coming
  danceUntil: 0,          // the crew are celebrating the last one until this moment
  nextBoulderAt: 0,       // backstop, in case a core never falls clear
  peakRow: 0,             // the highest standing rock, recomputed each frame

  // --- dust in the air and on the cursor ---
  chips: [],              // knocked loose, still flying
  belt: [],               // riding the belt, between the ground and the hole
  paid: [],               // flying out of the pit to the bench, on the way to being spent
  gulped: [],             // and out of the pit into the rift, on the way out of this dimension
  motes: [],              // the load drifting round the cursor
  trail: [],              // recent cursor positions, for the throw
  held: 0,                // how much dust is on the cursor

  // --- the hole ---
  stored: 0,              // dust in the hole: the whole point
  banked: 0,              // and every grain ever put in it, which only goes up
  shownStored: 0,         // the counter chases the real number
  tweenFrom: 0, tweenTo: 0, tweenAt: 0, tweenMs: 300,

  // --- the rift ---
  // Dust that is not here. The hole holds what the hole holds, at full size, for
  // ever; everything banked past that stands in another dimension and costs
  // nothing to keep, because nothing about it is drawn. `stored` is still all the
  // dust you own -- see `inHole` in pit.js, and `## The rift` in DESIGN.md.
  seenFullPit: false,     // the hole has turned a grain away at least once
  riftOpen: false,        // the rift is bought
  rift: 0,                // and how many grains are through it
  riftLevel: 0,           // how fast it swallows: an endless ladder, not a capacity
  hideDone: false,        // whether finished ladders are folded off the boards

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
  growers: 0,             // of the farmhands, to the plots
  blasters: 0,            // of the quarriers, to the face

  carryLevel: 0,
  speedLevel: 0,
  pickLevel: 0,
  autoMine: false,

  // --- the quarry, and what comes out of it ---
  shards: 0,
  seenShard: false,       // nothing about shards is shown until one is brought up
  quarryOpen: false,        // the quarry has been opened
  benchLevel: 0,          // benches taken out of the quarry past the two it starts with

  // --- the farm, and what grows in it ---
  spores: 0,
  seenSpore: false,
  farmOpen: false,
  plotLevel: 0,            // plots broken past the three the ground comes with
  plots: [],               // how far along each plot is, 0..1
  plotTone: [],            // and the spore standing ripe on it, if there is one

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
  skyShown: false,        // the thing in the sky, drawn even before the tower calls one down

  // --- the meteor and the wizards ---
  // The sky is a place work comes from once the tower has called something down
  // into it. A wizard is a hat like any other -- `wizardHats` is what the tower
  // has made, `wizards` is how many bodies are up there wearing one -- except
  // that this is the one job nobody can do bare-headed.
  meteorOpen: false,      // the tower has called one down at least once
  summon: 0,              // how far along the ring is with making the next one, 0..1
  flashAt: 0,             // when the last one went off, for the breath the sky keeps it
  sparks: 0,              // the red out of the core, banked
  seenSpark: false,       // and whether one has ever come down
  wizardHats: 0,          // hats the tower has finished
  wizards: 0,             // bodies up there wearing one
  brewAt: 0,              // when the hat on the go is done, or 0 for nothing on the go
  labOpen: false,

  // --- the casino ---
  // One table, one pot. `pot` is null until something is staked, and what is on
  // it is `n` of `cur` -- the same currencies everything else in the game is
  // priced in, because a chip you can only use here would be a fifth currency.
  casinoOpen: false,
  casinoBoardOpen: false,
  pot: null,              // { cur, stake, n, at } -- what is on the table
  wheel: 0,               // where the wheel has turned to
  spinAt: 0,              // when the wheel was set going
  spinFrom: 0, spinTo: 0, // and the mark it is turning from and to
  spinUntil: 0,           // and until when it is being spun in earnest
  // A chip is down and the stake is still raining on to the table. The wheel is
  // owed a spin and does not start it until the heap has stopped moving, so this
  // is the beat between the gesture and the wheel. See `pouring` in casino.js.
  pouring: false,
  tableAir: [],           // the table's grains in the air: arriving, leaving, or on their way to the hole
  paying: null,           // { cur, left } -- a pot on its way across the yard to the pit
  spinWon: false,         // what it is about to land on, decided when it starts
  chip: 0,                // which of CASINO_CHIPS is on the table
  // The hand that just settled, kept for a few seconds so a wheel you were not
  // watching still tells you which way it went.
  hand: null,             // { won, n, cur, at }
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
  // How many the lab let out for want of anything to do. Starting a piece of
  // research calls exactly these back, so the game undoing its own tidying is
  // not a chore it hands to you.
  labLeft: 0,
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
  // How many cells deep each column of the quarry has been dug. Nought everywhere is
  // bare ground with no hole in it: the quarry is what has been taken out, not a
  // shape the yard was drawn with. See quarry.js.
  quarryCells: null,
  // What the seam still owes, once somebody has broken through to it. It belongs
  // to the hole rather than to the body that reached it, so a gang at the bottom
  // shares one handful out between them rather than each being handed its own.
  quarryOwed: 0,
  // Cells taken out of the quarry, ever. The share dug runs round and round as the
  // hole is emptied and falls in, so it cannot say how much work was done over a
  // stretch that happens to cross a payout; this only ever goes up.
  quarryTotal: 0,
  // The three machines, keyed. One object rather than nine flat fields on S,
  // because it is four places to remember when the save format moves instead of
  // thirty-six -- and the note in `reset()` about the rift is what forgetting
  // one of thirty-six looks like afterwards. See machines.js for the shape.
  machines: null,
  // A machine whose lever has just been thrown wants its gang back, and that
  // cannot happen inside the worker pass: `rebalance`/`syncWorkers` replace
  // `S.workers`, and the pass is iterating it. So the arrival sets this and the
  // frame drains it afterwards. See game.js.
  restaff: null,
  // This dig is finished with: the seam is out and everybody is on their way up.
  // Nobody goes back down until the last one is out and the quarry has fallen in,
  // or the first body back down finds an empty hole and turns straight round.
  quarrySpent: false,
  // How much quicker the lab's own bench is, and whether a second one has been
  // built. The lab was the one building with no ladder of its own: every piece
  // took as long as the first however far in you were, and it is the thing
  // standing between you and every other multiplier in the game.
  labKitLevel: 0,
  labRooms: 1,
  // The second piece being looked into, when there is a bench for it. One field
  // rather than a list: the lab holds two, and two is the whole of the upgrade.
  research2: null,
  // How often a wizard throws, and how much of the star comes off when it lands.
  // The tower had no ladders at all: the one thing standing between you and
  // every spark in the game could only be made faster by hiring another body.
  // How much harder the scrubbing house pulls. It was built to answer hand
  // labour and the machines out-dirty it several times over.
  // Where the tiller has got to on its run up the row and back, 0..2. Everything
  // about the machine is read off it: where it is drawn, which furrow it works,
  // where its tender stands.
  tillerAt: 0,
  fanLevel: 0,
  // Which of the tower's enchantments have been laid on the yard. A set of keys
  // rather than a count each: a spell is either on or it is not.
  // True for the few lines a machine is driving a station's own code. What it
  // switches off is the station fouling where the work happened: a machine's
  // dirt goes up off its stack instead, all of it, in soot. See `foul`.
  machineWorking: false,
  spells: [],
  wizSpeedLevel: 0,
  wizPowerLevel: 0,
  labbers: 0,             // and the ones standing in the lab, working on the research
  farmhands: 0, tendLevel: 0,

  // --- what you are doing right now ---
  mouse: { x: 0, y: 0 },
  mining: false,
  paused: false,          // the whole yard held still, on the space bar
  houseBoardOpen: false,  // and the block, with what you can put up on it
  crewListOpen: false,    // whose submenu of names is out beside it
  quarryBoardOpen: false,
  farmBoardOpen: false,
  outhouseOpen: false,    // there is somewhere to go
  towerOpen: false,       // the tower is up
  towerBoardOpen: false,
  scrubBoardOpen: false,

  // --- the air ----------------------------------------------------------------
  haze: 0,                // motes in the sky, waiting to come back down
  raining: false,         // and whether it is coming back down right now
  rainFor: 0,             // seconds into this shower, which is how hard it is coming down
  rains: 0,               // how many times they have
  scrubOpen: false,       // the house is built
  scrubbers: 0,           // and this many bodies are in it
  janitors: 0,            // and how many are shovelling up after everybody
  seenMess: false,        // and whether the yard has ever been left in a state
  // The crew's second tier, which the quarry pays for: a harness to carry with and
  // boots to walk in. Their own counts rather than more rungs on the first two
  // ladders, because a ladder has an end -- see "The ladder" in DESIGN.md.
  harnessLevel: 0,
  bootsLevel: 0,
  introThrew: 0,          // when the opening's one throw was let go of
  recycler: false,        // which keep what they catch rather than binning it
  scrubBank: 0,           // part of a grain, on its way to being a whole one
  pumpAt: 0,              // how far into its stroke the bellows is, so an empty house shuts rather than cuts
  recycled: 0,            // and how many whole ones it has given back
  seenAir: false,         // the lab has been told to watch the sky

  // What came down and has not been cleared, one depth per column of the world.
  // The layer is the whole record: what is buried, what is in the way and what
  // there is to shift are all read off it.
  muck: [],
  dragging: false,
  nextHit: 0,
  // The bench is not there until there is something on it worth buying, and it
  // carries a mark when there is: a dot for something you can afford now, a
  // flag for a whole group of rows you have never seen.
  seenBench: false,       // the bench has been earned and stays from then on
  seenSects: [],          // headings that were on the board last time it was open
  seenRows: [],           // and the rows themselves, so a new one can say so
  boardOpen: false,       // the workbench board is showing
  resetArmed: 0,          // the reset button wants a second click

  // --- housekeeping ---
  // Which run this is. A run owns its seed: one is drawn when a new game starts
  // (see `reset` in persist.js), it is written down with the save, and it comes
  // back with it -- so the yard you are looking at has a name, and a yard worth
  // telling somebody about can be handed over. The chance itself is in rng.js;
  // this is only the number it was started from.
  runSeed: 0,
  dirty: false,           // something changed worth saving
  lastFrame: 0,           // for the length of the last frame
  settleAt: 0             // the column the pit settler got to last frame
};

// The yard as it is written above, kept.
//
// `reset` in persist.js puts a game back by naming a hundred fields and what
// each of them goes back to, and that list has to be kept level with this one.
// It never quite is: `nextBoulderAt`, `quarryCells`, `tick` and a
// handful of others are declared here and forgotten there, so a "new game" in a
// page that has already played one starts with the last game's cached dust
// count, its rock timer and its quarry. In play that is nearly invisible -- the
// clock only goes forward, so a stale stamp is a stamp in the past, and the
// first survey of the ground overwrites the counts within a frame. It is not
// invisible at all to a run started again from a seed, where the clock starts
// again too and every one of those stamps is suddenly a whole run in the
// future: the yard behaves differently, draws a different number of times, and
// two runs of one seed part company on their first frame.
//
// So the declaration is the list, and there is only the one. `seedGame` in
// hooks.js puts every field back to what it says here before it clears the
// yard, which is the difference between a new game and a new game in a page
// that remembers the last one. Nothing in play reads this: a player's new game
// goes through `reset` as it always did.
export const BLANK = JSON.parse(JSON.stringify(S));

// The two sand grids -- the ground the dust lands on, and the pit dug into it --
// and the bench. These are mutated in place and never reassigned, so they are
// consts rather than fields on S. `p` is the size of one grain in that grid.
//
// The four `awake*` fields belong to `settle` -- see grid.js, "which columns are
// still moving" -- and they are declared here, empty, rather than being added
// when the sand first needs them. That is not tidiness. A grid object is read a
// hundred thousand times a frame by everything that asks where the ground is,
// and growing it a field at a time after the engine has already optimised for
// its shape costs more than the whole of the saving the fields were added for:
// measured, adding them lazily made the frame slower than not having them at
// all. Anything that puts a new sand plot together should declare them too.
// The yard floor. `n` is the live count of occupied cells, kept by `put` and
// repaired by `recount` after anything that writes the cells wholesale -- the
// same ledger the hole keeps, and watched by the same rule 7. It is here so that
// "how much dust is lying about" is a field read rather than a walk of a hundred
// and twenty thousand cells four times a second. See grid.js `put`.
export const floor = { x: 0, y: 0, cols: 0, rows: 90, p: P, grid: null, painter: null, n: 0, awake: null, awakeOf: null, awakeN: 0, awakeList: null };
export const school = { x: 0, y: 0, w: 0, h: 0 };
export const pit = { x: 0, y: 0, w: 0, h: 0, cols: 0, rows: 0, p: P, grid: null, painter: null, awake: null, awakeOf: null, awakeN: 0, awakeList: null };
// The sand in the quarry: dust that fell down the cut and has not been carried
// out of it yet. A plot like the pit's, and laid out the same way -- `y` is the
// ground line and the floor of the grid is the deepest the cut will ever be dug,
// so a column's cells run from the deepest line up to the rim.
//
// What a grain rests on is the ground nobody has taken out yet, and that is kept
// in the cells themselves as `ROCK_CELL` -- see config.js, and `layCut` in
// quarry.js. `rock` is how many of those there are, so "how much dust is lying
// down there" is `n - rock` and not a walk of the plot; it is kept level by the
// four places that lay or take out rock, and rule 7 in verify.js watches `n`.
// `fixed` is what stops a settling pass reading a piece of rock as a grain with
// somewhere to fall or slide -- see grid.js.
//
// Every field is declared here, including the four `awake*` ones that belong to
// `settle` and the ledger `n`, for the reason written out above `floor`: a grid
// object is read a hundred thousand times a frame and growing its shape after
// the fact costs more than the fields save.
export const cut = { x: 0, y: 0, cols: 0, rows: 0, p: P, grid: null, painter: null,
                     n: 0, rock: 0, blocked: null, ceiling: null, region: null, fixed: null,
                     repose: false, onPut: null, settleAt: 0,
                     awake: null, awakeOf: null, awakeN: 0, awakeList: null };
export const bench = { x: 0, y: 0, w: 0, h: 0 };
export const quarry = { x: 0, y: 0, w: 0, h: 0 };
export const farm = { x: 0, y: 0, w: 0, h: 0 };
export const lab = { x: 0, y: 0, w: 0, h: 0 };
export const casino = { x: 0, y: 0, w: 0, h: 0 };
// The scrubbing house: the one building whose job is to undo something the rest
// of the yard is doing.
export const scrub = { x: 0, y: 0, w: 0, h: 0 };
// The rift stands past the far wall of the hole -- a plot like any other, even
// though what it is is an absence. See src/rift.js.
export const rift = { x: 0, y: 0, w: 0, h: 0 };
// The tower: the far end of the walk, and the only thing a core buys.
export const tower = { x: 0, y: 0, w: 0, h: 0 };
// The outhouse, out among the rooms the crew live in.
export const outhouse = { x: 0, y: 0, w: 0, h: 0 };
// The ground the pot piles up on: a real plot of sand, like the yard and the
// hole, on the ground either side of the casino. A pot is grains, not a drawing
// of grains -- see casino.js.
export const table = { x: 0, y: 0, cols: 0, rows: 80, p: P, grid: null, painter: null, n: 0, awake: null, awakeOf: null, awakeN: 0, awakeList: null };
// The meteor: the one thing in this game that is not on the ground. `cells` is a
// disc of them -- rind and core -- and `n` is how many are left in it, which is
// what says whether there is still a meteor there at all. See meteor.js.
export const sky = { x: 0, y: 0, r: 0, cols: 0, rows: 0, p: P, cells: null, n: 0 };
