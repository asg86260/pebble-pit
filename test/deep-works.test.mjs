// The deep is built the way the yard is, by its own hands (DESIGN.md, "Two
// crews and a portal"): a door or a rung bought down there is put up by the
// deep's builders, who hammer at the place itself, and every place a pointer
// can stand at says what it is called and what it is drawn as, on its one row
// in `STATIONS`, so the hover, the queue card and the hop read it from there.

import { group, ok, yard } from './helpers.mjs';
import { P, WORKER, SHELF_GLYPH_CELLS } from '../src/config.js';
import { STATIONS } from '../src/stations.js';
import { GLYPHS } from '../src/glyphs.js';
import { deepTop, standOf } from '../src/deep/place.js';
import { progressOf, workAt, worksAt } from '../src/works.js';
import { stackSlot } from '../src/render/bars.js';

const S = yard.S;

group("a door of the deep is built by the deep's own builder standing at it", async () => {
  window.__fullSites();
  window.__snatch({ played: true });
  window.__crew(0, 4);
  window.__deepCrew({ brawlers: 1 });
  window.__serpent({ stage: 1 });
  window.__scales(99999);
  window.__grant({ dust: 900000 });
  const bought = window.__buy('unlockwell');
  const at = standOf('well');
  // Progress is only ever made with a builder on the deep's floor, over the
  // well's ground.
  const bad = [];
  let there = false, last = 0;
  for (let f = 0; f < 60 * 120 && !S.wellOpen; f++) {
    yard.fast(1 / 60);
    const w = workAt('deep');
    const p = w ? progressOf(w) : last;
    const onSite = S.workers.some(b => b.type === 'delver' && b.y + WORKER > deepTop()
                                     && b.x + WORKER > at.x && b.x < at.x + at.w);
    if (onSite) there = true;
    if (p > last + 1e-9 && !onSite) bad.push(f);
    last = p;
  }
  return [
    ok(bought, 'the well\'s door is sold on the altar'),
    ok(there, "a deep builder stood at the well"),
    ok(bad.length === 0, 'and the work only went up while one was there', bad.slice(0, 5).join(', ')),
    ok(S.wellOpen, 'and the well stands')
  ];
}, { reload: false });

group('every place with ground says its name and its drawing', async () => {
  const bare = STATIONS.filter(r => r.stand && (!r.name || !GLYPHS[r.glyph])).map(r => r.key);
  return [ok(bare.length === 0, 'no station row is missing a name or a drawn glyph', bare.join(', '))];
}, { reload: false });

// The stack over a deep station hangs off the station as drawn, not off the
// dome round it or a flag the deep does not fly: the first glyph's foot is
// over the station's top, and closer to it than a glyph is tall.
group('the works in line at a deep station hang just over the station', async () => {
  window.__fullSites();
  window.__snatch({ played: true });
  window.__deepCrew({ brawlers: 1 });
  window.__scales(99999);
  const bought = window.__buy('punch');
  const top = standOf('altar').y;
  const at = stackSlot('altar', 0, worksAt('altar')[0]);
  const foot = at && at.cy + SHELF_GLYPH_CELLS / 2 * P;
  return [
    ok(bought && worksAt('altar').length > 0, 'a punch rung is in line at the altar'),
    ok(at && foot < top, 'its glyph stands over the altar', at && `${foot} vs ${top}`),
    ok(at && top - foot < SHELF_GLYPH_CELLS * P, "within a glyph's height of it", at && `${(top - foot) / P} cells`)
  ];
}, { reload: false });

// A blow struck in the deep stirs up silt that sinks back to the floor it was
// struck over and lies there, rather than grit that is gone the frame it is
// thrown for being under the yard's ground line.
group('a builder hammering in the deep stirs up silt that settles on the floor', async () => {
  window.__fullSites();
  window.__snatch({ played: true });
  window.__crew(0, 4);
  window.__deepCrew({ brawlers: 1 });
  window.__serpent({ stage: 1 });
  window.__scales(99999);
  window.__grant({ dust: 900000 });
  const bought = window.__buy('unlockwell');
  let oldest = 0, settled = false, sunk = [];
  for (let f = 0; f < 60 * 120 && !S.wellOpen; f++) {
    yard.fast(1 / 60);
    for (const g of S.grit) {
      if (!g.sea) continue;
      oldest = Math.max(oldest, g.t);
      if (g.y > g.floor - P + 1e-6) sunk.push(Math.round(g.y - g.floor));
      if (g.vy === 0 && g.y === g.floor - P) settled = true;
    }
  }
  return [
    ok(bought, 'the well\'s door is sold on the altar'),
    ok(oldest > 0.5, 'a chip thrown in the deep lives past the frame it was thrown', oldest.toFixed(2)),
    ok(settled, 'and one comes to rest on the floor'),
    ok(sunk.length === 0, 'and none sinks through it', sunk.slice(0, 5).join(', '))
  ];
}, { reload: false });
