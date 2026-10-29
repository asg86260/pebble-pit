// The crew and everything they carry, say and stand under: the bodies, their
// hats and carts, the bench, the kit stands, the speech, the pointed arrow,
// and the whole-crew draw.

import { finalePose } from '../finale.js';
import { drawHopMarks, drawHeldPiece } from './finale.js';
import { atPot, tonicColor } from '../apothecary.js';
import { now } from '../clock.js';
import { actPlace } from '../acts.js';
import { bodyInk } from './recede.js';
import { MUCK_TONE, P, SHARD_CELL, WORKER, BODY_RIM, BURIED_SUNK_C, BURIED_DIRT_TONE, LEAN_HOLD, LAND_HOP_MS, LAND_HOP_H, HOP_POSES, LIFT_SEAT, CART_W, CART_H, LIFT_W, LIFT_FORK, LIFT_MAST, LIFT_ANTENNA, SIGHT_VEIL, SIGHT_IN_MS, SIGHT_STEPS, SIGHT_RING, SIGHT_GAP, DEEP_SURFACE } from '../config.js';
import { atHome } from '../crew.js';
import { buriedAt, buriedShown, buriedVisible, buriedOut } from '../intro.js';
import { HAT_TALL, KIT_MARK, wearing } from '../kit.js';
import { garage, hasGarage, doorX, inGarage } from '../crew/lifts.js';
import { underground } from '../quarry.js';
import { hash } from './flicker.js';
import { shadeOf } from '../grid.js';
import { drawRoster, kitStands } from '../roster.js';
import { inBasket } from '../balloon.js';
import { HATS, HATS_TIGHT, drawSprite, spriteH, spriteW } from '../sprites.js';
import { S, bench, floor, pit } from '../state.js';
import { deepTop } from '../deep/place.js';
import { abyssLine } from '../pit.js';
import { ctx } from './ctx.js';
import { drawRunSwitch } from './machines.js';
import { drawMark } from './marks.js';
import { withRise } from './rise.js';
import { raising } from '../raise.js';
import { TYPE } from '../jobs.js';
import { shown } from '../tween.js';
import { poseAt, topOf } from '../motion.js';
import { writeCount } from './numfont.js';
import { dressBehind, dressOn, dressHead, dressFlat, headRows, wearsHead, motionOf, onDevice, YARD_INKS, DEEP_INKS } from './wardrobe.js';
import { dressAura } from './wardaura.js';
import { lampCone } from './lamplight.js';
import { outfitOf, whoIs, WHO } from '../wardrobe.js';

// The bench is not in the yard until there is something on it worth buying.
// It is built rather than delivered (raise.js), so while it is going up it is
// drawn through the same clip as every rising building. The clamped block
// stands two cells proud of the slab, so the clip box starts there rather than
// at the bench's own top, or the last thing to go on is the first showing.
export function drawBench() {
  const up = raising();
  if (!S.seenBench && !up) return;
  withRise(up ? 'bench' : null, bench.x, bench.y + bench.h,
           bench.w, bench.h + P * 2, () => {
    ctx.fillStyle = '#000';
    ctx.fillRect(bench.x, bench.y, bench.w, P * 2);                       // top slab
    ctx.fillRect(bench.x + P, bench.y + P * 2, P * 2, bench.h - P * 2);   // legs
    ctx.fillRect(bench.x + bench.w - P * 3, bench.y + P * 2, P * 2, bench.h - P * 2);
    ctx.fillRect(bench.x + P * 4, bench.y - P * 2, P * 2, P * 2);         // something clamped to it
  });
}

// The body: one hollow square, whoever it is. Where somebody is standing says
// what they are doing, so no job carries a mark of its own. Drawn here because
// the roster under each station draws the same square beside its count.
//
// The two of them are the one exception: they wear what was chosen for them
// (render/wardrobe.js), handed in as `look` (`lookFor`). True when what they
// wear on their head was drawn, which is then worn in place of a station hat.
export function drawBody(x, y, look = null) {
  // Filled, not see-through: an outlined square on a black rock shows the rock
  // through its middle and reads as a hole in whatever is behind it. The page
  // is white, so a body is white.
  if (!look) { square(x, y, WORKER, WORKER); return false; }
  return rigid(x, y, () => {
    dressAura(ctx, x, y, look, 'back');
    dressBehind(ctx, x, y, look);
    square(x, y, WORKER, WORKER);
    dressOn(ctx, x, y, look);
    const head = dressHead(ctx, x, y, look);
    dressAura(ctx, x, y, look, 'front');
    return head;
  });
}

// What a dressed body wears drawn rigid: its corner put on a whole device
// pixel first, so every mark on it rounds the same way frame to frame. Laid
// at its own place each mark rounds alone, and as the body walks a world
// pixel at a time at a zoom that is not whole, its one- and two-pixel marks
// swap and the pattern crawls.
function rigid(x, y, draw) {
  const m = ctx.getTransform ? ctx.getTransform() : null;
  const dx = m ? onDevice(x, m.a, m.e) - x : 0, dy = m ? onDevice(y, m.d, m.f) - y : 0;
  if (dx || dy) ctx.translate(dx, dy);
  try { return draw(); } finally { if (dx || dy) ctx.translate(-dx, -dy); ctx.fillStyle = '#000'; }
}

