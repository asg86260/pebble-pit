// The portals (DESIGN.md, "Two crews and a portal"). The snatch's is a
// whirlpool in the abyss's own surface at the mouth, opening before the
// serpent comes up out of it and closing after her leap. The wizards' is a
// circle facing the window, set into the drowned pit's near wall, with its
// other end hanging in the deep's water: the way down and the way back up.
// Each is a ring of the abyss's purple turning round a slow spiral on the
// liquid's own dark. Flat and on the grid: every cell is asked whether it is
// rim, spiral or dark.

import { P, PORTAL_RX, PORTAL_RY, PORTAL_TURN_MS, ABYSS_MAGIC_TONES } from '../config.js';
import { S } from '../state.js';
import { now } from '../clock.js';
import { mouthX, portalCircle, deepPortal } from '../deep/place.js';
import { pouringPortal } from '../wizard.js';
import { WORKER, MAGIC_TONES } from '../config.js';
import { abyssLine } from '../pit.js';
import { ctx } from './ctx.js';
import { cellImage } from './cellimage.js';
import { GREYS, PURPLES } from './deep.js';

const snap = v => Math.round(v / P) * P;
const ease = k => k * k * (3 - 2 * k);

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
  if (k > 0) drawRing(portalCircle(), k, ABYSS_MAGIC_TONES, '#000');
  drawSnatch();
}

// The deep's end, once the portal stands. The deep is drawn turned over, so
// its ramps are the turned-over ones and its dark is the foot of its greys.
export function drawDeepPortal() {
  if (S.portalOpen) drawRing(deepPortal(), 1, PURPLES, GREYS[0]);
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

// A wizards' circle `c`, open `k` of the way: a ring facing the window,
// banded and turning, round a slow spiral on `dark`, growing from its middle
// as it is poured. Painted into an image a pixel a cell (cellimage.js): a
// circle the abyss's depth across is over a thousand cells.
const ring = cellImage();
function drawRing(c, k, tones, dark) {
  const turn = now() / PORTAL_TURN_MS;
  const r = Math.max(P, c.r * k), top = tones.length - 1;
  const band = Math.max(P * 1.5, r * 0.16);
  const x0 = snap(c.x - r - P), y0 = snap(c.y - r - P);
  const cols = Math.ceil((c.x + r + P - x0) / P) + 1, rows = Math.ceil((c.y + r + P - y0) / P) + 1;
  ring.begin(cols, rows);
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const dx = x0 + i * P + P / 2 - c.x, dy = y0 + j * P + P / 2 - c.y, d = Math.hypot(dx, dy);
      if (d > r) continue;
      const a = Math.atan2(dy, dx) / (Math.PI * 2);
      let tone;
      if (d > r - band) tone = tones[Math.floor(((a + turn) % 1 + 1) % 1 * 24) % 2 ? top : top - 2];
      else {
        const arm = Math.sin((a + turn * 0.6) * Math.PI * 6 - d / r * 9);
        tone = arm > 0.55 ? tones[Math.max(1, top - 4)] : dark;
      }
      ring.put(j * cols + i, tone);
    }
  }
  ring.draw(ctx, x0, y0);
}
