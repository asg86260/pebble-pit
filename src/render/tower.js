// The outhouse and the wizard's tower, and the tower's pour and hat readouts.
// Extracted verbatim from render.js; behavior unchanged. Owns drawOuthouse,
// drawTower, drawTowerWaves, drawTowerBar and towerBarAt. The shared primitives
// (ctx, drawHat, withRise, risingPlace) come from render.js, the core module.

import { now } from '../clock.js';
import { DOOR_H, DOOR_W, MAGIC_TONES, P, TOWER_SHAFT, TOWER_WAVE_MS, TOWER_WAVE_N, TOWER_WAVE_R, WORKER } from '../config.js';
import { S, floor, outhouse, tower } from '../state.js';
import { brewAt, brewing } from '../tower.js';
import { ctx, drawHat, risingPlace, withRise } from '../render.js';

// The tower. The one building in this yard that goes up rather than along: a
// narrow shaft, a band of stone every few courses so it reads as built rather
// than extruded, and a lit window near the top that is the only light in the
// yard nobody walks to. Everything else out here is a shed or a hole.
// The outhouse. The smallest thing anybody builds here, and the only one whose
// whole job is somewhere to be for a minute: a black shed with a pitched roof, a
// door cut white out of it, and the moon over the door that every outhouse ever
// drawn has had.
//
// The moon goes solid once the tower has seen to it. That is the only sign the
// magic is working -- what it does is make a thing not happen, and there is no
// way to draw an absence except by marking the place it would have been.
export function drawOuthouse() {
  const rising = risingPlace() === 'outhouse';
  if (!S.outhouseOpen && !rising) return;
  const { x, y, w, h } = outhouse;
  withRise(rising, x, S.groundY, w, h, () => {
    const c = n => x + P * n;
    const r = n => y + P * n;
    const WIDE = Math.round(w / P);              // 7 across
    const TALL = Math.round(h / P);              // 10 down
    const MID = (WIDE - 1) / 2;                  // the middle column: 3 of 0..6
    const ROOF = 4;

    // A pitched roof, built out of odd courses about the middle column: three,
    // five, seven and then nine, the last of them overhanging a cell each side the
    // way eaves do.
    //
    // Every one of those is odd and centred on a whole column, which is the whole
    // fix: it was a share of the width rounded per course, and 7/2 is 3.5 -- so
    // both edges of a course rounded the same way and the roof came out a cell
    // wider on the right than on the left. A symmetrical thing has to be built
    // out of symmetrical numbers, not rounded into symmetry afterwards.
    ctx.fillStyle = '#000';
    for (let i = 0; i < ROOF; i++) {
      const half = i + 1;                        // 1, 2, 3, 4 -> 3, 5, 7, 9 wide
      ctx.fillRect(c(MID - half), r(i), P * (half * 2 + 1), P);
    }
    ctx.fillRect(x, r(ROOF), w, h - P * ROOF);

    // The way in: three cells wide on a seven-cell front, so it stands on whole
    // columns with two of wall either side of it. It was two cells wide starting
    // at a *half* column -- the one door in the yard drawn off the lattice, with
    // the grey fringe down both jambs that comes with it.
    const DOOR = 3;
    ctx.fillStyle = '#fff';
    ctx.fillRect(c(MID - (DOOR - 1) / 2), r(TALL - 5), P * DOOR, P * 5);

    // and the moon cut in the door, three by three about the same column, which is
    // what says shed rather than shack.
    const my = r(ROOF + 1);
    ctx.fillRect(c(MID), my, P * 2, P);
    ctx.fillRect(c(MID - 1), my + P, P, P);
    ctx.fillRect(c(MID), my + P * 2, P * 2, P);
    ctx.fillStyle = '#000';
  });
}

// The tower. Everything the crew put up is a shed or a hole; this is neither, so
// it is the one thing here with a roof that comes to a point -- and a smaller one
// beside it doing the same, because two pointed roofs at different heights is
// what a tower reads as and one is just a spike.
//
// Drawn the way every other building here is drawn: a solid black silhouette
// with the openings cut white out of it. It is the shape that carries a building
// in this game, not the outline -- the school is a black block with a belfry, the
// scrubbing house is a black block with a chute, and a tower is a black shaft
// with a hat on.
export function drawTower() {
  const rising = risingPlace() === 'tower';
  if (!S.towerOpen && !rising) return;
  const { x, y, w, h } = tower;
  withRise(rising, x, S.groundY, w, h, () => {
    const c = n => x + P * n;                    // cell n across the front
    const r = n => y + P * n;                    // and n down from the top
    const WIDE = Math.round(w / P);              // 13 across
    const TALL = Math.round(h / P);              // 34 down
    const SHAFT = TOWER_SHAFT;                   // the main shaft, on the left
    const TUR = WIDE - SHAFT;                    // and the little one beside it
    const SPIRE = 7;                             // rows of roof on the main
    const TUR_ROOF = 4;                          // on the turret
    const TUR_TOP = 14;                          // how far down the turret starts

    // A roof that comes to a point, drawn the only way a point can be drawn in
    // cells: a stack of rows each a little wider than the last.
    const spire = (cx, cw, top, rows) => {
      const mid = cx + cw / 2;
      for (let i = 0; i < rows; i++) {
        const half = ((i + 1) / rows) * (cw / 2);
        const from = Math.round(mid - half), to = Math.round(mid + half);
        ctx.fillRect(c(from), r(top + i), P * Math.max(1, to - from), P);
      }
    };

    ctx.fillStyle = '#000';
    spire(0, SHAFT, 0, SPIRE);                             // the hat
    ctx.fillRect(x, r(SPIRE), P * SHAFT, P * (TALL - SPIRE));   // the shaft
    spire(SHAFT, TUR, TUR_TOP, TUR_ROOF);                  // the little hat
    ctx.fillRect(c(SHAFT), r(TUR_TOP + TUR_ROOF), P * TUR, P * (TALL - TUR_TOP - TUR_ROOF));

    // A weather vane over the point: one cell up, and one across it. The flick of
    // the hat that says somebody lives here on purpose.
    ctx.fillRect(c(SHAFT / 2) - P / 2, r(-2), P, P * 2);
    ctx.fillRect(c(SHAFT / 2) - P * 1.5, r(-3), P * 3, P);

    // The openings, cut white out of it. Tall and narrow like the school's, and
    // stacked up the shaft rather than in a row: a tower is read by how far up its
    // windows go.
    ctx.fillStyle = '#fff';
    for (const n of [SPIRE + 3, SPIRE + 9, SPIRE + 15])
      ctx.fillRect(c(3), r(n), P * 2, P * 3);
    ctx.fillRect(c(SHAFT + 1), r(TUR_TOP + TUR_ROOF + 3), P * 2, P * 2);
    // a slit in the spire, the way the school's belfry rings out of one
    ctx.fillRect(c(SHAFT / 2) - P / 2, r(SPIRE - 3), P, P * 2);
    // and the way in, the same door every other building has
    ctx.fillRect(c(SHAFT / 2 - DOOR_W / 2), y + h - P * DOOR_H, P * DOOR_W, P * DOOR_H);

    ctx.fillStyle = '#000';
  });
}

