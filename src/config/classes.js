// --- the party's classes (docs/wave-party.md, docs/serpent-classes.md section 0) ---
// Owned by track FIGHT. Every number a class needs lives here; the ten rows'
// tempos and move numbers are first guesses for the ladder book.
import { P } from './yard.js';

// A station kind's two classes: the Fire Emblem fork on the deep's floor.
export const PAIRS = {
  altar: ['brawler', 'sword'], well: ['monk', 'martial'], armory: ['ranger', 'assassin'],
  circle: ['hexer', 'sapper'], spire: ['mage', 'bard'],
};
// Before a second station stands, the first fighter is always a damage class.
export const STARTERS = ['brawler', 'ranger', 'mage'];
export const FIRST_KINDS = ['altar', 'armory', 'spire'];
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
export const CLASSES = {
  // Heavy punches; every 4th a haymaker, x4, that stuns (longer at the capstone).
  brawler:  { name: 'Brawler',        ladder: 'brawler',  hit: 'brawler',  melee: true,
              every: 1.2, windup: 0.18, haymaker: { every: 4, x: 4 }, capStun: 1.5 },
  // Cuts that bleed; at rung 4 each cut lands at three spots, at 8 every 3rd twice.
  sword:    { name: 'Swordsman',      ladder: 'sword',    hit: 'sword',    melee: true,
              every: 1, windup: 0.14, bleed: { dps: 0.3, s: 3 },
              whirl: { spots: 3, x: 0.6, spread: 4 }, capEvery: 3 },
  // A palm wave from afar; each fills chi, and a full row is a chi palm that stuns.
  monk:     { name: 'Monk',           ladder: 'monk',     hit: 'monk',     melee: false,
              every: 1, windup: 0.15, fly: 0.35, chi: { max: 5, fill: 1, moveFill: 2, x: 3 }, capStun: 1.5 },
  // Quick staff thrusts fill pips; a full row is one finisher blow.
  martial:  { name: 'Martial Artist', ladder: 'martial',  hit: 'martial',  melee: true,
              every: 1 / 3, windup: 0.08, pips: { max: 5, fill: 1, moveFill: 2 }, finisherX: 1.5, capHaste: 3 },
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
  bard:     { name: 'Bard',           ladder: 'bard',     hit: null,       melee: false,
              linger: 0.25, anthemX: 2, capLinger: 6 },
};

// How close a melee fighter's body has to be to the hide to land a blow.
export const MELEE_REACH = P * 3;
// How far after its contact a swing's follow-through runs, a share of the
// wind-up: the drawing's recoil, and nothing lands in it.
export const FOLLOW_K = 1.2;

// Until BOARD's ladders land (config/rungs.js keys each class by name), what a
// rung of each is worth, rung 0 to 8: a hit's damage (the Mage's a second,
// the Bard's the Inspired share). Read only where LADDERS has no row for the
// class. A damage a second of about 3, 5, 8, 12, 18, 28, 42, 64, 96 at each
// class's own tempo, so every class breaks the bare coil alone at rung 0.
// And until BOARD's floor slots land (`DEEP_SLOTS`, `slotX` in place.js),
// where each slot stands, a fraction of DEEP_W: the spec's own list.
// until merge
export const SLOTS_GUESS = [0.335, 0.475, 0.62, 0.76, 0.9, 0.405, 0.69];
// until merge
export const CLASS_LADDER_GUESS = {
  brawler:  [4, 6, 10, 14, 22, 34, 50, 77, 115],
  sword:    [3, 5, 8, 12, 18, 28, 42, 64, 96],
  monk:     [4, 6, 9, 13, 19, 29, 44, 66, 99],
  martial:  [1, 1.7, 2.7, 4, 6, 9.3, 14, 21, 32],
  ranger:   [2.4, 4, 6.4, 9.6, 14, 22, 34, 51, 77],
  assassin: [4.5, 7.5, 12, 18, 27, 42, 63, 96, 144],
  hexer:    [20, 32, 50, 75, 110, 170, 250, 380, 570],
  sapper:   [18, 30, 48, 72, 108, 168, 252, 384, 576],
  mage:     [3, 5, 8, 12, 18, 28, 42, 64, 96],
  bard:     [0.1, 0.11, 0.12, 0.13, 0.14, 0.16, 0.18, 0.2, 0.22],
};