// The same square squashed to two rows, its feet on the ground of a body
// stood at (x, y): the crouch before a hop and the landing after it.
export function drawSquat(x, y, look = null) {
  if (!look) { square(x, y + P, WORKER, WORKER - P); return false; }
  return rigid(x, y, () => {
    // the aura stays round the body as it stands: a crouch is its feet where they were
    dressAura(ctx, x, y, look, 'back');
    dressBehind(ctx, x, y + P, look, WORKER - P);
    square(x, y + P, WORKER, WORKER - P);
    dressOn(ctx, x, y + P, look, WORKER, WORKER - P);
    const head = dressHead(ctx, x, y + P, look);
    dressAura(ctx, x, y, look, 'front');
    return head;
  });
}

// How one of the two of them is drawn this frame, or null for anybody else
// (or for nobody: `who` null). `key` is the object the body is drawn from,
// which its walk is read off (`motionOf`); `face` its own facing where it
// keeps one; `deep` for a body drawn in the deep's inks; `back` false where
// something else hangs off its back (a carter's cart); `aura` false where
// the body is somewhere its aura cannot be (under the rock). The key is the
// aura's too, which remembers the walk off it (render/wardaura.js).
export function lookFor(who, key, x, { face = null, deep = false, back = true, aura = true } = {}) {
  if (!who) return null;
  const t = now() / 1000, m = motionOf(key, x, t, face);
  return { outfit: outfitOf(who), dir: m.dir, moving: m.moving, since: m.since, t, inks: deep ? DEEP_INKS : YARD_INKS, back,
           deep, aura, key, seed: WHO.indexOf(who) };
}

// A body's square: a black rim BODY_RIM world pixels thick round a white
// middle, its edges on whole device pixels. A body walks a world pixel at a
// time, and at a zoom that is not whole a rim laid at its own place
// straddles device pixels and comes out a blend of the two inks: a grey the
// deep's palette does not hold (docs/design-language/canvas.md).
function square(x, y, w, h) {
  const m = ctx.getTransform ? ctx.getTransform() : null;
  const k = m ? m.a : 1, e = m ? m.e : 0, f = m ? m.f : 0;
  const sx = v => onDevice(v, k, e), sy = v => onDevice(v, k, f);
  const x0 = sx(x), y0 = sy(y), x1 = sx(x + w), y1 = sy(y + h);
  const rim = Math.max(1, Math.round(BODY_RIM * k)) / k;
  ctx.fillStyle = '#000';
  ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
  ctx.fillStyle = '#fff';
  ctx.fillRect(x0 + rim, y0 + rim, x1 - x0 - 2 * rim, y1 - y0 - 2 * rim);
  ctx.fillStyle = '#000';
}

// A hat, from the table in sprites.js. All three trade hats are the same solid
// bar across the top of the square with one cell of difference each, which is
// as much difference as an eighteen-pixel square will carry: helmet a bare
// bar, lamp a cell proud of the middle, brim a cell over each side with a
// crown. A carter wears no hat: what you see of a carter is the cart.
export function drawHat(x, y, kind = 'helmet', tight = false) {
  // `tight` is for a hat drawn on a counter, where there is no bare ground to
  // overhang into; only the sun hat has a narrower version, since the wizard's
  // brim standing proud of the body is the whole of what says wizard.
  const rows = (tight && HATS_TIGHT[kind]) || HATS[kind] || HATS.helmet;
  // Centered on the body, bottom row one cell above its top, and NOT snapped
  // to the cell grid: a body moves in whole pixels, so a snapped hat hops a
  // cell at a time while the head slides. The offset is already whole pixels
  // (an odd number of cells wide on a three-cell body).
  const left = x + (WORKER - spriteW(rows) * P) / 2;
  // No white around it: it takes the hat off the head where hat, outline and
  // rock are one black.
  hatCells(rows, left, y - spriteH(rows) * P);
}

// A hat's cells laid on whole device pixels by the same rule as the body's
// `square`, each cell's edges snapped and shared with its neighbors. A hat
// laid at its own fractional place (a counter on a half cell, a zoom that is
// not whole) blends its edges and slides a pixel off the head it sits on.
function hatCells(rows, x, y) {
  const m = ctx.getTransform ? ctx.getTransform() : null;
  const sx = v => (m ? onDevice(v, m.a, m.e) : Math.round(v));
  const sy = v => (m ? onDevice(v, m.d, m.f) : Math.round(v));
  for (let r = 0; r < rows.length; r++) {
    for (let c = 0; c < rows[r].length; c++) {
      const ch = rows[r][c];
      if (ch === '.' || ch === ' ') continue;
      ctx.fillStyle = ch === 'o' ? '#fff' : '#000';
      const x0 = sx(x + c * P), y0 = sy(y + r * P);
      ctx.fillRect(x0, y0, sx(x + (c + 1) * P) - x0, sy(y + (r + 1) * P) - y0);
    }
  }
  ctx.fillStyle = '#000';
}

// What a body has on is asked of kit.js, the one place that knows.

// A carter drags a cart behind it, and what it carries rides *in* the cart.
// Wider than the body and half its height: at three cells square a carter reads
// as two workers walking in step.
const CART_ABREAST = 4;
// The most of a load drawn: over the head two abreast, or in the cart.
const HAND_SHOWN = 24, CART_SHOWN = 40;
// How far from its corner anything drawn with a body can reach: the tallest
// load drawn, stacked over its head or in the cart beside it, and a cart's
// width the other way. A body further than this off the glass is not drawn.
const BODY_REACH = WORKER + CART_W + P * (2 + Math.max(HAND_SHOWN / 2, CART_SHOWN / CART_ABREAST));

