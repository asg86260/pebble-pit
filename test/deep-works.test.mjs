// The deep is built the way the yard is (DESIGN.md, "The serpent"): a door
// or a rung bought down there is put up by the yard's builders, who go down
// the shaft to it and hammer at the place itself, and every place a pointer
// can stand at says what it is called and what it is drawn as, on its one row
// in `STATIONS`, so the hover, the queue card and the hop read it from there.

import { group, ok, yard } from './helpers.mjs';
import { WORKER } from '../src/config.js';
import { STATIONS } from '../src/stations.js';
import { GLYPHS } from '../src/glyphs.js';
import { deepTop, standOf } from '../src/deep/place.js';
import { progressOf, workAt } from '../src/works.js';

const S = yard.S;

group('a door of the deep is built by a builder standing at it, down the shaft', async () => {
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
    const onSite = S.workers.some(b => b.type === 'builder' && b.y + WORKER > deepTop()
                                     && b.x + WORKER > at.x && b.x < at.x + at.w);
    if (onSite) there = true;
    if (p > last + 1e-9 && !onSite) bad.push(f);
    last = p;
  }
  return [
    ok(bought, 'the well\'s door is sold on the altar'),
    ok(there, 'a builder went down the shaft and stood at the well'),
    ok(bad.length === 0, 'and the work only went up while one was there', bad.slice(0, 5).join(', ')),
    ok(S.wellOpen, 'and the well stands')
  ];
}, { reload: false });

group('every place with ground says its name and its drawing', async () => {
  const bare = STATIONS.filter(r => r.stand && (!r.name || !GLYPHS[r.glyph])).map(r => r.key);
  return [ok(bare.length === 0, 'no station row is missing a name or a drawn glyph', bare.join(', '))];
}, { reload: false });
