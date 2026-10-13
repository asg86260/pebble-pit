// --- the party's classes (docs/wave-party.md, docs/serpent-classes.md section 0) ---
// Owned by track FIGHT. Every number a class needs lives here; the ten rows'
// tempos and move numbers are first guesses for the ladder book.
import { msg } from '../lang.js';
import { P } from './yard.js';

// A station kind's two classes: the fork its fighter comes to at FORK_RUNG
// (DESIGN.md, "A fighter branches at rung 4"). Below it the fighter is the
// kind's base unit, `BASES`, fighting as the pair's first class does.
export const PAIRS = {
  altar: ['brawler', 'sword'], well: ['monk', 'martial'], armory: ['ranger', 'assassin'],
  circle: ['hexer', 'sapper'], spire: ['mage', 'bard'],
};
export const BASES = { altar: msg('base-altar'), well: msg('base-well'), armory: msg('base-armory'), circle: msg('base-circle'), spire: msg('base-spire') };
// The first lot is one of these: each base unit does damage alone.
export const FIRST_KINDS = ['altar', 'armory', 'spire'];
// A class that does nothing with nobody beside it: its fork opens with a
// second station.
export const NEEDS_COMPANY = ['bard'];

// One row a class: name, ladder key (in LADDERS), the hit key (in
// DAMAGE_KIND), melee or not, and its tempo and move numbers. What a rung
// is worth -- a hit's damage, the beam's damage a second, the Bard's Inspired
// share -- is the class's ladder; everything here is the shape of the attack
// around that number. Times are seconds unless named `_ms`.
//
//   every    seconds between two attacks on average (Hasted shortens it)
//   rhythm   how those attacks are spaced (DESIGN.md, "A fighter's combo"):
//            `gaps` the gaps between the quick hits of a string, a share of
//            `every`, cycled; `pre` the gap before the big one of a combo
//            bar; a string without a bar resets after `string` hits. Each
//            quick gap banks what it saves, and the rest after the big one
//            or the string spends it all, so the average stays `every`
//   windup   seconds from the start of a swing to its contact: the pose the
//            drawing holds before the blow, and the blow lands at its end
//   fly      seconds a thrown or shot thing is in the water
export const MOVE_RUNG = 4, CAPSTONE_RUNG = 8;
// Every station's first fighter, before rung 1 picks its base unit (DESIGN.md,
// "Built first, a recruit, then two choices"): just the body, and a light
// punch -- `worthK` of the Brawler's rung 0, struck as the hand's punch.
// Not one of the ten: it has no ladder of its own and no fork.
export const RECRUIT = { name: msg('class-recruit'), ladder: 'brawler', worthK: 0.5, hit: 'punch', melee: true,
                         every: 1.6, windup: 0.18, rhythm: { gaps: [0.5], string: 2 } };
// The rung that picks the class: the move's, so the fork brings the move.
export const FORK_RUNG = MOVE_RUNG;
export const CLASSES = {
  // Heavy punches; every 4th a haymaker, x3; at the capstone the haymaker stuns.
  brawler:  { name: msg('class-brawler'),    ladder: 'brawler',  hit: 'brawler',  melee: true,
              every: 1.2, windup: 0.18, haymaker: { every: 4, x: 3 }, capStun: 1,
              rhythm: { gaps: [0.5], pre: 0.8, string: 3 } },
  // Cuts; at rung 4 each cut is a Whirlwind, x`whirl.x`, at 8 every 3rd lands
  // twice, the second landing leaving the serpent Bleeding.
  sword:    { name: msg('class-sword'),      ladder: 'sword',    hit: 'sword',    melee: true,
              every: 1.6, windup: 0.14, bleed: { dps: 0.3, s: 3 },
              whirl: { x: 1.8 }, capEvery: 3, rhythm: { gaps: [0.4], string: 2 } },
  // A palm wave from afar; each fills chi, and a full row is a chi palm, x3, that
  // stuns at the capstone.
  monk:     { name: msg('class-monk'),       ladder: 'monk',     hit: 'monk',     melee: false,
              every: 1, windup: 0.15, fly: 0.35, chi: { max: 5, fill: 1, moveFill: 2, x: 3 }, capStun: 1,
              rhythm: { gaps: [0.8], pre: 1.2 } },
  // Quick staff thrusts fill pips; a full row is one finisher blow.
  martial:  { name: msg('class-martial'),    ladder: 'martial',  hit: 'martial',  melee: true,
              every: 0.5, windup: 0.08, pips: { max: 5, fill: 1, moveFill: 2 }, finisherX: 1.5, capHaste: 1,
              rhythm: { gaps: [0.45], pre: 0.65 } },
  // Arrows loosed from a bow held over the head; every 5th aimed, x2, stunning at 8.
  ranger:   { name: msg('class-ranger'),     ladder: 'ranger',   hit: 'ranger',   melee: false,
              every: 0.8, windup: 0.2, fly: 0.5, aimed: { every: 5, x: 2 }, capStun: 1,
              rhythm: { gaps: [0.6, 0.6, 1.3], pre: 1.5, string: 3 } },
  // Daggers from close by: she comes in to `standoff` under the hide and,
  // once within `range` of that spot, drifts after the sway at `drift` of a
  // swim -- nearly still -- while each dagger travels. At the capstone each
  // dagger leaves the serpent Bleeding.
  assassin: { name: msg('class-assassin'),   ladder: 'assassin', hit: 'assassin', melee: true,
              every: 1.5, windup: 0.12, fly: 0.22, standoff: P * 7, range: P * 20, drift: 0.1,
              stunnedX: 3, execMost: 2, bleed: { dps: 0.3, s: 3 }, rhythm: { gaps: [0.35], string: 2 } },
  // A hex bolt; at rung 4 it Exposes the serpent, at 8 harder, and stops its window (Held)
  // and lays Exposed.
  hexer:    { name: msg('class-hexer'),      ladder: 'hexer',    hit: 'hexer',    melee: false,
              every: 5, windup: 0.3, fly: 0.6, expose: 8, hold: 2, exposed: 2 },
  // A thrown charge on the water's gravity; at rung 4 it sticks, ticks and blows
  // x3; at 8 two stick at once and their blow stuns. `pairX` is what each of
  // the pair hits for, of a lone charge, so two are not double.
  sapper:   { name: msg('class-sapper'),     ladder: 'sapper',   hit: 'sapper',   melee: false,
              every: 6, windup: 0.4, fly: 1.6, fuse: 3, stickyX: 3, capCharges: 2,
              pairX: 0.6 },
  // A held purple beam, ticking while held, then one finishing blow.
  // At rung 4 it widens and ramps the longer she holds it; at 8 it burns through
  // (the phase's half does not dim it).
  mage:     { name: msg('class-mage'),       ladder: 'mage',     hit: 'mage',     melee: false,
              hold: 4, rest: 1.5, windup: 0.25, finishX: 3, rampMost: 1.5 },
  // Sings; the other fighters are Inspired while she does, and at the capstone
  // Hasted. No damage of her own. Her ladder is written in percent (the rails
  // say `%`); `pct` reads it as a share. `linger` is how long either outlasts
  // a frame of her song.
  bard:     { name: msg('class-bard'),       ladder: 'bard',     hit: null,       melee: false, pct: true,
              linger: 0.25, anthemX: 2 },
};

// How close a melee fighter's body has to be to the hide to land a blow.
export const MELEE_REACH = P * 3;
// How far after its contact a swing's follow-through runs, a share of the
// wind-up: the drawing's recoil, and nothing lands in it.
export const FOLLOW_K = 1.2;