function cartBox(x, y, face) {
  const back = face > 0 ? -1 : 1;                       // behind whichever way it is going
  // A cell off the ground, standing on its wheel (`drawCartBox`).
  return { x: back < 0 ? x - CART_W - P : x + WORKER + P,
           y: y + WORKER - CART_H - P, back };
}

function drawCartBox(x, y) {
  // white through it too, for the same reason the body is
  ctx.fillStyle = '#fff';
  ctx.fillRect(x + 1, y + 1, CART_W - 2, CART_H - 2);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, CART_W - 2, CART_H - 2);
  ctx.fillStyle = '#000';
  // The wheel under the middle is the difference between a thing hauled and a
  // thing wheeled.
  ctx.fillRect(x + CART_W / 2 - P / 2, y + CART_H, P, P);
}

// A forklift: the driver sits up on a truck instead of walking beside a box.
// The truck is a cart's box on two wheels, the body sat on top of it, a mast
// one cell wide up the front with the forks out along the ground, and a stack
// out the back; the load rides on the forks, in front and off the ground,
// which is what four times a cart looks like. `LIFT_SEAT` is how far the
// truck lifts the body: a wheel and the box. Same footing as the cart: wheels
// in the cell over the ground line, the box on the wheels. Five cells wide so
// a three-cell body sits centered on it a whole cell in from each end.
const LIFT_H = LIFT_SEAT - P, LIFT_ABREAST = 4;
// the most drawn on the forks: a load past this is a stack taller than the
// mast, and the rest rides unseen
const LIFT_CAP = 64;

// One drawing for all three places it is seen: on the road under a body, on
// its stand, and lying where it was thrown. `x` is the truck's left edge,
// `ground` the line its wheels stand on, `fwd` which way the forks point.
function drawLiftBox(x, ground, fwd = 1) {
  const bottom = ground - P;                                   // the wheels' row
  const top = bottom - LIFT_H;
  ctx.fillStyle = '#fff';
  ctx.fillRect(x + 1, top + 1, LIFT_W - 2, LIFT_H - 2);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, top + 1, LIFT_W - 2, LIFT_H - 2);
  ctx.fillStyle = '#000';
  ctx.fillRect(x, bottom, P, P);                               // two wheels
  ctx.fillRect(x + LIFT_W - P, bottom, P, P);
  const mastX = fwd > 0 ? x + LIFT_W : x - P;
  ctx.fillRect(mastX, ground - LIFT_MAST, P, LIFT_MAST);        // the mast
  const forkX = fwd > 0 ? mastX + P : mastX - LIFT_FORK;
  ctx.fillRect(forkX, bottom, LIFT_FORK, P);                    // and the forks
  // The antenna on the roof: it drives itself, and this is what it listens
  // with. A thin stalk up the middle of a cell over the cab and a knob on top.
  const antX = x + (fwd > 0 ? P : LIFT_W - P * 2);
  ctx.fillRect(antX + P / 2 - 1, top - LIFT_ANTENNA, 2, LIFT_ANTENNA);
  ctx.fillRect(antX, top - LIFT_ANTENNA - P, P, P);
  return { forkX, forkTop: bottom };
}

// Under a body at (x, y): the truck centered on it, facing its way. Returns
// where the forks are for the load to stack on.
function drawLift(x, y, face) {
  const fwd = (face || 1) > 0 ? 1 : -1;
  return drawLiftBox(x + (WORKER - LIFT_W) / 2, y + WORKER, fwd);
}

// Exported because the roster draws the same thing beside its count.
export { drawCart };

function drawCart(x, y, face) {
  const c = cartBox(x, y, face);
  drawCartBox(c.x, c.y);
  ctx.fillStyle = '#000';
  // the shaft, from the cart to the body it is hitched to
  ctx.fillRect(c.back < 0 ? c.x + CART_W : x + WORKER, c.y + CART_H / 2 - 1, P + 1, 2);
}

// The kit waiting at a station: a trestle (a slab and two legs, five cells
// across) with one of the thing on it, and over it the count. A helmet on bare
// ground reads as a helmet somebody dropped; this is gear put out ready.
const STAND_W = P * 5, STAND_H = P * 3;

// A hat shaken off somebody: in the air on its own arc while it falls, then
// lying where it came down until its owner fetches it. Not on a stand: it was
// not put down, it came off.
export function drawDroppedHats() {
  for (const w of S.workers) {
    if (!w.hatOff || w.hatOff.x == null) continue;
    const x = Math.round(w.hatOff.x), y = Math.round(w.hatOff.y);
    // Drawn as the thing it IS, off whose kit it is: a cart lying on the ground
    // is the box and its wheel, not a little hat.
    const mark = KIT_MARK[w.hatOff.of] || 'helmet';
    if (mark === 'cart') drawCartBox(x, y - CART_H - P);
    else drawHat(x, y, mark);
  }
}

export function drawKitStands() {
  ctx.fillStyle = '#000';
  for (const k of kitStands()) {
    const top = k.y - STAND_H;
    ctx.fillRect(k.x - P, top, STAND_W, P);                       // the slab
    ctx.fillRect(k.x - P, top + P, P, STAND_H - P);               // and its legs
    ctx.fillRect(k.x + STAND_W - P * 2, top + P, P, STAND_H - P);
    // and the one on it, standing on the slab the way it stands on a head
    if (k.mark === 'cart') drawCartBox(k.x - P, top - CART_H);
    else if (k.mark === 'lift') drawLiftBox(k.x - P, top + P);
    else drawHat(k.x + (STAND_W - P * 2 - WORKER) / 2, top, k.mark);
  }
}

