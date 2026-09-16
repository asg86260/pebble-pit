import { now } from '../clock.js';
import { P, PUFF_FADE, SMOG_DRIFT, SMOG_LIFT, SMOG_RAIN_AT, SMOG_SINK, SMOKE_STIR_EASE, SWAY_LANES, SWAY_PACE, SWAY_X, SWAY_Y } from '../config.js';
import { rand } from '../rng.js';
import { S } from '../state.js';
import { gust } from '../wind.js';
import { ACTIVE, DROPS, SKY, bandLow, bandTop, creep, drift } from './band.js';
import { motesWanted, reckon, skyMote, spread } from './vents.js';

// --- how the sky is arranged -------------------------------------------------
// Nothing is ever pushed anywhere. Each mote is given a place in the band when
// it arrives and keeps it; the places are handed out along a golden-angle
// sequence, which leaves no gaps and makes no rows at every count. A force
// trying to even the sky out afterward clumps: diffusion from a point source
// mounds, a per-bin force flips sign at the bin edge and builds bars, and a
// random field is randomly lumpy.
//
// Only the across axis gets the sequence. Two such sequences off one counter
// (across and down) are a lattice, and the sky reads as woven cloth; the sway
// lane as `k % SWAY_LANES` is a third linear function of the same number and
// slides a comb of that lattice across the rest. Depth and lane come from the
// yard's chance instead, so no three motes are ever collinear on purpose.
const ACROSS = 0.6180339887498949;      // one turn less the golden ratio

let slots = 0;                          // handed out, never reused, never reset

// Worked out once when the slot is handed over and carried on the mote: a
// mote's slot never changes, and re-deriving it per mote per frame was a
// third of a million allocations a second.
export const nextSlot = () => {
  const k = slots++;
  // The depth is the sum of two draws: a uniform depth ends the band in two
  // ruled lines, top and bottom, and two draws thin it to nothing at both
  // edges with no line and still no pattern.
  return { slot: k, su: (k * ACROSS) % 1, sv: (rand() + rand()) / 2,
           lane: Math.floor(rand() * SWAY_LANES) };
};

// The age past which a mote's own clock stops moving it: the ease down into
// the band is finished at `SMOG_SINK`, and past that the arithmetic that
// reads the age is dead weight. See `place`.
const AGE_STILL = SMOG_SINK;

// The lanes' offsets for this frame, worked out once and read by every mote.
// Each lane has its own phase off the golden angle so twelve of them never
// line up into the whole band moving as a block.
const SWAY_DX = new Float64Array(SWAY_LANES);
const SWAY_DY = new Float64Array(SWAY_LANES);
function swayNow(t) {
  for (let i = 0; i < SWAY_LANES; i++) {
    const a = t * SWAY_PACE + i * 2.399963;
    SWAY_DX[i] = Math.sin(a) * SWAY_X;
    // Not the same rate as the sideways part, or a lane would run round a tidy
    // ellipse over and over.
    SWAY_DY[i] = Math.cos(a * 0.63 + i) * SWAY_Y;
  }
}

// The frame's shared numbers, worked out once by `place` and kept for `moteX`
// and `moteY`: an evaluation later in the frame (the drawing, a readout) has
// to be the very number this frame would have written on the mote, not a
// second reading of a camera that has moved since.
let fSpan = P, fTop = 0, fDeep = 0, fGust = 0;

// This mote's share of the band's creep since the reading it started from.
const roamOf = m => m.give * (drift - m.roam0);

// Where a mote is, this frame. The one way to ask. For a mote at rest it is
// worked out from the anchor, and it is exactly the number `place` would have
// written: same terms, same order, same wrap.
export function moteX(m) {
  if (m.awake) return m.x;
  let x = (m.su * fSpan + roamOf(m) * fSpan) % fSpan
          + SWAY_DX[m.lane] + m.sx;
  if (x > fSpan) x -= fSpan;
  if (x < 0) x += fSpan;
  return x;
}

export function moteY(m) {
  if (m.awake) return m.y;
  return fTop + m.sv * fDeep - fGust * m.give * SMOG_LIFT + SWAY_DY[m.lane] + m.sy;
}

// A mote joins the sky and the list of ones being stepped. Even one born at
// rest (a restored sky) goes on the list, so the first frame is what decides
// it is at rest rather than whoever made it.
export const enter = m => { m.awake = true; ACTIVE.push(m); SKY.push(m); };

// Back on to the list, from the pixel it was being drawn at, so there is
// nothing to see at the moment it starts being stepped again.
export function wake(m) {
  if (m.awake) return;
  m.x = moteX(m);
  m.y = moteY(m);
  m.awake = true;
  ACTIVE.push(m);
}

// Out of the sky. `place` compacts the list, so this only has to say so.
export const dropped = m => { m.gone = true; };

export function clearSky() {
  SKY.length = 0;
  ACTIVE.length = 0;
}

