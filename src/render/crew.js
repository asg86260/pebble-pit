// The crew and everything they carry, say and stand under: the bodies, their
// hats and carts, the bench, the offers and kit stands, the speech, the pointed
// arrow, and the whole-crew draw. Extracted verbatim from render.js; behavior
// unchanged. Owns drawBench, drawBody, drawHat, drawCart, drawOffers,
// drawDroppedHats, drawKitStands, drawKitCounts, drawSays, drawPointed,
// drawIntro, drawWorkers and their private helpers. The shared primitives (ctx,
// drawCircle, drawMark) come from render.js, the core module; drawCoreGlow and
// markAt come from the cores and pilemarks clusters that already own them.

import { atPot, doseFrac, doseColor, tonicColor } from '../apothecary.js';
import { STATIONS, hasOffer, stationFoot } from '../board.js';
import { now } from '../clock.js';
import { MUCK_TONE, P, SHARD_CELL, WORKER } from '../config.js';
import { atHome } from '../crew.js';
import { buriedAt, buriedVisible } from '../intro.js';
import { HAT_TALL, KIT_MARK, wearing } from '../kit.js';
import { indoors } from '../lab.js';
import { underground } from '../quarry.js';
import { drawCoreGlow } from '../render/cores.js';
import { markAt } from '../render/pilemarks.js';
import { kitStands } from '../roster.js';
import { inHouse } from '../scrubhouse.js';
import { HATS, HATS_TIGHT, drawSprite, spriteH, spriteW } from '../sprites.js';
import { S, bench, floor } from '../state.js';
import { ctx, drawCircle, drawMark } from '../render.js';

// The bench is not in the yard until there is something on it worth buying, and
// once it is there it says so without being opened: a dot for something you can
// afford this second, a flag for a heading you have never seen. A flag is worth
// more than a dot -- one more row under `you` is not news, a whole new group is.
export function drawBench() {
  if (!S.seenBench) return;
  ctx.fillStyle = '#000';
  ctx.fillRect(bench.x, bench.y, bench.w, P * 2);                       // top slab
  ctx.fillRect(bench.x + P, bench.y + P * 2, P * 2, bench.h - P * 2);   // legs
  ctx.fillRect(bench.x + bench.w - P * 3, bench.y + P * 2, P * 2, bench.h - P * 2);
  ctx.fillRect(bench.x + P * 4, bench.y - P * 2, P * 2, P * 2);         // something clamped to it
}

// The body: one hollow square, whoever it is. Each job used to carry a mark of
// its own -- a lamp on a quarrier's head, a low notch on a stooping farmhand, a
// hollow centre on a rockhand -- and every one of them was a thing to learn before
// the yard could be read. Where somebody is standing already says what they are
// doing: the one on the rock is mining it, the one at a plot is tending it. So
// the marks went, and what is left is a body.
//
// Drawn here rather than in each branch of `drawWorkers`, because the roster
// under each station draws the same square beside its count.
export function drawBody(x, y) {
  // Filled, not see-through. An outlined square standing on a black rock or in a
  // grey bank showed the pile through its middle, so a body read as a hole in
  // whatever was behind it rather than as somebody standing in front of it --
  // and a gang on the crest of a rock came out as a row of notches in the rock.
  // The page is white, so a body is white: it is the same paper everything else
  // in this game is drawn on, and now it covers what it is standing over.
  ctx.fillStyle = '#fff';
  ctx.fillRect(x + 1, y + 1, WORKER - 2, WORKER - 2);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, WORKER - 2, WORKER - 2);
  ctx.fillStyle = '#000';
}