// The count over it, in screen pixels like every other number in the yard.
export function drawKitCounts(screenAt) {
  const stands = kitStands();
  if (!stands.length && !hasGarage()) return;
  // How many forklifts are in the garage, over its roof like a stand's count.
  if (hasGarage()) {
    const g = garage();
    const at = screenAt(g.x + g.w / 2, S.groundY - g.h - P * 3);
    writeCount(ctx, String(Math.round(shown('garage', inGarage()))), at.x, at.y);
  }
  for (const k of stands) {
    // A clear two cells over whatever is on the slab, measured off the mark
    // rather than fixed: the wizard's cone is three courses on its own.
    const at = screenAt(k.x - P + STAND_W / 2,
                        k.y - STAND_H - HAT_TALL[k.mark] - P * 2);
    writeCount(ctx, String(Math.round(shown('kit:' + k.mark, k.n))), at.x, at.y);
  }
  ctx.fillStyle = '#000';
}

// --- what a body on a break has to say ----------------------------------------
// Never words: a note is singing, a burst is swearing, dots are talking, and
// dots going back and forth between two bodies facing each other is a
// conversation. Everything stands a clear cell above the head so it never
// touches the load a worker is carrying.

const ASK = ['111', '001', '011', '000', '010'];

function drawSay(w, say) {
  const x = Math.round(w.x) + WORKER / 2;
  const top = Math.round(w.y) - P * 2;
  ctx.fillStyle = '#000';

  // the same heart the opening uses: the same thing said, so the same shape
  if (say.mark === 'heart') {
    for (let r = 0; r < HEART.length; r++)
      for (let c = 0; c < 5; c++)
        if (HEART[r][c] === '1')
          ctx.fillRect(Math.round(x - P * 2.5 + c * P), top - P * 3 + r * P, P, P);
    return;
  }

  if (say.mark === 'dots') {
    const n = say.n || 2;
    // whole cells with a skipped cell between, never a cell a pixel short
    for (let i = 0; i < n; i++)
      ctx.fillRect(onCell(x - (2 * n - 1) * P / 2 + i * 2 * P), top - P, P, P);
    return;
  }

  // Stars, two cells going round the head rather than a fixed pair, so a body
  // seeing them is plainly still spinning.
  if (say.mark === 'dizzy') {
    const t = now() / 160;
    for (const off of [0, Math.PI]) {
      const a = t + off;
      ctx.fillRect(onCell(x + Math.cos(a) * P * 2.2 - P / 2),
                   onCell(top - P * 1.4 + Math.sin(a) * P), P, P);
    }
    return;
  }

  if (say.mark === 'loo') {
    ctx.fillStyle = MUCK_TONE;
    ctx.fillRect(Math.round(x - P * 1.5), top - P, P * 3, P);
    ctx.fillRect(Math.round(x - P * 0.5), top - P * 2, P, P);
    ctx.fillStyle = '#000';
    return;
  }

  // Stink risers, the comic-strip smell mark, off the patch the body has just
  // refused to step in. They alternate their middle cell so the pair wafts.
  if (say.mark === 'yuck') {
    const wave = Math.floor(now() / 240) % 2 ? P : -P;
    for (const sx of [-P, P]) {
      const cx = onCell(x + sx * 1.5 - P / 2);
      ctx.fillRect(cx, top - P, P, P);
      ctx.fillRect(cx + wave * (sx > 0 ? 1 : -1), top - P * 2, P, P);
      ctx.fillRect(cx, top - P * 3, P, P);
    }
    return;
  }

  // A question mark, five cells tall: the first muck's body asking what it
  // has been sent to (firstmuck.js).
  if (say.mark === 'ask') {
    for (let r = 0; r < ASK.length; r++)
      for (let c = 0; c < 3; c++)
        if (ASK[r][c] === '1') ctx.fillRect(Math.round(x - P * 1.5 + c * P), top - P * 5 + r * P, P, P);
    return;
  }

  // A bang, as the pair's (`drawSaying`): a bar and a dot under it, several
  // for a call for help.
  if (say.mark === 'bang') {
    const n = say.n ?? 1, x0 = Math.round(x - P / 2 - (n - 1) * P);
    for (let i = 0; i < n; i++) {
      ctx.fillRect(x0 + i * P * 2, top - P * 5, P, P * 3);
      ctx.fillRect(x0 + i * P * 2, top - P, P, P);
    }
    return;
  }

  if (say.mark === 'note') {
    // a head and a stem: the smallest thing that is unmistakably a note
    ctx.fillRect(onCell(x - P), top - P, P, P);
    ctx.fillRect(onCell(x), top - P * 3, P, P * 2);
    return;
  }

  // a burst: four cells off a corner, the comic shape of a swear word
  // (a skipped cell between the arms, so it reads as four marks, not a plus)
  for (const [dx, dy] of [[0, -1], [-1, 0], [1, 0], [0, 1]])
    ctx.fillRect(onCell(x + dx * P * 2 - P / 2), top - P * 2 + dy * P * 2, P, P);
}

