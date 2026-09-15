// The shields: whatever is standing over the yard, half-built or whole. Each
// kind grows out of the trips that built it rather than fading in, so a frame
// at six planks is visibly six planks. See DESIGN.md, "The shields".

import { P, SHIELD_LEG_W, SHIELD_LID_T, MAGIC_TONES } from '../config.js';
import { S } from '../state.js';
import { now } from '../clock.js';
import { KINDS, risingShield, domeAt, domeFade } from '../shield.js';
import { ctx } from './ctx.js';

export function drawShield() {
  let s = S.shield;
  let done;
  // The dome's progress is read off the pour rather than the ring count, so it
  // creeps rather than steps (`domeAt`).
  if (s) done = KINDS[s.kind].cast ? domeAt() : Math.min(1, s.laid / KINDS[s.kind].pieces);
  else {
    // A shield under construction is a work in works.js; what is drawn rises
    // in step with that labor, so a half-done bar is a half-raised frame. The
    // finished thing lands in `S.shield` the frame the work does.
    s = risingShield();
    if (!s) return;
    done = s.done;
  }
  const topY = S.groundY - s.h * P;
  const cols = s.w / P;
  ctx.fillStyle = '#000';

  // A shield with a rock on it that it cannot take shakes, harder the nearer
  // it is to going: the whole thing at once, by moving the canvas, since a
  // structure that trembles in pieces is coming apart. Whole cells, or the
  // shudder is a hairline through the picture.
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

  // The props: two braced legs and a sagging lid. The legs rise through the
  // first half of the planks and the lid closes from both ends through the
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
    // The lid sags, a column at a time so the whole thing bends: a shallow bow
    // of whole-cell steps, never more than a few courses.
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

// The net: two masts and a rope slung between them, drawn as separate cells
// rather than a solid band so you can see the sky through it. `s.sag` is the
// state: it deepens while the rock rides it down.
function drawNet(s, done, topY, cols) {
  const mast = Math.min(s.h, Math.round(Math.min(1, done * 2) * s.h));
  for (const x of [s.x, s.x + s.w - P]) {
    if (mast > 0) ctx.fillRect(x, S.groundY - mast * P, P, mast * P);
  }
  const span = Math.max(0, done * 2 - 1);
  if (span <= 0) return;
  const reach = Math.round(span * cols / 2);
  // The sag is a float and every column rounds it for itself, so a deepening
  // sag rolls outward a cell at a time instead of the whole rope dropping a
  // course in one frame.
  const dip = 2 + Math.max(0, s.sag || 0);
  // The mesh hangs deeper the harder it is stretched. Six courses is the
  // shallowest that can show a whole diamond.
  const deep = 6 + Math.round(Math.max(0, s.sag || 0) / 3);
  for (let c = 0; c < cols; c++) {
    if (c > reach && cols - 1 - c > reach) continue;
    const t = (2 * c / (cols - 1)) - 1;
    const off = Math.round(dip * (1 - t * t));
    for (let k = 0; k < deep; k++) {
      // The head rope is solid all the way across; under it the strands run
      // both diagonals and cross, which is what makes diamonds.
      if (k && (c + k) % 4 && (c - k + 4 * cols) % 4) continue;
      ctx.fillRect(s.x + c * P, topY + (off + k) * P, P, P);
    }
  }
}

// The dome: the only shield that is not black, because it is the only one that
// is not a thing; what magic emits is purple, all game. A band rather than a
// fill, so you can see the sky through it. It closes from both feet to the
// crown as the tower pours. Nothing about it holds still, since a field that
// sits still is a wall painted purple: everything is a function of the clock.
// The running light is done in tones, palest where the light is and deepest
// away from it, so the band reads as a charged surface and not a rope light.
// The shell's geometry this instant, shared with the beams that are making it.
function domeShell(s) {
  const a = s.w / P / 2;
  // the shell breathes by a cell
  const R = a - 1 + Math.sin(now() / 1000 * 1.7) * 0.9;
  return { a, R, total: Math.PI / 2 };
}

// The tip of the horn on one side (`side` -1 left, 1 right), in world pixels.
// The beams land here rather than on the crown, which is empty air until the
// last of the pour.
export function domeEdge(side) {
  const s = S.shield;
  const { a, R, total } = domeShell(s);
  const ang = domeAt() * total;
  return { x: s.x + (a + Math.cos(ang) * R * side) * P,
           y: S.groundY - (Math.sin(ang) * R + 0.5) * P };
}

function drawDome(s, done, topY, cols) {
  const t = now() / 1000;
  const { a, R, total } = domeShell(s);
  const T = 2;
  // Once the rescue is done the dome goes the way it came, as light: alpha on
  // the whole drawing over DOME_FADE_MS, because a field does not come apart
  // in pieces and nothing in this yard pops out of existence.
  const fade = domeFade(s);
  if (fade) { ctx.save(); ctx.globalAlpha = Math.max(0, 1 - fade); }
  for (let c = 0; c < cols; c++) {
    const dx = Math.abs(c + 0.5 - a);
    for (let r = 0; r < s.h; r++) {
      const d = Math.hypot(dx, r);
      if (d < R - T || d > R) continue;
      const ang = Math.atan2(r, dx);
      if (ang > done * total) continue;
      // Two waves of different speed and length, so the pattern never repeats
      // on itself.
      const along = ang / total;
      const lit = Math.sin(along * 9 - t * 3.4) * 0.6 + Math.sin(along * 4 + t * 2.1) * 0.4;
      const tone = lit > 0.55 ? 0 : lit > 0 ? 1 : lit > -0.55 ? 2 : 3;
      ctx.fillStyle = MAGIC_TONES[tone];
      ctx.fillRect(s.x + c * P, S.groundY - (r + 1) * P, P, P);
    }
  }

  // The aura: cells thrown clear of the shell that drift out and fade. Not
  // kept anywhere: each one's whole life is a fraction of the clock, so the
  // same eighteen sparks are reused forever.
  const SPARKS = 18;
  for (let i = 0; i < SPARKS; i++) {
    const life = (t * 0.5 + i * 0.137) % 1;           // 0 at the shell, 1 spent
    if (life > 0.92) continue;
    // an angle that never lines them up
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
  if (fade) ctx.restore();
  ctx.fillStyle = '#000';
}

// The arch: two piers and a shallow segmental curve across them, all from one
// law: a cell is stone if it lies in the band between two circles struck from
// the same center, and below the springing line that band goes straight down
// as the piers. A segment, not a half-circle, which over a span this wide is
// a hoop as tall as the yard: the radius is whatever makes a circle pass
// through both springings and the crown. It goes up from both feet, round the
// curve, crown last, so it is only closed on the trip that finishes it.
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
        // the outer T cells: a pier is as thick as the stone it carries
        stone = dx >= a - T;
        along = r;                                   // straight up the pier
      } else {
        const d = Math.hypot(dx, r - cY);
        stone = d >= R - T && d <= R;
        // how far round the curve this cell sits, along the band's middle from
        // the springing, so the reveal runs at one pace and the crown is last
        along = springC + (Math.asin(a / R) - Math.asin(Math.min(1, dx / R))) * (R - T / 2);
      }
      if (!stone || along > reach) continue;
      ctx.fillRect(s.x + c * P, S.groundY - (r + 1) * P, P, P);
    }
  }
}
