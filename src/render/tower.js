// The outhouse and the wizard's tower, and the tower's pour readout.

import { now } from '../clock.js';
import { DOOR_H, DOOR_W, MAGIC_TONES, P, TOWER_SHAFT, TOWER_WAVE_MS, TOWER_WAVE_N, TOWER_WAVE_R } from '../config.js';
import { S, floor, outhouse, tower } from '../state.js';
import { brewing } from '../tower.js';
import { ctx } from './ctx.js';
import { cell } from './marks.js';
import { rising as risingAt, withRise } from './rise.js';

// The outhouse: a black shed with a pitched roof, a door cut white out of it,
// and the moon over the door. The moon goes solid once the tower has seen to
// it: what the magic does is make a thing not happen, and there is no way to
// draw an absence except by marking the place it would have been.
export function drawOuthouse() {
  const rising = risingAt('outhouse') && 'outhouse';
  if (!S.outhouseOpen && !rising) return;
  const { x, y, w, h } = outhouse;
  withRise(rising, x, S.groundY, w, h, () => {
    const c = n => x + P * n;
    const r = n => y + P * n;
    const WIDE = Math.round(w / P);              // 7 across
    const TALL = Math.round(h / P);              // 10 down
    const MID = (WIDE - 1) / 2;                  // the middle column: 3 of 0..6
    const ROOF = 4;

    // A pitched roof built out of odd courses about the middle column, the
    // last overhanging a cell each side. A symmetrical thing has to be built
    // out of symmetrical numbers: a share of the width rounded per course
    // comes out a cell wider on one side.
    ctx.fillStyle = '#000';
    for (let i = 0; i < ROOF; i++) {
      const half = i + 1;                        // 1, 2, 3, 4 -> 3, 5, 7, 9 wide
      ctx.fillRect(c(MID - half), r(i), P * (half * 2 + 1), P);
    }
    ctx.fillRect(x, r(ROOF), w, h - P * ROOF);

    // The way in: three cells on a seven-cell front, so it stands on whole
    // columns with two of wall either side.
    const DOOR = 3;
    ctx.fillStyle = '#fff';
    ctx.fillRect(c(MID - (DOOR - 1) / 2), r(TALL - 5), P * DOOR, P * 5);

    // and the moon cut in the door, about the same column, which is what says
    // shed rather than shack
    const my = r(ROOF + 1);
    ctx.fillRect(c(MID), my, P * 2, P);
    ctx.fillRect(c(MID - 1), my + P, P, P);
    ctx.fillRect(c(MID), my + P * 2, P * 2, P);
    ctx.fillStyle = '#000';

    // The broom, two cells clear of the wall: a wide flat head and a thin tall
    // handle. Clear rather than leaning, because two shapes that touch are one
    // shape at this size. On the far side from the cap stand.
    const head = c(WIDE + 2);
    ctx.fillRect(head, r(TALL) - P * 2, P * 3, P * 2);       // the bristles, on the ground
    ctx.fillRect(head + P, r(TALL) - P * 6, P, P * 4);       // and the handle out of them
  });
}

// The tower: the one thing here with a roof that comes to a point, and a
// smaller one beside it doing the same, because two pointed roofs at
// different heights is what a tower reads as and one is a spike. A solid
// black silhouette with the openings cut white out of it, like every building.
export function drawTower() {
  const rising = risingAt('tower') && 'tower';
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

    // A point, drawn the only way a point can be in cells: a stack of rows each
    // a little wider than the last.
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

    // A weather vane over the point: one cell up, and one across it.
    ctx.fillRect(c(SHAFT / 2) - P / 2, r(-2), P, P * 2);
    ctx.fillRect(c(SHAFT / 2) - P * 1.5, r(-3), P * 3, P);

    // The openings, tall and narrow, stacked up the shaft: a tower is read by
    // how far up its windows go.
    ctx.fillStyle = '#fff';
    for (const n of [SPIRE + 3, SPIRE + 9, SPIRE + 15])
      ctx.fillRect(c(3), r(n), P * 2, P * 3);
    ctx.fillRect(c(SHAFT + 1), r(TUR_TOP + TUR_ROOF + 3), P * 2, P * 2);
    // a slit in the spire
    ctx.fillRect(c(SHAFT / 2) - P / 2, r(SPIRE - 3), P, P * 2);
    // and the way in, the same door every other building has
    ctx.fillRect(c(SHAFT / 2 - DOOR_W / 2), y + h - P * DOOR_H, P * DOOR_W, P * DOOR_H);

    ctx.fillStyle = '#000';
  });
}

// What the tower does while it is making a hat: rings of light going out from
// the point of it, in the wizards' own purple, the same shape the star's
// corona is. Drawn after the tower, so the rings pass over the stone the way
// light would.
export function drawTowerWaves() {
  if (!S.towerOpen) return;
  // Always something coming off it, and more while it is working: this is the
  // one building that is *magic*, so it is plainly doing something at rest.
  const work = brewing();
  const pace = work ? TOWER_WAVE_MS : TOWER_WAVE_MS * 2.6;
  const reach = work ? TOWER_WAVE_R : TOWER_WAVE_R * 0.55;
  const ink = work ? 0.85 : 0.3;
  // On the vane, the only part of it that is not stone: rings off the spire's
  // base come off the roof and read as slipped.
  const from = { x: tower.x + P * 4, y: tower.y - P * 2 };
  for (let i = 0; i < TOWER_WAVE_N; i++) {
    const k = ((now() / pace) + i / TOWER_WAVE_N) % 1;
    const rad = k * reach;
    if (rad < P) continue;
    // fainter as it goes out, and deeper down the purples with it, so it reads
    // as spending itself on the air rather than as a hoop
    ctx.globalAlpha = (1 - k) * ink;
    ctx.fillStyle = MAGIC_TONES[Math.min(MAGIC_TONES.length - 1, Math.floor(k * 3))];
    // a cell every cell round the circumference, so it is a ring rather than a
    // dotted line
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
