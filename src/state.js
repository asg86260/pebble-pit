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

import { P, LOO_POSTS, APOTH_POTS0 } from './config.js';
// The save lists count bodies by job, and the words are jobs.js's to spell.
import { JOB } from './jobs.js';

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
  rescued: false,         // and, once the dome held one off them, they got out
  rescueTo: 0,            // where they are walking to while they do
  buriedSay: null,
  buriedSayAt: 0,
  // wave7-sky (A4): the square's core errand -- where it has walked to (null
  // means home) and which leg of the fetch-and-toss it is on. See intro.js.
  buriedX: null,
  buriedErrand: null,
  boulderNo: 1,           // how many rocks in; each one is bigger than the last
  coreBuried: true,       // this rock still has its core inside it
  rockFall: 0,            // world pixels a new rock still has to come down
  landAt: 0,              // when the last one hit, for the spread it does on arriving
  rockFallV: 0,           // how fast it is coming
  // --- the shields: what the yard puts between itself and the sky. shield.js ---
  shield: null,           // { kind, x, w, h, laid, caught } while standing; null otherwise
  shieldsDone: [],        // the kinds already raised and answered; a kind is offered once
  // Something is holding the rock up. A fact rather than a call into
  // shield.js, so rock.js can ask without knowing that shields exist -- the
  // same bargain `sceneHolds` strikes for the scenes.
  rockHeld: false,
  danceUntil: 0,          // the crew are celebrating the last one until this moment
  nextBoulderAt: 0,       // backstop, in case a core never falls clear
  peakRow: 0,             // the highest standing rock, recomputed each frame

  // --- dust in the air and on the cursor ---
  chips: [],              // knocked loose, still flying
  belt: [],               // riding the belt, between the ground and the hole
  paid: [],               // flying out of the pit to the bench, on the way to being spent
  gulped: [],             // and out of the pit into the abyss, diving to its surface
  ripples: [],            // where the liquid just ate one: { x, at }, briefly drawn
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
  riftOpen: false,        // the rift has torn: the account is live
  rift: 0,                // and how many grains of dust are through it
  riftLevel: 0,           // how fast it swallows: an endless ladder, not a capacity
  // The arc of the thing -- see "The pit's arc" in DESIGN.md. `riftAte` is
  // every grain the rift has ever swallowed, monotonic: spending reads
  // `riftHeld` and never shrinks it, because a wound does not heal when you
  // take something back out of it. The disc's size is derived from it
  // (`riftCells` in rift.js), and at ABYSS_AT the hole gives way: `drowned`
  // is the era after that, the abyss standing in the pit.
  riftAte: 0,
  drowned: false,
  // The cutscene running right now, or null: { name, at, s, zoom }. A camera
  // pointed at a one-time event, never a pause and never saved -- a reload
  // mid-scene comes back to a yard that has already had it. See cutscene.js.
  cine: null,
  // The tearing, while it is happening: seconds of the gulp left to run, and a
  // knock waiting to be spent on the view. Neither is saved -- an event is a
  // moment, not a state, and a save reloaded halfway through one should come
  // back to a yard that has already had it.
  riftGulp: 0,
  riftShake: 0,
  // And what is through it that is not dust. One capacity, one queue, one rift:
  // a grain is a grain whatever it is, so the hole swallows a shard exactly as
  // it swallows dust, and this is where those go. Kept by kind rather than as
  // one total, because each kind is its own counter on the card and the pile
  // shows the counter *less* what is through -- see `seedPitCores` in pit.js.
  riftHeld: { cores: 0, shards: 0, spores: 0, sparks: 0 },
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
  breakers: 0,            // of the rockhands, this many are nailed to the rock
  carters: 0,             // of the haulers, to the dust
  growers: 0,             // of the farmhands, to the plots
  blasters: 0,            // of the quarriers, to the face

  carryLevel: 0,
  speedLevel: 0,
  pickLevel: 0,
  autoMine: false,

  // --- crits, the one rule that reaches every station ---
  // Two ladders for the whole yard, not a station apiece: how often a unit of
  // work counts for several, and how many it counts for. They live on the bench
  // because they apply everywhere the bench's other rows only wish they did.
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

  // --- what the yard is in the middle of building ---
  // One work per site, and it only moves while somebody is standing there. Same
  // rule the lab has had since the day it opened, applied to every row past the
  // bench. See works.js.
  works: {},              // site -> { key, done, of, at } in worker-seconds
  builders: 0,            // spare hands putting up whatever the yard is building
  lent: [],               // and the jobs a body was borrowed from to be one, to give back

  // The order the yard's own buildings went up in, site key by site key -- see
  // C7 in wave-feedback3.md. `placeSites` walks this before it walks the fixed
  // table, so a save that broke the ground for the farm before the quarry sees
  // the farm standing nearer the rock. Empty means "nothing bought yet, or a
  // save from before this existed" -- either way the fixed order, so nothing
  // already standing moves.
  buildOrder: [],

  // --- the lab ---
  // what the lab is working on, if anything: one piece at a time, and it only
  // moves while somebody is in there
  research: null,         // { key, done } -- worker-seconds put in so far
  smoke: [],              // puffs off the chimney while it is being worked
  grit: [],               // chips off a hammer at a building site
  // F4: what a crit left in the air -- the ring going out, and the specks the
  // blow threw. Neither is dust and neither is counted; see shock.js.
  shocks: [],
  shockMotes: [],
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
  hand: null,             // { won, n, cur, at, mult? }
  // The drop: the plinko board on the casino's roof, and the rock going down
  // it. `pot.drop` says the pot's owed answer is a drop rather than a spin;
  // this is the rock in flight -- the ten flips it was dealt, the bin they add
  // up to, when it let go, and when it landed (null until it has). It is gone
  // once the rock is winched home. See `drop` in casino.js.
  plinkoOpen: false,
  drop: null,             // { path, bin, at, landedAt }
  labBoardOpen: false,
  // A finished work nobody has been to see yet, per site: the key of what
  // landed, kept until that station's board is read. It was the lab's alone --
  // its crew work behind a door -- but a rung finishing anywhere usually
  // happens while you are looking somewhere else, so every station says so
  // with the same tick. See `workFinished` in lab.js and drawDoneMarks.
  siteDone: {},
  // When the lab last had somebody in it with nothing to research. Nothing else
  // takes a body off the lab, so this is what eventually does: it is a stopwatch
  // rather than a fact about the game, so it is not worth saving.
  labIdleAt: 0,
  // How many the lab let out for want of anything to do. Starting a piece of
  // research calls exactly these back, so the game undoing its own tidying is
  // not a chore it hands to you.
  labLeft: 0,
  // Six of them: the crew's two, and the last band of each of the four ladders
  // the two grounds sell. `crop` and `seam` are the yield ones and are the only
  // multipliers here that were never the lab's.
  mult: { swing: 0, haul: 0, quarry: 0, tend: 0, crop: 0, seam: 0 },
  // Hats the school has made and nobody has carried to their stand yet, by
  // job. A taught trade lands here, outside the school, and a spare hand walks
  // it to the station -- see `stepKit` in crew/kitwalk.js. (critics A8)
  hatShelf: {},

  // --- the crew ---
  // One pool of bodies, hired once and put wherever you like. A job is a count
  // of how many are on it, and carrying dust is what the rest do: `haulers` is
  // always the ones left over, never a job you hire into. That is what makes
  // putting somebody on the rock a decision rather than a purchase.
  workers: [],            // little squares that mine and ferry dust
  crew: 0,                // bodies hired, all told
  rockhands: 0, rockhandSpeedLevel: 0, rockhandPickLevel: 0,
  haulers: 0, haulCarryLevel: 0, haulPaceLevel: 0,    // haulers: whatever is spare
  quarriers: 0, quarryPaceLevel: 0, seamLevel: 0,
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
  scholars: 0,             // and the ones standing in the lab, working on the research
  farmhands: 0, tendLevel: 0, cropLevel: 0,

  // --- the apothecary, and the pot on the boil ---
  // A pot the whole yard is under. You set what it brews and it brews that again
  // and again while it has crop and a stirrer -- an upkeep, not a timer. See
  // apothecary.js and DESIGN.md, "The apothecary".
  apothecaryOpen: false,  // the building is up
  stirrers: 0,            // and this many bodies are stirring pots in it
  apothPots: APOTH_POTS0, // standing room for stirrers and tonics up at once
  apothBoardOpen: false,  // its board is open
  // The pot's standing order: what it is set to, whether it keeps at it, and who
  // the doses favor. Shared across every pot in the building -- a second pot is
  // more of the same tonic, more coverage; an independent second tonic is a
  // follow-up (see the report and DESIGN.md "Open").
  potTonic: null,         // the tonic key the pot is set to, or null for off
  potKeep: true,          // keep brewing (an upkeep) or a one-off (a single batch)
  potPrefer: null,        // the job the round favors first, or null for whoever is passed
  // A one-off batch has been brewed and the pot is done. Only means anything
  // while `potKeep` is off. It was written, saved and restored without ever
  // being declared here, which is how it stayed out of `BLANK` -- and so out of
  // the reach of `seedGame`, which puts the yard back to what this file says.
  potSpent: false,
  // Per-pot runtime, indexed by pot: how far a batch has come, and how many
  // doses are minted and waiting for the stirrer to deal out.
  brewAt: [],             // worker-milliseconds into the current batch, per pot
  // What each lit batch was paid for, by pot. A batch belongs to the tonic it
  // was bought as, not to whatever the pot is set to when it lands -- see
  // `stepApothecary`. Without it, turning a pot to a dearer tonic mid-batch
  // shelved the dear one for the cheap one's price.
  brewKeys: [],
  // Batches ever landed, across the run. The building's deeper rows reveal
  // themselves against this rather than all at once on the frame the door opens
  // -- an earned reveal, in the seenX pattern (the grind pass, DESIGN.md).
  brews: 0,
  doseHold: [],           // doses brewed and not yet carried out, per pot
  brewLevel: 0,           // brew speed: crop into a dose, faster
  lengthLevel: 0,         // buff length: how long a dose lasts on the body
  strengthLevel: 0,       // buff strength: what a dose is worth while it is up
  dosesLevel: 0,          // doses a brew: how many bodies one batch reaches

  // --- Track F1: the apothecary rework ---
  // The five fields above that these replace -- `potTonic`, `potSpent`,
  // `doseHold` and `strengthLevel` -- are kept where they are, saved, and read
  // once on load: an old save carries them and `migrateApothecary` pours each
  // into its new home. Nothing writes them after that. See apothecary.js.
  potTonics: [],          // the tonic each pot is set to, by pot index, or null for off
  potSpents: [],          // and whether that pot's one-off batch has been put up
  shelf: {},              // doses in stock on the bookshelf, by tonic key
  potency: {},            // how far each tonic's own strength ladder has climbed
  doseCarryLevel: 0,      // doses a stirrer takes out in one trip: DOSE_CARRY's rung

  // --- what you are doing right now ---
  mouse: { x: 0, y: 0 },
  mining: false,
  paused: false,          // the whole yard held still, on the space bar
  houseBoardOpen: false,  // and the block, with what you can put up on it
  crewListOpen: false,    // whose submenu of names is out beside it
  quarryBoardOpen: false,
  farmBoardOpen: false,
  shackOpen: false,       // the gang has a hut, and the rock has a board
  shackBoardOpen: false,  // and whether it is open right now
  outhouseOpen: false,    // there is somewhere to go
  looPosts: LOO_POSTS,    // how many caps the outhouse's stand has; `loopost` sells the second
  towerOpen: false,       // the tower is up
  towerBoardOpen: false,
  scrubBoardOpen: false,
  // Track F3 (wave5): the books over the pit -- the one board that belongs to no
  // building. Which board is open is this session's business, like the rest of
  // them, so it is in EPHEMERAL below.
  statsBoardOpen: false,
  // --- the record: what the yard has done. See notices.js ---
  // Recognition only: nothing in here feeds a rate, which is the bargain the
  // whole feature hangs off.
  won: [],                // the notices earned, in the order they landed
  wonAt: {},              // and when each one did, so the sheet reads newest first
  wonSeen: 0,             // how many have been looked at; the rest wear the tick
  noticeMigrated: false,  // the silent catch-up has been run on this save
  // What a notice needs remembered that the yard does not already know: who
  // has bitten this rock, and the stamp of the last one off. Cleared every
  // time a rock comes off. One object rather than a field per feat -- see
  // notices.js, which is the only thing that writes it.
  tally: {},
  looBoardOpen: false,      // and the outhouse's, which carries the janitor's ladder

  // --- the air ----------------------------------------------------------------
  haze: 0,                // motes in the sky, waiting to come back down
  raining: false,         // and whether it is coming back down right now
  rainFor: 0,             // seconds into this shower, which is how hard it is coming down
  // wave6-sky: the storm's front. A break rolls a brew-up now, not a shower.
  stormFor: -1,           // seconds since the roll, or -1 for no storm on the way
  rains: 0,               // how many times they have
  scrubOpen: false,       // the house is built
  purifiers: 0,           // and this many bodies are in it
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
  seenDrag: false,        // you have swept dust up by hand, so the row about it shows
  seenSects: [],          // headings that were on the board last time it was open
  seenRows: [],           // and the rows themselves, so a new one can say so
  // Rows whose reveal has fired. Revealing is one-way: a door that appeared
  // because you were nearly rich enough for it does not go away again when you
  // spend, and a house that appeared because a machine was running does not go
  // away when the machine stops. See `revealed` in shop.js.
  shownRows: [],
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
  fatal: '',              // the game has stopped on a throw; nothing is written after it
  unsaved: false,         // the store refused the last write; the sheet says so
  yielded: false,         // another tab is writing this save; this page has stopped
  broken: false,          // a save that would not read was put aside at boot
  staged: false,          // stood at a scene, the player's save kept aside (scenesheet.js)
  lastFrame: 0,         // for the length of the last frame
  settleAt: 0,            // the column the pit settler got to last frame

  // wave6-sim: the training grounds' own body. See crew/teacher.js.
  teachers: 0,            // bodies put on the school; the works there stall without one

  noticeboard: { x: 0, y: 0, w: 0, h: 0 }  // the record, on its posts (reseated at boot)
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

