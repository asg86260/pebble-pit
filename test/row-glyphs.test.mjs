// Every row on every board wears a drawing: its own, or the one of the
// station that sells it (`inheritGlyph`). One that ends on the crate went
// out with nothing, which is how the three throwing rows and the pollution
// gauge once did.

import { group, ok } from './helpers.mjs';
import { GLYPHS, BADGES, GLYPH_OF, glyphNameOf } from '../src/glyphs.js';
import '../src/shop.js';

group('every row on every board has a drawing, and its badge exists', async () => {
  window.__reset();
  const bare = [], unmade = [];
  for (const b of window.__boards()) for (const key of b.keys) {
    const pic = glyphNameOf(key), badge = (GLYPH_OF[key] || [])[1];
    if (pic === 'crate' && (GLYPH_OF[key] || [])[0] !== 'crate') { bare.push(`${key} (${b.name})`); continue; }
    if (!GLYPHS[pic]) unmade.push(`${key}: ${pic}`);
    if (badge && !BADGES[badge]) unmade.push(`${key}: badge ${badge}`);
  }
  return [
    ok(!bare.length, 'no row is left wearing the crate', bare.join(', ')),
    ok(!unmade.length, 'and every drawing and badge a row names is drawn', unmade.join(', '))
  ];
});
