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
// its plots' crop, and the lab at the far end.
// The thing in the sky is the meteor, and it has its reason to be there now: it
// was benched for want of one -- it shed sparks nobody had a use for, and a
// thing that hangs over the yard doing nothing raises a question the game
// cannot answer. What it needed was somebody to go and work it, and that is
// what the tower is for. See meteor.js.
// Rock centre to the thing in the sky. Out past the tower, at the far end of the
// walk: the tower is what calls it down and what makes the body that can reach
// it, so the two of them belong within sight of each other -- and a wizard
// coming out of the tower door with its hat on has a few steps to take rather
// than the length of the yard. It used to hang over the middle of the works,
// which put it above the quarry for no reason anybody could have told you.
export const TO_SKY = -3468;
export const SKY_UP = 460;       // and how far above the ground line it hangs
export const SKY_R = 46;
export const TO_FARM = -2106;    // rock centre to the near edge of the farm
export const TO_QUARRY = -1434;  // rock centre to the mouth of the quarry
// The bench stands just off the rock's left flank, between it and the quarry:
// the thing you buy at is the first thing out from the rock, and everything the
// cores open up lies further out again.
//
// The bench is the nearer of the two. It used to stand out past the crew's
// block, with the shacks in the gap between it and the apron -- the same strip
// of ground, in the other order. Where somebody lives is further from the rock
// than where they buy a pick: you walk out through the yard to the houses and
// back in to the bench, rather than past your own front door to get to the shop.
// The strip is the same width and the two things standing in it have changed
// places.
//
// The bench sits in the middle of what is left: sixty pixels of bare ground to
// the crew's block on one side and sixty to the rock's apron on the other. It
// stood hard against the houses with all the slack on the rock's side, which
// read as the bench having been pushed out of the way rather than stood
// somewhere. What that costs is rock: the biggest rock is measured off the
// bench -- it keeps a hand's width clear of it and stops growing there -- so
// moving the bench out brings the last rock in with it, from 76 cells across to
// 60. The yard reading right is worth the sixteen cells.
export const TO_BENCH = -336;    // rock centre to the bench
export const BENCH_W = P * 12;   // and how wide it stands
export const TO_LAB = -2334;     // rock centre to the lab, at the far end

// The dev panel's rows for the knobs above. A row lives beside the binding it
// moves because nothing but this file can assign to one: an imported `let` is
// read-only everywhere else, so the get/set pair has to be written where the
// `let` is. config.js gathers every file's rows into one TUNABLE.
export const YARD_KNOBS = [
  { key: 'CELL', label: 'zoom', min: 3, max: 10, step: 1, layout: true,
    get: () => CELL, set: v => { CELL = v; } }
];
