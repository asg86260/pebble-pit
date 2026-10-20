// Each camp its own slice of the window (the owner, 2026-10-20: "gods crowd
// should be off to the right. each crowd needs their own full vertical slice
// of the view, as well as enough space between them"): at every pan of the
// act, wherever both are in the window, nothing of God's camp -- stage,
// throne, God, his crowd, its flags, his words' waves -- is drawn left of
// AFTER_SLICE_GAP cells past the union's slice -- its crowd as drawn, the
// pedestal and the pair -- at a tall window and a short one, with either
// crowd at its fullest. Read off what the drawings are told to fill, in
// world px, which is where each lands on screen against the near layer
// (after/sky.js, `godFront`).
import { group, ok, run, yard } from './helpers.mjs';
import { AFTER_SLICE_GAP, STRIKE_SHARE, P } from '../src/config.js';
import { paintOn } from '../src/render/ctx.js';
import { drawSkyCrowd } from '../src/render/aftercrowd.js';
import { drawUnionCrowd } from '../src/render/after/unioncrowd.js';
import { stationBox, speakerAt } from '../src/after/place.js';
import { actPlace } from '../src/acts.js';

const S = yard.S;
const OPENING = ['house-fall', 'arrive', 'meet-god', 'refuse'];
const up = () => {
  window.__actsOn(true);
  window.__goPlace('after');
  for (const k of OPENING) if (!S.beatsDone.includes(k)) S.beatsDone.push(k);
  run(1);
};
// The x-extent, within the window, of every fill and blit one drawing makes.
function drawnIn(draw) {
  let lo = Infinity, hi = -Infinity;
  const take = (a, b) => {
    a = Math.max(a, S.camX); b = Math.min(b, S.camX + S.viewW);
    if (b > a) { lo = Math.min(lo, a); hi = Math.max(hi, b); }
  };
  const g = new Proxy({}, {
    get: (o, k) => (k === 'fillRect' ? (x, y, w) => { if (w > 0) take(x, x + w); }
                    : k === 'drawImage' ? (pic, x, y, w) => take(x, x + (w ?? pic.width))
                    : k in o ? o[k] : () => ({})),
    set: (o, k, v) => { o[k] = v; return true; }
  });
  paintOn({ getContext: () => g, width: S.W, height: S.H }, draw);
  return [lo, hi];
}
// A crowd of 4000 `k` of the way to the strike.
const share = k => { const n = 4000; S.after.rims = Array.from({ length: n }, (_, i) => (i < n * k * STRIKE_SHARE ? '9' : '0')).join(''); };

group("God's camp keeps its own slice of the window right of the union's, open sky between, at every pan", async () => {
  const out = [];
  for (const [w, h] of [[2000, 967], [800, 600]]) {
    S.W = w; S.H = h;
    for (const k of [0.05, 0.95]) {
      up();
      share(k); run(30);
      // the bodies out on the way walk between the camps: neither's slice
      S.after.bodies = [];
      const pl = actPlace('after'), x0 = pl.x0(), x1 = pl.x1(), b = stationBox('pedestal');
      let worst = Infinity, both = 0, at = null;
      for (let i = 0; i <= 60; i++) {
        window.__look(x0 + (x1 - S.viewW - x0) * i / 60); run(1 / 30);
        const [, uDrawn] = drawnIn(drawUnionCrowd);
        const pair = [b.x + b.w, speakerAt(1).x + P * 3].map(x => Math.min(x, S.camX + S.viewW)).filter(x => x > S.camX);
        const uHi = Math.max(uDrawn, ...pair);
        const [gLo] = drawnIn(drawSkyCrowd);
        if (!Number.isFinite(uHi) || !Number.isFinite(gLo)) continue;
        both++;
        if (gLo - uHi < worst) { worst = gLo - uHi; at = Math.round(S.camX + S.viewW / 2); }
      }
      window.__actsOn(null);
      out.push(ok(worst >= AFTER_SLICE_GAP * P, `${w}x${h}, ${k} of the way: his slice ${AFTER_SLICE_GAP} cells or more right of theirs at every pan showing both`,
                  `${both} pans showed both; nearest ${Math.round(worst)} px apart, at the window's middle ${at}`));
    }
  }
  return out;
}, { reload: false });
