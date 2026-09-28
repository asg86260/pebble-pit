// --- the party's classes (docs/wave-party.md, docs/serpent-classes.md section 0) ---
// Owned by track FIGHT. Every number a class needs lives here; the ten rows'
// tempos and move numbers are first guesses for the ladder book.

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

// One row a class. FIGHT fills in the tempos and move numbers; the shape is
// the seam every track reads: name, ladder key (in LADDERS), the hit key
// (in SERPENT_DEFENSE), melee or not, and the rung its move and capstone
// open at.
export const MOVE_RUNG = 4, CAPSTONE_RUNG = 8;
export const CLASSES = {
  brawler:  { name: 'Brawler',        ladder: 'brawler',  hit: 'brawler',  melee: true },
  sword:    { name: 'Swordsman',      ladder: 'sword',    hit: 'sword',    melee: true },
  monk:     { name: 'Monk',           ladder: 'monk',     hit: 'monk',     melee: false },
  martial:  { name: 'Martial Artist', ladder: 'martial',  hit: 'martial',  melee: true },
  ranger:   { name: 'Ranger',         ladder: 'ranger',   hit: 'ranger',   melee: false },
  assassin: { name: 'Assassin',       ladder: 'assassin', hit: 'assassin', melee: true },
  hexer:    { name: 'Hexer',          ladder: 'hexer',    hit: 'hexer',    melee: false },
  sapper:   { name: 'Sapper',         ladder: 'sapper',   hit: 'sapper',   melee: false },
  mage:     { name: 'Mage',           ladder: 'mage',     hit: 'mage',     melee: false },
  bard:     { name: 'Bard',           ladder: 'bard',     hit: null,       melee: false },
};
