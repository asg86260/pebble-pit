// Every number that decides how the game looks and plays, and nothing that
// changes while it runs. If you are tuning the game, it is all in here.

export const P = 6;              // pixel size, in world units
// How big a cell is drawn, in screen pixels. This is the whole of the zoom: the
// picture never scales to fit a window, so this is the size the game is, and
// turning it down shows more yard at once rather than rearranging anything.
// A cell still has to be a whole number of *device* pixels, so the screen's own
// ratio is rounded against this rather than against P.
export let CELL = 5;
export const TARGET = 1000000;   // dust in the hole: the whole point
// The place is built once and never moves. The pit floor sits on the bottom of
// the viewport, the ground line a fixed height above it, and the rock, the bench
// and the lip keep their distances. A bigger window is only more sky and more
// ground: the ground runs a long way either side of everything.
// The height the game asks for. The picture never scales to fit, so this is not
// a breakpoint -- it is what the yard needs to show the sky the rock and the
// rock stands in, the ground, and the whole depth of the pit. A shorter window
// loses sky off the top, which is the part with nothing in it, and eventually
// the top of the rock. It does not rearrange and it does not shrink.
export const MIN_H = 840;
export const SKY = 1998;         // world above the ground line, so any window has sky
// Every world coordinate below is a whole number of cells away from the last,
// SKY included. That is not tidiness: a cell is a whole number of device
// pixels, so a world position that is half a cell off lands the rock's rows
// between device pixels and the canvas antialiases a hairline into every
// seam between them. 1998 is 333 cells; 2000 was not a whole number of any.
// Every site stands on the one ground line, measured out from the rock. The
// world runs away to the left as sites are unlocked, so walking further out is
// the progression. The pit is the one fixed end, out to the right.
// Every station piles to its right, into a strip of ground of its own, and each
// strip has a size. So the world reads right to left from the hole everything
// ends up in: the pit; the rock's own spoil; the rock; the bench you buy at,
// stood just off its flank; then the quarry and what comes up it, the farm and
// its beds' crop, and the lab at the far end.
// The thing in the sky is **benched**: it is not in the game. It sheds nothing
// and cannot be clicked, because the sparks it used to give are gone, and a
// thing that hangs there doing nothing is a thing that raises a question the
// game has no answer to.
//
// It is kept rather than deleted, the way the million is: everything it needs is
// still here, and the dev panel has a switch that puts it back in the sky so it
// can be looked at. If it ever comes back for real it will need a reason to be
// there -- a place people go, or something worth walking out for.
export const TO_SKY = -1740;     // rock centre to the thing in the sky
export const SKY_UP = 460;       // and how far above the ground line it hangs
export const SKY_R = 46;
export const TO_FARM = -1956;    // rock centre to the near edge of the farm
export const TO_QUARRY = -1284;  // rock centre to the mouth of the quarry
// The bench stands just off the rock's left flank, between it and the quarry:
// the thing you buy at is the first thing out from the rock, and everything the
// cores open up lies further out again.
// The bench stands further off the flank than the rock needs it to. What is in
// the gap is where the crew live, and a block of shacks wants ground: at the
// biggest rock there is 240px of it between the bench and the rock's apron,
// which is forty cells and enough for a village rather than a chimney.
export const TO_BENCH = -612;    // rock centre to the bench
export const BENCH_W = P * 12;   // and how wide it stands
export const TO_LAB = -2184;     // rock centre to the lab, at the far end
export const TO_LEDGE = 840;     // rock centre to the lip of the pit
// The rock is the only thing left on this side, so the ground the bench and the
// lab used to stand on is its spoil's now: the pile runs out towards the lip and
// stops a sweep short of it, rather than ending in a stretch of bare ground.
export const ROCK_PILE_TO = 780; // and how far right the rock's own spoil may reach
export const PILE_GAP = 0;       // bare ground kept between a pile and the next station
// And bare ground kept between a station and the *start* of its own pile, so
// the heap stands off the thing that made it instead of burying it. The farm
// clears its last bed; the quarry clears the far ramp of the bridge, which
// comes down well past the mouth. The rock has ROCK_CLEAR for the same job.
// The farm's own heap has to clear its fence, not just its last bed, which is
// why this is more than FARM_GATE rather than measured off the beds.
export const PILE_STANDOFF = { farm: P * 9, quarry: P * 12 };
export const GROUND_LEFT = 2880; // ground running away to the left of everything
export const ROCK_W = 44;        // the rock is a hill: this wide in cells at rock 1
export const ROCK_H = 20;        // and this tall
export const ROCK_GROW_W = 3;    // each rock is a little broader than the last
export const ROCK_GROW_H = 1.4;  // and a little higher
export const ROCK_SINK = 0;      // its foot sits on the ground line, like everything else
export const ROCK_SKY = 520;     // sky kept clear above the ground line, for the rock
// Room either side of the works, so it is not flush against the window. It is
// part of the width the layout insists on showing at once, so it is also part
// of how far the picture is scaled down on a narrow window -- widening the
// world without taking it back scales the whole yard, counter and all.
export const SIDE_PAD = 160;
// Rocks go on for ever, so they must stop growing at some point or rock ninety
// would fill the sky. They plateau at about what the twelfth was.
export const ROCK_W_MAX = 92;
export const ROCK_H_MAX = 42;
export const ROCK_CLEAR = 24;    // bare ground kept either side of the rock, so the spoil stands off it
// A bank may stand this many cells high per cell of distance from the apron.
// Without it the apron is a cliff the sand cannot slump over, and the bank
// stands up against the rock as a sheer wall however tall it gets. 1.5 is the
// angle the sand finds on its own, so both faces of a heap read the same.
export let BANK_SLOPE = 1.5;
export const PIT_H = 276;        // the pit is one fixed hole, in world pixels: this deep
// And this much room above the brim. Once the hole itself is full the pile keeps
// going, heaping up over the mouth rather than stopping dead at the ground line
// -- but only over the mouth: it is the same bed of sand, which is only as wide
// as the hole, so it can rise but it can never get out onto the ground.
export const PIT_HEAP = 150;
// And how the surplus lies. Inside the hole the pile is level, because a hole
// fills up. Above the brim it is a heap: highest at the lip, where it is tipped
// in, leaning away down the length of the hole. Without that it fills the near
// end to the very top and stops dead, which is a wall rather than a pile.
export const PIT_HEAP_SLOPE = 0.12;   // rows of surplus lost per column along
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
// These stay grey on purpose: shade is how deep the rock was, and it is not
// free to mean anything else. Colour in this game belongs to the things that
// never came off the rock.
export const SHADES = ['#8a8a8a', '#757575', '#5f5f5f', '#464646', '#2c2c2c', '#111111'];
// Cells above the shades are not dust. They heap and are carried exactly like
// it -- a shard on the ground is a grain in the same bed, and a worker scooping
// a column picks it up without knowing what it is -- but they are counted as
// themselves when they land in the pit, and the pile draws them as their mark.
// How big a thing that is not dust is drawn, in world pixels. It occupies one
// cell and collides as one, but a cell is five screen pixels and a triangle five
// pixels across is a smudge -- so it is drawn a little larger than its cell,
// with the page showing through behind it. That white surround is what keeps two
// of them side by side readable as two things rather than one shape.
// A thing that is not dust is one cell, exactly like a grain of dust, because it
// *is* a grain of dust as far as the ground is concerned -- it falls, heaps,
// slumps, is scooped and is carried by the same code, and differs only in the
// mark drawn on it and what it is worth when it lands in the pit. Two systems
// that both mean "a thing in a pile" is one system too many, and every rule they
// did not share was a bug waiting: the ceiling, the lattice, the repose angle.
export const MARK_SIZE = P;
export const CORE_CELL = SHADES.length + 1;   // a core sitting in a pile, among the dust

