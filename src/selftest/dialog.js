// The story's dialog on the page (dialog.js, render/dialog.js): God's line in
// its bubble over his head, read off the frame -- the tail's tip is ink where
// his head is -- and a real click on the game, away from the bubble, going on
// from it. The node tier has the line's facts (test/dialog.test.mjs); this is
// the pointer and the pixels.

import { S } from '../state.js';
import { DIALOG_STROKE_PX, DIALOG_TAIL } from '../config.js';
import { ok, settle, frames, canvas, point, raf } from './kit.js';
import { draw } from '../render.js';
import { ctx } from '../render/ctx.js';
import { SCENES } from '../scenes.js';
import { bubbleSeen } from '../render/dialog.js';
import { lineShown } from '../dialog.js';
import { BODIES } from '../actbeats.js';

const U = DIALOG_STROKE_PX;

// The tail's tip on the window: the ink cell past its last row of paper.
function tipOf(b) {
  const L = DIALOG_TAIL.length * U;
  if (b.dir === 'down') return { x: b.at, y: b.y + b.h + L - U * 1.5 };
  if (b.dir === 'left') return { x: b.x - L + U / 2, y: b.at };
  return { x: b.x + b.w + L - U * 1.5, y: b.at };
}
// The darkest pixel within a stroke of (x, y): the tip is one cell, and a
// half-cell's rounding must not miss it.
const lum = (x, y) => {
  const r = Math.ceil(U * S.dpr), d = ctx.getImageData(Math.round(x * S.dpr) - r, Math.round(y * S.dpr) - r, r * 2 + 1, r * 2 + 1).data;
  let least = 255;
  for (let i = 0; i < d.length; i += 4) least = Math.min(least, (d[i] + d[i + 1] + d[i + 2]) / 3);
  return least;
};

// Any CSS color the page computes, as [r, g, b] in 0..255.
const pen = document.createElement('canvas').getContext('2d', { willReadFrequently: true });
pen.canvas.width = pen.canvas.height = 1;
const rgb = css => { pen.clearRect(0, 0, 1, 1); pen.fillStyle = '#000'; pen.fillStyle = css; pen.fillRect(0, 0, 1, 1); return [...pen.getImageData(0, 0, 1, 1).data].slice(0, 3); };
const lumOf = c => c.map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }).reduce((a, v, i) => a + v * [0.2126, 0.7152, 0.0722][i], 0);
const ratio = (a, b) => { const [hi, lo] = [lumOf(a), lumOf(b)].sort((x, y) => y - x); return (hi + 0.05) / (lo + 0.05); };
// A word drawn by `difference` comes out |word - what is under it|, per channel.
const differ = (a, b) => a.map((v, i) => Math.abs(v - b[i]));

// The skip hint's words, read as they come out on its card and on the bar
// filling under them, in a frame of the dark page (`?dark`).
async function skipHintInDark() {
  const f = document.createElement('iframe');
  f.src = './play.html?bench&dark';
  f.style.cssText = 'position:fixed;left:0;top:0;width:1000px;height:700px;border:0;opacity:0;pointer-events:none;z-index:-1';
  document.body.appendChild(f);
  try {
    const t0 = performance.now();
    const booted = () => !!f.contentWindow?.__scene && !!f.contentWindow.document.getElementById('skip');
    while (!booted() && performance.now() - t0 < 20000) await raf();
    if (!booted()) return [ok(false, 'the game boots in a frame')];
    const w = f.contentWindow, d = w.document;
    const hint = w.getComputedStyle(d.getElementById('skip')), say = w.getComputedStyle(d.querySelector('#skip .say')),
          bar = w.getComputedStyle(d.querySelector('#skip .bar'));
    const card = rgb(hint.backgroundColor), words = rgb(say.color), fill = rgb(bar.backgroundColor);
    const through = say.mixBlendMode === 'difference' ? differ : a => a;
    const onCard = through(words, card), onBar = through(words, fill);
    return [
      ok(d.documentElement.classList.contains('dark'), 'the frame is the dark page'),
      ok(ratio(onCard, card) >= 4.5, 'the hint\'s words read on its card, dark', `${ratio(onCard, card).toFixed(2)}:1 ${onCard} on ${card}`),
      ok(ratio(onBar, fill) >= 4.5, 'and on the bar filling under them, dark', `${ratio(onBar, fill).toFixed(2)}:1 ${onBar} on ${fill}`)
    ];
  } finally { f.remove(); }
}

