// --- the machines ---------------------------------------------------------------
import { P } from './yard.js';

// What a machine is worth, as a multiple of the complement its station could
// hold by hand. See `handsOf` and DESIGN.md's "The machines".
//
// A dial to be **measured**, not believed: hands spend much of their day
// walking and a machine standing in one place does not, so a machine ticking
// at one and a half times the station's clock is worth rather more than one
// and a half hands, by an amount that depends on how far apart the work is.
export let MACHINE_GAIN = 1.5;
// What one rung of a machine's ladder multiplies its rate by, and what each of
// the three rungs costs in red. See `tuneRow` in machines.js.
//
// A written table, a rung a line, like every other ladder in the game
// (`LADDERS` in config/rungs.js): three rungs is short enough to read, and a
// short ladder ends, so the row says "2 of 3" instead of disappearing into a
// price that climbs out of reach. The rift's throughput is the endless red
// sink now; a machine's ladder is a thing you finish.
//
// The rungs cost about what the machine did, then half again, then half again:
// topping one out is a second machine's worth of red, which is the weight the
// decision wants.
export const MACHINE_TUNE = 1.3;
export const MACHINE_TUNE_SPARKS = [360, 600, 1000];
export const MACHINE_TUNE_RUNGS = MACHINE_TUNE_SPARKS.length;
// Dust to the spark, the line every price in this game sits on. `DUST_PER` in
// upgrades.js is the full table; this is the one entry also needed here, where
// a bill is built and upgrades.js cannot be reached without closing a ring.
// The tuning ladder derives its dust leg from this.
export const DUST_PER_SPARK = 20;
// The other three coins on the same line. A coin is worth what the yard has to
// give up to make one, and a staffed farm mints forty-odd spores a minute
// against a hundred-odd dust, so a spore is a few grains' worth of time.
export const DUST_PER_SHARD = 12;
export const DUST_PER_SPORE = 3;
export const DUST_PER_CORE = 500;
// Soot off the stack, per unit of the station's work -- not per minute. A
// machine is the sky's only producer (`foul` refuses everything else), so this
// one dial *is* the pollution rate, and a machine is also many times as quick
// as the hands it replaced, so the compounding is easy to get wrong. Well
// under one: at a pace the scrubbing house and the rain can argue with. The
// runner charges it in one place, off the stack (`stepMachines`).
export let MACHINE_FOUL = 0.4;
// The smoke you see off a working stack, apart from the haze it adds. What a
// beat puts into the sky is a few motes (MACHINE_FOUL is small by design, so
// the house can argue with it), and a few motes climbing away are not a
// chimney smoking; so each beat also throws STACK_PUFFS off the stack that
// rise, lean on the wind and fade over STACK_LIFE_S -- smoke that dissipates,
// as most of a chimney's does, while the motes are what lingers. Only on a
// beat: a stack over an idle machine puts up nothing.
export let STACK_PUFFS = 3;
export const STACK_LIFE_S = 3.2;
export const STACK_RISE = 0.7;      // pixels a frame it climbs, easing off
export const STACK_SCATTER = 0.5;   // sideways throw either way, pixels a frame
// How the ram gets about: a slow crawl forward as the face retreats, and a
// brisker drive in reverse when a boulder is finished. Pixels a frame. The
// reverse beats the next rock down from any distance a boulder run can open
// up, so the ram is parked when the rock lands -- but it drives back, it does
// not teleport. The crawl is the floor: a tuned ram eats the face faster than
// any fixed crawl, so the drive forward is derived from the lag instead -- it
// closes whatever has opened up within `RAM_CATCHUP_S`, and the arm never
// stretches across a widening gap.
export const RAM_CRAWL = 0.6;
export const RAM_BACK = 8;
export const RAM_CATCHUP_S = 0.5;
// Bare ground kept between the bench and the ram's tail: the parked spot is
// measured off the face, and a fresh boulder's face is close enough to the
// bench that the machine stood into it.
export const RAM_CLEAR = P * 3;
// The rock's complement, which is the one a machine cannot read off the
// station: `capOf('rock hands')` is `Infinity`, and "worth as much as whatever
// gang you happen to have" is a machine that gets better the less you need it.
// Five is what a crest holds before bodies are elbowed round the shoulder of
// it.
export const ROCK_GANG = 5;

// The most of its own clock a machine will make up in one frame. A machine
// quicker than a frame does several units in it, or the frame becomes the
// rate; but a tab left in the background should not come back and take the
// whole quarry out on the frame it wakes. A cap on time rather than on units:
// a unit cap becomes the rate from about the fourth rung of any tuning ladder,
// and the rungs above it buy nothing.
export const MACHINE_CATCHUP_MS = 250;
// How long after its last unit of work a machine still reads as running. A
// beat lands on one frame in three at best, so "is it working" has to be a
// moment rather than a frame or the drawing strobes.
export const MACHINE_IDLE_MS = 600;

// A puff is a handful of motes let go together, not one square: a single mote
// on a short timer reads as a dotted line, a thing ticking rather than
// billowing.
export const PUFF_MOTES = 3;         // motes let go together
export const PUFF_SPREAD = 0.8;      // how far apart they start, in cells
// What a mote does when nobody has said otherwise: a wisp over a roof, which
// is the hearth, a cigarette and a tonic burning off. A caller that wants its
// own pace passes `rise` and `life` -- the machines do, just above.
export const SMOKE_LIFE = 2.4;       // seconds a puff lasts
export const SMOKE_RISE = 0.4;       // and how fast it goes up

// What the three of them cost. Every machine is priced in sparks, which is
// what makes them the last thing in the game, and then in **the two ground
// currencies its own station does not produce**: a machine is paid for by the
// rest of the yard, or the purchase stops being a decision about where the
// whole works is going. Every one carries dust, because every price does
// (`every bill carries dust` in test/bills.test.mjs): the pile is what the
// game is about, and a row that asks for none is a row the pile has no part
// in. The dust leg sits on the sixty-a-spark line.
export const JAW_BILL    = [['spark', 360], ['dust', 7200], ['spore', 500]];
export const RAM_BILL    = [['spark', 600], ['dust', 12000], ['shard', 800], ['spore', 600]];
export const TILLER_BILL = [['spark', 240], ['dust', 4800], ['shard', 360]];
// The belt is the one machine not priced away from its own station's coin,
// because carrying does not *have* a coin: a hauler moves what everybody else
// made. So it is priced in all three grounds.
export const BELT_BILL = [['spark', 480], ['dust', 9600], ['shard', 600], ['spore', 600]];

// The dev panel's rows for the knobs above, beside the bindings because an
// imported `let` is read-only; config.js gathers every file's rows into TUNABLE.
export const MACHINE_KNOBS = [
  { key: 'MACHINE_GAIN', label: 'a machine is worth', min: 0.5, max: 6, step: 0.1,
    get: () => MACHINE_GAIN, set: v => { MACHINE_GAIN = v; } },
  { key: 'STACK_PUFFS', label: 'smoke a beat', min: 0, max: 12, step: 1,
    get: () => STACK_PUFFS, set: v => { STACK_PUFFS = v; } },
  { key: 'MACHINE_FOUL', label: 'soot a machine unit', min: 0, max: 12, step: 0.1,
    get: () => MACHINE_FOUL, set: v => { MACHINE_FOUL = v; } }
];
