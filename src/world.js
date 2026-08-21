// Where everything in the world is, and what parts of the ground are spoken for.
//
// The world is a fixed size and never rearranges: the window is only a view onto
// it, and a small window scrolls rather than squashing everything together. Sites
// are placed by their distance from the rock, so adding one is a distance in
// config.js and a line in `layout` below.

import {
  P, SKY, TO_BENCH, TO_CAVE, TO_LEDGE, GROUND_LEFT, ROCK_SKY, ROCK_CLEAR,
  PIT_H, PIT_W, PIT_PAD, FLOOR_MARGIN, WORKER, DEVICE_PIXELS, CAVE_W, CAVE_H, SIDE_PAD,
  TO_FARM, TO_LAB, FARM_BEDS, FARM_GAP, FARM_H, TO_METEOR, METEOR_UP, METEOR_R
} from './config.js';
import { S, floor, pit, bench, cave, farm, lab, meteor } from './state.js';

const canvas = document.getElementById('c');

// The only hole in the ground is the pit. The rock stands behind the ground,
// not on it: spoil heaps in front of its foot and the crew walk past it, which
// is what a hill at the back of a yard looks like.
export const overPitMouth = x => x + P > pit.x && x < pit.x + pit.w;
export const rockLeft = () => S.cx - (S.gw / 2) * P;
export const overRock = x => x + P > rockLeft() && x < rockLeft() + S.gw * P;
export const rockColAt = x => Math.max(0, Math.min(S.gw - 1, Math.floor((x - rockLeft()) / P)));
// the rock keeps a clear apron around its foot, so the banks stand off it rather
// than heaping up its flanks and blurring where the rock ends
export const overApron = x => x + P > rockLeft() - ROCK_CLEAR && x < rockLeft() + S.gw * P + ROCK_CLEAR;
export const blocked = c => overPitMouth(floor.x + c * P) || overApron(floor.x + c * P);

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
  const want = Math.max(1, devicePixelRatio || 1);
  S.dpr = Math.max(1, Math.min(want, Math.sqrt(DEVICE_PIXELS / (S.W * S.H))));

  canvas.style.position = 'fixed';
  canvas.style.left = '0';
  canvas.style.top = '0';
  canvas.style.zIndex = '0';
  canvas.style.width = `${S.W}px`;
  canvas.style.height = `${S.H}px`;
  canvas.width = Math.round(S.W * S.dpr);
  canvas.height = Math.round(S.H * S.dpr);

  // Only a window too small for the works shrinks the picture. A cell is always
  // a whole number of *device* pixels -- that is what keeps the hairline seams
  // out, and it is a finer ladder than whole screen pixels: at three device
  // pixels to one screen pixel there are three times as many rungs, so a phone
  // can settle on one that fits the whole works on instead of clamping short.
  const needH = ROCK_SKY + PIT_H + FLOOR_MARGIN + P * 4;
  const needW = TO_LEDGE + SIDE_PAD + P * 20;
  const raw = Math.min(1, S.H / needH, S.W / needW);
  const cell = Math.max(1, Math.floor(P * raw * S.dpr));   // device pixels per cell
  S.zoom = cell / (P * S.dpr);
  S.viewW = S.W / S.zoom;
  S.viewH = S.H / S.zoom;

  // fixed places, laid out once and never moved
  S.groundY = SKY;
  S.cx = GROUND_LEFT;

  pit.x = S.cx + TO_LEDGE;
  pit.w = PIT_W;
  pit.h = PIT_H;
  pit.cols = PIT_W / pit.p;
  pit.rows = PIT_H / pit.p;
  pit.y = S.groundY;

  bench.w = P * 12;
  bench.h = P * 7;
  bench.x = S.cx + TO_BENCH;
  bench.y = S.groundY - bench.h;

  // the one thing that is not on the ground
  meteor.x = S.cx + TO_METEOR;
  meteor.y = S.groundY - METEOR_UP;
  meteor.r = METEOR_R;

  lab.w = P * 14;
  lab.h = P * 10;
  lab.x = S.cx + TO_LAB;
  lab.y = S.groundY - lab.h;

  // the cave is a hole in the ground, so it hangs below the line rather than
  // standing on it
  cave.w = CAVE_W;
  cave.h = CAVE_H;
  cave.x = S.cx + TO_CAVE;
  cave.y = S.groundY;

  // the beds stand on the ground, out past the cave
  farm.w = (FARM_BEDS - 1) * FARM_GAP;
  farm.h = FARM_H;
  farm.x = S.cx + TO_FARM;
  farm.y = S.groundY;

  S.worldW = pit.x + pit.w + PIT_PAD * P;
  S.worldH = S.groundY + pit.h + FLOOR_MARGIN;

  floor.x = 0;
  floor.cols = Math.ceil(S.worldW / P);
  floor.y = S.groundY - floor.rows * P;

  // the pit floor rests on the bottom of the window; everything above it is sky
  S.camY = S.worldH - S.viewH;
  clampCam();

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

// The pit is drawn through a scratch canvas one pixel per grain, blitted up to
// size. A million fillRects a frame is not a drawing routine; one drawImage is.
// Only the cells that changed are pushed across, so a busy pile costs a strip.