// A landing's hop: the one hop's poses (HOP_POSES) over LAND_HOP_MS, its top
// LAND_HOP_H cells for a first-sized rock, in whole cells; lift in pixels.
const HOP_TOP = topOf(HOP_POSES);
function landPose(w, t0) {
  const k = (t0 - (w.hopAt || -Infinity)) / LAND_HOP_MS;
  if (!(k >= 0 && k < 1)) return null;
  const p = poseAt(HOP_POSES, k);
  return { ...p, lift: Math.round((p.lift || 0) / HOP_TOP * LAND_HOP_H * (w.hopK || 1)) * P };
}

// A mark's cell, snapped to the lattice.
function onCell(v) { return Math.round(v / P) * P; }

// Somebody you have just asked for by name: a solid arrow over the head,
// bobbing so it reads as put there rather than drawn on.
const ARROW = ['11111', '01110', '00100'];

export function drawPointed() {
  const t = now();
  for (const w of S.workers) {
    if (!w.pointed || w.pointed < t) continue;
    if (underground(w) || atPot(w) || atHome(w)) continue;
    const bob = Math.round(Math.sin(t / 140) * 1.5) * P;
    const x = Math.round(w.x) + WORKER / 2;
    const top = Math.round(w.y) - P * 5 + bob;
    ctx.fillStyle = '#000';
    for (let r = 0; r < ARROW.length; r++)
      for (let c = 0; c < 5; c++)
        if (ARROW[r][c] === '1')
          ctx.fillRect(Math.round(x - P * 2.5 + c * P), top + r * P, P, P);
  }
}

// A body shaken loose -- thrown off the coil by the lash, or dropped by the
// pointer -- sees stars all the way down, not only once it lands: the fall
// leaves it dizzy (`dizzyFor`, crew/falls.js) and the stars are that.
const FALLING_DIZZY = { mark: 'dizzy' };

export function drawSays() {
  const was = ctx.globalAlpha;
  for (const w of S.workers) {
    const say = w.say || (w.falling && w.dizzyFor ? FALLING_DIZZY : null);
    if (!say || underground(w) || atHome(w)) continue;
    const ink = bodyInk(w);
    if (ink <= 0) continue;
    ctx.globalAlpha = was * ink;
    drawSay(w, say);
  }
  ctx.globalAlpha = was;
  ctx.fillStyle = '#000';
}

// --- the two of them, and the one under the rock -----------------------------
// The opening is two squares talking on the bare ground, drawn here rather
// than as workers because they are not: nobody has been hired yet. After it,
// every time the last of a rock goes, the one underneath is there until the
// next rock lands on them.
// Dots are talking, a heart is the other thing, and a bang is what you say
// when a boulder has just landed on somebody.
const HEART = ['01010', '11111', '11111', '01110', '00100'];

export function drawSaying(x, y, say) {
  ctx.fillStyle = say.pale ? '#fff' : '#000';   // white where it stands against the dark inside of a rock
  const mid = x + WORKER / 2;
  const top = y - P * 3;

  if (say.mark === 'heart') {
    for (let r = 0; r < HEART.length; r++)
      for (let c = 0; c < 5; c++)
        if (HEART[r][c] === '1')
          ctx.fillRect(Math.round(mid - P * 2.5 + c * P), top - P * 3 + r * P, P, P);
    return;
  }

  if (say.mark === 'ask') {
    for (let r = 0; r < ASK.length; r++)
      for (let c = 0; c < 3; c++)
        if (ASK[r][c] === '1') ctx.fillRect(Math.round(mid - P * 1.5 + c * P), top - P * 4 + r * P, P, P);
    return;
  }

  if (say.mark === 'bang') {
    // a bar and a dot under it; a call for help is several, a gap between
    const n = say.n ?? 1, x0 = Math.round(mid - P / 2 - (n - 1) * P);
    for (let i = 0; i < n; i++) {
      ctx.fillRect(x0 + i * P * 2, top - P * 4, P, P * 3);
      ctx.fillRect(x0 + i * P * 2, top, P, P);
    }
    return;
  }

  const n = say.n || 2;
  for (let i = 0; i < n; i++)
    ctx.fillRect(onCell(mid - (2 * n - 1) * P / 2 + i * 2 * P), top, P, P);
}

// A body knocked flat: the same square lying down, two cells tall and three
// wide.
function drawFloored(x, y) {
  ctx.fillStyle = '#fff';
  ctx.fillRect(x - P + 1, y + WORKER - P * 2 + 1, WORKER + P * 2 - 2, P * 2 - 2);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.strokeRect(x - P + 1, y + WORKER - P * 2 + 1, WORKER + P * 2 - 2, P * 2 - 2);
  ctx.fillStyle = '#000';
}

export function drawIntro() {
  for (const b of S.pair) {
    if (b.under) continue;              // gone into the portal after him
    const x = Math.round(b.x), y = Math.round(b.y);
    const look = lookFor(b.who || whoIs(b.body), b, b.x);
    if (b.down) { drawFloored(x, y); if (look) dressFlat(ctx, x - P, y + WORKER - P * 2, look); ctx.fillStyle = '#000'; }
    else drawBody(x, y, look);
    if (b.say) drawSaying(x, y, b.say);
  }

  if (!buriedShown() || !S.buriedSay) return;
  const at = buriedAt();
  drawSaying(at.x, at.y + Math.round(BURIED_SUNK_C * (1 - buriedOut())) * P, S.buriedSay);
}

