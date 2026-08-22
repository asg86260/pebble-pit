// Where everything in the world is, and what parts of the ground are spoken for.
//
// The world is a fixed size and never rearranges: the window is only a view onto
// it, and a small window scrolls rather than squashing everything together. Sites
// are placed by their distance from the rock, so adding one is a distance in
// config.js and a line in `layout` below.

import {
  P, CELL, SKY, TO_SKY, SKY_UP, SKY_R, TO_BENCH, TO_QUARRY, TO_LEDGE, GROUND_LEFT, ROCK_SKY, ROCK_CLEAR, BANK_SLOPE,
  ROCK_PILE_TO, PILE_GAP,
  PIT_H, PIT_HEAP, PIT_W, PIT_PAD, FLOOR_MARGIN, WORKER, DEVICE_PIXELS, QUARRY_W, QUARRY_H,
  SHAKE_RATE, SHAKE_DECAY,
  TO_FARM, TO_LAB, FARM_BEDS, FARM_GAP, FARM_H
} from './config.js';
import { S, floor, pit, bench, quarry, farm, lab, sky } from './state.js';

const canvas = document.getElementById('c');

// The only hole in the ground is the pit. The rock stands behind the ground,
// not on it: spoil heaps in front of its foot and the crew walk past it, which
// is what a hill at the back of a yard looks like.
export const overPitMouth = x => x + P > pit.x && x < pit.x + pit.w;
// The rock is anchored by its middle, so an odd width would put this edge half
// a cell off the grid -- and half a cell is a fraction of a device pixel, which
// the canvas draws as a hairline down every seam. Snapped, so a rock loaded from
// an older save stands square too. Everything about the rock measures from here.
export const rockLeft = () => Math.round((S.cx - (S.gw / 2) * P) / P) * P;
export const overRock = x => x + P > rockLeft() && x < rockLeft() + S.gw * P;
export const rockColAt = x => Math.max(0, Math.min(S.gw - 1, Math.floor((x - rockLeft()) / P)));
// the rock keeps a clear apron around its foot, so the banks stand off it rather
// than heaping up its flanks and blurring where the rock ends
export const overApron = x => x + P > rockLeft() - ROCK_CLEAR && x < rockLeft() + S.gw * P + ROCK_CLEAR;
// Every station piles to its right, into a strip of ground that belongs to it,
// and each strip stops short of the next station along. Nothing may heap
// anywhere else, so the ground between them stays bare and every pile is
// legibly somebody's -- and a pile that fills is that station's problem rather
// than the whole yard's.
//
// They are worked out when the world is laid out and when the rock changes size,
// not per column: `blocked` is asked about a column thousands of times a frame.
export function refreshPiles() {
  S.piles = [
    { key: 'farm', from: farm.x + farm.w, to: quarry.x - PILE_GAP },
    { key: 'quarry', from: quarry.x + quarry.w, to: rockLeft() - ROCK_CLEAR - PILE_GAP },
    { key: 'rock', from: rockLeft() + S.gw * P + ROCK_CLEAR, to: S.cx + ROCK_PILE_TO }
  ];
}

// which pile a spot on the ground belongs to, or null for the bare ground between
export function pileAt(x) {
  for (const p of S.piles) if (x + P > p.from && x < p.to) return p;
  return null;
}

export const yardLeft = () => (S.piles[0] ? S.piles[0].from : 0);
export const blocked = c => !pileAt(floor.x + c * P);

// which pile a station's own output belongs in
export const pileOf = key => S.piles.find(p => p.key === key);

// How far past the apron a column is, in cells, or -1 for one inside it.
export const pastApron = x => {
  const near = rockLeft() - ROCK_CLEAR, far = rockLeft() + S.gw * P + ROCK_CLEAR;
  return x + P <= near ? (near - (x + P)) / P : x >= far ? (x - far) / P : -1;
};

// How high the ground may stand in a column. There are two cliffs in this yard
// that the sand cannot slump over: the rock's bare apron, and either end of the
// yard. A bank beside any of them would stand up as a sheer wall -- and a bank
// that reached the lip would tip itself in, four cells at a time, and bank the
// whole yard for free with nobody carrying anything. So a bank may only rise as
// it gets away from all three, and it lies as a thin scatter against the ends.
// Between them there is as much room as the slope allows.
export const bankCeiling = c => {
  const x = floor.x + c * P;
  const p = pileAt(x);
  if (!p) return 0;
  // both ends of a pile are cliffs the sand may not lean on: the station behind
  // it and the bare ground in front of it. So it rises only as it gets away from
  // them, which is what stops it standing up as a wall against either.
  const toEnd = Math.min((x + P - p.from) / P, (p.to - (x + P)) / P);
  return Math.max(0, toEnd) * BANK_SLOPE;
};

