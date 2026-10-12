// A pad (DESIGN.md, "Controller support"): the focus marker, the hops, the
// hand on the held trigger and the rumble on a crit. Every number pad.js,
// padpage.js and render/padmark.js read.

import { P } from './yard.js';

// --- the marker ---------------------------------------------------------------
// The accent, the one color the game draws besides its grays: the capstone
// purple of shelf.css, and the deep's lighter one down there.
export const PAD_ACCENT = '#6f36c9';
export const PAD_DEEP_ACCENT = '#a979ef';
// The halo the marker wears so it reads over ink, grey and the dark: the
// paper in the yard, the deep's own dark down there (the mock's `--deep`).
export const PAD_HALO = '#ffffff';
export const PAD_DEEP_HALO = '#08070c';
// The glide between stops, fast out and soft in, on whole cells (the
// owner, 2026-10-12: "about 0.25 s").
export const PAD_GLIDE_MS = 250;
// The landing: two cells out, then one, then home, each held this long.
export const PAD_SETTLE_STEP_MS = 60;
export const PAD_SETTLE_CELLS = 2;
// The slow two-pose breath once landed: out a cell and back, a pose this long.
export const PAD_BREATH_MS = 700;
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
