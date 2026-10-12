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
import { darkPage, turned } from '../ink.js';
import { markAt, bracketCells, haloCells } from '../padglide.js';
import { skippable } from '../skip.js';

const seen = c => (darkPage ? turned(c) : c);

export function drawPadMark() {
  if (!S.padOn || S.paused || skippable()) return;
  const m = markAt(performance.now());
  if (!m || m.space !== 'yard' || !m.r) return;
  const deep = S.view === 'deep';
  const cells = bracketCells(m.r, m.out, m.unit, PAD_ARM_MIN, PAD_ARM_MAX);
  const u = m.unit;
  ctx.fillStyle = deep ? seen(PAD_DEEP_HALO) : PAD_HALO;
  for (const [x, y] of haloCells(cells)) ctx.fillRect(x * u, y * u, u, u);
  ctx.fillStyle = deep ? seen(PAD_DEEP_ACCENT) : PAD_ACCENT;
  for (const [x, y] of cells) ctx.fillRect(x * u, y * u, u, u);
  ctx.fillStyle = '#000';
}
