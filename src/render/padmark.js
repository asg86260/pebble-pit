// The pad's focus marker over the yard (DESIGN.md, "Controller support"):
// corner brackets in the accent, a cell clear of the thing, each wearing a
// one-cell halo so it reads over ink, grey and the deep's dark. Where it is
// and how far out it stands is padglide.js's; this only paints it, and only
// while a pad was the last thing touched.
//
// Painted after the deep is turned over (render.js, `LAYERS`), so its colors
// are written as they are seen: down there the deep's lighter purple over
// the deep's own dark, and on the dark page each turned so the palette's
// map turns it back, as the fight numbers are (render/fightnums.js).

import { PAD_ACCENT, PAD_DEEP_ACCENT, PAD_HALO, PAD_DEEP_HALO, PAD_ARM_MIN, PAD_ARM_MAX } from '../config.js';
import { S } from '../state.js';
import { ctx } from './ctx.js';
import { seen } from '../ink.js';
import { markAt, bracketCells, haloCells } from '../padglide.js';


// Drawn whenever padglide.js has a mark, a fading one included: put away (a
// mouse move, the held sheet, a scene), it fades out where it stood.
export function drawPadMark() {
  const m = markAt(performance.now());
  if (!m || m.space !== 'yard' || !m.r || !(m.alpha > 0)) return;
  const deep = S.view === 'deep';
  const cells = bracketCells(m.r, m.out, m.unit, PAD_ARM_MIN, PAD_ARM_MAX);
  const u = m.unit;
  const was = ctx.globalAlpha;
  ctx.globalAlpha = was * m.alpha;
  ctx.fillStyle = deep ? seen(PAD_DEEP_HALO) : PAD_HALO;
  for (const [x, y] of haloCells(cells)) ctx.fillRect(x * u, y * u, u, u);
  ctx.fillStyle = deep ? seen(PAD_DEEP_ACCENT) : PAD_ACCENT;
  for (const [x, y] of cells) ctx.fillRect(x * u, y * u, u, u);
  ctx.globalAlpha = was;
  ctx.fillStyle = '#000';
}
