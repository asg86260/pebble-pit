// The portal (DESIGN.md, "Two crews and a portal"): a whirlpool in the
// abyss's own surface over the shaft, a ring of the abyss's purple turning
// on the liquid round a slow spiral. It opens in the snatch before the
// serpent comes up out of it, closes after her leap, and once the wizards
// conjure it, it opens again and stays. Flat and on the grid: every cell is
// asked whether it is rim, spiral or the liquid's own dark.

import { P, PORTAL_RX, PORTAL_RY, PORTAL_TURN_MS, ABYSS_MAGIC_TONES } from '../config.js';
import { S } from '../state.js';
import { now } from '../clock.js';
import { mouthX, portalX } from '../deep/place.js';
import { pouringPortal } from '../wizard.js';
import { WORKER, MAGIC_TONES } from '../config.js';
import { abyssLine } from '../pit.js';
import { ctx } from './ctx.js';

const snap = v => Math.round(v / P) * P;
const ease = k => k * k * (3 - 2 * k);

// How open it is and where: the snatch's own at the mouth while it plays;
// the wizards' in the middle of the pit, opening as it is poured and whole
// once it stands.
export function portalState() {
  if (S.snatch && S.snatch.portal > 0) return { k: S.snatch.portal, x: mouthX() };
  if (pouringPortal()) return { k: ease(S.portalPour), x: portalX() };
  return { k: S.portalOpen ? 1 : 0, x: portalX() };
}
export const portalOpenness = () => portalState().k;

// A press on the held-open portal is the way down, as the corner's square
// and the arrow over it are: its ring and a cell round it.
export function onPortal(x, y) {
  if (!S.portalOpen || S.view === 'deep' || portalOpenness() < 1) return false;
  const dx = (x - portalX()) / (PORTAL_RX + P), dy = (y - abyssLine()) / (PORTAL_RY + P * 2);
  return dx * dx + dy * dy <= 1;
}

export function drawPortal() {
  drawPourBeams();
  const { k, x: cx } = portalState();
  if (k <= 0) return;
  const t = now();
  const cy = snap(abyssLine());
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
  const t = now() / 1000, cy = abyssLine();
  for (const w of S.workers) {
    if (!w.portalPour) continue;
    const fx = w.x + WORKER / 2, fy = w.y + WORKER / 2;
    const dx = portalX() - fx, dy = cy - fy, len = Math.hypot(dx, dy) || 1;
    ctx.fillStyle = MAGIC_TONES[2];
    for (let d = P * 2; d < len - P; d += P)
      ctx.fillRect(snap(fx + dx * d / len), snap(fy + dy * d / len), P, P);
    ctx.fillStyle = MAGIC_TONES[0];
    const b = P * 2 + (len - P * 3) * ((t * 0.55 + (w.ph || 0)) % 1);
    ctx.fillRect(snap(fx + dx * b / len), snap(fy + dy * b / len), P, P);
  }
  ctx.fillStyle = '#000';
}
