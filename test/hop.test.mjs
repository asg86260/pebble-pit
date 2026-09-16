// The hop's target (DESIGN.md, "A hop between stations"): from a given
// view, the next standing station in a direction, sorted by where it stands
// -- never one behind the view's center, never one not yet bought -- and
// none at either end of the world. The glide itself is `lookAt`'s, so it is
// a cut under reduced motion like every other.

import { group, ok, run } from './helpers.mjs';
import { S } from '../src/state.js';
import { hopTarget } from '../src/hop.js';
import { STATIONS, standRect } from '../src/board.js';
import { setPref } from '../src/prefs.js';
import { lookAt } from '../src/world.js';

// Every standing station's middle, left to right, read the way the hop reads it.
const stands = () => STATIONS.map(k => ({ k, r: standRect(k) })).filter(s => s.r)
                             .map(s => ({ k: s.k, mid: s.r.x + s.r.w / 2 })).sort((a, b) => a.mid - b.mid);

// --- 1. the next one along ---------------------------------------------------------
group('the hop goes to the next standing station and never one behind', async () => {
  window.__crew(3, 3, 5, 7);
  window.__fullSites();
  run(0.5);
  const list = stands();
  const checks = [ok(list.length >= 4, 'several stations stand', `${list.length}: ${list.map(s => s.k).join(" ")}`)];
  // From a view centered a little left of each station, the hop right is
  // that station and the hop left is the one before it.
  for (let i = 0; i < list.length; i++) {
    const camX = list[i].mid - 30 - S.viewW / 2;
    const right = hopTarget(1, camX), left = hopTarget(-1, camX);
    checks.push(ok(right && right.key === list[i].k, `right of ${list[i].k} - 30 is ${list[i].k}`, right && right.key));
    const before = list[i - 1];
    checks.push(ok(before ? left && left.key === before.k : left === null,
                   `left of it is ${before ? before.k : 'nothing'}`, left && left.key));
  }
  return checks;
});

// --- 2. not one that is not there --------------------------------------------------
group('a station not yet bought is not a hop', async () => {
  window.__crew(2, 1);          // the house and, once raised, the bench; no grounds
  window.__give(200);
  run(0.5);
  const list = stands();
  const keys = new Set(list.map(s => s.k));
  const far = hopTarget(1, 0);
  const checks = [
    ok(!keys.has('quarry') && !keys.has('tower'), 'the quarry and the tower are not standing'),
  ];
  // Walk the hops from the left end to the right: every stop is a standing
  // station and the walk ends at the last one.
  let camX = 0, steps = 0, wrong = null;
  for (let t = hopTarget(1, camX); t && steps < 20; t = hopTarget(1, camX)) {
    if (!keys.has(t.key)) wrong = t.key;
    camX = t.mid - S.viewW / 2;
    steps++;
  }
  checks.push(ok(far !== null, 'from the far left there is something to hop to', `${far && far.key}`));
  checks.push(ok(wrong === null, 'every hop lands on a standing station', `${wrong}`));
  checks.push(ok(steps === list.filter(s => s.mid > S.viewW / 2 + 1).length, 'and the walk visits each once',
                 `${steps} hops for ${list.length} stations`));
  return checks;
});

// --- 3. the ends ---------------------------------------------------------------------
group('at either end of the world there is nothing that way', async () => {
  window.__crew(3, 3, 5, 7);
  window.__fullSites();
  run(0.5);
  const list = stands();
  const leftEnd = hopTarget(-1, list[0].mid - S.viewW / 2);
  const rightEnd = hopTarget(1, list[list.length - 1].mid - S.viewW / 2);
  return [
    ok(leftEnd === null, 'centered on the first station, no hop left', `${leftEnd && leftEnd.key}`),
    ok(rightEnd === null, 'centered on the last, no hop right', `${rightEnd && rightEnd.key}`),
  ];
});

// --- 4. the glide is lookAt's -------------------------------------------------------
group("the hop's glide is the yard's, and a cut under reduced motion", async () => {
  window.__crew(3, 3, 5, 7);
  window.__fullSites();
  run(0.5);
  window.__look(0);
  const to = hopTarget(1, 0);
  lookAt(to.mid);
  run(1 / 60);
  const gliding = S.camTo !== null && Math.abs(S.camX - (to.mid - S.viewW / 2)) > 1;
  setPref('motion', true);
  window.__look(0);
  lookAt(to.mid);
  const cut = S.camTo === null && Math.abs(S.camX - (to.mid - S.viewW / 2)) < 1;
  setPref('motion', null);
  return [
    ok(gliding, 'with motion on, the view is on its way after a frame'),
    ok(cut, 'with motion off, it is already there'),
  ];
});
