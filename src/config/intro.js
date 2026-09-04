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

// --- the casino ---------------------------------------------------------------
// The last thing on the ground, out past the lab. It is the far end of the walk
// on purpose: it is the one place in the yard that makes nothing, and a place
// that makes nothing should be a place you went to.
