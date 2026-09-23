// Everything that changes while the game runs, in one place. Modules own
// behavior; this owns the facts, and config.js owns every number. The grids
// and the stations are objects mutated in place, so they are consts here
// rather than fields on S.

import { P, LOO_POSTS, APOTH_POTS0 } from './config.js';
import { JOB } from './jobs.js';

export const S = {
  // --- the window and the view ---
  W: 0, H: 0,             // the window, in screen pixels
  zoom: 1,                // shrinks to fit a small window, never rearranges
  dpr: 1,                 // device pixels per screen pixel
  viewW: 0, viewH: 0,     // what the window covers, in world units
  camX: 0, camY: 0,       // how far the view has been scrolled over the world
  camTo: null,            // somewhere the view is gliding to, or null
  // Where the view was left last time; read once, at boot (main.js). Null on
  // a game never played, which gets the opening view.
  camWas: null,
  follow: null,           // somebody the view is keeping up with, or null
  camLockY: null,         // and a height it is held at, for the opening only
  // A knock the view is still rocking through. Not part of the camera: it is
  // the ground moving under it, added at the last moment and clamped by
  // nothing.
  shake: 0,               // how much of a knock is left, in world pixels
  shakePh: 0,             // where in the rocking it is
  shakeX: 0, shakeY: 0,   // and what that comes to this frame
  worldW: 0, worldH: 0,   // the world is wider than the window; the pit runs off it

  // --- where things stand ---
  cx: 0, cy: 0,           // the middle of the rock
  groundY: 0,             // the ground line: everything stands on it
  placed: null,           // where each building was put, by key, and
  strips: null,           // the strips beside them -- `placeSites` in world.js, laid out again with the world

  // --- the rock ---
  boulder: [],            // rows of ints: 0 empty, else the rock still stacked there
  gw: 0, gh: 0,           // its size in cells
  rockTops: [],           // topmost rock cell per column, for the crew to stand on
  rockSand: null,         // and what is lying on top of it: a stack of shades per column
  tick: 0,                // frames, for the things not worth doing in all of them
  floorGrains: 0,         // dust lying about the yard, counted now and then
  floorMarks: [],         // and where anything in it that is not dust has come to rest
  // Every station piles to its right, into a strip of its own, worked out
  // when the world is laid out; what lies in each is counted twice a second.
  piles: [],              // each station's strip: { key, from, to }
  pileCount: {},          // what is lying in each of them
  pileFull: {},           // and which of them have stopped their station
  // --- the story (beats.js), and the one under the rock (intro.js) ---
  // The beat running now, by what it owns: the yard (the opening, the
  // reunion, the rescue), the camera (the cutscenes) or the sheet (the
  // ending). A key of `BEATS`, or null.
  beat: { yard: null, camera: null, sheet: null },
  beatsDone: [],          // the keys that have played, each once and never again
  // A scene owns the yard: no rock rolls in on its own until the scene drops
  // it. A fact rather than a call into intro.js, so rock.js and core.js can
  // ask without knowing that scenes exist.
  sceneHolds: false,
  introAt: 0,
  introHeart: 0,          // when the opening's heart last beat (intro.js)
  introSaid: 0,
  pair: [],               // the two of them, before the rock
  buried: false,          // somebody is under it, and still alive
  rescued: false,         // and, once the dome held one off them, they got out
  rescueTo: 0,            // where they are walking to while they do
  buriedSay: null,
  buriedSayAt: 0,
  // How far out of the ground it has been dug, nought to one; every rock that
  // lands puts it back to nought.
  buriedDug: 0,
  // How long they have been under, in ms: from the first rock until they
  // walk out, so after the rescue it is the time the story took.
  buriedMs: 0,
  // The board of times (times.js): the server's name for this run, given at
  // the first rock and kept with the yard, and a rescue's post that could
  // not go out yet -- `{ ms, name }` until the next boot with a network.
  runId: null,
  timePending: null,
  timesAsked: 0,          // which of the two the board has been asked this boot
  boulderNo: 1,           // how many rocks in; each one is bigger than the last
  coreBuried: true,       // this rock still has its core inside it
  rockFall: 0,            // world pixels a new rock still has to come down
  landAt: 0,              // when the last one hit, for the spread it does on arriving
  rockFallV: 0,           // how fast it is coming
  // --- the shields (shield.js) ---
  shield: null,           // { kind, x, w, h, laid, caught } while standing; null otherwise
  shieldsDone: [],        // the kinds already raised and answered; a kind is offered once
  // Something is holding the rock up. A fact rather than a call into
  // shield.js, so rock.js can ask without knowing that shields exist.
  rockHeld: false,
  danceUntil: 0,          // the crew are celebrating the last one until this moment
  nextBoulderAt: 0,       // backstop, in case a core never falls clear
  peakRow: 0,             // the highest standing rock, recomputed each frame

  // --- dust in the air and on the cursor ---
  chips: [],              // knocked loose, still flying
  belt: [],               // on the belt's scoop, climbing from the ground to the band
  beltRun: 0,             // how far the band has run since it last shifted its load a cell
  paid: [],               // flying out of the pit to the bench, on the way to being spent
  gulped: [],             // and out of the pit into the abyss, diving to its surface
  ripples: [],            // where the liquid just ate one: { x, at }, briefly drawn
  motes: [],              // the load drifting round the cursor
  trail: [],              // recent cursor positions, for the throw
  held: 0,                // how much dust is on the cursor

  // --- the hole ---
  stored: 0,              // dust in the hole: the whole point
  banked: 0,              // and every grain ever put in it, which only goes up
  shownStored: 0,         // the counter chases the real number (see tween.js)

  // --- the rift (DESIGN.md, "The rift") ---
  // Dust that is not here: everything banked past what the hole holds.
  // `stored` is still all the dust you own (`inHole` in pit.js).
  seenFullPit: false,     // the hole has turned a grain away at least once
  riftOpen: false,        // the rift has torn: the account is live
  rift: 0,                // and how many grains of dust are through it
  riftLevel: 0,           // how fast it swallows: an endless ladder, not a capacity
  // Every grain the rift has ever swallowed, monotonic: spending reads
  // `riftHeld` and never shrinks this. The disc's size derives from it
  // (`riftCells` in rift.js), and at ABYSS_AT the hole gives way: `drowned`
  // is the era after.
  riftAte: 0,
  drowned: false,
  // The camera's shot of the beat running now, or null: { name, at, s,
  // zoom }. Never saved; the beat's name is (`beat`), and a reload takes the
  // shot again over the event as it now stands (cutscene.js).
  shot: null,
  // The tearing while it happens: seconds of the gulp left, and a knock
  // waiting to be spent on the view. Neither is saved; an event is a moment,
  // not a state.
  riftGulp: 0,
  riftShake: 0,
  // What is through it that is not dust, by kind, because the pile shows each
  // counter *less* what is through (`seedPitCores` in pit.js).
  riftHeld: { cores: 0, shards: 0, spores: 0, sparks: 0 },
  hideDone: false,        // whether finished ladders are folded off the boards

  // --- cores ---
  cores: 0,
  seenCore: false,        // nothing about cores is shown until one is banked
  coreItem: null,         // a core loose in the world
  heldCore: false,        // carrying one on the cursor
  coreTaker: null,        // the worker that has claimed a loose one

  // --- what you have bought ---
  // The kit each station owns; whoever is standing there wears it
  // (upgrades/rows-kit.js).
  breakers: 0,            // helmets the rock owns
  carters: 0,             // carts the lip owns
  drivers: 0,             // and forklifts: engines under some of those carts
  growers: 0,             // brims the plots own
  blasters: 0,            // lamps the cut owns

  carryLevel: 0,
  speedLevel: 0,
  pickLevel: 0,
  autoMine: false,
  autoToss: false,        // a held sweep throws at the hole by itself
  tossSpeedLevel: 0,      // and how often, and how far (config/rungs.js)
  tossReachLevel: 0,

  // --- crits ---
  // Two ladders for the whole yard, not a station apiece: how often a unit of
  // work counts for several, and how many it counts for.
  critChanceLevel: 0,
  critMultLevel: 0,

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

  // --- what the yard is in the middle of building (works.js) ---
  // One work per site, and it only moves while somebody is standing there.
  works: {},              // site -> { key, done, of, at } in worker-seconds
  builders: 0,            // spare hands putting up whatever the yard is building
  lent: [],               // and the jobs a body was borrowed from to be one, to give back

  // The order the yard's own buildings went up in, by site key. `placeSites`
  // walks this before the fixed table, so a save that broke the ground for
  // the farm first sees the farm nearer the rock. Empty means the fixed order.
  buildOrder: [],

  smoke: [],              // puffs off the chimney while it is being worked
  grit: [],               // chips off a hammer at a building site
  // What a crit left in the air: the ring going out, and the specks the blow
  // threw. Neither is dust and neither is counted (shock.js).
  shocks: [],
  shockMotes: [],
  smokeAt: 0,
  houseSmokeAt: 0,      // and when the crew's own chimney last had a puff
  shutters: [],         // rooms with the curtain across, by room number
  shutterAt: 0,         // when the next one of them changes its mind
  shutterN: 0,          // how many have, which is what picks the next
  skyShown: false,        // the thing in the sky, drawn even before the tower calls one down

  // --- the meteor and the wizards ---
  // A wizard is a hat like any other, except that this is the one job nobody
  // can do bare-headed.
  meteorOpen: false,      // the tower has called one down at least once
  summon: 0,              // how far along the ring is with making the next one, 0..1
  flashAt: 0,             // when the last one went off, for the breath the sky keeps it
  sparks: 0,              // the red out of the core, banked
  seenSpark: false,       // and whether one has ever come down
  wizardHats: 0,          // hats the tower has finished
  wizards: 0,             // bodies up there wearing one

  // --- the casino ---
  // One hopper, one pot. `pot` is null until something is staked: `stake`
  // is the pebbles held for, `n` those landed and spent, `owed` what the
  // purse has still to pay (`where` is always the hopper now; it stays for
  // the saves that wrote it).
  casinoOpen: false,
  pot: null,              // { cur, stake, n, owed, where } -- the stake in the funnel: poured, landed, still to spend
  // The arm is held: the stake is pouring, whole pebbles as the fraction
  // adds up (`stepHold` in casino.js).
  holding: false,
  throttle: 0,            // how far the held arm is pulled (down, toward 1) or pushed (up, toward -1)
  pourAcc: 0,
  pourAt: 0,              // the rate a full pull pours at, read off the purse when the arm was pressed
  // The stake is still raining into the funnel. Nothing can be dropped until
  // the heap has stopped moving. See `pouring` in casino.js.
  pouring: false,
  tableAir: [],           // the casino's grains in the air: arriving, leaving, or on their way out of the foot
  paying: null,           // { left: { dust, spore, shard, spark }, grains } -- a paid hand on its way out of the foot
  trayOwed: { dust: 0, spore: 0, shard: 0, spark: 0 },   // what the tray's cells stand for, a kind at a time, spent as they leave
  trayCells: { dust: 0, spore: 0, shard: 0, spark: 0 },  // how many of the tray's cells are each kind, so each carries its share
  trayAt: 0,              // when the last grain of the pay landed in the tray: it stands a beat after
  trayAcc: 0,             // the tray's pace out, in fractions of a grain
  readyAt: 0,             // when the sign went ready: it holds the count a beat before DROP IT
  // The hand under way: the gate open, the grains on the pegs, the bins filling,
  // then the bins paying out of the foot. Null when nothing is falling. A path in
  // flight is ephemeral -- a reload comes back a pot in the hopper with the
  // sign live again. See `openGate` in casino.js.
  drop: null,             // { at, sent, grains, bins, stage, ... }
  // The machine selling itself: one grain ticking down the pegs with nothing
  // riding on it, every so often, while nobody is at the table.
  attract: null,          // { grain, next }
  // The arm just let go, for its swing back up; and the sign just tapped,
  // for its press-down.
  leverPulled: null,      // { key, at }
  signPressed: 0,
  // What the machine is flashing right now: a peg lit on the beat, a divider
  // lit for a x39 or a near miss, the sign on a strobe for a x39.
  tableFx: { pegs: [], edge: null, strobeAt: 0 },
  // The hand that just settled, kept for a few seconds so a board you were not
  // watching still tells you how it went.
  hand: null,             // { won, mult, n, cur, at, bursts, edge }
  labBoardOpen: false,
  // A finished work nobody has been to see yet, per site: the key of what
  // landed, kept until that station's board is read (drawDoneMarks).
  siteDone: {},
  // --- the crew ---
  // One pool of bodies, hired once and put wherever you like. A job is a
  // count; `haulers` is always the ones left over, never a job you hire into.
  workers: [],            // little squares that mine and ferry dust
  lifts: [],              // the forklifts: not crew, they haul by themselves (crew/lifts.js)
  crew: 0,                // bodies hired, all told
  rockhands: 0, rockhandSpeedLevel: 0, rockhandPickLevel: 0,
  haulers: 0, haulCarryLevel: 0, haulPaceLevel: 0,    // haulers: whatever is spare
  liftLoadLevel: 0, liftPaceLevel: 0,                  // the forklifts' own two ladders
  quarriers: 0, quarryPaceLevel: 0, seamLevel: 0,
  // How many cells deep each column of the quarry has been dug; the quarry is
  // what has been taken out (quarry.js).
  quarryCells: null,
  // What the seam still owes once somebody has broken through: it belongs to
  // the hole, so a gang at the bottom shares one handful between them.
  quarryOwed: 0,
  // Cells taken out of the quarry, ever; only goes up, where the share dug
  // runs round with each payout.
  quarryTotal: 0,
  // The machines, keyed; see machines.js for the shape.
  machines: null,
  // A machine whose lever has just been thrown wants its gang back, and that
  // cannot happen inside the worker pass (`syncWorkers` replaces `S.workers`
  // while the pass is iterating it), so the arrival sets this and the frame
  // drains it afterwards (game.js).
  restaff: null,
  // The seam is out and everybody is on their way up; nobody goes back down
  // until the last one is out and the quarry has fallen in.
  quarrySpent: false,
  // How much quicker the lab's own bench is, and whether a second one has
  // been built.
  labKitLevel: 0,
  labRooms: 1,
  // Where the tiller has got to on its run up the row and back, 0..2;
  // everything about the machine is read off it.
  tillerAt: 0,
  // How much harder the air filter pulls.
  powerLevel: 0,
  balloonSpeedLevel: 0,   // and how fast they go from one cloud to the next
  // The tower's enchantments laid on the yard: a set of keys, on or not.
  // True for the few lines a machine is driving a station's own code: the
  // station does not foul where the work happened, the machine's stack does
  // (`foul`).
  machineWorking: false,
  spells: [],
  // How often a wizard throws, and how much of the star comes off when it
  // lands.
  wizSpeedLevel: 0,
  wizPowerLevel: 0,
  spherePour: 0,          // how much of the sphere's shell is poured, 0..1 (sphere.js)
  // There is no lab, and nobody is ever a scholar again; the count stays on
  // the roster (staffing.js) at nought so `spareHands` adds up.
  scholars: 0,
  farmhands: 0, tendLevel: 0, cropLevel: 0,

  // --- the apothecary (apothecary.js; DESIGN.md, "The apothecary") ---
  // A pot brews its tonic again and again while it has crop and a stirrer: an
  // upkeep, not a timer.
  apothecaryOpen: false,  // the building is up
  stirrers: 0,            // and this many bodies are stirring pots in it
  apothPots: APOTH_POTS0, // standing room for stirrers and tonics up at once
  apothBoardOpen: false,  // its board is open
  potKeep: true,          // keep brewing (an upkeep) or a one-off (a single batch)
  potPrefers: [],         // the job each pot's doses go to first, by pot index, or null for whoever is nearest
  brewAt: [],             // worker-milliseconds into the current batch, per pot
  // What each lit batch was paid for, by pot: a batch belongs to the tonic it
  // was bought as, not to whatever the pot is set to when it lands
  // (`stepApothecary`).
  brewKeys: [],
  // Batches ever landed; the building's deeper rows reveal against this.
  brews: 0,
  lengthLevel: 0,         // buff length: how long a dose lasts on the body
  dosesLevel: 0,          // doses a brew: how many bodies one batch reaches

  // The per-pot fields.
  potTonics: [],          // the tonic each pot is set to, by pot index, or null for off
  potSpents: [],          // and whether that pot's one-off batch has been put up
  shelf: {},              // doses in stock on the bookshelf, by tonic key
  potency: {},            // how far each tonic's own strength ladder has climbed

  // --- what you are doing right now ---
  mouse: { x: 0, y: 0 },
  mining: false,
  paused: false,          // the whole yard held still, on the space bar
  houseBoardOpen: false,  // and the block, with what you can put up on it
  modal: null,            // which window is open over the yard, by kind (modal.js), or none
  quarryBoardOpen: false,
  farmBoardOpen: false,
  shackOpen: false,       // the gang has a hut, and the rock has a board
  shackBoardOpen: false,  // and whether it is open right now
  outhouseOpen: false,    // there is somewhere to go
  looPosts: LOO_POSTS,    // how many caps the outhouse's stand has; `loopost` sells the second
  towerOpen: false,       // the tower is up
  towerBoardOpen: false,
  filterBoardOpen: false,
  // The books over the pit: the one board that belongs to no building.
  statsBoardOpen: false,
  booksOver: 60,          // the seconds the books average over (STATS_OVER_S)
  earnedTotal: {},        // every coin that came in as income, by coin, refunds kept out (income.js)
  // --- the record (notices.js) ---
  // Recognition only: nothing in here feeds a rate.
  won: [],                // the notices earned, in the order they landed
  wonAt: {},              // and when each one did, so the sheet reads newest first
  wonSeq: 0,              // the stamp the last one took; `wonAt` holds one per notice
  wonSeen: 0,             // how many have been looked at; the rest are unread
  wonShown: 0,            // the last one the toast has said (toast.js); not saved
  // What a notice needs remembered that the yard does not already know; one
  // object, written only by notices.js.
  tally: {},
  looBoardOpen: false,      // and the outhouse's, which carries the janitor's ladder

  // --- the air ----------------------------------------------------------------
  haze: 0,                // motes in the sky, waiting to come back down
  raining: false,         // and whether it is coming back down right now
  rainFor: 0,             // seconds into this shower, which is how hard it is coming down
  bolt: null,             // a strike in the sky: its cells and how long it has left, or null
  // The storm's front: the clock rolls a brew-up, not a shower.
  stormFor: -1,           // seconds since the roll, or -1 for no storm on the way
  rainDue: -1,            // seconds until the next front is rolled; -1 until the yard sets it
  stormHeft: 1,           // how big the front on the way (or pouring) is, 0..1
  stormLeft: 0,           // marked motes still to fall in this shower
  rains: 0,               // how many times they have
  filterOpen: false,       // the house is built
  purifiers: 0,           // and this many bodies are in it
  janitors: 0,            // and how many are shovelling up after everybody
  seenMess: false,        // and whether the yard has ever been left in a state
  introThrew: 0,          // when the opening's one throw was let go of
  // Skipping (skip.js): when the space bar went down, or 0; and whether the
  // scene running was cut short, so a rescue cut mid-walk finishes its walk
  // without its ceremony.
  skipHeldAt: 0,
  introCut: false,
  recycler: false,        // which keep what they catch rather than binning it
  filterBank: 0,           // part of a grain, on its way to being a whole one
  filterMuck: 0,           // and part of a clod of muck, on its way out of the spout
  dialAt: 0,              // what the filter's dial reads, eased toward the sky
  dialStep: 0,            // and the line of cells its needle is drawn on
  recycled: 0,            // and how many whole ones it has given back
  seenAir: false,         // the lab has been told to watch the sky

  // What came down and has not been cleared, one depth per column of the
  // world; what is buried, in the way and there to shift are all read off it.
  muck: [],
  poop: [],               // what `muck` was before it had kinds; the save still carries it, nothing reads it
  dragging: false,
  nextHit: 0,
  nextToss: 0,            // when a held sweep next lets its handful go
  seenBench: false,       // the bench has been earned and stays from then on
  seenDrag: false,        // you have swept dust up by hand, so the row about it shows
  seenSects: [],          // headings that were on the board last time it was open
  seenRows: [],           // and the rows themselves, so a new one can say so
  // Rows whose reveal has fired. Revealing is one-way: a door that appeared
  // because you were nearly rich enough does not go away when you spend
  // (`revealed` in shop.js).
  shownRows: [],
  // The card pinned to the corner of the game: a row's key, or null (`fillPin`
  // in shop.js).
  pinned: null,
  boardOpen: false,       // the workbench board is showing
  resetArmed: 0,          // the reset button wants a second click

  // --- housekeeping ---
  // The seed this run was started from: drawn by `reset` in persist.js, saved
  // with the yard. The chance itself is in rng.js.
  runSeed: 0,
  // The sim changed what a board sells: the frame rebuilds every board once,
  // after `step` (main.js), and the hooks rebuild before a check reads one.
  shopStale: false,
  fatal: '',              // the game has stopped on a throw; nothing is written after it
  unsaved: false,         // the store refused the last write; the sheet says so
  yielded: false,         // another tab is writing this save; this page has stopped
  broken: false,          // a save that would not read was put aside at boot
  staged: false,          // stood at a scene, the player's save kept aside (scenesheet.js)
  build: null,            // { hash, date } of the build that wrote this save; null for a yard with no save behind it
  savedAt: null,          // when the save this yard was read out of was written; null for a yard with none
  fellBack: false,        // the desk's current save would not read; this is the one before it
  newerSave: null,        // the date of a save written by a build newer than this one, until the sheet has said so
  lastFrame: 0,         // for the length of the last frame
  settleAt: 0,            // the column the pit settler got to last frame

  // --- the deep: the serpent's half (docs/wave-serpent.md) ------------------
  // Which half the player is looking at. The renderer's and the pointer's
  // alone: nothing in the sim branches on it.
  view: 'yard',
  viewFade: 0,            // the glide between the two, 0..1 (view.js)
  viewTo: null,           // the half the glide is going to, or null
  // The serpent. `snatched` is the sqhusband taken; the stage is which of the
  // four defenses is up (4 once the belly is open); the wound is held open
  // against the stage's heal and breaks it at the stage's depth.
  snatched: false,
  serpentStage: 0,
  serpentWound: 0,
  serpentFreed: false,
  snatch: null,           // the snatch beat's own state while it plays (snatch.js)
  // The deep's coin: every scale crushed and not yet spent (the crusher is the
  // purse; the floor's loose scales are `deepBed`), and whether one ever has.
  scales: 0,
  seenScale: false,
  // The deep's doors.
  wellOpen: false, fontOpen: false, circleOpen: false, spireOpen: false, starOpen: false,
  // The deep's jobs: bodies of the yard's crew, gone down the shaft.
  brawlers: 0, lancers: 0, grenadiers: 0, scribes: 0, warlocks: 0, gatherers: 0,
  // The deep's ladders (LADDERS in config/rungs.js) and the star's spark rungs.
  punchLevel: 0, brawlLevel: 0, lanceLevel: 0, lanceholdLevel: 0, grenadeLevel: 0,
  grenadepaceLevel: 0, sigilLevel: 0, beamLevel: 0, curseLevel: 0, starLevel: 0,
  gatherBare: 0,          // seconds the deep's floor has lain bare, for the gatherers going home
  crushAt: 0,             // when a scale last went into the crusher, for its rollers
  heldScales: 0,          // scales in the hand, scooped off the deep's floor
  sigils: [],             // the circles drawn on the floor: { x }, each held until the stage it was drawn for breaks
  // In the water, and so this session's: a reload finds them landed or gone.
  sinking: [],            // scales falling to the floor: { x, y, vx, vy, s }
  lifting: [],            // scales paid, rising off the bed to the station that took them
  lances: [],             // a lance thrown or stuck: { x, y, at, seg, until }
  grenades: [],           // a grenade in the water: { x, y, vx, vy }
  rings: [],              // a burst's rings: { x, y, at }
  beams: [],              // a wizard's beam, this frame: { x, y, seg }
  starFall: null,         // the called star on its way: { x, y, at }
  deepMotes: [],          // silt and flecks hanging in the water (drawn only)
  starAt: 0,              // when the next star is called
  altarBoardOpen: false, wellBoardOpen: false, fontBoardOpen: false,
  circleBoardOpen: false, spireBoardOpen: false,

  noticeboard: { x: 0, y: 0, w: 0, h: 0 }  // the record, on its posts (reseated at boot)
};

