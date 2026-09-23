// The star in the sky: its crust, corona, the summon flash, the trail and the
// bolts.

import { now } from '../clock.js';
import { CORE_FLICK, FIND_COLOR, MAGIC_TONES, P, RAY_BEAT, RAY_MAX, RAY_MIN, RAY_N, SPARK_CELL, SUMMON_FLASH, WORKER, SHADES, SPHERE_VENT } from '../config.js';
import { BOLTS, CORE as METEOR_CORE_CELL, SPARKLE, cellX, cellY, summonAt } from '../meteor.js';
import { S, floor, sky } from '../state.js';
import { ctx } from './ctx.js';
import { domeRising, domeSpot, domeAt } from '../shield.js';
import { domeEdge } from './shield.js';
import { cell } from './marks.js';
import { sphereBought, sphereUp, sphereRising, shellCells, laid, covered, flareOf, sphereEdges, pouredAt, sphereVents } from '../sphere.js';

// The thing in the sky is a small star: a dead black crust with fire under it,
// drawn cell by cell. A corona of rays breathes on a slow beat and takes its
// color from what is showing, redder the more of the core is uncovered, so the
// picture says what the counter is about to be told. Nothing here is a
// gradient or a glow: the fire is the four reds the sparks are drawn in, and
// the shimmer is those tones changing places every quarter second.
export function drawSky() {
  if (!S.skyShown && !S.meteorOpen) return;
  drawTrail();
  // A dome being cast goes on whether or not there is a star up, so its beams
  // are drawn here, before the sky decides what else it is showing.
  if (domeRising()) drawBeams(() => [domeEdge(-1), domeEdge(1)], domeAt(), true);
  // Being made: what is there is whatever they have poured so far.
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

  // Closed, the sphere is all that shows: the star is inside it.
  if (sphereUp()) { drawShell(); drawBolts(); return; }

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
        // The fire: tone off the cell and the clock, so it shifts where it
        // stands rather than crawling about. Only the brighter half of the four
        // reds, so the core is always plainly hotter than the crust.
        ctx.fillStyle = tones[(c * 7 + r * 13 + flick) % 2];
      } else {
        // The crust: the deepest of the reds rather than black, or a black body
        // with a red middle reads as an eclipse.
        ctx.fillStyle = tones[tones.length - 1];
      }
      ctx.fillRect(cellX(c), cellY(r), sky.p, sky.p);
    }
  }
  ctx.fillStyle = '#000';
  if (sphereBought() && pouredAt() > 0) drawShell();
  drawBolts();
}

// The rays: whole cells stepped out along the ray's own line, since a stroked
// line here would be the only stroke in the sky.
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
      // Paler the further out, a corona thinning into the sky rather than a
      // starburst cut out of paper.
      ctx.globalAlpha = 1 - k / (RAY_MAX + 1);
      // Brighter the more of the fire is uncovered.
      ctx.fillStyle = tones[hot > 0.25 ? 0 : hot > 0.05 ? 1 : 2];
      ctx.fillRect(Math.round(x - P / 2), Math.round(y - P / 2), P, P);   // about its middle
    }
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#000';
}

