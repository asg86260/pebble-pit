// What a core gives off, and the things that leave the yard: the core's glow,
// the buried and freed core, the sand that comes off it, the paid dust and the
// rift eating a pile. Extracted verbatim from render.js; behavior unchanged.
// Owns drawCoreGlow, drawCoreAt, drawRockSand, drawCoreBehind, drawCore,
// drawPaid, drawRift and drawLeaving. The shared primitives (ctx, drawCircle,
// drawMark) come from ./ctx.js and ./marks.js.

import { now } from '../clock.js';
import { CORE_FROM, CORE_SIZE, P,
         RIFT_HALO, RIFT_STIPPLE, RIFT_STIPPLE_MS, RIFT_LENS, RIFT_LENS_MS,
         RIFT_STREAKS, RIFT_STREAK_MS, RIFT_STREAK_FROM, RIFT_STREAK_TURN,
         RIFT_STREAK_LEN, RIFT_TAIL, RIFT_TAIL_R } from '../config.js';
import { coreHome } from '../core.js';
import { shadeOf } from '../grid.js';
import { boulderAlive, sandTopY } from '../rock.js';
import { S, floor, rift } from '../state.js';
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
// something. The other stream off the pile -- the one going into the rift -- is
// drawn by `drawRift`, under the disc, so a grain that has spiralled inside the
// rim is gone behind it rather than drawn over it.
export function drawPaid() { drawLeaving(S.paid); }

// The rift: a black hole hanging in the pit, with everything the yard throws
// into the hole being pulled through it.
//
// Everything in this yard is black cells on white paper, so the honest drawing
// of an absence is the paper's opposite -- a solid black disc, with nothing
// inside it because there is nothing inside it. It is the only thing in the
// game that is a shape rather than an object: no walls, no roof, no machine on
// the front. And it is always filled in, because it is always open: nobody
// holds it, so there is no shut to draw.
//
// A disc on its own was not enough, and what it was missing was *pulling*. Four
// things are drawn now and each of them is one property of the thing:
//
//   the halo    two cells of bare paper cleared round the rim, and a thinning
//               stipple past that. This is what makes the core dark: there is no
//               ink blacker than ink, so the way to deepen the middle is to take
//               everything else away from around it.
//   the streaks stuff falling in, spiralling to the rim, running whether or not
//               the hole has anything to eat. That matters more than it sounds:
//               a fed rift empties the pile within a frame or two of the grains
//               landing, so most of the endgame it has nothing in its mouth, and
//               a hole that only moves when it is fed looks broken exactly when
//               it is working hardest.
//   the lens    the rim swells and shrinks, slowly and not evenly round itself.
//               Light bending is the one property of a black hole everybody
//               knows by sight, and on a grid this coarse it can only be a warp
//               of the silhouette.
//   the tails   a smear on each grain actually going in, pointing back the way
//               it came, so the stream reads as dragged rather than as beads
//               threaded on a wire.
//
// The order is the picture: halo, streaks and tails go down first and the disc
// over them, so anything that has crossed the rim is gone behind it rather than
// drawn on top of it -- which is what going *in* looks like.

// How far out of round the rim is at a given angle, this instant. One slow
// breath plus a second one at a third the size and twice the rate, which is
// enough to keep it from ever being a circle pulsing on a metronome.
const lensAt = (a, t) =>
  1 + RIFT_LENS * (Math.sin(t / RIFT_LENS_MS * Math.PI * 2 + a * 2) * 0.75
                 + Math.sin(t / RIFT_LENS_MS * Math.PI * 4 + a * 3) * 0.25);

