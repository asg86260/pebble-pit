// Every number that decides how the game looks and plays, and nothing that
// changes while it runs. If you are tuning the game, it is all in here.

export const P = 6;              // pixel size
export const TARGET = 1000000;   // dust in the hole: the whole point
// The place is built once and never moves. The pit floor sits on the bottom of
// the viewport, the ground line a fixed height above it, and the rock, the bench
// and the lip keep their distances. A bigger window is only more sky and more
// ground: the ground runs a long way either side of everything.
export const SKY = 1998;         // world above the ground line, so any window has sky
// Every world coordinate below is a whole number of cells away from the last,
// SKY included. That is not tidiness: a cell is a whole number of device
// pixels, so a world position that is half a cell off lands the rock's rows
// between device pixels and the canvas antialiases a hairline into every
// seam between them. 1998 is 333 cells; 2000 was not a whole number of any.
// Every site stands on the one ground line, measured out from the rock. The
// world runs away to the left as sites are unlocked, so walking further out is
// the progression. The bench, the lab and the pit sit to the right.
export const TO_CAVE = -900;     // rock centre to the mouth of the cave
export const TO_FARM = -1650;    // rock centre to the near edge of the farm
export const TO_BENCH = 420;     // rock centre to the bench
export const TO_LAB = 648;       // rock centre to the lab
export const TO_LEDGE = 900;     // rock centre to the lip of the pit
export const GROUND_LEFT = 2400; // ground running away to the left of everything
export const ROCK_W = 44;        // the rock is a hill: this wide in cells at rock 1
export const ROCK_H = 20;        // and this tall
export const ROCK_GROW_W = 3;    // each rock is a little broader than the last
export const ROCK_GROW_H = 1.4;  // and a little higher
export const ROCK_SINK = 0;      // its foot sits on the ground line, like everything else
export const ROCK_SKY = 520;     // sky kept clear above the ground, for the rock and the meteor
export const SIDE_PAD = 340;     // and room either side of the works, so it is not flush
// Rocks go on for ever, so they must stop growing at some point or rock ninety
// would fill the sky. They plateau at about what the twelfth was.
export const ROCK_W_MAX = 92;
export const ROCK_H_MAX = 42;
export const ROCK_CLEAR = 24;    // bare ground kept either side of the rock, so the spoil stands off it
// A bank may stand this many cells high per cell of distance from the apron.
// Without it the apron is a cliff the sand cannot slump over, and the bank
// stands up against the rock as a sheer wall however tall it gets. 1.5 is the
// angle the sand finds on its own, so both faces of a heap read the same.
export const BANK_SLOPE = 1.5;
export const PIT_H = 276;        // the pit is one fixed hole, in world pixels: this deep
export const PIT_W = 3624;       // and this wide
// What a grain in the pile is drawn at. A grain is always one dust; adding finer
// sizes here lets the pile settle to them as it fills, which is how the hole
// could be made to hold a million. For now it stays one size: dust in the pit
// looks like dust everywhere else, and the hole holds 27,784.
export const PIT_GRAINS = [P];
export const PIT_PAD = 18;       // cells of ground past its far edge, so you can see the end
export const FLOOR_MARGIN = 12;  // gap under the pit floor, at the bottom of the window
// how many device pixels we are willing to fill a frame, before backing the
// resolution off. A phone at three to one is about three million
export const DEVICE_PIXELS = 9e6;
// cells of sand any one grid is allowed to look at in a frame. The ground can
// hold a hundred thousand and the pit a million; walking either every frame is
// the most expensive thing in the game, and settling a band at a time is free
export const SETTLE_BUDGET = 40000;
export const MAX_DEPTH = 6;      // sheets of rock a boulder can be thick
// A cell holds how much rock is still stacked there. Thick rock is dark, and it
// pales as you dig through it; an empty cell is the white page showing through.
// Swap these for hues to add colour.
export const SHADES = ['#8a8a8a', '#757575', '#5f5f5f', '#464646', '#2c2c2c', '#111111'];
// Cells above the shades are not dust. They heap and are carried exactly like
// it -- a shard on the ground is a grain in the same bed, and a worker scooping
// a column picks it up without knowing what it is -- but they are counted as
// themselves when they land in the pit, and the pile draws them as their mark.
export const CORE_CELL = SHADES.length + 1;   // a core sitting in a pile, among the dust
export const SHARD_CELL = SHADES.length + 2;
export const SPORE_CELL = SHADES.length + 3;
export const SPARK_CELL = SHADES.length + 4;
export const GRAV = 0.45;
export const BRUSH = 3;          // sweep radius, in cells
export const CORE_SIZE = P * 3;  // a core is a square this big
export const MINE_DELAY = 260;   // pause before a held click starts auto-mining
export const MINE_BASE = 460;    // gap between held hits at speed level 0
export const MINE_FLOOR = 75;    // fastest the pick will ever swing (13.3 px/s)
export const CAP_BASE = 1;       // pixels you can carry at level 0
export const CAP_STEP = 1;       // extra capacity per upgrade
export const WORKER = P * 3;     // worker square size
export const MINER_BASE = 1100;  // a hired miner starts slower than your own pick
export const MINER_FLOOR = 260;  // fastest a miner can swing
// The yard runs from the mouth of the cave to the lip of the pit, and heaped to
// the brim it holds about 10,100 grains -- the slope of the banks decides it,
// and it was measured, not guessed. The crew down tools a little short of that,
// so a chip is never told there is nowhere to put it. Two rocks' worth of spoil
// on the ground and everybody stops: another body on the rock is more dust
// lying about, and somebody still has to move it.
export const GROUND_FULL = 9000;    // grains lying about before the crew stop
export const GROUND_CLEAR = 7500;   // and how far it has to come down before they start again
export const HAUL_MS = 110;      // gap between grains a hauler scoops at pace 0
export const HAUL_BASE = 0.9;    // hauler walking speed carrying a load, px per frame
export const HAUL_EMPTY = 1.6;   // and how much quicker it walks with its hands free

