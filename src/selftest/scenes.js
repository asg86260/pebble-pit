// The scenes on the held sheet (scenesheet.js): the block is there with a
// heading per part and a button per scene, a press stands the yard at the
// scene and takes the sheet down, and none of it touches the save -- the
// store's blob is byte-identical after a scene and `my yard` brings the yard
// back. All DOM, which is why it is in this tier; the list itself is checked
// in test/scenes.test.mjs.

import { raf, newRun, settle, state, ok, run } from './kit.js';
import { ABOUT, SCENES } from '../scenes.js';
import { S } from '../state.js';
import { persist } from '../persist.js';

const KEY = 'boulder-clicker/v4';
const held = () => document.getElementById('held');
const block = () => document.getElementById('scenes');
const press = async () => {
  dispatchEvent(new KeyboardEvent('keydown', { key: ' ', code: 'Space', bubbles: true }));
  await raf();
};
const button = name => block().querySelector(`button[data-scene="${name}"]`);

export const TESTS = [
  ['the held sheet carries a button for every scene, under the part it is about', async () => {
    newRun();
    await settle();
    await press();
    const heads = [...block().querySelectorAll('.head')].map(el => el.textContent);
    const missing = Object.keys(SCENES).filter(k => !button(k));
    // the button sits in the row under its own part's heading
    const misfiled = Object.keys(SCENES).filter(k =>
      button(k)?.closest('.part')?.querySelector('.head')?.textContent !== SCENES[k].about);
    document.getElementById('resume').click();
    return [
      ok(!!block(), 'the block is on the sheet'),
      ok(heads.join('|') === ABOUT.join('|'), 'one heading per part, in order', heads.join('|')),
      ok(missing.length === 0, 'and a button for every scene', missing.join(', ')),
      ok(misfiled.length === 0, 'each under its own part', misfiled.join(', '))
    ];
  }],

  ['a scene pressed stands the yard there, takes the sheet down, and leaves the save alone', async () => {
    newRun();
    await settle();
    window.__crew(2, 1);
    window.__jump(7);
    run(2);
    S.dirty = true; persist();
    const before = localStorage.getItem(KEY);
    const rockBefore = state().boulderNo;
    await press();
    button('quarry').click();
    await raf();
    const down = held().hidden;
    const quarry = state().quarryOpen;
    run(3);                                  // long enough for the save clock to want to write
    S.dirty = true; persist();
    const during = localStorage.getItem(KEY);
    await press();
    const mine = block().querySelector('button.mine');
    if (mine) mine.click();
    // read the instant it is back, before the save clock has had a second to
    // write the restored yard out in its own words
    const after = localStorage.getItem(KEY);
    await raf();
    const rockAfter = state().boulderNo;
    window.__crew(0, 0);
    return [
      ok(down, 'the sheet comes down on the press'),
      ok(quarry, 'and the yard is standing at the scene', `quarryOpen ${quarry}`),
      ok(!!mine && S.staged === false, "'my yard' is offered and brings the yard back"),
      ok(rockBefore === 7 && rockAfter === 7, 'to the rock it was on', `${rockBefore} -> ${rockAfter}`),
      // the scene's own `__reset` empties the store; what must never happen
      // is the scene's yard being written into it
      ok(during === null || during === before, 'nothing of the scene reaches the store'),
      ok(after === before, 'and the save reads byte-identical after', `${(after || '').length} vs ${(before || '').length}`)
    ];
  }]
];