// Each kind of find gets a run of cell values rather than one, because each
// grain carries its own tone: a heap of shards is a speckle of blues the way a
// heap of dust is a speckle of greys. The tone has to live in the cell and not
// be worked out from where the cell is -- a grain slides as the heap settles,
// and a grain that changed colour on its way down a slope would be a mess.
export const FIND_TONES = 4;
export const SHARD_CELL = CORE_CELL + 1;                  // and the three after it
export const SPORE_CELL = SHARD_CELL + FIND_TONES;
export const FIND_TOP = SPORE_CELL + FIND_TONES - 1;

// The first colour in the game, and the reason it goes here first: everything
// the *ground* makes is a grey, because grey is how deep the rock was. The
// things the sites give up are not dust and never came off the rock, so they are
// the one thing a colour can mean something about. And a solid coloured cell
// tiles a heap exactly the way a grey one does -- a triangle fills half its cell
// however neatly it stacks, so a heap of them is half air by geometry.
//
// Flat and strong, not pastel: this is a game of flat shapes on white paper.
export const FIND_COLOR = {
  [SHARD_CELL]: ['#5b83e0', '#3f68d4', '#2f5fd0', '#2748a4'],   // the quarry: a cold blue
  [SPORE_CELL]: ['#57c074', '#3aa957', '#2e9e4b', '#227b3a']    // the farm: green, it grew
};

