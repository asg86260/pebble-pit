// The three machines and the hoist: the drill, the ram, the tiller, the belt,
// their run switch and their smoke. Extracted verbatim from render.js; behavior
// unchanged. Owns stroke, drawDrill, drawRam, drawTiller, drawBelt,
// drawRunSwitch and stepMachineSmoke. The shared primitives come from this
// folder's own leaves: ctx from ./ctx.js, drawMark from ./marks.js.

import { now } from '../clock.js';
import { MACHINE_IDLE_MS, MACHINE_PUFF_LIFE, MACHINE_PUFF_MS, MACHINE_PUFF_RISE, MACHINE_PUFF_S, P, WORKER } from '../config.js';
import { beltFrom, beltReach, beltRunning, beltTo, beltY } from '../dust.js';
import { tillerAt, tillerWay } from '../farm.js';
import { MACHINES, machine, specOf } from '../machines.js';
import { pitRefuses } from '../pit.js';
import { puff } from '../puff.js';
import { jawX, jawY, rigTop, shaftX } from '../quarry.js';
import { rand } from '../rng.js';
import { ramX, rockFaceX, rockShare } from '../rock.js';
import { BIT, DRILL, MACHINE_MARK, RAM, TILLER, drawSprite, spriteH, spriteW } from '../sprites.js';
import { S } from '../state.js';
import { walkY } from '../world.js';
import { ctx } from './ctx.js';
import { drawMark } from './marks.js';

// --- the machines ---------------------------------------------------------------
// Three machines and a hoist, drawn the way everything else in this yard is
// drawn: a solid black shape with a few white holes knocked in it, laid out in
// whole cells off a snapped corner.
//
// Each one moves, and each one moves *differently*, because that is what makes
// three black blocks read as three different machines from across the yard. The
// jaw opens and shuts. The hoist's skip rides up and down its rope. The ram's
// piston strikes and draws back. The tiller crawls the row. None of those phases
// is stored on the machine as a position -- they are read off the clock, so a
// paused game holds still and a machine that is not running settles rather than
// freezing mid-stroke.
//
// Nothing here decides *whether* a machine is working. It asks the record, and
// the record is the same one `stepMachines` reads.

// How far through its stroke, 0..1, and nought when it is not actually working.
// A machine standing idle with its mouth half open reads as broken; one that
// closes and stays closed reads as off, which is what it is.
function stroke(key, ms = 900) {
  const m = machine(key);
  if (!m || !m.bought) return 0;
  // And not while it is standing idle. `on` is the lever; `workedAt` is when it
  // last actually got something done. A machine with nobody at it, or one stood
  // down by a full pile, kept chewing away visibly while producing nothing --
  // the drawing claiming exactly what the yard denies.
  //
  // Against the *moment* rather than the frame flag: a beat lands on one frame
  // in three or worse, and a stroke gated on the flag itself would strobe.
  if (now() - (m.workedAt || 0) > MACHINE_IDLE_MS) return 0;
  return (now() % ms) / ms;
}

// A machine that has been bought but is not running is still *there* -- it is a
// large object somebody paid for. It is drawn the same and simply does not move.
const built = key => { const m = machine(key); return !!(m && m.bought); };

// The quarry's drill: a rig on the deck over the mouth, a shaft down the bore,
// and a triangular bit on the end of it working the floor.
//
// The rig stands on the bridge deck and does not move. What moves is the bit and
// the length of the shaft carrying it, and both are derived: the bit sits at
// `jawY`, which is `dugTopY` down the bore, so as the cut is taken deeper the
// shaft pays out after it, and when the quarry falls in behind the last body out
// the bit comes back up with the ground.
export function drawDrill() {
  if (!S.quarryOpen || !built('jaw')) return;
  const x = Math.round(jawX() / P) * P;
  const top = rigTop();                       // stood on the bridge deck
  drawSprite(ctx, DRILL, x, top);

  // The shaft and the bit. Neither is part of the rig's picture, because how far
  // down they reach is a fact about the game rather than about the shape.
  const shaft = Math.round(shaftX() / P) * P;
  const from = top + spriteH(DRILL) * P;

  // The plunge. It bores *at the floor*, a cell of travel on its own beat -- the
  // skip this replaces rode the whole depth of the hole, and a cutting head at
  // the top of its own bore is a drill doing nothing.
  const t = stroke('jaw', 900);
  const bite = Math.round(Math.abs(Math.sin(t * Math.PI)) * P);
  const bitTop = Math.max(from, Math.round(jawY() / P) * P - (spriteH(BIT) - 1) * P + bite);

  ctx.fillStyle = '#000';
  if (bitTop > from) ctx.fillRect(shaft, from, P, bitTop - from);
  // Centred on the shaft: the point of the triangle is the middle column of it.
  drawSprite(ctx, BIT, shaft - ((spriteW(BIT) - 1) >> 1) * P, bitTop);
  ctx.fillStyle = '#000';
}

