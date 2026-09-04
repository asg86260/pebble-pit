// The star in the sky: its crust, corona, the summon flash, the trail and the
// bolts. Extracted verbatim from render.js; behavior unchanged. Owns drawSky,
// drawCorona, drawSummon, drawFlash, drawTrail, drawBolts, skyRing. ctx comes
// from ./ctx.js and the ring cell from ./marks.js.

import { now } from '../clock.js';
import { CORE_FLICK, FIND_COLOR, MAGIC_TONES, P, RAY_BEAT, RAY_MAX, RAY_MIN, RAY_N, SPARK_CELL, SUMMON_FLASH, WORKER } from '../config.js';
import { BOLTS, CORE as METEOR_CORE_CELL, SPARKLE, cellX, cellY, summonAt } from '../meteor.js';
import { S, floor, sky } from '../state.js';
import { ctx } from './ctx.js';
import { cell } from './marks.js';

// The thing in the sky is a star, and a small one: a dead black crust with fire
// under it, drawn cell by cell like everything else here that is made of cells.
//
// It reads as a star rather than as a stone because of what stands off it. A
// corona of rays all round, breathing in and out on a slow beat, and the rays
// take their colour from what is showing: black while the crust is whole, and
// redder the more of the core has been uncovered. So the thing visibly catches
// as it is worked -- the last of a star is a blazing one -- and that is the same
// fact the counter is about to be told, said by the picture first.
//
// Nothing here is a gradient or a glow. Rays are cells on the lattice like the
// rock is, the fire is the four reds the sparks are drawn in, and the shimmer is
// those four tones changing places every quarter second.
export function drawSky() {
  if (!S.skyShown && !S.meteorOpen) return;
  drawTrail();
  // Being made. The ring is pouring into the middle of an empty sky, so what is
  // there is whatever they have poured so far -- see `drawSummon`.
  if (S.meteorOpen && (!sky.cells || !sky.n)) { drawSummon(); return; }
  // Nothing called down yet: the plain circle, the far end of the world.
  if (!sky.cells || !sky.n) {
    if (!S.skyShown) return;
    ctx.fillStyle = '#000';
    ctx.beginPath();
    ctx.arc(sky.x, sky.y, sky.r, 0, Math.PI * 2);
    ctx.fill();
    skyRing();
    return;
  }
  drawFlash();

  // How much of it is fire, which is what the corona is drawn from.
  let core = 0, all = 0;
  for (const v of sky.cells) { if (!v) continue; all++; if (v === METEOR_CORE_CELL) core++; }
  const hot = all ? core / all : 0;

  drawCorona(hot);

  const tones = FIND_COLOR[SPARK_CELL];
  const flick = Math.floor(now() / CORE_FLICK);
  for (let r = 0; r < sky.rows; r++) {
    for (let c = 0; c < sky.cols; c++) {
      const v = sky.cells[r * sky.cols + c];
      if (!v) continue;
      if (v === METEOR_CORE_CELL) {
        // The fire, and never the same two cells the same shade for long: the
        // tone is picked off the cell and the clock, so it shifts where it
        // stands rather than crawling about. Only the brighter half of the four
        // reds, so the core is always plainly hotter than the crust round it.
        ctx.fillStyle = tones[(c * 7 + r * 13 + flick) % 2];
      } else {
        // The crust: the deepest of the reds rather than black. It is a star and
        // the whole of it is hot -- a black body with a red middle read as an
        // eclipse, which is a picture of a thing being in front of a sun rather
        // than of a sun.
        ctx.fillStyle = tones[tones.length - 1];
      }
      ctx.fillRect(cellX(c), cellY(r), sky.p, sky.p);
    }
  }
  ctx.fillStyle = '#000';
  drawBolts();
}

