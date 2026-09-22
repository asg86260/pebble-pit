// The air filter: a louvered shed, its slats open while somebody is inside.

import { DIAL_CELLS, DIAL_STEPS, DIAL_STUB, DIAL_ZONES, DIAL_ZONE_NAMES, DOOR_H, DOOR_W, FILTER_PORT, FILTER_SLATS,
         FILTER_SPOUT, FILTER_VENT, FILTER_WALL, HOUSE_CURTAIN, MUCK_TONE, P } from '../config.js';
import { CLODS } from '../smog.js';
import { inFilter } from '../filter.js';
import { S, filter } from '../state.js';
import { ctx } from './ctx.js';
import { rising as risingAt, withRise } from './rise.js';

// The air filter: a gabled shed like the quarry's and the farm's, with a
// cupola on its ridge and a bank of slats across its front. It is drawn in
// the yard's own way, solid black with the openings cut out of it.
//
// The air goes in at the vent in the cupola (`intake` in smog/band.js), which
// is why the cupola is there: the one building that takes something in at the
// top shows where. What the shed is DOING is the slats: shut is a grey band,
// open is white, and while somebody is inside they stand open with one of
// them swinging shut in turn, going round faster the more are in there. No
// frame of the working bank is the idle one, since the idle one is every slat
// shut. The dial hangs off the far wall and the spout comes out of the near
// one, low, throwing what the shed catches onto its heap.
//
// Every edge is a whole cell off the building's own corner, which world.js
// snaps to the lattice; a quarter-cell edge antialiases.
const ROOF = 5;          // courses of roof, from the ridge down to the eaves
const LOUVER = [9, 11, 13];   // the courses the slats are cut in, one per slat
const DIAL_ROW = 8;      // courses down the front the dial's top sits: under the eaves

// Cells across a course, from col `a` to col `b`, and down `n` courses.
const box = (c, r, a, row, b, n = 1) => ctx.fillRect(c(a), r(row), P * (b - a + 1), P * n);

export function drawFilter() {
  const rising = risingAt('filter') && 'filter';
  if (!S.filterOpen && !rising) return;
  const { x, y, w, h } = filter;
  withRise(rising, x, S.groundY, w, h, () => {
  const across = Math.round(w / P), down = Math.round(h / P);
  const mid = (across - 1) / 2;
  const c = (n) => x + P * n;                        // cell n across the front
  const r = (n) => y + P * n;                        // and cell n down it
  const wallL = FILTER_WALL, wallR = across - 1 - FILTER_WALL;
  const eaves = FILTER_VENT + 2;                     // the course the roof starts on

  ctx.fillStyle = '#000';
  // The cupola: a cap over a little box on the ridge, the vent cut in it.
  box(c, r, mid - 2, 0, mid + 2);
  box(c, r, mid - 1, FILTER_VENT, mid + 1, eaves - FILTER_VENT);
  // The roof, stepping out a cell a side a course from the ridge to the
  // eaves, which reach a cell past the walls.
  for (let i = 0; i < ROOF; i++) {
    const half = i === ROOF - 1 ? wallR - mid + 1 : 2 + i;
    box(c, r, mid - half, eaves + i, mid + half);
  }
  // The walls, down to the ground.
  box(c, r, wallL, eaves + ROOF, wallR, down - eaves - ROOF);

  ctx.fillStyle = '#fff';
  box(c, r, mid, FILTER_VENT, mid);
  // The slats. Shut, a slat is a grey band; open, it is cut through.
  const on = inFilter() > 0;
  const shut = on ? Math.floor(S.slatAt) % FILTER_SLATS : -1;
  LOUVER.slice(0, FILTER_SLATS).forEach((row, i) => {
    ctx.fillStyle = on && i !== shut ? '#fff' : HOUSE_CURTAIN;
    box(c, r, wallL + 2, row, wallR - 2);
  });

  // The way in, DOOR_W by DOOR_H like every other door, since what a door is
  // measured against is a body. An even door on an odd front lands half a
  // cell to one side of the middle; the alternative is an odd door everywhere.
  ctx.fillStyle = '#fff';
  ctx.fillRect(c(mid - DOOR_W / 2 + 1), r(down - DOOR_H), P * DOOR_W, P * DOOR_H);

  ctx.fillStyle = '#000';
  drawDial(c(wallR + 1), r, DIAL_ROW);
  // The spout: a stub out of the near wall, low, pointing out over the heap.
  // It ends a cell short of where a load leaves (`outlet`), so nothing is
  // born inside the black.
  box(c, r, wallL - FILTER_SPOUT, down - FILTER_PORT, wallL - 1);
  // The recycler is a sieve over its mouth: the stub's end cell left open,
  // so what comes out has been sorted on the way.
  if (S.recycler) {
    ctx.fillStyle = HOUSE_CURTAIN;
    box(c, r, wallL - FILTER_SPOUT, down - FILTER_PORT, wallL - FILTER_SPOUT);
  }
  });
}

