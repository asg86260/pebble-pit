// The shields: whatever is standing over the yard, half-built or whole. Lifted
// out of render.js when the frame became a LAYERS list; behavior unchanged.
// ctx comes from ./ctx.js.
//
// Each kind grows out of the trips that built it rather than fading in, so a
// frame at six planks is visibly six planks. Drawn after the rock, because a
// shield stands over it -- and before the crew, who walk in front of
// everything. See DESIGN.md, "The shields".

import { P, SHIELD_LEG_W, SHIELD_LID_T, MAGIC_TONES } from '../config.js';
import { S } from '../state.js';
import { now } from '../clock.js';
import { KINDS, risingShield } from '../shield.js';
import { ctx } from './ctx.js';

export function drawShield() {
  let s = S.shield;
  let done;
  if (s) done = Math.min(1, s.laid / KINDS[s.kind].pieces);
  else {
    // Nothing standing -- but something may be going up. A shield under
    // construction is a work in works.js, hammered at under the yard's own
    // bar and tape; what is drawn rises in step with that labor, so a
    // half-done bar is a half-raised frame and never an animation that merely
    // lasts as long. The finished thing lands in `S.shield` the frame the
    // work does.
    s = risingShield();
    if (!s) return;
    done = s.done;
  }
  const topY = S.groundY - s.h * P;
  const cols = s.w / P;
  ctx.fillStyle = '#000';

  // A shield with a rock on it that it cannot take shakes, harder the nearer
  // it is to going. It is done to the whole thing at once, in whole cells, by
  // moving the canvas rather than every shape in it -- a structure that
  // trembles in pieces is a structure coming apart, and this one has not come
  // apart yet. Whole cells because half a cell of shudder is a hairline
  // through the picture, and the lattice is the one thing that never bends.
  const shake = s.strain && S.rockHeld
    ? Math.round(Math.sin(now() / 42) * s.strain * 1.6) * P : 0;
  if (shake) { ctx.save(); ctx.translate(shake, 0); }
  drawShieldOf(s, done, topY, cols);
  if (shake) ctx.restore();
}

function drawShieldOf(s, done, topY, cols) {
  if (s.kind === 'arch') return drawArch(s, done, topY, cols);
  if (s.kind === 'net') return drawNet(s, done, topY, cols);
  if (s.kind === 'dome') return drawDome(s, done, topY, cols);

  // The props: two braced timber legs and a sagging lid. The legs rise through
  // the first half of the planks and the lid closes from both ends through the
  // second.
  const lw = SHIELD_LEG_W * P;
  const legC = Math.min(s.h, Math.round(Math.min(1, done * 2) * s.h));
  const span = Math.round(Math.max(0, done * 2 - 1) * cols) * P;
  const half = span > 0 ? Math.min(s.w, Math.ceil(span / 2 / P) * P) : 0;

  if (legC > 0) {
    ctx.fillRect(s.x, S.groundY - legC * P, lw, legC * P);
    ctx.fillRect(s.x + s.w - lw, S.groundY - legC * P, lw, legC * P);
    // a diagonal shore leaning into each leg, one cell a course
    const brace = Math.min(legC - 1, 5);
    for (let i = 0; i < brace; i++) {
      ctx.fillRect(s.x + lw + i * P, S.groundY - (brace - i) * P, P, P);
      ctx.fillRect(s.x + s.w - lw - (i + 1) * P, S.groundY - (brace - i) * P, P, P);
    }
  }
  if (half > 0) {
    // The lid sags. Drawn a column at a time so the whole thing bends: each
    // column rides lower the nearer it is to the middle, a shallow bow of
    // whole-cell steps -- deepest where the span is widest, and never more
    // than a few courses, because a lid that has already given up is not a
    // lid anybody believed in.
    const sag = Math.max(1, Math.min(3, Math.round(cols / 14)));
    for (let c = -1; c <= cols; c++) {
      const from = (c + 1) * P <= half ? true : (cols - c) * P <= half;
      if (!from) continue;
      const t = (2 * c / cols) - 1;                 // -1 at one end, 1 at the other
      const off = Math.round(sag * (1 - t * t));    // the bow, in whole courses
      ctx.fillRect(s.x + c * P, topY + off * P, P, SHIELD_LID_T * P);
    }
  }
}

