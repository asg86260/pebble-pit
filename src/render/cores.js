// What a core gives off, and the things that leave the yard: the core's glow,
// the buried and freed core, the sand that comes off it, the paid dust and the
// abyss the drowned pit holds. Owns drawCoreGlow, drawCoreAt, drawRockSand,
// drawCoreBehind, drawCore, drawPaid, drawAbyss and drawLeaving. The shared
// primitives (ctx, drawCircle, drawMark) come from ./ctx.js and ./marks.js.

import { now } from '../clock.js';
import { CORE_FROM, CORE_SIZE, P,
         ABYSS_SWELL, ABYSS_SWELL_MS, ABYSS_RIPPLE_MS, ABYSS_LANES } from '../config.js';
import { coreHome } from '../core.js';
import { shadeOf } from '../grid.js';
import { boulderAlive, sandTopY } from '../rock.js';
import { abyssLine, pitDepth } from '../pit.js';
import { S, floor, pit } from '../state.js';
import { rockLeft } from '../world.js';
import { ctx } from './ctx.js';
import { drawCircle, drawMark } from './marks.js';

// --- what a core gives off ----------------------------------------------------
// The one thing in this game with anything in it.
//
// Everything else in the yard is what it looks like: dust is dust, a shard is a
// blue chip, a rock is a lot of rock. A core is a rock's worth of *something*
// and the game has never said so -- it was a ring, drawn once, sitting there.
//
// So it gives something off: rings of cells walking outward and fading, each
// one a different colour and all of them cycling, which is as close to heat
// coming off a thing as a grid this coarse gets. Cells, not a gradient -- the
// glow is made of the same squares the rest of the world is, so it belongs to
// the picture rather than sitting on top of it -- and faint, because the whole
// of it should read as the air over the thing rather than as the thing.
const WAVES = 3;                   // rings in the air at once
const WAVE_MS = 2400;              // how long one takes to walk out and go
const WAVE_REACH = P * 6;          // and how far it gets
const WAVE_ALPHA = 0.62;

// Rounding that treats the two sides of nought alike. See the ring below.
const evenly = v => Math.sign(v) * Math.round(Math.abs(v));

