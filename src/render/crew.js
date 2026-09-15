// The crew and everything they carry, say and stand under: the bodies, their
// hats and carts, the bench, the kit stands, the speech, the pointed arrow,
// and the whole-crew draw.

import { atPot, tonicColor } from '../apothecary.js';
import { now } from '../clock.js';
import { MUCK_TONE, P, SHARD_CELL, WORKER, BURIED_SUNK_C, BURIED_DIRT_TONE, LEAN_HOLD, LAND_HOP_MS, LAND_HOP_H } from '../config.js';
import { atHome } from '../crew.js';
import { buriedAt, buriedVisible, buriedOut } from '../intro.js';
import { HAT_TALL, KIT_MARK, wearing } from '../kit.js';
import { underground } from '../quarry.js';
import { drawCoreGlow } from '../render/cores.js';
import { hash } from './flicker.js';
import { shadeOf } from '../grid.js';
import { drawRoster, kitStands } from '../roster.js';
import { inHouse } from '../scrubhouse.js';
import { HATS, HATS_TIGHT, drawSprite, spriteH, spriteW } from '../sprites.js';
import { S, bench, floor } from '../state.js';
import { ctx } from './ctx.js';
import { drawRunSwitch } from './machines.js';
import { drawCircle, drawMark } from './marks.js';
import { withRise } from './rise.js';
import { raising } from '../raise.js';
import { TYPE } from '../jobs.js';
import { shown } from '../tween.js';

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
export function drawBody(x, y) {
  // Filled, not see-through: an outlined square on a black rock shows the rock
  // through its middle and reads as a hole in whatever is behind it. The page
  // is white, so a body is white.
  ctx.fillStyle = '#fff';
  ctx.fillRect(x + 1, y + 1, WORKER - 2, WORKER - 2);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, WORKER - 2, WORKER - 2);
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
  drawSprite(ctx, rows, left, y - spriteH(rows) * P);
}

// What a body has on is asked of kit.js, the one place that knows.

// A carter drags a cart behind it, and what it carries rides *in* the cart.
// Wider than the body and half its height: at three cells square a carter reads
// as two workers walking in step.
const CART_W = P * 4, CART_H = P * 2, CART_ABREAST = 4;

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
    else drawHat(k.x + (STAND_W - P * 2 - WORKER) / 2, top, k.mark);
  }
}