// The ram: a squat engine outside the apron with an arm that reaches into the
// face and strikes. One white slot for the piston, and the arm is the thing that
// moves -- it is the only machine whose working end is somewhere other than
// where its body stands, which is the whole of why it can be there at all.
// How many rows of the ram's picture are stack rather than engine -- the rows
// above the solid body, counted off the sprite, so the arm still comes out of
// the middle of the engine if the chimney is ever made taller.
const BONNET = RAM.findIndex(r => !r.includes('.'));

export function drawRam() {
  if (!built('ram')) return;
  const x = Math.round(ramX() / P) * P;
  const W = spriteW(RAM), H = spriteH(RAM);
  const y = Math.round((S.groundY - H * P) / P) * P;
  drawSprite(ctx, RAM, x, y);

  // The arm, whose *length* is the animation -- so it is drawn rather than
  // pictured. Out fast, held, then drawn back slowly, which is what a ram does
  // and what makes the hit read as a hit rather than as a slider going to and
  // fro. At rest it stands half out, so the arm is part of the machine's shape
  // instead of something that only exists while you happen to be watching.
  // How far it has to reach: to the **face**, which is where the rock actually
  // still is, not to `rockLeft()`, which is where the grid begins and does not
  // move. Measured rather than taken from `RAM_REACH` so the arm still lands on
  // the stone in the frames where the two disagree -- the face moves the instant
  // a column empties, and the machine snaps to the cell grid.
  const gap = Math.max(2, Math.round((rockFaceX() - (x + W * P)) / P));
  const t = stroke('ram', 900);
  const rest = Math.max(2, Math.round(gap / 2));
  const reach = t === 0 ? rest
              : t < 0.18 ? Math.round(rest + (gap - rest) * (t / 0.18))
              : t < 0.34 ? gap
              : Math.max(2, Math.round(gap - (gap - rest) * ((t - 0.34) / 0.66)));
  // Out of the middle of the body's height, not off a row counted from its top:
  // the arm is the machine's *centre line*, and a literal there is a literal to
  // fix by hand every time the engine grows a row.
  const mid = Math.round((H - BONNET) / 2) + BONNET;      // the body's middle row
  ctx.fillStyle = '#000';
  ctx.fillRect(x + W * P, y + (mid - 1) * P, P * reach, P * 2);
  ctx.fillRect(x + W * P + (reach - 1) * P, y + (mid - 2) * P, P * 2, P * 4);   // the head

  // How far through this boulder it is. The hill is the one workplace whose
  // progress has no shape you can read from beside the machine.
  const share = rockShare();
  if (share > 0) {
    const wide = Math.max(1, Math.round((W - 2) * share));
    const bar = y + (H - 2) * P;                          // the last row inside the body
    ctx.fillStyle = '#fff';
    ctx.fillRect(x + P, bar, (W - 2) * P, P);
    ctx.fillStyle = '#000';
    ctx.fillRect(x + P, bar, wide * P, P);
  }
}

// The tiller: a low frame that crawls the plot line and turns the ground behind
// it. The only machine that travels, which is what makes it read as a different
// kind of thing at a glance. Its x is derived from the plot it is working, so it
// is where the work is by construction.
// The tiller: a tractor, and it should look like one from across the yard.
//
// It was a three-by-two box with a chimney, which is the same shape as every
// other machine here and says nothing. A tractor has a silhouette everybody
// already knows -- a big wheel at the back, a small one at the front, a bonnet
// sloping down between them and somebody sitting up over the back axle -- and
// that silhouette is worth more than any amount of detail.
//
// The ground line is where a body's feet are: `walkY` is the top of a body
// standing there, not the surface under it.
// A column of the tractor's picture, in cells off its left edge, mirrored when
// it is facing the other way. One place that knows how the flip works, so the
// wheels, the seat and the chimney cannot disagree with the sprite about which
// end is the front.
const tCol = c => tillerWay() < 0 ? spriteW(TILLER) - 1 - c : c;

