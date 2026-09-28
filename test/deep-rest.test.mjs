// The deep's crew at rest (DESIGN.md, "The deep's crew at rest", D of the
// mocks): a body with nothing to do strolls, floats and hops about its
// station's ground, and the rest is its real position. Reached as a player
// does: a pod bought, its body gathering on a bare floor.

import { group, ok, yard, run, runUntil } from './helpers.mjs';
import { P, WORKER } from '../src/config.js';
import { deepBed } from '../src/state.js';
import { deepX0, deepX1 } from '../src/deep/place.js';
import { feet } from '../src/deep/arms.js';
import { restGround, restCeiling } from '../src/deep/rest.js';
import { stationX } from '../src/deep/classes.js';
import { bedX } from '../src/deep/scales.js';

const S = yard.S;
const frame = () => run(1 / 60);

// A deep with nobody fighting, so nothing sheds a scale, and one pod bought:
// its body comes out on the floor and gathers, and the floor is bare.
function podBody() {
  window.__fullSites();
  window.__snatch({ played: true });
  window.__deepCrew({ brawlers: 0 });
  window.__crew(0, 4);
  window.__scales(1000);
  window.__buy('pod');
  window.__finish();
  const g = restGround('crusher');
  runUntil(() => { const w = pod(); return w.x >= g.lo && w.x <= g.hi && w.goal === 'rest'; }, 60);
  return g;
}

// Found again every time: a reload (the harness's every five seconds, or a
// check's own) stands up new bodies.
const pod = () => S.workers.find(o => o.deepHome && o.type === 'gatherer');
const guard = () => S.workers.find(o => o.station === 's1') || S.workers.find(o => o.name === S.stations[0].fighter);

const upOff = h => {
  for (let f = 0; f < 60 * 120; f++) { frame(); if (pod().y < feet() - h) return true; }
  return false;
};

group('a gatherer on a bare floor rests: it moves, on its ground, over the floor and under the ceiling', async () => {
  const g = podBody();
  let w = pod();
  const bare = deepBed.n === 0 && w.goal === 'rest';
  let x0 = Infinity, x1 = -Infinity, top = Infinity, low = -Infinity, off = 0, unheld = 0, jump = 0;
  let px = w.x, py = w.y;
  for (let f = 0; f < 60 * 60; f++) {
    frame();
    // A body just read back has not had a frame to be stamped yet.
    const same = w === pod();
    w = pod();
    x0 = Math.min(x0, w.x); x1 = Math.max(x1, w.x);
    top = Math.min(top, w.y); low = Math.max(low, w.y);
    if (w.y < feet() - P) { off++; if (same && w.aboardAt !== S.tick) unheld++; }
    jump = Math.max(jump, Math.hypot(w.x - px, w.y - py));
    px = w.x; py = w.y;
  }
  return [
    ok(bare, 'the pod\'s body is at rest on a bare floor', `${deepBed.n} lying`),
    ok(x1 - x0 > P * 3, 'it strolls about', `${Math.round(x0)}..${Math.round(x1)}`),
    ok(off > 60, 'and leaves the floor, floating or hopping', `${off} frames up`),
    ok(x0 >= g.lo && x1 <= g.hi, "never off its station's ground", `${Math.round(x0)}..${Math.round(x1)} in ${Math.round(g.lo)}..${Math.round(g.hi)}`),
    ok(x0 >= deepX0() && x1 + WORKER <= deepX1(), 'inside the deep'),
    ok(low <= feet() && top >= restCeiling(), 'never under the floor nor over the ceiling',
       `top ${Math.round(top)} (ceiling ${restCeiling()}), low ${Math.round(low)} (feet ${feet()})`),
    ok(unheld === 0, 'held up by the water on every frame it is off the floor', `${unheld} frames`),
    ok(jump < P, 'and it never pops', `${jump.toFixed(2)}px in a frame at most`)
  ];
});

