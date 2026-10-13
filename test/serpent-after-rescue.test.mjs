// The serpent after the rescue (DESIGN.md, "Endless serpent"): risen past the
// story it fights only its last defense, so its bar has no row of pips after
// it, only the level; and its belly never held him, so it has no cage of
// ribs. Before the rescue both are as they were.
//
// Read off what the bar and the coil draw this frame, on a context that keeps
// every fillRect: a pip is a square the pip's size with its edge, a rib a dark
// cell over the belly. The level is set by the hook -- reaching it the
// player's way is test/endless.test.mjs's -- since what is checked here is
// the drawing, not the climb.
import { group, ok, run, yard } from './helpers.mjs';
import { P, SERPENT_PHASES, BAR_PIP } from '../src/config.js';
import { now } from '../src/clock.js';
import { coilAt, bellySeg } from '../src/deep/place.js';
import { paintOn } from '../src/render/ctx.js';
import { GREYS } from '../src/render/deep.js';

const { drawSerpentBar } = await import('../src/render/serpentbar.js');
const { drawSerpent } = await import('../src/render/serpent.js');
const S = yard.S;
const LAST = SERPENT_PHASES - 1;

// Every fillRect a draw makes, with its fill; anything else it reaches for
// does nothing.
function rects(draw) {
  const out = [];
  const state = { fillStyle: null, globalAlpha: 1, imageSmoothingEnabled: false,
    measureText: t => ({ width: String(t).length * 6 }),
    fillRect: (x, y, w, h) => out.push({ x, y, w, h, c: state.fillStyle }) };
  const g = new Proxy(state, { get: (t, k) => (k in t ? t[k] : () => {}), set: (t, k, v) => { t[k] = v; return true; } });
  paintOn({ getContext: () => g, width: 800, height: 600 }, draw);
  return out;
}
// The pips the bar draws: each a square the pip's size plus its edge.
const pips = () => rects(drawSerpentBar).filter(r => r.w === BAR_PIP + 2 && r.h === BAR_PIP + 2).length;
// The ribs over the belly: the dark cells the coil lays over the cage.
function ribs() {
  const b = coilAt(bellySeg(), now());
  S.viewW = 800; S.viewH = 600; S.camX = b.x - 400; S.camY = b.y - 300;
  return rects(drawSerpent).filter(r => r.w === P && r.h === P && r.c === GREYS[2]).length;
}

group('before the rescue the bar carries its pips and the belly its cage of ribs', () => {
  window.__snatch({ played: true });
  window.__view('deep');
  window.__serpent({ stage: 2, wound: 0 });
  run(1);
  const n = pips(), r = ribs();
  return [
    ok(n === SERPENT_PHASES, `a pip a defense on the story's bar (${n} of ${SERPENT_PHASES})`),
    ok(r > 0, `ribs drawn over him (${r})`),
  ];
});

group('risen after the rescue, the bar has no pips and the belly no ribs', () => {
  window.__snatch({ played: true });
  window.__view('deep');
  window.__serpent({ level: 3, stage: LAST, wound: 0 });
  run(1);
  const n = pips(), r = ribs();
  return [
    ok(n === 0, `no pips after the bar past the story (${n})`),
    ok(r === 0, `no ribs over an empty belly (${r})`),
  ];
});
