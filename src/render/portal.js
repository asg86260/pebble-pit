// The portals (DESIGN.md, "Two crews and a portal"). The snatch's is a
// whirlpool in the abyss's own surface at the mouth, opening before the
// serpent comes up out of it and closing after her leap. The wizards' is a
// hole torn into the drowned pit's near wall, with its other end hanging in
// the deep's water: the way down and the way back up. It is made of the
// abyss rather than laid over it: its lip is the liquid's own veil streaming
// round the tear, its mouth the liquid itself held darker, and crumbs of the
// torn ground fall off the lip and spiral in. Flat and on the grid: every
// cell is asked whether it is lip, torn ground or mouth.

import { P, PORTAL_RX, PORTAL_RY, PORTAL_TURN_MS, ABYSS_TONES, ABYSS_MAGIC_TONES, ABYSS_VEIL_EVERY,
         PORTAL_LIP_FROM, PORTAL_LIP_TO, PORTAL_LIP_MID, PORTAL_LIP_HALF, PORTAL_LIP_RUNS, PORTAL_LIP_MS,
         PORTAL_LIP_WOBBLE_MS, PORTAL_LIP_WOBBLE_RUNS, PORTAL_LIP_WOBBLE, PORTAL_LIP_FLOOR,
         PORTAL_LIP_JITTER, PORTAL_LIP_MIN, PORTAL_LIP_GREY_TOP, PORTAL_LIP_PURPLE, PORTAL_LIP_PURPLE_FROM,
         PORTAL_LIP_SEATS, PORTAL_LIP_LAP_MS, PORTAL_LIP_SEAT_EVERY, PORTAL_LIP_SEAT_W,
         PORTAL_TEAR_JITTER, PORTAL_TEAR_LOBES, PORTAL_TEAR_LOBE, PORTAL_TORN,
         PORTAL_MOUTH_DEEP, PORTAL_MOUTH_PURPLE, PORTAL_MOUTH_DIM, PORTAL_MOUTH_DIM_PURPLE,
         PORTAL_CRUMBS, PORTAL_CRUMB_MS, PORTAL_CRUMB_TURNS } from '../config.js';
import { S, pit } from '../state.js';
import { now } from '../clock.js';
import { mouthX, portalCircle, deepPortal, waterShift } from '../deep/place.js';
import { pouringPortal } from '../wizard.js';
import { WORKER, MAGIC_TONES } from '../config.js';
import { abyssLine, pitDepth } from '../pit.js';
import { ctx } from './ctx.js';
import { cellImage } from './cellimage.js';
import { GREYS, PURPLES } from './deep.js';
import { abyssRung } from './abyssfield.js';

const snap = v => Math.round(v / P) * P;
const ease = k => k * k * (3 - 2 * k);
const seeth = (c, r) => Math.abs((c * 73856093) ^ (r * 19349663)) % 997;

// How open each is: the snatch's whirlpool at the mouth while it plays; the
// wizards' circle, opening as it is poured and whole once it stands.
const snatchOpen = () => (S.snatch && S.snatch.portal > 0 ? S.snatch.portal : 0);
export function portalOpenness() {
  if (pouringPortal()) return ease(S.portalPour);
  return S.portalOpen ? 1 : 0;
}

// A press on the held-open portal goes through it, as the corner's square
// and the arrow by it do: down from the yard's end, up from the deep's. Its
// ring and a cell round it.
export function onPortal(x, y) {
  if (!S.portalOpen || portalOpenness() < 1) return false;
  const c = S.view === 'deep' ? deepPortal() : portalCircle();
  return Math.hypot(x - c.x, y - c.y) <= c.r + P;
}

export function drawPortal() {
  drawPourBeams();
  const k = portalOpenness();
  if (k > 0) {
    // In the pit it stops at the liquid's surface and the pit's floor; in
    // the ground, at the ground line, and there the tear shows behind the lip.
    const line = abyssLine(), floor = S.groundY + pitDepth(), t = now();
    const c = portalCircle();
    drawHole(c, k, {
      tones: ABYSS_TONES, magic: ABYSS_MAGIC_TONES,
      skip: (x, y) => y >= floor || (x >= pit.x ? y < line : y <= S.groundY),
      torn: x => x < pit.x,
      sample: (x, y) => abyssRung(x, y, { line, t, rampLen: ABYSS_TONES.length, magicLen: ABYSS_MAGIC_TONES.length,
                                          deep: PORTAL_MOUTH_DEEP, magicShare: PORTAL_MOUTH_PURPLE })
    });
    drawCrumbs(c, k);
  }
  drawSnatch();
}

