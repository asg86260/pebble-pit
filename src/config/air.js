import { P } from './yard.js';

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
// what hangs over the quarry is the shard's blue and what comes off the plots is
// the spore's green -- so the far end of the yard reads as its own place from
// across the world, before you can make out anything standing in it.
//
// One tone per band, in the same order: a mote further back is paler, whatever
// it is made of, because that is what makes the bands read as depth rather than
// as three sizes of speck. The colours are the pale end of the same two hues the
// shards and spores are drawn in, so the air over a site and the stuff that
// comes out of it are plainly the same material.
// And the same three for the sky. What a station puts into the air is the colour
// of what it is digging up, exactly as the dust hanging over it is -- so a dirty
// sky says *which part of the works* is dirtying it, and the answer is a glance
// rather than a readout.
//
// Darker and duller than the motes, because these are drawn at a tenth of the
// ink and against the light: the same hues, pushed down until they read as smoke
// with a cast in it rather than as coloured confetti.
// More saturated than they look like they should be. These are laid down at a
// tenth of an ink, and alpha flattens a hue towards the paper it is on: a navy
// that reads as navy on its own reads as grey at 0.13, which is exactly the
// nothing this was added to avoid.
// Four of each, and a speck keeps the one it was born with for its whole life.
// One flat colour a kind meant a band of six thousand specks was three colours
// of paint laid perfectly evenly, which reads as a printed tone rather than as
// air: what makes a haze look like haze is that no two bits of it are quite the
// same. The spread stays inside the hue -- these are four dusts, not four
// colours -- so a bank still reads as one thing from across the yard.
//
// The air over the yard has had exactly this since it was written (see
// AIR_TINTS below); the sky was the one place still painting flat.
// --- the band's own movement --------------------------------------------------
// A sky made of slots is even because it is built even, and it costs nothing:
// every mote is put where its slot says and nothing is simulated. What it is
// not is alive -- a perfectly even lattice, held still, reads as printed tone.
//
// A fluid was tried and reverted. It looked right and it was measured at over a
// millisecond a frame on five thousand specks -- eight trig calls per mote per
// frame -- which on a machine that is not fill-rate bound is the frame.
//
// So the band stirs in *lanes*. A dozen offsets are worked out once a frame, and
// each mote reads the one its slot lands on. That is a dozen sines a frame
// rather than forty thousand, and it cannot clump for exactly the reason the
// creep cannot: a lane is a translation, and a translation moves specks without
// moving them apart. What it buys is the band sliding over itself -- near lanes
// and far lanes out of step -- instead of hanging there as one sheet.
export const SWAY_LANES = 12;        // how many pieces the band drifts in
export const SWAY_X = 16;            // pixels either way, sideways
export const SWAY_Y = 8;             // and up and down, which is the smaller motion
// How fast a lane goes through its swing, in radians a second: about fifteen
// seconds end to end. Slower than this and the arithmetic is right while the
// picture is still a photograph -- at a hundred-second swing the band moves a
// pixel a second, which is a thing you can measure and not a thing you can see.
export const SWAY_PACE = 0.42;

export const SMOG_TINTS = {
  // Browned, not grey. A haze is burnt air, and burnt air is brown: the dust
  // family carries an umber cast, so a dirty sky reads as smog rather than as
  // the page dimming.
  dust:  ['#5c4224', '#6b4d28', '#503a20', '#644626'],
  shard: ['#1436b8', '#2444c4', '#0f2c9c', '#2a3fa8'],
  spore: ['#12703a', '#1c8046', '#0d6032', '#237a48'],
  // What comes off a machine's stack is soot, and soot is near-black with the
  // same burnt-brown cast as the haze it thickens.
  //
  // It used to go up as the station's own kind -- the jaw's extra dirt was blue,
  // because the cut's dust is blue -- and a sky going blue because you bought a
  // machine said the wrong thing twice over. Stone dust off a face is blue
  // because it is stone; what an engine puts up is what an engine puts up
  // wherever it stands, and it is the one thing in the sky that is nobody's
  // resource. A shade darker than the rock's dust, because it is dirtier.
  mach:  ['#3c2c18', '#46341c', '#332615', '#402f19']
};

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
// What the dust makes of the wind. `AIR_LEAN` is the whole of a mote's sideways
// travel now: there used to be a wobble on top of it, a cosine on each mote's
// own phase and its own period, and that wobble was the reason the air read as
// static rather than as weather. Half a dozen specks in the same square inch
// each going a different way is noise however slow you make it. What is left is
// one wind and a mote's share of it -- see `wind.js`.
export const AIR_LEAN = 0.34;     // screen pixels a mote is carried in a frame, at full wind and pace 1
// And how far a mote is allowed to differ from the mote beside it. Small on
// purpose: a fifth either way is enough that the field does not move like a
// sheet of card, and not enough that any two of them ever plainly disagree.
export const AIR_GIVE = 0.18;
// Grit is the heavy half of the air -- it sinks instead of climbing -- so it
// takes less of the wind than the fine stuff floating past it. Without this the
// only difference between a grain of grit and a speck of dust was which way it
// went up and down, and a wind that carries both equally is a wind blowing
// through a field with no weight in it.
export const AIR_GRIT_LEAN = 0.65;
// What a hand going through the air does to it. The field already leans on a
// wind that never quite settles; this is a local one, made by the cursor, that
// dies away behind it. Standing still does nothing -- it is the movement that
// stirs, so a pointer parked in the middle of the yard leaves the air alone.
// Barely there on purpose. It was strong enough that the dust visibly obeyed the
// pointer, which makes it a toy you are playing rather than air you are moving
// through: what is wanted is the suspicion that the room noticed you.
export let AIR_STIR = 0.04;       // how hard a fast cursor drags a mote along
export const AIR_STIR_R = 78;     // how far the wake reaches, in screen pixels
export const AIR_STIR_CAP = 1.1;  // the fastest the draught will carry one
export const AIR_STIR_EASE = 3.0; // and how quickly it dies, share a second

