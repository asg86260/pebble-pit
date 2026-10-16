// A pad (DESIGN.md, "Controller support"): the focus marker, the hops, the
// hand on the held trigger and the rumble on a crit. Every number pad.js,
// padpage.js and render/padmark.js read.

import { P } from './yard.js';
import { PURPLE } from './palette.js';

// --- the marker ---------------------------------------------------------------
// The accent, the one color the game draws besides its grays: a rung of the
// one purple (palette.js), and its lit rung down in the deep.
export const PAD_ACCENT = PURPLE[10];
export const PAD_DEEP_ACCENT = PURPLE[13];
// The halo the marker wears so it reads over ink, grey and the dark: the
// paper in the yard, the deep's own dark down there (the mock's `--deep`).
export const PAD_HALO = '#ffffff';
export const PAD_DEEP_HALO = '#08070c';
// The glide between stops, eased in and out, on whole cells: never shorter
// than this (the owner, 2026-10-12: "about 0.25 s"), and longer for a far
// trip, so that no frame of it moves faster than PAD_GLIDE_SPEED, CSS pixels
// a second on the glass -- a marker that crossed the window in a frame or two
// read as one that jumped (the owner, 2026-10-16). A fifth quicker than first
// built (250 ms, 1800 px/s): "just a bit quicker", the owner, 2026-10-16.
export const PAD_GLIDE_MS = 200;
export const PAD_GLIDE_SPEED = 2300;
// The camera's pan to the focus on a hop, eased in and out: never shorter
// than this (about a fifth quicker than the old chase, which took some
// 0.4 s to get most of the way), and PAD_PAN_LEAD times the marker's own
// glide, so the marker gets to the new thing first and rides in with it.
export const PAD_PAN_MS = 320;
export const PAD_PAN_LEAD = 1.6;
// The landing: two cells out, then one, then home, each held this long.
export const PAD_SETTLE_STEP_MS = 60;
export const PAD_SETTLE_CELLS = 2;
// The idle breath once landed, from rest: all four corners out a cell and
// back, a pose this long (the owner's vote, 2026-10-15: option A, a 1.0 s
// cycle; docs/mocks/focus-idle-2026-10-15/).
export const PAD_BREATH_MS = 500;
// The marker fades in from nothing and out to nothing over this long.
export const PAD_FADE_MS = 200;
// An arm of a bracket, in cells: never more than this, never under the least,
// and half the short side between.
export const PAD_ARM_MAX = 3;
export const PAD_ARM_MIN = 2;
// The marker over a page's rows (a board, a sheet, the corner cards): its
// cell in CSS pixels. Not the yard's cell, which grows with the zoom: a row
// is type and stays one size.
export const PAD_PAGE_CELL = 3;
// The hand on a held trigger, and a body carried in it: a box this many
// cells across, centered on the point the hand is at.
export const PAD_HAND_BOX = 2;

// --- reading the pad ----------------------------------------------------------
// A stick's dead middle: a resting stick reads a little off nought.
export const PAD_DEAD = 0.25;
// A flick of the left stick hops the focus like the d-pad: past this, once,
// and back under PAD_DEAD before it hops again.
export const PAD_FLICK = 0.6;
// A held d-pad repeats the hop: the first after this wait, then one a step.
export const PAD_REPEAT_WAIT_MS = 380;
export const PAD_REPEAT_MS = 140;
// A d-pad press goes to the nearest thing that way, a thing off the line
// counting this many times its distance off it against its distance ahead
// (padpage.js, `pickToward`).
export const PAD_ACROSS = 2;
// A trigger is down past this much of its pull.
export const PAD_TRIGGER = 0.5;

// --- moving things ------------------------------------------------------------
// The hand's speed at a full push of the stick, world pixels a second; a
// body carried in it goes no faster, d-pad hop or stick alike.
export const PAD_HAND_SPEED = P * 90;
// The right stick slides the view at the arrow keys' speed (input.js,
// `KEY_PAN`) scaled by how far it is pushed: views a second at full push.
export const PAD_PAN = 0.5;
// The coil under the stick: segments a second at a full push, and one
// segment a d-pad press.
export const PAD_COIL_RATE = 24;
// The hover's own wait before a settled focus asks for the tip.
export const PAD_TIP_MS = 180;

// --- the rumble on a crit -----------------------------------------------------
// Short and light: a knock in the hands, not an alarm.
export const PAD_RUMBLE_MS = 90;
export const PAD_RUMBLE_STRONG = 0.35;
export const PAD_RUMBLE_WEAK = 0.6;
