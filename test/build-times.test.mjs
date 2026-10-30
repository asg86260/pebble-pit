// How long anything takes to build (the owner, 2026-10-29: "30 seconds should
// be the absolute max... most things should just cost 10-20 seconds").
//
// One rule in works.js (`workFor`) puts every row on a band by its place in
// its own progression, so the checks are about the rule, over every row on
// every board, climbed rung by rung: nothing under the floor, nothing over the
// cap, most of them inside the ordinary band, and a dearer rung never faster
// than the one before it.

import { group, ok, run, yard } from './helpers.mjs';
import { BUILD_MIN_S, BUILD_MAX_S, BUILD_CAP_S } from '../src/config.js';

group('every build runs between the floor and the cap, and climbs', async () => {
  window.__reset();
  window.__grant({ dust: 1e9, spores: 1e9, shards: 1e9, sparks: 1e6 });
  run(1);
  const rows = window.__climbed().filter(r => r.works.some(w => w > 0));
  const all = rows.flatMap(r => r.works.filter(w => w > 0));
  const over = rows.filter(r => r.works.some(w => w > BUILD_CAP_S));
  const under = rows.filter(r => r.works.some(w => w > 0 && w < BUILD_MIN_S));
  const slower = rows.filter(r => r.works.some((w, i) => i && w < r.works[i - 1]));
  const ordinary = all.filter(w => w <= BUILD_MAX_S).length / all.length;
  return [
    ok(rows.length > 40, 'a good many rows take time', String(rows.length)),
    ok(over.length === 0, `nothing takes more than ${BUILD_CAP_S}s`, over.map(r => `${r.key} ${r.works}`).join('; ')),
    ok(under.length === 0, `and nothing less than ${BUILD_MIN_S}s`, under.map(r => `${r.key} ${r.works}`).join('; ')),
    ok(slower.length === 0, 'a dearer rung is never quicker than a cheaper one on the same ladder',
       slower.map(r => `${r.key} ${r.works}`).join('; ')),
    ok(ordinary >= 0.75, `most builds are inside ${BUILD_MIN_S}-${BUILD_MAX_S}s`, ordinary.toFixed(2))
  ];
});