// The same hand through the smoke, and fainter again: a mote of haze weighs
// nothing and hangs a long way off, so what a cursor going past does to it is
// stir it, not sweep it.
//
// It was doing far too much. A hand crossing the band opened a hole in it you
// could steer -- a bank of weather being pushed about like a pile of sand -- and
// what the draught is meant to say is only that the air is *there*: a stir you
// notice at the edge of your eye and cannot use for anything. A third of the
// push, half the reach, and a quarter of the furthest it will ever move one.
export const SMOKE_STIR = 0.007;   // how hard the cursor moves smoke
export const SMOKE_STIR_R = 70;    // how far it reaches, in world pixels
export const SMOKE_STIR_CAP = 3;   // and the furthest a mote is ever pushed

// A plume takes it harder than the band does.
//
// These are one number for both, and the number is the band's: it was turned
// right down because a hand through the haze was throwing the whole sky about.
// But the band is settled air a long way up and a plume is smoke climbing off a
// swing an arm's length away -- the one thing in the sky your hand is actually
// near -- and at the band's figure a cursor went through a plume and nothing
// happened at all. So the climb gets its own, four times as hard and allowed to
// carry twice as far, which is still a nudge rather than a gust: what it looks
// like is smoke bending round something moving through it.
export const PLUME_STIR = 0.028;
export const PLUME_STIR_R = 90;
export const PLUME_STIR_CAP = 7;
export const SMOKE_STIR_EASE = 2.4;   // and how quickly it eases back

// How far a puff drifts sideways for every pixel it climbs. Enough that a plume
// leans and opens instead of going up as one straight cylinder, not so much
// that it fans out across the sky. It is a share of the climb rather than a
// speed, so a puff ends up about a sixth of its own height off the column it
// left, however fast it got there. Raised from a tenth when the climb was
// lengthened: a taller plume at the old lean read as a chimney pipe.
export const PLUME_LEAN = 0.16;
export const AIR_LOW = 0.6;       // share of the air that hangs low, near the ground
export const AIR_LOW_BAND = 260;  // how far above the ground line "low" reaches

// --- the wind ------------------------------------------------------------------
// One wind over the whole yard, worked out in `wind.js` and leaned on by the
// dust, the settled haze and the smoke still climbing. It used to be three
// separate things -- a gust in the dust, a wander in the haze, a sway in the
// puffs -- each on its own periods and, worse, each mote on its own phase, so
// two specks a hand's breadth apart went opposite ways at the same instant.
// That is not a windy day, it is static.
//
// The number here is a share rather than a distance: 1 is the wind the yard was
// tuned for, and every field turns it into its own pixels. So the knob on the
// panel is "how windy is it", one lever over the lot, rather than three that
// have to be kept in step by hand.
export let WIND = 1;
export const WIND_MS = 9000;      // the slower of the swings the wind is made of
// How deep the lulls are. A sum of sines at unrelated periods never repeats,
// which is most of what was wanted, but it is always about as strong as it ever
// gets -- it swaps direction rather than dropping. A slow envelope over the top
// takes it down to a third and back, so a gust arrives out of quiet air and
// dies away again, which is the part you actually recognise as weather.
export const WIND_LULL = 0.45;

// The dev panel's rows for the knobs above. A row lives beside the binding it
// moves because nothing but this file can assign to one: an imported `let` is
// read-only everywhere else, so the get/set pair has to be written where the
// `let` is. config.js gathers every file's rows into one TUNABLE.
export const AIR_KNOBS = [
  { key: 'AIR_STIR', label: 'cursor draught', min: 0, max: 2, step: 0.02,
    get: () => AIR_STIR, set: v => { AIR_STIR = v; } },
  { key: 'WIND', label: 'the wind', min: 0, max: 3, step: 0.05,
    get: () => WIND, set: v => { WIND = v; } }
];
