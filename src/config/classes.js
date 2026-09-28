// --- the party's classes (docs/wave-party.md, docs/serpent-classes.md section 0) ---
// Owned by track FIGHT. Every number a class needs lives here; the ten rows'
// tempos and move numbers are first guesses for the ladder book.
import { P } from './yard.js';

// A station kind's two classes: the fork its fighter comes to at FORK_RUNG
// (DESIGN.md, "A fighter branches at rung 4"). Below it the fighter is the
// kind's base unit, `BASES`, fighting as the pair's first class does.
export const PAIRS = {
  altar: ['brawler', 'sword'], well: ['monk', 'martial'], armory: ['ranger', 'assassin'],
  circle: ['hexer', 'sapper'], spire: ['mage', 'bard'],
};
export const BASES = { altar: 'Fighter', well: 'Novice', armory: 'Scout', circle: 'Adept', spire: 'Apprentice' };
// The first lot is one of these: each base unit does damage alone.
export const FIRST_KINDS = ['altar', 'armory', 'spire'];
// A class that does nothing with nobody beside it: its fork opens with a
// second station.
export const NEEDS_COMPANY = ['bard'];
// The first station and a fang for each of the first three breaks.
export const FIGHT_STATIONS_MAX = 4;

// One row a class: name, ladder key (in LADDERS), the hit key (in
// SERPENT_DEFENSE), melee or not, and its tempo and move numbers. What a rung
// is worth -- a hit's damage, the beam's damage a second, the Bard's Inspired
// share -- is the class's ladder; everything here is the shape of the attack
// around that number. Times are seconds unless named `_ms`.
//
//   every    seconds between two attacks (Hasted shortens it)
//   windup   seconds from the start of a swing to its contact: the pose the
//            drawing holds before the blow, and the blow lands at its end
//   fly      seconds a thrown or shot thing is in the water
export const MOVE_RUNG = 4, CAPSTONE_RUNG = 8;
// The rung that picks the class: the move's, so the fork brings the move.
export const FORK_RUNG = MOVE_RUNG;
export const CLASSES = {
  // Heavy punches; every 4th a haymaker, x4, that stuns (longer at the capstone).
  brawler:  { name: 'Brawler',        ladder: 'brawler',  hit: 'brawler',  melee: true,
              every: 1.2, windup: 0.18, haymaker: { every: 4, x: 4 }, capStun: 1.5 },
  // Cuts that bleed; at rung 4 each cut lands at three spots, at 8 every 3rd twice.
  sword:    { name: 'Swordsman',      ladder: 'sword',    hit: 'sword',    melee: true,
              every: 1.6, windup: 0.14, bleed: { dps: 0.3, s: 3 },
              whirl: { spots: 3, x: 0.6, spread: 4 }, capEvery: 3 },
  // A palm wave from afar; each fills chi, and a full row is a chi palm that stuns.
  monk:     { name: 'Monk',           ladder: 'monk',     hit: 'monk',     melee: false,
              every: 1, windup: 0.15, fly: 0.35, chi: { max: 5, fill: 1, moveFill: 2, x: 3 }, capStun: 1.5 },
  // Quick staff thrusts fill pips; a full row is one finisher blow.
  martial:  { name: 'Martial Artist', ladder: 'martial',  hit: 'martial',  melee: true,
              every: 0.5, windup: 0.08, pips: { max: 5, fill: 1, moveFill: 2 }, finisherX: 1.5, capHaste: 3 },
  // Arrows loosed from a bow held over the head; every 5th aimed, x5, stunning at 8.
  ranger:   { name: 'Ranger',         ladder: 'ranger',   hit: 'ranger',   melee: false,
              every: 0.8, windup: 0.2, fly: 0.5, arc: P * 12, aimed: { every: 5, x: 5 }, capStun: 1 },
  // Daggers from close by: she comes in to `standoff` under the hide and,
  // once within `range` of that spot, drifts after the sway at `drift` of a
  // swim -- nearly still -- while each dagger travels.
  assassin: { name: 'Assassin',       ladder: 'assassin', hit: 'assassin', melee: true,
              every: 1.5, windup: 0.12, fly: 0.22, standoff: P * 7, range: P * 20, drift: 0.1,
              stunnedX: 3, execMost: 2, cap: { tail: 0.1, x: 3 } },
  // A hex bolt Weakens the heal; at rung 4 it Holds, at 8 Held takes more from blows.
  hexer:    { name: 'Hexer',          ladder: 'hexer',    hit: 'hexer',    melee: false,
              every: 5, windup: 0.3, fly: 0.6, weaken: { k: 0.3, s: 8 }, hold: 2, capAmp: 0.3 },
  // A thrown charge on the water's gravity; at rung 4 it sticks, ticks and blows
  // x3 and stuns, laying Exposed; at 8 two stick at once.
  sapper:   { name: 'Sapper',         ladder: 'sapper',   hit: 'sapper',   melee: false,
              every: 6, windup: 0.4, fly: 1.6, fuse: 3, stickyX: 3, exposed: 4, capCharges: 2,
              spread: 6 },
  // A held purple beam, ticking while held, then one finishing blow that can stun.
  // At rung 4 it widens and ramps the longer she holds it; at 8 it burns through
  // (the phase's half does not dim it).
  mage:     { name: 'Mage',           ladder: 'mage',     hit: 'mage',     melee: false,
              hold: 4, rest: 1.5, windup: 0.25, finishX: 3, rampMost: 2 },
  // Sings; the other fighters are Inspired while she does. No damage of her own.
  // Her ladder is written in percent (the rails say `%`); `pct` reads it as a share.
  bard:     { name: 'Bard',           ladder: 'bard',     hit: null,       melee: false, pct: true,
              linger: 0.25, anthemX: 2, capLinger: 6 },
};

// How close a melee fighter's body has to be to the hide to land a blow.
export const MELEE_REACH = P * 3;
// How far after its contact a swing's follow-through runs, a share of the
// wind-up: the drawing's recoil, and nothing lands in it.
export const FOLLOW_K = 1.2;