// The yard as it is written above, kept. `seedGame` in hooks.js puts every
// field back to this before it clears the yard: `reset` names its fields by
// hand and a field it forgets carries a stamp from the last game, and on a
// run started again from a seed that stamp is a whole run in the future, so
// two runs of one seed part company on their first frame.
export const BLANK = JSON.parse(JSON.stringify(S));

// --- what survives a reload -------------------------------------------------
//
// Which of the facts above are the player's, and which are only this
// session's. A field in none of the three lists is a red test
// (`test/persist-roundtrip`) rather than lost data.
//
// `SAVED` is the plain part: written straight out and read straight back by
// one loop in persist.js, against `BLANK` for what a missing key means.
export const SAVED = [
  'stored',               // dust in the hole: the whole point
  'carryLevel',
  'speedLevel',
  'autoMine',
  'autoToss', 'tossSpeedLevel', 'tossReachLevel',
  'cores',
  'seenBench', 'seenDrag',
  'seenSects',
  'seenRows',
  'shownRows',
  'pinned',
  // What is *through* the rift (`rift`, `riftHeld`) is clamped on the way in
  // and so is hand-read (persist.js).
  'seenFullPit',
  'riftOpen',
  'riftLevel',
  'hideDone',
  'booksOver',
  'earnedTotal',
  'pickLevel',
  'critChanceLevel',
  'critMultLevel',
  // The kit each station owns.
  'breakers',
  'carters',
  'drivers',
  'blasters',
  'growers',
  'haulCarryLevel',
  'haulPaceLevel',
  'liftLoadLevel',
  'liftPaceLevel',
  'brews',
  'shards',
  'spores',
  'farmOpen',
  JOB.FARM,
  // A work that finished while you were away is still news when you come
  // back.
  'siteDone',
  'tendLevel',
  'cropLevel',            // and what one cut off a plot is worth
  // A plain number, so it belongs here and not on the by-hand list, where a
  // name is only checked for being a field, never for being written.
  'seamLevel',
  // The apothecary.
  'apothecaryOpen',
  JOB.STIR,
  'apothPots',
  'potKeep',
  'brewAt',
  'brewKeys',
  'lengthLevel',
  'dosesLevel',
  // The pots' own settings, the stock on the bookshelf, and the ladders.
  'potTonics',
  'potSpents',
  'potPrefers',
  'shelf',
  'potency',
  'casinoOpen',
  'filterOpen',
  'towerOpen',
  'outhouseOpen',
  'shackOpen',
  'labKitLevel',
  'powerLevel',
  'balloonSpeedLevel',
  'spells',
  'wizSpeedLevel',
  'wizPowerLevel',
  'spherePour',
  'labRooms',
  // What is left of the meteor is cells, so it is hand-written.
  'meteorOpen',
  'sparks',
  // A hat on the bench has been paid for.
  'wizardHats',
  JOB.JANITOR,
  'seenMess',
  'recycler',
  'seenAir',
  'rains',
  // The weather in flight, or a refresh mid-storm clears the sky. The bolt is
  // a flash and stays ephemeral; the sky's motes are re-marked as this
  // storm's on the way in.
  'raining', 'rainFor', 'stormFor', 'rainDue', 'stormHeft', 'stormLeft',
  // A rock on its way down, or a refresh under a falling rock lands it at
  // once.
  'rockFall', 'rockFallV',
  'quarryTotal',
  'recycled',
  'muck',                 // what came down and has not been cleared
  // Reseated by the layout at boot; saved so the roundtrip test sees it.
  'noticeboard',
  // Derived by `rebalance` and re-derived on restore; saved like every other
  // job count so the roundtrip is honest.
  JOB.BUILD,
  // The record. `tally` is saved because who bit a rock half-mined when you
  // closed the tab is the whole question two of the feats ask.
  'won',
  'wonAt',
  'wonSeq',               // the order notices landed in, which the clock could not keep across a reload
  'wonSeen',
  'tally',
  // The story's progress: which beats have played. An old save's flags fold
  // into it on the way in (persist.js).
  'beatsDone',
  // A reload carries the clock on rather than starting it over.
  'buriedMs',
  // The run is the yard's, not the browser's: an exported save carries it.
  'runId', 'timePending',
  // The counts, the flags and the ladders that were once read by hand for a
  // rename or a guess; above the save floor every one of them is a plain
  // copy.
  'banked',               // every grain ever put in the hole
  'crew',                 // bodies hired, all told; `haulers` is derived from it
  JOB.ROCK, JOB.QUARRY, JOB.PURIFY, JOB.SCHOLAR,
  'rockhandSpeedLevel', 'rockhandPickLevel',
  'quarryOpen', 'quarryPaceLevel', 'benchLevel', 'plotLevel',
  'quarryOwed',           // how much of the seam is still in the cut; goes with `quarryCells`
  'seenCore', 'seenShard', 'seenSpore', 'seenSpark',
  'looPosts',
  'coreBuried',           // whether this rock still owes you its core
  'riftAte', 'drowned',   // every grain the rift ever swallowed, and whether the hole gave way
  // The deep (docs/wave-serpent.md).
  'view', 'snatched', 'serpentStage', 'serpentWound', 'serpentFreed', 'scales', 'seenScale',
  'wellOpen', 'fontOpen', 'circleOpen', 'spireOpen', 'starOpen',
  'brawlers', 'lancers', 'grenadiers', 'scribes', 'warlocks', 'gatherers',
  'punchLevel', 'brawlLevel', 'lanceLevel', 'lanceholdLevel', 'grenadeLevel',
  'grenadepaceLevel', 'sigilLevel', 'beamLevel', 'curseLevel', 'starLevel', 'sigils', 'starAt',
];

