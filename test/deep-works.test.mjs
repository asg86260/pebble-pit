// The deep is built the way the yard is, by its own hands (DESIGN.md, "Two
// crews and a portal"): a pod bought down there is put up by the deep's
// builders, who hammer at the place itself, and every place a pointer can
// stand at says what it is called and what it is drawn as, on its one row in
// `STATIONS`, so the hover, the queue card and the hop read it from there. A
// station of the party is a place by its id (docs/wave-party.md): its build
// hangs over its own slot, and two of a kind are two places.

import { group, ok, yard } from './helpers.mjs';
import { P, WORKER, SHELF_GLYPH_CELLS, PARTY_IDS } from '../src/config.js';
import { STATIONS, KINDS, station } from '../src/stations.js';
import { GLYPHS } from '../src/glyphs.js';
import { SPRITES } from '../src/deep/sprites.js';
import { deepTop, podsRect, standOfStation } from '../src/deep/place.js';
import { progressOf, workAt, worksAt, start, DOWN_THERE, siteBox } from '../src/works.js';
import { stackSlot } from '../src/render/bars.js';

const S = yard.S;

// until merge: `__party` (STATE) stands the party; until then its stations
// are written onto S by hand, one a kind, each at the next slot.
const stand = (kinds, built = true) => {
  S.stations = kinds.map((kind, i) => ({ id: PARTY_IDS[i], kind, slot: i, built,
                                         cls: null, rung: 0, paid: [], fighter: null }));
  return S.stations;
};

group("a pod is built by the deep's own builder standing at it", async () => {
  window.__fullSites();
  window.__snatch({ played: true });
  window.__crew(0, 4);
  window.__deepCrew({ spare: 2 });           // hands of the deep's own, on no post
  window.__scales(99999);
  window.__grant({ dust: 900000 });
  const pods = S.pods;
  const at = podsRect();
  const bought = window.__buy('pod');
  // Progress is only ever made with a builder on the deep's floor, over the
  // pods' ground.
  const bad = [];
  let there = false, last = 0;
  for (let f = 0; f < 60 * 120 && S.pods === pods; f++) {
    yard.fast(1 / 60);
    const w = workAt('pods');
    const p = w ? progressOf(w) : last;
    const onSite = S.workers.some(b => b.type === 'delver' && b.y + WORKER > deepTop()
                                     && b.x + WORKER > at.x && b.x < at.x + at.w);
    if (onSite) there = true;
    if (p > last + 1e-9 && !onSite) bad.push(f);
    last = p;
  }
  return [
    ok(bought, 'a pod is sold on the pods\' board'),
    ok(there, 'a deep builder stood at the pods'),
    ok(bad.length === 0, 'and the work only went up while one was there', bad.slice(0, 5).join(', ')),
    ok(S.pods === pods + 1, 'and the pod stands', `${pods} -> ${S.pods}`)
  ];
}, { reload: false });

group('every place with ground says its name and its drawing', async () => {
  // Every kind standing, so every station of the party has a kind to say.
  stand(['altar', 'well', 'armory', 'spire']);
  const bare = STATIONS.filter(r => r.stand && (!r.name || !GLYPHS[r.glyph])).map(r => r.key);
  const kinds = Object.entries(KINDS).filter(([k, v]) => !v.name || !GLYPHS[v.glyph] || !SPRITES[k]).map(([k]) => k);
  const named = PARTY_IDS.map(id => station(id).name);
  return [
    ok(bare.length === 0, 'no station row is missing a name or a drawn glyph', bare.join(', ')),
    ok(kinds.length === 0, 'every kind has a name, a glyph and a drawing on the floor', kinds.join(', ')),
    ok(named.join() === 'the altar,the well,the armory,the spire', "a station of the party is called by its kind", named.join())
  ];
}, { reload: false });

group('a station of the party is a place by its id: two altars, two places', async () => {
  const [a, b] = stand(['altar', 'altar']);
  const ga = standOfStation(a), gb = standOfStation(b);
  const down = PARTY_IDS.every(id => DOWN_THERE.has(id));
  return [
    ok(ga.w === gb.w && ga.h === gb.h, 'the two altars are one drawing', `${ga.w}x${ga.h} ${gb.w}x${gb.h}`),
    ok(gb.x > ga.x + ga.w, 'standing at two slots, left to right', `${ga.x} ${gb.x}`),
    ok(siteBox('s1').x === ga.x && siteBox('s2').x === gb.x, 'each its own site for works'),
    ok(down, "and every station's works are the deep's builders'")
  ];
}, { reload: false });

// The stack over a deep station hangs off the station as drawn, not off the
// dome round it or a flag the deep does not fly: the first glyph's foot is
// over the station's top, and closer to it than a glyph is tall.
group('the works in line at a station of the party hang just over it', async () => {
  window.__fullSites();
  const [st] = stand(['spire'], false);
  // until merge: the build `buildStation` (CREW) queues, put in line by hand.
  const queued = start('s1', { key: 'raise-s1', kind: 'building', work: () => 30 });
  const top = standOfStation(st).y;
  const at = stackSlot('s1', 0, worksAt('s1')[0]);
  const foot = at && at.cy + SHELF_GLYPH_CELLS / 2 * P;
  return [
    ok(queued && worksAt('s1').length > 0, 'a build is in line at the station'),
    ok(at && foot < top, 'its glyph stands over the station', at && `${foot} vs ${top}`),
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
  window.__deepCrew({ spare: 2 });           // hands of the deep's own, on no post
  window.__scales(99999);
  window.__grant({ dust: 900000 });
  const pods = S.pods;
  const bought = window.__buy('pod');
  let oldest = 0, settled = false, sunk = [];
  for (let f = 0; f < 60 * 120 && S.pods === pods; f++) {
    yard.fast(1 / 60);
    for (const g of S.grit) {
      if (!g.sea) continue;
      oldest = Math.max(oldest, g.t);
      if (g.y > g.floor - P + 1e-6) sunk.push(Math.round(g.y - g.floor));
      if (g.vy === 0 && g.y === g.floor - P) settled = true;
    }
  }
  return [
    ok(bought, 'a pod is sold on the pods\' board'),
    ok(oldest > 0.5, 'a chip thrown in the deep lives past the frame it was thrown', oldest.toFixed(2)),
    ok(settled, 'and one comes to rest on the floor'),
    ok(sunk.length === 0, 'and none sinks through it', sunk.slice(0, 5).join(', '))
  ];
}, { reload: false });
