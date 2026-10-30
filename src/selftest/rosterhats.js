// A counter's hat sits on its body exactly as the sprite's own table says,
// read off the canvas. The sprite is placed on a half cell and the page's zoom
// is rarely whole, so a hat laid at its own rounding slides a device pixel off
// the head it is on; the scenes cover the yard's rosters and act 3's.

import { newRun, settle, ok, run, canvas, onScreen, asScreen } from './kit.js';
import { S } from '../state.js';
import { draw } from '../render.js';
import { P, WORKER } from '../config.js';
import { HATS, HATS_TIGHT, spriteW } from '../sprites.js';

const dark = v => v < 90;

// A hat laid between device pixels blends its edge into a grey the body's
// square never has, so the row is also read for any.
// For every counter on the list that wears a hat and is on screen: how far
// (device pixels) the hat's bottom row is from where the sprite puts it, on
// each side, against the body's own edges.
function measure(counters) {
  draw();
  const g = canvas().getContext('2d'), k = S.dpr;
  const out = [];
  for (const c of counters) {
    if (!c.mark) continue;
    const rows = HATS_TIGHT[c.mark] || HATS[c.mark] || HATS.helmet;
    const [hx, hy, hw, hh] = c.head, headH = hh - WORKER;
    const [sx0, sy0] = onScreen(hx, hy), [sx1] = onScreen(hx + hw, hy);
    if (sx0 < 0 || sx1 > document.documentElement.clientWidth || sy0 < 0 || sy0 > document.documentElement.clientHeight) continue;
    const extent = wy => {
      const row = Math.round(onScreen(0, wy)[1] * k);
      const a = Math.max(0, Math.floor(onScreen(hx - P * 3, 0)[0] * k)), z = Math.ceil(onScreen(hx + hw + P * 3, 0)[0] * k);
      const d = g.getImageData(a, row, z - a, 1).data;
      let lo = -1, hi = -1;
      for (let i = 0; i < z - a; i++) if (dark(d[i * 4])) { if (lo < 0) lo = i; hi = i + 1; }
      let soft = 0;
      if (lo >= 0) for (let i = Math.max(0, lo - 1); i < Math.min(z - a, hi + 1); i++) { const v = d[i * 4]; if (v > 40 && v < 215) soft++; }
      return lo < 0 ? null : [a + lo, a + hi, soft];
    };
    const body = extent(hy + hh - WORKER / 2);
    if (!body) { out.push({ mark: c.mark, missing: true }); continue; }
    const w = spriteW(rows) * P, scale = (onScreen(1, 0)[0] - onScreen(0, 0)[0]) * k;
    // each row of the hat in turn: where its dark runs begin and end against
    // the body's left edge, and any blended pixel inside it
    rows.forEach((row, r) => {
      const hat = extent(hy + headH - (rows.length - r) * P + P / 2);
      const left = row.indexOf('#'), right = row.lastIndexOf('#') + 1;
      const wantL = (WORKER - w) / 2 + left * P, wantR = (WORKER - w) / 2 + right * P;
      if (!hat) { out.push({ mark: c.mark, r, missing: true }); return; }
      out.push({ mark: c.mark, r, dl: (hat[0] - body[0]) - wantL * scale, dr: (hat[1] - body[0]) - wantR * scale, soft: hat[2] });
    });
  }
  return out;
}

const YARD = ['crew', 'kit', 'diggers', 'seats'];
const bad = list => list.filter(m => m.missing || Math.abs(m.dl) > 1 || Math.abs(m.dr) > 1 || m.soft > 0);

export const TESTS = [
  ['a counter\'s hat sits on its body where the sprite puts it, in the yard and in act 3, at several windows', async () => {
    const out = [];
    let seen = 0;
    for (const [w, h, dpr] of [[1440, 900, 1], [800, 600, 1], [1366, 768, 1.25], [1000, 700, 1.5]]) {
      await asScreen(w, h, dpr, async () => {
        const at = `${w}x${h}x${dpr}`;
        // the yard's rosters, then act 3's: scenes whose counters stand on
        // whole and on half cells
        for (const scene of YARD) {
          window.__scene(scene);
          await settle();
          const here = measure(window.__state().roster.flatMap(r => r.counters || []));
          out.push(ok(bad(here).length === 0, `every hat in ${scene} sits on its body at ${at}`, JSON.stringify(bad(here))));
          seen += here.length;
        }
        window.__scene('after-roster');
        await settle();
        const act3 = measure(window.__afterRoster().flatMap(r => r.counters || []));
        out.push(ok(bad(act3).length === 0, `every hat in act 3 sits on its body at ${at}`, JSON.stringify(bad(act3))));
        seen += act3.length;
      });
    }
    out.push(ok(seen > 4, 'hats were measured', String(seen)));
    // Act 3's roster scene is left standing otherwise, and the next group's
    // camera starts in the afterlife (the opening view reads 3926 of 800).
    newRun();
    return out;
  }],
];