group('called to work mid-float, it goes straight from where it is', async () => {
  podBody();
  const up = upOff(P * 3);
  let w = pod();
  const from = { x: w.x, y: w.y };
  window.__looseScales(200);
  const grew = [];
  let rose = 0, py = w.y, pd = null, pc = null, got = false;
  for (let f = 0; f < 60 * 30 && !got; f++) {
    frame();
    w = pod();
    got = w.goal === 'scoop';
    if (w.y < py - 1e-6) rose++;
    py = w.y;
    if (!(w.col >= 0)) { pd = null; continue; }
    const d = Math.hypot(bedX(w.col) - WORKER / 2 - w.x, feet() - w.y);
    if (pd != null && pc === w.col && d > pd + 1e-6) grew.push(`${f}: ${pd.toFixed(1)} -> ${d.toFixed(1)}`);
    pd = d; pc = w.col;
  }
  return [
    ok(up, 'it was off the floor when the scales came', `${Math.round(feet() - from.y)}px up`),
    ok(got, 'and reached them and scooped', `goal ${w.goal}`),
    ok(grew.length === 0, 'the distance only ever shrank on the way', grew.slice(0, 4).join(', ')),
    ok(rose === 0, 'and it never went up first', `${rose} frames rising`)
  ];
});

group('a reload mid-float leaves it where it was, and it sinks from there', async () => {
  podBody();
  const up = upOff(P * 4);
  const w = pod();
  const at = { x: w.x, y: w.y };
  window.__reload();
  let b = pod();
  const kept = Math.abs(b.x - at.x) < 1 && Math.abs(b.y - at.y) < 1;
  let rose = 0, py = b.y, landed = false, jump = 0, px = b.x;
  for (let f = 0; f < 60 * 20 && !landed; f++) {
    frame();
    b = pod();
    if (b.y < py - 1e-6) rose++;
    jump = Math.max(jump, Math.hypot(b.x - px, b.y - py));
    py = b.y; px = b.x;
    landed = b.y >= feet();
  }
  return [
    ok(up, 'it was floating when the yard was saved', `${Math.round(feet() - at.y)}px up`),
    ok(kept, 'and read back in the water where it was', `${Math.round(at.x)},${Math.round(at.y)} -> ${Math.round(b.x)},${Math.round(b.y)}`),
    ok(landed && rose === 0, 'then sank to the floor without rising', `landed ${landed}, ${rose} frames rising`),
    ok(jump < P, 'slowly, never a snap', `${jump.toFixed(2)}px in a frame at most`)
  ];
});

// Its ground is its station's, wherever on the floor that stands: the rest
// is asked of the station's middle, not of a named spot.
group("a fighter whose station has no class yet stands guard, resting about the station's ground", async () => {
  window.__fullSites();
  window.__snatch({ played: true });
  if (window.__party) window.__party({ stations: [{ kind: 'altar', cls: null, rung: 0 }] });
  else {
    // until merge: a weapon crew's body stands in for the fighter (deep/arms.js)
    window.__crew(0, 4);
    window.__deepCrew({ brawlers: 1 });
    const body = S.workers.find(w => w.type === 'brawler');
    S.stations = [{ id: 's1', kind: 'altar', slot: 2, built: true, cls: null, rung: 0, paid: [], fighter: body.name }];
    S.stationsBuilt = 1;
  }
  const g = restGround(stationX(S.stations[0]));
  runUntil(() => { const w = guard(); return w.goal === 'guard' && w.x >= g.lo && w.x <= g.hi; }, 90);
  let w = guard();
  let x0 = Infinity, x1 = -Infinity, off = 0;
  for (let f = 0; f < 60 * 40; f++) {
    frame();
    w = guard();
    x0 = Math.min(x0, w.x); x1 = Math.max(x1, w.x);
    if (w.y < feet() - P) off++;
  }
  return [
    ok(w.goal === 'guard', 'the fighter stands guard', `goal ${w.goal}`),
    ok(x1 - x0 > P * 2 || off > 0, 'and not dead still', `${Math.round(x0)}..${Math.round(x1)}, ${off} frames up`),
    ok(x0 >= g.lo && x1 <= g.hi, "on its station's ground", `${Math.round(x0)}..${Math.round(x1)} in ${Math.round(g.lo)}..${Math.round(g.hi)}`),
    ok(S.serpentWound === 0, 'and strikes nothing', `${S.serpentWound}`)
  ];
});

