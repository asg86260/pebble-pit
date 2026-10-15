// The serpent's bar crumbles (DESIGN.md, "The serpent's bar"; the owner's C,
// 2026-10-15): its drawn end bites back a whole BAR_BITE at a time, at most a
// bite every BAR_BITE_STEP_S, with what is not yet a whole bite cracked at the
// end; each bite leaves as two chips that move every frame, not on held
// poses; and a heal raises the end as it flows in, with no bite.
//
// Read off what the bar draws, frame by frame, on a context that keeps every
// fillRect. The wound is set by the hook: what is checked is the drawing, and
// the blows that make a wound are test/serpent-numbers.test.mjs's.
import { group, ok, run, yard } from './helpers.mjs';
import { BAR_W, BAR_H, BAR_BITE, BAR_BITE_STEP_S, BAR_BITE_FALL_S, BAR_LEFT, BAR_CRACKED, BAR_CHIP } from '../src/config.js';
import { depthAt } from '../src/deep/depth.js';
import { paintOn } from '../src/render/ctx.js';

const { drawSerpentBar, barRect } = await import('../src/render/serpentbar.js');
const S = yard.S;
const FRAME = 1 / 60;

function rects(draw) {
  const out = [];
  const state = { fillStyle: null, globalAlpha: 1, imageSmoothingEnabled: false,
    measureText: t => ({ width: String(t).length * 6 }),
    fillRect: (x, y, w, h) => out.push({ x, y, w, h, c: state.fillStyle }) };
  const g = new Proxy(state, { get: (t, k) => (k in t ? t[k] : () => {}), set: (t, k, v) => { t[k] = v; return true; } });
  paintOn({ getContext: () => g, width: 800, height: 600 }, draw);
  return out;
}

// One frame on, drawn: where the end stands (the fill or the crack after it,
// in pixels along the bar), and the chips in the air (a fill rect the size
// of half a bite, or the tumbling one's diamond rows, off the bar's row).
function frame() {
  run(FRAME);
  const r = barRect(), out = rects(drawSerpentBar);
  const inBar = q => q.y >= r.y - 10 && q.y + q.h <= r.y + r.h + 10;
  const fill = out.find(q => q.c === BAR_LEFT && q.h === BAR_H && inBar(q));
  // the crack's grey is the pips' to-come grey too: only the one on the bar
  const crack = out.find(q => q.c === BAR_CRACKED && q.h === BAR_H && q.x < r.x + BAR_W);
  const end = crack ? crack.x + crack.w - r.x : fill ? fill.x + fill.w - r.x : 0;
  const chips = out.filter(q => q.c === BAR_LEFT && q.w === BAR_BITE && q.h === BAR_H / 2);
  const held = out.filter(q => q.c === BAR_CHIP && q.w === BAR_BITE).length;
  return { end, crack: !!crack, chips, held };
}

function setUp() {
  window.__snatch({ played: true });
  window.__view('deep');
  window.__serpent({ stage: 1, wound: 0 });
  for (let i = 0; i < 30; i++) frame();
}

group('a blow bites the bar back a whole bite at a time, a held step apart, and its chips move every frame', () => {
  setUp();
  const d = depthAt(1);
  window.__serpent({ stage: 1, wound: d * 0.2 });
  const seen = [];
  for (let i = 0; i < Math.round((BAR_BITE_STEP_S * 14 + BAR_BITE_FALL_S) / FRAME); i++) seen.push(frame());
  const steps = [];
  for (let i = 1; i < seen.length; i++) if (seen[i].end !== seen[i - 1].end) steps.push({ i, by: seen[i - 1].end - seen[i].end });
  const whole = steps.filter(s => Math.abs(s.by - BAR_BITE) <= 1).length;
  const gaps = steps.slice(1).map((s, k) => (s.i - steps[k].i) * FRAME);
  const tooSoon = gaps.filter(g => g < BAR_BITE_STEP_S - FRAME / 2).length;
  // a chip falling: frame on frame, the lowest chip's top -- once it is
  // falling fast enough to cross a pixel a frame, it does so every frame
  const fall = seen.map(f => (f.chips.length ? Math.max(...f.chips.map(q => q.y)) : null));
  let still = 0, moved = 0;
  for (let i = 2; i < fall.length; i++) {
    if (fall[i] == null || fall[i - 1] == null || fall[i - 2] == null) continue;
    if (fall[i - 1] - fall[i - 2] < 2 || fall[i] < fall[i - 1]) continue;   // not yet fast, or another chip
    if (fall[i] > fall[i - 1]) moved++; else still++;
  }
  return [
    ok(steps.length >= 4, `the end stepped down several times (${steps.length})`),
    ok(whole >= steps.length - 1, `each step is a whole bite of ${BAR_BITE} px (${steps.map(s => s.by).join(', ')})`),
    ok(tooSoon === 0, `no two bites nearer than ${BAR_BITE_STEP_S} s (${gaps.map(g => g.toFixed(3)).join(', ')})`),
    ok(seen.some(f => f.crack), 'what is not yet a whole bite shows cracked at the end'),
    ok(seen.some(f => f.held > 0), 'a bite is held lit before it falls'),
    ok(moved > 5 && still === 0, `a falling chip moves every frame, never held for a pose (${moved} moving, ${still} held)`),
  ];
});

group('a heal raises the bar\'s end as it flows in, with nothing cracked over it', () => {
  setUp();
  const d = depthAt(1);
  window.__serpent({ stage: 1, wound: d * 0.3 });
  for (let i = 0; i < 90; i++) frame();
  const low = frame().end;
  window.__serpent({ stage: 1, wound: d * 0.05 });
  const after = [];
  for (let i = 0; i < 60; i++) after.push(frame());
  const rose = after.every((f, i) => i === 0 || f.end >= after[i - 1].end);
  return [
    ok(after[after.length - 1].end > low + BAR_W * 0.1, `the end came back up (${low} to ${after[after.length - 1].end})`),
    ok(rose, 'it only rose on the way up'),
    // the last of the blows' crack is flowed over, never bitten off
    ok(after.filter(f => f.end > low).every(f => !f.crack), 'nothing cracked once it had flowed past the old end'),
  ];
});