// The kit, on a body or on the ground. Both marks are one cell: anything finer
// than that on an eighteen-pixel square is a smudge, and both of them have to
// read at a glance from across the yard, because what they are for is telling
// you at a glance who has picked up what.
//
// A trade wears its own. All three are the same solid bar across the top of the
// square -- the only filled thing on a body, and the one thing that reads as
// headgear rather than as hair -- with one cell of difference each, which is
// exactly as much difference as an eighteen-pixel square will carry:
//
//   helmet  a bare bar. The rock, where the thing on your head is for the rock
//           landing on it and nothing else.
//   lamp    a bar with a cell standing proud of the middle of it. The quarry is
//           the one place in the yard with no daylight in it.
//   brim    a bar hanging a cell over each side, with a crown on top. Out in the
//           plots all day, and the only hat here that is about the sun.
//
// A carter wears no hat at all: what you see of a carter is the cart.
// `tight` pulls the sun hat's brim in by a cell each side. It is for the roster,
// where the mark stands in a slot with a number beside it and a brim at full
// span reaches under the digits; out in the yard it wears its proper width.
// A hat, from the table in sprites.js. `tight` pulls an overhanging brim in to
// the body's own width, for the hats drawn on a counter where there is no room
// beside them -- and the wizard's point is exempt, because the brim standing
// proud of the body is the whole of what says wizard.
//
// The shapes themselves are not here any more. They were a handful of `fillRect`
// calls with offsets in them, which is hard to read and impossible to *design*:
// nobody can look at `fillRect(x + P, y - P, WORKER - P * 2, P)` and see a flat
// cap. They are pictures now, in one file, one character to a cell.
export function drawHat(x, y, kind = 'helmet', tight = false) {
  // `tight` is for a hat drawn on a counter, where there is no bare ground
  // either side to overhang into -- and only the sun hat has a narrower version,
  // because a helmet is a helmet either way and the wizard's brim standing proud
  // of the body is the whole of what says wizard.
  const rows = (tight && HATS_TIGHT[kind]) || HATS[kind] || HATS.helmet;
  // Centred on the body, sitting with its bottom row one cell above the top of
  // it -- which is where every hat in this yard has always sat.
  // Not snapped to the cell grid.
  //
  // A body moves in whole *pixels* -- `drawBody` rounds `w.x` and no further --
  // so a hat snapped to the six-pixel lattice hopped a cell at a time while the
  // head under it slid, and spent most of every step somewhere the body was not.
  // The offset is a whole number of pixels already (a hat is an odd number of
  // cells wide on a three-cell body), so the snapping was doing nothing but
  // introducing the lag.
  const left = x + (WORKER - spriteW(rows) * P) / 2;
  drawSprite(ctx, rows, left, y - spriteH(rows) * P);
}

// What a body has on: asked of kit.js, which is the one place that knows. It
// used to be worked out here, which meant the drawing believed in a different
// set of hats from the roster, the errand and the shop -- and the janitor's cap,
// which only this file believed in at all.

// A carter drags a cart: a box on the ground behind it, hitched by a shaft, and
// what it is carrying rides *in* the cart rather than over its head. That is the
// whole of why a cart is worth having, and a carter walking a double load
// stacked on its own head would be a cart that was decoration.
//
// Wider than the body and half its height, on purpose. At three cells square it
// was the same box as the person pulling it and a carter read as two workers
// walking in step; four by two is the one proportion in the yard that is not a
// body, so it reads as a thing being dragged before you have worked out what.
const CART_W = P * 4, CART_H = P * 2, CART_ABREAST = 4;

function cartBox(x, y, face) {
  const back = face > 0 ? -1 : 1;                       // behind whichever way it is going
  // A cell off the ground, because it is standing on a wheel now: see
  // `drawCartBox`. The body of the cart rides above the axle, the way a barrow
  // does, and what was on the ground before was the box itself.
  return { x: back < 0 ? x - CART_W - P : x + WORKER + P,
           y: y + WORKER - CART_H - P, back };
}

function drawCartBox(x, y) {
  // white through it too, for the same reason the body is: half a carter solid
  // and half of it see-through is worse than either
  ctx.fillStyle = '#fff';
  ctx.fillRect(x + 1, y + 1, CART_W - 2, CART_H - 2);
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, CART_W - 2, CART_H - 2);
  ctx.fillStyle = '#000';
  // And the wheel it rolls on, under the middle of it. A box sliding along the
  // ground behind somebody is a crate being dragged; one cell of wheel under it
  // is the difference between a thing hauled and a thing wheeled, and it is the
  // whole reason a carter carries twice as much without going any slower.
  ctx.fillRect(x + CART_W / 2 - P / 2, y + CART_H, P, P);
}