// --- what survives a reload -------------------------------------------------
//
// Which of the facts above are the player's, and which are only this session's.
// It used to be answerable in one place only -- the body of `persist()` -- and
// a field added here and forgotten there was silent: nothing warns you, and the
// first anybody hears of it is a player saying the thing they bought is gone.
// So the answer is a list, next to the facts, and `test/persist-roundtrip`
// makes a field in none of the three lists a red test rather than lost data.
//
// `SAVED` is the plain part: written straight out and read straight back by one
// loop in persist.js, against `BLANK` for what a missing key means. Adding a
// field that is just a number, a flag or a list of them is one line here.
//
// The comments are the ones that used to sit over these lines in `persist()`;
// they say why a field is worth keeping, which is the part that is not obvious.
export const SAVED = [
  'stored',               // dust in the hole: the whole point
  'carryLevel',
  'speedLevel',
  'autoMine',
  'cores',
  'seenBench', 'seenDrag',
  'seenSects',
  'seenRows',
  'shownRows',
  // The rift, and whether the hole has ever turned a grain away. What is
  // actually *through* it is `rift`/`riftHeld`, which are clamped on the way in
  // and so are hand-read -- see persist.js.
  'seenFullPit',
  'riftOpen',
  'riftLevel',
  'hideDone',
  'pickLevel',
  'critChanceLevel',
  'critMultLevel',
  'schoolOpen',
  // the four trades that are nailed on. `rebalance` clamps them on the way in
  // to what is actually standing there
  'breakers',
  'carters',
  'blasters',
  'growers',
  'haulCarryLevel',
  'haulPaceLevel',
  'brews',
  'shards',
  'spores',
  'farmOpen',
  JOB.FARM,
  // a work that finished while you were away is still news when you come
  // back, and how many the lab let out for want of anything to do
  'siteDone',
  'labLeft',
  'tendLevel',
  'cropLevel',            // and what one cut off a plot is worth
  // The apothecary: the building, its crew, and the pot's standing order. A
  // save from before it existed comes back with the pot idle and one pot to a
  // building, which is what a fresh apothecary is.
  'apothecaryOpen',
  JOB.STIR,
  'apothPots',
  'potTonic',
  'potKeep',
  'potPrefer',
  'potSpent',
  'brewAt',
  'brewKeys',
  'doseHold',
  'brewLevel',
  'lengthLevel',
  'strengthLevel',
  'dosesLevel',
  // Track F1: the apothecary rework. The pots' own settings, the stock on the
  // bookshelf, and the ladders that are no longer one number for the building.
  'potTonics',
  'potSpents',
  'shelf',
  'potency',
  'doseCarryLevel',
  'labOpen',
  'casinoOpen',
  'plinkoOpen',
  'scrubOpen',
  'towerOpen',
  'outhouseOpen',
  // The gang's hut. Nothing else about the rock's ladders moves with it -- the
  // levels were always on S and stay there -- so a save that opens this flag
  // finds every rung it had already bought sitting on the shack's board.
  'shackOpen',
  'labKitLevel',
  'fanLevel',
  'spells',
  'wizSpeedLevel',
  'wizPowerLevel',
  'labRooms',
  // the sky: that the tower has called something down, and the red it paid in.
  // What is left of the meteor is cells, so it is hand-written.
  'meteorOpen',
  'sparks',
  // What the tower still owes you. The rain and the weather in flight are not
  // saved, because a shower with no beginning is not a shower -- but a hat on
  // the bench has been *paid for*, and closing the tab on one used to lose the
  // dust, the stone and the crop with it.
  'wizardHats',
  JOB.JANITOR,
  'harnessLevel',
  'bootsLevel',
  'seenMess',
  'recycler',
  'seenAir',
  'rains',
  'recycled',
  'muck',                 // what came down and has not been cleared
  'chip',                 // which of CASINO_CHIPS is on the table
  // wave6-sim
  JOB.TEACH,
  // The record's rect is reseated by the layout at boot, so saving it costs
  // nothing and keeps the list honest about a field the roundtrip test can see.
  'noticeboard',
  // The builders. Derived by `rebalance` rather than hired, but saved like
  // every other job count so the roundtrip is honest about a field that exists
  // -- and re-derived on restore, the way the dealt counts are.
  JOB.BUILD,
  // The record. `tally` is saved because a rock half-mined when you closed
  // the tab was still half-mined by somebody when you come back, and who bit
  // it is the whole question two of the feats ask.
  'won',
  'wonAt',
  'wonSeq',               // the order notices landed in, which the clock could not keep across a reload
  'cineOwed',             // a scene the save cut short, played once on the next boot
  'wonSeen',
  'noticeMigrated',
  'tally',
];

