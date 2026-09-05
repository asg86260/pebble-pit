// What a core gives off, and the things that leave the yard: the core's glow,
// the buried and freed core, the sand that comes off it, the paid dust and the
// abyss the drowned pit holds. Owns drawCoreGlow, drawCoreAt, drawRockSand,
// drawCoreBehind, drawCore, drawPaid, drawAbyss and drawLeaving. The shared
// primitives (ctx, drawCircle, drawMark) come from ./ctx.js and ./marks.js.

import { now } from '../clock.js';
import { CORE_FROM, CORE_SIZE, P, MAGIC_TONES,
         ABYSS_SWELL, ABYSS_SWELL_MS, ABYSS_RIPPLE_MS,
         ABYSS_STAR_EVERY, ABYSS_STAR_MS, ABYSS_TONES,
         ABYSS_MAGIC_TONES, ABYSS_BREATH_BEND,
         ABYSS_FLOW_MS, ABYSS_FLOW_COL, ABYSS_FLOW_ROW, ABYSS_FLOW_SHEAR,
         ABYSS_FLOW_ASPECT, ABYSS_FLOW_DRIFT, ABYSS_SHEAR_ROW, ABYSS_SHEAR_TURN,
         ABYSS_SHEAR_AMT2, ABYSS_SHEAR_COL, ABYSS_SHEAR_AMT_Y,
         ABYSS_FLOW_COL2, ABYSS_FLOW_ROW2, ABYSS_FLOW_DRIFT2, ABYSS_FLOW_MIX,
         ABYSS_VEIL_AT, ABYSS_VEIL_EVERY, ABYSS_VEIL_JITTER, ABYSS_VEIL_LIT, ABYSS_VEIL_DEEP,
         ABYSS_FLOW_LIFT,
         ABYSS_WISP_EVERY, ABYSS_WISP_RISE, ABYSS_WISP_MS } from '../config.js';
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
// Six things are drawn, and each is one property of the thing:
//
//   the body    solid ink from the surface to the floor of the hole, clipped
//               to the mouth and to the view.
//   the swell   the surface breathes, per column, on two slow waves out of
//               step -- a heave and a chop -- so no stretch of it ever moves
//               as one plate.
//   the stars   the liquid is a window into somewhere else, and the somewhere
//               else has stars in it: sparse specks breathing on their own
//               clocks, thicker with depth, a few in the tower's magic
//               purples. This is what makes it an abyss and not a puddle of
//               ink -- the darkness has something on the other side of it.
//   the wisps   energy rising off the surface and thinning to nothing a few
//               cells up: the thing exhaling. Derived from the clock and the
//               column, no list and nothing saved.
//   the ripples a white notch where a grain just went in, gone in half a
//               second, with a glint drifting along the surface between
//               swallows so the waterline is never still.
//   the plank   a board over the mouth at the brim. The drowned pit stays a
//               way through -- the two ladders exist exactly so it is not a
//               dead end -- and the plank is what the crossing stands on.
//
// The order is the picture: diving grains go down first and the body over
// them at the waterline, so anything past the surface is gone into it; the
// stars go over the body, being *through* it.
//
// Everything here is derived from the clock, the column and a stable hash --
// the same trick the timber grain uses -- so the abyss costs no state, no
// stepping and no saving, and two frames of a still yard show the same stars.
const seeth = (c, r) => Math.abs((c * 73856093) ^ (r * 19349663)) % 997;

// The surface's height at a world column, snapped to the cell. Two waves: the
// long heave and a shorter chop at a third the size, out of step so the
// waterline rolls rather than pulses.
const swellAt = (c, t) => Math.round(
  (Math.sin(t / ABYSS_SWELL_MS * Math.PI * 2 + c * 0.11) * 0.75 +
   Math.sin(t / (ABYSS_SWELL_MS * 0.37) * Math.PI * 2 + c * 0.29) * 0.25)
  * (ABYSS_SWELL / P)) * P;

// A brightness from 0 to 1 picks a tone out of a family's ramp. Zero is the
// family's darkest, which is the tone a thing wears on its way out of and back
// into the black -- there is no alpha to fade with, so the ramp is the fade.
const toneFor = (ramp, k) => ramp[Math.max(0, Math.min(ramp.length - 1,
  Math.round(k * (ramp.length - 1))))];