// Fields whose encode or decode is more than a copy: a run-length string, a
// clamp against another counter, a job renamed since the save was written.
// Each is written and read by its owner's `SAVE` (the shield's in shield.js,
// the machines' in machines.js), listed in `SAVERS` in persist.js in the
// order the yard is read back; every name here is in exactly one saver's
// `fields` (test/persist-roundtrip.test.mjs). The last six are not fields on
// `S`: the grids and the sky are module consts, the chance is rng.js's and
// the craft balloon.js's; they are named so the list reads as everything a
// save carries that is not a plain copy.
export const SAVED_BY_HAND = [
  'runSeed',              // the run's name, and the stream it is partway through
  'camX',                 // rounded out, and read back once, into `camWas`
  'coreItem',             // a core loose in the world: a spot, or the fact of one
  'workers',              // saved as `who`: a name and a record apiece, not four counts
  'lifts',                // saved by crew/lifts.js: where each is and what is on its forks
  'mouth',                // where the cut's mouth was under them; not a field on S, read by `restoreCrew`
  'skyKinds',             // what the haze is made of, by kind; not a field on S, read by `skyFromSave`
  'drops',                // and the rain in the air, [x, y, vy] a drop; the same
  'puffs',                // and the plume still climbing, a speck a row; the same
  'clods',                // and the filter's loads falling off its spout; the same
  // Moments on the clock, written as how far off they are (`danceLeft`,
  // `nextBoulderIn`).
  'danceUntil', 'nextBoulderAt',
  'quarryCells',          // how deep each column has been dug
  // Only the camera's is written: a scene cut short by a reload replays over
  // the event as it now stands, while the yard's beats come back by their
  // own triggers and the sheet by its fact.
  'beat',
  'buried',
  'machines',             // facts only: bought, driven, tuned, took the kit
  'summon',               // three places, and only meaningful once the tower is open
  JOB.WIZARD,              // never more bodies up there than there are hats
  'works',                // what the yard is part way through building, per site
  'buildOrder',           // and the order its buildings went up in
  'belt',                 // what is riding the belt, on the band or the scoop, as [x, shade] pairs
  'chips',                // and every grain in the air, as [x, y, vx, vy, shade, land]
  'lent',                 // the jobs the builders were borrowed from
  'haze',                 // rounded: a fraction of a mote is not worth the characters
  'rockSand',             // what is lying on the rock, a column at a time
  'pot',                  // the casino: what is on the table, and which plot it stands in...
  'pouring',              // ...whether its stake is still raining down...
  'paying',               // ...and what a paid hand still owes the ground
  'plots',                // how far along each plot is, as hundredths
  'plotTone',             // and the spore standing ripe on it
  'boulder',              // the rock, as a run-length string...
  'gw', 'gh',             // ...and the shape that string is read against
  'boulderNo',
  'rift',                 // dust through the rift, clamped to the counter it came out of
  'riftHeld',             // and the finds through it, each clamped the same way
  // Written and never read back: haulers are whoever is spare, and
  // `rebalance` works the number out again. It stays in the file because a
  // save is also the thing a bug report arrives as.
  JOB.HAUL,
  // Saved and restored, nothing reads it; a leftover the format still carries.
  'poop',
  // --- the shields, and getting out from under the rock ---------------------
  // The standing shield is serialized field by field (the live one carries
  // more than a save should), `shieldsDone` is guarded back into an array,
  // and `rescued` is coerced and then used to settle `buried`.
  'shield',
  'shieldsDone',
  'rescued',
  // Which build wrote the save: the page's own stamp on the way out, read
  // back into `S.build` (the version boundary in persist.js), and the save
  // floor (save.js). `saveV` beside it is the shape number the migrations
  // read (src/migrations/); neither is a field on S.
  'build', 'saveV',
  // When it was written, for the saves page's "5 days ago" (slots.js).
  'savedAt',
  // Not fields on S: the grids, the sky, the chance and the craft.
  'floor', 'pit', 'cut', 'meteorCells', 'rngState', 'craft',
  'deepBed',              // the scales on the deep's floor, a plot like the pit (deep/scales.js)
];

