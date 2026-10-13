// Reading the fight: what the sim keeps for the numbers over the coil
// (DESIGN.md, "Reading the fight"). A blow a fighter brought puts its damage
// in the recent list, the list empties by itself, nothing of it is saved, a
// held beam says a second's sum and the heal says what it closed once a
// second. Whether the digits look right is the scene's (`deep-numbers`), not
// this.

import { group, ok, yard } from './helpers.mjs';
import { guardOf } from '../src/deep/phases.js';
import { NUM_LIFE_S, NUM_HEAL_LIFE_S, NUM_HELD_S, SERPENT_WINDOW,
         DOT_TICK_S, CLASSES } from '../src/config.js';
import { EPHEMERAL } from '../src/state.js';
import { climb, openEveryClass } from './party-press.mjs';
import { rungWorth } from '../src/deep/classes.js';

const S = yard.S;

// The serpent come for and the fight set, and a station of `kind` with `cls`
// bought on its rail to `rung`, its fighter at it.
function fight(kind, cls, rung = 1, stage = 0, wound = 0) {
  window.__snatch({ played: true });
  window.__serpent({ stage, wound });
  window.__party({ stations: [{ kind, cls: null, rung: 0 }] });
  openEveryClass();
  return climb(S.stations[0].id, cls, rung);
}
// Frame by frame, and never through `run`: its reload every five seconds is
// exactly the thing that throws the list away.
function frames(s, each = () => {}) {
  for (let f = 0; f < s * 60; f++) { yard.fast(1 / 60); if (each() === true) return true; }
  return false;
}
const of = w => S.hits.filter(h => h.weapon === w);

group("a Brawler's punch puts its damage in the recent list, and the list empties by itself", async () => {
  fight('altar', 'brawler', 1);
  let first = null;
  frames(60, () => { first = of('brawler')[0]; return !!first; });
  const worth = rungWorth(CLASSES.brawler, 1) * guardOf('brawler');
  const said = first && { done: first.done, x: first.x, y: first.y };
  // Watched past every number's life: each hit leaves the list by itself.
  // (The station goes on striking, its base unit or its class: a built
  // station always fights, so the list is never empty for long.)
  const life = Math.max(NUM_LIFE_S, NUM_HEAL_LIFE_S) + 3;
  const had = new Set(S.hits);
  frames(life);
  return [
    ok(first, 'a Brawler at the coil puts a punch in the recent hits'),
    ok(said && Math.abs(said.done - worth) < 1e-9, "the hit carries the blow's damage", JSON.stringify({ said, worth })),
    ok(said && Number.isFinite(said.x) && Number.isFinite(said.y), 'and where it landed'),
    ok(had.size > 0 && S.hits.every(h => !had.has(h)), 'every hit leaves the list by itself once its number has faded',
       `${S.hits.filter(h => had.has(h)).length} of ${had.size} left`)
  ];
});

// Every blow is its own splat: a Martial Artist's thrusts land half a second
// apart on one spot, faster than a number is gone, and none is summed into
// the one before.
group('each blow is a number of its own, never summed into the last', async () => {
  fight('well', 'martial', 4);
  const seen = new Set();
  frames(12, () => { for (const h of of('martial')) seen.add(h); });
  const worth = rungWorth(CLASSES.martial, 4) * guardOf('martial');
  const list = [...seen].sort((a, b) => a.at - b.at);
  // a thrust says one thrust; the finisher its own blow, the biggest there is
  const fin = Math.max(...list.map(h => h.done));
  const close = list.slice(1).filter((h, i) => h.at - list[i].at < NUM_LIFE_S * 1000).length;
  return [
    ok(list.length >= 6, 'the thrusts are said', list.length),
    ok(close >= 3, "and several land while the last one's number is still up", close),
    ok(list.every(h => Math.abs(h.done - worth) < 1e-9 || h.done === fin) && list.filter(h => Math.abs(h.done - worth) < 1e-9).length >= 6,
       'each thrust says one thrust, never a sum of two',
       JSON.stringify(list.map(h => +h.done.toFixed(2))))
  ];
});