// One frame of the sky. A settled mote has no state to step, so it is not
// stepped: its place is its anchor plus numbers fixed for its life or shared
// by the whole band for the frame, and it comes off ACTIVE for good. What is
// left on ACTIVE is what is genuinely moving.
export function place(secs) {
  const span = Math.max(P, S.worldW || 0);
  // The bend, not the raw field: the band's creep and the dust's travel are
  // the same wind seen twice. Off the raw number the haze slides through a
  // lull the dust has already stopped in.
  const w = gust();
  swayNow(now() / 1000);
  // Read off the camera once for the whole sky, not a pair of calls per mote.
  const top = bandTop(), deep = bandLow() - top;
  // The bodily creep along the sky, the one thing up here that adds up rather
  // than easing back. The wind's, sign and all, so a bank stalls in a lull
  // and comes back on the return gust; a translation cannot clump, whatever
  // it accumulates.
  creep((secs * SMOG_DRIFT * 60 * w) / span);
  // The wind lifts the band a few pixels, off the same number as everything
  // else in the air. Named for what it does: `gust` is the shared field.
  const lift = Math.abs(w);
  fSpan = span; fTop = top; fDeep = deep; fGust = lift;

  const fadeBy = secs / (PUFF_FADE / 1000);
  const unstir = Math.max(0, 1 - SMOKE_STIR_EASE * secs);

  // Marked as they are found and swept up afterwards rather than copied down
  // one at a time: a shuffle every mote every frame is the cost this loop
  // exists to be rid of.
  let left = false;
  const n = ACTIVE.length;
  for (let i = 0; i < n; i++) {
    const m = ACTIVE[i];
    if (m.gone) { m.awake = false; left = true; continue; }   // rained out, or swallowed
    if (m.up) continue;             // still climbing: `stepPuffs` has it
    // Arrived for good: the sink is over, it is at full weight and nothing is
    // bending it out of place. `moteX` gives back the very number this loop
    // would have written, so nothing moves when it stops being stepped. The
    // draught's offsets are not in this test because `moteX` carries them.
    if (m.age >= AGE_STILL && m.fade >= 1 && !m.px && !m.py) {
      m.awake = false; left = true; continue;
    }

    m.age += secs;
    if (m.fade < 1) m.fade = Math.min(1, m.fade + fadeBy);
    const x = m.su * span;
    const hy = top + m.sv * deep;
    // A mote arrives at the underside of the band, where the climb ends, and
    // sinks to its height over a few seconds rather than jumping to it.
    const k = Math.min(1, m.age / SMOG_SINK);
    const e = k * k * (3 - 2 * k);
    const y = m.fromY + (hy - m.fromY) * e;
    // and whatever the cursor bent it out of place by, easing back to nought
    if (m.px || m.py) {
      m.px *= unstir;
      m.py *= unstir;
      if (Math.abs(m.px) < 0.05) m.px = 0;
      if (Math.abs(m.py) < 0.05) m.py = 0;
    }

    m.x = (x + roamOf(m) * span) % span + m.px + SWAY_DX[m.lane];
    m.y = y - lift * m.give * SMOG_LIFT + m.py + SWAY_DY[m.lane];

    // The draught's offset. Both are named in `skyMote` and start at nought:
    // adding an undefined here makes a NaN coordinate, and `pull` measured
    // distance with `hypot(...) || 1`, so a NaN read as one pixel and the
    // whole sky was swallowed in a frame.
    if (m.sx || m.sy) { m.x += m.sx; m.y += m.sy; }
    if (m.x > span) m.x -= span;
    if (m.x < 0) m.x += span;
  }
  if (left) {
    let keep = 0;
    for (let i = 0; i < ACTIVE.length; i++) if (ACTIVE[i].awake) ACTIVE[keep++] = ACTIVE[i];
    ACTIVE.length = keep;
  }
}

// Only ever called where a sky is being restored rather than made: a save
// coming back, or the dev panel winding the haze up. In play a mote arrives
// by climbing off a swing, and nothing pops in while you are watching.
function fillTo(want) {
  const span = Math.max(P, S.worldW || 0);
  while (SKY.length > want) dropped(SKY.splice(Math.floor(rand() * SKY.length), 1)[0]);
  while (SKY.length < want) {
    const m = skyMote(rand() * span, bandTop());
    m.age = AGE_STILL;                            // loaded, not arrived: long since settled
    enter(m);
  }
}

export const fillSky = () => { fillTo(motesWanted()); reckon(); };

// A save coming back. The weather in flight belongs to a moment that is over,
// so what a reload rebuilds is the band itself, out of the haze written down.
// Cleared before it fills: whatever is in these arrays belongs to the game
// that was running a moment ago.
export function skyFromSave() {
  clearSky();
  DROPS.length = 0;
  fillSky();
}

// how thick the sky is, 0..1 scaled, for anything that wants to know without counting
export const cloudR = () => Math.round(Math.min(1, S.haze / SMOG_RAIN_AT) * 42);