// The cart, hitched behind a body at (x, y). Exported because the roster draws
// the same thing beside its count: what a carter looks like is a body *with* a
// cart, and a cart on its own is a cart nobody is pulling.
export { drawCart };

function drawCart(x, y, face) {
  const c = cartBox(x, y, face);
  drawCartBox(c.x, c.y);
  ctx.fillStyle = '#000';
  // the shaft, from the cart to the body it is hitched to
  ctx.fillRect(c.back < 0 ? c.x + CART_W : x + WORKER, c.y + CART_H / 2 - 1, P + 1, 2);
}

// The kit nobody is wearing, lying on the ground where the work is. A hat sits
// on the ground as the same bar it is on a head, and a cart as the same box it
// is behind one: what you are looking at is the thing itself put down, not an
// icon for it, so picking it up is obviously what happens when somebody walks
// over there.
// The kit waiting at a station: a stand with one of the thing on it, and over it
// the figure for how many there are. A trestle -- a slab and two legs, five
// cells across -- because a helmet lying on bare ground reads as a helmet
// somebody dropped, and this is gear put out ready.
const STAND_W = P * 5, STAND_H = P * 3;

// How far above the slab each mark reaches, so the count can stand clear of it.
// Off the kit table with the rest of it: a hat added there stands the right
// height here without anybody remembering to come and say so.

// An arrow under a station, pointing up at it: there is something on that board
// you could buy.
//
// One mark and one question. There were two for a while -- a flag for a heading
// you had never read, a dot for something you could afford -- and telling those
// apart is a thing to learn before the yard can be read at a glance, for a
// difference that changes nothing about what you do: you walk over and look
// either way.
//
// It stays up while you are standing there reading the board, too. Taking it
// down was tidy and read as the mark flickering off under the cursor -- and what
// it says is still true: there is something on that board. It goes when you buy
// the thing, which is the only event that changes the answer.
//
// It goes *under* the station, in the empty ground below the line, where nothing
// else in this game is drawn. Over the roof it would be among the tower's bar,
// the lab's tick and the casino's mark, every one of which is about what a place
// is *doing*; this is about what it is offering, and those want telling apart.
export function drawOffers() {
  ctx.fillStyle = '#000';
  for (const which of STATIONS) {
    if (stationFoot(which) == null || !hasOffer(which)) continue;
    const at = markAt(which, 'offer');
    // A diamond, not an arrow.
    //
    // The arrow was a solid head pointing up, and up is a direction -- which
    // asks to be read as "go this way" when what it means is "there is something
    // here". A diamond has no direction in it at all: it is a marker, the same
    // shape a map puts on a place, and it stops competing with the pointer over
    // a body's head that really does mean go and look at this.
    //
    // A real diamond, drawn as a shape rather than built out of cells.
    //
    // This is the one mark in the yard that is not on the lattice, and it earns
    // the exception the same way the core's ring does: it has to be small *and*
    // unambiguous, and those two things fight on a six-pixel grid. Stepped, a
    // diamond small enough not to shout is five courses -- and five courses of
    // square cells is a fat plus, because the corner steps are the same size as
    // the arms and nothing in the shape tells you which is which. Every attempt
    // to fix that made it bigger, hollow, or blurred.
    //
    // Four points and a fill has no steps in it at all, so the slopes are
    // slopes at any size. The core is drawn the same way and for the same
    // reason: some shapes are not made of cells.
    // Half the size it was. At two and a half cells by three it was the biggest
    // thing on the ground line -- taller than the plots it hung under and heavier
    // than the counter beside it -- which is the wrong weight for a mark whose
    // whole job is to be noticed and then ignored. It has no steps in it, so it
    // stays a clean diamond at any size; there was nothing keeping it large.
    const w = P * 1.25, h = P * 1.5;
    ctx.beginPath();
    ctx.moveTo(at.x + P / 2, at.y - h);          // top
    ctx.lineTo(at.x + P / 2 + w, at.y);          // right
    ctx.lineTo(at.x + P / 2, at.y + h);          // bottom
    ctx.lineTo(at.x + P / 2 - w, at.y);          // left
    ctx.closePath();
    ctx.fill();
  }
}