// The rest of what is saved: fields whose encode or decode is more than a copy
// -- a run-length string, a clamp against another counter, a job that has been
// renamed since the save was written. Their code stays in `persist()`, where
// the reasoning for each of them is written out at length.
//
// The last six are not fields on `S` at all: the three sand grids and the sky
// are module consts (below), the crew's chance is in rng.js, and the craft
// belong to balloon.js. They are named here because this list is meant to be
// readable as "everything a save carries that is not a plain copy", and leaving
// the grids out of it would make the pit look unsaved.
export const SAVED_BY_HAND = [
  'runSeed',              // the run's name, and the stream it is partway through
  'banked',               // every grain ever put in the hole; an old save has only `stored`
  'seenCore',             // ...or a save from before it was written, which any banked core proves
  'camX',                 // rounded out, and read back once, into `camWas`
  'coreItem',             // a core loose in the world: a spot, or the fact of one
  'crew',                 // an old save has a headcount per job and no total
  'workers',              // saved as `who`: a name and a record apiece, not four counts
  JOB.ROCK,            // renamed from miners, and read under both names
  'rockhandSpeedLevel',
  'rockhandPickLevel',    // and from when one pick row bought both
  // The lab is gone and nobody is ever a scholar again, but the field stays
  // saved so a save written before it went still round-trips: `restore` reads
  // the old count to keep the headcount right and then lands those bodies in
  // the spare pool. See DESIGN.md, "The lab is deleted".
  JOB.SCHOLAR,
  'seenShard',
  'quarryOpen',           // renamed from the cave, along with the three below
  JOB.QUARRY,
  'quarryPaceLevel',
  'seamLevel',            // and what one dig turns up
  'benchLevel',           // grandfathered up to the crew already standing in it
  'quarryCells',          // how deep each column has been dug
  'quarryOwed',           // and how much of the seam is still in it: guessed, for an old save
  'seenSpore',
  'plotLevel',            // grandfathered, the way `benchLevel` is
  'introDone',            // an old save with anybody hired has plainly had its opening
  'reunionDone',
  'buried',
  'looPosts',             // a save from before the second cap keeps the two it had
  'machines',             // facts only: bought, driven, tuned, took the kit
  'summon',               // three places, and only meaningful once the tower is open
  'seenSpark',
  JOB.WIZARD,              // never more bodies up there than there are hats
  'works',                // what the yard is part way through building, per site
  'buildOrder',           // and the order its buildings went up in
  'belt',                 // what is riding the belt, as [x, shade] pairs
  'hatShelf',             // hats made at the school and not yet carried to their stand, carriers' included
  'lent',                 // the jobs the builders were borrowed from
  JOB.PURIFY,            // renamed from scrubbers
  'haze',                 // rounded: a fraction of a mote is not worth the characters
  'rockSand',             // what is lying on the rock, a column at a time
  'pot',                  // the casino: what is on the table...
  'pouring',              // ...whether its stake is still raining down...
  'paying',               // ...and what a taken pot still owes the hole
  'mult',                 // the lab's multipliers; its quarry one answered to `cave`
  'plots',                // how far along each plot is, as hundredths
  'plotTone',             // and the spore standing ripe on it
  'boulder',              // the rock, as a run-length string...
  'gw', 'gh',             // ...and the shape that string is read against
  'boulderNo',
  'coreBuried',           // whether this rock still owes you its core
  'rift',                 // dust through the rift, clamped to the counter it came out of
  'riftHeld',             // and the finds through it, each clamped the same way
  'riftAte',              // every grain it ever swallowed; old saves seed it -- see persist.js
  'drowned',              // whether the hole has given way; a pre-arc save derives it there too
  // Written down and never read back: haulers are whoever is spare, so
  // `rebalance` works the number out again from the crew and the other jobs. It
  // stays in the file because the format on disk is not this refactor's to
  // change, and because a save is also the thing a bug report arrives as.
  JOB.HAUL,
  // Saved and restored, but nothing else in the game reads it -- the crew's
  // leavings live in `S.muck`, under a kind. A leftover the format still
  // carries; kept for the same reason `haulers` is.
  'poop',
  // --- the shields, and getting out from under the rock ---------------------
  // Written and read by hand in persist.js rather than plainly copied, which is
  // what puts them here: the standing shield is serialized field by field (the
  // live one carries more than a save should), `shieldsDone` is guarded back into
  // an array, and `rescued` is coerced and then used to settle `buried`.
  //
  // They were in none of the three lists, which persist-roundtrip.test.mjs has
  // been red about: the save was writing them and no list admitted to it, so
  // nothing held the format to them. A shield you have raised is a thing you
  // paid for and watched go up, and a kind is offered once -- losing either on
  // a reload is losing the yard's answer to the sky.
  'shield',
  'shieldsDone',
  'rescued',
  // Not fields on S: the grids, the sky, the chance and the craft.
  'floor', 'pit', 'cut', 'meteorCells', 'rngState', 'craft',
];

