// --- acts 3 and 4: the connective tissue -----------------------------------------
// DESIGN.md, "Acts 3 and 4", "The portals and the mansion (owner, 2026-10-17
// night)": the two portals (heaven's over the fallen house, hell's on the
// deep's floor), the story's beats as placeholder cutscenes, the ghosts on the
// road, and the ending's mansion. Every number here is a default chosen to
// stand the placeholder up, for the owner and the mocks to move; nothing in
// it is tuned. Seconds unless named; a pace is world pixels a second.
import { P } from './yard.js';
import { GREY, PURPLE } from './palette.js';

// --- the portals -------------------------------------------------------------
// A portal is the camera's way between two places, never a body's (bodies
// walk the road, ghosts.js), and it has an end in each. Heaven's is a tear
// in the sky ACT_HEAVEN_SKY over the house, the cloud stair let down from it
// to the ruin; its end in the afterlife is the patch of cloud floor straight
// above, the ring drawn ACT_HEAVEN_HANG over it. Hell's is a white-hot slit
// in the deep's floor straight over hell's road down (hell/place.js, `roadX`),
// and the landing; its end in hell ACT_HELL_HANG over the landing's floor.
export const ACT_PORTAL_R = P * 5;           // a ring's radius
export const ACT_HEAVEN_SKY = P * 34;
export const ACT_HEAVEN_HANG = P * 14;
export const ACT_HELL_HANG = P * 14;
export const ACT_PORTAL_OPEN_S = 2;          // a ring opening, by opacity and size
export const ACT_PORTAL_SPIN_HZ = 0.6;       // its cells turning, steps a second
export const ACT_PORTAL_TONES = [PURPLE[13], PURPLE[11], PURPLE[9], PURPLE[7]];
// The pointing hand beside an act portal, as the yard portal's: shown until
// the player has been through and back by their own hand, then faded.
export const ACT_HAND_SIDE = P * 2;          // the gap between the ring and the hand
export const ACT_HAND_FADE_S = 3;

// --- the prompt that starts act 3 (call 7: the player says go on) ------------
// A small card over the house once the finale's sheet is down; pressing it
// is the player's say. It fades in over ACT_GOON_FADE_S after ACT_GOON_WAIT_S.
export const ACT_GOON_WAIT_S = 4;
export const ACT_GOON_FADE_S = 1.5;
export const ACT_GOON_ABOVE = P * 22;        // its foot over the ground line
export const ACT_GOON_PAD = P;               // the card's margin round its words
export const ACT_GOON_FONT_PX = 12;          // screen px, the counter's register

// --- the beats -------------------------------------------------------------
// A beat is phases (actbeats.js), each a place to stand in, a spot to look at
// and a few seconds to hold. The space bar or a click hurries a beat by
// ACT_HURRY; nothing in it is cut.
export const ACT_HURRY = 4;
export const ACT_CAPTION_S = 3.5;            // a caption's hold, the default phase
export const ACT_CAPTION_FADE_S = 0.5;       // in and out, by opacity
export const ACT_CAPTION_FONT_PX = 13;
export const ACT_CAPTION_GREY = GREY[0];     // the words, on the letterbox's black

// The house's fall: the rock out of the sky over ACT_ROCK_FALL_S, from
// ACT_ROCK_FROM over the ground, in held steps; the dust; then the two souls
// out of the wreck and straight up through the tear at ACT_SOUL_PX_S.
export const ACT_ROCK_FALL_S = 2.2;
export const ACT_ROCK_FROM = P * 40;
export const ACT_ROCK_STEPS = 18;
export const ACT_ROCK_W = 16;                // cells, wider than the house's walls
export const ACT_ROCK_H = 11;
export const ACT_ROCK_DUST_S = 1.6;
export const ACT_ROCK_TONES = [GREY[10], GREY[9], GREY[8]];
export const ACT_SOUL_LIFT_S = 1.5;          // out of the wreck, fading in
export const ACT_SOUL_PX_S = P * 14;         // rising, up through the tear to the cloud floor
export const ACT_SOUL_RIM = GREY[3];         // a soul's rim, the pale grey (DESIGN.md)
export const ACT_SOUL_PAPER = GREY[0];
export const ACT_STAIR_TONES = [GREY[1], GREY[2], GREY[1], GREY[3]];   // the cloud stair's cells
export const ACT_STAIR_STEP = 2;             // cells a step, down and across
export const ACT_SLIT_TONES = [GREY[0], PURPLE[13], GREY[1]];          // the slit, white-hot

