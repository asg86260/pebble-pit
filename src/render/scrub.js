// The scrubbing house: its hood open to the sky and the bellows breathing
// under it.

import { DOOR_H, DOOR_W, P, SCRUB_ARM, SCRUB_CHUTE, SCRUB_FOLDS } from '../config.js';
import { inScrub } from '../scrubhouse.js';
import { S, floor, scrub } from '../state.js';
import { ctx } from './ctx.js';
import { rising as risingAt, withRise } from './rise.js';

// The scrubbing house: a hood open to the sky, and a bellows breathing under it.
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
// only, and it settles fold by fold when the last body leaves (scrubhouse.js
// stepScrub). One bellows for any number of bodies, beating faster with each
// up to four: what the building says is how hard it is being worked.
//
// Every edge is a whole cell off the building's own corner, which world.js
// snaps to the lattice; a quarter-cell edge antialiases.
const HOOD = 5;          // courses of hood standing against the sky, above the tower
const HOOD_WALL = 4;     // and cells of black through each of its two walls
const BAY = 8;           // courses of shaft the bellows hangs in
const LEAF = 5;          // and cells across every leaf of it, in a shaft LEAF + 2 wide
// see config.js: the mechanic reads these two as well, so they live there
const CHUTE = SCRUB_CHUTE;
export function drawScrub() {
  const rising = risingAt('scrub') && 'scrub';
  if (!S.scrubOpen && !rising) return;
  const { x, y, w, h } = scrub;
  withRise(rising, x, S.groundY, w, h, () => {
  const on = inScrub() > 0;
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

  // A vent out of the far wall, the one face of this building with nothing on
  // it. A stub with an elbow turned up, drawn on sky rather than cut into the
  // wall: white over a face already painted white is a nick you cannot see,
  // and a hole in the black reads as a second way in. UP because what this
  // house has spare is air; the chute on the other side turns down for grit.
  ctx.fillStyle = '#000';
  const vent = c(across - towerL);
  ctx.fillRect(vent, r(HOOD + 2), P * 2, P);
  ctx.fillRect(vent + P, r(HOOD + 1), P, P);

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
  // animation, and scrubhouse.js keeps it, because a clock kept in the draw
  // loop runs at double speed the moment anything draws the yard twice in a
  // frame. Worked, the count never reaches nought, so the one pose that means
  // nobody is home is a pose the working cycle cannot show. The shaft is deep
  // enough for the whole stroke and one cell over, so the foot never lands on
  // the floor of its own shaft. A leaf is one cell thick because a fold is
  // thin: a moving part, not a member.
  const k = Math.floor(S.pumpAt) % (SCRUB_FOLDS * 2);
  const fold = k <= SCRUB_FOLDS ? k : SCRUB_FOLDS * 2 - k;
  const open = on ? Math.max(1, fold) : fold;
  ctx.fillStyle = '#000';
  for (let i = 0; i <= SCRUB_FOLDS; i++)
    ctx.fillRect(c(mid - (LEAF - 1) / 2), r(head + i + Math.min(i, open)), P * LEAF, P);

  // The way in, DOOR_W by DOOR_H like every other door, since what a door is
  // measured against is a body. This is the one front an even door cannot
  // center on: about a single column it lands half a cell to one side, and the
  // alternative is an odd door everywhere. It stops one course short of the
  // shaft, so there is a solid course between the way in and the works.
  ctx.fillStyle = '#fff';
  ctx.fillRect(c(mid - DOOR_W / 2 + 1), r(down - DOOR_H), P * DOOR_W, P * DOOR_H);
  ctx.fillStyle = '#000';

  // The recycler is a chute: an arm out of the near wall, two courses deep,
  // turning a cell down at its end. Black on sky, since every white version
  // disappeared against ground the building had already painted white. The arm
  // is CHUTE cells long so it comes out one cell past the corner the hood's
  // flare comes down to, ending over the cell smog.js releases the grain from
  // (outlet()); the lip drops from that same end, so the two cannot come apart
  // if the shaft is ever a course deeper. It hangs off the foot of the building
  // and the courses of daylight wanted under it, never off the door: measured
  // off the door, widening the way in by a course swung the arm down into the
  // crew, whose heads are three courses tall.
  if (!S.recycler) return;
  ctx.fillStyle = '#000';
  const end = c(towerL) - P * CHUTE;
  const armTop = down - SCRUB_ARM - 2;
  ctx.fillRect(end, r(armTop), P * CHUTE, P * 2);
  ctx.fillRect(end, r(armTop + 2), P, P);
  });
}
