// Act 3's cloud floor (after/place.js, `floorProfile`; floor A of
// docs/mocks/act3-place-2026-10-18): the line every body stands on billows
// everywhere but under what is built on it. Pressed flat under the grove,
// every standing station's whole ground, the crowd and the stair, it once
// billowed in a tenth of its columns and read as flat. A station nobody has
// ordered is open floor (the owner, 2026-10-18): its spot billows like any
// other until it is bought on the shack. Between the flats it rises in
// rolling swells (the owner, 2026-10-22), its puffs kept only in front of
// God's crowd. What is checked is the profile the drawing and the bodies
// both read; how it looks is the shot (`after-site-empty`, `after-site-pile`,
// `after-crowd-mass`).
import { group, ok, run, yard } from './helpers.mjs';
import { P, AFTER_W, AFTER_STATIONS, AFTER_CAMP_GAP, AFTER_SWELL_TOP } from '../src/config.js';
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
  const raised = el.filter(v => v > 0).length, [c0] = crowdLip(), camp = el.slice(0, c0);
  const standing = Object.keys(AFTER_STATIONS).filter(sited);
  // God's crowd, which stands on the flat line behind the puffs' lip.
  const [l0, l1] = crowdLip(), crowd = el.slice(l0 + 2, l1 - 2);
  window.__actsOn(null);
  return [
    // every station stands from the start, closed or built, and the grove's
    // whole floor is pressed flat for its fallen trees and logs
    ok(raised / cols > 0.15, 'the floor rises along a good share of it', `${raised} of ${cols} columns`),
    ok(Math.max(...camp) >= 3 && camp.every(v => v >= 0 && v <= AFTER_SWELL_TOP), 'the camp\'s swells rise a few cells, never past the tallest', `${[...new Set(camp)].sort()}`),
    ok(el.slice(c0).every(v => v <= 2), 'the puffs in front of God\'s crowd one or two cells high', `${[...new Set(el.slice(c0))].sort()}`),
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

group('a member walking the camp keeps its feet on the swells, up and down them', async () => {
  window.__actsOn(true);
  S.after = null;
  window.__goPlace('after');
  run(1);
  window.__afterCrowd((i, v) => (i < 4 ? 8 : v));
  window.__afterGrant({ rebel: 5000 });
  window.__buy('after-recruit');
  run(20);
  let off = 0, risen = 0, frames = 0;
  const [c0] = crowdLip();
  // A woodcutter sent from the podium to the grove crosses the whole camp.
  window.__afterPress('woodcutter', 1);
  for (let t = 0; t < 60; t += 1 / 60) {
    run(1 / 60);
    for (const w of S.after.bodies) {
      if (w.state !== 'work' || w.pair != null || col(w.x) >= c0) continue;
      frames++;
      if (Math.abs(w.y - floorAt(w.x)) > 0.5) off++;
      if (afterFloor() - w.y >= 2 * P) risen++;
    }
  }
  window.__actsOn(null);
  return [ok(frames > 0 && off === 0 && risen > 0, 'every member on the floor stands on the ground under it, raised on a swell where there is one', `${off} off of ${frames}, ${risen} risen`)];
});