// The one in the ground, before the rock is painted, so the rock's cells stand
// in front of it.
export function drawBuried() {
  if (!buriedShown()) return;
  const at = buriedAt();
  drawLodged(at.x, at.y, buriedOut());
}

// The one in the ground: the same square, stood with its feet where anybody's
// would be and sunk by however much is still lodged, a whole cell at a time.
// The part below the ground line is simply not drawn. Returns how far down it
// is, so whatever it says can sit over the part that shows.
function drawLodged(x, y, out) {
  const sunk = Math.round(BURIED_SUNK_C * (1 - out));
  const depth = sunk * P;
  ctx.save();
  ctx.beginPath();
  ctx.rect(x - P, y - P * 8, WORKER + P * 2, WORKER + P * 8);  // down to the ground line
  ctx.clip();
  // her, under every rock: only what she wears on her head shows over the
  // ground while she is lodged deep
  drawBody(x, y + depth, lookFor('sqouse', S.boulder, x, { aura: false }));
  ctx.restore();
  drawDirt(x, y + WORKER, sunk);
  return depth;
}

// The ground it is in: a heap banked against each side, as many cells high as
// the square is deep, stepping down a cell a column outward. It shrinks as the
// dig goes. Each cell keeps its own tone off its position rather than the
// frame, so the heap is mottled and does not strobe.
function drawDirt(x, groundY, sunk) {
  for (let side = -1; side <= 1; side += 2) {
    for (let i = 0; i < sunk; i++) {
      const cx = side < 0 ? x - P * (i + 1) : x + WORKER + P * i;
      for (let j = 0; j < sunk - i; j++) {
        const cy = groundY - P * (j + 1);
        ctx.fillStyle = shadeOf(BURIED_DIRT_TONE + Math.round(hash(cx * 7.1 + cy * 3.7) * 2 - 1));
        ctx.fillRect(cx, cy, P, P);
      }
    }
  }
  ctx.fillStyle = '#000';
}

// How each kind of body is drawn, as a row rather than a branch: a body
// stands somewhere, may drag a cart, wears whatever is on its head and holds
// whatever it picked up. Only what differs between kinds is here.
//
//   lunge  which way a swing throws the body: down into the work, up for a
//          wizard, 0 for bodies that do not swing.
//   lean   ...or forward, into the way it is facing, for a swing that is a
//          push rather than a stoop: a janitor plants its feet and shovels
//          without going anywhere, and a lunge on its y reads as bobbing.
//   load   a quarrier brings up one thing at a time and it rides over its
//          head as that thing; everybody else stacks grains, in the cart if
//          there is one.
const LOOK = {
  janitor:  { lunge:  0, lean: 1 },
  scholar:   { lunge:  1 },
  farmhand: { lunge:  1 },
  stirrer:  { lunge:  1, lean: 1 },   // stoops and leans toward the pot as it stirs
  quarrier: { lunge:  1, load: 'shard' },
  wizard:   { lunge: -1 },
  rockhand:    { lunge:  0 },
  hauler:   { lunge:  0 },
  // A builder at a busy site hops and lunges at the bottom of each hop
  // (`workJig` in crew.js); with no row here it falls through to `PLAIN`,
  // whose `lunge: 0` throws the lunge away.
  builder:  { lunge:  1 }
};
const PLAIN = { lunge: 0 };

// How far a lean throws a body, in cells. Half of what a stoop drops it: a
// whole cell sideways reads as a body stepping, not reaching.
const LEAN = 0.5;

// The forklifts: the truck and nobody on it, its load on the forks four
// abreast. Not crew, so not faded with them
// (the crew switch in the corner is about people).
export function drawForklifts() {
  for (const w of S.lifts || []) {
    if (w.inside) continue;                      // in the garage
    const ground = Math.round(w.y);
    const x = Math.round(w.x);
    const lift = drawLift(x, ground, w.face || 1);
    const n = Math.min(w.carry || 0, LIFT_CAP);
    for (let i = 0; i < n; i++) {
      drawMark(w.load?.[i] || 1,
               lift.forkX + (i % LIFT_ABREAST) * P + P / 2,
               lift.forkTop - P * (Math.floor(i / LIFT_ABREAST) + 1) + P / 2);
    }
    ctx.fillStyle = '#000';
  }
}

// A body on the deep's way, or down the shaft past the deep's ceiling: drawn
// by the deep (render/deep.js, `drawSwimmers`), never by the yard.
export const inTheDeep = w => w.way === 'deep' || w.y + WORKER > deepTop();

// A body going down into the drowned pit goes under a row at a time: what is
// below the surface is the liquid's and is not drawn. Only over the pit's own
// columns, since the plank over it is at the brim and a body on it is dry.
function underSurface(w) {
  if (!S.drowned || w.x + WORKER <= pit.x || w.x >= pit.x + pit.w) return null;
  const line = abyssLine();
  return w.y + WORKER > line ? line : null;
}

// Each body ringed while the right button looks at the crew, so it stands out
// of the veil behind it (`drawSightVeil`): a SIGHT_RING line a SIGHT_GAP clear
// of its own edge.
const ring = w => ringBox({ x: w.x, y: w.y, w: WORKER, h: WORKER });
function ringBox(b) {
  ctx.fillStyle = '#000';
  const x = Math.round(b.x) - SIGHT_GAP - SIGHT_RING, y = Math.round(b.y) - SIGHT_GAP - SIGHT_RING;
  const sw = b.w + (SIGHT_GAP + SIGHT_RING) * 2, sh = b.h + (SIGHT_GAP + SIGHT_RING) * 2;
  ctx.fillRect(x, y, sw, SIGHT_RING);
  ctx.fillRect(x, y + sh - SIGHT_RING, sw, SIGHT_RING);
  ctx.fillRect(x, y, SIGHT_RING, sh);
  ctx.fillRect(x + sw - SIGHT_RING, y, SIGHT_RING, sh);
}