export function drawRift() {
  if (!S.riftOpen) return;
  const t = now();
  const { x, y, w, h } = rift;
  const across = Math.round(w / P), down = Math.round(h / P);
  const mid = (across - 1) / 2, midR = (down - 1) / 2;
  const cx = x + (mid + 0.5) * P, cy = y + (midR + 0.5) * P;
  const rad = (mid + 0.5) * P;

  // A disc, warped by the lens: the half-width of each row off the circle,
  // worked out from the row rather than written down as a table, so the shape
  // follows RIFT_W and RIFT_H if either ever moves. `grow` widens it in cells,
  // which is how the halo is cut: the same disc, a couple of cells fatter, in
  // paper.
  const disc = (grow, style) => {
    ctx.fillStyle = style;
    for (let r = -grow; r < down + grow; r++) {
      const dy = (r - midR) / (midR + 0.5 + grow);
      // The row's own angle, so the warp is a shape rather than a size: the rim
      // leans out on one side while it comes in on the other.
      const half = Math.floor((mid + grow) * lensAt(Math.asin(Math.max(-1, Math.min(1, dy))), t)
                              * Math.sqrt(Math.max(0, 1 - dy * dy)) + 0.5);
      if (half < 0) continue;
      const left = x + Math.round(mid - half) * P;
      ctx.fillRect(left, y + r * P, (half * 2 + 1) * P, P);
    }
  };

  // Paper first, so whatever the disc is standing over -- the pile, the ground
  // line, a grain on its last turn -- is cleared away from the rim. Over a full
  // pile a black disc on grey speckle is a blob painted on the pile; with the
  // page showing round it, it is a hole *in* the world.
  disc(RIFT_HALO, '#fff');

  // ...and then the speckle, thinning outward through the halo: the last of what
  // is being dragged in, too far gone to be a grain any more. Laid on a ring of
  // cells rather than at random so it holds still enough to read as one thing,
  // and turned slowly so it is never a printed collar.
  ctx.fillStyle = '#000';
  const turn = t / RIFT_STIPPLE_MS * Math.PI * 2;
  for (let ring = 0; ring < RIFT_STIPPLE; ring++) {
    const r = rad + (RIFT_HALO + ring + 0.5) * P;
    // fewer the further out, which is the thinning
    const n = Math.max(4, Math.round((Math.PI * 2 * r) / P / (3 + ring * 3)));
    for (let i = 0; i < n; i++) {
      const a = turn * (ring % 2 ? -1 : 1) + (i / n) * Math.PI * 2;
      const px = cx + Math.cos(a) * r * lensAt(a, t);
      const py = cy + Math.sin(a) * r * lensAt(a, t);
      ctx.fillRect(Math.round(px / P) * P, Math.round(py / P) * P, P, P);
    }
  }

  // The infall. Each streak is a spiral from RIFT_STREAK_FROM radii out to the
  // rim, its position derived from the clock and its own slot -- no list, no
  // stepping and nothing to save, because there is nothing about one of these
  // that anybody could act on. They are spaced round the clock as well as round
  // the disc, so the ring is a stream rather than a wheel of spokes.
  // How far out a streak's head is, `k` of the way in: the square puts most of
  // the journey out at the far end and makes the last stretch quick, which is
  // what falling into something looks like.
  const reach = RIFT_STREAK_FROM - 1;
  for (let i = 0; i < RIFT_STREAKS; i++) {
    const k = ((t / RIFT_STREAK_MS) + i / RIFT_STREAKS) % 1;
    const a0 = (i / RIFT_STREAKS) * Math.PI * 2;
    const head = rad * (1 + reach * (1 - k) * (1 - k));
    // The tail is measured in **cells behind the head**, not in fractions of the
    // journey. Spaced by k it bunched into a knot at the rim -- the head slows
    // to nothing in distance terms while k runs on at the same pace, so the
    // whole streak arrived on top of itself and read as soot round the disc
    // rather than as something falling in.
    for (let c = 0; c < RIFT_STREAK_LEN; c++) {
      const d = head + c * P;
      if (d > rad * RIFT_STREAK_FROM) break;             // off the end of its run
      const kk = 1 - Math.sqrt(Math.max(0, (d / rad - 1) / reach));
      const a = a0 + kk * kk * RIFT_STREAK_TURN * Math.PI * 2;
      const px = cx + Math.cos(a) * d * lensAt(a, t);
      const py = cy + Math.sin(a) * d * lensAt(a, t);
      ctx.fillRect(Math.round(px / P) * P, Math.round(py / P) * P, P, P);
    }
  }

  // And the grains themselves, each with a tail pointing back the way it came.
  // The tail grows as the grain nears the rim, which is where it is being pulled
  // hardest -- one grain is a speck, a grain with three cells behind it is a
  // grain being taken.
  drawLeaving(S.gulped);
  ctx.fillStyle = '#000';
  for (const m of S.gulped) {
    const dx = cx - m.x, dy = cy - m.y;
    const d = Math.hypot(dx, dy);
    if (!d || d > rad * RIFT_TAIL_R) continue;
    const near = 1 - d / (rad * RIFT_TAIL_R);
    const n = Math.round(RIFT_TAIL * near);
    for (let c = 1; c <= n; c++)
      ctx.fillRect(Math.round((m.x - dx / d * c * P) / P) * P,
                   Math.round((m.y - dy / d * c * P) / P) * P, P, P);
  }

  disc(0, '#000');
  ctx.fillStyle = '#000';
}