// And everything else: this session's own, deliberately thrown away on a
// reload. A moment rather than a fact (the tearing of the rift, a shower, a
// hand on the pegs), something worked out again on the way in (the layout, the rock tops,
// what is lying in each pile), or something in flight that a reload has no
// beginning for. Named rather than assumed, so that adding a field and not
// thinking about it is a failing test.
export const EPHEMERAL = [
  // What the store said about this page (persist.js, save.js).
  'unsaved', 'yielded', 'broken',
  'fellBack', 'newerSave',
  'staged',
  'beltRun',              // the band's run since its load last shifted: under a cell
  // The window and the view, all measured at boot.
  'W', 'H', 'zoom', 'dpr', 'viewW', 'viewH', 'camY', 'camTo', 'camWas',
  'follow', 'camLockY', 'shake', 'shakePh', 'shakeX', 'shakeY',
  'worldW', 'worldH', 'cx', 'cy', 'groundY',
  // Read off the rock and the ground again every frame, or every survey.
  'rockTops', 'tick', 'floorGrains', 'floorMarks', 'piles', 'pileCount', 'pileFull',
  'peakRow',
  // The opening, while it is running.
  'sceneHolds', 'introAt', 'introSaid', 'pair', 'buriedSay', 'buriedSayAt',
  'introThrew', 'skipHeldAt', 'introCut',
  'timesAsked',           // once a boot is once a page
  // Only read for the spread a rock does on arriving.
  'landAt',
  // Worked out again from the shield that is standing.
  'rockHeld',
  // `rescued` is the fact and is saved; this is the walk.
  'rescueTo',
  // A grain mid-flight has no beginning to come back to.
  'paid', 'gulped', 'ripples', 'motes', 'trail', 'held',
  'shownStored',
  // What was earned before this sitting is on the sheet, not in the air.
  'wonShown',
  // The tearing of the rift is an event, and the cutscene watching it a
  // camera.
  'riftGulp', 'riftShake', 'shot',
  'heldCore', 'coreTaker',
  'smoke', 'grit', 'smokeAt', 'houseSmokeAt', 'shutters', 'shutterAt', 'shutterN',
  'shocks', 'shockMotes',
  'skyShown', 'flashAt',
  // the stake still in the air, a hand on the pegs, the tray on its way back up,
  // the demonstration grain, what the machine is flashing, and a hand that
  // settled before you closed the tab: a reload comes back a pot in its plot
  // with the decision open again
  'tableAir', 'hand', 'drop', 'attract', 'tableFx', 'leverPulled', 'signPressed', 'holding', 'throttle', 'pourAcc', 'pourAt',
  // the tray's sand is never saved, so its ledger is not either: a save
  // writes what the tray holds as `paying` (persist.js, `payingOwed`)
  'trayOwed', 'trayCells', 'trayAt', 'trayAcc', 'readyAt',
  // Which boards are open, and what the pointer is doing.
  'boardOpen', 'apothBoardOpen', 'labBoardOpen',
  'houseBoardOpen', 'modal', 'quarryBoardOpen', 'farmBoardOpen',
  'towerBoardOpen', 'filterBoardOpen', 'mouse', 'mining', 'paused', 'dragging',
  'statsBoardOpen', 'looBoardOpen',
  'shackBoardOpen',
  'nextHit', 'nextToss', 'resetArmed',
  // Worked out again from the counts, or only true for a few lines of a frame.
  'restaff', 'quarrySpent', 'machineWorking', 'tillerAt',
  // The weather, and the part-grain the house is partway through.
  'bolt', 'filterBank', 'filterMuck', 'dialAt', 'dialStep',
  'placed', 'strips', 'introHeart',
  'shopStale', 'fatal', 'lastFrame', 'settleAt',
  // A reload finds the one under the rock packed in, the way every rock
  // leaves it.
  'buriedDug',
  // The deep's glide, the snatch mid-play, and everything in its water.
  'viewFade', 'viewTo', 'snatch', 'sinking', 'lifting', 'lances', 'grenades', 'rings', 'beams',
  'starFall', 'deepMotes', 'crushAt', 'heldScales', 'gatherBare',
  'altarBoardOpen', 'wellBoardOpen', 'fontBoardOpen', 'circleBoardOpen', 'spireBoardOpen',
];