// The beams: one steady line of cells from each body that is pouring, and a
// bead of light running down it, to the star coming into an empty sky or to
// the dome. The brightness rides the making's own progress. A quiet line says
// where the magic is going; the bead says it is going.
function drawBeams(endsOf, at, dome = false) {
  const t = now() / 1000;
  for (const w of S.workers) {
    if (!w.channel || !w.aloft) continue;
    const fx = w.x + WORKER / 2, fy = w.y + WORKER / 2;
    // A star is poured into its middle. A dome is poured on to both horns from
    // every body, so the beams climb the shell with it. Both rather than the
    // nearer, because the ring turns: a beam that picked a side would jump to
    // the other horn every time its body crossed the middle.
    const ends = endsOf(fx, fy);
    for (const end of ends) {
      const dx = end.x - fx, dy = end.y - fy;
      const len = Math.hypot(dx, dy) || 1;
      const from = P * 2, to = len - P * 2;

      // The dome's beam starts strong: it is landing on a thing already there.
      ctx.globalAlpha = dome ? 0.5 + at * 0.3 : 0.2 + at * 0.35;
      ctx.fillStyle = MAGIC_TONES[2];
      ctx.beginPath();
      for (let d = from; d < to; d += P) {
        ctx.rect(Math.round((fx + dx * (d / len)) / P) * P,
                 Math.round((fy + dy * (d / len)) / P) * P, P, P);
      }
      ctx.fill();

      // and the bead, on this body's own phase so a ring of them is not one
      // flash repeated
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
  }
  ctx.globalAlpha = 1;
  ctx.fillStyle = '#000';
}

// A star being made: every body in the ring pours into the middle of the empty
// spot, and a knot of fire there opens out into the disc the star will be. The
// last of it goes off as a flash.
function drawSummon() {
  const at = summonAt();
  const mid = { x: sky.x, y: sky.y };
  const tones = FIND_COLOR[SPARK_CELL];

  drawFlash();
  // While the dome is rising the ring is over the dome and its beams are
  // already drawn.
  if (at <= 0 && (domeRising() || !S.workers.some(w => w.channel))) return;
  if (!domeRising()) drawBeams(() => [mid], at);

  // The knot in the middle: a solid disc of the star's own fire, opening out
  // as it takes. Its edge is an edge; what moves is the shimmer inside it and
  // the size, the same shimmer and shape the finished star will have.
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

// The moment it takes: a ring of cells going out from where it arrived, drawn
// over a star that now exists. The flash is the arrival.
function drawFlash() {
  const since = now() - (S.flashAt || 0);
  if (!S.flashAt || since > SUMMON_FLASH) return;
  const k = since / SUMMON_FLASH;
  const tones = FIND_COLOR[SPARK_CELL];

  // Two rings: the star's own fire going out fast and hard, and the last of
  // the magic that made it following slower and wider. One ring reads as a
  // hoop.
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
// before the star and the bodies, so it is behind them.
function drawTrail() {
  if (!SPARKLE.length) return;
  const t = now();
  for (const k of SPARKLE) {
    const life = 1 - (t - k.born) / k.life;
    if (life <= 0) continue;
    // Down the tones as it ages, so a speck ends deeper and fainter than it
    // started: a thing burning out rather than being turned off.
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
    // the cell behind it, fainter: two cells says which way a thing is going,
    // and a longer tail on a six pixel cell is a streak. The specks it has
    // shed are drawn in `drawTrail`.
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

// Only the benched circle wears this: a star's own corona says it is hanging
// in the air, and a ring through the rays reads as a bubble.
function skyRing() {
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(sky.x, sky.y, sky.r + P * 2, 0, Math.PI * 2);
  ctx.stroke();
}

// --- the sphere ----------------------------------------------------------------
// Plates in the ink's darker shades, a tone a plate and a shade either side a
// cell, so the shell reads as built of pieces rather than printed; the seams
// between them are the star's light getting out. A seam flares as its cell
// lets a chip go, and a seam a rung has covered is a second course of plate, a
// paler gray. Pouring, the plates come in up both sides from under the star
// and the beams land on the two growing edges.
const hash = n => ((n * 2654435761) >>> 0) % 997;

function drawShell() {
  const cells = shellCells();
  const tones = FIND_COLOR[SPARK_CELL];
  const flick = Math.floor(now() / CORE_FLICK);
  const up = sphereUp();
  for (const c of cells) {
    if (!laid(c)) continue;
    if (c.band) {
      // The band the plates hang in, riveted every third cell.
      ctx.fillStyle = c.rivet ? SHADES[5] : SHADES[1];
    } else if (c.cross) {
      ctx.fillStyle = SHADES[5];                 // a bolt where two seams cross
    } else if (!c.seam) {
      // A plate, beveled: lit along its top and left edges, in shadow along
      // its bottom and right, its own tone between, a shade either way a cell.
      const base = 3 + hash(c.tile) % 2;
      const lit = c.lit, dark = c.dark;
      const k = lit && !dark ? base - 2 : dark && !lit ? 5 : base + (hash(c.x * 31 + c.y) % 3) - 1;
      ctx.fillStyle = SHADES[Math.max(0, Math.min(SHADES.length - 1, k))];
    } else if (covered(c)) {
      ctx.fillStyle = SHADES[1];
    } else {
      // Open: the star's own fire, dimmer while nobody is up there tending.
      const f = flareOf(c);
      ctx.fillStyle = f < 1 ? tones[0] : tones[1 + (hash(c.x + c.y * 7) + flick) % 2];
    }
    ctx.fillRect(c.x, c.y, P, P);
  }
  // The vents on the crown, once the plates have closed over it: a cell-wide
  // chimney standing out of the band, its mouth dark.
  if (up) {
    for (const v of sphereVents()) {
      // From the band's own cell outward, so the chimney stands on the shell
      // rather than floating a cell off it.
      for (let k = 0; k <= SPHERE_VENT; k++) {
        ctx.fillStyle = k === SPHERE_VENT ? SHADES[5] : SHADES[3];
        ctx.fillRect(Math.round((v.x + v.ux * P * k) / P) * P, Math.round((v.y + v.uy * P * k) / P) * P, P, P);
      }
    }
  }
  // A seam on the rim that has just let a chip go throws a short ray.
  if (up) {
    for (const c of cells) {
      if (!c.seam || !c.rim || c.band || c.cross || covered(c)) continue;
      const f = flareOf(c);
      if (f >= 1) continue;
      const dx = c.x + P / 2 - sky.x, dy = c.y + P / 2 - sky.y;
      const d = Math.hypot(dx, dy) || 1;
      ctx.fillStyle = tones[0];
      for (let k = 1; k <= 2; k++) {
        ctx.globalAlpha = (1 - f) * (1 - k / 3);
        ctx.fillRect(Math.round((c.x + dx / d * P * k) / P) * P,
                     Math.round((c.y + dy / d * P * k) / P) * P, P, P);
      }
    }
    ctx.globalAlpha = 1;
  }
  ctx.fillStyle = '#000';
  // The ring pours on to the two growing edges; the tender on to the rim
  // nearest it.
  if (sphereRising()) {
    const edges = sphereEdges();
    drawBeams(() => edges, pouredAt(), true);
  } else if (up) {
    drawBeams((fx, fy) => {
      const dx = fx - sky.x, dy = fy - sky.y, d = Math.hypot(dx, dy) || 1;
      const R = sky.r + P * 2;
      return [{ x: sky.x + dx / d * R, y: sky.y + dy / d * R }];
    }, 0.4);
  }
}