// Holding the right button: what is behind the crew's plane veiled pale, in
// held steps as it comes in (config SIGHT_*). Over the yard's view, before
// the crew are drawn.
export function drawSightVeil() {
  if (S.crewSight == null) return;
  const k = Math.min(1, (now() - S.crewSight) / SIGHT_IN_MS);
  const step = Math.ceil(k * SIGHT_STEPS) / SIGHT_STEPS;
  if (!(step > 0)) return;
  ctx.save();
  ctx.globalAlpha = SIGHT_VEIL * step;
  ctx.fillStyle = '#fff';
  ctx.fillRect(S.camX - P, S.camY - P, S.viewW + P * 2, S.viewH + P * 2);
  ctx.restore();
}

// The same look in the deep, whose bodies are drawn by its own layers
// (render/deep.js, render/arms.js) rather than `drawWorkers`: the veil over
// the water, the serpent and the floor, and each body's ring, before the
// swimmers and the fighters go over them. A body still in the liquid above
// the deep's surface is not drawn, so it is not ringed either.
export function drawDeepSight() {
  if (S.crewSight == null) return;
  drawSightVeil();
  const cut = deepTop() + DEEP_SURFACE + P;
  for (const w of S.workers) if (!w.lifted && inTheDeep(w) && w.y >= cut) ring(w);
}

// The same look up in an act's place, whose bodies its own layers draw: the
// veil over everything behind them and a ring round each the hand may take,
// by the box the hand takes it by (placebodies.js, `bodyAt`).
export function drawPlaceSight() {
  if (S.crewSight == null) return;
  const crew = actPlace(S.view)?.crew;
  if (!crew) return;
  drawSightVeil();
  for (const w of crew.list() || []) if (!w.lifted && !w.falling && crew.pickable(w)) ringBox(crew.box(w));
}

export function drawWorkers() {
  const t0 = now();
  const was = ctx.globalAlpha;
  const sx = Math.abs(S.shakeX), sy = Math.abs(S.shakeY);
  const x0 = S.camX - sx, x1 = S.camX + S.viewW + sx, y0 = S.camY - sy, y1 = S.camY + S.viewH + sy;
  for (const w of S.workers) {
    // Out of sight: in the lab, down the quarry, in the outhouse, or home. The
    // stirrer is NOT hidden: it stirs in plain sight, so `atPot` is not a
    // reason to skip it here. A body in a balloon's basket is drawn by the
    // balloon, wherever in the sky it is (render/balloon.js).
    if (w.lifted || underground(w) || atHome(w) || inBasket(w) || inTheDeep(w)) continue;
    // and while a scene holds the yard, only as much of it as this pass draws
    // (render/recede.js)
    const ink = bodyInk(w);
    if (ink <= 0) continue;
    ctx.globalAlpha = was * ink;
    if (S.crewSight != null && underSurface(w) == null) ring(w);
    // Off the glass, by more than anything a body carries or wears reaches:
    // a big crew is mostly somewhere else along the yard.
    if (w.x + BODY_REACH < x0 || w.x - BODY_REACH > x1 || w.y + BODY_REACH < y0 || w.y - BODY_REACH > y1) continue;
    const sunk = underSurface(w);
    if (sunk != null) {
      if (w.y >= sunk) continue;
      ctx.save();
      ctx.beginPath();
      ctx.rect(w.x - P * 8, w.y - P * 16, WORKER + P * 16, sunk - w.y + P * 16);
      ctx.clip();
      drawWorker(w, t0);
      ctx.restore();
      continue;
    }
    drawWorker(w, t0);
  }
  ctx.globalAlpha = was;
}

// The body in your hand is the pointer's, not the ground's: drawn whole, over
// everything of the world, in whichever half the camera is in. Left to the
// half it hangs over, it went under the drowned pit's surface with the bodies
// wading in, and past the deep's ceiling out of the swimmers' water, both a
// line nothing in the hand ever crosses.
export function drawHeld() {
  const w = S.workers.find(o => o.lifted);
  if (w) drawWorker(w, now());
}

