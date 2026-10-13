// What the deep makes for the collector, as counts rather than a stopwatch.
//
// The owner saw the deep hitch every few seconds (2026-10-13, their save is
// fixtures/deep-spikes.json). The frames themselves were quick; the hitch was
// the collector's pause, 15-25 ms in a browser, coming round every three
// seconds for what the frames had left it:
//
//   the numbers  The font's sheets were let go whenever a sheet of another
//                size was asked for, and a fight draws a big blow's number
//                beside the small ones every frame: a canvas or two a frame,
//                each one a page object the collector has to finish.
//   the coil     Every point of the body asked for the line it lies along,
//                and each ask built a key string and a fresh line -- a few
//                thousand of each a frame.
//
// A millisecond reading here could not hold still (other agents share this
// machine), so the checks say how many of each thing a frame makes.

import { readFileSync } from 'node:fs';
import { group, ok, yard } from './helpers.mjs';
import { NUM_FACE, NUM_DROP, NUM_HEAL_FACES } from '../src/config.js';

const numfont = await import('../src/render/numfont.js');
const place = await import('../src/deep/place.js');
const { drawFightNumbers } = await import('../src/render/fightnums.js');
const { drawSerpent } = await import('../src/render/serpent.js');
const { ctx } = await import('../src/render/ctx.js');
const S = yard.S;

// The node yard's canvas answers nothing; the numbers read the world's
// transform off it, so it is given one.
ctx.getTransform = () => ({ a: 1, b: 0, c: 0, d: 1, e: 0, f: 0 });

group('the number font paints a sheet once a size, however the sizes take turns', () => {
  const was = numfont.sheetsMade;
  for (let f = 0; f < 120; f++) {
    numfont.sheetOf(3, NUM_FACE, NUM_DROP);
    numfont.sheetOf(4, NUM_FACE, NUM_DROP);
  }
  const made = numfont.sheetsMade - was;
  return [ok(made <= 2, 'a big number beside a small one, a hundred and twenty frames, is two sheets', `${made} made`)];
});

group("the owner's deep, a minute of its fight drawn: the numbers' sheets and the coil's line are made once", () => {
  localStorage.setItem('boulder-clicker/v4',
    readFileSync(new URL('./fixtures/deep-spikes.json', import.meta.url), 'utf8'));
  yard.restore();
  window.__view('deep');
  const sheets = numfont.sheetsMade, lines = place.lineBuilds;
  let hits = 0;
  const FRAMES = 60 * 60;
  for (let f = 0; f < FRAMES; f++) {
    yard.fast(1 / 60);
    drawSerpent();
    drawFightNumbers();
    hits = Math.max(hits, S.hits.length);
  }
  // Every face a number is drawn in (the blow's, the bar's and the heal's
  // fading ones), at the two sizes a blow's number comes in.
  const most = (2 + NUM_HEAL_FACES.length) * 2;
  const made = numfont.sheetsMade - sheets, built = place.lineBuilds - lines;
  return [
    ok(hits > 0, 'the fight put numbers up', `${hits} at most at once`),
    ok(made <= most, `the numbers' sheets are made once each, ${most} at most`, `${made} made over ${FRAMES} frames`),
    // The crew asks first, the fighters again once the serpent's step has
    // moved its turn on, and the drawing now and then after a stun: about
    // two a frame, where a line a point was thousands.
    ok(built <= 3 * FRAMES, "the coil's line is worked out a few times a frame, not a point at a time",
       `${built} over ${FRAMES} frames`)
  ];
});