// A hat that has been shaken off somebody: in the air on its own little arc
// while it falls, then lying where it came down until its owner comes round and
// fetches it. Drawn off its own position both ways -- it flies off the head the
// moment the shaking counts, so for the first half-second what you see is a hat
// tumbling away from a body still in your hand. Not on a stand: it was not put
// down, it came off.
export function drawDroppedHats() {
  for (const w of S.workers) {
    if (!w.hatOff || w.hatOff.x == null) continue;
    const x = Math.round(w.hatOff.x), y = Math.round(w.hatOff.y);
    // Drawn as the thing it IS, derived from whose kit it is -- `kind` used to
    // carry a boolean and everything knocked off drew as the helmet fallback,
    // so a cart lying on the ground was a little hat. A cart is the box and
    // its wheel, tumbling and lying exactly as it stands at the lip's stand;
    // everything else is its own hat shape.
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

// And the figure over it, in screen pixels like every other number in the yard:
// a count is type, and type scaled by five sixths is type with a fuzzy edge.
export function drawKitCounts(screenAt) {
  const stands = kitStands();
  if (!stands.length) return;
  ctx.font = '13px ui-monospace, "Courier New", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = '#000';
  for (const k of stands) {
    // A clear two cells over whatever is standing on the slab, whatever that is.
    // Three cells of headroom was plenty while every mark was a bar a cell or
    // two tall; the wizard's cone is three courses on its own and the number sat
    // in the tip of it. Measured off the mark rather than fixed, so the gap over
    // a helmet and the gap over a cone are the same gap.
    const at = screenAt(k.x - P + STAND_W / 2,
                        k.y - STAND_H - HAT_TALL[k.mark] - P * 2);
    ctx.fillText(String(k.n), Math.round(at.x), Math.round(at.y));
  }
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

// --- what a body on a break has to say ----------------------------------------
// Never words. The yard has no writing in it anywhere and is not about to start
// on the strength of somebody having a smoke, so a thing said is a mark: a note
// is singing, a burst is swearing, and dots are talking -- and dots going back
// and forth between two bodies facing each other is a conversation, which is a
// thing you read off the pair rather than off either of them.
//
// All of it is cells, like everything else, and all of it stands a clear cell
// above the head so it never touches the load a worker is carrying.
function drawSay(w) {
  const x = Math.round(w.x) + WORKER / 2;
  const top = Math.round(w.y) - P * 2;
  ctx.fillStyle = '#000';

  // the same heart the opening uses: a body saying it and a body in the opening
  // saying it are the same thing said, so they are the same shape
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

  // A little heap, in the colour of the stuff it is about to become. Nothing
  // else in this yard is drawn in brown, so it needs no explaining -- and it is
  // the same shape the muck makes on the ground a second later.
  // Stars. Two cells going round the head rather than a fixed pair, so a body
  // seeing them is plainly still spinning -- which is the whole of what being
  // shaken about earns you.
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

  if (w.say.mark === 'note') {
    // a head and a stem: the smallest thing that is unmistakably a note
    ctx.fillRect(Math.round(x - P), top - P, P, P);
    ctx.fillRect(Math.round(x), top - P * 2, P - 2, P + 1);
    return;
  }

  // a burst: four cells off a corner, which is the shape a swear word is in
  // every comic ever drawn
  for (const [dx, dy] of [[0, -1], [-1, 0], [1, 0], [0, 1]])
    ctx.fillRect(Math.round(x + dx * P) - P / 2, top - P + dy * P, P - 1, P - 1);
}

// Somebody you have just asked for by name. A solid arrow over the head, bobbing
// so it reads as put there rather than drawn on -- nothing else in this yard
// hangs still in the air.
const ARROW = ['11111', '01110', '00100'];

export function drawPointed() {
  const t = now();
  for (const w of S.workers) {
    if (!w.pointed || w.pointed < t) continue;
    if (underground(w) || indoors(w) || inHouse(w) || atPot(w) || atHome(w)) continue;
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
    if (!w.say || underground(w) || indoors(w) || inHouse(w) || atHome(w)) continue;
    drawSay(w);
  }
  ctx.fillStyle = '#000';
}

// --- the two of them, and the one under the rock -----------------------------
// The opening is two squares talking on the bare ground. They are drawn here
// rather than being workers, because they are not: nobody has been hired yet and
// one of them is about to stop being anybody at all.
//
// And afterwards, every time the last of a rock goes, the one underneath is
// there -- alive, on the bare ground, saying the same dots two people say to
// each other anywhere else in this yard. Then the next rock lands on them. That
// is the whole story and it is told in shapes.
// What somebody in the opening has to say, over its head. Three marks and no
// words, like everything else here: dots are talking, a heart is the other
// thing, and a bang is what you say when a boulder has just landed on somebody.
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
    // a bar and a dot under it, which is the shape of the thing everywhere
    ctx.fillRect(Math.round(mid - P / 2), top - P * 4, P, P * 3);
    ctx.fillRect(Math.round(mid - P / 2), top, P, P);
    return;
  }

  const n = say.n || 2;
  for (let i = 0; i < n; i++)
    ctx.fillRect(Math.round(mid - (n * P) / 2 + i * P), top, P - 1, P - 1);
}

// A body knocked flat. It is the same square lying down: two cells tall and
// three wide instead of the other way about, which is the least a square can do
// to say it is on its back and the most this alphabet has.
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
  drawBody(at.x, at.y);
  if (S.buriedSay) drawSaying(at.x, at.y, S.buriedSay);
}

