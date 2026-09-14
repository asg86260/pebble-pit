// Workers throw dust into their respective pile when they come across it.
//
// One rule, three patches of ground: the floor of the cut, the strip the plots
// stand on, and the surface of the hill. Each is worked by the trade that works
// that place, between strokes of the job it is actually there to do, and what it
// picks up is thrown onto that place's own heap -- never swept out of existence
// and never carried across the yard onto somebody else's.
//
// What every group here checks is the same three things, because they are what
// the rule is: the stray dust ends up in the right pile, the site's own ground
// comes clean, and the job carries on while it happens.

import { group, ok, state, run, openSites, haveRock, yard, P } from './helpers.mjs';
import { S, floor } from '../src/state.js';
import { at } from '../src/grid.js';
import { spawnChip } from '../src/dust.js';
import { restOnRock, rockSand, sandTopY, topOfRock } from '../src/rock.js';
import { rockLeft } from '../src/world.js';
import { plotX, farmPatch } from '../src/farm.js';
import { TIDY_ELBOW } from '../src/tidy.js';

const mouthX = () => state().quarryX + state().quarryW / 2;

// How much has been tidied by hand, across the whole crew. The point of asking
// is that every group below could otherwise pass for the wrong reason -- the
// cut's dust is lifted out wholesale when a dig is spent, a mined-through column
// tips what was lying on it -- and none of those is a body coming across a grain
// and picking it up.
const tidied = () => yard.S.workers.reduce((n, w) => n + (w.tidied || 0), 0);

// What is lying on the farm's own ground: the strip the plots stand on, and not
// the heap beside it. Counted through the patch the rule itself works, so the
// check and the code cannot disagree about where the farm ends.
function farmGround() {
  const patch = farmPatch();
  let n = 0;
  for (let c = 0; c < patch.cols; c++) {
    if (!patch.peek(c)) continue;
    for (let r = 0; r < floor.rows; r++) if (at(floor, c, r)) n++;
  }
  return n;
}

// Grains standing on the quarry's strip or within a cell of its edge.
const onQuarryHeap = () => {
  const strip = S.piles.find(p => p.key === 'quarry');
  if (!strip) return 0;
  let n = 0;
  for (let c = 0; c < floor.cols; c++) {
    const x = floor.x + c * P;
    if (x < strip.from - P || x >= strip.to + P) continue;
    for (let r = 0; r < floor.rows; r++) if (at(floor, c, r)) n++;
  }
  return n;
};

group('a quarrier throws the cut\'s stray dust up onto the quarry\'s pile', async () => {
  openSites();
  window.__crew(0, 0, 2);                      // two down the cut, nobody carrying
  window.__digCut(4);                          // room in the hole for dust to lie in
  run(0.5);
  const laid = 14;
  for (let i = 0; i < laid; i++) {
    window.__pileCut(mouthX() + (i - laid / 2) * P * 2, 1);
    run(0.05);
  }
  run(1);
  const before = state();
  const dug0 = before.quarryTotal;
  run(30);
  const after = state();

  return [
    ok(before.cutDust >= laid, 'there is stray dust lying on the floor of the cut',
       `${before.cutDust}`),
    ok(after.cutDust === 0, 'and the floor of the cut comes clean', `${after.cutDust}`),
    ok(tidied() >= laid, 'every grain of it was picked up by hand between digs',
       `${tidied()} tidied, ${laid} laid`),
    // The strip, and the one cell either side of it: sand stands at an angle,
    // so a heap thrown to the strip's edge can rest a grain at its foot, and a
    // grain at the foot of the quarry's heap is the quarry's.
    ok(onQuarryHeap() - (before.pileCount.quarry || 0) >= laid,
       "and it all went onto the quarry's own pile",
       `${before.pileCount.quarry || 0} -> ${after.pileCount.quarry || 0} on the strip, ${onQuarryHeap()} with its foot`),
    ok(after.quarryTotal > dug0, 'and the digging carried on while it happened',
       `${dug0} -> ${after.quarryTotal} cells`)
  ];
});