// which kind a cell belongs to, and one of that kind with a tone of its own
export const findKind = v =>
  v >= SHARD_CELL && v <= FIND_TOP ? SHARD_CELL + Math.floor((v - SHARD_CELL) / FIND_TONES) * FIND_TONES : 0;
export const someFind = base => base + Math.floor(Math.random() * FIND_TONES);
export let GRAV = 0.45;
export const BRUSH = 3;          // sweep radius, in cells
export const CORE_SIZE = P * 3;  // a core is a square this big
export const MINE_DELAY = 260;   // pause before a held click starts auto-mining
export let MINE_BASE = 460;    // gap between held hits at speed level 0
export const MINE_FLOOR = 75;    // fastest the pick will ever swing (13.3 px/s)
export const CAP_BASE = 1;       // pixels you can carry at level 0
export const CAP_STEP = 1;       // extra capacity per upgrade
export const WORKER = P * 3;     // worker square size
export let MINER_BASE = 1100;  // a hired miner starts slower than your own pick
export const MINER_FLOOR = 260;  // fastest a miner can swing
// The yard runs from the mouth of the quarry to the lip of the pit, and heaped to
// the brim it holds about 10,100 grains -- the slope of the banks decides it,
// and it was measured, not guessed. The crew down tools a little short of that,
// so a chip is never told there is nowhere to put it. Two rocks' worth of spoil
// on the ground and everybody stops: another body on the rock is more dust
// lying about, and somebody still has to move it.
// What a pile may hold before the station behind it stops. The rock's strip
// holds a bit over two thousand grains at this slope, so it stops well short of
// physically full -- a chip is never told there is nowhere to put it, and a rock
// is more than one pile's worth, so a body on the rock is only worth having if
// somebody is carrying. The sites deal in ones, so theirs are counted in ones.
// What one find counts for against a pile's limit. The sites deal in ones and
// the rock deals in thousands, so a shard lying in the quarry's pile has to be
// worth more than the grain of dust it is sitting next to.
export const FIND_WEIGHT = 1;
// A site's strip is 420px, which is 35 bodies across and holds about 300 of them
// heaped. Twelve was a guess and it was a bad one: a station that stops after
// twelve is a station that is stopped nearly all the time. These are the same
// fraction of what the ground actually holds as the rock's is.
export const PILE_LIMIT = { rock: 1400, quarry: 180, farm: 180 };
// There is no hysteresis on a full pile, and it turns out there should not be.
// Any at all is a chore: at 0.95 you had to clear seventy grains before anybody
// picked up a pick again, and a sweep of the brush lifts a handful. A station
// stops when its pile is full and starts the moment there is room for one more,
// so at the limit the crew mine exactly as fast as the crew carry. That is not
// a stutter, it is the yard finding its level.
export const HAUL_MS = 110;      // gap between grains a hauler scoops at pace 0
export let HAUL_BASE = 0.9;    // hauler walking speed carrying a load, px per frame
export const HAUL_EMPTY = 1.6;   // and how much quicker it walks with its hands free

