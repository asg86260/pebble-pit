// Every number that decides how the game looks and plays, and nothing that
// changes while it runs. If you are tuning the game, it is all in here.

export const P = 6;              // pixel size
export const TARGET = 1000000;   // dust in the hole: the whole point
// The place is built once and never moves. The pit floor sits on the bottom of
// the viewport, the ground line a fixed height above it, and the rock, the bench
// and the lip keep their distances. A bigger window is only more sky and more
// ground: the ground runs a long way either side of everything.
export const SKY = 2000;         // world above the ground line, so any window has sky
// Every site stands on the one ground line, measured out from the rock. The
// world runs away to the left as sites are unlocked, so walking further out is
// the progression. The bench, the lab and the pit sit to the right.
export const TO_CAVE = -900;     // rock centre to the mouth of the cave
export const TO_FARM = -1650;    // rock centre to the near edge of the farm
export const TO_BENCH = 420;     // rock centre to the bench
export const TO_LAB = 650;       // rock centre to the lab
export const TO_LEDGE = 900;     // rock centre to the lip of the pit
export const GROUND_LEFT = 2400; // ground running away to the left of everything
export const ROCK_W = 60;        // the rock is a hill: this wide in cells at rock 1
export const ROCK_H = 26;        // and this tall
export const ROCK_GROW_W = 4;    // each rock is a little broader than the last
export const ROCK_GROW_H = 2;    // and a little higher
export const ROCK_SINK = 0;      // its foot sits on the ground line, like everything else
export const ROCK_SKY = 340;     // sky kept clear above the ground for the rock to grow into
export const ROCK_CLEAR = 24;    // bare ground kept either side of the rock, so the spoil stands off it
export const PIT_H = 276;        // the pit is one fixed hole, in world pixels: this deep
export const PIT_W = 3624;       // and this wide
// What a grain in the pile is drawn at. A grain is always one dust; adding finer
// sizes here lets the pile settle to them as it fills, which is how the hole
// could be made to hold a million. For now it stays one size: dust in the pit
// looks like dust everywhere else, and the hole holds 27,784.
export const PIT_GRAINS = [P];
export const PIT_PAD = 18;       // cells of ground past its far edge, so you can see the end
export const FLOOR_MARGIN = 12;  // gap under the pit floor, at the bottom of the window
export const MAX_DEPTH = 6;      // sheets of rock a boulder can be thick
// A cell holds how much rock is still stacked there. Thick rock is dark, and it
// pales as you dig through it; an empty cell is the white page showing through.
// Swap these for hues to add colour.
export const SHADES = ['#8a8a8a', '#757575', '#5f5f5f', '#464646', '#2c2c2c', '#111111'];
export const CORE_CELL = SHADES.length + 1;   // a core sitting in a pile, among the dust
export const GRAV = 0.45;
export const BRUSH = 3;          // sweep radius, in cells
export const CORE_SIZE = P * 3;  // a core is a square this big
export const MINE_DELAY = 260;   // pause before a held click starts auto-mining
export const MINE_BASE = 460;    // gap between held hits at speed level 0
export const MINE_FLOOR = 75;    // fastest the pick will ever swing (13.3 px/s)
export const CAP_BASE = 1;       // pixels you can carry at level 0
export const CAP_STEP = 1;       // extra capacity per upgrade
export const WORKER = P * 3;     // worker square size
export const MINER_BASE = 1400;  // a hired miner starts slower than your own pick
export const MINER_FLOOR = 260;  // fastest a miner can swing
export const DRILL_BASE = 520;   // a driller bites faster than a chipper swings
export const DRILL_FLOOR = 90;
export const SPILL_ROW = 4;      // how high dust must be heaped at the ledge to topple in
export const HAUL_MS = 110;      // gap between grains a hauler scoops at pace 0
export const HAUL_BASE = 0.9;    // hauler walking speed, px per frame