export const TESTS = [
  ["a quick second click while a line fades out is the line's, and never skips the rest of the speech", async () => {
    SCENES.dialog.run();
    await settle(0.6);
    // God's speech, two lines long for this check (the second a real message)
    const phase = BODIES['meet-god'][0];
    phase.lines.push({ who: 'god', id: 'act-hell-told' });
    try {
      const r = canvas().getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height * 0.7;
      const click = () => { point('pointerdown', cx, cy); point('pointerup', cx, cy); };
      click();                                           // goes on from the first line, which fades out
      await frames(3);
      const fading = !!lineShown() && lineShown().id === 'act-meet-god-1' && lineShown().out != null;
      click();                                           // a second click, quick: the line's, nothing else
      const skipped = S.heard.includes('act-hell-told');
      await frames(90);
      const second = lineShown();
      const up = !!second && second.id === 'act-hell-told' && second.out == null;
      click();
      const read = S.heard.includes('act-hell-told');
      return [
        ok(fading, 'the first click put the first line to fading', JSON.stringify(lineShown())),
        ok(!skipped, 'the second click, mid-fade, did not read the rest of the speech', String(skipped)),
        ok(up, 'the second line comes up on its own, waiting', JSON.stringify(second)),
        ok(read, 'and the next click goes on from it, one line a click', String(read))
      ];
    } finally { phase.lines.pop(); }
  }],
  ["the skip hint's words are readable on its card and on the bar, in the dark page", skipHintInDark],
  ["God's line stands in a bubble whose tail points at his head, and a click on the game goes on from it", async () => {
    SCENES.dialog.run();
    await settle(0.6);                                // the line's fade in, done
    await frames(2);
    draw();
    const line = lineShown() && { ...lineShown() }, b = bubbleSeen();
    const tip = b && tipOf(b), head = b && b.head;
    // where the tip is, against his head: touching its side beside it, its
    // crown's top over it, and within the head's height or width
    const near = !!b && (b.dir === 'down'
      ? Math.abs(tip.x - head.x) <= head.half && Math.abs(tip.y - head.top) <= U * 3
      : Math.abs(Math.abs(tip.x - head.x) - head.half) <= U * 3 && tip.y >= head.top && tip.y <= head.mid + head.half);
    const inked = !!b && lum(tip.x, tip.y) < 96;    // the light page: the tip's outline is ink
    // A click on the game, well clear of the bubble: the bottom of the world.
    const r = canvas().getBoundingClientRect();
    const cx = r.left + r.width / 2, cy = r.top + r.height * 0.7;
    const off = b && !(cx - r.left >= b.x && cx - r.left < b.x + b.w && cy - r.top >= b.y && cy - r.top < b.y + b.h);
    point('pointerdown', cx, cy);
    point('pointerup', cx, cy);
    const went = !!lineShown() && lineShown().out != null && S.heard.includes('act-meet-god-1');
    await frames(40);
    const gone = !lineShown() || lineShown().id !== 'act-meet-god-1';
    return [
      ok(line && line.id === 'act-meet-god-1' && line.who === 'god' && line.out == null, 'God\'s line is up and waiting', JSON.stringify(line)),
      ok(near, 'its tail\'s tip is at his head', JSON.stringify({ tip, head, dir: b && b.dir })),
      ok(inked, 'and the tip is drawn there, ink on the frame', String(b && lum(tip.x, tip.y))),
      ok(off && went, 'a real click away from the bubble goes on from the line, read at once', `${off} ${went}`),
      ok(gone, 'and it fades away', JSON.stringify(lineShown()))
    ];
  }]
];
