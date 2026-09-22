// The three machines and the hoist: the drill, the ram, the tiller, the belt,
// their run switch.

import { now } from '../clock.js';
import { BELT_RAMP, MACHINE_IDLE_MS, P, WORKER } from '../config.js';
import { beltFrom, beltReach, beltRunning, beltTo, beltY } from '../dust.js';

import { drawGrid } from './ground.js';
import { tillerAt, tillerCol, tillerWay } from '../farm.js';
import { machine } from '../machines.js';
import { jawX, jawY, rigTop, shaftX } from '../quarry.js';
import { ramX, rockFaceX, rockShare } from '../rock.js';
import { BIT, DRILL, MACHINE_MARK, RAM, TILLER, drawSprite, spriteH, spriteW } from '../sprites.js';
import { S, band } from '../state.js';
import { walkY } from '../world.js';
import { ctx } from './ctx.js';
import { drawMark } from './marks.js';

// --- the machines ---------------------------------------------------------------
// Each machine moves differently, which is what makes three black blocks read
// as three machines. No phase is stored as a position: they are read off the
// clock, so a paused game holds still and a machine that is not running
// settles rather than freezing mid-stroke. Nothing here decides *whether* a
// machine is working; it asks the record `stepMachines` reads.

// How far through its stroke, 0..1, and nought when it is not actually working:
// idle with its mouth half open reads as broken; closed reads as off.
function stroke(key, ms = 900) {
  const m = machine(key);
  if (!m || !m.bought) return 0;
  // `workedAt` is when it last got something done, not the lever: a machine
  // stood down by a full pile must not chew visibly while producing nothing.
  // Against the *moment* rather than the frame flag: a beat lands on one frame
  // in three or worse, and a stroke gated on the flag would strobe.
  if (now() - (m.workedAt || 0) > MACHINE_IDLE_MS) return 0;
  return (now() % ms) / ms;
}

// A bought machine that is not running is still there; it simply does not move.
const built = key => { const m = machine(key); return !!(m && m.bought); };

// The quarry's drill: a rig on the deck over the mouth, a shaft down the bore,
// and a bit on the end of it working the floor. The bit sits at `jawY`
// (`dugTopY` down the bore), so the shaft pays out as the cut deepens and
// comes back up when the quarry falls in.
export function drawDrill() {
  if (!S.quarryOpen || !built('jaw')) return;
  const x = Math.round(jawX() / P) * P;
  const top = rigTop();                       // stood on the bridge deck
  drawSprite(ctx, DRILL, x, top);

  // The shaft and the bit are not part of the rig's picture: how far down they
  // reach is a fact about the game.
  const shaft = Math.round(shaftX() / P) * P;
  const from = top + spriteH(DRILL) * P;

  // The plunge: it bores *at the floor*, a cell of travel on its own beat.
  const t = stroke('jaw', 900);
  const bite = Math.round(Math.abs(Math.sin(t * Math.PI)) * P);
  const bitTop = Math.max(from, Math.round(jawY() / P) * P - (spriteH(BIT) - 1) * P + bite);

  ctx.fillStyle = '#000';
  if (bitTop > from) ctx.fillRect(shaft, from, P, bitTop - from);
  // Centered on the shaft: the point of the triangle is the middle column.
  drawSprite(ctx, BIT, shaft - ((spriteW(BIT) - 1) >> 1) * P, bitTop);
  ctx.fillStyle = '#000';
}

// The ram: a squat engine outside the apron with an arm that reaches into the
// face and strikes; the only machine whose working end is somewhere other than
// where its body stands.
// The rows of the picture that are stack rather than engine, counted off the
// sprite, so the arm still comes out of the middle of the engine if the
// chimney is made taller.
const BONNET = RAM.findIndex(r => !r.includes('.'));

