// --- the machines ---------------------------------------------------------------
import { P } from './yard.js';

// What a machine is worth, as a multiple of the complement its station could
// hold by hand. See `handsOf` and DESIGN.md's "The machines".
//
// This is a dial to be **measured**, not believed, and the number here is a
// guess until a check has measured it. The reason is that hands spend a great
// deal of their day *walking* -- CUT_STEP from cell to cell across the floor of
// the cut, along the plot line, up and down the face -- and a machine that
// stands in one place does not. So a machine ticking at one and a half times the
// station's clock is worth rather more than one and a half hands, and by how
// much depends on how far apart the work is, which is not a thing you can reason
// out from here. The honest form of this number is whatever a node check that
// runs a machine against a real gang of five says it should be.
export let MACHINE_GAIN = 1.5;
// And what one tuning of a machine multiplies its rate by, what the first one
// costs in red, and how fast that price climbs. See `tuneRow` in machines.js.
//
// The ladder never ends, so the price has to be the wall rather than the rung
// count: 1.55 a rung against a gain of 1.3 means each one buys less than the
// last, which is what stops an endless row from running away with the game --
// and what makes it a sink deep enough to swallow an endgame's dust.
export const MACHINE_TUNE = 1.3;
// The first rung quadrupled with the machines themselves: red gathers far
// quicker than these prices were written against, and a ladder whose first
// rungs are always affordable is a dial you turn, not a thing you save for.
// The climb per rung is unchanged -- 1.55 against a gain of 1.3 is already
// each rung buying less than the last, which is what makes the ladder a sink.
export const MACHINE_TUNE_COST = 120;
export const MACHINE_TUNE_UP = 1.55;
// Dust to the spark, the line every price in this game sits on. `DUST_PER` in
// upgrades.js is the full table; this is the one entry that is also needed here,
// where a bill is built and upgrades.js cannot be reached without closing a ring.
export const DUST_PER_SPARK = 60;
// And the other three coins on the same line. Shard and spore sat at forty
// each for a year while the yard minted spores two hundred times as fast as
// shards -- pricing them apart is the grind pass's first lever (DESIGN.md).
export const DUST_PER_SHARD = 60;
export const DUST_PER_SPORE = 15;
export const DUST_PER_CORE = 500;
// Soot off the stack, per unit of the station's work -- not per minute. A
// machine is the sky's only producer (`foul` refuses everything else), so this
// one dial *is* the pollution rate, and the compounding is what makes it so
// easy to get wrong: a machine is also many times as quick as the hands it
// replaced, so at 1.6 per unit the sky went from a slow brown to pinned in a
// couple of minutes of jaw, and the smoke was the whole game. Well under one:
// an engine that smokes, at a pace the scrubbing house and the rain can argue
// with. The runner charges it in one place, off the stack -- see `stepMachines`
// -- which is why this is not three trebled constants at four call sites.
export let MACHINE_FOUL = 0.4;
// How the ram gets about: a slow crawl forward as the face retreats, and a
// brisker drive in reverse when a boulder is finished and its parked spot is
// back at the near end. Pixels a frame. The reverse is quick enough to beat
// the next rock down from any distance a boulder run can open up, so the ram
// is parked and ready when the rock lands -- but it drives back, it does not
// teleport.
export const RAM_CRAWL = 0.6;
export const RAM_BACK = 8;
// Bare ground kept between the bench and the ram's tail. The parked spot is
// measured off the face, and a fresh boulder's face is close enough to the
// bench that the machine stood into it.
export const RAM_CLEAR = P * 3;
// The rock's complement, which is the one a machine cannot read off the station.
// `capOf('rock hands')` is `Infinity` and rightly so -- a rock is as long as it is,
// and there is no floor plan to run out of. But the ram still has to be worth
// something, and "worth as much as whatever gang you happen to have on it" is a
// machine that gets better the less you need it.
//
// Five, because five is what a crest holds before bodies start being elbowed
// round the shoulder of it and the sixth is working the far side on its own. It
// is a number in config.js with its reasoning over it, which is where every
// number in this game lives -- what the rule against per-case constants forbids
// is a bare 5 inlined in the shared runner.
export const ROCK_GANG = 5;

// How often a machine's stack puffs, and how big the puff is. The lab's chimney
// (HOUSE_PUFF_MS) and the cigarette's 0.55 are the two precedents; a machine sits
// between them -- more often than a hearth, bigger than a cigarette.
// The most units of its station's work a machine will do in one frame. A machine
// quicker than a frame does several, or the frame becomes the rate and the gain
// dial stops meaning anything -- but a tab left in the background for a minute
// should not come back and take the whole quarry out on the frame it wakes.
export const MACHINE_MAX_BEATS = 8;
// How long after its last unit of work a machine still reads as running. A beat
// lands on one frame in three at best, so "is it working" has to be a moment
// rather than a frame or the drawing strobes.
export const MACHINE_IDLE_MS = 600;
export const MACHINE_PUFF_MS = 1500;
export const MACHINE_PUFF_S = 1.15;
// A machine's stack smokes its own way: lower and shorter than a chimney does.
//
// Everything that smokes used to share SMOKE_RISE and SMOKE_LIFE, which is right
// for the lab's chimney and the crew's hearth and a cigarette -- one wisp over
// one roof, and it may take its time. A working yard has three stacks going at
// once, in the middle of everything, and a trail that climbs at the chimney's
// pace for the chimney's two and a half seconds becomes a streak halfway up the
// window: which is a machine drawing more attention to itself than the crew
// under it.
//
// So it goes up about half as fast and is gone in under two thirds of the time.
// The trail that leaves the stack is about a third the length it was: still
// plainly a machine smoking -- which the whole pollution story leans on -- and
// no longer a streak drawing the eye off the yard and up to the top of the
// window.
export const MACHINE_PUFF_RISE = 0.22;
export const MACHINE_PUFF_LIFE = 1.5;