// the outside of the rock's apron on one side: spoil and cores are aimed past it
export const rockEdge = side =>
  side < 0 ? rockLeft() - ROCK_CLEAR : rockLeft() + S.gw * P + ROCK_CLEAR;

// Where a worker's feet go, given the surface it is standing on. Everything on
// the ground shares one baseline: snapped to the pixel grid so a row of them
// lines up, and never below the ground line, so nobody sinks into the earth.
export function standOn(surfaceY) {
  const y = Math.min(surfaceY, S.groundY) - WORKER;
  return Math.round(y / P) * P;
}

// The bridge over the quarry: a ramp up, a flat deck over the mouth, a ramp
// down, and the crew walk every bit of it. Twenty degrees is a rise of four
// cells over a run of eleven -- 19.98 degrees, which is as close to twenty as
// this lattice gets, and both ends land on a whole cell.
export const BRIDGE_RISE = P * 4;
export const BRIDGE_RUN = P * 11;

export function bridgeSpan() {
  const d0 = Math.round(quarry.x / P) * P;                 // the deck covers the mouth
  const d1 = Math.round((quarry.x + quarry.w) / P) * P;
  return { x0: d0 - BRIDGE_RUN, d0, d1, x1: d1 + BRIDGE_RUN,
           top: S.groundY - BRIDGE_RISE };
}

// The surface underfoot at x. Everywhere in the world this is just the ground
// line; over the quarry it is whichever part of the bridge is above that point.
// Before the quarry is opened there is no bridge and no hole, so it is ground
// there too.
export function groundAt(x) {
  if (!S.quarryOpen) return S.groundY;
  const { x0, d0, d1, x1, top } = bridgeSpan();
  if (x <= x0 || x >= x1) return S.groundY;
  if (x < d0) return S.groundY - BRIDGE_RISE * (x - x0) / BRIDGE_RUN;   // up the near ramp
  if (x > d1) return S.groundY - BRIDGE_RISE * (x1 - x) / BRIDGE_RUN;   // down the far one
  return top;                                                           // across the deck
}

// Where a walker's top edge goes at x. Not snapped to the lattice the way
// standOn is: on a ramp that would step the crew up in six-pixel jumps and
// leave them floating off a line drawn straight.
export const walkY = x => Math.min(groundAt(x), S.groundY) - WORKER;


// --- layout -----------------------------------------------------------------
// The world is a fixed size and never rearranges: the window is only a view onto
// it, and a small window scrolls rather than squashing everything together.
export function resize(after) {
  // the canvas is told its size outright, in its own inline style and in device
  // pixels, so it does not depend on the stylesheet or on measuring anything
  S.W = Math.max(320, document.documentElement.clientWidth || innerWidth || 320);
  S.H = Math.max(240, document.documentElement.clientHeight || innerHeight || 240);
  // Draw at the screen's real resolution, not a capped one: a phone reports 3
  // and looked soft at 2. Back off only if the backing store would get silly --
  // fill rate is what costs, and that is what the budget is counted in.
  //
  // The ratio is then rounded so that a cell is a whole number of device pixels.
  // That is not tidiness: a cell drawn across a fraction of a device pixel is a
  // cell antialiased against the page, and the seam between two of them comes
  // out grey. It is the same rule as every world position being a whole cell.
  const want = Math.max(1, devicePixelRatio || 1);
  const fit = Math.min(want, Math.sqrt(DEVICE_PIXELS / (S.W * S.H)));
  S.dpr = Math.max(1, Math.round(CELL * fit)) / CELL;

  canvas.style.position = 'fixed';
  canvas.style.left = '0';
  canvas.style.top = '0';
  canvas.style.zIndex = '0';
  canvas.style.width = `${S.W}px`;
  canvas.style.height = `${S.H}px`;
  canvas.width = Math.round(S.W * S.dpr);
  canvas.height = Math.round(S.H * S.dpr);

  // The picture is always the same size. A small window does not shrink the
  // yard, it just shows less of it: a cell is a cell whatever you are looking
  // at this on, and the works is a fixed thing you scroll along rather than a
  // thing that rearranges itself around your window. The game asks for about
  // 830px of height to show the sky, the ground and the whole depth of the pit;
  // anything shorter loses sky off the top, which is the part with nothing in it.
  S.zoom = CELL / P;
  S.viewW = S.W / S.zoom;
  S.viewH = S.H / S.zoom;

  // fixed places, laid out once and never moved
  S.groundY = SKY;
  S.cx = GROUND_LEFT;

  pit.x = S.cx + TO_LEDGE;
  pit.w = PIT_W;
  pit.h = PIT_H + PIT_HEAP;              // the hole, and room to heap over it
  pit.cols = PIT_W / pit.p;
  pit.rows = (PIT_H + PIT_HEAP) / pit.p;
  pit.y = S.groundY - PIT_HEAP;          // the bed starts above the ground line

  bench.w = P * 12;
  bench.h = P * 7;
  bench.x = S.cx + TO_BENCH;
  bench.y = S.groundY - bench.h;

  // the one thing that is not on the ground
  sky.x = S.cx + TO_SKY;
  sky.y = S.groundY - SKY_UP;
  sky.r = SKY_R;

  lab.w = P * 14;
  lab.h = P * 10;
  lab.x = S.cx + TO_LAB;
  lab.y = S.groundY - lab.h;

  // the quarry is a hole in the ground, so it hangs below the line rather than
  // standing on it
  quarry.w = QUARRY_W;
  quarry.h = QUARRY_H;
  quarry.x = S.cx + TO_QUARRY;
  quarry.y = S.groundY;

  // the beds stand on the ground, out past the quarry
  farm.w = (FARM_BEDS - 1) * FARM_GAP;
  farm.h = FARM_H;
  farm.x = S.cx + TO_FARM;
  farm.y = S.groundY;

  S.worldW = pit.x + pit.w + PIT_PAD * P;
  S.worldH = S.groundY + PIT_H + FLOOR_MARGIN;

  floor.x = 0;
  floor.cols = Math.ceil(S.worldW / P);
  floor.y = S.groundY - floor.rows * P;

  // the pit floor rests on the bottom of the window; everything above it is sky
  S.camY = S.worldH - S.viewH;
  clampCam();

  refreshPiles();                          // and each station's strip of ground
  if (after) after();                      // the sites settle themselves into it
}

