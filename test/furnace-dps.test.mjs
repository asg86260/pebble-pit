// The furnace's dps (deep/dps.js; DESIGN.md, "The furnace's dps"): every
// hit through `strike` is credited to whoever did it, a fighter's station, a
// bleed's class or the hand, and read back as damage a second over the last
// DPS_NOW_S, or the part of it since that one first hit. What a row says is what it did over the
// window; the total is the rows summed; nothing of it outlives a new game.
// How the hover draws it is the scene's (`furnace-dps`) and the browser's.

import { group, ok, yard } from './helpers.mjs';
import { PAIRS, CLASSES, DPS_NOW_S } from '../src/config.js';
import { sources, totalDps, nowWindow } from '../src/deep/dps.js';
import { lay } from '../src/deep/statuses.js';
import { clickDeep } from '../src/deep/serpent.js';
import { coilAt } from '../src/deep/place.js';
import { now } from '../src/clock.js';

const S = yard.S;
const KIND_OF = Object.fromEntries(Object.entries(PAIRS).flatMap(([kind, cs]) => cs.map(c => [c, kind])));
const near = (a, b) => Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(a), Math.abs(b));

// What the fight did, read off the numbers over the coil rather than the
// furnace's own books: every hit `strike` lands is in `S.hits`, a blow its
// own entry and a held thing's ticks summed into one, so what each entry
// grew by in a frame is what landed in it, credited to its weapon at that
// frame's clock. Frame by frame: `run`'s reload is the thing that throws the
// list away.
function watch(seconds) {
  const seen = new Map(), landed = [];
  for (let f = 0; f < seconds * 60; f++) {
    yard.fast(1 / 60);
    const t = now();
    for (const h of S.hits) {
      if (h.weapon === 'heal') continue;
      const grew = h.done - (seen.get(h) || 0);
      if (grew > 0) landed.push({ t, weapon: h.weapon, done: grew });
      seen.set(h, h.done);
    }
  }
  return landed;
}
const inWindow = (landed, weapon) => {
  const w = nowWindow();
  return landed.filter(l => l.weapon === weapon && l.t >= w.from && l.t < w.to).reduce((s, l) => s + l.done, 0);
};

function fight(classes) {
  window.__fullSites();
  window.__snatch({ played: true });
  window.__crew(0, 4);
  window.__deepCrew({ spare: 1 });
  window.__party({ stations: classes.map(cls => ({ kind: KIND_OF[cls], cls, rung: 4 })) });
  window.__serpent({ stage: 0, wound: 0 });
}

group("each fighter's dps is its damage over the window, and the total is their sum", async () => {
  fight(['brawler', 'ranger']);
  // Long enough to swim to the coil and fight a whole window past it.
  const landed = watch(30 + DPS_NOW_S);
  const rows = sources();
  const row = cls => rows.find(r => r.key === `st:${S.stations.find(st => st.cls === cls)?.id}`);
  const checks = [];
  for (const cls of ['brawler', 'ranger']) {
    const r = row(cls), did = inWindow(landed, CLASSES[cls].hit);
    checks.push(ok(r && did > 0, `the ${cls} has a row, and hit in the window`, JSON.stringify({ row: r && r.dps, did })));
    checks.push(ok(r && near(r.dps * r.secs, did), `the ${cls}'s dps times its seconds in the window is what it did there`,
                   JSON.stringify({ said: r && r.dps * r.secs, did })));
    checks.push(ok(r && r.name === CLASSES[cls].name, `the ${cls}'s row is named for its class`, r && r.name));
  }
  const sum = rows.reduce((s, r) => s + r.dps, 0);
  checks.push(ok(rows.every(r => r.secs === DPS_NOW_S), 'a minute and a half in, every row is read over the whole window',
                 JSON.stringify(rows.map(r => [r.key, r.secs]))));
  checks.push(ok(near(totalDps(), sum), 'the total is the rows summed', JSON.stringify({ total: totalDps(), sum })));
  return checks;
});

// A fighter come late is read over its own seconds in the window, not the
// whole of it: a third of a minute at the coil is that third's pace.
group('a fighter that joined inside the window reads at its own pace, not diluted by the window', async () => {
  fight(['brawler']);
  watch(DPS_NOW_S + 10);
  window.__party({ stations: [{ kind: KIND_OF.ranger, cls: 'ranger', rung: 4 }] });
  const landed = watch(25);
  const st = S.stations.find(x => x.cls === 'ranger');
  const r = sources().find(x => x.key === `st:${st?.id}`);
  const did = inWindow(landed, CLASSES.ranger.hit);
  const old = sources().find(x => x.key === `st:${S.stations.find(x => x.cls === 'brawler')?.id}`);
  return [
    ok(r && did > 0, 'the newcomer hit', JSON.stringify({ did })),
    ok(r && r.secs > 0 && r.secs < 25, 'its dps is taken over its own seconds since its first hit', JSON.stringify(r && r.secs)),
    ok(r && near(r.dps * r.secs, did), 'and is what it did over them', JSON.stringify({ said: r && r.dps * r.secs, did })),
    ok(r && r.dps > did / DPS_NOW_S * 1.5, 'well over what the whole window would make of it', JSON.stringify({ dps: r && r.dps, diluted: did / DPS_NOW_S })),
    ok(old && old.secs === DPS_NOW_S, 'the fighter there all along is read over the whole window', JSON.stringify(old && old.secs))
  ];
});

group("a bleed's tick, which names only its weapon, is its class's", async () => {
  fight([]);
  lay('bleed', 40, 4, 0, 'sword');
  const landed = watch(4 + DPS_NOW_S / 2);
  const r = sources().find(x => x.key === 'cls:sword');
  const did = inWindow(landed, 'sword');
  return [
    ok(did > 0, 'the bleed ticked in the window', String(did)),
    ok(r && r.name === CLASSES.sword.name, 'its ticks are a row named for the class that cuts with it', JSON.stringify(sources().map(x => x.key))),
    ok(r && near(r.dps * r.secs, did), "and the row's dps is what the ticks did", JSON.stringify({ said: r && r.dps * r.secs, did })),
    ok(!sources().some(x => x.key === 'you'), 'none of it is the hand\'s')
  ];
});

group('a click on the coil is "you"', async () => {
  fight([]);
  watch(1);
  const p = coilAt(0, now());
  const hit = clickDeep(p.x, p.y);
  const landed = watch(1.5);
  const r = sources().find(x => x.key === 'you');
  const did = inWindow(landed, 'punch');
  return [
    ok(hit && did > 0, 'the click landed', JSON.stringify({ hit, did })),
    ok(r && r.name === 'you', 'the hand has a row of its own', JSON.stringify(sources().map(x => [x.key, x.name]))),
    ok(r && near(r.dps * r.secs, did), "and the row's dps is what the click did", JSON.stringify({ said: r && r.dps * r.secs, did }))
  ];
});

group('the history clears with a new game', async () => {
  fight(['brawler']);
  watch(30);
  const had = sources().length, before = totalDps();
  window.__reset();
  return [
    ok(had > 0 && before > 0, 'the fight left a reading', JSON.stringify({ had, before })),
    ok(sources().length === 0 && totalDps() === 0, 'a new game starts it over', JSON.stringify({ rows: sources().length, total: totalDps() }))
  ];
});
