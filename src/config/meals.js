import { MECHANICS, ORB_BOLT_S } from './deep.js';

// The serpent eats to heal (DESIGN.md, "The serpent heals whole: a phase is a
// window"): when a phase's window has run, it takes the nearest creature
// swimming the deep with its constrict and heals to full. Times are seconds,
// lengths cells; the meal itself is stepped in deep/meals.js and drawn in
// render/serpent.js.

// A meal is the constrict aimed at a creature (the owner's B, "drag",
// docs/mocks/serpent-constrict-meal-2026-10-15.html, 2026-10-15): the comb
// lights head first through the orb's own warning (MECHANICS' orb `warn`),
// the bolts leave the lit tips for ORB_BOLT_S while the orb closes round it,
// then the orb is hauled to the mouth, the jaws take it over MEAL_GULP_S and
// the swallow runs to the belly over MEAL_SWALLOW_S, where the heal lands.
export const MEAL_WARN_S = MECHANICS.find(m => m && m.kind === 'orb').warn;
export const MEAL_GULP_S = 0.6;
export const MEAL_SWALLOW_S = 2.4;
// The haul: `base` seconds and one more for every `per` cells it has to come,
// held between `min` and `max`, so a creature beside the head is not snapped
// in and one across the deep is not dragged for longer than the shortest
// window can spare.
export const MEAL_REEL = { base: 1, per: 40, min: 1.6, max: 4.5 };
// The meal starts this long before the window is up, so it lands near the
// window's end as the stream's did: the warning, the bolts, the gulp and the
// swallow, and a middling haul (its spread is the landing's, a second and a
// half either way).
export const MEAL_LEAD_S = MEAL_WARN_S + ORB_BOLT_S + MEAL_GULP_S + MEAL_SWALLOW_S + (MEAL_REEL.min + MEAL_REEL.max) / 2;
// Where the orb is hauled to: this many cells off the snout's tip along the
// mouth's line (the orb's own radius and one); and on the way it swings out
// past the mouth and up, through a point MEAL_SWING[0] cells beyond the
// nearer of the two ends and MEAL_SWING[1] over the higher, so it comes in to
// the jaws from in front rather than through the neck.
export const MEAL_FRONT = 6;
export const MEAL_SWING = [14, 16];
// The orb shrinks in held steps as it nears the mouth, squeezing the creature
// with it: [share of the haul, radius in cells] from that share on. The gulp
// is at the last.
export const MEAL_SHRINK = [[0, 5], [0.6, 4], [0.8, 3]];
// The comb goes dark tail-first over the haul, so the bolts' roots retreat
// toward the head; a spike or so stays lit to the gulp's first MEAL_GULP_BOLTS,
// when the bolts go into the jaws with the orb.
export const MEAL_COMB_LEFT = 0.08;
export const MEAL_GULP_BOLTS = 0.4;
// The jaws: through the haul they step open as the orb comes within
// MEAL_JAW_REACH cells of where it is hauled to; through the gulp they hold
// the gape, then ajar from MEAL_GULP_SHUT[0] of it and shut from [1]. The gulp
// draws the orb MEAL_GULP_IN cells past where it was hauled to, into the head.
export const MEAL_JAW_REACH = 30;
export const MEAL_GULP_SHUT = [0.55, 0.8];
export const MEAL_GULP_IN = 8;
// The creatures a meal will not take: the school is a shoal of a dozen and
// the siphonophore a colony 26 cells long, and neither fits an orb ten cells
// across. The roster puts no kind in two slots, so of three slots at least one
// always holds something the meal can take.
export const MEAL_SKIP = ['school', 'siphon'];
// The meal is over this long after the heal lands. The eaten creature's slot
// is let go earlier, as the haul begins: its next kind fades in somewhere in
// the deep (FAUNA_REFILL, config/fauna.js).
export const MEAL_BACK_S = 0;
// The jaw's held poses, how far open: shut, ajar, the full gape. Every
// opening of the mouth steps through these (deep/meals.js, `jawPose`).
export const JAW_POSES = [0, 0.5, 1];
// The jaws (the owner's A, docs/mocks/heal-eat-2026-09-30.html): hinged this
// many cells back from the tip, they swing apart until each stands MEAL_GAPE
// cells off the mouth's line at the tip.
export const MEAL_GAPE = 5;
export const MEAL_HINGE = 10;
// The swallow's swelling on the neck: its half length in cells and how far it
// stands off the hide, for a creature MEAL_SWELL_W cells wide; a wider one
// swells more.
export const MEAL_SWELL_LEN = 2.6;
export const MEAL_SWELL = 2.4;
export const MEAL_SWELL_W = 8;
// The heal landing (the owner's pick, B's crosses): purple crosses lift off
// the length of the body, the nearest the belly first, each rising
// MEAL_CROSS_RISE cells over MEAL_CROSS_S as it fades; gone in MEAL_AURA_S.
export const MEAL_AURA_S = 1.8;
export const MEAL_CROSSES = 60;
export const MEAL_CROSS_S = 0.6;
export const MEAL_CROSS_RISE = 8;

// The meal's knobs are the windows' (SERPENT_WINDOW, config/deep.js).
export const MEAL_KNOBS = [];

// The creatures seen through the rift (riftlife.js, render/fish.js): the
// owner's eight (docs/mocks/heal-bestiary-2026-09-30.html), which swam the
// deep as its stream until the meal became the constrict.
export const FLOW_KINDS = 8;
// and how long each is, front tip to tail, in its own units
export const FLOW_LENGTHS = [18, 26, 18, 20, 22, 12, 16, 10];
