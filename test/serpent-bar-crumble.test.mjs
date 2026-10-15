// The serpent's bar chips (DESIGN.md, "The serpent's bar"; the owner,
// 2026-10-15: "the whole damage should be chipped off at the same time"): a
// blow breaks off the whole stretch it took in the frame it lands -- the
// fill's end drops there at once, and the stretch, cut into BAR_BITE square
// bites, is held lit and then thrown all together, every chip moving every
// frame; a blow under a bite still chips; a break breaks off what was left
// the same way; and a heal raises the end as it flows in, with no chips.
//
// Read off what the bar draws, frame by frame, on a context that keeps every
// fillRect. The wound is set by the hook: what is checked is the drawing, and
// the blows that make a wound are test/serpent-numbers.test.mjs's.
import { group, ok, run, yard } from './helpers.mjs';
import { BAR_W, BAR_H, BAR_BITE, BAR_BITE_MIN, BAR_BITE_HOLD_S, BAR_BITE_FALL_S, BAR_LEFT, BAR_CHIP } from '../src/config.js';
import { depthAt } from '../src/deep/depth.js';
import { paintOn } from '../src/render/ctx.js';

const { drawSerpentBar, barRect } = await import('../src/render/serpentbar.js');
const S = yard.S;
const FRAME = 1 / 60;
// long enough for every chip of a blow to be held, thrown and gone
const GONE = Math.round((BAR_BITE_HOLD_S + BAR_BITE_FALL_S) / FRAME) + 6;

function rects(draw) {
  const out = [];
  const state = { fillStyle: null, globalAlpha: 1, imageSmoothingEnabled: false,
    measureText: t => ({ width: String(t).length * 6 }),
    fillRect: (x, y, w, h) => out.push({ x, y, w, h, c: state.fillStyle }) };
  const g = new Proxy(state, { get: (t, k) => (k in t ? t[k] : () => {}), set: (t, k, v) => { t[k] = v; return true; } });
  paintOn({ getContext: () => g, width: 800, height: 600 }, draw);
  return out;
}

// One frame on, drawn: where the fill's end stands (pixels along the bar),
// the chips held lit on it, and the square chips in the air (a fill rect half
// the bar high and at most a bite wide; the tumbling one is a diamond on its
// odd quarter turns, and not counted then).
function frame() {
  run(FRAME);
  const r = barRect(), out = rects(drawSerpentBar);
  const inBar = q => q.y >= r.y - 10 && q.y + q.h <= r.y + r.h + 10;
  const fill = out.find(q => q.c === BAR_LEFT && q.h === BAR_H && inBar(q));
  const end = fill ? fill.x + fill.w - r.x : 0;
  const chips = out.filter(q => q.c === BAR_LEFT && q.w <= BAR_BITE && q.h === BAR_H / 2);
  const held = out.filter(q => q.c === BAR_CHIP && q.h === BAR_H / 2);
  return { end, chips, held };
}

function setUp() {
  window.__snatch({ played: true });
  window.__view('deep');
  window.__serpent({ stage: 1, wound: 0 });
  // till the bar stands full and nothing is in the air
  for (let i = 0; i < GONE * 3; i++) { const f = frame(); if (i >= 30 && f.end === BAR_W && !f.held.length && !f.chips.length) break; }
}

// The frames a run first shows something on: where `n(frame)` goes from
// nothing to something.
const starts = (seen, n) => seen.map((f, i) => (n(f) > 0 && (i === 0 || n(seen[i - 1]) === 0) ? i : -1)).filter(i => i >= 0);

group('a blow breaks off its whole stretch at once: the end drops in one frame, every chip goes together and moves every frame', () => {
  setUp();
  const d = depthAt(1);
  const before = frame().end;
  window.__serpent({ stage: 1, wound: d * 0.2 });
  const seen = [];
  for (let i = 0; i < GONE; i++) seen.push(frame());
  const drops = seen.map((f, i) => (i ? seen[i - 1].end : before) - f.end).filter(by => by > 0);
  const took = before - seen[seen.length - 1].end;
  const bites = 2 * Math.ceil(took / BAR_BITE);
  const heldAt = starts(seen, f => f.held.length), flewAt = starts(seen, f => f.chips.length);
  const heldN = seen.map(f => f.held.length).filter(n => n > 0);
  const firstFlight = flewAt.length ? seen[flewAt[0]].chips.length : 0;
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
    ok(drops.length === 1 && Math.abs(took - BAR_W * 0.2) <= 1, `the end dropped once, by the whole blow (${drops.join(', ')} of ${BAR_W * 0.2} px)`),
    ok(heldAt.length === 1 && heldAt[0] === 0, `every bite held lit from the frame the blow landed (from frame ${heldAt.join(', ')})`),
    ok(heldN.length > 0 && heldN.every(n => n === bites), `all ${bites} chips held together, none added later (${[...new Set(heldN)].join(', ')})`),
    ok(flewAt.length === 1 && firstFlight === bites, `all of them flicked off in the same frame (${firstFlight} of ${bites}, in ${flewAt.length} start(s))`),
    ok(moved > 5 && still === 0, `a falling chip moves every frame, never held for a pose (${moved} moving, ${still} held)`),
  ];
});

group('a blow under a bite still breaks off a chip', () => {
  setUp();
  window.__serpent({ stage: 1, wound: depthAt(1) * 0.001 });
  const f = frame();
  return [
    ok(f.held.length === 2 && f.held.every(q => q.w === BAR_BITE_MIN),
      `one narrow bite, its two halves ${BAR_BITE_MIN} px wide, held lit (${f.held.map(q => q.w).join(', ')})`),
  ];
});

group('a break breaks off everything that was left at once', () => {
  setUp();
  window.__serpent({ stage: 1, wound: depthAt(1) * 0.5 });
  for (let i = 0; i < GONE; i++) frame();
  const left = frame().end;
  window.__serpent({ stage: 2, wound: 0 });
  const seen = [];
  for (let i = 0; i < 10; i++) seen.push(frame());
  const want = 2 * Math.ceil(left / BAR_BITE);
  const heldAt = starts(seen, g => g.held.length);
  return [
    ok(heldAt.length === 1 && seen[heldAt[0]].held.length === want,
      `all ${want} chips of the ${left} px left held in one frame (${heldAt.map(i => seen[i].held.length).join(', ')})`),
  ];
});

group('a heal raises the bar\'s end as it flows in, with no chips', () => {
  setUp();
  const d = depthAt(1);
  window.__serpent({ stage: 1, wound: d * 0.3 });
  for (let i = 0; i < GONE; i++) frame();
  const low = frame().end;
  window.__serpent({ stage: 1, wound: d * 0.05 });
  const after = [];
  for (let i = 0; i < 60; i++) after.push(frame());
  const rose = after.every((f, i) => i === 0 || f.end >= after[i - 1].end);
  return [
    ok(after[after.length - 1].end > low + BAR_W * 0.1, `the end came back up (${low} to ${after[after.length - 1].end})`),
    ok(rose, 'it only rose on the way up'),
    ok(after.every(f => f.held.length === 0 && f.chips.length === 0), 'nothing breaks off on the way up'),
  ];
});
