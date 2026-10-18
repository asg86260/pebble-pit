// Act 3's cloud floor (after/place.js, `floorProfile`; floor A of
// docs/mocks/act3-place-2026-10-18): the line every body stands on billows
// everywhere but under what is built on it. Pressed flat under the grove,
// every station's whole ground, the crowd and the stair, it once billowed in
// a tenth of its columns and read as flat. What is checked is the profile the
// drawing and the bodies both read; how it looks is the shot (`after-camp-art`,
// `after-crowd-mass`).
import { group, ok } from './helpers.mjs';
import { P, AFTER_W, AFTER_STATIONS } from '../src/config.js';
import { floorProfile, floorAt, afterFloor, afterX0, stationBox, stationDoor, crowdLip } from '../src/after/place.js';

group('the cloud floor billows everywhere but under what stands on it', async () => {
  const el = floorProfile(), cols = Math.ceil(AFTER_W / P);
  const raised = el.filter(v => v > 0).length;
  const col = x => Math.floor((x - afterX0()) / P);
  const underBuilt = Object.keys(AFTER_STATIONS).every(k => {
    const b = stationBox(k);
    for (let j = col(b.x); j < col(b.x + b.w); j++) if (el[j]) return false;
    return floorAt(stationDoor(k)) === afterFloor();
  });
  // God's crowd, which stands on the flat line behind the puffs' lip.
  const [l0, l1] = crowdLip(), crowd = el.slice(l0 + 2, l1 - 2);
  return [
    ok(raised / cols > 0.35, 'puffs rise along a good share of the floor', `${raised} of ${cols} columns`),
    ok(el.every(v => v >= 0 && v <= 2) && el.includes(1) && el.includes(2), 'one and two cells high, no more', `${[...new Set(el)].sort()}`),
    ok(underBuilt, 'flat under every station and level at its door'),
    ok(crowd.filter(v => v > 0).length > crowd.length / 2, "and it billows in front of God's crowd", crowd.join(''))
  ];
});
