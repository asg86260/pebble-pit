// The air filter: its hood open to the sky and the bellows breathing
// under it.

import { DIAL_CELLS, DIAL_STEPS, DIAL_STUB, DOOR_H, FILTER_HOOD, DOOR_W, MUCK_TONE, P, FILTER_ARM, FILTER_CHUTE, FILTER_FOLDS } from '../config.js';
import { CLODS } from '../smog.js';
import { inFilter } from '../filter.js';
import { S, floor, filter } from '../state.js';
import { ctx } from './ctx.js';
import { rising as risingAt, withRise } from './rise.js';

// The air filter: a hood open to the sky, and a bellows breathing under it.
//
// The only building that takes anything in at the top, because what it takes
// comes out of the sky: five courses of wall flaring open at the haze, each
// stepping a cell out from the one below, closing in the silhouette itself to
// three cells (eleven, nine, seven, five, three). Four cells through each
// wall, the weight the lab's chimney is drawn at. The mouth is mass and closes
// the whole way whether or not anybody is in there: what a building IS cannot
// depend on whether it is working.
//
// What it is DOING is the bellows, hung from the head of a shaft on the middle
// column. Five cells across in a shaft seven wide, so there is a clear cell of
// white down either side however it is folded: a black thing touching black
// wall on both sides is a bridge across a shaft, not an object in one. A
// bellows because it does not travel, it changes its own proportions: there
// is no frame of the working bellows that is the frame of the idle one, which
// a fan halted at some angle could never say. It opens a fold at a time from
// the mount downward, because a fold is a whole cell. Under work the count of
// open folds runs one, two, three, two and never reaches nought; shut is rest
// only, and it settles fold by fold when the last body leaves (filter.js
// stepFilter). One bellows for any number of bodies, beating faster with each
// up to four: what the building says is how hard it is being worked.
//
// Every edge is a whole cell off the building's own corner, which world.js
// snaps to the lattice; a quarter-cell edge antialiases.
const HOOD = FILTER_HOOD;
const HOOD_WALL = 4;     // and cells of black through each of its two walls
const BAY = 8;           // courses of shaft the bellows hangs in
const LEAF = 5;          // and cells across every leaf of it, in a shaft LEAF + 2 wide
// see config.js: the mechanic reads these two as well, so they live there
const CHUTE = FILTER_CHUTE;
export function drawFilter() {
  const rising = risingAt('filter') && 'filter';
  if (!S.filterOpen && !rising) return;
  const { x, y, w, h } = filter;
  withRise(rising, x, S.groundY, w, h, () => {
  const on = inFilter() > 0;
  const across = Math.round(w / P), down = Math.round(h / P);
  const throatMid = (across - 1) / 2;      // the middle column, wanted before the shaft is
  const c = (n) => x + P * n;                        // cell n across the front
  const r = (n) => y + P * n;                        // and cell n down it

  ctx.fillStyle = '#000';
  // The hood, drawn as its two walls rather than as a block with the mouth
  // painted white back out of it: over sky those are the same picture.
  for (let i = 0; i < HOOD; i++) {
    ctx.fillRect(c(i), r(i), P * HOOD_WALL, P);
    ctx.fillRect(c(across - HOOD_WALL - i), r(i), P * HOOD_WALL, P);
  }
  // The tower: exactly as wide as the hood has come down to, so the walls land
  // on it and the two are one object.
  const towerL = HOOD - 1;
  ctx.fillRect(c(towerL), r(HOOD), P * (across - towerL * 2), h - P * HOOD);

  // The throat: one white cell on the middle column, always open, one course
  // below the last course of hood. It is where the caught motes end (smog.js
  // intake()), and every cell a mote can be let go in near it (smog.js pull())
  // is inside this building, so a thread that ends early ends inside the mouth.
  // It does not blink with the building's state: the bellows says whether this
  // place is working, and a second telling of the same fact is noise.
  ctx.fillStyle = '#fff';
  ctx.fillRect(c(throatMid), r(HOOD), P, P);

  drawDial(c(across - towerL), r);

  // The shaft, and the bellows in it. It starts one whole solid course below
  // the point of the throat, or a hole opening into a hole is one tall opening
  // rather than a mouth over a works. Everything on the front is worked out
  // from the middle column, which an odd front has and an even one does not.
  const mid = (across - 1) / 2;
  const head = HOOD + 2;
  ctx.fillStyle = '#fff';
  ctx.fillRect(c(mid - (LEAF + 1) / 2), r(head), P * (LEAF + 2), P * BAY);

  // The folds, a cell at a time: half a cell of travel is a leaf drawn across
  // a fraction of a device pixel. The count of open folds is the whole of the
  // animation, and filter.js keeps it, because a clock kept in the draw
  // loop runs at double speed the moment anything draws the yard twice in a
  // frame. Worked, the count never reaches nought, so the one pose that means
  // nobody is home is a pose the working cycle cannot show. The shaft is deep
  // enough for the whole stroke and one cell over, so the foot never lands on
  // the floor of its own shaft. A leaf is one cell thick because a fold is
  // thin: a moving part, not a member.
  const k = Math.floor(S.pumpAt) % (FILTER_FOLDS * 2);
  const fold = k <= FILTER_FOLDS ? k : FILTER_FOLDS * 2 - k;
  const open = on ? Math.max(1, fold) : fold;
  ctx.fillStyle = '#000';
  for (let i = 0; i <= FILTER_FOLDS; i++)
    ctx.fillRect(c(mid - (LEAF - 1) / 2), r(head + i + Math.min(i, open)), P * LEAF, P);

  // The way in, DOOR_W by DOOR_H like every other door, since what a door is
  // measured against is a body. This is the one front an even door cannot
  // center on: about a single column it lands half a cell to one side, and the
  // alternative is an odd door everywhere. It stops one course short of the
  // shaft, so there is a solid course between the way in and the works.
  ctx.fillStyle = '#fff';
  ctx.fillRect(c(mid - DOOR_W / 2 + 1), r(down - DOOR_H), P * DOOR_W, P * DOOR_H);
  ctx.fillStyle = '#000';

  // The spout is a chute: an arm out of the near wall, two courses deep,
  // turning a cell down at its end. It is the filter's from the day it stands,
  // since everything it takes out of the sky comes out here. Black on sky,
  // since every white version disappeared against ground the building had
  // already painted white. The arm is CHUTE cells long so it comes out one
  // cell past the corner the hood's flare comes down to, ending over the cell
  // smog.js releases a load from (outlet()); the lip drops from that same end,
  // so the two cannot come apart if the shaft is ever a course deeper. It hangs
  // off the foot of the building and the courses of daylight wanted under it,
  // never off the door: measured off the door, widening the way in by a course
  // swung the arm down into the crew, whose heads are three courses tall.
  ctx.fillStyle = '#000';
  const end = c(towerL) - P * CHUTE;
  const armTop = down - FILTER_ARM - 2;
  ctx.fillRect(end, r(armTop), P * CHUTE, P * 2);
  ctx.fillRect(end, r(armTop + 2), P, P);
  // The recycler is a sieve let into the arm: a row of open cells along its
  // top, every other one, so what goes down the chute is sorted on the way.
  if (S.recycler) {
    ctx.fillStyle = '#fff';
    for (let i = 1; i < CHUTE - 1; i += 2) ctx.fillRect(end + P * i, r(armTop), P, P);
  }
  });
}