// the view can never leave the world; if the window is bigger, it sits still
// only sideways: the pit floor is pinned to the bottom of the window
// Send the view somewhere, gently. Opening a new site is four cores and a row
// in a menu; without this the player buys it and nothing appears to happen,
// because the thing they bought is off the left of the screen.
export function lookAt(x) {
  S.camTo = x - S.viewW / 2;
}

// one frame of that glide
export function stepCamera() {
  if (S.camTo === null) return;
  const d = S.camTo - S.camX;
  if (Math.abs(d) < 1) { S.camX = S.camTo; S.camTo = null; }
  else S.camX += d * 0.12;
  clampCam();
}

export function clampCam() {
  S.camX = Math.max(0, Math.min(S.camX, Math.max(0, S.worldW - S.viewW)));
  S.camY = S.worldH - S.viewH;
}

// Knock the view. Something heavy has hit the ground and the ground is what the
// whole picture is standing on, so everything in the world moves together --
// this is not the camera being pushed, it is the yard being shaken, and it is
// added on top of wherever you happen to be looking.
export function shakeView(amount) {
  if (amount <= S.shake) return;      // a small knock does not interrupt a big one
  S.shake = amount;
  S.shakePh = 0;
}

// One frame of it: a rock that rings and dies away rather than a jitter. It
// mostly rocks up and down, because that is the direction the thing came from,
// with a slower and shallower sway across. The offsets stay in world pixels and
// are rounded to whole device pixels where they are used, so a shaking yard is
// as crisp as a still one.
export function stepShake() {
  if (!S.shake) return;
  S.shakePh += SHAKE_RATE;
  S.shake *= SHAKE_DECAY;
  if (S.shake < 0.2) { S.shake = 0; S.shakeX = 0; S.shakeY = 0; return; }

  // It may only rock as far as there is world to rock into. The view is already
  // pinned to the edges of the place -- the pit floor sits on the bottom of the
  // window and the ground runs out sideways -- so an unchecked shake would show
  // the page through underneath the pit, which is worse than no shake at all.
  const overX = Math.max(0, S.worldW - S.viewW);
  const room = { l: S.camX, r: overX - S.camX, u: FLOOR_MARGIN };
  const y = Math.sin(S.shakePh) * S.shake;
  const x = Math.sin(S.shakePh * 0.6 + 1.7) * S.shake * 0.35;
  S.shakeY = Math.max(-room.u, y);              // down is sky, and there is plenty of it
  S.shakeX = Math.max(-room.r, Math.min(room.l, x));
}

// The pit is drawn through a scratch canvas one pixel per grain, blitted up to
// size. A million fillRects a frame is not a drawing routine; one drawImage is.
// Only the cells that changed are pushed across, so a busy pile costs a strip.