// The deep's end, once the portal stands: the same lip and mouth hanging in
// its water, with no ground to tear. The deep is drawn turned over, so its
// ramps are the turned-over ones, and its water is the pit's liquid carried
// on down (`waterShift`).
export function drawDeepPortal() {
  if (!S.portalOpen) return;
  const line = abyssLine(), shift = waterShift(), t = now();
  drawHole(deepPortal(), 1, {
    tones: GREYS, magic: PURPLES, skip: () => false, torn: () => false,
    sample: (x, y) => abyssRung(x, y + shift, { line, t, rampLen: GREYS.length, magicLen: PURPLES.length,
                                                deep: PORTAL_MOUTH_DEEP, magicShare: PORTAL_MOUTH_PURPLE })
  });
}

function drawSnatch() {
  const k = snatchOpen();
  if (k <= 0) return;
  const t = now();
  const cx = mouthX(), cy = snap(abyssLine());
  const rx = Math.max(P, PORTAL_RX * k), ry = Math.max(P / 2, PORTAL_RY * k);
  const turn = t / PORTAL_TURN_MS;
  const top = ABYSS_MAGIC_TONES.length - 1;
  for (let y = snap(cy - ry - P); y <= cy + ry + P; y += P) {
    for (let x = snap(cx - rx - P); x <= cx + rx + P; x += P) {
      const dx = (x + P / 2 - cx) / rx, dy = (y + P / 2 - cy) / ry;
      const d = dx * dx + dy * dy;
      if (d > 1.2) continue;
      const a = Math.atan2(dy, dx) / (Math.PI * 2);
      let tone;
      if (d > 0.72) {
        // the rim, banded, the bands going round
        tone = ABYSS_MAGIC_TONES[Math.floor(((a + turn) % 1 + 1) % 1 * 12) % 2 ? top : top - 2];
      } else {
        // the middle: the liquid's dark with a spiral drawn in, turning
        const arm = Math.sin((a + turn * 0.6) * Math.PI * 6 - Math.sqrt(d) * 9);
        if (arm > 0.55) tone = ABYSS_MAGIC_TONES[Math.max(1, top - 4)];
        else tone = '#000';
      }
      ctx.fillStyle = tone;
      ctx.fillRect(x, y, P, P);
    }
  }
  ctx.fillStyle = '#000';
}

// The wizard pouring it: a line of cells from its hands down to the portal's
// middle, a bead running down it, as the sky's beams are drawn.
function drawPourBeams() {
  const t = now() / 1000;
  for (const w of S.workers) {
    if (!w.portalPour) continue;
    const fx = w.x + WORKER / 2, fy = w.y + WORKER / 2;
    const c = portalCircle();
    const dx = c.x - fx, dy = c.y - fy, len = Math.hypot(dx, dy) || 1;
    ctx.fillStyle = MAGIC_TONES[2];
    for (let d = P * 2; d < len - P; d += P)
      ctx.fillRect(snap(fx + dx * d / len), snap(fy + dy * d / len), P, P);
    ctx.fillStyle = MAGIC_TONES[0];
    const b = P * 2 + (len - P * 3) * ((t * 0.55 + (w.ph || 0)) % 1);
    ctx.fillRect(snap(fx + dx * b / len), snap(fy + dy * b / len), P, P);
  }
  ctx.fillStyle = '#000';
}

// How far out from its middle the hole reaches at radius `r`: the lip's
// outer edge where the tear's lobes and jitter carry it furthest.
const reach = r => r * (PORTAL_LIP_TO + PORTAL_TEAR_LOBE + PORTAL_TEAR_JITTER * 5);

// How far out the whole hole reaches from its middle, standing open.
export const holeReach = () => reach(portalCircle().r);

// The world x of the hole's near edge, for the counter card that keeps to
// the ground left of everything worth watching (counter.js); null while
// there is no hole.
export function portalNearEdge() {
  const k = portalOpenness();
  if (k <= 0) return null;
  const c = portalCircle();
  return c.x - reach(Math.max(P, c.r * k));
}

