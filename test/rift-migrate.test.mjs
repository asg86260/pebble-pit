// A save from before the rift, opened in the build that has one.
//
// The press is cut. `PIT_GRAINS` is one size, so a save written on a pressed
// pile — 1200 columns of three-pixel grains, or 1800 of two — describes a plot
// this game does not build. `pitFromSave` refuses it, and rightly: the profile
// it holds is not a profile of this hole.
//
// What happened next was the bug, and it was already there before any of this:
// `restore` did `pit.grid.fill(0)` and left the counter alone. So a shape
// mismatch gave you an empty hole reading a hundred thousand dust — the number
// and the picture saying different things, which is the one thing this game does
// not do, sitting in the reload path the whole time and reachable by any save
// whose plot had moved on.
//
// `rehomeDust` is the cure, and it is not a special case for pressed saves: it
// fills the hole from the counter and sends whatever will not fit through the
// rift. Nothing is clamped and nothing is destroyed.
//
// The fixture is a real one — a player's yard, `stuck-yard.json`, saved at
// `pitStep: 1` with 102,731 dust banked. Which is the whole argument for using
// it: a synthetic save would have been written by the same understanding that
// wrote the code, and this one was not.

import { readFileSync } from 'node:fs';
import { yard, group, ok, state, run } from './helpers.mjs';

const SAVE = readFileSync(new URL('./fixtures/stuck-yard.json', import.meta.url), 'utf8');
const saved = JSON.parse(SAVE);

const load = () => {
  localStorage.setItem('boulder-clicker/v4', SAVE);
  yard.restore();
};

group('a pressed save comes back whole, at full-size grains', async () => {
  load();
  const s = state();
  const cap = yard.pitMod.pitCapacity();

  return [
    // Nothing lost. This is the whole of what the migration promises.
    ok(s.stored === saved.stored, 'every grain that was banked is still banked',
       `${s.stored} against ${saved.stored} in the save`),

    // And it is in two places, which add up.
    ok(s.pitDust + s.rift === s.stored,
       'the pile and the rift together are the counter',
       `${s.pitDust} in the hole + ${s.rift} in the rift = ${s.pitDust + s.rift}, ` +
       `counter ${s.stored}`),

    // The hole is full, not empty. The bug it replaces left it at nought.
    ok(s.pitDust > 0, 'the hole is not empty', `${s.pitDust}`),
    ok(s.pitDust >= cap - 200, 'the hole is filled to what it holds',
       `${s.pitDust} of ${cap}`),

    // The rest is through the rift, and the rift is open because it had to be.
    ok(s.rift > 0, 'and the rest of it is standing in the rift', `${s.rift}`),
    ok(s.riftOpen, 'which is open, because the dust was already there'),

    // Full-size grains. The point of cutting the press.
    ok(s.pitGrain === 6, 'and every grain in it is drawn at six pixels',
       `${s.pitGrain}`)
  ];
});

group('what the rift holds survives a save and a reload', async () => {
  load();
  const first = state();
  const rift = first.rift;

  // Round-trip it through the game's own save, not through the fixture again:
  // the fixture has no `rift` field at all, so the first load is a migration and
  // the second has to be an ordinary restore of a number that is now written
  // down. Those are different paths and only one of them was just checked.
  yard.persist();
  yard.restore();
  const back = state();

  return [
    ok(rift > 0, 'there is something in it to lose', `${rift}`),
    ok(back.rift === rift, 'and it is still there after a round trip',
       `${back.rift} against ${rift}`),
    ok(back.stored === first.stored, 'with the counter unmoved',
       `${back.stored} against ${first.stored}`),
    ok(back.pitDust + back.rift === back.stored,
       'and the two of them still adding up',
       `${back.pitDust} + ${back.rift} = ${back.pitDust + back.rift} against ${back.stored}`)
  ];
});

group('spending reaches into the rift only once the hole is empty', async () => {
  load();
  const before = state();
  const hole = before.pitDust, inRift = before.rift;

  // Spend a bite out of the hole. It must come off the pile, where you can see
  // it go, and leave the rift alone.
  window.__spend(1000);
  const mid = state();

  // Then spend past everything the hole holds. Now the rift has to give.
  window.__spend(mid.pitDust + 5000);
  const after = state();

  return [
    ok(mid.pitDust === hole - 1000, 'a small payment comes out of the pile',
       `${hole} -> ${mid.pitDust}`),
    ok(mid.rift === inRift, 'and the rift is untouched', `${mid.rift} against ${inRift}`),
    ok(after.pitDust === 0, 'a payment past the pile empties the hole',
       `${after.pitDust}`),
    ok(after.rift < inRift, 'and then comes out of the rift',
       `${inRift} -> ${after.rift}`),
    ok(after.rift === after.stored,
       'which is all of what is left, the hole being empty',
       `${after.rift} against ${after.stored}`)
  ];
});