// --- between rocks ----------------------------------------------------------
// The last pixel of a boulder is the end of a long job, so it gets a beat. The
// crew take five on the bare ground, and the next rock comes down out of the sky
// rather than being there the next time you look.
export let DANCE_MS = 5000;    // how long the crew celebrate a finished rock
export const DANCE_BEAT = 2.6;   // hops a second, each one a beat behind the last
// How far up a new rock starts. It used to be this number flat, and this number
// is most of the way up a window rather than off the top of one -- so the rock
// appeared out of nothing in the middle of the sky and fell the second half of
// the way. It comes in over the top edge now, which means the drop is measured
// against the window rather than being one number: a tall window has to be
// cleared by more than a short one. This is the least it will ever be, for a
// window so short that the top edge is nearer than this.
export const ROCK_DROP = 620;    // world pixels above its place that a new rock starts
export const ROCK_DROP_CLEAR = 72;  // and how far above the top edge it waits, out of sight
export const DROP_GRAV = 0.7;    // a boulder comes down heavier than a chip does
export const JOLT_GRAINS = 30;   // grains the landing shakes off the banks
// And the view is knocked about by it. A rock coming down out of the sky used
// to arrive in silence: a few grains hopped off the banks and nothing else in
// the yard admitted anything had happened. The view rocks and settles, which is
// the only thing in the game that says how heavy the thing is.
export let SHAKE_LAND = 15;      // world pixels the landing throws the view
export const SHAKE_RATE = 0.9;   // radians a frame it rocks through
export const SHAKE_DECAY = 0.87; // and how much of the throw is left each frame
// Nothing is standing under it when it lands. The crew get out of the footprint
// while the last rock's celebration is on, and a body still in it once the rock
// is in the air walks out at a pace nobody walks anywhere else.
export const DUCK_PACE = 2.4;    // pixels a frame out from under a falling rock
// A stopped crew is not a frozen crew. When the pile is full the miners stand
// down and shift about on the spot -- slowly, and nothing like the dance, which
// is three hops a second.
export const IDLE_BEAT = 0.9;    // radians a second a stood-down miner sways through
export const IDLE_STRIDE = 0.37; // and how much slower it paces than it sways

// --- the quarry ---------------------------------------------------------------
// A mouth in the ground away to the left. Crew walk in, are gone a while, and
// come back out with a shard. The trip time is the whole of the mechanic: it is
// what an upgrade shortens, and what makes sending somebody in a decision.
export const QUARRY_W = 156;       // the mouth, in world pixels
export const QUARRY_H = 126;
// It is a worked cut, not a hole somebody cut with a square. Both walls come
// down in benches and the floor they leave is uneven, which is what months of
// working a face does to one. The shape is a pattern rather than a scatter: a
// quarry that reshuffled itself every frame would be a different quarry every
// time you looked at it, so this is worked out once and kept.
// Each bench is [how far in, how far down], as a share of the mouth. The drops
// are normalised, so they always land the last one exactly on the floor.
export const QUARRY_NEAR_BENCH = [[0.00, 0.30], [0.05, 0.22], [0.03, 0.20], [0.03, 0.28]];
export const QUARRY_FAR_BENCH = [[0.00, 0.36], [0.04, 0.24], [0.03, 0.22], [0.02, 0.18]];
export const QUARRY_FLOOR_STEP = 4;   // cells of floor per stretch
export const QUARRY_FLOOR_JAG = [0, 1, 2, 1, 0, 2, 1, 0];  // and cells of relief on each
// How often a quarrier swings, as opposed to how often the face gives anything
// up. They were the same number, so at pace 0 a worker hit the rock once every
// eleven seconds and stood there the rest of the time. A quarry should look
// busy whether or not it is being productive.
export const QUARRY_SWING = 620;
export const QUARRY_SHUFFLE = 0.35;   // and how fast it works along the face
export let QUARRY_BASE = 11000;  // a shard off the face at pace 0
export const QUARRY_FLOOR = 2200;  // the quickest a trip will ever be
export const QUARRY_WALK = 1.1;    // a quarrier's walking speed, px per frame