// How each kind of body is drawn, as a row rather than as a branch.
//
// This was six branches, each repeating the same four steps in a slightly
// different order and each free to forget one of them -- which is how a hat came
// to be drawn on five kinds of body and not the sixth, and how a rockhand walking a
// shovelful of muck across the yard carried it invisibly. A body is a body: it
// stands somewhere, it may be dragging a cart, it wears whatever is on its head,
// and it is holding whatever it picked up. The only things that actually differ
// between one kind and the next are in this table.
//
//   lunge  which way a swing throws the body: down into the work for anybody on
//          the ground, up for a wizard, whose work is above it. 0 for the bodies
//          that do not swing at all.
//   lean   ...or forward instead, into the way it is facing, for a body whose
//          swing is a push rather than a stoop. A janitor plants its feet on a
//          whole cell and shovels without going anywhere, so a lunge on its y was
//          the only thing about it that moved: a square dropping a cell and
//          rising again, four times a second, on the spot -- which reads as a
//          body bobbing, not as a body working. It shoves the shovel out in
//          front of it instead, which is what the swing actually is.
//   load   how what it is carrying is drawn. A quarrier brings up one thing at a
//          time and it rides over its head as that thing; everybody else stacks
//          grains, in the cart if there is one.
const LOOK = {
  janitor:  { lunge:  0, lean: 1 },
  scholar:   { lunge:  1 },
  farmhand: { lunge:  1 },
  stirrer:  { lunge:  1, lean: 1 },   // stoops and leans toward the pot as it stirs
  quarrier: { lunge:  1, load: 'shard' },
  wizard:   { lunge: -1 },
  rockhand:    { lunge:  0 },
  hauler:   { lunge:  0 },
  // A builder at a busy site hops and lunges at the bottom of each hop -- see
  // `workJig` in crew.js -- but with no row here it fell through to `PLAIN`,
  // whose `lunge: 0` threw the lunge away regardless of what `w.lunge` said.
  // #4, "Wave 3.1": the body was hopping (a player just could not see it),
  // and this is why the one part of the hop meant to read as effort read as
  // nothing at all.
  builder:  { lunge:  1 }
};
const PLAIN = { lunge: 0 };

// How far a lean throws a body, in cells. Half of what a stoop drops it: an
// eighteen-pixel square shoved a whole cell sideways reads as a body stepping,
// not as a body reaching.
const LEAN = 0.5;

