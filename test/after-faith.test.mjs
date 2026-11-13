// REVIEW faith-fill
// Faith (after/faith.js; the owner, 2026-11-13: "ring should fill as
// collect"): the prayers fill the ring over the shrine, a full ring holds
// until a click on it collects it, the click empties it and the prayers
// fill it again, and a prayer rung landing mid-fill changes how fast it
// fills, never how full it is.
import { group, ok, run, runUntil, yard } from './helpers.mjs';
import { workOn, progressOf } from '../src/works.js';
import { upCount } from '../src/after/levels.js';
import { faithFull, fillAt, ringBox } from '../src/after/faith.js';
import { AFTER_FAITH, AFTER_PRAYER_MULT } from '../src/config.js';

const S = yard.S;
const read = () => window.__afterRead();
const OPENING = ['house-fall', 'arrive', 'meet-god', 'refuse'];
const up = () => {
  window.__actsOn(true);
  window.__goPlace('after');
  for (const k of OPENING) if (!S.beatsDone.includes(k)) S.beatsDone.push(k);
  run(1);
  runUntil(() => read().walking === 0, 120);
};
// A click on the ring's middle, through the place's own click.
const clickRing = () => { const b = ringBox(); return window.__afterClick(b.x + b.w / 2, b.y + b.h / 2); };

group('the prayers fill the ring, a full ring holds until clicked, the click empties it and it fills again', async () => {
  up();
  const f0 = S.after.faith;
  run(10);
  const f10 = S.after.faith;
  const filled = runUntil(faithFull, AFTER_FAITH.fillS * 1.2);
  run(20);
  const held = faithFull() && fillAt() === 1;
  const early = clickRing() === true;
  const unwinding = runUntil(() => fillAt() < 0.5, 10) && S.after.faith === 0;
  run(AFTER_FAITH.press + AFTER_FAITH.unwind + AFTER_FAITH.empty);
  const again = S.after.faith;
  run(10);
  const refill = S.after.faith > again && S.after.faith < 0.5;
  const second = clickRing();
  window.__actsOn(null);
  return [
    ok(f10 < 1 && Math.abs(f10 - f0 - 10 / AFTER_FAITH.fillS) < 1e-3, 'the prayers fill the ring, a share a second', `${f0} -> ${f10}`),
    ok(filled && held, 'it fills, and full it stays full'),
    ok(early && unwinding, 'a click on the full ring collects it, and the arc unwinds to empty'),
    ok(refill && !second, 'the prayers fill it again, and a click on a ring not full collects nothing', `${again} -> ${S.after.faith}`)
  ];
});

group('a prayer rung landing mid-fill speeds the fill and moves the arc not at all', async () => {
  up();
  S.after.camp = 4;
  window.__afterGrant({ rebel: 2000, timber: 40 });
  const bought = window.__buy('after-prayer');
  const raise = () => workOn('after-prayer-raise');
  // on to the end of the build a second at a time, collecting the ring as a
  // player would whenever it fills, so it is mid-fill as the rung lands
  runUntil(() => { if (faithFull()) clickRing(); return raise() && progressOf(raise()) >= 0.9; }, 600);
  let before = null, after = null, landed = false;
  for (let i = 0; i < 60 * 120 && !landed; i++) {
    if (faithFull()) clickRing();
    const was = { f: fillAt(), n: upCount('after-prayer') };
    run(1 / 60);
    if (upCount('after-prayer') > was.n) { landed = true; before = was.f; after = fillAt(); }
  }
  const step = 1 / 60 * AFTER_PRAYER_MULT[1] / AFTER_FAITH.fillS;
  const f1 = S.after.faith;
  run(5);
  const rate = (S.after.faith - f1) / 5;
  window.__actsOn(null);
  return [
    ok(bought && landed, 'the rung is bought and built, and lands'),
    ok(before > 0.02 && before < 0.98, 'the ring was mid-fill as it landed', `${before}`),
    ok(Math.abs(after - before) <= step * 1.01, 'on the frame it lands the arc moves no more than a frame\'s fill', `${before} -> ${after}`),
    ok(Math.abs(rate - AFTER_PRAYER_MULT[1] / AFTER_FAITH.fillS) < 1e-4, 'and the ring fills at the rung\'s rate after', `${rate}`)
  ];
});
