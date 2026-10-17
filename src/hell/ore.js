// The seams and the brimstone (DESIGN.md, "Acts 3 and 4", act 4, "The chain:
// five ores, five tools, five barriers", mining).
//
// Each chamber's seam is its left wall under the ledge: a face that moves
// back into the rock a cell for every LUMPS_A_CELL lumps, never a heap that
// fills. A blow -- the pair's click or a miner's swing -- bites or rings off
// by the tool's tier against the seam's: a tier's own ore comes off its tool
// slowly and the tier below's fast (LUMP_BLOWS). A lump knocked loose is a
// counted item lying at the face (`S.hell.ore`, by ore) until a hauler carries
// it, never grains in a sand grid; at FACE_LOOSE_MAX the face waits. A flare's
// slag (`crust`) takes blows to clear before ore comes off again.
//
// Brimstone crusts round each open chamber's vent on its own clock and is
// gathered by anyone (bodies.js); a flare adds to it.

import { S } from '../state.js';
import { HELL_TIERS, LUMP_BLOWS, FACE_LOOSE_MAX, LUMPS_A_CELL, SEAM_MAX, P,
         VENT_CRUST_S, VENT_CRUST_MAX } from '../config.js';
import { faceX, faceTop, chamberFloor } from './place.js';

// Blows a lump takes off seam `tier` with tool `tool`; Infinity rings off.
export const lumpBlows = (tool, tier) => {
  const d = tool - tier;
  return d < 0 ? Infinity : LUMP_BLOWS[Math.min(d, LUMP_BLOWS.length - 1)];
};
export const faceFull = i => (S.hell.ore[HELL_TIERS[i].ore] || 0) >= FACE_LOOSE_MAX;

// One blow at face `i` with tool `tool`: what it did, as a word for the
// drawing and the checks -- 'full' (nowhere for a lump to go), 'crust' (slag
// chipped), 'ring' (the tool is under the seam), 'chip' or 'lump'.
export function blowFace(i, tool) {
  const h = S.hell, face = h.faces[i], ore = HELL_TIERS[i].ore;
  if (faceFull(i)) return 'full';
  if (face.crust > 0) { face.crust--; return 'crust'; }
  const need = lumpBlows(tool, i);
  if (need === Infinity) { h.rings++; return 'ring'; }
  if (++face.hits < need) return 'chip';
  face.hits = 0;
  face.cut++;
  h.ore[ore] = (h.ore[ore] || 0) + 1;
  h.mined[ore] = (h.mined[ore] || 0) + 1;
  h.seams[i] = Math.min(SEAM_MAX, Math.floor(face.cut / LUMPS_A_CELL));
  return 'lump';
}

// Whether a world point is on face `i`: the face's cells and a cell either
// side, floor to the face's top.
export const onFace = (i, x, y) => {
  const fx = faceX(i, S.hell.seams[i] || 0);
  return x >= fx - P && x <= fx + 2 * P && y >= faceTop(i) - P && y <= chamberFloor(i);
};

// A click in hell on a face, in world pixels: the pair's own blow with the
// best tool the forge has made. The face it struck and what the blow did,
// or null.
export function strikeAt(x, y) {
  const h = S.hell;
  if (!h) return null;
  for (let i = 0; i <= h.chamber; i++) {
    if (!onFace(i, x, y)) continue;
    return { face: i, did: blowFace(i, h.tool) };
  }
  return null;
}

// One frame of the vents: each open chamber's crusts a piece every
// VENT_CRUST_S, up to VENT_CRUST_MAX.
export function stepOre(c) {
  const h = S.hell, dt = c.dt / 1000;
  for (let i = 0; i <= h.chamber; i++) {
    const v = h.vents[i];
    v.t += dt;
    while (v.t >= VENT_CRUST_S) {
      v.t -= VENT_CRUST_S;
      if (v.crust < VENT_CRUST_MAX) v.crust++;
    }
  }
}
