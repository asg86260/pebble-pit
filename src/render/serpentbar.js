// The serpent's bar: what is left of the defense up, drawn in screen pixels at
// the top of the glass while the camera is in the deep (DESIGN.md, "The
// serpent's bar"). Full at a closed wound, empty at the break; a pip after
// it a defense, on the story's serpent only. It reads the sim and keeps only what the picture needs to
// remember, all of it here and none of it saved, so a reload shows the bar as
// it stands: where the fill is shown (it slides to the wound rather than
// jumping), where a heal began flowing in (the purple), and the pieces the
// last blows knocked out of it.

import { msg } from '../lang.js';
import { S } from '../state.js';
import { ctx } from './ctx.js';
import { now } from '../clock.js';
import { darkPage, turned } from '../ink.js';
import { coilCeiling, coilEnds } from '../deep/place.js';
import { barK } from '../abyssintro.js';
import { owedWound, landsAt } from './barflight.js';
import { drawFoeStatuses, statusRowH } from './statusicons.js';
import { blowK } from '../deep/serpent.js';
import { breakKind, breakFill, rising, powerFill } from '../deep/phases.js';
import { depthAt } from '../deep/depth.js';
import { sheetOf, write, widthOf, sayNum, drawable } from './numfont.js';
import { BAR_W, BAR_H, BAR_TOP, BAR_GAP, BAR_PIP, BAR_PIP_GAP, BAR_EDGE, BAR_TRACK, BAR_LEFT,
         BAR_HEALED, BAR_TO_COME, BAR_STUN, BAR_STUN_RIM, BAR_HEAL_FADE_S,
         BAR_EASE_S, BAR_SETTLE, BAR_HEAL_RATE, BAR_FLOW_EASE, BAR_FLOW_MIN, BAR_STALE_S,
         BAR_SHARD_PX, BAR_SHARD_HOLD, BAR_SHARD_LIFT, BAR_SHARD_STAGGER_S, BAR_SHARD_POSES, BAR_SHARD_GRAV,
         BAR_SHARD_KICK, BAR_SHARD_FALL_S, BAR_SHARD_FADE_S, BAR_CHIP,
         BAR_KNOCK, BAR_KNOCK_BIG, BAR_KNOCK_S, NUM_KICK_BIG, STATUS_GAP,
         SERPENT_PHASES, BREAK_DIVE, BREAK_ROAR, BAR_LEVEL_GAP, NUM_FONT_PX, NUM_DROP, LEVEL_KNOCK_S } from '../config.js';
import { toneOn, withTone } from './tone.js';

// As fightnums.js: the deep on the dark page is drawn turned, so the bar is too.
const seen = c => darkPage ? turned(c) : c;

// The picture's memory. `shown` is the fill as drawn, 0..1; `shownTo` where it
// was heading last frame, so a blow's stretch is measured off it; `healLo`
// where the purple starts (null for none), `healIn` when the heal finished
// flowing in (null while it still is); `refilling` while a break's refill is
// coming up, which is the new defense or the next level and not a heal, so it
// has no purple; `level` the level it was last drawn at.
let level = -1, stage = -1, then = 0, shown = 1, shownTo = 1, healLo = null, healIn = null, refilling = false, tickedAt = -Infinity;
// Blows from a defense that has broken, whose numbers are still flying in:
// they land on the new defense's bar but took nothing from it.
let stale = new WeakSet();
// The pieces in the air, in screen pixels off the bar's resting top-left.
let shards = [];
let thrown = 0;
const hash = n => { const v = Math.sin(n * 127.1 + 3.7) * 43758.5453; return v - Math.floor(v); };

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