// The dial: a ring of cells round a white face, on a stub off the far wall,
// the one face of this building with nothing else on it. Laid out as a mask
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
const DIAL_ROW = 6;      // courses down the front its top sits: clear of the hood's flare
const HUB = (DIAL_CELLS - 1) / 2;   // the middle cell, across and down

// Three quarters of a turn, clean at the lower left, through the top, brim at
// the lower right, the way a pressure gauge reads. No zones and no red line:
// the rain keeps its own clock, so no reading is a threshold.
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

function drawDial(wall, r) {
  const x0 = wall + P * DIAL_STUB, y0 = r(DIAL_ROW);
  ctx.fillStyle = '#000';
  // the stub it hangs on, one cell out of the wall at the hub's height
  ctx.fillRect(wall, y0 + P * HUB, P * DIAL_STUB, P);
  ctx.fillStyle = '#fff';
  for (let j = 1; j < DIAL.length - 1; j++) {
    const row = DIAL[j], from = row.indexOf('#') + 1, to = row.lastIndexOf('#');
    ctx.fillRect(x0 + P * from, y0 + P * j, P * (to - from), P);
  }
  ctx.fillStyle = '#000';
  for (let j = 0; j < DIAL.length; j++)
    for (let i = 0; i < DIAL[j].length; i++)
      if (DIAL[j][i] === '#') ctx.fillRect(x0 + P * i, y0 + P * j, P, P);
  ctx.fillRect(x0 + P * HUB, y0 + P * HUB, P, P);
  for (const [i, j] of needle(S.dialStep)) ctx.fillRect(x0 + P * i, y0 + P * j, P, P);
}

// A load on its way down off the spout, or off a balloon's basket: one cell
// of muck, in the muck's own tone, falling to the heap it will land on.
export function drawClods() {
  if (!CLODS.length) return;
  ctx.fillStyle = MUCK_TONE;
  for (const k of CLODS)
    ctx.fillRect(Math.floor(k.x / P) * P, Math.floor(k.y / P) * P, P, P);
}