// The sand grids, mutated in place and never reassigned. `p` is the size of
// one grain in that grid.
//
// Every field is declared here, including the `awake*` ones that belong to
// `settle` (grid.js), rather than added when first needed: a grid object is
// read a hundred thousand times a frame, and growing its shape after the
// engine has optimized for it measured slower than not having the fields at
// all. Anything that puts a new sand plot together should declare them too.
// `n` is the live count of occupied cells, kept by `put`, repaired by
// `recount` after anything that writes the cells wholesale, and watched by
// rule 7 in verify.js.
export const floor = { x: 0, y: 0, cols: 0, rows: 90, p: P, grid: null, painter: null, n: 0, awake: null, awakeOf: null, awakeN: 0, awakeList: null };
// The deep's floor: the scales lying on it, a plot of sand like the pit's,
// laid under the deep by `wireBed` in deep/scales.js. Every cell is a scale.
export const deepBed = { x: 0, y: 0, cols: 0, rows: 0, p: P, grid: null, painter: null, n: 0, awake: null, awakeOf: null, awakeN: 0, awakeList: null };
export const pit = { x: 0, y: 0, w: 0, h: 0, cols: 0, rows: 0, p: P, grid: null, painter: null, awake: null, awakeOf: null, awakeN: 0, awakeList: null };
// The sand in the quarry: `y` is the ground line and the floor of the grid is
// the deepest the cut will ever be dug. The ground nobody has taken out yet
// is kept in the cells as `ROCK_CELL` (`layCut` in quarry.js); `rock` is how
// many of those there are, so the dust down there is `n - rock`. `fixed`
// stops a settling pass reading a piece of rock as a grain with somewhere to
// fall (grid.js).
export const cut = { x: 0, y: 0, cols: 0, rows: 0, p: P, grid: null, painter: null,
                     n: 0, rock: 0, blocked: null, ceiling: null, region: null, fixed: null,
                     repose: false, onPut: null, settleAt: 0,
                     awake: null, awakeOf: null, awakeN: 0, awakeList: null };
