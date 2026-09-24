// Reading the fight: what the sim keeps for the numbers over the coil
// (DESIGN.md, "Reading the fight"). A blow a body brought puts its damage in
// the recent list, the list empties by itself, nothing of it is saved, a held
// weapon says a second's sum and the heal says what it closed once a second.
// Whether the digits look right is the scene's (`deep-numbers`), not this.

import { group, ok, yard } from './helpers.mjs';
import { NUM_LIFE_S, NUM_HEAL_LIFE_S, NUM_HELD_S, NUM_HEAL_EVERY_S, SERPENT_DEFENSE,
         SERPENT_HEAL, DOT_TICK_S, rungValue } from '../src/config.js';
import { EPHEMERAL } from '../src/state.js';

const S = yard.S;

// The serpent come for and the fight set, and `spare` of the deep's own
// hands waiting on no weapon, so a weapon is manned the player's way: off the
// roster (`__assign`), the body walking from the crusher to its station.
function fight(spare = 1, stage = 0, wound = 0) {
  window.__snatch({ played: true });
  window.__serpent({ stage, wound });
  window.__crew(0, 12);
  window.__deepCrew({ brawlers: 0, lancers: 0, grenadiers: 0, scribes: 0, warlocks: 0, spare });
}
// Frame by frame, and never through `run`: its reload every five seconds is
// exactly the thing that throws the list away.
function frames(s, each = () => {}) {
  for (let f = 0; f < s * 60; f++) { yard.fast(1 / 60); if (each() === true) return true; }
  return false;
}
const of = w => S.hits.filter(h => h.weapon === w);

group('a punch puts its damage in the recent list, and the list empties by itself', async () => {
  fight(1);
  window.__assign('brawlers', 1);
  let first = null;
  frames(90, () => { first = of('punch')[0]; return !!first; });
  const worth = rungValue('punch', S.punchLevel) * SERPENT_DEFENSE.punch[0];
  const said = first && { done: first.done, x: first.x, y: first.y };
  // The brawler off the coil, and the wound let heal shut: after that
  // nothing strikes and nothing closes, so the list has nothing to keep.
  window.__assign('brawlers', -1);
  window.__serpent({ stage: 0, wound: 0 });
  frames(Math.max(NUM_LIFE_S, NUM_HEAL_LIFE_S) + 2 * NUM_HEAL_EVERY_S + 1);
  return [
    ok(first, 'a brawler at the coil puts a punch in the recent hits'),
    ok(said && Math.abs(said.done - worth) < 1e-9, "the hit carries the blow's damage", JSON.stringify({ said, worth })),
    ok(said && Number.isFinite(said.x) && Number.isFinite(said.y), 'and where it landed'),
    ok(S.hits.length === 0, 'the list empties by itself once the numbers have faded',
       JSON.stringify(S.hits.map(h => h.weapon)))
  ];
});

group('the recent hits are never saved', async () => {
  fight(1);
  window.__assign('brawlers', 1);
  const had = frames(90, () => S.hits.length > 0);
  window.__reload();
  const raw = localStorage.getItem('boulder-clicker/v4') || '';
  return [
    ok(had, 'there were hits to lose'),
    ok(['hits', 'healSum', 'healAt'].every(k => EPHEMERAL.includes(k)), 'the fields are ephemeral'),
    ok(raw.length > 0 && raw.includes('"serpentWound"'), 'a save was written', raw.length),
    ok(!/"(hits|healSum|healAt)"/.test(raw), 'and it carries none of them')
  ];
});

group('a lance says its bleed once a second, not a number a tick', async () => {
  fight(1);
  window.__assign('lancers', 1);
  const seen = new Map();
  frames(60, () => { for (const h of of('lance')) seen.set(h, h.done); });
  const tick = rungValue('lance', S.lanceLevel) * DOT_TICK_S * SERPENT_DEFENSE.lance[0];
  const per = NUM_HELD_S / DOT_TICK_S;                  // ticks in a said second
  const sums = [...seen.keys()].map(h => Math.round(h.done / tick));
  const full = sums.filter(n => n === per).length;
  return [
    ok(seen.size > 2, 'a stuck lance is said, more than once', seen.size),
    ok([...seen.keys()].every(h => Math.abs(h.shut - h.at - NUM_HELD_S * 1000) < 1e-6),
       'each is said when its second is up'),
    ok(full >= sums.length / 2 && sums.every(n => n >= 1 && n <= per + 1),
       "a said second is that second's ticks summed", JSON.stringify(sums))
  ];
});

group('the heal says what it closed, once a second, in its own entries', async () => {
  // The ward's heal on a wound deep enough not to close in the watch, and no
  // weapon on it: every entry is the heal's.
  fight(0, 1, 400);
  const said = [];
  frames(6.5, () => { for (const h of of('heal')) if (!said.includes(h)) said.push(h); });
  const gaps = said.slice(1).map((h, i) => Math.round(h.at - said[i].at));
  const each = SERPENT_HEAL[1] * NUM_HEAL_EVERY_S;
  return [
    ok(said.length >= 5 && said.length <= 7, 'about one a second', said.length),
    ok(gaps.every(g => Math.abs(g - NUM_HEAL_EVERY_S * 1000) <= 20), 'a second apart', JSON.stringify(gaps)),
    // The first second is on the heal's own clock, begun before the ward was
    // set, so it is part of one; every one after is whole.
    ok(said.slice(1).every(h => Math.abs(h.done - each) < 0.5), "each the wound the heal closed in its second",
       JSON.stringify(said.map(h => h.done.toFixed(2)))),
    ok(S.hits.every(h => h.weapon === 'heal'), 'and nothing else struck')
  ];
});