// The hole cut to a third (config/pit.js, `2026-10-12-smaller-pit.js`). A
// player's yard saved untorn, with more in its hole than the new hole holds:
// a few thousand dust and twenty thousand finds. Nothing is lost and nothing
// stands open unseen: the hole is filled, the rest goes through as eaten,
// and the hole tears on screen the way a full one does.
const PLAYER = readFileSync(new URL('./fixtures/player-yard.json', import.meta.url), 'utf8');
const player = JSON.parse(PLAYER);
const { default: smallerPit } = await import('../src/migrations/2026-10-12-smaller-pit.js');
const runsOf = str => String(str).split('.').flatMap(r => {
  const [v, n] = r.split('x').map(Number);
  return new Array(n).fill(v);
});
const grains = str => runsOf(str).filter(Boolean).length;

group('an old pile is cut down to the shorter hole, the shape it was', async () => {
  const raw = JSON.parse(SAVE);                 // the full hole, at the old length
  const was = raw.pit;
  smallerPit.apply(raw);
  const now = runsOf(raw.pit.heights);
  const { pit } = yard;
  return [
    ok(raw.pit.cols === pit.cols && raw.pit.rows === pit.rows,
       'the profile is the new hole\'s', `${was.cols} -> ${raw.pit.cols} columns, the plot ${pit.cols}`),
    ok(now.length === pit.cols && now.every(h => h <= pit.rows),
       'every column fits it', `${Math.max(...now)} of ${pit.rows}`),
    ok(now[0] > 0 && now[now.length >> 1] >= now[0],
       'and it is still a heap over a full hole', `${now[0]} at the lip, ${now[now.length >> 1]} mid`)
  ];
});

// A drowned yard with grains lying on ground the shorter world no longer
// has: they are banked as if they fell in, and the abyss has them.
group('the ground past the new end of the world falls in, not out of the books', async () => {
  const text = readFileSync(new URL('./fixtures/quarry-crossing.json', import.meta.url), 'utf8');
  const raw = JSON.parse(text);
  const before = { floor: grains(raw.floor.cells), stored: raw.stored, ate: raw.riftAte };
  smallerPit.apply(raw);
  const kept = grains(raw.floor.cells), fell = before.floor - kept;
  localStorage.setItem('boulder-clicker/v4', text);
  yard.restore();
  const s = state();
  return [
    ok(fell > 0, 'there was ground past the new end with something on it', `${fell} grains`),
    ok(raw.riftAte - before.ate === fell && raw.stored - before.stored <= fell,
       'every one of them is counted as gone into the hole',
       `${fell} fell, ${raw.stored - before.stored} of them dust, ate +${raw.riftAte - before.ate}`),
    ok(s.stored === raw.stored && s.rift === raw.rift, 'and the load reads them back',
       `${s.stored} against ${raw.stored}`),
    ok(yard.floor.n === kept, 'with the rest of the ground where it lay', `${yard.floor.n} of ${kept}`)
  ];
});

group('an old yard with more than the new hole holds tears it, and keeps every grain', async () => {
  localStorage.setItem('boulder-clicker/v4', PLAYER);
  yard.restore();
  const s = state();
  const S = yard.S;
  const through = s.rift + s.riftHeld.shards + s.riftHeld.spores + s.riftHeld.sparks;
  const tearing = S.riftGulp > 0;
  run(3);                                       // the tear runs, and the rules watch it
  const after = state();
  return [
    ok(s.stored === player.stored && s.shards === player.shards && s.sparks === player.sparks
       && s.spores === player.spores, 'every coin that was owned is still owned',
       `dust ${s.stored}, shards ${s.shards}, sparks ${s.sparks}, spores ${s.spores}`),
    ok(s.pitGrains >= yard.pitMod.pitCapacity() - 200, 'the hole is full',
       `${s.pitGrains} of ${yard.pitMod.pitCapacity()}`),
    ok(through > 0 && s.riftAte === through, 'the rest went through, counted as eaten',
       `${through} through, ate ${s.riftAte}`),
    ok(s.riftOpen && tearing, 'and the hole is tearing, not standing open with no tearing seen',
       `open ${s.riftOpen}, gulp ${S.riftGulp}`),
    ok(after.pitDust + after.rift === after.stored, 'and the books balance after it',
       `${after.pitDust} + ${after.rift} against ${after.stored}`)
  ];
});
