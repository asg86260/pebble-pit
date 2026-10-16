// The serpent's bar: what is left of the defense up, drawn in screen pixels at
// the top of the glass while the camera is in the deep (DESIGN.md, "The
// serpent's bar"). Full at a closed wound, empty at the break; a pip after
// it a defense, on the story's serpent only. It reads the sim and keeps only what the picture needs to
// remember, all of it here and none of it saved, so a reload shows the bar as
// it stands: where the fill is shown (it breaks off at a blow and flows up at
// a heal), where a heal began flowing in (the purple), and the chips the
// blows have broken off.

import { msg } from '../lang.js';
import { S } from '../state.js';
import { ctx } from './ctx.js';
import { now } from '../clock.js';
import { darkPage, turned } from '../ink.js';
import { coilCeiling, coilEnds } from '../deep/place.js';
import { arrowBox } from './shaftway.js';
import { barK } from '../abyssintro.js';
import { owedWound, landsAt } from './barflight.js';
import { drawFoeStatuses, statusRowH } from './statusicons.js';
import { blowK } from '../deep/serpent.js';
import { breakKind, breakFill, rising, powerFill } from '../deep/phases.js';
import { depthAt } from '../deep/depth.js';
import { sheetOf, write, widthOf, sayNum, drawable } from './numfont.js';
import { breakOff as chipOff, liveChips, drawChips } from './barchips.js';
import { P, BAR_W, BAR_H, BAR_TOP, BAR_PAD, BAR_HAND_GAP, BAR_ALONG, BAR_PIP, BAR_PIP_GAP, BAR_EDGE, BAR_TRACK, BAR_LEFT,
         BAR_HEALED, BAR_TO_COME, BAR_STUN, BAR_STUN_RIM, BAR_HEAL_FADE_S,
         BAR_SETTLE, BAR_HEAL_RATE, BAR_FLOW_EASE, BAR_FLOW_MIN, BAR_STALE_S,
         BAR_CHIP,
         BAR_KNOCK, BAR_KNOCK_BIG, BAR_KNOCK_S, NUM_KICK_BIG, STATUS_GAP,
         SERPENT_PHASES, BREAK_DIVE, BREAK_ROAR, BAR_LEVEL_GAP, NUM_FONT_PX, NUM_DROP, LEVEL_KNOCK_S } from '../config.js';

// As fightnums.js: the deep on the dark page is drawn turned, so the bar is too.
const seen = c => darkPage ? turned(c) : c;

// The picture's memory. `shown` is the fill as drawn, 0..1; `healLo` where the purple starts (null for none), `healIn` when
// the heal finished flowing in (null while it still is); `refilling` while a
// break's refill is coming up, which is the new defense or the next level and
// not a heal, so it has no purple; `level` the level it was last drawn at.
let level = -1, stage = -1, then = 0, shown = 1,
    healLo = null, healIn = null, refilling = false, tickedAt = -Infinity;
// The chips in the air, in screen pixels off the bar's resting top-left.
let chips = [];

// Not while the first trip down has the camera, and faded back in as it lets
// go (abyssintro.js).
export const barShown = () => S.view === 'deep' && S.snatched && S.serpentStage < SERPENT_PHASES && barK(now()) > 0;

// The pips' room after the bar: the story's serpent's defenses, one a pip.
// Risen after the rescue it fights only its last, so there is no row of
// them to read, only the level.
export const pipRoom = () => (S.serpentLevel > 1 ? 0 : SERPENT_PHASES);

// The level, after the bar: from level 2 on, the story's serpent being no
// "level 1" to a player who does not yet know there are more. What of it the
// number font can draw, and how wide that is in screen pixels.
const levelSays = () => S.serpentLevel > 1
  ? drawable(msg('serp-level', { n: sayNum(S.serpentLevel) })) : '';
const levelW = str => (str ? BAR_LEVEL_GAP + widthOf(str, NUM_FONT_PX) : 0);

