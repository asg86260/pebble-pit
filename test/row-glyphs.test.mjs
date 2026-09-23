// Every row on every board wears a drawing of its own. A row missing from
// `GLYPH_OF` falls back to the crate without a word, which is how the three
// throwing rows and the pollution gauge went out wearing it.

import { group, ok } from './helpers.mjs';
import { GLYPHS, BADGES, GLYPH_OF } from '../src/glyphs.js';

group('every row on every board has a drawing, and its badge exists', async () => {
  window.__reset();
  const bare = [], unmade = [];
  for (const b of window.__boards()) for (const key of b.keys) {
    const [pic, badge] = GLYPH_OF[key] || [];
    if (!pic) { bare.push(`${key} (${b.name})`); continue; }
    if (!GLYPHS[pic]) unmade.push(`${key}: ${pic}`);
    if (badge && !BADGES[badge]) unmade.push(`${key}: badge ${badge}`);
  }
  return [
    ok(!bare.length, 'no row is left wearing the crate', bare.join(', ')),
    ok(!unmade.length, 'and every drawing and badge a row names is drawn', unmade.join(', '))
  ];
});