// And everything else: this session's own, deliberately thrown away on a
// reload. A moment rather than a fact (the tearing of the rift, a shower, a
// spin), something worked out again on the way in (the layout, the rock tops,
// what is lying in each pile), or something in flight that a reload has no
// beginning for. Named rather than assumed, so that adding a field and not
// thinking about it is a failing test.
export const EPHEMERAL = [
  // what the store said about this page: writes refused, another tab writing,
  // a save that would not read put aside -- see persist.js and save.js
  'unsaved', 'yielded', 'broken',
  // stood at a scene, with the player's own save kept aside -- scenesheet.js
  'staged',
  // the window and the view, all measured at boot
  'W', 'H', 'zoom', 'dpr', 'viewW', 'viewH', 'camY', 'camTo', 'camWas',
  'follow', 'camLockY', 'shake', 'shakePh', 'shakeX', 'shakeY',
  'worldW', 'worldH', 'cx', 'cy', 'groundY',
  // read off the rock and the ground again every frame, or every survey
  'rockTops', 'tick', 'floorGrains', 'floorMarks', 'piles', 'pileCount', 'pileFull',
  'peakRow',
  // the opening, while it is running
  'intro', 'sceneHolds', 'introAt', 'introSaid', 'pair', 'buriedSay', 'buriedSayAt',
  'introThrew',
  // a rock on its way down, and the celebration for the last one
  'rockFall', 'rockFallV', 'danceUntil', 'nextBoulderAt',
  // ...and when the last one hit, which is only read for the spread it does on
  // arriving: a reload has no arrival to be moments after.
  'landAt',
  // Whether something is holding the rock up. A fact worked out again from the
  // shield that is standing -- see the note beside it in the declarations -- so
  // saving it would be saving an answer whose question is already saved.
  'rockHeld',
  // Where somebody dug out from under the rock is walking to. `rescued` is the
  // fact and is saved; this is the walk, and a reload has no walk in progress.
  'rescueTo',
  // dust in the air: a grain mid-flight has no beginning to come back to
  'chips', 'paid', 'gulped', 'ripples', 'motes', 'trail', 'held', 'falling',
  // the counter chasing the real number
  'shownStored', 'tweenFrom', 'tweenTo', 'tweenAt', 'tweenMs',
  // the tearing of the rift: an event, not a state -- and the cutscene
  // watching it, which is a camera, not a fact about the yard
  'riftGulp', 'riftShake', 'cine',
  'heldCore', 'coreTaker',
  // smoke, curtains and chips off a hammer
  'smoke', 'grit', 'smokeAt', 'houseSmokeAt', 'shutters', 'shutterAt', 'shutterN',
  // F4: a crit's ring and its specks -- a moment, half a second long, with no
  // beginning for a reload to come back to
  'shocks', 'shockMotes',
  'skyShown', 'flashAt',
  // the wheel, and a hand that settled before you closed the tab
  'wheel', 'spinAt', 'spinFrom', 'spinTo', 'spinUntil', 'tableAir', 'spinWon', 'hand',
  'drop',                 // a rock mid-board is like a wheel mid-spin: the pot comes back undecided, and the decision is open again
  // stopwatches, and the two the lab keeps behind `works`
  'labIdleAt', 'research', 'research2',
  // which boards are open, and what the pointer is doing
  'boardOpen', 'schoolBoardOpen', 'apothBoardOpen', 'labBoardOpen', 'casinoBoardOpen',
  'houseBoardOpen', 'crewListOpen', 'quarryBoardOpen', 'farmBoardOpen',
  'towerBoardOpen', 'scrubBoardOpen', 'mouse', 'mining', 'paused', 'dragging',
  'statsBoardOpen', 'looBoardOpen',        // Track F3 (wave5)
  'shackBoardOpen',                        // and the rock's own, at the shack
  'nextHit', 'resetArmed',
  // worked out again from the counts, or only true for a few lines of a frame.
  // (wave7b-build: `builders` moved to SAVED -- once the construction bench is
  // open it is a hired post like any job, and a hired post survives a reload.)
  'quarryTotal', 'restaff', 'quarrySpent', 'machineWorking', 'tillerAt',
  // the weather, and the part-grain the house is partway through
  'raining', 'rainFor', 'scrubBank', 'pumpAt',
  'stormFor',                              // wave6-sky: weather in flight is not saved
  // Three that are hung on S by their own modules rather than declared above --
  // where the buildings were put and the strips beside them (`placeSites` in
  // world.js, worked out again every time the world is laid out) and the beat
  // the opening's heart is on (intro.js). Named here so that the list is
  // complete; declaring them above would be better, and is somebody's tidy-up.
  'placed', 'strips', 'introHeart',
  // housekeeping
  'dirty', 'fatal', 'lastFrame', 'settleAt',
  // wave7-sky: the buried square's core errand is a moment, not a fact -- a
  // reload finds the square at home and the core wherever the save left it
  'buriedX', 'buriedErrand',
];

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
// The rockhands' shack, standing off the rock's left flank: the gang's own
// building, where their helmets hang on the stand outside and their board is
// read. The one trade that was here from the first frame was the last to get a
// roof. See DESIGN.md, "The shack at the rock".
export const shack = { x: 0, y: 0, w: 0, h: 0 };
export const bench = { x: 0, y: 0, w: 0, h: 0 };
export const quarry = { x: 0, y: 0, w: 0, h: 0 };
export const farm = { x: 0, y: 0, w: 0, h: 0 };
export const lab = { x: 0, y: 0, w: 0, h: 0 };
// The apothecary: a pot on a fire, standing just past the farm whose crop it
// takes. See apothecary.js.
export const apothecary = { x: 0, y: 0, w: 0, h: 0 };
export const casino = { x: 0, y: 0, w: 0, h: 0 };
// The scrubbing house: the one building whose job is to undo something the rest
// of the yard is doing.
export const scrub = { x: 0, y: 0, w: 0, h: 0 };
// The rift stands past the far wall of the hole -- a plot like any other, even
// though what it is is an absence. See src/rift.js.
export const rift = { x: 0, y: 0, w: 0, h: 0 };
// The tower: the far end of the walk, and the only thing a core buys.
export const tower = { x: 0, y: 0, w: 0, h: 0 };
// The outhouse, out among the rooms the crew live in: the shed with the moon on
// the door, and the janitor's whole trade with it -- the caps hang on the stand
// outside, the brooms live here, and its board sells the ladder's rungs. There
// used to be a second shed for the tools (the janitor's closet); one trade gets
// one building.
export const outhouse = { x: 0, y: 0, w: 0, h: 0 };
// The ground the pot piles up on: a real plot of sand, like the yard and the
// hole, on the ground either side of the casino. A pot is grains, not a drawing
// of grains -- see casino.js.
export const table = { x: 0, y: 0, cols: 0, rows: 80, p: P, grid: null, painter: null, n: 0, awake: null, awakeOf: null, awakeN: 0, awakeList: null };
// The meteor: the one thing in this game that is not on the ground. `cells` is a
// disc of them -- rind and core -- and `n` is how many are left in it, which is
// what says whether there is still a meteor there at all. See meteor.js.
export const sky = { x: 0, y: 0, r: 0, cols: 0, rows: 0, p: P, cells: null, n: 0 };