// The bar's length on this glass: BAR_W, or shorter on a glass too narrow for
// it, its pips and its level side by side (a phone held upright).
export function barW() {
  const after = pipRoom() * (BAR_PIP + BAR_PIP_GAP) + levelW(levelSays());
  return Math.max(BAR_PIP, Math.min(BAR_W, S.W - 2 * BAR_TOP - after));
}

// Where the bar stands on the glass, in screen pixels: centered with its pips
// over the middle of the first BAR_ALONG of the coil from the head, held over
// the part of the coil on the glass when that is off it, kept on the glass,
// and held still BAR_PAD cells over the highest the coil ever sways.
export function barRect() {
  const w = barW();
  // measured with the level drawn after it, so the strip stays centered as
  // the number grows
  const whole = w + pipRoom() * (BAR_PIP + BAR_PIP_GAP) + levelW(levelSays());
  // The row of statuses stands over the bar (render/statusicons.js), so the
  // bar keeps room above it for the row, whether or not it has a status in it.
  const row = statusRowH() + STATUS_GAP;
  const over = (coilCeiling() - BAR_PAD * P - S.camY) * S.zoom - BAR_H;
  // Every step of this is a clamp, so the bar slides with the camera and
  // never jumps: a choice between placements (the head's third, else the
  // coil, else the glass's middle) snapped it across the glass at the
  // moment one part of the coil left it.
  const { x0, x1 } = coilEnds(), toScreen = x => (x - S.camX) * S.zoom;
  const glass = x => Math.max(0, Math.min(S.W, toScreen(x)));
  const mid = Math.max(glass(x0), Math.min(glass(x1), toScreen(x0 + (x1 - x0) * BAR_ALONG / 2)));
  // The hand under the deep's portal stands at the bar's height, and the
  // portal does not move, so the bar keeps clear of it: its pips end
  // BAR_HAND_GAP short of the hand, sliding left; where the glass leaves no
  // room for that (a phone, or the portal dragged far left), the bar steps
  // down under the hand as far as the two would overlap across, so it eases
  // down as the hand comes over it and never jumps.
  const hand = arrowBox(true), hx = toScreen(hand.x), hw = hand.w * S.zoom;
  const x = Math.max(BAR_TOP, Math.min(S.W - whole - BAR_TOP, mid - whole / 2, hx - BAR_HAND_GAP - whole));
  const handTop = (hand.y - S.camY) * S.zoom, under = handTop + hand.h * S.zoom + BAR_HAND_GAP;
  const across = Math.min(x + whole, hx + hw) - Math.max(x, hx) + BAR_HAND_GAP;
  const level = over + BAR_H + BAR_HAND_GAP > handTop && over < under;
  const y = level ? over + Math.max(0, Math.min(1, across / hw)) * (under - over) : over;
  return { x: Math.round(x), y: Math.round(Math.max(BAR_TOP + row, y)), w, h: BAR_H };
}
// The whole strip on the glass, screen pixels: the row of statuses over the
// bar, the bar, its pips and its level, and the knock's room. What anything
// drawn in the water keeps clear of (render/serpent.js, the focus lines).
export function barZone() {
  const r = barRect(), row = statusRowH() + STATUS_GAP;
  const w = r.w + pipRoom() * (BAR_PIP + BAR_PIP_GAP) + levelW(levelSays());
  return { x: r.x - BAR_KNOCK_BIG, y: r.y - row - BAR_KNOCK_BIG, w: w + BAR_KNOCK_BIG * 2, h: row + BAR_H + BAR_KNOCK_BIG * 2 };
}
const depthOf = st => depthAt(Math.min(st, SERPENT_PHASES - 1));
// What the bar shows of the defense up, 0..1: the wound as the numbers that
// have landed in it say, not yet as the sim has it (render/barflight.js).
export function barLeft(t) {
  const d = depthOf(S.serpentStage);
  return d > 0 ? 1 - Math.max(0, Math.min(1, (S.serpentWound + owedWound(t)) / d)) : 1;
}
const isBig = h => blowK(h.done) > NUM_KICK_BIG;