group('a farmhand throws stray dust on the row onto the farm\'s pile', async () => {
  openSites();
  window.__levels({ plotLevel: 6, tendLevel: 6 });
  window.__crew(0, 0, 0, 0);                   // laid down with nobody on the row
  window.__clearFloor();
  run(1);
  const laid = 12;
  for (let i = 0; i < laid; i++) { window.__pile(plotX(i % state().plotCount), 1); run(0.05); }
  run(1);
  const before = state();
  const ground0 = farmGround();
  const grown0 = state().plots.reduce((a, b) => a + b, 0);
  window.__crew(0, 0, 0, 2);                   // and now two hands walk it
  run(30);
  const after = state();

  return [
    ok(ground0 === laid, 'there is stray dust lying along the row', `${ground0} of ${laid}`),
    ok(farmGround() === 0, 'and the row comes clean', `${farmGround()}`),
    ok(tidied() >= laid, 'every grain of it was picked up by hand between plots',
       `${tidied()} tidied, ${laid} laid`),
    ok((after.pileCount.farm || 0) - (before.pileCount.farm || 0) >= laid,
       "and it all went onto the farm's own pile",
       `${before.pileCount.farm || 0} -> ${after.pileCount.farm || 0}`),
    // The crop is what a farmhand is for, and tidying is what it does with the
    // hands it is not tending with: the row has to have come on while the dust
    // was being cleared.
    ok(after.plots.reduce((a, b) => a + b, 0) > grown0 || after.plots.some(v => v < 0.05),
       'and the row came on while it happened',
       `${grown0.toFixed(2)} -> ${after.plots.reduce((a, b) => a + b, 0).toFixed(2)}`)
  ];
});

group('a chip over the crest comes to rest on the rock', async () => {
  window.__crew(0, 0);
  haveRock();
  run(1);
  const top = topOfRock(S.cx);
  const col = Math.floor((top.x - rockLeft()) / P);
  const was = S.rockTops[col];
  const restY = sandTopY(col);
  spawnChip(top.x, top.y - 120, 0, 0, 4);      // straight down, aimed at nothing
  run(3);
  const sand = rockSand();
  const deep = sand.slice(Math.max(0, col - 2), col + 3).reduce((n, a) => n + a.length, 0);

  return [
    ok(state().rockDust === 1, 'the grain is lying on the hill', `${state().rockDust}`),
    ok(deep === 1, 'in the column it came down on, or the shoulder beside it', `${deep}`),
    ok(S.rockTops[col] === was, 'and it has not eaten into the rock it landed on',
       `${was} -> ${S.rockTops[col]}`),
    // On the surface: the top of what is lying there is exactly one cell above
    // where the rock's own top was, so it is neither sunk into the hill nor
    // floating over it.
    ok(sandTopY(col) === restY - P || sandTopY(col - 1) === restY - P
       || sandTopY(col + 1) === restY - P,
       'resting one cell proud of the rock, not inside it and not over it',
       `rock top ${restY}, dust top ${sandTopY(col)}`)
  ];
});

group('a rockhand throws what is lying on the hill onto the rock\'s pile', async () => {
  window.__crew(0, 0);
  haveRock();
  run(1);
  const top = topOfRock(S.cx);
  const col = Math.floor((top.x - rockLeft()) / P);
  const laid = 10;
  for (let i = 0; i < laid; i++) restOnRock(rockLeft() + (col + i - laid / 2) * P + P / 2, 4);
  const before = state();
  window.__crew(2, 0);                          // and now somebody is working it
  run(30);
  const after = state();

  return [
    ok(before.rockDust === laid, 'there is stray dust lying on the hill', `${before.rockDust}`),
    ok(after.rockDust === 0, 'and the hill comes clean', `${after.rockDust}`),
    ok(tidied() >= laid, 'every grain of it was picked up by hand between swings',
       `${tidied()} tidied, ${laid} laid`),
    ok((after.pileCount.rock || 0) - (before.pileCount.rock || 0) >= laid,
       "and it went onto the rock's own pile",
       `${before.pileCount.rock || 0} -> ${after.pileCount.rock || 0}`),
    ok(after.rock < before.rock, 'and the rock came apart while it happened',
       `${before.rock} -> ${after.rock}`)
  ];
});

// The claim, which is the half of this that cannot be seen in a total. Two
// bodies going for one grain is what the mess's books were built to stop, and
// tidying joins those books rather than opening one of its own -- so the same
// mark applies: no two held claims may ever stand inside each other's elbows.
group('a claim on a stray grain keeps its elbows out', async () => {
  openSites();
  window.__crew(0, 0, 4);
  window.__digCut(4);
  run(0.5);
  for (let i = 0; i < 40; i++) { window.__pileCut(mouthX() + (i - 20) * P * 2, 1); run(0.03); }
  run(1);

  let worst = Infinity, most = 0;
  for (let i = 0; i < 60 * 30 && state().cutDust > 0; i++) {
    run(1 / 60);
    const claims = yard.S.workers.filter(w => w.type === 'quarrier' && w.tidyAt != null)
                                 .map(w => w.tidyAt).sort((a, b) => a - b);
    most = Math.max(most, claims.length);
    for (let k = 1; k < claims.length; k++) worst = Math.min(worst, claims[k] - claims[k - 1]);
  }

  return [
    ok(most > 1, 'more than one body claimed at once', `${most} at the most`),
    ok(worst === Infinity || worst > TIDY_ELBOW,
       "and no two claims ever stood inside each other's elbows",
       `closest pair ${worst} columns, elbow ${TIDY_ELBOW}`)
  ];
});
