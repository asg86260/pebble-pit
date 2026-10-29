// One crew, two homes (DESIGN.md, "One crew, two homes: pods in the deep").
// A pod is bought in scales and adds a body who lives down there; a station's
// fighter is one of the deep's residents, never a yard hand; and a gatherer
// stood down with a load drops it in the deep, not in the yard. A station is
// bought off the floating build button.

import { group, ok, yard, run, runUntil, state } from './helpers.mjs';
import { WORKER } from '../src/config.js';
import { deepTop, podAt } from '../src/deep/place.js';
import { pressBuild } from './party-press.mjs';
import { afloat } from '../src/deep/scales.js';

const S = yard.S;
const residents = () => S.workers.filter(w => w.deepHome);
const inDeep = w => w.y + WORKER > deepTop();

function deepYard() {
  window.__fullSites();
  window.__snatch({ played: true });
  window.__crew(0, 4);
}

group('a pod is bought in scales and adds a body who lives down there', async () => {
  deepYard();
  const crew = S.crew;
  const had = new Set(residents().map(w => w.name));
  const onBoard = name => window.__boards().find(b => b.name === name)?.keys.includes('pod');
  const board = { pods: onBoard('pods'), stands: !!state().stands.pods };
  window.__scales(1000);
  const scales = S.scales;
  const bought = window.__buy('pod');
  window.__finish();
  run(0.5);
  const home = residents().filter(w => !had.has(w.name));
  const at = podAt(1);                   // the sqwife's pod is the first
  return [
    ok(board.stands && board.pods, "another pod is on the pods' own board, standing from the snatch",
       JSON.stringify(board)),
    ok(bought, 'the pods sell another pod'),
    ok(S.scales < scales, 'for scales', `${scales} -> ${S.scales}`),
    ok(S.crew === crew + 1 && S.pods === 2, 'and the crew is one more, living in it', `crew ${S.crew}, pods ${S.pods}`),
    ok(home.length === 1 && inDeep(home[0]), 'who comes out of it on the deep\'s floor',
       home[0] ? `${Math.round(home[0].x)},${Math.round(home[0].y)} by ${at.x}` : 'nobody')
  ];
});

group("a station's fighter is one of the deep's residents, never a yard hand", async () => {
  deepYard();
  window.__scales(100000);
  for (let i = 0; i < 2; i++) { window.__buy('pod'); window.__finish(); }
  run(1);
  const yard0 = S.workers.filter(w => !w.deepHome).map(w => w.name);
  window.__party({ fangs: 1 });                      // a break's fang
  const built = [pressBuild('altar'), pressBuild('armory')];
  window.__finish();
  runUntil(() => S.workers.filter(w => w.type === 'fighter' && !w.walking).length === 2, 60);
  const fighters = S.workers.filter(w => w.type === 'fighter');
  return [
    ok(built.every(Boolean) && fighters.length === 2, 'two stations stand, a fighter at each', `${fighters.length}`),
    ok(fighters.every(w => w.deepHome && !yard0.includes(w.name)), 'and both are the ones who live down there',
       fighters.map(w => !!w.deepHome).join())
  ];
});

group('a gatherer stood down with a load drops it in the deep', async () => {
  deepYard();
  window.__crew(0, 6);
  // Four of the deep's own hands on no station: they gather.
  window.__deepCrew({ spare: 4 });
  // A fang held: the first station stands from the snatch, so the build is
  // the second's.
  window.__party({ fangs: 1 });
  window.__looseScales(300);
  const gathering = () => S.workers.filter(w => w.type === 'gatherer');
  // The gatherer a build stands down is the last of them (`syncWorkers`):
  // the build is pressed on a frame that one has a load.
  const lastLoaded = () => { const g = gathering().at(-1); return g && (g.carry || 0) > 1 && inDeep(g); };
  runUntil(() => S.workers.filter(w => w.type === 'gatherer' && (w.carry || 0) > 1 && inDeep(w)).length >= 3, 120);
  for (let f = 0; f < 60 * 60 && !lastLoaded(); f++) run(1 / 60);
  const loads = gathering().reduce((n, w) => n + (w.carry || 0), 0);
  const was = gathering().length;
  const yardChips = () => S.chips.filter(c => !c.place).length, dust = yardChips(), water = afloat();
  // A station to build: a gatherer is stood down where it is, load and all,
  // and goes to put it up empty-handed.
  pressBuild();
  const stood = was - gathering().length;
  return [
    ok(loads > 1, 'the gatherers had loads', `${loads}`),
    ok(stood >= 1, 'one was stood down to build', `${stood}`),
    ok(yardChips() === dust, "none of it came up as the yard's dust", `${yardChips() - dust} chips`),
    ok(afloat() > water, 'it went into the water where it stood', `${afloat() - water} scales`)
  ];
}, { reload: false });
