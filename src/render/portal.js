// The portal (DESIGN.md, "Two crews and a portal"): a whirlpool in the
// abyss's own surface over the shaft, a ring of the abyss's purple turning
// on the liquid round a slow spiral. It opens in the snatch before the
// serpent comes up out of it, closes after her leap, and once the wizards
// conjure it, it opens again and stays. Flat and on the grid: every cell is
// asked whether it is rim, spiral or the liquid's own dark.

import { P, PORTAL_RX, PORTAL_RY, PORTAL_OPEN_MS, PORTAL_TURN_MS, ABYSS_MAGIC_TONES } from '../config.js';
import { S } from '../state.js';
import { now } from '../clock.js';
import { mouthX } from '../deep/place.js';
import { abyssLine } from '../pit.js';
import { ctx } from './ctx.js';

const snap = v => Math.round(v / P) * P;
const ease = k => k * k * (3 - 2 * k);

// How open it is: the snatch's own, while it plays; the conjured one's,
// opening from when it was bought (a reload finds it open).
export function portalOpenness() {
  if (S.snatch && S.snatch.portal > 0) return S.snatch.portal;
  if (!S.portalOpen) return 0;
  return ease(Math.min(1, (now() - (S.portalAt || 0)) / PORTAL_OPEN_MS));
}

// A press on the held-open portal is the way down, as the corner's square
// and the arrow over it are: its ring and a cell round it.
export function onPortal(x, y) {
  if (!S.portalOpen || S.view === 'deep' || portalOpenness() < 1) return false;
  const dx = (x - mouthX()) / (PORTAL_RX + P), dy = (y - abyssLine()) / (PORTAL_RY + P * 2);
  return dx * dx + dy * dy <= 1;
}

export function drawPortal() {
  const k = portalOpenness();
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