export function drawRam() {
  if (!built('ram')) return;
  const x = Math.round(ramX() / P) * P;
  const W = spriteW(RAM), H = spriteH(RAM);
  const y = Math.round((S.groundY - H * P) / P) * P;
  drawSprite(ctx, RAM, x, y);

  // The arm's *length* is the animation: out fast, held, drawn back slowly. At
  // rest it stands half out, so the arm is part of the machine's shape. It
  // reaches to the **face**, where the rock still is, measured rather than
  // taken from `RAM_REACH`: the face moves the instant a column empties and
  // the machine snaps to the cell grid, so the two disagree in some frames.
  const gap = Math.max(2, Math.round((rockFaceX() - (x + W * P)) / P));
  const t = stroke('ram', 900);
  const rest = Math.max(2, Math.round(gap / 2));
  const reach = t === 0 ? rest
              : t < 0.18 ? Math.round(rest + (gap - rest) * (t / 0.18))
              : t < 0.34 ? gap
              : Math.max(2, Math.round(gap - (gap - rest) * ((t - 0.34) / 0.66)));
  // Out of the middle of the body's height, so the engine can grow a row
  // without a literal to fix.
  const mid = Math.round((H - BONNET) / 2) + BONNET;      // the body's middle row
  ctx.fillStyle = '#000';
  ctx.fillRect(x + W * P, y + (mid - 1) * P, P * reach, P * 2);
  ctx.fillRect(x + W * P + (reach - 1) * P, y + (mid - 2) * P, P * 2, P * 4);   // the head

  // How far through this boulder it is: the hill is the one workplace whose
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

// The tiller: a tractor, the only machine that travels. Its x is derived from
// the plot it is working. The ground line is where a body's feet are: `walkY`
// is the top of a body standing there, not the surface under it.

export function drawTiller() {
  if (!S.farmOpen || !built('tiller')) return;
  // Whole pixels, not whole cells: snapped to the lattice it hops along the
  // row while the body riding it slides, and the driver spends most of every
  // step beside the seat.
  const x = Math.round(tillerAt());
  const g = Math.round((walkY(x + WORKER / 2) + WORKER) / P) * P;
  // Facing where it is going; `flip` is the same mirror a body gets.
  const back = tillerWay() < 0;
  drawSprite(ctx, TILLER, x, g - spriteH(TILLER) * P, { flip: back });

  // The spokes turning: two cells moving round the wheels the picture has.
  const t = stroke('tiller', 700);
  // Turning the way it is traveling, or the wheels drive it the other way.
  const a = t * Math.PI * 2 * (back ? -1 : 1);
  const y0 = g - spriteH(TILLER) * P;
  // The hubs, off the picture: the middle of each white ring, mirrored with
  // the picture so they stay inside the tires when it turns round.
  for (const [wx, wy, r] of [[x + tillerCol(3) * P, y0 + P * 5, 1],
                             [x + tillerCol(8) * P, y0 + P * 5, 0]]) {
    ctx.fillStyle = '#fff';
    ctx.fillRect(Math.round((wx + Math.cos(a) * r * P) / P) * P,
                 Math.round((wy + Math.sin(a) * r * P) / P) * P, P, P);
  }
  ctx.fillStyle = '#000';
}

// The belt: a run of trestles from the rock to the lip with a band over them,
// and the band moves. The only machine that is long rather than tall: a road.
export function drawBelt() {
  if (!built('belt')) return;
  const from = beltFrom(), to = beltTo(), y = beltY();
  ctx.fillStyle = '#000';
  ctx.fillRect(from, y, to - from, P);                   // the band
  // The ramp at the head the load is flicked off: a cell up for a cell out,
  // the slope `tipOff` throws at, filled underneath so it reads as a wedge.
  for (let i = 0; i < BELT_RAMP; i++) ctx.fillRect(to + i * P, y - i * P, P, (i + 1) * P);
  // The legs, only as far as there is ground to stand on: the head overhangs
  // the mouth of the hole.
  for (let x = from; x < beltReach(); x += P * 8) {
    ctx.fillRect(x, y + P, P, S.groundY - y - P);
  }
  // The band's own marks, running. This is the *band* moving; the load is
  // drawn below, as grains. Not `stroke`: that reads `workedAt`, which is
  // stamped by *bites*, and the belt hardly bites once spoil lands on the band
  // straight off the shovel, so the marks would stand still under moving
  // loads. The band runs whenever it is manned and on, the gate `stepBelt`
  // keeps.
  const t = beltRunning(now()) ? (now() % 900) / 900 : 0;
  ctx.fillStyle = '#fff';
  for (let x = from + Math.round(t * 4) * P; x < to; x += P * 4) {
    ctx.fillRect(x, y, P, P);
  }
  ctx.fillStyle = '#000';
  // What is riding it: ground, through its own painter like the yard's. And
  // what the scoop is lifting to it, each a grain drawn as whatever it is --
  // the same call a chip in the air gets, because it is the same grain.
  if (band.grid && band.n) drawGrid(band);
  for (const b of S.belt) drawMark(b.s, Math.round(b.x) + P / 2, Math.round(b.y) + P / 2);
  ctx.fillStyle = '#000';
}

// What is working this station, drawn on the roster under the headcount: the
// machine's own mark, and nothing else. A **label, not a control**: the
// question "is this station worked by the hands or by the machine" is answered
// by whether anybody is standing at it, and the count directly above is how
// many bodies are there, so the way to stop a machine is the `-` button that
// stops every other station. The mark must be the *same machine* as the one
// standing in the yard, feature for feature (MACHINE_MARK).
export function drawRunSwitch(box, key) {
  const mark = MACHINE_MARK[key];
  if (!mark) return;
  const w = spriteW(mark), h = spriteH(mark);
  // Centered on the strip, standing on its bottom line.
  const x = box.x + Math.round((box.w / P - w) / 2) * P;
  const y = box.y + box.h - h * P;

  // A cell of clear air behind it, for the rosters with a pile or a wall
  // behind them, where the mark would be black on black.
  ctx.fillStyle = '#fff';
  ctx.fillRect(x - P, y - P, (w + 2) * P, (h + 2) * P);
  drawSprite(ctx, mark, x, y);
  ctx.fillStyle = '#000';
}

