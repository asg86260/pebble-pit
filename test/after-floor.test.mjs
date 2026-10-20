// Act 3's cloud floor (after/place.js, `floorProfile`; floor A of
// docs/mocks/act3-place-2026-10-18): the line every body stands on billows
// everywhere but under what is built on it. Pressed flat under the grove,
// every standing station's whole ground, the crowd and the stair, it once
// billowed in a tenth of its columns and read as flat. A station nobody has
// ordered is open floor (the owner, 2026-10-18): its spot billows like any
// other until it is bought on the shack. What is checked is the profile the
// drawing and the bodies both read; how it looks is the shot
// (`after-site-empty`, `after-site-pile`, `after-crowd-mass`).
import { group, ok, run, yard } from './helpers.mjs';
import { P, AFTER_W, AFTER_STATIONS, AFTER_CAMP_GAP } from '../src/config.js';
import { floorProfile, floorAt, afterFloor, afterX0, stationBox, stationDoor, stationX0, crowdLip, ART, sited } from '../src/after/place.js';

const S = yard.S;
const col = x => Math.floor((x - afterX0()) / P);
const flatUnder = k => {
  const el = floorProfile(), b = stationBox(k);
  for (let j = col(b.x); j < col(b.x + b.w); j++) if (el[j]) return false;
  return floorAt(stationDoor(k)) === afterFloor();
};

group('the cloud floor billows everywhere but under what stands on it', async () => {
  window.__actsOn(true);
  S.after = null;
  window.__goPlace('after');
  run(1);
  const el = floorProfile(), cols = Math.ceil(AFTER_W / P);
  const raised = el.filter(v => v > 0).length;
  const standing = Object.keys(AFTER_STATIONS).filter(sited);
  // God's crowd, which stands on the flat line behind the puffs' lip.
  const [l0, l1] = crowdLip(), crowd = el.slice(l0 + 2, l1 - 2);
  window.__actsOn(null);
  return [
    // every station stands from the start, closed or built, its ground pressed flat
    ok(raised / cols > 0.2, 'puffs rise along a good share of the floor', `${raised} of ${cols} columns`),
    ok(el.every(v => v >= 0 && v <= 2) && el.includes(1) && el.includes(2), 'one and two cells high, no more', `${[...new Set(el)].sort()}`),
    ok(standing.length >= 2 && standing.every(flatUnder), 'flat under every station standing and level at its door', standing.join(' ')),
    ok(crowd.filter(v => v > 0).length > crowd.length / 2, "and it billows in front of God's crowd", crowd.join(''))
  ];
});

group('an unbuilt station stands closed on flat ground; bought on the shack, its ground stays flat', async () => {
  window.__actsOn(true);
  S.after = null;
  window.__goPlace('after');
  run(1);
  window.__grant({ dust: 40000, spores: 5000, shards: 2000, sparks: 400 });
  window.__afterGrant({ rebel: 400 });
  const five = ['mill', 'chipper', 'papermill', 'workshop', 'press'];
  const standing = five.filter(k => sited(k) && flatUnder(k));
  const bought = window.__buy('after-build-mill');
  run(0.5);
  const pressed = flatUnder('mill');
  window.__actsOn(null);
  return [
    ok(standing.length === five.length, 'each unbuilt station stands closed on flat ground', standing.join(' ')),
    ok(bought && pressed, 'ordered, the saw mill\'s ground goes flat at once, level at its door')
  ];
});

group('the stations stand about a station\'s width apart, never closer than the least gap', async () => {
  const keys = Object.keys(AFTER_STATIONS);
  const gaps = keys.slice(1).map((k, i) => {
    const a = keys[i], end = stationX0(a) + ART[a].ground * P;
    return { a, b: k, gap: (stationX0(k) - end) / P, wide: Math.round((ART[a].box[1] + ART[k].box[1]) / 2) };
  });
  return [
    ok(gaps.every(g => g.gap >= AFTER_CAMP_GAP), `at least ${AFTER_CAMP_GAP} cells of open floor between neighbors`, JSON.stringify(gaps)),
    ok(gaps.every(g => g.gap >= Math.min(g.wide, AFTER_CAMP_GAP * 3) - 1), 'about one station\'s width', JSON.stringify(gaps))
  ];
});
