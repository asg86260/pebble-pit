// Act 3's cloud floor on every page, read off the frame (render/after/
// floor.js): under a raised shelf the path's surface is the paper by day and
// the cloud tone it is the top of by night (cloudsky.js, `pathTone`), as
// written. That tone is already the dark page's own, so a fill that sent it
// through the page's map again turned it near the ink, a light slab under
// every shelf on the dark and dim pages. The page is turned where it stands,
// as the settings' switch does, so a theme changed mid-play is what is read.

import { S } from '../state.js';
import { P, GROUND_PATH, AFTER_LIP, CLOUDS_PALETTE, CLOUDS_ACT3 } from '../config.js';
import { ok, settle } from './kit.js';
import { draw } from '../render.js';
import { ctx } from '../render/ctx.js';
import { screenAt } from '../render/frame.js';
import { setTheme, themeNow, paper } from '../ink.js';
import { SCENES } from '../scenes.js';
import { signMid } from '../buildsign.js';
import { afterX0, afterFloor, floorProfile } from '../after/place.js';

const rgb = h => [1, 3, 5].map(i => parseInt(String(h).slice(i, i + 2), 16));
// the scanlines dim every other device row a little over the frame
const near = (a, b) => a.every((v, i) => Math.abs(v - b[i]) <= 12);
const LOT = 8;      // cells either side of the lot's sign read
const MOST = 0.75;  // of the columns read, the share that must be the surface

export const TESTS = [
  ["act 3's raised shelves stand on the cloud's own tone on the dark and dim pages, the paper on the light", async () => {
    const was = themeNow();
    SCENES['build-sign-after'].run();
    await settle(0.2);
    // The workshop's empty lot, raised, and in it the columns high enough
    // that the lip's underside (render/after/ground.js) stops above the
    // path's bottom: there the path's surface is bare. A body walking past
    // may stand over a column or two, so most of them are what is asked.
    const lot = signMid('after-workshop', 'after').x;
    const el = floorProfile(), top = afterFloor(), bot = top + GROUND_PATH.depth * P;
    const lipFoot = AFTER_LIP.drop + AFTER_LIP.hang + Math.ceil(AFTER_LIP.r[1] * AFTER_LIP.round / 2);
    const cols = [];
    for (let j = 0; j < el.length; j++) {
      const x = afterX0() + j * P + P / 2;
      if (x < S.camX + P || x > S.camX + S.viewW - P || Math.abs(x - lot) > LOT * P) continue;
      if (lipFoot - (el[j] || 0) < GROUND_PATH.depth - 1) cols.push(x);
    }
    const y = bot - P / 2;
    const read = () => cols.map(x => {
      const s = screenAt(x, y);
      // an even device row, clear of the scanlines' darkened ones
      const dy = Math.round(s.y * S.dpr) & ~1;
      return [...ctx.getImageData(Math.round(s.x * S.dpr), dy, 1, 1).data.slice(0, 3)];
    });
    const page = look => { setTheme(look); draw(); return read(); };
    const night = rgb(CLOUDS_PALETTE.dark[CLOUDS_ACT3.path.dark]);
    let got;
    try {
      got = { dark: page('dark'), dim: page('dim'), light: [page('light'), rgb(paper)] };
    } finally {
      setTheme(was);
    }
    const bad = (px, want) => px.filter(c => !near(c, want));
    const off = (px, want) => (bad(px, want).length > px.length * (1 - MOST) ? bad(px, want).map(c => c.join(',')).slice(0, 4).join(' ') : '');
    return [
      ok(cols.length >= LOT / 2, "the scene shows the workshop's raised lot, high enough to read under", `${cols.length} columns`),
      ok(!off(got.dark, night), `dark page: the shelf is the cloud's ${CLOUDS_PALETTE.dark[CLOUDS_ACT3.path.dark]}`, off(got.dark, night)),
      ok(!off(got.dim, night), `dim page: the shelf is the cloud's ${CLOUDS_PALETTE.dark[CLOUDS_ACT3.path.dark]}`, off(got.dim, night)),
      ok(!off(got.light[0], got.light[1]), 'light page: the shelf is the paper', off(got.light[0], got.light[1])),
    ];
  }],
];