// The net: two masts and a rope slung between them. It is drawn as a line of
// separate cells rather than a solid band, because that is what tells you it
// is rope and not another lid -- you can see the sky through it, which is the
// whole of why anybody believed it would work.
//
// The sag is not decoration here, it is the state: `s.sag` deepens while the
// rock rides it down, so the picture of the failure *is* the rope paying out.
function drawNet(s, done, topY, cols) {
  const mast = Math.min(s.h, Math.round(Math.min(1, done * 2) * s.h));
  for (const x of [s.x, s.x + s.w - P]) {
    if (mast > 0) ctx.fillRect(x, S.groundY - mast * P, P, mast * P);
  }
  const span = Math.max(0, done * 2 - 1);
  if (span <= 0) return;
  const reach = Math.round(span * cols / 2);
  // The sag is a float, and every column rounds it for itself. That is what
  // keeps a deepening sag from stepping: the cells nearest the middle cross
  // their rounding threshold first and the dip *rolls* outward a cell at a
  // time, instead of the whole rope dropping a course in one frame.
  const dip = 2 + Math.max(0, s.sag || 0);
  // and the mesh hangs deeper the harder it is being stretched. Six courses is
  // the shallowest that can show a whole diamond -- at three the strands never
  // got to cross and the thing read as a fringe hanging off a wire.
  const deep = 6 + Math.round(Math.max(0, s.sag || 0) / 3);
  for (let c = 0; c < cols; c++) {
    if (c > reach && cols - 1 - c > reach) continue;
    const t = (2 * c / (cols - 1)) - 1;
    const off = Math.round(dip * (1 - t * t));
    for (let k = 0; k < deep; k++) {
      // The head rope is solid all the way across -- that is the line the
      // whole thing hangs from. Under it the strands run both diagonals and
      // cross, which is what makes diamonds and what makes this read as a net:
      // you can see the sky through it, which is why anybody believed in it.
      if (k && (c + k) % 4 && (c - k + 4 * cols) % 4) continue;
      ctx.fillRect(s.x + c * P, topY + (off + k) * P, P, P);
    }
  }
}

// The dome: the only shield that is not black, because it is the only one that
// is not a thing. What magic emits is purple, all game -- the bolts, the
// summoning, the rings off the spire -- and this is the largest piece of it
// the yard ever sees. It is a band rather than a fill so you can see the sky
// through it: what is overhead has not been walled off, it has been answered.
//
// It closes from both feet to the crown as the tower pours, so a half-cast
// dome is two horns reaching up, and the last of the pour is the moment it
// becomes a roof.
// It is not a wall, it is a field, and a field that sits perfectly still is a
// wall somebody painted purple. So nothing about it holds: light runs round the
// shell, the shell itself breathes a cell in and out, and it sheds sparks that
// rise and fade. Everything here is a function of the clock, so it can never
// settle into a picture.
//
// The tones do the work rather than any new shape. Where the running light is,
// the shell is drawn in the palest of the four magic tones; away from it, the
// deepest -- so the band reads as brighter and dimmer round its length instead
// of as a stripe traveling along a solid object. That is the difference between
// a rope light and a charged surface.
function drawDome(s, done, topY, cols) {
  const t = now() / 1000;
  const a = cols / 2;
  const T = 2;
  const total = Math.PI / 2;
  // the shell breathes: the whole radius swells and settles by a cell
  const R = a - 1 + Math.sin(t * 1.7) * 0.9;
  for (let c = 0; c < cols; c++) {
    const dx = Math.abs(c + 0.5 - a);
    for (let r = 0; r < s.h; r++) {
      const d = Math.hypot(dx, r);
      if (d < R - T || d > R) continue;
      const ang = Math.atan2(r, dx);
      if (ang > done * total) continue;
      // How lit this cell is: two waves of different speed and length running
      // round the shell, so the pattern never repeats on itself and the eye
      // cannot find the loop.
      const along = ang / total;
      const lit = Math.sin(along * 9 - t * 3.4) * 0.6 + Math.sin(along * 4 + t * 2.1) * 0.4;
      const tone = lit > 0.55 ? 0 : lit > 0 ? 1 : lit > -0.55 ? 2 : 3;
      ctx.fillStyle = MAGIC_TONES[tone];
      ctx.fillRect(s.x + c * P, S.groundY - (r + 1) * P, P, P);
    }
  }

  // The aura: cells thrown clear of the shell that drift out and fade. This is
  // what makes it read as charged rather than painted -- a surface losing a
  // little of itself into the air all the time. They are not kept anywhere,
  // because there is nothing to remember: each one's whole life is a fraction
  // of the clock, so the same eighteen sparks are reused for ever and none of
  // them has to be born, stored or buried.
  const SPARKS = 18;
  for (let i = 0; i < SPARKS; i++) {
    const life = (t * 0.5 + i * 0.137) % 1;           // 0 at the shell, 1 spent
    if (life > 0.92) continue;
    // spread them round the shell by an angle that never lines them up
    const ang = (i * 2.399) % total;
    if (ang > done * total) continue;
    const rr = R + 1 + life * 5;
    const side = i % 2 ? 1 : -1;
    const cx = Math.round(a + Math.cos(ang) * rr * side);
    const cy = Math.round(Math.sin(ang) * rr);
    if (cx < -2 || cx > cols + 2 || cy < 0) continue;
    ctx.fillStyle = MAGIC_TONES[life < 0.3 ? 1 : life < 0.65 ? 2 : 3];
    ctx.fillRect(s.x + cx * P, S.groundY - (cy + 1) * P, P, P);
  }
  ctx.fillStyle = '#000';
}