// --- the farm ---------------------------------------------------------------
// Beds out past the quarry. Nothing grows in them on its own: a farmhand stands
// at a bed and tends it, and it grows while tended. So the crop is the crew's
// attention, which is the same trade the quarry asks for in a different shape.
export const FARM_BEDS = 7;
export const FARM_GAP = 42;      // world pixels between one bed and the next
export const FARM_H = 54;        // how tall a ripe stalk stands
// Bare ground kept between the end bed and the post that brackets it. A fence
// standing right against the crop reads as a crop growing through a fence: the
// plot wants a margin, the way a picture wants one.
export const FARM_GATE = P * 6;
export let TEND_BASE = 9000;   // to bring one bed on at tending 0
export const TEND_FLOOR = 1800;
export const FARM_WALK = 1.1;
// A ripe bed is not cut the instant it ripens. The spore forms at the tip of
// the stalk and sits there long enough to be seen, and the farmhand takes it
// off from exactly where it grew.
// How often a farmhand stoops over the bed it is working. Like the quarry, this
// is nothing to do with how fast the crop comes on: a farm should look tended
// whether or not anything is ripening this second.
// --- the lab ----------------------------------------------------------------
// Research is not bought, it is *worked*. Paying for it starts it; what finishes
// it is bodies standing in the lab, and nothing else -- an empty lab makes no
// progress at all, however much you have paid. So the lab competes for the crew
// with the rock, the quarry and the beds, which is the only real question this
// game asks.
export const LAB_EFFORT = 1;      // a worker does one second of work a second
export let LAB_WORK = 45;         // and this many worker-seconds finishes a piece
// The crew go *inside* the lab, so there is nothing to watch. What tells you it
// is being worked is the chimney: it smokes while somebody is in there on a
// piece of research, and harder the more of them there are. An idle lab, or a
// lab with research paid for and nobody in it, does not smoke at all.
export const SMOKE_MS = 380;      // between puffs, with one body in there
export const SMOKE_LIFE = 2.4;    // seconds a puff lasts
export const SMOKE_RISE = 0.4;    // and how fast it goes up

// --- the sky ----------------------------------------------------------------
// Clouds and birds, and nothing else up there. They are the far end of the
// parallax the dust already does close up, and they are deliberately faint: a
// cloud is two greys well lighter than the lightest rock shade, because the six
// shades mean depth of rock and nothing in the sky is allowed to borrow them.
export const CLOUDS_WANTED = 5;   // how many are kept in the strip of sky in view
export const CLOUD_TONE = '#efefef';
export const CLOUD_UNDER = '#e3e3e3';   // the bottom bar, so a cloud has an underside
export const CLOUD_DRIFT = 0.05;  // world pixels a frame, before its depth is taken off
export const BIRD_TONE = '#5f5f5f';
export const BIRD_GAP = 26000;    // milliseconds between one lot of birds and the next
export const BIRD_FLOCK = 4;      // at most this many in a lot
// A bird can be clicked, and shakes a few grains loose as it bolts. It is the
// one thing in the sky you can touch, and the amount is deliberately small: it
// is a thing to notice, not a thing to farm -- they cross when they cross, and
// no upgrade has anything to say about them.
export const BIRD_REACH = P * 5;  // how near the click has to be, in world pixels
export const BIRD_DUST = 5;       // grains shaken loose
export const BIRD_BOLT = 1.5;     // and how much the rest of the lot quicken
export const BIRD_SPEED = 1.6;    // world pixels a frame: a lot crosses the view in about a quarter of a minute

export const TEND_STOOP = 780;
export let CUT_MS = 700;

// --- the air ----------------------------------------------------------------
// Nothing stands in the background of this game: no hills, no clouds, no
// furniture of any kind. So the dust hanging in the air is load-bearing rather
// than decorative -- it is the only thing the view has to move against, and the
// only thing keeping a yard nobody is working in from reading as a still
// picture.
//
// It hangs in three bands at different distances. One number sets everything
// about a band at once, because that is what distance does: the far ones are
// pale, small, slow, and barely take the camera's movement at all; the near
// ones are darker, bigger, and sweep past. Splitting those apart only lets a
// band drift out of agreement with itself.
export const AIR_BANDS = [
  //  take: the share of the camera's movement the band takes, 1 being the yard itself
  { take: 0.20, size: 1, pace: 0.35, share: 0.44, front: false },
  { take: 0.46, size: 2, pace: 0.62, share: 0.36, front: false },
  // the near band is drawn *over* the world rather than behind it, which is the
  // whole of why the yard has any depth: dust passes in front of the rock
  { take: 0.90, size: 3, pace: 1.00, share: 0.20, front: true }
];
// A mote is the colour of whatever kicked it up. The yard's own dust is grey,
// what hangs over the quarry is the shard's blue and what comes off the beds is
// the spore's green -- so the far end of the yard reads as its own place from
// across the world, before you can make out anything standing in it.
//
// One tone per band, in the same order: a mote further back is paler, whatever
// it is made of, because that is what makes the bands read as depth rather than
// as three sizes of speck. The colours are the pale end of the same two hues the
// shards and spores are drawn in, so the air over a site and the stuff that
// comes out of it are plainly the same material.
export const AIR_KINDS = ['dust', 'shard', 'spore'];
export const AIR_TINTS = {
  dust:  ['#dedede', '#c2c2c2', '#a6a6a6'],
  shard: ['#ccd8f4', '#a8bce9', '#8aa2dc'],
  spore: ['#cfe8d7', '#a4d2b2', '#80bf93']
};
export const AIR_FLOOR = 95;      // motes over a bare yard, before anything is lying about
export const AIR_PER_DUST = 22;   // and one more for every this much dust on the ground
export const AIR_CAP = 420;       // however much is lying about
export const AIR_RISE = 0.10;     // screen pixels a mote climbs in a frame
export const AIR_SINK = 0.06;     // and the heavier grit that goes the other way
export const AIR_GRIT = 0.16;     // the share of the air that is that grit
export const AIR_SITE = 0.35;     // share of new motes that come off an open site in view
export const AIR_SITE_UP = P * 10;  // and how high above the ground line they are born
export const AIR_WOBBLE = 0.16;   // how far a mote swims either side of its drift
export const AIR_GUST = 0.34;     // and the wind the whole field leans on
export const AIR_GUST_MS = 9000;  // the slower of the two swings the wind is made of
export const AIR_LOW = 0.6;       // share of the air that hangs low, near the ground
export const AIR_LOW_BAND = 260;  // how far above the ground line "low" reaches