// The rays. Whole cells, stepped out along the ray's own line, so a ray is a
// dotted run of squares rather than a drawn line -- there are no lines in this
// game and a stroked one here would be the only stroke in the sky.
function drawCorona(hot) {
  const beat = now() / 1000 / RAY_BEAT * Math.PI * 2;
  const tones = FIND_COLOR[SPARK_CELL];
  for (let i = 0; i < RAY_N; i++) {
    const a = (i / RAY_N) * Math.PI * 2;
    // every other ray on the opposite half of the breath, so the corona pulses
    // rather than swelling as one lump
    const swing = Math.sin(beat + (i % 2 ? Math.PI : 0)) * 0.5 + 0.5;
    const long = RAY_MIN + Math.round(swing * (RAY_MAX - RAY_MIN));
    for (let k = 0; k < long; k++) {
      const d = sky.r + P * (1 + k);
      const x = Math.round((sky.x + Math.cos(a) * d - P / 2) / P) * P;
      const y = Math.round((sky.y + Math.sin(a) * d - P / 2) / P) * P;
      // The tip is thinner than the root: the further out a cell is, the paler
      // it is drawn, which is a corona thinning into the sky rather than a
      // starburst cut out of paper.
      ctx.globalAlpha = 1 - k / (RAY_MAX + 1);
      // Brighter the more of the fire is uncovered: a crusted star throws a dull
      // corona and a stripped one blazes.
      ctx.fillStyle = tones[hot > 0.25 ? 0 : hot > 0.05 ? 1 : 2];
      ctx.fillRect(Math.round(x - P / 2), Math.round(y - P / 2), P, P);   // about its middle
    }
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#000';
}

// A star being made.
//
// Every body in the ring pours into the middle of the empty spot, and what is
// there grows as they pour: a knot of fire that starts as one cell and opens out
// into the disc the star will be. The beams are drawn from each of them, cell by
// cell along the line, brightening and thickening as the thing takes -- and the
// last of it goes off as a flash, because a star arriving quietly would be the
// one moment in this game that deserves a noise and does not make one.
//
// Nothing here is a sprite or a gradient. Beams are runs of whole cells, the
// knot is the same red the core is drawn in, and the flash is a ring of cells
// going out.
function drawSummon() {
  const at = summonAt();
  const mid = { x: sky.x, y: sky.y };
  const tones = FIND_COLOR[SPARK_CELL];
  const t = now() / 1000;

  drawFlash();
  if (at <= 0 && !S.workers.some(w => w.channel)) return;

  // The beams: one steady line of cells from each body that is pouring, and a
  // bead of light running down it. Every cell used to flicker on its own clock,
  // which is not a beam -- it is a shower of confetti in the rough shape of one.
  // A quiet line says where the magic is going; the bead says it is going.
  for (const w of S.workers) {
    if (!w.channel || !w.aloft) continue;
    const fx = w.x + WORKER / 2, fy = w.y + WORKER / 2;
    const dx = mid.x - fx, dy = mid.y - fy;
    const len = Math.hypot(dx, dy) || 1;
    const from = P * 2, to = len - P * 2;

    ctx.globalAlpha = 0.2 + at * 0.35;
    ctx.fillStyle = MAGIC_TONES[2];
    ctx.beginPath();
    for (let d = from; d < to; d += P) {
      ctx.rect(Math.round((fx + dx * (d / len)) / P) * P,
               Math.round((fy + dy * (d / len)) / P) * P, P, P);
    }
    ctx.fill();

    // and the bead: two cells, running inward, on this body's own phase so a
    // ring of them is not one flash repeated
    ctx.globalAlpha = 0.55 + at * 0.45;
    ctx.fillStyle = MAGIC_TONES[0];
    const k = (t * 0.55 + (w.ph || 0) / (Math.PI * 2)) % 1;
    for (const off of [0, P]) {
      const d = from + (to - from) * k + off;
      if (d < from || d > to) continue;
      ctx.fillRect(Math.round((fx + dx * (d / len)) / P) * P,
                   Math.round((fy + dy * (d / len)) / P) * P, P, P);
    }
  }
  ctx.globalAlpha = 1;

  // And the knot in the middle: a solid disc of the star's own fire, opening out
  // as it takes. Its edge is an edge -- it was fraying cell by cell on its own
  // clock, which read as a thing coming apart rather than a thing being made --
  // and what moves is the shimmer inside it and the size of it, which are the
  // same shimmer and the same shape the finished star will have.
  const r = Math.max(P, at * sky.r);
  const flick = Math.floor(now() / CORE_FLICK);
  for (let y = -r; y <= r; y += P) {
    for (let x = -r; x <= r; x += P) {
      if (Math.hypot(x, y) > r) continue;
      ctx.fillStyle = tones[(Math.round(x / P) * 7 + Math.round(y / P) * 13 + flick) % 2];
      ctx.fillRect(Math.round((mid.x + x) / P) * P, Math.round((mid.y + y) / P) * P, P, P);
    }
  }
  ctx.fillStyle = '#000';
}

// The moment it takes: a ring of cells going out from where it arrived, and
// gone within the second. It is drawn over a star that now exists, which is the
// point -- the flash is the arrival, not a thing standing in for it.
function drawFlash() {
  const since = now() - (S.flashAt || 0);
  if (!S.flashAt || since > SUMMON_FLASH) return;
  const k = since / SUMMON_FLASH;
  const tones = FIND_COLOR[SPARK_CELL];

  // Two rings rather than one: the star's own fire going out fast and hard, and
  // the last of the magic that made it following it out, slower and wider. One
  // ring read as a hoop; two reads as a thing letting go.
  const rings = [
    { r: sky.r + k * sky.r * 3.4, ink: 1 - k, colour: tones[0], step: 1 },
    { r: sky.r + Math.max(0, k - 0.15) * sky.r * 5, ink: Math.max(0, 0.8 - k), colour: MAGIC_TONES[1], step: 2 }
  ];
  for (const ring of rings) {
    if (ring.r <= sky.r || ring.ink <= 0) continue;
    ctx.globalAlpha = ring.ink;
    ctx.fillStyle = ring.colour;
    const n = Math.max(12, Math.round((Math.PI * 2 * ring.r) / (P * ring.step)));
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      cell(sky.x + Math.cos(a) * ring.r, sky.y + Math.sin(a) * ring.r);
    }
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#000';
}

// What comes off a flying body: its own light, sinking and going out. Drawn
// before the star and the bodies, so it is behind them -- it is what they left
// behind, not something in front of them.
function drawTrail() {
  if (!SPARKLE.length) return;
  const t = now();
  for (const k of SPARKLE) {
    const life = 1 - (t - k.born) / k.life;
    if (life <= 0) continue;
    // It goes out as it ages, and it goes *down* the tones as it goes: a speck
    // ends deeper and fainter than it started, which is a thing burning out
    // rather than a thing being turned off.
    ctx.globalAlpha = Math.max(0, life) * 0.8;
    ctx.fillStyle = MAGIC_TONES[Math.min(MAGIC_TONES.length - 1,
                                         k.tone + Math.floor((1 - life) * 2))];
    ctx.fillRect(Math.round(k.x / P) * P, Math.round(k.y / P) * P, P, P);
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#000';
}

// The magic on its way to the star: a speck of the wizard's own light, drawn as
// what it is about to knock loose.
function drawBolts() {
  for (const b of BOLTS) {
    // the cell behind it, fainter: two cells is enough to say which way a thing
    // is going, and a longer tail on a six pixel cell is a streak. The specks it
    // has shed are drawn with the rest of the magic -- see `drawTrail`.
    ctx.globalAlpha = 0.45;
    ctx.fillStyle = MAGIC_TONES[2];
    ctx.fillRect(Math.round(b.px / P) * P, Math.round(b.py / P) * P, P, P);
    ctx.globalAlpha = 1;
    ctx.fillStyle = MAGIC_TONES[0];
    ctx.fillRect(Math.round(b.x / P) * P, Math.round(b.y / P) * P, P, P);
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#000';
}

// Only the benched circle wears this. A star does not need a line drawn round it
// to read as a thing hanging in the air -- its own corona does that -- and a ring
// through the rays was a bubble it was sitting in.
function skyRing() {
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(sky.x, sky.y, sky.r + P * 2, 0, Math.PI * 2);
  ctx.stroke();
}
