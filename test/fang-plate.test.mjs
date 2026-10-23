// The plate over the furnace's door shows the fangs held (FANG_PLATE; the
// owner's option B, 2026-10-16): nothing before the first fang, the count
// once one is crushed, cross-faded up with the frame catching the light, and
// at none held the plate kept with its words in the mortar's grey.
//
// The fang is the player's: a break dealt by the hand on the belly, the fang
// carried to the hopper by the gatherer, spent on the build button. The
// setup (the snatch, a station, the gatherer) goes through the hooks.
import { group, ok, run, runUntil } from './helpers.mjs';
import { S } from '../src/state.js';
import { now } from '../src/clock.js';
import { FANG_PLATE } from '../src/config.js';
import { depthAt } from '../src/deep/depth.js';
import { clickDeep } from '../src/deep/serpent.js';
import { coilAt, bellySeg } from '../src/deep/place.js';
import { fangPlate, plateCells } from '../src/render/fangplate.js';
import { TONE } from '../src/render/deeptones.js';
import { pressBuild } from './party-press.mjs';

const clickBelly = () => { const p = coilAt(bellySeg(), now()); return clickDeep(p.x, p.y); };
const read = () => {
  const p = fangPlate(now());
  return { shown: p.shown, faces: p.faces.map(f => ({ n: f.n, a: +f.a.toFixed(2), pale: f.ink === TONE.pale })), glint: +p.glint.toFixed(2) };
};

group('the plate counts the fangs held and dims at none', async () => {
  window.__snatch({ played: true });
  window.__party({ stations: [{ kind: 'altar', cls: 'brawler', rung: 8 }] });
  window.__deepCrew({ spare: 2 });
  run(1);
  const before = read();
  // A break by the hand: its fang drops and the gatherer carries it in.
  window.__serpent({ wound: depthAt(S.serpentStage) - 1 });
  for (let i = 0; i < 300 && !S.fangsLoose.length; i++) { clickBelly(); run(1 / 60); }
  const crushed = runUntil(() => S.fangs === 1, 120);
  run(1 / 60);
  const arriving = read();
  run(FANG_PLATE.fadeS + 0.1);
  const one = read();
  run(FANG_PLATE.glintS);
  const settled = read();
  // Spent on the button: the plate stays, its words dimmed.
  // (the plate is asked every frame in the game; here once as the fang goes)
  const pressed = pressBuild();
  read();
  run(FANG_PLATE.fadeS + 0.1);
  const none = read();
  return [
    ok(before.shown === 0 && before.faces.length === 0, 'no plate before a fang is seen', JSON.stringify(before)),
    ok(crushed, 'a fang carried into the furnace', `fangs ${S.fangs}`),
    ok(arriving.shown < 1 && arriving.glint > 0.9 && arriving.faces.length === 2 && arriving.faces[1].n === 1,
       'the first fang fades the plate in, the count coming up from none, the frame lit', JSON.stringify(arriving)),
    ok(one.shown === 1 && one.faces.length === 1 && one.faces[0].n === 1 && one.faces[0].pale && one.glint > 0,
       'then it reads one, in the pale, the light still leaving the frame', JSON.stringify(one)),
    ok(settled.glint === 0, 'and the frame back to its mortar', JSON.stringify(settled)),
    ok(pressed && none.shown === 1 && none.faces.length === 1 && none.faces[0].n === 0 && !none.faces[0].pale,
       'spent: the plate stays at none, its words in the mortar\'s grey', JSON.stringify(none))
  ];
});

group('the plate is cut round its words and kept to the brick over the door', async () => {
  const rows = [0.4, 0.6, 1, 2].map(z => ({ z, ...plateCells(6, z) }));
  return [
    ok(rows.every(p => p.w >= 3 && p.h >= 3 && p.c >= 3 && p.c + p.w <= 27 && p.r + p.h === 15),
       'on whole cells, inside the brick, its foot on the door\'s arch', JSON.stringify(rows)),
    ok(rows.every((p, i) => i === 0 || p.w <= rows[i - 1].w), 'fewer cells the closer the camera', JSON.stringify(rows))
  ];
});