group('the recent hits are never saved', async () => {
  fight('altar', 'brawler', 1);
  const had = frames(60, () => S.hits.length > 0);
  window.__reload();
  const raw = localStorage.getItem('boulder-clicker/v4') || '';
  return [
    ok(had, 'there were hits to lose'),
    ok(['hits', 'mealLandedAt'].every(k => EPHEMERAL.includes(k)), 'the fields are ephemeral'),
    ok(raw.length > 0 && raw.includes('"serpentWound"'), 'a save was written', raw.length),
    ok(!/"(hits|mealLandedAt)"/.test(raw), 'and it carries none of them')
  ];
});

group("a Mage's beam says its ticks once a second, not a number a tick", async () => {
  // The fading coil, whose depth one Mage never reaches: nothing breaks.
  fight('spire', 'mage', 1, 3);
  const seen = new Map();
  frames(12, () => { for (const h of of('mage')) if (h.key) seen.set(h, h.done); });
  const tick = rungWorth(CLASSES.mage, 1) * DOT_TICK_S * guardOf('mage');
  const per = NUM_HELD_S / DOT_TICK_S;                  // ticks in a said second
  const sums = [...seen.keys()].map(h => Math.round(h.done / tick));
  const full = sums.filter(n => n === per).length;
  return [
    ok(seen.size > 2, 'a held beam is said, more than once', seen.size),
    ok([...seen.keys()].every(h => Math.abs(h.shut - h.at - NUM_HELD_S * 1000) < 1e-6),
       'each is said when its second is up'),
    ok(full >= sums.length / 2 && sums.every(n => n >= 1 && n <= per + 1),
       "a said second is that second's ticks summed", JSON.stringify(sums))
  ];
});

group('the heal says what a meal closed, once a meal, in its own entry', async () => {
  // The bare phase, wounded and a fresh window, nobody fighting: the one
  // entry is the meal's, the whole wound.
  // The snatch's facts with no station: played, it stands the first one
  // with her fighting at it, and her blows would be in every number here.
  window.__deepCrew();
  S.portalOpen = true;
  window.__serpent({ stage: 0, wound: 1234 });
  S.mealT = 0; S.mealI = null;
  const said = [];
  frames(SERPENT_WINDOW[0] * 2 + 50, () => { for (const h of of('heal')) if (!said.includes(h)) said.push(h); });
  return [
    ok(said.length === 1, 'a number for the meal, and none for the meals after with nothing to close', said.length),
    ok(said[0] && Math.abs(said[0].done - 1234) < 1e-6, 'the whole wound', JSON.stringify(said.map(h => h.done))),
    ok(S.hits.every(h => h.weapon === 'heal'), 'and nothing else struck')
  ];
});

// A big number is said short, the way the yard's HUD says it (`fmt`), in
// glyphs the font has: the mock's samples (docs/mocks/deep-number-glyphs-2026-10-13.html).
group('the deep says a big number as the HUD does, every character of it drawn', async () => {
  const { sayNum, drawable, widthOf } = await import('../src/render/numfont.js');
  const { fmt } = await import('../src/words.js');
  const SAMPLES = [9, 75, 999, 1000, 1234, 18420, 181432, 1965763, 21600000];
  const said = SAMPLES.map(sayNum);
  return [
    ok(said.every((s, i) => s === fmt(SAMPLES[i])), 'sayNum is fmt over the samples', said.join(' ')),
    ok(said.join(' ') === '9 75 999 1k 1.2k 18.4k 181k 2m 21.6m', 'and reads 1.2k, 181k, 2m, 21.6m', said.join(' ')),
    ok(said.every(s => drawable('+' + s) === '+' + s), 'the font has a glyph for every character', said.join(' ')),
    // m five wide, the point one and set tight: 4+1+1+4+1+4 and 4+1+5.
    ok(widthOf('2.1k', 1) === 15 && widthOf('2m', 1) === 10, 'each glyph is its own width, the point tight',
       `${widthOf('2.1k', 1)} ${widthOf('2m', 1)}`)
  ];
});
