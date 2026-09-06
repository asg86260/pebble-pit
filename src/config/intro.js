// --- the opening --------------------------------------------------------------
// Two squares stood on the bare ground talking, and then a rock. Long enough
// that you read it as two people rather than as a loading screen, short enough
// that nobody sits through it twice -- and it only ever happens once, on a game
// that has never been played. See intro.js.
// It is slow, and it is meant to be. The whole of it is over in twenty seconds
// and it only ever happens once, and what it is buying is the rest of the game
// having a reason in it -- so nothing in here is hurried.
export const INTRO_ZOOM = 2.4;    // how far in the view starts
export const INTRO_CHAT_MS = 9000;   // two of them, talking, before anything happens
export const INTRO_HEART_MS = 1900;  // and how often one of them says the other thing
export const INTRO_DOWN_MS = 2200;   // flat on its back after the rock lands
export const INTRO_UP_MS = 3400;     // and up, staring at it, while the view pulls out
// How long the crew stare at a rock that has just landed on the spot where one
// of their own is. The same beat the opening gives the body it threw clear, cut
// short: by the second rock it is a thing that happens rather than a thing that
// has just happened for the first time.
export const LAND_SAY_MS = 1600;
export const INTRO_BEAT = 900;    // between one of them saying something and the other
export const INTRO_APART = 20;    // and how far apart they stand, in world pixels
export const INTRO_HURL = 4.2;    // how hard the one left standing is thrown back
// And then it shows you the loop rather than telling you: a few swings at the
// rock, and one grain of it thrown into the hole. What is being shown is where
// dust goes, not how much of it there is -- and it is one throw rather than the
// walk it used to be, because the first half-minute of a game is not the place
// to watch somebody cross a yard twice. See `show` in intro.js.
export const INTRO_SHOW_DUST = 3;   // grains knocked off before it downs tools
export const INTRO_SHOW_MAX = 45000; // however long that takes, it is over by then
// --- and the second act -------------------------------------------------------
// The first rock comes off and they are together for a moment. It happens once,
// after the first one and never again: a beat you are shown twice is a beat, a
// beat you are shown every time is a loading screen. What it buys is the shape
// of the whole game in one go -- you got them out, and it did not last.
export const MEET_IN_MS = 1200;   // pulling back in on the two of them
export const MEET_MS = 5200;      // and how long they have
export const PART_MS = 2600;      // the rock again, and the view letting go

// wave7-sky (A2): the ground the reunion happens on. During the meeting the
// rest of the crew step this far clear of the buried square's spot -- the same
// duck they do out from under a falling rock -- instead of dancing, so nothing
// bounces through the pair and nothing rises under the moving camera.
export const MEET_CLEAR = 36;     // world pixels either side of the pair

// wave7-sky (A4): the buried square and a stray core. Once cores exist, a core
// that comes to rest within reach of the square's spot is fetched: the square
// walks over, picks it up, holds it a beat, and tosses it toward the hole the
// way the crew throw everything else. See `stepBuried` in intro.js.
// The spec's P * 12 was measured from the square itself, and no core can ever
// rest that close: `dropCore` throws every core clear of the footprint, and the
// footprint's half-width alone is past two hundred pixels by mid-game. So the
// reach is measured from the footprint's EDGE instead, and covers the throw
// (three to eleven cells past the lip) plus the bounce that follows it.
export const BURIED_REACH = 144;     // world pixels (P * 24) past the rock's edge
export const BURIED_HOLD_MS = 450;   // the beat between picking up and throwing
export const BURIED_TOSS_IN = 24;    // cells inside the pit's mouth the throw is aimed

// --- the casino ---------------------------------------------------------------
// The last thing on the ground, out past the lab. It is the far end of the walk
// on purpose: it is the one place in the yard that makes nothing, and a place
// that makes nothing should be a place you went to.