// The dial's box in the world, for its hover (input.js): the face and ring,
// where `drawDial` puts them off the far wall.
export function dialRect() {
  if (!S.filterOpen) return null;
  return { x: filter.x + filter.w - P * FILTER_WALL + P * DIAL_STUB, y: filter.y + P * DIAL_ROW,
           w: P * DIAL_CELLS, h: P * DIAL_CELLS };
}
// Which band the needle is in, by name: the same line of cells it is drawn on,
// so the hover and the picture cannot disagree.
export const dialZone = () =>
  DIAL_ZONE_NAMES[Math.min(DIAL_ZONE_NAMES.length - 1, Math.floor(S.dialStep / DIAL_STEPS * DIAL_ZONE_NAMES.length))];

// Where the station's flag stands (render/aura.js): on the cupola's cap, the
// top of the building.
export function filterFlagSpot() {
  const mid = (Math.round(filter.w / P) - 1) / 2;
  return { x: filter.x + P * mid, y: filter.y };
}

// The dial: a ring of cells round a white face, on a stub off the far wall,
// the one face of the shed with nothing else on it. Laid out as a mask
// rather than as a circle, because at seven cells a circle is a choice about
// which cells, and the choice should be made once, here, where it can be
// looked at.
const DIAL = [
  '..###..',
  '.#...#.',
  '#.....#',
  '#.....#',
  '#.....#',
  '.#...#.',
  '..###..'
];
const HUB = (DIAL_CELLS - 1) / 2;   // the middle cell, across and down

// Three quarters of a turn, clean at the lower left, through the top, brim at
// the lower right, the way a pressure gauge reads.
function needle(step) {
  const a = Math.PI * 0.75 + (step / (DIAL_STEPS - 1)) * Math.PI * 1.5;
  const dx = Math.cos(a), dy = Math.sin(a);
  // A cell a step from the hub along the needle's angle, and one two steps
  // out: every angle is a line of whole cells. A tip that lands on the ring
  // is left off, or the needle reads as a notch in the rim; on a diagonal
  // the needle is the hub and one cell.
  return [1, 2].map(d => [HUB + Math.round(dx * d), HUB + Math.round(dy * d)])
    .filter(([i, j]) => DIAL[j][i] !== '#');
}

// A ring cell's band: its angle from the hub as a share of the sweep, clean
// at the lower left round to brim at the lower right, in thirds.
function zoneOf(i, j) {
  let a = Math.atan2(j - HUB, i - HUB);
  if (a < Math.PI * 0.75 - 1e-6) a += Math.PI * 2;
  const share = (a - Math.PI * 0.75) / (Math.PI * 1.5);
  if (share < 0 || share > 1) return '#000';
  return DIAL_ZONES[Math.min(DIAL_ZONES.length - 1, Math.floor(share * DIAL_ZONES.length))];
}

function drawDial(wall, r, row) {
  const x0 = wall + P * DIAL_STUB, y0 = r(row);
  ctx.fillStyle = '#000';
  // the stub it hangs on, one cell out of the wall at the hub's height
  ctx.fillRect(wall, y0 + P * HUB, P * DIAL_STUB, P);
  ctx.fillStyle = '#fff';
  for (let j = 1; j < DIAL.length - 1; j++) {
    const row = DIAL[j], from = row.indexOf('#') + 1, to = row.lastIndexOf('#');
    ctx.fillRect(x0 + P * from, y0 + P * j, P * (to - from), P);
  }
  // The ring in its three bands, by where each cell of it sits along the
  // sweep; the cells under the hub, outside the sweep, stay black.
  for (let j = 0; j < DIAL.length; j++)
    for (let i = 0; i < DIAL[j].length; i++) {
      if (DIAL[j][i] !== '#') continue;
      ctx.fillStyle = zoneOf(i, j);
      ctx.fillRect(x0 + P * i, y0 + P * j, P, P);
    }
  ctx.fillStyle = '#000';
  ctx.fillRect(x0 + P * HUB, y0 + P * HUB, P, P);
  for (const [i, j] of needle(S.dialStep)) ctx.fillRect(x0 + P * i, y0 + P * j, P, P);
}

// A load in the air, thrown off the spout or let fall from a balloon's basket:
// one cell of muck, in the muck's own tone, on its way to where it lands.
export function drawClods() {
  if (!CLODS.length) return;
  ctx.fillStyle = MUCK_TONE;
  for (const k of CLODS)
    ctx.fillRect(Math.floor(k.x / P) * P, Math.floor(k.y / P) * P, P, P);
}
