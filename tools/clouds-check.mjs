// The clouds on a real canvas (clouds.html): what test/clouds.test.mjs cannot
// see without one.
//
//   the slide: each kind drawn alone, the clock stopped, the camera sliding a
//     fraction of a pixel a frame. Every frame must be the frame before moved
//     by exactly the sheet's change of position, so nothing in a sheet shears
//     or shimmers as it goes; and along every row each run of one tone must
//     be a whole number of cells, so the art stays on its grid while the
//     motion is free of it.
//   the cost: every kind together at each window size, the clock at its own
//     pace and the camera sliding; the milliseconds the bakes and the draws
//     take a frame, median, 95th centile and worst, after a warm-up.
//
//   GAME=http://localhost:<port>/ CDP_PORT=<n> node tools/clouds-check.mjs [slide|cost]
//
// It needs a dev server, as look.mjs does; the browser is headless and muted
// (cdp.mjs) and is shut when the run ends if this run started it.

import { browser, openTab } from './cdp.mjs';

const base = process.env.GAME || 'http://localhost:5184/';
const page = (base.endsWith('/') ? base : base.replace(/[^/]*$/, '')) + 'clouds.html?manual';
const which = process.argv[2] || 'all';
const CELLPX = 5;

process.env.WINDOW = process.env.WINDOW || '2100,1200';
const { port, own } = await browser({ port: +(process.env.CDP_PORT || 9333) });
const tab = await openTab(port, page, { ready: "typeof window.bench === 'object'" });
const ev = async e => {
  const r = await tab.evaluate(e);
  if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 600));
  return r.result?.result?.value;
};
let failed = false;
try {
  if (which === 'all' || which === 'slide') {
    for (const kind of ['far', 'mid', 'puff', 'ground']) {
      const key = kind === 'puff' ? 'puff1' : kind;
      const r = await ev(`(() => {
        bench.set({ win: '2000x967', show: 'all', t: 30, cam: 3, auto: true, slide: 7.3, speed: 0, restart: true });
        bench.solo(${JSON.stringify(kind)});
        bench.frame(1 / 60);
        const W = 2000;
        let prev = bench.pxRows(), was = bench.drawnAt()[${JSON.stringify(key)}];
        let moved = 0, compared = 0, wrong = 0, runs = 0, offGrid = 0;
        for (let f = 0; f < 240; f++) {
          bench.frame(1 / 60);
          const cur = bench.pxRows(), now = bench.drawnAt()[${JSON.stringify(key)}];
          // a band is drawn at minus its scroll, a lone cloud at its x
          const d = ${kind === 'puff' ? 'was - now' : 'now - was'};
          if (d) moved++;
          const rows = cur.length / W;
          for (let y = 0; y < rows; y++) {
            for (let x = 0; x < W; x++) {
              const xs = x + d;
              if (xs < 0 || xs >= W) continue;
              compared++;
              if (cur[y * W + x] !== prev[y * W + xs]) wrong++;
            }
            let start = 0;
            for (let x = 1; x <= W; x++) if (x === W || cur[y * W + x] !== cur[y * W + x - 1]) {
              if (start > 0 && x < W) { runs++; if ((x - start) % ${CELLPX}) offGrid++; }
              start = x;
            }
          }
          prev = cur; was = now;
        }
        bench.solo(null);
        return { kind: ${JSON.stringify(kind)}, frames: 240, moved, compared, wrong, runs, offGrid };
      })()`);
      const ok = r.wrong === 0 && r.offGrid === 0 && r.moved > 0 && r.runs > 0;
      if (!ok) failed = true;
      console.log(`${ok ? 'ok  ' : 'FAIL'} slide ${r.kind.padEnd(6)} moved on ${r.moved}/${r.frames} frames, ` +
        `${r.compared} pixels compared, ${r.wrong} out of place, ${r.offGrid} of ${r.runs} tone runs off the grid`);
    }
  }
  if (which === 'all' || which === 'cost') {
    for (const win of ['2000x967', '800x600']) {
      const r = await ev(`(() => {
        bench.set({ win: ${JSON.stringify(win)}, show: 'all', t: 20, cam: 0, auto: true, slide: 4, speed: 1, restart: true });
        for (let f = 0; f < 240; f++) bench.frame(1 / 60);          // the warm-up, start-up bakes and all
        const from = bench.timings().bake.length;
        for (let f = 0; f < 1800; f++) bench.frame(1 / 60);
        const t = bench.timings(), bake = t.bake.slice(from), draw = t.draw.slice(from);
        const q = (a, p) => { const s = [...a].sort((x, y) => x - y); return +s[Math.floor(p * (s.length - 1))].toFixed(3); };
        const sum = bake.map((b, i) => b + draw[i]);
        return { win: ${JSON.stringify(win)}, frames: bake.length,
          bake: [q(bake, 0.5), q(bake, 0.95), q(bake, 1)], draw: [q(draw, 0.5), q(draw, 0.95), q(draw, 1)],
          total: [q(sum, 0.5), q(sum, 0.95), q(sum, 1)] };
      })()`);
      console.log(`cost ${r.win.padEnd(8)} over ${r.frames} frames, ms median / p95 / max: ` +
        `bakes ${r.bake.join(' / ')}, draws ${r.draw.join(' / ')}, together ${r.total.join(' / ')}`);
    }
  }
} finally {
  await tab.close();
  if (own) own.kill();
}
process.exit(failed ? 1 : 0);
