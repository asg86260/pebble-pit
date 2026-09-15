// --- the opening --------------------------------------------------------------
// Two squares stood on the bare ground talking, and then a rock. It only ever
// happens once, on a game that has never been played, and nothing in it is
// hurried: what it is buying is the rest of the game having a reason in it.
// See intro.js.
export const INTRO_ZOOM = 2.4;    // how far in the view starts
export const INTRO_CHAT_MS = 9000;   // two of them, talking, before anything happens
export const INTRO_HEART_MS = 1900;  // and how often one of them says the other thing
export const INTRO_DOWN_MS = 2200;   // flat on its back after the rock lands
export const INTRO_UP_MS = 3400;     // and up, staring at it, while the view pulls out
// How long the crew stare at a rock that has just landed on the spot where one
// of their own is. The opening's beat, cut short: by the second rock it is a
// thing that happens rather than a thing that has just happened for the first
// time.
export const LAND_SAY_MS = 1600;
export const INTRO_BEAT = 900;    // between one of them saying something and the other
export const INTRO_APART = 20;    // and how far apart they stand, in world pixels
export const INTRO_HURL = 4.2;    // how hard the one left standing is thrown back
// Then it shows you the loop: a few swings at the rock, and one grain of it
// thrown into the hole. One throw rather than a walk, because the first
// half-minute is not the place to watch somebody cross a yard twice. See
// `show` in intro.js.
export const INTRO_SHOW_DUST = 3;   // grains knocked off before it downs tools
export const INTRO_SHOW_MAX = 45000; // however long that takes, it is over by then
// --- and the second act -------------------------------------------------------
// The first rock comes off and they are together for a moment, once and never
// again: a beat you are shown every time is a loading screen.
export const MEET_IN_MS = 1200;   // pulling back in on the two of them
export const MEET_MS = 5200;      // and how long they have
export const PART_MS = 2600;      // the rock again, and the view letting go

// During the meeting the rest of the crew step this far clear of the buried
// square's spot -- the same duck they do out from under a falling rock --
// instead of dancing, so nothing bounces through the pair under the moving
// camera.
export const MEET_CLEAR = 36;     // world pixels either side of the pair

// The one under the rock is lodged in the ground. Between rocks somebody digs
// at it and it comes up a little; then the next rock drives it back in. The
// dig is longer than any gap the rocks leave (the dance is five seconds, the
// reunion little more), so nobody ever gets it out between rocks, and only a
// rock held overhead gives the time. See `stepBuried` and `stepDig` in
// intro.js.
export const BURIED_SUNK_C = 2;        // cells of the square under the ground line, of its three
export const BURIED_DIRT_TONE = 2;     // the shade the ground heaped against it centers on, in SHADES
export const BURIED_DIG_S = 10;        // seconds of somebody digging before it can climb out
export const BURIED_DIG_BEAT_MS = 420; // between swings; each one throws a cell of ground on to the heap
export const BURIED_DIG_LONE = 0.5;    // and how fast it works itself loose if nobody can come, as a share of a digger
// A digger is in the middle of the footprint, and a rock falls faster than a
// body can walk out of one, so it downs tools while the dance still has the
// length of its walk out left, plus this.
export const BURIED_DIG_LEAD_MS = 400;
