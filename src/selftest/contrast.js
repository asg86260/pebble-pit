// Every word the page sets is readable against what it sits on: WCAG 2.2 AA,
// 4.5:1, or 3:1 for large text (axe-core's `color-contrast` rule, which
// reads the color through every opacity and the background through every
// box behind it). Asked of every scene that puts a page up and of every
// board at its fullest, in the light page and the dark one, each a frame of
// its own (play.html?bench, staged, so the save is never touched; `&dark`
// for the dark palette, which is fixed at boot). The canvas's own lettering
// is a picture, not text, and axe does not see it. The dev panel is not the
// game's and is left out.

import { sleep, ok, until } from './kit.js';
import axe from 'axe-core';
import { SCENES } from '../scenes.js';
import { YARD_BOARDS as BOARDS } from '../stations.js';

// What to read: every page scene as it stands, then each board at its
// fullest, a stop each. The stops are dealt into a few groups a theme, so no
// one group is the floor of the shard it lands in.
const BOARD_SCENES = [['boards', BOARDS], ['queuerepeat', ['bench', 'house']], ['shieldbuilding', ['bench']]];
const STOPS = [
  ...Object.keys(SCENES).filter(k => SCENES[k].page).map(scene => ({ where: scene, scene })),
  ...BOARD_SCENES.flatMap(([scene, boards]) => boards.map(board => ({ where: `${scene}/${board}`, scene, board })))
];
const PARTS = 4;

// A page or a board fades in on the wall clock (fade.js), a card's step
// strikes and fades away, a tag eases in: a word read mid-fade is a pale
// word. So the reading waits until nothing on the page is animating, asked
// of the page itself rather than of a list of durations (capped, in case
// something loops).
const still = w => until(() => !w.document.getAnimations().some(a => a.playState === 'running'), 180);

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

// One theme's share of the stops, read in a frame of its own (the dark
// palette is fixed at boot, so a theme is a frame).
async function readStops(theme, stops) {
  const f = document.createElement('iframe');
  f.src = `./play.html?bench${theme === 'dark' ? '&dark' : ''}`;
  f.style.cssText = 'position:fixed;left:0;top:0;width:1000px;height:700px;border:0;opacity:0;pointer-events:none;z-index:-1';
  document.body.appendChild(f);
  try {
    const t0 = performance.now();
    const booted = () => { const x = f.contentWindow; return !!(x?.__scene && x.__board && x.__fast); };
    while (!booted() && performance.now() - t0 < 20000) await sleep(50);
    const w = f.contentWindow;
    if (!booted()) return [ok(false, `${theme}: the game boots in a frame`)];
    w.eval(axe.source);
    await w.document.fonts.ready;
    const step = () => new Promise(r => { w.__fast(1 / 60); w.requestAnimationFrame(() => r()); });
    const found = [];
    for (const { where, scene, board } of stops) {
      w.__scene(scene);
      w.__fast(1);
      if (board) { try { w.__board(board); } catch { continue; } }
      for (let i = 0; i < 4; i++) await step();
      await still(w);
      found.push(...await failing(w, where));
      if (board) w.__board(null);
    }
    const uniq = [...new Set(found)];
    if (uniq.length) console.log(`[contrast ${theme}]\n` + uniq.join('\n'));
    return [ok(uniq.length === 0, `${theme}: every word meets AA`,
               uniq.slice(0, 8).join('; ') + (uniq.length > 8 ? ` (+${uniq.length - 8})` : ''))];
  } finally { f.remove(); }
}

export const TESTS = ['light', 'dark'].flatMap(theme => Array.from({ length: PARTS }, (_, k) =>
  [`every word on a page or a board meets AA contrast, ${theme} (${k + 1} of ${PARTS})`,
   () => readStops(theme, STOPS.filter((_, i) => i % PARTS === k))]));
