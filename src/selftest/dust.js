// Dust as money: mined, thrown in, spent and counted.

import { rungDust } from '../config.js';
import { raf, until, state, ok, point, onScreen, boulderWorld, hoverBench, run, runUntil, haveRock,
  buy, P } from './kit.js';
import { S } from '../state.js';
import { importSave } from '../persist.js';
import { loadBelt, beltReach } from '../dust.js';

export const TESTS = [
  // The intro quest's first item (objectives.js) is ticked by a click on the
  // rock itself, the way a player mines it.
  ['clicking the rock ticks the first quest item under the line', async () => {
    haveRock();
    const items = () => [...document.querySelectorAll('#objective .quest li')];
    run(0.1); await new Promise(r => requestAnimationFrame(r));
    const before = items().map(li => li.className === 'done');
    const b = boulderWorld();
    const [x, y] = onScreen(b.x, b.y);
    point('pointerdown', x, y); point('pointerup', x, y);
    run(0.1); await new Promise(r => requestAnimationFrame(r));
    const after = items().map(li => li.className === 'done');
    return [
      ok(before.length === 3 && before[0] === false, 'the line carries three items, the first not done', JSON.stringify(before)),
      ok(after[0] === true, 'and a click on the rock ticks it', JSON.stringify(after))
    ];
  }],
  ['mining leaves dust on the ground', async () => {
    haveRock();                                // something to swing at
    const before = state().floor;
    const b = boulderWorld();
    const [x, y] = onScreen(b.x, b.y);
    for (let i = 0; i < 12; i++) { point('pointerdown', x, y); point('pointerup', x, y); run(0.05); }
    // however long the last chip's arc takes, not a guessed sleep
    runUntil(() => state().chips === 0, 20);
    const after = state();
    return [
      ok(after.floor > before, 'dust lands on the floor', `${before} -> ${after.floor}`),
      ok(after.chips === 0, 'nothing is left stuck in the air', `${after.chips} in flight`)
    ];
  }],

  ['dust thrown in the pit counts, and spending takes it back', async () => {
    const start = state();
    window.__give(500);
    await until(() => state().pitGrains > start.pitGrains);
    const filled = state();
    const cost = rungDust('carry', 0);       // your strength's first rung
    const bought = await buy('carry');
    await until(() => state().pitGrains < filled.pitGrains);
    const spent = state();
    return [
      ok(filled.stored === start.stored + 500, 'the hole counts what goes in',
         `${start.stored} -> ${filled.stored}`),
      ok(filled.pitGrains > start.pitGrains, 'and the pile grows with it'),
      ok(bought, 'carry can be bought'),
      ok(spent.stored === filled.stored - cost, 'buying comes out of the hole',
         `${filled.stored} -> ${spent.stored}`),
      ok(spent.pitGrains < filled.pitGrains, 'and the pile shrinks with it',
         `${filled.pitGrains} -> ${spent.pitGrains}`)
    ];
  }],

  ['paying flies the dust to the bench', async () => {
    window.__give(600);
    await raf();
    await hoverBench();
    const before = state();
    await buy('carry');
    await raf();
    const mid = state();
    await until(() => state().paid === 0, 300);
    const after = state();
    return [
      ok(mid.paid > 0, 'dust leaves the pit when you pay', `${mid.paid} in flight`),
      ok(after.paid === 0, 'and all of it reaches the bench', `${after.paid} left over`),
      ok(after.pitGrains < before.pitGrains, 'the pile is smaller for it')
    ];
  }],

  ['the counter runs to its value', async () => {
    const before = state().shown;
    window.__give(2000);
    await until(() => state().shown > before);
    const mid = state().shown;
    await until(() => state().shown === state().stored, 300);
    const settled = state();
    return [
      ok(mid > before && mid < settled.stored, 'it eases rather than snapping',
         `${before} -> ${mid} -> ${settled.shown}`),
      ok(settled.shown === settled.stored, 'and lands on the number',
         `${settled.shown} vs ${settled.stored}`)
    ];
  }],

  // The player's yard, where a left click anywhere put a handful of pebbles
  // in the hand: the belt's scoop crept a long lift off the band's end, the
  // ramp flicked it off the lip with no position, and a grain with none is
  // "near" every hand. The lifts are the belt's own (`loadBelt`, what its
  // scoop does with a grain off the ground at the head end of the run); the
  // click is the player's, on open sky with nothing real in reach.
  ['a click on open sky over the belt\'s yard catches nothing', async () => {
    // The rules are off for the setup: verify.js rule 19 would stop the yard
    // on the first such grain, and this check is about the click.
    window.__verify(false);
    importSave(await (await fetch('/test/fixtures/click-pebbles.json')).text());
    for (let i = 0; i < 12; i++) loadBelt(beltReach() - (i % 3) * P, S.groundY - P, 1 + (i % 4));
    for (let f = 0; f < 600; f++) run(1 / 30);
    const nowhere = S.chips.filter(c => !Number.isFinite(c.x) || !Number.isFinite(c.y)).length;
    // open sky: a spot with no grain in flight anywhere near it
    const reach = P * 8;
    let at = null;
    for (let wx = S.camX + 40; wx < S.camX + S.viewW - 40 && !at; wx += 40) {
      const wy = S.camY + 30;
      if (!S.chips.some(c => Math.abs(c.x - wx) < reach && Math.abs(c.y - wy) < reach)) at = [wx, wy];
    }
    const [x, y] = onScreen(...at);
    point('pointerdown', x, y);
    run(1 / 60);
    const inHand = S.held;
    const chips = S.chips.length;
    point('pointerup', x, y);
    const thrown = S.chips.length - chips;
    window.__seed(20250830);
    window.__verify(true);
    return [
      ok(nowhere === 0, 'the belt throws nothing off its lip without a place', `${nowhere} with none`),
      ok(inHand === 0, 'and a click on open sky closes on an empty hand', `${inHand} in hand`),
      ok(thrown <= 0, 'and lets go of nothing', `${thrown} thrown`)
    ];
  }],
];