export function drawTiller() {
  if (!S.farmOpen || !built('tiller')) return;
  // Whole pixels, not whole cells. The tractor *crosses the farm*, and snapped
  // to the six-pixel lattice it went along the row in hops while the body riding
  // it slid -- so the driver spent most of every step beside the seat rather
  // than in it. Everything that moves in this yard moves in pixels; the cell
  // grid is what things are *made of*, not what they travel on.
  const x = Math.round(tillerAt());
  const g = Math.round((walkY(x + WORKER / 2) + WORKER) / P) * P;
  // Facing where it is going, like everything else that walks in this yard. It
  // is the only machine that travels, and it was the one thing that travelled
  // backwards half the time -- bonnet trailing, exhaust at the wrong end, driver
  // riding the front axle up the row. `flip` is the same mirror a body gets.
  const back = tillerWay() < 0;
  drawSprite(ctx, TILLER, x, g - spriteH(TILLER) * P, { flip: back });

  // The spokes turning. Two cells, moving round the wheels the picture already
  // has -- which at this size is the whole of what a turning wheel looks like.
  const t = stroke('tiller', 700);
  // Turning the way it is travelling, or the wheels drive it the other way.
  const a = t * Math.PI * 2 * (back ? -1 : 1);
  const y0 = g - spriteH(TILLER) * P;
  // The hubs, off the picture: the middle of each white ring, so a redrawn
  // tractor turns its own wheels rather than the ones the old one had -- and
  // mirrored with the picture, so they stay inside the tyres when it turns round.
  for (const [wx, wy, r] of [[x + tCol(3) * P, y0 + P * 5, 1],
                             [x + tCol(8) * P, y0 + P * 5, 0]]) {
    ctx.fillStyle = '#fff';
    ctx.fillRect(Math.round((wx + Math.cos(a) * r * P) / P) * P,
                 Math.round((wy + Math.sin(a) * r * P) / P) * P, P, P);
  }
  ctx.fillStyle = '#000';
}

// The belt: a run of trestles from the rock to the lip with a band over them, and
// the band moves. It is the only machine that is *long* rather than tall, which
// is what makes it read as a different kind of thing at a glance -- the other
// three are engines standing at a face, and this is a road.
export function drawBelt() {
  if (!built('belt')) return;
  const from = beltFrom(), to = beltTo(), y = beltY();
  ctx.fillStyle = '#000';
  ctx.fillRect(from, y, to - from, P);                   // the band
  // And what holds it up -- only as far as there is ground to stand on. The head
  // overhangs the mouth of the hole, so a leg out there would be a leg planted
  // in mid-air over a hundred feet of nothing.
  for (let x = from; x < beltReach(); x += P * 8) {
    ctx.fillRect(x, y + P, P, S.groundY - y - P);
  }
  // The band's own marks: white cut out of it, a few cells apart, running. This
  // is the *band* moving and nothing else -- it used to stand in for the load as
  // well, back when the load was thrown over the top of it in one arc and never
  // touched it. What is actually being carried is drawn below, as grains.
  //
  // Not `stroke`: that reads `workedAt`, which is stamped by *bites*, and the
  // belt has hardly bitten since the rock's spoil started landing on the band
  // straight off the shovel -- so the marks stood still under moving loads.
  // The band runs whenever it is manned, on, and has somewhere to put things
  // down, which is exactly the gate `stepBelt` keeps.
  const t = beltRunning(now()) && !pitRefuses() ? (now() % 900) / 900 : 0;
  ctx.fillStyle = '#fff';
  for (let x = from + Math.round(t * 4) * P; x < to; x += P * 4) {
    ctx.fillRect(x, y, P, P);
  }
  ctx.fillStyle = '#000';
  // What is riding it: each load a grain, drawn as whatever it is, sitting on
  // the band. Same call a chip in the air gets, because it is the same grain --
  // it was one a moment ago and it will be one again off the head.
  for (const b of S.belt) drawMark(b.s, Math.round(b.x) + P / 2, Math.round(b.y) + P / 2);
  ctx.fillStyle = '#000';
}