// --- turning the knobs ------------------------------------------------------
// A handful of these are `let` rather than `const` so a dev panel can move them
// while the game is running. Modules import the binding, not a copy, so a change
// here is a change everywhere the moment it is made -- which is the whole point:
// the way to find a good number is to sit with the game and push it about.
//
// Nothing outside this file writes them. `tune` is the only door in, and the
// panel builds itself out of TUNABLE rather than knowing any of them by name.
export const TUNABLE = [
  { key: 'CELL', label: 'zoom', min: 3, max: 10, step: 1, layout: true },
  { key: 'BANK_SLOPE', label: 'pile slope', min: 0.4, max: 4, step: 0.1 },
  { key: 'GRAV', label: 'gravity', min: 0.1, max: 1.5, step: 0.05 },
  { key: 'MINE_BASE', label: 'your swing', min: 60, max: 1200, step: 20 },
  { key: 'MINER_BASE', label: 'miner swing', min: 60, max: 2000, step: 20 },
  { key: 'HAUL_BASE', label: 'carry pace', min: 0.2, max: 6, step: 0.1 },
  { key: 'QUARRY_BASE', label: 'quarry pace', min: 200, max: 20000, step: 200 },
  { key: 'TEND_BASE', label: 'tending', min: 200, max: 20000, step: 200 },
  { key: 'CUT_MS', label: 'time to cut', min: 0, max: 3000, step: 50 },
  { key: 'LAB_WORK', label: 'research effort', min: 5, max: 300, step: 5 },
  { key: 'DANCE_MS', label: 'the dance', min: 0, max: 12000, step: 250 },
  { key: 'SHAKE_LAND', label: 'landing shake', min: 0, max: 40, step: 1 },
  { key: 'PILE_LIMIT.rock', label: 'rock pile holds', min: 50, max: 3000, step: 50 },
  { key: 'PILE_LIMIT.quarry', label: 'quarry pile holds', min: 4, max: 400, step: 4 },
  { key: 'PILE_LIMIT.farm', label: 'farm pile holds', min: 4, max: 400, step: 4 }
];

export function tuned(key) {
  switch (key) {
    case 'CELL': return CELL;
    case 'BANK_SLOPE': return BANK_SLOPE;
    case 'GRAV': return GRAV;
    case 'MINE_BASE': return MINE_BASE;
    case 'MINER_BASE': return MINER_BASE;
    case 'HAUL_BASE': return HAUL_BASE;
    case 'QUARRY_BASE': return QUARRY_BASE;
    case 'TEND_BASE': return TEND_BASE;
    case 'CUT_MS': return CUT_MS;
    case 'LAB_WORK': return LAB_WORK;
    case 'DANCE_MS': return DANCE_MS;
    case 'SHAKE_LAND': return SHAKE_LAND;
    default: return PILE_LIMIT[key.split('.')[1]];
  }
}