// The stretch of the bar from `lo` to `hi` (shares of it) breaks off at once,
// at `t` seconds (render/barchips.js).
const breakOff = (t, lo, hi) => chipOff(chips, t, barW() * lo, barW() * hi, BAR_H);

// One frame of the picture's memory, `dt` seconds on: the fill slides down to
// the wound or flows up to it, and the purple fades once the heal is all in.
function step(t, dt, target) {
  const s = t / 1000;
  if (S.serpentStage !== stage) {
    // A break: whatever was left breaks off at once, as a blow's stretch does.
    // The bar first coming up has nothing to break, and a new defense stands
    // where the sim has it (empty, under a break's refill).
    if (then && S.serpentStage === stage + 1 && stage >= 0 && shown > 0) breakOff(s, 0, shown);
    stage = S.serpentStage;
    shown = target;
    healLo = healIn = null;
    refilling = false;
    level = S.serpentLevel;
  }
  // The next level, in a recoil's power-up: the same defense full again, a
  // notch a mote (deep/phases.js, `powerFill`); the number knocked up as it ticks.
  if (S.serpentLevel !== level) { if (level >= 0) tickedAt = s; level = S.serpentLevel; healLo = healIn = null; }
  // Away from the deep, the bar's memory is too old to tell: it shows the bar
  // as it stands, with nothing breaking off it; so is it on a clock that has
  // gone back (a new game), where its chips would be held for the future.
  if (dt > BAR_STALE_S || dt < 0) { shown = target; healLo = healIn = null; refilling = false; chips = []; return; }
  if (powerFill() != null) {
    // The power-up's notches are held steps, each mote's own.
    shown = target; healLo = healIn = null; refilling = false;
  } else if (target < shown) {
    // Down: the whole stretch the blow took breaks off in this frame, and the
    // fill's end stands at the wound at once; a blow ends any heal showing.
    breakOff(s, target, shown);
    shown = target;
    healLo = healIn = null;
  } else if (target > shown + BAR_SETTLE) {
    // Up: a break's refill at the break's pace, or a heal at its own, easing
    // into the end either way.
    if (breakKind()) refilling = true;
    if (refilling) healLo = null;
    else if (healLo == null || healIn != null) { healLo = shown; healIn = null; }
    const pace = !refilling ? BAR_HEAL_RATE
               : 1 / (breakKind() === 'roar' ? BREAK_ROAR.run : BREAK_DIVE.out);
    shown = Math.min(target, shown + dt * Math.max(BAR_FLOW_MIN, Math.min(pace, (target - shown) * BAR_FLOW_EASE)));
    if (shown >= target - BAR_SETTLE) {
      shown = target;
      if (healLo != null) healIn = s;
      refilling = false;
    }
  } else if (target > shown) shown = target;
  if (healIn != null && s - healIn >= BAR_HEAL_FADE_S) healLo = healIn = null;
  chips = liveChips(chips, s);
}