// The wizards' hole `c`, open `k` of the way, grown from its middle as it is
// poured. `sample` is the liquid's rung under a cell (abyssfield.js), `skip`
// the cells it leaves alone, `torn` the ones in the ground. It turns the
// other way from the angle's own sense (the owner's call), so every angle is
// taken turned over. Painted into an image a pixel a cell (cellimage.js): a
// hole the abyss's depth across is over a thousand cells.
const hole = cellImage();
const rung = (ramp, k) => Math.max(0, Math.min(ramp.length - 1, Math.round(k * (ramp.length - 1))));
function drawHole(c, k, { tones, magic, sample, skip, torn }) {
  const t = now(), r = Math.max(P, c.r * k);
  const out = reach(r) + P;
  const x0 = snap(c.x - out), y0 = snap(c.y - out);
  const cols = Math.ceil((c.x + out - x0) / P) + 1, rows = Math.ceil((c.y + out - y0) / P) + 1;
  hole.begin(cols, rows);
  for (let j = 0; j < rows; j++) {
    const y = y0 + j * P;
    for (let i = 0; i < cols; i++) {
      const x = x0 + i * P;
      if (skip(x, y)) continue;
      const dx = x + P / 2 - c.x, dy = y + P / 2 - c.y, h = seeth(x / P, y / P);
      const at = Math.atan2(dy, dx);
      const edge = r * (1 + ((h % 11) - 5) * PORTAL_TEAR_JITTER + PORTAL_TEAR_LOBE * Math.sin(at * PORTAL_TEAR_LOBES));
      const d = Math.sqrt(dx * dx + dy * dy) / edge;   // hypot's overflow guard is not wanted a cell
      if (d > PORTAL_LIP_TO) continue;
      const tone = lip(d, -at, h, t, tones, magic);
      if (tone) { hole.put(j * cols + i, tone); continue; }
      if (d >= 1) {
        if (torn(x)) hole.put(j * cols + i, PORTAL_TORN[h % PORTAL_TORN.length]);
        continue;
      }
      const v = sample(x, y);
      hole.put(j * cols + i, v > 0 ? tones[Math.max(0, v - PORTAL_MOUTH_DIM)]
                          : v < 0 ? magic[Math.max(0, -v - PORTAL_MOUTH_DIM_PURPLE)] : tones[0]);
    }
  }
  hole.draw(ctx, x0, y0);
}

// The lip at `d` of the way out and turned `th` round: the veil in ragged
// runs streaming round, purple where it is thickest, holed as the veil is
// anywhere; and between the runs, the stars riding round in it. Null where
// neither is lit.
function lip(d, th, h, t, tones, magic) {
  if (d < PORTAL_LIP_FROM) return null;
  const wave = 0.5 + 0.5 * Math.sin(th * PORTAL_LIP_RUNS + t / PORTAL_LIP_MS
                                    + PORTAL_LIP_WOBBLE * Math.sin(th * PORTAL_LIP_WOBBLE_RUNS - t / PORTAL_LIP_WOBBLE_MS));
  const lit = (1 - Math.abs(d - PORTAL_LIP_MID) / PORTAL_LIP_HALF) * (PORTAL_LIP_FLOOR + (1 - PORTAL_LIP_FLOOR) * wave)
            + (h % 3 - 1) * PORTAL_LIP_JITTER;
  if (lit > PORTAL_LIP_MIN && h % ABYSS_VEIL_EVERY !== 0) {
    return lit > PORTAL_LIP_PURPLE
      ? magic[rung(magic, PORTAL_LIP_PURPLE_FROM + lit * (1 - PORTAL_LIP_PURPLE_FROM))]
      : tones[rung(tones, lit * PORTAL_LIP_GREY_TOP)];
  }
  const seat = ((th + t / PORTAL_LIP_LAP_MS) / (Math.PI * 2) * PORTAL_LIP_SEATS % PORTAL_LIP_SEATS + PORTAL_LIP_SEATS) % PORTAL_LIP_SEATS;
  const n = Math.round(seat);
  if (Math.abs(seat - n) < PORTAL_LIP_SEAT_W && Math.abs(d - PORTAL_LIP_MID) < PORTAL_LIP_SEAT_W
      && seeth(n, 7) % PORTAL_LIP_SEAT_EVERY === 0) {
    const g = rung(tones, (Math.sin(t / PORTAL_LIP_MS + n) + 1) / 2);
    if (g) return tones[g];
  }
  return null;
}

// Crumbs of the torn ground, falling off the lip on the ground's side and
// spiraling in, going dark as they go. Each is a place on its own clock
// rather than a thing that exists: crumb `i` is `u` of the way in, and a
// fresh one leaves from a fresh spot on the lip each time round.
function drawCrumbs(c, k) {
  const t = now(), r = c.r * k;
  for (let i = 0; i < PORTAL_CRUMBS; i++) {
    const run = t / PORTAL_CRUMB_MS + seeth(i, 3) / 997;
    const u = run % 1, lap = Math.floor(run);
    const from = Math.PI / 2 + seeth(i, lap) / 997 * Math.PI;      // the ground's half of the lip
    const a = from - PORTAL_CRUMB_TURNS * Math.PI * 2 * u * (1 + u) / 2;
    const d = r * (1 - u);
    ctx.fillStyle = ABYSS_TONES[Math.max(1, Math.round((1 - u) * (ABYSS_TONES.length - 2)))];
    ctx.fillRect(snap(c.x + Math.cos(a) * d - P / 2), snap(c.y + Math.sin(a) * d - P / 2), P, P);
  }
  ctx.fillStyle = '#000';
}