// What the tower does while it is making a hat: rings of light going out from
// the point of it, one after another, in the wizards' own purple.
//
// It was the windows blinking out one at a time up the shaft, which is a lamp
// being switched rather than a spell being cast -- and a building that says it
// is working by *stopping* saying something is a building arguing with itself.
// This is the same shape the star's corona is: cells on a ring, going out.
//
// Drawn after the tower rather than on it, so the rings pass over the stone the
// way light would.
export function drawTowerWaves() {
  if (!S.towerOpen) return;
  // Always something coming off it, and more of it while it is working.
  //
  // A tower that was blank until you bought a hat was a building that did
  // nothing for most of the game -- and this is the one building in the yard
  // that is *magic*, standing among sheds that are honestly made of planks. It
  // should be plainly doing something at rest. So the rings never stop: they go
  // out slower, thinner and shorter when the bench is idle, and the fast bright
  // ones are what the brewing looks like on top of that.
  const work = brewing();
  const pace = work ? TOWER_WAVE_MS : TOWER_WAVE_MS * 2.6;
  const reach = work ? TOWER_WAVE_R : TOWER_WAVE_R * 0.55;
  const ink = work ? 0.85 : 0.3;
  // On the vane, which is the top of the thing and the only part of it that is
  // not stone: rings coming off the middle of the spire's *base* were rings
  // coming off the roof, a couple of cells low and reading as slightly slipped.
  const from = { x: tower.x + P * 4, y: tower.y - P * 2 };
  for (let i = 0; i < TOWER_WAVE_N; i++) {
    const k = ((now() / pace) + i / TOWER_WAVE_N) % 1;
    const rad = k * reach;
    if (rad < P) continue;
    // fainter as it goes out, and deeper down the purples with it: a ring that
    // held its colour all the way would read as a hoop rather than as something
    // spending itself on the air
    ctx.globalAlpha = (1 - k) * ink;
    ctx.fillStyle = MAGIC_TONES[Math.min(MAGIC_TONES.length - 1, Math.floor(k * 3))];
    // a cell every cell round the circumference, so it is a ring rather than a
    // dotted line pretending to be one
    const n = Math.max(10, Math.round((Math.PI * 2 * rad) / P));
    ctx.beginPath();
    for (let j = 0; j < n; j++) {
      const a = (j / n) * Math.PI * 2;
      cell(from.x + Math.cos(a) * rad, from.y + Math.sin(a) * rad);
    }
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#000';
}

// How far along the hat is, over the tower: the same bar the lab gets, in the
// same place over the building doing the work, filling a cell at a time.
//
// The board says the same thing in words, and that is not enough on its own: a
// number you have to walk across the yard and open a menu to see is a number you
// check once and forget is running. This is the two minutes made visible from
// wherever you happen to be standing.
export function drawTowerBar() {
  if (!S.towerOpen || !brewing()) return;
  const at = towerBarAt();
  const w = P * 14, h = P * 3;
  const x = at.x - w / 2, y = at.y - h / 2;

  ctx.fillStyle = '#fff';
  ctx.fillRect(x, y, w, h);
  ctx.lineWidth = Math.max(1, P / 3);
  ctx.strokeStyle = '#000';
  ctx.strokeRect(x, y, w, h);

  ctx.fillStyle = '#000';
  const room = w - P * 2;
  const done = Math.round(room * brewAt() / P) * P;
  if (done > 0) ctx.fillRect(x + P, y + P, done, h - P * 2);

  // and the hat it is making, over the bar, so the bar is about something
  drawHat(at.x - WORKER / 2, y - P * 2, 'point', true);
}

// Clear of the weather vane over the point, which is three cells up from the
// roof: a bar drawn through it would be two marks in one place.
// Over the spire, not over the building. The turret off the right-hand side is
// two and a half cells of the tower's width, so the middle of the whole thing
// sits well to the right of the point -- and a bar about the hat being made
// under that roof belongs over that roof.
export function towerBarAt() {
  return { x: Math.round((tower.x + P * TOWER_SHAFT / 2) / P) * P,
           y: Math.round((tower.y - P * 8) / P) * P };
}
