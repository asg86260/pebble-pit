// The gates table (DESIGN.md, "Beats and gates: one table each"): every
// station is a row in `STATIONS` (stations.js), and when the bench may offer
// its door is that row's `after` and `needs`, read through `offered`. A door
// row with a predicate of its own is the old shape, and this is the check
// that none has come back: every door's gate is `offered` of its own key and
// nothing else, a door whose `after` is shut is not offered whatever `needs`
// says, and the pointer finds every standing station by its ground.

import { group, ok, run, yard } from './helpers.mjs';
import { STATIONS, station, open, offered, standRect, stationAt } from '../src/stations.js';
import { UPGRADES } from '../src/upgrades.js';
import { TOWER_UPGRADES } from '../src/tower.js';

const S = () => yard.S;
const keys = STATIONS.map(r => r.key);
const doors = STATIONS.filter(r => r.stand);
const shields = STATIONS.filter(r => !r.stand);

// The row on a board that opens a station: `unlock<key>` on the bench for a
// door, the shield's own key for a shield (the dome's is on the tower).
const rowFor = key => [...UPGRADES, ...TOWER_UPGRADES].find(u => u.key === (station(key).stand ? 'unlock' + key : key));
// The gate a board asks: `once` for a sticky row (`revealed` in shop.js holds
// it), `show` for the rest.
const gateOf = u => (u.once || u.show)();
const shown = key => !!window.__rows().find(r => r.key === rowFor(key).key && r.shown);

group('the table is acyclic and every after names a row', async () => {
  window.__reset();
  const bad = [];
  for (const r of STATIONS) for (const a of r.after) if (!keys.includes(a)) bad.push(`${r.key} after ${a}`);
  // Every row reachable from itself through `after` is a cycle.
  const reaches = (from, to, seen = new Set()) =>
    station(from).after.some(a => a === to || (!seen.has(a) && seen.add(a) && reaches(a, to, seen)));
  const loops = keys.filter(k => reaches(k, k));
  // Every shield stands before exactly one door: `shieldBefore` reads it.
  const before = shields.filter(r => r.after.filter(k => station(k)?.stand).length > 1).map(r => r.key);
  return [
    ok(bad.length === 0, 'every after names a row', bad.join('; ')),
    ok(loops.length === 0, 'no door waits on itself', loops.join(',')),
    ok(before.length === 0, 'a shield stands before one door at most', before.join(',')),
    ok(keys.length === new Set(keys).size, 'no key twice', keys.join(','))
  ];
});

group('every door row and every shield row is gated by offered and nothing else', async () => {
  const out = [];
  const same = when => {
    for (const r of STATIONS) {
      const u = rowFor(r.key);
      if (!u) continue;                              // nobody sells the house, the books or the bench
      out.push(ok(gateOf(u) === offered(r.key), `${u.key} reads offered(${r.key}) ${when}`,
                  `${gateOf(u)} vs ${offered(r.key)}`));
    }
  };
  window.__reset();
  run(1);
  same('on a fresh yard');
  window.__fullSites();
  window.__crew(2, 2, 1, 1);
  window.__grant({ cores: 30, dust: 900000, spores: 90000, shards: 90000 });
  run(1);
  same('with the grounds open');
  // and every door there is, the shields answered, so the retired side of
  // every gate is read too
  for (const r of doors) S()[r.key + 'Open'] = true;
  S().seenBench = true; S().banked = 1;
  window.__answered(...shields.map(r => r.key));
  run(1);
  same('with every door open');
  const sold = STATIONS.filter(r => rowFor(r.key)).length;
  out.push(ok(sold >= 11, 'the doors and the shields all have a row', String(sold)));
  return out;
});

// Meeting a door's `needs` and nothing else -- the setup the check is not
// about, so it is hooks and facts on S; the reading is the row on the board.
const MEET = {
  casino: () => { S().boulderNo = 2; },
  quarry: () => { window.__grant({ cores: 3 }); },
  apothecary: () => { window.__grant({ spores: 3 }); },
  tower: () => { window.__grant({ cores: 3 }); },
  net: () => {},
  arch: () => {},
  dome: () => { S().wizardHats = 1; }
};
// Opening one of the doors before it.
const OPEN = key => station(key).stand ? (S()[key + 'Open'] = true) : window.__answered(key);

group('a door whose after is shut is not offered, whatever needs says', async () => {
  const out = [];
  for (const r of STATIONS.filter(r => r.after.length && MEET[r.key])) {
    for (const shut of r.after) {
      window.__reset();
      window.__crew(2, 3);
      MEET[r.key]();
      // every other door before it open, so the one shut is what is read
      for (const a of r.after) if (a !== shut) OPEN(a);
      run(1);
      out.push(ok(!open(shut), `${shut} is shut`),
               ok(!shown(r.key), `${r.key} is not on the board with ${shut} shut`,
                  `needs ${r.needs()}`));
      OPEN(shut);
      run(1);
      out.push(ok(shown(r.key), `and is once ${shut} opens`, `needs ${r.needs()} open ${open(r.key)}`));
    }
  }
  return out;
});

group('the pointer finds every standing station by its ground, and nothing else', async () => {
  window.__reset();
  const out = [];
  // A place that does not stand has no ground (the house does: a new yard
  // has its one body).
  for (const r of doors.filter(r => !open(r.key)))
    out.push(ok(standRect(r.key) === null, `${r.key} has no ground before it stands`));
  out.push(ok(stationAt(S().cx, S().groundY - 10) === null, 'the rock is not a station'));
  // Everything stands.
  window.__crew(2, 2, 1, 1);
  window.__shack();
  for (const r of doors) if (r.key !== 'house' && r.key !== 'stats') S()[r.key + 'Open'] = true;
  S().snatched = true;                           // the altar stands from the snatch, not a flag of its own
  S().seenBench = true; S().banked = 1;
  run(1);
  for (const r of doors) {
    const g = standRect(r.key);
    if (!g) { out.push(ok(false, `${r.key} stands`)); continue; }
    const at = stationAt(g.x + g.w / 2, g.y + g.h / 2);
    out.push(ok(at === r.key, `the middle of ${r.key}'s ground is ${r.key}`, `${at} ${JSON.stringify(g)}`));
  }
  out.push(ok(stationAt(S().cx, -5000) === null, 'the sky is nowhere'));
  return out;
});