export function drawAbyss() {
  if (!S.riftOpen) return;
  const t = now();
  const line = abyssLine();
  const floorY = S.groundY + pitDepth();

  // Only the columns in view: the hole is six hundred wide and the window
  // shows a tenth of it.
  const from = Math.max(pit.x, Math.floor((S.camX - P * 2) / P) * P);
  const to = Math.min(pit.x + pit.w, Math.ceil((S.camX + S.viewW + P * 2) / P) * P);
  if (to <= from) return;

  // The grains still diving, before the body goes down, so a grain past the
  // surface is under it.
  drawLeaving(S.gulped);

  // The body, a column at a time so the surface is a rolling line.
  ctx.fillStyle = '#000';
  for (let x = from; x < to; x += P) {
    const top = Math.min(floorY, line + swellAt(x / P, t));
    ctx.fillRect(x, top, P, Math.max(0, floorY - top));
  }

  // The deep, in one pass: the current that runs through it and the stars that
  // breathe in it, both read off the same flow field so the sky and the smoke
  // are plainly the same fluid.
  //
  // The stars keep their fixed seats -- the fine hash seats one, the coarse
  // hash over eight-cell patches decides whether that stretch is nebula-thick,
  // ordinary or empty, so the field clumps and leaves voids the way a sky does.
  // What changed is that a star no longer switches on: its breath is a
  // brightness that walks up its family's ramp and back down, and the current
  // passing over lifts or lowers that brightness, so brightening travels
  // through the field in slow waves. Depth still sets a star's ceiling -- only
  // the deep rows are allowed all the way to white -- so looking down is
  // looking further in.
  //
  // The veil is the crest of the same field: the cells riding near the top of
  // the wave, broken by the same fixed hash so they light in ragged runs rather
  // than a painted band. The crests curl and shear as the field turns, which is
  // what makes it read as smoke in a light ray rather than as stripes.
  //
  // The row's sideways drag and the column's downward drag each depend on only
  // one of the two, so both are worked out once and reused across the pass; a
  // cell costs one sine.
  {
    const a = t / ABYSS_FLOW_MS * Math.PI * 2;
    const top = Math.round(line / P) * P + P * 3;
    const dragY = [];
    for (let x = from; x < to; x += P) {
      dragY.push(Math.sin((x / P) * ABYSS_FLOW_COL * ABYSS_SHEAR_COL - a * ABYSS_SHEAR_COL)
                 * ABYSS_FLOW_SHEAR * ABYSS_SHEAR_AMT_Y);
    }
    for (let y = top; y < floorY; y += P) {
      const r = y / P;
      const dragX = Math.sin(r * ABYSS_FLOW_ROW + a) * ABYSS_FLOW_SHEAR
                  + Math.sin(r * ABYSS_FLOW_ROW * ABYSS_SHEAR_ROW - a * ABYSS_SHEAR_TURN)
                    * ABYSS_FLOW_SHEAR * ABYSS_SHEAR_AMT2;
      const depth = Math.min(1, (y - line) / (P * 32));
      for (let x = from, i = 0; x < to; x += P, i++) {
        const c = x / P;
        const cx = c + dragX, ry = r + dragY[i];
        const f = Math.sin(cx * ABYSS_FLOW_COL + ry * ABYSS_FLOW_ROW * ABYSS_FLOW_ASPECT
                           - a * ABYSS_FLOW_DRIFT);
        // the second, far slower wave is not added to the first: it rides over
        // it as a strength, thinning the filament to nothing along one stretch
        // and swelling it along another, which is how a wisp of smoke fails and
        // recovers as it travels
        const swell = 1 - ABYSS_FLOW_MIX + ABYSS_FLOW_MIX
                    * (Math.sin(cx * ABYSS_FLOW_COL2 + ry * ABYSS_FLOW_ROW2
                                - a * ABYSS_FLOW_DRIFT2) + 1) / 2;
        const h = seeth(c, r);
        // the patch's own nature: 0..2 empty, 3..6 ordinary, 7+ nebula
        const patch = seeth(c >> 3, r >> 3) % 10;
        const keep = patch >= 7 ? 4 : 1;           // nebula patches keep four times the stars
        const seated = patch >= 3 && h % ABYSS_STAR_EVERY < keep;
        if (seated) {
          // the breath, bent so a star spends most of its life dim and only
          // briefly at its own top, then lifted or lowered by the current
          const swing = (Math.sin(t / ABYSS_STAR_MS * Math.PI * 2 * (0.6 + (h % 7) * 0.1) + h)
                         + 1) / 2;
          const k = Math.pow(swing, ABYSS_BREATH_BEND)
                  * (1 - ABYSS_FLOW_LIFT + ABYSS_FLOW_LIFT * (f + 1) / 2);
          if (k > 0.06) {
            const ramp = h % 7 === 0 ? ABYSS_MAGIC_TONES : ABYSS_TONES;
            // its ceiling: shallow stars never reach the bright end of their
            // family, and the hash keeps some of the deep ones modest too
            const ceiling = Math.max(1, (h >> 3) % (1 + Math.round(depth * (ramp.length - 1))));
            ctx.fillStyle = ramp[Math.min(ramp.length - 1, Math.round(k * ceiling))];
            ctx.fillRect(x, y, P, P);
            continue;
          }
        }
        const off = Math.abs(f), band = ABYSS_VEIL_AT * swell;
        if (off > band || h % ABYSS_VEIL_EVERY === 0) continue;
        // how near the middle of the filament this cell sits, which is how
        // brightly the smoke shows; the deep carries it a shade further up the
        // ramp, and the hash nudges each cell so no stretch is one flat tone
        const thick = (1 - off / band) * swell;
        const lit = thick * (ABYSS_VEIL_LIT + depth * ABYSS_VEIL_DEEP)
                  + (h % 3 - 1) * ABYSS_VEIL_JITTER;
        if (lit <= 0) continue;
        ctx.fillStyle = toneFor(ABYSS_TONES, lit);
        ctx.fillRect(x, y, P, P);
      }
    }
  }

  // The wisps: a speck rising off the surface every dozen or so columns, gone
  // by the top of its climb. Position is the clock and the column, so a wisp
  // is a place that exhales rather than a particle that exists -- and it
  // narrows as it rises by simply not being drawn on its last stretch.
  for (let x = from; x < to; x += P) {
    const c = x / P;
    const h = seeth(c, 1);
    if (h % ABYSS_WISP_EVERY) continue;
    const k = ((t / ABYSS_WISP_MS) + h / 997) % 1;
    if (k > 0.82) continue;                       // thinned to nothing near the top
    const wy = Math.round((line + swellAt(c, t) - k * ABYSS_WISP_RISE) / P) * P;
    // It rises past the mouth into the open air -- it is energy, not a grain,
    // and a plank does not hold it -- but the plank's own row is skipped, so
    // it passes behind the board rather than being drawn on it.
    if (wy === S.groundY - P) continue;
    const sway = Math.round(Math.sin(t / 640 + h) * 1) * P;
    ctx.fillStyle = MAGIC_TONES[(h + Math.floor(k * 3)) % MAGIC_TONES.length];
    ctx.fillRect(x + sway, wy, P, P);
  }

  // The ripples: a white notch cut into the surface where something just went
  // in, opening a cell as it dies -- on the surface's own rolling line, so it
  // reads as the liquid closing over rather than as a mark floating on it.
  ctx.fillStyle = '#fff';
  for (const r of S.ripples) {
    const k = Math.min(1, (t - r.at) / ABYSS_RIPPLE_MS);
    const wide = P * (1 + Math.round(k * 2));
    const rx = Math.round((r.x - wide / 2) / P) * P;
    ctx.fillRect(rx, Math.round((line + swellAt(Math.round(r.x / P), t)) / P) * P, wide, P);
  }

  // (A glint used to slide along the waterline here. Cut: the swell, the
  // ripples and the wisps already animate the surface, and the one bright
  // moving thing in the abyss should be the presence in the deep.)

  // And the plank over the mouth: a board a cell thick lying on the two lips,
  // which is what a body crossing the drowned pit walks on (see `pitTop`).
  ctx.fillStyle = '#000';
  ctx.fillRect(Math.round((pit.x - P) / P) * P, S.groundY - P, pit.w + P * 2, P);
}

