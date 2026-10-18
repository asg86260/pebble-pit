// Every word the page sets is readable against what it sits on: WCAG 2.2 AA,
// 4.5:1, or 3:1 for large text (axe-core's `color-contrast` rule, which
// reads the color through every opacity and the background through every
// box behind it). Asked of every scene that puts a page up and of every
// board at its fullest, in the light page and the dark one, each a frame of
// its own (play.html?bench, staged, so the save is never touched; `&dark`
// for the dark palette, which is fixed at boot). The canvas's own lettering
// is a picture, not text, and axe does not see it. The dev panel is not the
// game's and is left out.

import { sleep, ok } from './kit.js';
import axe from 'axe-core';
import { SCENES } from '../scenes.js';
import { BOARDS } from '../stations.js';

// The yards to read: every page scene as it stands, then the boards.
const PAGES = Object.keys(SCENES).filter(k => SCENES[k].page);
const BOARD_SCENES = [['boards', BOARDS], ['queuerepeat', ['bench', 'house']], ['shieldbuilding', ['bench']]];

// A page or a board fades in on the wall clock (fade.js), a card's step
// strikes and fades away, a tag eases in: a word read mid-fade is a pale
// word. So the reading waits until nothing on the page is animating, asked
// of the page itself rather than of a list of durations (capped, in case
// something loops).
async function still(w) {
  const t0 = performance.now();
  while (performance.now() - t0 < 3000) {
    if (!w.document.getAnimations().some(a => a.playState === 'running')) return;
    await sleep(50);
  }
}

// Every failing node on the frame's page, as lines: the words, the ratio and
// the two colors, so a failure names the token to move. A line between two
// steps waits on a timer at no opacity, which no animation shows: what fails
// is read again a second on, and only a failure that held is a failure.
async function failing(w, where) {
  const first = await read(w, where);
  if (!first.length) return first;
  await sleep(1000);
  await still(w);
  const again = new Set(await read(w, where));
  return first.filter(l => again.has(l));
}
async function read(w, where) {
  const res = await w.axe.run(w.document, { runOnly: ['color-contrast'], resultTypes: ['violations'], exclude: [['#dev']] });
  const out = [];
  for (const v of res.violations) for (const n of v.nodes) {
    const d = n.any[0]?.data || {};
    out.push(`${where}: "${(n.target.join(' ')).slice(-60)}" ${d.contrastRatio}:1 < ${d.expectedContrastRatio} (${d.fgColor} on ${d.bgColor})`);
  }
  return out;
}

export const TESTS = [
  ['every word on a page or a board meets AA contrast, light and dark', async () => {
    const checks = [];
    for (const theme of ['light', 'dark']) {
      const f = document.createElement('iframe');
      f.src = `./play.html?bench${theme === 'dark' ? '&dark' : ''}`;
      f.style.cssText = 'position:fixed;left:0;top:0;width:1000px;height:700px;border:0;opacity:0;pointer-events:none;z-index:-1';
      document.body.appendChild(f);
      try {
        const t0 = performance.now();
        const booted = () => { const x = f.contentWindow; return !!(x?.__scene && x.__board && x.__fast); };
        while (!booted() && performance.now() - t0 < 20000) await sleep(50);
        const w = f.contentWindow;
        if (!booted()) { checks.push(ok(false, `${theme}: the game boots in a frame`)); continue; }
        w.eval(axe.source);
        await w.document.fonts.ready;
        const step = () => new Promise(r => { w.__fast(1 / 60); w.requestAnimationFrame(() => r()); });
        const found = [];
        for (const scene of PAGES) {
          w.__scene(scene);
          w.__fast(1);
          for (let i = 0; i < 4; i++) await step();
          await still(w);
          found.push(...await failing(w, scene));
        }
        for (const [scene, boards] of BOARD_SCENES) {
          w.__scene(scene);
          w.__fast(1);
          for (const b of boards) {
            try { w.__board(b); } catch { continue; }
            for (let i = 0; i < 4; i++) await step();
            await still(w);
            found.push(...await failing(w, `${scene}/${b}`));
          }
          w.__board(null);
        }
        const uniq = [...new Set(found)];
        if (uniq.length) console.log(`[contrast ${theme}]\n` + uniq.join('\n'));
        checks.push(ok(uniq.length === 0, `${theme}: every word meets AA`,
                       uniq.slice(0, 8).join('; ') + (uniq.length > 8 ? ` (+${uniq.length - 8})` : '')));
      } finally { f.remove(); }
    }
    return checks;
  }],
];