export function drawSerpentBar() {
  // A break refills the bar as it plays, and a recoil's power-up a notch a
  // mote (deep/phases.js).
  const t = now(), notch = powerFill();
  const target = notch != null ? notch : Math.min(barLeft(t), breakFill());
  const dt = then ? (t - then) / 1000 : 0;
  step(t, dt, target);
  then = t;

  const pips = pipRoom();
  const { x, y: rest, w: bw } = barRect();
  // The number went in from underneath, so the bar recoils up the full
  // knock and settles home a whole pixel at a time, every frame.
  let knock = 0;
  for (const h of S.hits) {
    if (h.weapon === 'heal') continue;
    const a = (t - landsAt(h)) / 1000;
    if (a < 0 || a >= BAR_KNOCK_S) continue;
    const full = isBig(h) ? BAR_KNOCK_BIG : BAR_KNOCK;
    knock = Math.max(knock, Math.round(full * (1 - a / BAR_KNOCK_S)));
  }
  const y = rest - knock;
  const fill = (c, fx, fy, w, h) => {
    ctx.fillStyle = seen(c);
    ctx.fillRect(Math.round(fx), Math.round(fy), Math.round(w), Math.round(h));
  };
  const alpha = barK(t);
  ctx.save();
  ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
  ctx.globalAlpha = alpha;
  fill(BAR_EDGE, x - 1, y - 1, bw + 2, BAR_H + 2);
  fill(BAR_TRACK, x, y, bw, BAR_H);
  fill(BAR_LEFT, x, y, bw * shown, BAR_H);
  // What the heal has brought back, purple while it flows in and fading out
  // once it is all in.
  if (healLo != null && shown > healLo) {
    const s = t / 1000, k = healIn == null ? 1 : Math.max(0, 1 - (s - healIn) / BAR_HEAL_FADE_S);
    const a = Math.round(bw * healLo), b = Math.round(bw * shown);
    ctx.globalAlpha = alpha * k;
    fill(BAR_HEALED, x + a, y, b - a, BAR_H);
    ctx.globalAlpha = alpha;
  }
  // The phase boxes: none on the story's first defense, which is the only one
  // the player knows of; they come up one by one as he rises from the first
  // break, each fading in as its share of the rise comes.
  const come = S.serpentStage === 0 ? 0
             : breakKind() === 'dive' ? (rising() ? breakFill(pips) * pips : 0) : pips;
  const boxes = Math.ceil(come);
  for (let s = 0; s < boxes; s++) {
    ctx.globalAlpha = alpha * Math.min(1, come - s);
    const px = x + bw + BAR_PIP_GAP + s * (BAR_PIP + BAR_PIP_GAP);
    const py = y + Math.round((BAR_H - BAR_PIP) / 2);
    fill(BAR_EDGE, px - 1, py - 1, BAR_PIP + 2, BAR_PIP + 2);
    fill(s < S.serpentStage ? BAR_TRACK : s === S.serpentStage ? BAR_LEFT : BAR_TO_COME, px, py, BAR_PIP, BAR_PIP);
    // Stunned, the heal is stopped: the defense's own pip is held open, a
    // ring of the heal's purple round nothing, for as long as it lasts.
    if (s === S.serpentStage && S.serpentStun > 0) {
      fill(BAR_STUN, px, py, BAR_PIP, BAR_PIP);
      fill(BAR_TRACK, px + BAR_STUN_RIM, py + BAR_STUN_RIM, BAR_PIP - BAR_STUN_RIM * 2, BAR_PIP - BAR_STUN_RIM * 2);
    }
  }
  ctx.globalAlpha = alpha;
  // The level, in the number font on the bar's own height, white on the
  // fight numbers' drop; in device pixels, as the numbers are, so a glyph's
  // pixel is whole on any screen.
  const says = levelSays();
  if (says) {
    const u = S.dpr, px = Math.max(1, Math.round(NUM_FONT_PX * u));
    const lx = x + bw + pips * (BAR_PIP + BAR_PIP_GAP) + BAR_LEVEL_GAP;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const up = t / 1000 - tickedAt < LEVEL_KNOCK_S ? BAR_KNOCK : 0;
    write(sheetOf(px, BAR_LEFT, NUM_DROP), says, px, Math.round(lx * u), Math.round((y - up + BAR_H) * u));
    ctx.restore();
  }
  // The chips, held lit and then thrown (render/barchips.js).
  drawChips(chips, t / 1000, x, y, rest, { fill, held: BAR_CHIP, ink: BAR_LEFT, alpha });
  // what the fighters have laid on the serpent, in a row under the bar
  drawFoeStatuses(x, rest - statusRowH() - STATUS_GAP);
  ctx.restore();
}