// --- between rocks ----------------------------------------------------------
// The last pixel of a boulder is the end of a long job, so it gets a beat. The
// crew take five on the bare ground, and the next rock comes down out of the sky
// rather than being there the next time you look.
export const DANCE_MS = 5000;    // how long the crew celebrate a finished rock
export const DANCE_BEAT = 2.6;   // hops a second, each one a beat behind the last
export const ROCK_DROP = 620;    // world pixels above its place that a new rock starts
export const DROP_GRAV = 0.7;    // a boulder comes down heavier than a chip does
export const JOLT_GRAINS = 30;   // grains the landing shakes off the banks

// --- the cave ---------------------------------------------------------------
// A mouth in the ground away to the left. Crew walk in, are gone a while, and
// come back out with a shard. The trip time is the whole of the mechanic: it is
// what an upgrade shortens, and what makes sending somebody in a decision.
export const CAVE_W = 108;       // the mouth, in world pixels
export const CAVE_H = 78;
export const CAVE_BASE = 11000;  // a trip at pace 0
export const CAVE_FLOOR = 2200;  // the quickest a trip will ever be
export const CAVE_WALK = 1.1;    // a spelunker's walking speed, px per frame

// --- the farm ---------------------------------------------------------------
// Beds out past the cave. Nothing grows in them on its own: a farmhand stands
// at a bed and tends it, and it grows while tended. So the crop is the crew's
// attention, which is the same trade the cave asks for in a different shape.
export const FARM_BEDS = 7;
export const FARM_GAP = 42;      // world pixels between one bed and the next
export const FARM_H = 54;        // how tall a ripe stalk stands
export const TEND_BASE = 9000;   // to bring one bed on at tending 0
export const TEND_FLOOR = 1800;
export const FARM_WALK = 1.1;

// --- the meteor -------------------------------------------------------------
// It hangs in the sky over the yard and sheds a spark now and then. Sparks are
// rare and buy one thing, at the lab: pace on everything at once.
export const TO_METEOR = 138;    // rock centre to the meteor, sideways
export const METEOR_UP = 420;    // and how far above the ground line it hangs
export const METEOR_R = 46;
export const SPARK_BASE = 42000; // between sparks, at spark 0
export const SPARK_FLOOR = 9000;