// The count over it, in screen pixels like every other number in the yard.
export function drawKitCounts(screenAt) {
  const stands = kitStands();
  if (!stands.length) return;
  ctx.font = '13px ui-monospace, "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#000';
  for (const k of stands) {
    // A clear two cells over whatever is on the slab, measured off the mark
    // rather than fixed: the wizard's cone is three courses on its own.
    const at = screenAt(k.x - P + STAND_W / 2,
                        k.y - STAND_H - HAT_TALL[k.mark] - P * 2);
    ctx.fillText(String(Math.round(shown('kit:' + k.mark, k.n))), Math.round(at.x), Math.round(at.y));
  }
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

// --- what a body on a break has to say ----------------------------------------
// Never words: a note is singing, a burst is swearing, dots are talking, and
// dots going back and forth between two bodies facing each other is a
// conversation. Everything stands a clear cell above the head so it never
// touches the load a worker is carrying.

function drawSay(w) {
  const x = Math.round(w.x) + WORKER / 2;
  const top = Math.round(w.y) - P * 2;
  ctx.fillStyle = '#000';

  // the same heart the opening uses: the same thing said, so the same shape
  if (w.say.mark === 'heart') {
    for (let r = 0; r < HEART.length; r++)
      for (let c = 0; c < 5; c++)
        if (HEART[r][c] === '1')
          ctx.fillRect(Math.round(x - P * 2.5 + c * P), top - P * 3 + r * P, P, P);
    return;
  }

  if (w.say.mark === 'dots') {
    const n = w.say.n || 2;
    for (let i = 0; i < n; i++)
      ctx.fillRect(Math.round(x - (n * P) / 2 + i * P), top - P, P - 1, P - 1);
    return;
  }

  // Stars, two cells going round the head rather than a fixed pair, so a body
  // seeing them is plainly still spinning.
  if (w.say.mark === 'dizzy') {
    const t = now() / 160;
    for (const off of [0, Math.PI]) {
      const a = t + off;
      ctx.fillRect(Math.round(x + Math.cos(a) * P * 2.2) - P / 2,
                   Math.round(top - P * 1.4 + Math.sin(a) * P), P - 1, P - 1);
    }
    return;
  }

  if (w.say.mark === 'loo') {
    ctx.fillStyle = MUCK_TONE;
    ctx.fillRect(Math.round(x - P * 1.5), top - P, P * 3, P);
    ctx.fillRect(Math.round(x - P * 0.5), top - P * 2, P, P);
    ctx.fillStyle = '#000';
    return;
  }

  // Stink risers, the comic-strip smell mark, off the patch the body has just
  // refused to step in. They alternate their middle cell so the pair wafts.
  if (w.say.mark === 'yuck') {
    const wave = Math.floor(now() / 240) % 2 ? P : -P;
    for (const sx of [-P, P]) {
      const cx = Math.round(x + sx - P / 2);
      ctx.fillRect(cx, top - P, P - 1, P - 1);
      ctx.fillRect(cx + wave * (sx > 0 ? 1 : -1), top - P * 2, P - 1, P - 1);
      ctx.fillRect(cx, top - P * 3, P - 1, P - 1);
    }
    return;
  }

  // A body held still under the cursor asks what you want of it. Drawn in
  // half-cell strokes (still whole pixels) because the smallest legible question
  // mark on the P grid stands over the head like a sign.
  if (w.say.mark === '?') {
    const u = P / 2;
    const x0 = Math.round(x - P);
    const y0 = top - u * 7;
    ctx.fillRect(x0 + u, y0, u * 2, u);          // the top of the hook
    ctx.fillRect(x0, y0 + u, u, u);              // its left shoulder
    ctx.fillRect(x0 + u * 3, y0 + u, u, u * 2);  // and its right side, coming down
    ctx.fillRect(x0 + u * 2, y0 + u * 3, u, u);  // the curve back in
    ctx.fillRect(x0 + u, y0 + u * 4, u, u);      // the stem it lands on
    ctx.fillRect(x0 + u, y0 + u * 6, u, u);      // and the dot, one gap under
    return;
  }

  if (w.say.mark === 'note') {
    // a head and a stem: the smallest thing that is unmistakably a note
    ctx.fillRect(Math.round(x - P), top - P, P, P);
    ctx.fillRect(Math.round(x), top - P * 2, P - 2, P + 1);
    return;
  }

  // a burst: four cells off a corner, the comic shape of a swear word
  for (const [dx, dy] of [[0, -1], [-1, 0], [1, 0], [0, 1]])
    ctx.fillRect(Math.round(x + dx * P) - P / 2, top - P + dy * P, P - 1, P - 1);
}

// Somebody you have just asked for by name: a solid arrow over the head,
// bobbing so it reads as put there rather than drawn on.
const ARROW = ['11111', '01110', '00100'];

export function drawPointed() {
  const t = now();
  for (const w of S.workers) {
    if (!w.pointed || w.pointed < t) continue;
    if (underground(w) || inHouse(w) || atPot(w) || atHome(w)) continue;
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

export function drawSays() {
  for (const w of S.workers) {
    if (!w.say || underground(w) || inHouse(w) || atHome(w)) continue;
    drawSay(w);
  }
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

function drawSaying(x, y, say) {
  ctx.fillStyle = '#000';
  const mid = x + WORKER / 2;
  const top = y - P * 3;

  if (say.mark === 'heart') {
    for (let r = 0; r < HEART.length; r++)
      for (let c = 0; c < 5; c++)
        if (HEART[r][c] === '1')
          ctx.fillRect(Math.round(mid - P * 2.5 + c * P), top - P * 3 + r * P, P, P);
    return;
  }

  if (say.mark === 'bang') {
    // a bar and a dot under it
    ctx.fillRect(Math.round(mid - P / 2), top - P * 4, P, P * 3);
    ctx.fillRect(Math.round(mid - P / 2), top, P, P);
    return;
  }

  const n = say.n || 2;
  for (let i = 0; i < n; i++)
    ctx.fillRect(Math.round(mid - (n * P) / 2 + i * P), top, P - 1, P - 1);
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
    const x = Math.round(b.x), y = Math.round(b.y);
    if (b.down) drawFloored(x, y);
    else drawBody(x, y);
    if (b.say) drawSaying(x, y, b.say);
  }

  if (!buriedVisible()) return;
  const at = buriedAt();
  const depth = drawLodged(at.x, at.y, buriedOut());
  if (S.buriedSay) drawSaying(at.x, at.y + depth, S.buriedSay);
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
  drawBody(x, y + depth);
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

export function drawWorkers() {
  const t0 = now();
  for (const w of S.workers) {
    // Out of sight: in the lab, down the quarry, in the outhouse, or home. The
    // stirrer is NOT hidden: it stirs in plain sight, so `atPot` is not a
    // reason to skip it here.
    if (underground(w) || inHouse(w) || atHome(w)) continue;

    // Somebody digging at the one in the ground is drawn as a builder,
    // whatever job the body came from.
    const look = (w.dig ? LOOK.builder : LOOK[w.type]) || PLAIN;
    const throwOn = w.lunge || 0;
    // A lean is a pose and not an ease (`LEAN_HOLD`): drawn off the eased
    // lunge it is a kick and then a creep back a pixel at a time, on every
    // swing, which is a janitor jittering while it cleans.
    const leanOn = throwOn > LEAN_HOLD ? 1 : 0;
    const x = Math.round(w.x + leanOn * (look.lean || 0) * (w.face || 1) * P * LEAN);
    // The landing hop is drawn here and nowhere else: `landRock` stamps the
    // moment and the weight, and this lifts the body along one parabola
    // without ever moving `w.y`, so nothing that reasons about where a body
    // stands has a body in the air to reason about. Whole pixels, or a body
    // drawn between pixels smears a hairline off its own edge.
    const ht = (t0 - (w.hopAt || -Infinity)) / LAND_HOP_MS;
    const hop = ht >= 0 && ht < 1 ? LAND_HOP_H * (w.hopK || 1) * 4 * ht * (1 - ht) * P : 0;
    const y = Math.round(w.y + throwOn * look.lunge * P - hop);

    // A cart is kit like any other, drawn off what the body is holding rather
    // than what the books say it is: the same rule a helmet has.
    const cart = wearing(w) === 'cart' ? cartBox(x, y, w.face || 1) : null;
    if (cart) drawCart(x, y, w.face || 1);       // behind the body it follows

    drawBody(x, y);

    // One line, for everybody: the whole of what "hats are always shown" means.
    const hat = wearing(w);
    if (hat && hat !== 'cart') drawHat(x, y, hat);

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

    if (!w.carry && !w.hasCore) continue;

    // What it brought up, over its head, as the thing itself.
    if (look.load === 'shard') { drawMark(SHARD_CELL, x + WORKER / 2, y - P * 2); continue; }

    // A load is drawn grain by grain as whatever each grain is: overhead two
    // abreast, or in the cart four abreast.
    const abreast = cart ? CART_ABREAST : 2;
    const left = cart ? cart.x : x + (WORKER - P * 2) / 2;
    const top = cart ? cart.y : y;
    const cap = cart ? 40 : 24;
    for (let i = 0; i < Math.min(w.carry, cap); i++) {
      drawMark(w.load?.[i] || 1,
               left + (i % abreast) * P + P / 2,
               top - P * (Math.floor(i / abreast) + 1) + P / 2);
    }
    ctx.fillStyle = '#000';
    if (w.hasCore) {
      const stack = Math.ceil(Math.min(w.carry, 24) / 2);        // ride above the dust
      const cx = x + WORKER / 2, cy = y - P * (stack + 2);
      // A carried core gives off the same waves one on the ground does. Drawn
      // straight rather than through `drawCoreAt` because the disc riding a
      // body is a different size from the one on the ground.
      drawCoreGlow(cx, cy);
      drawCircle(cx, cy, P * 1.2);
    }
  }
}

// roster.js lays the badges out and is handed the draws a badge is made of,
// so the crew's own drawing stays here.
export function drawRosterBodies() {
  drawRoster(ctx, drawBody, drawHat, drawCart, drawRunSwitch);
}