export function drawCoreGlow(cx, cy, capAtGround) {
  const t = now();
  // The middle, snapped once, and every cell of every ring measured from *it*.
  //
  // Each cell used to be snapped to the world grid on its own -- `round(x / P)`
  // of an absolute position -- which puts the ring where the grid happens to
  // fall rather than round the thing it belongs to. The core does not sit on a
  // whole cell (it rolls, and you carry it about), so the rounding bit harder on
  // one side than the other and the glow sat visibly off its own disc. Measured
  // out from a snapped middle, it is symmetrical by construction and still lands
  // on whole cells.
  // The origin IS the centre of the circle. Not a cell corner, not the nearest
  // cell centre -- the point the disc is drawn around.
  //
  // This has been wrong twice, in the same way both times: the ring was measured
  // out from a *snapped* version of the middle, so it sat wherever the lattice
  // fell rather than around the thing it belongs to. Snapping to a corner put it
  // half a cell down and right; snapping to a cell centre fixed the systematic
  // half-cell and left up to another half of drift, because a core does not sit
  // on a whole cell -- it rolls, and you carry it about. Three pixels on an
  // eighteen-pixel core is still visibly off its own disc.
  //
  // So nothing is snapped. Each cell is still a whole cell and still a whole
  // cell's step from the next -- the shape is as square as it ever was -- but
  // the point they are all measured from is `cx, cy` exactly, which makes the
  // ring symmetric about the disc by construction at any position.
  const ox = cx, oy = cy;
  for (let i = 0; i < WAVES; i++) {
    const k = ((t / WAVE_MS) + i / WAVES) % 1;
    const r = CORE_SIZE / 2 + k * WAVE_REACH;
    // out and gone: it thins as it widens, the way anything spreading does
    ctx.globalAlpha = WAVE_ALPHA * (1 - k) * (1 - k);
    ctx.fillStyle = `hsl(${Math.round(t / 12 + i * 140) % 360} 85% 58%)`;
    // one cell per cell of arc, and never the same cell twice: a ring drawn at
    // an even angle doubles up on the diagonals, and a cell painted twice at
    // half alpha is a cell at full alpha
    // An EVEN number of them, always.
    //
    // This is why the ring leaned. The angles sampled are `j/n` of a turn plus
    // however far round the ring has spun; when n is even that set is closed
    // under adding half a turn, so every cell has an exact opposite and the
    // whole thing is symmetric about the middle wherever it has spun to. When n
    // is odd nothing pairs up and the ring really is lopsided -- a different way
    // each frame, which is how it looked.
    const spokes = Math.max(8, Math.round((Math.PI * 2 * r) / P));
    const n = spokes + (spokes % 2);
    const seen = new Set();
    for (let j = 0; j < n; j++) {
      const a = (j / n) * Math.PI * 2 + k * 0.8;      // and it turns as it goes
      // Rounded away from nought rather than always upwards -- the other half
      // of the lean. `Math.round` goes half-UP, so a cell wanted at plus a half
      // lands on 1 and its mirror at minus a half lands on 0: the offset exists
      // on one side and not on the other. `cell` is odd-symmetric, so
      // `cell(-v) === -cell(v)` for every v and a pair of opposite spokes always
      // produces a pair of opposite cells.
      const x = ox + evenly(Math.cos(a) * r / P) * P;
      const y = oy + evenly(Math.sin(a) * r / P) * P;
      // A whole ring, except where the thing is still inside the rock.
      //
      // A core lying about glows all round, which is what a thing giving
      // something off does -- the ground line is not a lid for it. But the one
      // still buried is drawn BEHIND the boulder so the boulder covers it, and
      // the rock only covers what is above the ground line: the bottom of the
      // ring came out underneath the hill and lay on the open ground, glowing,
      // while the core was still in the rock. So that one -- and only that one
      // -- keeps the cut.
      if (capAtGround && y - P / 2 >= S.groundY) continue;


      const key = `${x},${y}`;
      if (seen.has(key)) continue;
      seen.add(key);
      // `x, y` is where the cell's MIDDLE goes; `fillRect` wants its top-left.
      // Passing one as the other puts every cell of the ring half a cell down
      // and to the right, which is the whole ring off its own disc -- and it is
      // the same half cell three times over now, so it is worth being explicit:
      // this offset is the conversion, not a nudge.
      ctx.fillRect(x - P / 2, y - P / 2, P, P);
    }
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#000';
}

export function drawCoreAt(x, y, capAtGround) {
  // One middle for both, so the glow and the thing it is coming off cannot
  // disagree about where the thing is.
  const cx = x + CORE_SIZE / 2, cy = y + CORE_SIZE / 2;
  drawCoreGlow(cx, cy, capAtGround);
  // radius allows for the 2px stroke, so the circle stays inside its box and
  // never paints over the ground line it is resting on
  drawCircle(cx, cy, CORE_SIZE / 2 - 2);
}

// What is lying on the hill. Drawn straight after the rock and before the chips,
// so a grain on the crest is in front of the rock it is resting on and behind
// anything still in the air over it.
//
// Every grain through `drawMark`, which is what a chip in the air and a mark on
// the ground both go through: what lands up here is dust, or a spore, or a
// shard, and it has to look like the thing it is. There are never many of them
// -- a rockhand throws them off between swings -- so a call each costs nothing.
export function drawRockSand() {
  if (!boulderAlive() || !S.rockSand) return;
  const left = rockLeft();
  for (let c = 0; c < S.rockSand.length; c++) {
    const s = S.rockSand[c];
    if (!s || !s.length) continue;
    const top = sandTopY(c);
    for (let k = 0; k < s.length; k++)
      drawMark(s[k], left + c * P + P / 2, top + (s.length - 1 - k) * P + P / 2);
  }
  ctx.fillStyle = '#000';
}

// Buried in the rock: drawn first so the boulder covers it until you dig it out.
//
// Which is only true once the boulder is *there*. A rock still coming down out
// of the sky is drawn up in the sky, so for the second and a half of the fall it
// covers nothing at all and the core sat on the bare ground in plain view,
// waiting to be landed on. Nothing is buried until there is something on top
// of it.
export function drawCoreBehind() {
  if (S.heldCore || S.coreItem || !boulderAlive() || S.rockFall > 0) return;
  // and there is nothing to see inside the first four, because there is nothing
  // in them: cores start at CORE_FROM. `coreBuried` is set on every rock -- what
  // it means is "this one still has something to give up", which is a question
  // about the rock being whole rather than about what is inside it -- so drawing
  // off it showed a core in four rocks that were never going to yield one.
  if (S.boulderNo < CORE_FROM) return;
  const h = coreHome();
  drawCoreAt(h.x, h.y, true);          // still in the rock: nothing spills onto the ground
}

// out in the world: on the cursor or lying on the ground
export function drawCore() {
  if (S.heldCore) drawCoreAt(S.mouse.x - CORE_SIZE / 2, S.mouse.y - CORE_SIZE / 2);
  else if (S.coreItem) drawCoreAt(S.coreItem.x, S.coreItem.y);
}

// The grains in the air on the way out of the pile, drawn as whatever they are.
const drawLeaving = list => {
  let shade = 0;
  for (const m of list) {
    if (m.s !== shade) { shade = m.s; ctx.fillStyle = shadeOf(m.s); }
    ctx.fillRect(Math.round(m.x), Math.round(m.y), P, P);
  }
  ctx.fillStyle = '#000';
};

// The stream arcing off the top of the pile to the bench, because you bought
// something. The other stream off the pile -- the one going into the abyss --
// is drawn by `drawAbyss`, under the liquid's own fill, so a grain that has
// crossed the surface is gone into it rather than drawn on top of it.
export function drawPaid() { drawLeaving(S.paid); }

// The abyss: the drowned pit. The hole gave way and what it holds now is a
// black liquid standing a few cells below the brim -- see "The abyss" in
// DESIGN.md, and `abyssLine` in pit.js for where the surface stands (during
// the tear it rises out of the floor with the pile it is taking).
//
// Four things are drawn, and each is one property of the thing:
//
//   the body    solid ink from the surface to the floor of the hole, clipped
//               to the mouth. Black mass is the game's own language for a
//               body of anything; what says liquid is the surface, not a tone.
//   the swell   the surface breathes, a cell up and down, in a few lanes out
//               of step with each other -- slow enough to read as depth
//               rather than as waves.
//   the ripples a white notch where a grain just went in, gone in half a
//               second. The eating is the one event the liquid has, and it
//               happens at the surface, where you threw the thing.
//   the plank   a board over the mouth at the brim. The drowned pit stays a
//               way through -- the two ladders exist exactly so it is not a
//               dead end -- and the plank is what the crossing stands on.
//
// The order is the picture: diving grains go down first and the body over
// them at the waterline, so anything past the surface is gone into it.
//
export function drawAbyss() {
  if (!S.riftOpen) return;
  const t = now();
  const line = abyssLine();
  const floorY = S.groundY + pitDepth();
  const laneW = pit.w / ABYSS_LANES;

  // The grains still diving, before the body goes down, so a grain past the
  // surface is under it.
  drawLeaving(S.gulped);

  // The body, one lane at a time so the surface can breathe. Each lane's own
  // phase off its index; the swell is snapped to the cell, because half a cell
  // of liquid is a hairline.
  ctx.fillStyle = '#000';
  for (let l = 0; l < ABYSS_LANES; l++) {
    const sw = Math.round(Math.sin(t / ABYSS_SWELL_MS * Math.PI * 2 + l * 1.7)
                          * (ABYSS_SWELL / P)) * P;
    const top = Math.min(floorY, line + sw);
    const x0 = Math.round((pit.x + l * laneW) / P) * P;
    const x1 = Math.round((pit.x + (l + 1) * laneW) / P) * P;
    ctx.fillRect(x0, top, x1 - x0, Math.max(0, floorY - top));
  }

  // The ripples: a white notch cut into the surface where something just went
  // in, opening a cell as it dies. On the surface's own line, so it reads as
  // the liquid closing over rather than as a mark floating on it.
  ctx.fillStyle = '#fff';
  for (const r of S.ripples) {
    const k = Math.min(1, (t - r.at) / ABYSS_RIPPLE_MS);
    const wide = P * (1 + Math.round(k * 2));
    const rx = Math.round((r.x - wide / 2) / P) * P;
    ctx.fillRect(rx, Math.round(line / P) * P, wide, P);
  }

  // And the plank over the mouth: a board a cell thick lying on the two lips,
  // which is what a body crossing the drowned pit walks on (see `pitTop`).
  ctx.fillStyle = '#000';
  ctx.fillRect(Math.round((pit.x - P) / P) * P, S.groundY - P, pit.w + P * 2, P);
}