function drawWorker(w, t0) {
  {

    // Somebody digging at the one in the ground is drawn as a builder,
    // whatever job the body came from.
    const look = (w.dig ? LOOK.builder : LOOK[w.type]) || PLAIN;
    const throwOn = w.lunge || 0;
    // A lean is a pose and not an ease (`LEAN_HOLD`): drawn off the eased
    // lunge it is a kick and then a creep back a pixel at a time, on every
    // swing, which is a janitor jittering while it cleans.
    const leanOn = throwOn > LEAN_HOLD ? 1 : 0;
    const x = Math.round(w.x + leanOn * (look.lean || 0) * (w.face || 1) * P * LEAN);
    // The finale's crowd hopping in held poses and its builders stooping
    // (finale.js), or the landing hop, drawn here and nowhere else:
    // `landRock` stamps the moment and the weight, and this steps the body
    // through the one hop's held poses without ever moving `w.y`, so nothing
    // that reasons about where a body stands has a body in the air.
    const pose = finalePose(w) || landPose(w, t0);
    const ground = Math.round(w.y + throwOn * look.lunge * P - (pose ? pose.lift || 0 : 0));

    // A cart is kit like any other, drawn off what the body is holding rather
    // than what the books say it is: the same rule a helmet has.
    const kit = wearing(w);
    const cart = kit === 'cart' ? cartBox(x, ground, w.face || 1) : null;
    if (cart) drawCart(x, ground, w.face || 1);       // behind the body it follows
    // A body squashed to two rows keeps its feet where they were.
    const squat = pose && pose.rows === 2 ? P : 0;
    const y = ground + squat;
    if (pose) drawHopMarks(x, Math.round(w.y), pose);

    // One of the two of them wears what was chosen (render/wardrobe.js), in
    // the deep's inks where the deep is drawn over them, and no back item
    // where a cart hangs.
    const dress = lookFor(whoIs(w), w, w.x, { face: w.face || 1, deep: inTheDeep(w), back: !cart });
    // A quarrier's lamp lights the way ahead whenever the lamp is the hat on
    // show (a head item worn over it lights its own, render/wardrobe.js).
    lampCone(ctx, x, y, w.face || 1, { on: kit === 'lamp' && !wearsHead(dress), key: w, t: t0 / 1000, src: 'hat' });
    const head = squat ? drawSquat(x, ground, dress) : drawBody(x, y, dress);
    if (pose && (pose.arms || pose.hold)) drawHeldPiece(x, y, pose.hold, pose.arms);

    // One line, for everybody: the whole of what "hats are always shown" means.
    // Their chosen headwear is worn in place of it (the owner's vote).
    const hat = kit;
    if (hat && hat !== 'cart' && !head) drawHat(x, y, hat);

    // The tonic is not drawn on the body: it is a plume of motes let go from
    // the head into the yard (`stepDoseMotes` in apothecary.js), so a walking
    // body trails it behind.

    // A stirrer carrying a dose holds a little vial over its head, colored by
    // which tonic it is walking out (`stepStirrer`, `w.carryTonic`).
    if (w.type === TYPE.STIR && w.holding) {
      const vx = Math.round((x + WORKER / 2 - P / 2) / P) * P;
      const vy = y - P * 5;
      ctx.fillStyle = '#000';
      ctx.fillRect(vx, vy, P, P);                              // the cork
      ctx.fillStyle = tonicColor(w.carryTonic);
      ctx.fillRect(vx, vy + P, P, P * 2);                      // the colored brew
      ctx.fillStyle = '#000';
    }

    if (!w.carry) return;

    // What it brought up, over its head, as the thing itself.
    if (look.load === 'shard') { drawMark(SHARD_CELL, x + WORKER / 2, y - P * 2); return; }

    // A load is drawn grain by grain as whatever each grain is: overhead two
    // abreast, or in the cart four abreast. (A forklift's is `drawForklifts`.)
    const abreast = cart ? CART_ABREAST : 2;
    const left = cart ? cart.x : x + (WORKER - P * 2) / 2;
    // Over the head it rides on what they wear there, not through it: a
    // load drawn over a bow is a bow nobody sees (render/wardrobe.js).
    const top = cart ? cart.y : y - (head ? headRows(dress) * P : 0);
    const cap = cart ? CART_SHOWN : HAND_SHOWN;
    for (let i = 0; i < Math.min(w.carry, cap); i++) {
      drawMark(w.load?.[i] || 1,
               left + (i % abreast) * P + P / 2,
               top - P * (Math.floor(i / abreast) + 1) + P / 2);
    }
    ctx.fillStyle = '#000';
  }
}

// roster.js lays the counters out and is handed the draws a counter's head is
// made of, so the crew's own drawing stays here. A carter faces away from its
// cart, which trails on its left; a forklift faces right, its box the truck's
// and its forks' reach and the antenna's height.
const COUNTER_SPRITES = {
  cart: (x, y) => { drawCart(x + CART_W + P, y, 1); drawBody(x + CART_W + P, y); },
  lift: (x, y) => { drawLiftBox(x, y + LIFT_SEAT + LIFT_ANTENNA + P, 1); }
};
export function drawRosterBodies() {
  drawRoster(ctx, drawBody, drawHat, drawRunSwitch, COUNTER_SPRITES);
}

// The forklifts' garage: a flat-roofed shed, a roll-up door of slats that
// stand open (dark) while a forklift is in the doorway, and nothing else. Drawn
// before the forklifts, so one driving past is in front of it.
export function drawGarage() {
  if (!hasGarage()) return;
  const g = garage();
  const top = S.groundY - g.h;
  ctx.fillStyle = '#000';
  ctx.fillRect(g.x, top, g.w, g.h);                              // the shed
  ctx.fillRect(g.x - P, top - P, g.w + P * 2, P);                // its eaves
  // The door: a cell in from each side, up to a cell under the eaves.
  const dx = g.x + P, dw = g.w - P * 2, dy = top + P;
  const busy = (S.lifts || []).some(w => !w.inside && Math.abs(w.x - doorX()) < WORKER);
  ctx.fillStyle = '#fff';
  ctx.fillRect(dx, dy, dw, S.groundY - dy);
  if (!busy) {
    ctx.fillStyle = '#000';
    for (let y = dy + P; y < S.groundY; y += P * 2) ctx.fillRect(dx, y, dw, 2);   // its slats
  }
  ctx.fillStyle = '#000';
}