// A little flask, in cells: a corked neck over a rounded body, with the liquid
// filling the body from the bottom by `fill` (0..1). Black glass, a white line
// for the surface of what is in it -- no glow, on the grid, the yard's language.
// `x` is the left of the three-wide body; `topY` is the neck's row.
// A little vial: a black cork over glass sides with a column of coloured liquid
// between them. `color` is the tonic's own (see TONICS); `fill` is how full it
// is, the liquid rising from the foot, so a fresh dose is a full vial and a
// spent one nearly empty.
export function drawWorkers() {
  for (const w of S.workers) {
    // out of sight: in the lab, down the quarry, in the outhouse, or home. The
    // stirrer is NOT hidden -- it stands at the pot's left and stirs in plain
    // sight, so `atPot` is not a reason to skip it here (it still gates the
    // brew clock and the count in apothecary.js).
    if (underground(w) || indoors(w) || inHouse(w) || atHome(w)) continue;

    const look = LOOK[w.type] || PLAIN;
    const throwOn = w.lunge || 0;
    const x = Math.round(w.x + throwOn * (look.lean || 0) * (w.face || 1) * P * LEAN);
    const y = Math.round(w.y + throwOn * look.lunge * P);

    // A cart is kit like any other, so it is drawn off what the body is holding
    // rather than off what the books say it is. Somebody walking a cart back to
    // the lip is walking a cart back to the lip, whatever job it is on this
    // second -- the same rule a helmet has always had.
    const cart = wearing(w) === 'cart' ? cartBox(x, y, w.face || 1) : null;
    if (cart) drawCart(x, y, w.face || 1);       // behind the body it follows

    drawBody(x, y);

    // and whatever is on its head. One line, for everybody: this is the whole of
    // what "hats are always shown" means.
    const hat = wearing(w);
    if (hat && hat !== 'cart') drawHat(x, y, hat);

    // The tonic on the body reads as a haze of its own colour lifting off the
    // worker -- coloured motes rising and winking out around the head, not a vial
    // parked overhead. The haze thins as the dose wears off, so a nearly-spent
    // body gives off only a wisp and a fresh one fizzes. It is the one place a
    // worker itself carries colour, so a buffed body reads as buffed at a glance.
    // See `doseFrac`, `doseColor` in apothecary.js.
    const frac = doseFrac(w);
    if (frac > 0) {
      const t = now();
      ctx.fillStyle = doseColor(w);
      const motes = Math.max(1, Math.round(frac * 4));
      for (let m = 0; m < motes; m++) {
        const ph = (t / 620 + m * 0.37 + (Math.abs(Math.round(w.x)) % 40) / 40) % 1;
        const mx = x + WORKER / 2 + Math.round(Math.sin(t / 240 + m * 2) * 2) * P;
        const my = y - P * 2 - Math.round(ph * 5) * P;
        ctx.fillRect(Math.round(mx / P) * P, my, P, P);
      }
      ctx.fillStyle = '#000';
    }

    // A stirrer carrying a dose holds a little vial over its head, the way a
    // hauler carries dust -- the same small flask that stands on the apothecary
    // table, coloured by which tonic it is walking out, so you can see what is
    // crossing the yard. See `stepStirrer` (`w.carryTonic`).
    if (w.type === 'stirrer' && w.holding) {
      const vx = Math.round((x + WORKER / 2 - P / 2) / P) * P;
      const vy = y - P * 5;
      ctx.fillStyle = '#000';
      ctx.fillRect(vx, vy, P, P);                              // the cork
      ctx.fillStyle = tonicColor(w.carryTonic);
      ctx.fillRect(vx, vy + P, P, P * 2);                      // the coloured brew
      ctx.fillStyle = '#000';
    }

    if (!w.carry && !w.hasCore) continue;

    // What it brought up, over its head, as the thing itself.
    if (look.load === 'shard') { drawMark(SHARD_CELL, x + WORKER / 2, y - P * 2); continue; }

    // A load is drawn grain by grain as whatever each grain is, so a worker
    // walking a shard to the pit is visibly walking a shard to the pit. It
    // rides overhead, stacked two abreast -- or in the cart, four abreast,
    // if there is a cart to put it in.
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
      // A carried core is still a core: it gives off the same waves one lying
      // on the ground does, the way `drawCoreAt` draws both together. Drawn
      // straight here rather than through `drawCoreAt` because the disc riding
      // a body is a different size from the one on the ground.
      drawCoreGlow(cx, cy);
      drawCircle(cx, cy, P * 1.2);
    }
  }
}