// The machine's switch, drawn on the roster under the headcount.
//
// It is a **lever**, and after a checkbox and a slide switch that is the one it
// should always have been -- because a lever is the thing the yard already says
// it is. Nothing here happens without hands: you throw it, and somebody walks
// over and does it. Every other drawing was an abstraction of a mechanism the
// game was at pains to keep concrete.
//
// A pivot, a rod, a ball on the end. It leans **towards** the machine's mark
// when the machine is working the station and away from it when the hands are,
// so which way is which needs no telling: the lever points at what is doing the
// work.
//
// **Two positions, and no third.** It shows what you have *asked* for. Throwing
// it is a request that takes a walk to answer, but that is the yard's business
// and not the switch's -- a control that sat at half-cock until somebody arrived
// was a control reporting on the crew rather than on itself, and it made a
// yes-or-no question look like it had three answers.
//
// What went before, so it is not tried again. A checkbox is a question and its
// answer in one square with the question written nowhere, and which of ticked
// and clear means *on* is a convention somebody has to be told. The slide switch
// that replaced it was drawn inside out -- a black knob riding a white slot cut
// into a black plate, so the knob had no contrast against the thing it slid in
// and the only part that visibly moved was the white gap. It read as a meter,
// and worse, as *this station's own meter*: a white bar inside a black body is
// exactly how the ram draws how far through the boulder it is.
// What is working this station, drawn on the roster under the headcount: the
// machine's own mark, and nothing else.
//
// It is a **label, not a control**, and getting to that took three goes at a
// control that should never have existed. A checkbox, which is a question and
// its answer in one square with the question written nowhere. Then a slide
// switch, drawn inside out -- a black knob riding a white slot cut into a black
// plate, so the only part that visibly moved was the gap, and the whole thing
// read as a meter. Then a lever, which was at least honest about the mechanism.
//
// All three were answering "is this station worked by the hands or by the
// machine", and the yard had a better answer to that all along: **is anybody
// standing at it.** A machine with nobody at it produces nothing and smokes
// nothing, and the count directly above this mark is how many bodies are there.
// So the way to stop a machine is the `-` button that stops every other station,
// and the picture underneath is simply what those hands are working.
//
// Which leaves the mark one job, and the rule for it is that it must be the
// *same machine* as the one standing in the yard -- the same silhouette, feature
// for feature. See MACHINE_MARK.
export function drawRunSwitch(box, key) {
  const mark = MACHINE_MARK[key];
  if (!mark) return;
  const w = spriteW(mark), h = spriteH(mark);
  // Centred on the strip, standing on its bottom line, so it sits under the
  // count rather than off to one side of it.
  const x = box.x + Math.round((box.w / P - w) / 2) * P;
  const y = box.y + box.h - h * P;

  // A cell of clear air behind it. Most rosters stand on bare white ground and
  // this paints nothing anyone can see; the ones that do not -- a mark with a
  // pile or a wall behind it -- would otherwise be black drawn on black, which
  // is no drawing at all.
  ctx.fillStyle = '#fff';
  ctx.fillRect(x - P, y - P, (w + 2) * P, (h + 2) * P);
  drawSprite(ctx, mark, x, y);
  ctx.fillStyle = '#000';
}

// A puff off a machine's stack. It is the same smoke the lab's chimney makes and
// the same list, flagged `mach` so that the lab's own count -- which means
// something specific, that research is being worked on -- is not muddled by it.
//
// Only a machine that is actually running smokes, and `stepMachines` is what
// decides that. A stack puffing over an idle machine would be the drawing
// claiming something the yard denies.
// A puff off a machine's stack. It is the same smoke the lab's chimney makes and
// the same list, flagged `mach` so that the lab's own count -- which means
// something specific, that research is being worked on -- is not muddled by it.
//
// Only a machine that is actually running smokes, and `stepMachines` is what
// decides that. A stack puffing over an idle machine would be the drawing
// claiming something the yard denies.
//
// Where each stack is, is the station's own business and is registered with the
// machine -- see `defineMachine`. This used to be a table here, which meant the
// drawing had one opinion about where the chimney was and `stepMachines` had
// another about where the dirt went up, and the two disagreed for as long as
// nobody put them side by side.

export function stepMachineSmoke(now) {
  for (const m0 of MACHINES) {
    const key = m0.key;
    const m = machine(key);
    if (!m || !m.bought) continue;
    if (now - (m.workedAt || 0) > MACHINE_IDLE_MS) continue;   // idle, unmanned, or stood down
    if (now < (m.puffAt || 0)) continue;
    m.puffAt = now + MACHINE_PUFF_MS * (0.6 + rand() * 0.8);
    const spec = specOf(key);
    if (!spec || !spec.stack) continue;
    const at = spec.stack();
    puff(at.x, at.y, { s: MACHINE_PUFF_S, n: 4, flag: 'mach',
                       rise: MACHINE_PUFF_RISE, life: MACHINE_PUFF_LIFE });
  }
}