// The arch: two piers and a shallow segmental curve across them. One law draws
// all of it -- a cell is stone if it lies in the band between two circles
// struck from the same center, and below the springing line that band goes
// straight down as the piers. The piers, the haunches and the crown are not
// three shapes fitted together; they are one question asked at different
// heights, which is why it comes out looking built rather than assembled.
//
// The curve is a segment rather than a half-circle. A half-circle over an
// opening this wide is a hoop as tall as the yard, and it read as one: a thin
// rainbow standing on nothing. A mason spanning a wide gap springs a shallow
// arc off two solid piers, and the geometry follows from the span and the
// rise -- the radius is whatever makes a circle pass through both springings
// and the crown, never a number chosen to look right.
//
// It goes up the way an arch goes up: from both feet, round the curve, and the
// crown last. So it is only closed on the trip that finishes it, and until
// then it is two piers reaching for each other -- the picture of a thing not
// yet able to hold anything.
function drawArch(s, done, topY, cols) {
  const T = SHIELD_LID_T + 2;            // stone is heavier than plank
  const a = cols / 2;                    // half the span, in cells
  const f = Math.max(1, s.rise || Math.round(cols / 4));
  const R = (a * a + f * f) / (2 * f);   // the circle through both springings and the crown
  const springC = s.h - f;               // courses of straight pier under the curve
  const cY = springC - (R - f);          // its center, below the springing line
  const total = springC + (R - T / 2) * Math.asin(a / R);   // foot to crown, along the stone
  const reach = done * total;
  for (let c = 0; c < cols; c++) {
    const dx = Math.abs(c + 0.5 - a);
    for (let r = 0; r < s.h; r++) {
      let stone, along;
      if (r < springC) {
        // the outer T cells, which is the same rule the props' legs follow --
        // a pier is as thick as the stone it carries, never thinner
        stone = dx >= a - T;
        along = r;                                   // straight up the pier
      } else {
        const d = Math.hypot(dx, r - cY);
        stone = d >= R - T && d <= R;
        // how far round the curve this cell sits, measured along the band's
        // middle from the springing, so the reveal runs at one pace the whole
        // way up and the crown -- where dx is nought -- is the last of it
        along = springC + (Math.asin(a / R) - Math.asin(Math.min(1, dx / R))) * (R - T / 2);
      }
      if (!stone || along > reach) continue;
      ctx.fillRect(s.x + c * P, S.groundY - (r + 1) * P, P, P);
    }
  }
}
