// The pile-full warning over a station whose pile has filled, and where it
// hangs.

import { stationFoot } from '../board.js';
import { P } from '../config.js';
import { S, farm, sky } from '../state.js';
import { ctx } from './ctx.js';
import { drawTriangle } from './marks.js';
import { sphereUp, shellR } from '../sphere.js';
import { STATIONS, station } from '../stations.js';

// --- the ground a station pays out on to -------------------------------------
// The strips in `S.piles` are unmarked ground: the heaps themselves are their
// own best label. Nothing here holds a table of positions per station; the
// mark reads the strips, so a station added to `SITES` tomorrow is covered
// with no new code.

// A station whose pile is full has stopped, and says so: the one mark in the
// game that means nothing is happening.
export function drawPileMarks() {
  ctx.fillStyle = '#000';
  // No mark over the hole: a full hole cannot stop anything, since the first
  // grain it will not take tears it open and the rest goes through the rift
  // (`throughRift` in pit.js). A warning about a thing that no longer happens
  // teaches you to ignore warnings.
  for (const p of markedPiles()) {
    if (!S.pileFull[p.key]) continue;
    const at = pileMarkAt(p.key);
    warning(at.x, at.y);
  }
}

// Every pile that can be full: the yard's strips, and every standing station
// whose row has a pile of its own, its mark over the station.
export const markedPiles = () => [...S.piles, ...STATIONS.filter(r => r.pile && r.open()).map(r => ({ key: r.key }))];
// What the hover says over one: the row's own words, or the yard's.
export const fullSays = key => station(key)?.full || 'pile is full';

// A warning triangle: hollow, with a bar and a dot inside it. One radius, and
// everything inside is a fraction of it, so changing it changes the whole sign.
const WARN_R = P * 2.6;
export function warning(x, y, r = WARN_R) {
  drawTriangle(x, y, r, true);
  ctx.fillStyle = '#000';
  // inside the outline rather than on it: a triangle's base is its lowest
  // edge, and a dot resting on that reads as a smudge
  ctx.fillRect(x - r / 8, y - r / 4, r / 4, r * 0.4);
  ctx.fillRect(x - r / 8, y + r * 0.35, r / 4, r / 4);
}

// --- where a station's marks go -------------------------------------------------
// How wide a mark's own patch of ground is, for the hover test below.
const SLOT_W = P * 5.5;

// Where the stopped mark hangs: under the PILE, in the middle of the strip that
// has filled up, not under the station. What has stopped is the gang, and why
// is a heap lying somewhere else; the station's own ground is where the roster
// stands.
export function pileMarkAt(key) {
  const row = station(key);
  if (row?.pile) {
    const r = row.stand();
    return { x: Math.round((r.x + r.w / 2) / P) * P, y: Math.round((r.y - P * 5) / P) * P };
  }
  const strip = S.piles.find(p => p.key === key);
  // The star's dust hangs in the air with no ground under it, so its mark
  // stays under the meteor where the wizards are -- or, once a sphere stands,
  // beside it, since its tender hangs under it. A key with neither a strip nor
  // a station falls back to the farm.
  const beside = key === 'sky' && sphereUp();
  const x = beside ? sky.x + shellR() + P * 5
          : key === 'sky' ? sky.x
          : strip ? (strip.from + strip.to) / 2
          : key === 'rock' ? S.cx
          : (f => f != null ? f : farm.x + farm.w / 2)(stationFoot(key));
  const y = beside ? sky.y : key === 'sky' ? sky.y + sky.r + P * 9 : S.groundY + P * 7;
  return { x: Math.round(x / P) * P, y: Math.round(y / P) * P };
}

// where the cursor has to be to be asking about one
export function overPileMark(key, mx, my) {
  const at = pileMarkAt(key);
  // Half a slot, so two marks can never both answer to the same cursor.
  return Math.abs(mx - at.x) < SLOT_W / 2 && Math.abs(my - at.y) < P * 4;
}