// Where the bar stands on the glass, in screen pixels: centered with its pips
// over the stretch of the coil on the glass, so with open water beside the
// head it stands over the serpent and not over the water, and held still
// just over the highest the coil ever sways.
export function barRect() {
  // measured with the level drawn after it, so the strip stays centered as
  // the number grows
  const whole = BAR_W + pipRoom() * (BAR_PIP + BAR_PIP_GAP) + levelW(levelSays());
  // The row of statuses stands over the bar (render/statusicons.js), so the
  // bar keeps room above it for the row, whether or not it has a status in it.
  const row = statusRowH() + STATUS_GAP;
  const over = (coilCeiling() - S.camY) * S.zoom - BAR_GAP - BAR_H;
  const { x0, x1 } = coilEnds(), toScreen = x => (x - S.camX) * S.zoom;
  const a = Math.max(0, toScreen(x0)), b = Math.min(S.W, toScreen(x1));
  const mid = b > a ? (a + b) / 2 : S.W / 2;
  const x = Math.max(BAR_TOP, Math.min(S.W - whole - BAR_TOP, mid - whole / 2));
  return { x: Math.round(x), y: Math.round(Math.max(BAR_TOP + row, over)), w: BAR_W, h: BAR_H };
}
// The whole strip on the glass, screen pixels: the row of statuses over the
// bar, the bar, its pips and its level, and the knock's room. What anything
// drawn in the water keeps clear of (render/serpent.js, the focus lines).
export function barZone() {
  const r = barRect(), row = statusRowH() + STATUS_GAP;
  const w = BAR_W + pipRoom() * (BAR_PIP + BAR_PIP_GAP) + levelW(levelSays());
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

// The stretch from `to` to `from` (shares of the bar) breaks into a grid of
// pieces, each held lit in the notch, then thrown away from the side the blow
// came from (`dir`) and spread outward from the middle of the stretch.
function shatter(t, from, to, big, dir) {
  const x0 = BAR_W * to, w = Math.max(1, BAR_W * (from - to));
  const cols = Math.max(1, Math.round(w / BAR_SHARD_PX)), cw = w / cols;
  const hold = big ? BAR_SHARD_HOLD.big : BAR_SHARD_HOLD.small, k = BAR_SHARD_KICK;
  for (let c = 0; c < cols; c++) {
    const wait = hold + (big ? c * BAR_SHARD_STAGGER_S : 0), out = (c + 0.5) / cols - 0.5;
    for (let r = 0; r * BAR_SHARD_PX < BAR_H; r++) {
      const n = thrown++;
      shards.push({ at: t, x: x0 + c * cw, y: r * BAR_SHARD_PX,
        w: Math.max(1, Math.round(cw)), h: Math.min(BAR_SHARD_PX, BAR_H - r * BAR_SHARD_PX),
        hold: wait, lift: big ? BAR_SHARD_LIFT.big : BAR_SHARD_LIFT.small,
        vx: dir * (k.side + hash(n) * k.sideRand) + out * k.spread,
        vy: -(k.up + hash(n + 3) * k.upRand) + r * k.row });
    }
  }
}

// One frame of the picture's memory, `dt` seconds on: the blows landed since
// the last frame break their stretches off, the fill slides down to the wound
// or flows up to it, and the purple fades once the heal is all in.
function step(t, dt, target) {
  const s = t / 1000;
  if (S.serpentStage !== stage) {
    // A break: what was left goes all at once, a big blow's worth. The bar
    // first coming up has nothing to break, and a new defense stands where
    // the sim has it (empty, under a break's refill).
    if (then && S.serpentStage === stage + 1 && stage >= 0 && shown > 0) shatter(s, shown, 0, true, 1);
    stage = S.serpentStage;
    shown = shownTo = target;
    healLo = healIn = null;
    stale = new WeakSet(S.hits);
    refilling = false;
    level = S.serpentLevel;
  }
  // The next level, in a recoil's power-up: the same defense full again, a
  // notch a mote (deep/phases.js, `powerFill`); the number knocked up as it ticks.
  if (S.serpentLevel !== level) { if (level >= 0) tickedAt = s; level = S.serpentLevel; healLo = healIn = null; }
  // Away from the deep, the bar's memory is too old to tell: it shows the bar
  // as it stands, with nothing breaking off it.
  if (dt > BAR_STALE_S) { shown = shownTo = target; healLo = healIn = null; refilling = false; shards = []; return; }
  // Each blow that landed since the last frame, newest first, measured back
  // up from where the bar stands now.
  const landed = S.hits.filter(h => h.weapon !== 'heal' && !stale.has(h) && landsAt(h) > then && landsAt(h) <= t)
                       .sort((a, b) => landsAt(b) - landsAt(a));
  let end = Math.min(target, shownTo);
  for (const h of landed) {
    const from = Math.min(1, Math.max(end, shownTo), end + h.done / (depthOf(stage) || 1));
    if (from > end) shatter(s, from, end, isBig(h), h.side % 2 ? 1 : -1);
    end = from;
  }
  shownTo = target;
  if (powerFill() != null) {
    // The power-up's notches are held steps, each mote's own.
    shown = target; healLo = healIn = null; refilling = false;
  } else if (target < shown) {
    // Down: a slide over a few hundredths of a second, sub-pixel, and a blow
    // ends any heal still showing.
    shown += (target - shown) * (1 - Math.exp(-dt / BAR_EASE_S));
    if (shown - target < BAR_SETTLE) shown = target;
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
  shards = shards.filter(p => s - p.at < p.hold + BAR_SHARD_FALL_S);
}

export function drawSerpentBar() {
  // A break refills the bar as it plays, and a recoil's power-up a notch a
  // mote (deep/phases.js).
  const t = now(), notch = powerFill();
  const target = notch != null ? notch : Math.min(barLeft(t), breakFill());
  const dt = then ? Math.max(0, (t - then) / 1000) : 0;
  step(t, dt, target);
  then = t;

  const pips = pipRoom();
  const { x, y: rest } = barRect();
  // The number went in from underneath, so the bar recoils up: two held
  // poses, the full knock and then half of it.
  let knock = 0;
  for (const h of S.hits) {
    if (h.weapon === 'heal') continue;
    const a = (t - landsAt(h)) / 1000;
    if (a < 0 || a >= BAR_KNOCK_S) continue;
    const full = isBig(h) ? BAR_KNOCK_BIG : BAR_KNOCK;
    knock = Math.max(knock, a < BAR_KNOCK_S / 2 ? full : full / 2);
  }
  const y = rest - knock;
  const fill = (c, fx, fy, w, h) => {
    ctx.fillStyle = seen(c);
    ctx.fillRect(Math.round(fx), Math.round(fy), Math.round(w), Math.round(h));
  };
  const alpha = barK(t);
  ctx.save();
  ctx.setTransform(S.dpr, 0, 0, S.dpr, 0, 0);
  // faded down the deep's ramps as drawn, toward its black (render/tone.js)
  const unfade = toneOn(ctx, alpha);
  if (!unfade) { ctx.restore(); return; }
  fill(BAR_EDGE, x - 1, y - 1, BAR_W + 2, BAR_H + 2);
  fill(BAR_TRACK, x, y, BAR_W, BAR_H);
  fill(BAR_LEFT, x, y, BAR_W * shown, BAR_H);
  // What the heal has brought back, purple while it flows in and fading out
  // once it is all in.
  if (healLo != null && shown > healLo) {
    const s = t / 1000, k = healIn == null ? 1 : Math.max(0, 1 - (s - healIn) / BAR_HEAL_FADE_S);
    const a = Math.round(BAR_W * healLo), b = Math.round(BAR_W * shown);
    withTone(ctx, k, () => fill(BAR_HEALED, x + a, y, b - a, BAR_H));
  }
  // The phase boxes: none on the story's first defense, which is the only one
  // the player knows of; they come up one by one as he rises from the first
  // break.
  const boxes = S.serpentStage === 0 ? 0
              : breakKind() === 'dive' ? (rising() ? Math.round(breakFill(pips) * pips) : 0) : pips;
  for (let s = 0; s < boxes; s++) {
    const px = x + BAR_W + BAR_PIP_GAP + s * (BAR_PIP + BAR_PIP_GAP);
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
  // The level, in the number font on the bar's own height, white on the
  // fight numbers' drop; in device pixels, as the numbers are, so a glyph's
  // pixel is whole on any screen.
  const says = levelSays();
  if (says) {
    const u = S.dpr, px = Math.max(1, Math.round(NUM_FONT_PX * u));
    const lx = x + BAR_W + pips * (BAR_PIP + BAR_PIP_GAP) + BAR_LEVEL_GAP;
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const up = t / 1000 - tickedAt < LEVEL_KNOCK_S ? BAR_KNOCK : 0;
    write(sheetOf(px, BAR_LEFT, NUM_DROP), says, px, Math.round(lx * u), Math.round((y - up + BAR_H) * u));
    ctx.restore();
  }
  // The pieces: held lit in the notch the blow made, where it struck and not
  // where the fill has slid to since, then falling a held pose at a time and
  // fading out whole.
  const s = t / 1000;
  for (const p of shards) {
    const a = s - p.at;
    let px = p.x, py = p.y, c = BAR_LEFT;
    if (a < p.hold) { py -= p.lift; c = BAR_CHIP; }
    else {
      const f = Math.floor((a - p.hold) * BAR_SHARD_POSES) / BAR_SHARD_POSES;
      px += p.vx * f; py += p.vy * f + 0.5 * BAR_SHARD_GRAV * f * f;
    }
    const life = p.hold + BAR_SHARD_FALL_S;
    withTone(ctx, Math.max(0, Math.min(1, (life - a) / BAR_SHARD_FADE_S)), () => fill(c, x + px, rest + py, p.w, p.h));
  }
  // what the fighters have laid on the serpent, in a row under the bar
  drawFoeStatuses(x, rest - statusRowH() - STATUS_GAP);
  unfade();
  ctx.restore();
}