export function tune(key, v) {
  switch (key) {
    case 'CELL': CELL = v; break;
    case 'BANK_SLOPE': BANK_SLOPE = v; break;
    case 'GRAV': GRAV = v; break;
    case 'MINE_BASE': MINE_BASE = v; break;
    case 'MINER_BASE': MINER_BASE = v; break;
    case 'HAUL_BASE': HAUL_BASE = v; break;
    case 'QUARRY_BASE': QUARRY_BASE = v; break;
    case 'TEND_BASE': TEND_BASE = v; break;
    case 'CUT_MS': CUT_MS = v; break;
    case 'LAB_WORK': LAB_WORK = v; break;
    case 'DANCE_MS': DANCE_MS = v; break;
    case 'SHAKE_LAND': SHAKE_LAND = v; break;
    default: PILE_LIMIT[key.split('.')[1]] = v;
  }
  return tuned(key);
}

// --- Track HOUSE -------------------------------------------------------------
// Where the crew live: a shack per body, on the bare ground between the bench
// and the rock. The bench was moved out to make this strip -- at the biggest
// rock there are 240px of it, and the block is sized to that rather than to the
// room it has at rock one, because the rock grows into this ground and the
// shacks may not be standing in it when it does.
export const HOUSE_TO = -420;      // rock centre to the middle of the plot
export const HOUSE_CUBE = P * 3;   // one body, one shack, the size of the body
export const HOUSE_COLS = 6;       // and this many abreast before the block goes up
// How far a shack sits off true, so a row of them is not a row of identical
// boxes. A whole cell, because everything in this yard stands on the lattice
// and half a cell puts a hairline down the wall -- enough to read as thrown up
// by the people living in them, not so much that the block stops being a block.
export const HOUSE_WONK = P;
export const HOUSE_LINE = 2;       // walls and roof, drawn at the ground line's weight
// --- Track TRAVEL: a body walks to its work ---------------------------------

// Moving somebody between jobs is not sacking one and hiring another: the same
// body walks over, and this is the pace it goes at.
//
// It was 0.9 first, which was a tax nobody had costed: the yard is 3600px
// across, so the lab to the pit was a sixty-five second walk and moving one body
// was a minute of watching it. Reading it off the crew's own legs
// (`haulSpeed() * HAUL_EMPTY`) was tried next and went the other way -- a crew
// with the pace upgrade bought crossed the whole world in a blink, which is the
// popping this was built to get rid of, arriving by another road. So: a number,
// the same for everybody all game, fast enough not to be a chore and slow enough
// that you watch somebody go.
export const COMMUTE_PACE = 2.4;
// Near enough to have arrived. A station is a place rather than a pixel, and a
// body made to land exactly on one would shuffle on the spot for ever.
export const COMMUTE_SLOP = P * 2;
// How fast a body gets down into the cut and back out of it again. Going to work
// somewhere else starts with getting up to the level of the ground, and it has
// to be the same number at both ends of that trip or a quarrier climbs out
// faster than it climbed in.
export const CLIMB_PACE = QUARRY_WALK * 2;
// How long a lab with nothing to research keeps somebody standing in it before
// they let themselves out and go back to carrying dust.
//
// Twenty seconds, not four. Four was long enough to prove the rule and far too
// short to play with: staffing the lab and then starting the work is the
// obvious order to do it in, and the walk over is twenty seconds by itself, so
// a body sent to an empty lab turned round and left before the player could open
// the board and pay for anything. This is the grace to get the work started.
export const LAB_IDLE_MS = 20000;
// --- Track PILES ------------------------------------------------------------
// How wide a station's own heap stands, in cells. A pile you cannot read is a
// number you have to go and look up: 180 grains along seventy cells lie two
// deep, and two deep looks the same at a quarter full as at the limit. So a
// site's strip is only as wide as its limit needs. At a slope of BANK_SLOPE a
// triangular heap of n grains wants a base of about sqrt(4n / slope) cells --
// the area of a triangle, read backwards -- and a strip that wide fills to a
// crest just as the limit is reached.
//
// Rounded up, and that rounding is also the headroom. A column may not stand at
// a fraction of a cell, so every one of them holds a little more than the ideal
// triangle wants: 180 grains go into 187 cells of room here, which leaves the
// half-dozen still in the air when the station stops somewhere to land.
//
// The rock is not in here on purpose. Its spoil is a long bank of dust running
// out to the lip of the pit, and a bank is what it should look like.
export const heapBase = key => Math.ceil(Math.sqrt(4 * PILE_LIMIT[key] / BANK_SLOPE));