// The rockhands' shack, off the rock's left flank (DESIGN.md, "The shack at
// the rock").
export const shack = { x: 0, y: 0, w: 0, h: 0 };
export const bench = { x: 0, y: 0, w: 0, h: 0 };
export const quarry = { x: 0, y: 0, w: 0, h: 0 };
export const farm = { x: 0, y: 0, w: 0, h: 0 };
export const lab = { x: 0, y: 0, w: 0, h: 0 };
export const apothecary = { x: 0, y: 0, w: 0, h: 0 };
export const casino = { x: 0, y: 0, w: 0, h: 0 };
export const filter = { x: 0, y: 0, w: 0, h: 0 };
// The rift stands past the far wall of the hole, a plot like any other
// (rift.js).
export const rift = { x: 0, y: 0, w: 0, h: 0 };
export const tower = { x: 0, y: 0, w: 0, h: 0 };
// The outhouse is the janitor's whole trade: the caps hang on the stand
// outside and its board sells the ladder's rungs.
export const outhouse = { x: 0, y: 0, w: 0, h: 0 };
// The hopper on the casino's roof, where the pot stands before it is let go: a
// real plot of sand, like the yard and the hole. A pot is grains, not a drawing
// of grains -- see casino.js.
export const table = { x: 0, y: 0, cols: 0, rows: 0, p: P, grid: null, painter: null, n: 0, awake: null, awakeOf: null, awakeN: 0, awakeList: null };
// and the tray in its foot, where a paid hand heaps before it goes to the hole
export const tray = { x: 0, y: 0, cols: 0, rows: 0, p: P, grid: null, painter: null, n: 0, awake: null, awakeOf: null, awakeN: 0, awakeList: null };
// The load on the belt: a strip of ground laid over the band, tail to head,
// that the machine shifts a column at a time (`wireBelt`, `stepBelt` in
// dust.js). Its cells are what `belt` in the save unpacks into.
export const band = { x: 0, y: 0, cols: 0, rows: 0, p: P, grid: null, painter: null, n: 0, high: null, awake: null, awakeOf: null, awakeN: 0, awakeList: null };
// The meteor: the one thing in this game that is not on the ground. `cells` is a
// disc of them -- rind and core -- and `n` is how many are left in it, which is
// what says whether there is still a meteor there at all. See meteor.js.
export const sky = { x: 0, y: 0, r: 0, cols: 0, rows: 0, p: P, cells: null, n: 0 };