// --- the ghosts on the road (call 5: carry, not work) -----------------------
// After the road opens and the pair come down, they walk a loop: the ruin to
// the drowned pit, down through the abyss to the deep's floor, along it to
// hell's slit and down onto the landing, on to hell's store and back the
// same way, carrying a load of the yard's dust down and nothing up. A load
// is GHOST_LOAD dust, taken off the purse at the ruin if the purse has it.
// Called somewhere by a beat (the cage, home) they walk ACT_CALL_K faster.
export const GHOST_PX_S = P * 8;
export const GHOST_LOAD = 25;
export const GHOST_GAP = P * 4;              // between the two of them, one behind
export const ACT_CALL_K = 3;

// Lives returned: the rims closing a piece at a time (the union's rim build).
export const ACT_RIM_PIECES = 8;
export const ACT_RIM_STEP_S = 0.5;

// --- the mansion (the owner, 2026-10-17 night) ------------------------------
// On the house's ground, bigger than the house: a main block MANSION_FLOORS
// floors high between two lower wings and two towers. In cells, from its
// left end at MANSION_AT cells off the yard's left edge; the door is the
// main block's middle. A floor is MANSION_FLOOR_ROWS rows.
export const MANSION_AT = 6;
export const MANSION_FLOORS = 4;
export const MANSION_FLOOR_ROWS = 6;
export const MANSION_WING_W = 10;            // each wing, cells
export const MANSION_WING_FLOORS = 2;
export const MANSION_MAIN_W = 22;            // the main block
export const MANSION_TOWER_W = 4;            // each tower, standing at the main block's corners
export const MANSION_TOWER_FLOORS = 6;
export const MANSION_DOOR_W = 4;
export const MANSION_DOOR_H = 5;
export const MANSION_WINDOW = [2, 3];        // a window's w and h, cells
export const MANSION_WINDOW_EVERY = 5;       // cells between windows along a floor
export const MANSION_POLES = [11, 20, 28, 37];   // the scaffold's poles, cells off its left end
// The build, a standing job from the cage's fall: up to MANSION_BUILDERS of
// the yard's own builders (spare hands if it has none), a piece a trip.
// First the scaffold, a pole a trip off the old house's woodpile; then the
// fallen rock broken up, a row a trip, onto the blocks pile at
// MANSION_BLOCKS_AT cells off the yard's left edge, which is where every
// piece after comes from; the scaffold carried down last. A body takes
// MANSION_TAKE_S at a pile and MANSION_SET_S at the piece; a set piece fades
// in over MANSION_FADE_S.
export const MANSION_BUILDERS = 6;
export const MANSION_BLOCKS_AT = 1;
export const MANSION_BLOCKS_W = 4;
export const MANSION_BLOCK_CELLS = 4;          // the rock's cells a block on the pile stands for
export const MANSION_TAKE_S = 0.5;
export const MANSION_SET_S = 0.7;
export const MANSION_FADE_S = 0.6;
export const MANSION_GREYS = [GREY[10], GREY[8], GREY[6], GREY[4], GREY[2]];
export const MANSION_LIT = PURPLE[12];
// The gathering: the freed souls coming down heaven's cloud stair and
// standing in files beside the mansion, MANSION_SOULS of them, a soul every
// MANSION_SOUL_EVERY_S; then the sheet after MANSION_SHEET_AFTER_S.
export const MANSION_SOULS = 24;
export const MANSION_SOUL_EVERY_S = 0.4;
export const MANSION_FILE_W = 8;             // souls a file
export const MANSION_FILE_AT = 54;           // the files' left end, cells off the yard's left edge
export const MANSION_SHEET_AFTER_S = 4;