// A puff is a handful of motes let go together, not one square.
//
// Every chimney in this game used to emit a single mote on a short timer, which
// at any distance reads as a dotted line rather than as smoke -- a thing
// ticking, not a thing billowing. A real puff arrives all at once and comes
// apart on the way up, so: several motes on the same beat, spread a little,
// sized a little differently, drifting a little differently, and a longer wait
// between one puff and the next.
export const PUFF_MOTES = 3;         // motes let go together
export const PUFF_SPREAD = 0.8;      // how far apart they start, in cells
// What a mote does when nobody has said otherwise: a wisp over a roof, which is
// the hearth, a cigarette and a tonic burning off. A caller that wants its own
// pace passes `rise` and `life` -- the machines do, just above.
//
// These two used to live in config/lab.js because the lab's chimney was the
// first thing that smoked. The lab is gone and the smoke is not, so they sit
// here with the rest of what a puff is made of.
export const SMOKE_LIFE = 2.4;       // seconds a puff lasts
export const SMOKE_RISE = 0.4;       // and how fast it goes up

// What the three of them cost.
//
// Every machine is priced in sparks, which is what makes them the last thing in
// the game, and then in **the two ground currencies its own station does not
// produce**. The jaw works the cut and the cut makes shards, so the jaw is not
// priced in shards; the ram works the rock and the rock makes dust, so the ram
// is not priced in dust; the tiller works the plots and the plots make spores.
//
// That is one rule rather than three prices, and it says something true: a
// machine is paid for by the rest of the yard. A station that could buy its own
// machine out of its own output is a station whose machine is really just a
// bigger version of itself, and the purchase stops being a decision about where
// the whole works is going.
//
// A `bill` is what a row with more than one coin on it uses -- see `billOf`.
// The tower has been the only such row in the game; these are the first that are
// priced in sparks at all, which means they are also the first exercise
// `takeCoreCells` has ever had.
// And every one of them carries dust, because every price in this game does.
//
// Dust is the one coin the whole yard makes, so a row that does not ask for any
// is a row the pile has no part in -- and the pile is what the game is about.
// The rule is not a preference about prices: it is what gives the dust in the
// hole somewhere to go, which is the difference between a heap you spend and a
// heap you look at. See `every bill carries dust` in test/bills.test.mjs, which
// is what stops the next row added from quietly skipping it.
//
// The two that did skip it were the ram and the belt. They were priced in the
// coins of the grounds and in red, which reads well and left the two most
// expensive things in the game costing nothing out of the pile.
//
// Sixty dust to the spark is the line the three that already had dust were
// sitting on -- the tiller exactly, the jaw within a rounding -- so the two
// being fixed are put on the same line rather than given a number apiece.
// Raised fourfold across the board (and the dust held to the sixty-a-spark
// line): at the old prices an endgame yard bought a machine out of pocket
// change the moment the row appeared. A machine is the last thing in the
// game, and the last thing in the game is saved for.
export const JAW_BILL    = [['spark', 120], ['dust', 7200], ['spore', 100]];
export const RAM_BILL    = [['spark', 200], ['dust', 12000], ['shard', 160], ['spore', 120]];
export const TILLER_BILL = [['spark', 80], ['dust', 4800], ['shard', 72]];
// The belt is the one machine not priced away from its own station's coin,
// because carrying does not *have* a coin: a hauler makes nothing, it moves what
// everybody else made. So it is priced in all three grounds, which is the truest
// thing a price can say about a thing the whole yard uses.
export const BELT_BILL = [['spark', 160], ['dust', 9600], ['shard', 120], ['spore', 120]];
// The rock's notional gang was five; the lip's is what a full crew of carriers
// looks like, which is rather more -- carrying is the job everybody falls back
// to, so at any moment most of the yard is doing it.

// The dev panel's rows for the knobs above. A row lives beside the binding it
// moves because nothing but this file can assign to one: an imported `let` is
// read-only everywhere else, so the get/set pair has to be written where the
// `let` is. config.js gathers every file's rows into one TUNABLE.
export const MACHINE_KNOBS = [
  { key: 'MACHINE_GAIN', label: 'a machine is worth', min: 0.5, max: 6, step: 0.1,
    get: () => MACHINE_GAIN, set: v => { MACHINE_GAIN = v; } },
  { key: 'MACHINE_FOUL', label: 'soot a machine unit', min: 0, max: 12, step: 0.1,
    get: () => MACHINE_FOUL, set: v => { MACHINE_FOUL = v; } }
];
