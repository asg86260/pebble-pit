// The liquid sky on a real canvas (clouds.html): what test/clouds.test.mjs
// cannot see without a graphics card.
//
//   slide   each layer drawn alone, the clock stopped, the camera sliding a
//           fraction of a pixel a frame. Every frame must be the frame before
//           moved by exactly the layer's change of position, so nothing in a
//           layer shears or shimmers as it goes (its field is worked out
//           afresh every frame, in the layer's own cells, so this also holds
//           the card's answer to the same cell steady as the window moves);
//           and along every row each run of one tone must be a whole number
//           of cells, so the art stays on its grid while the motion is free.
//   flips   the sky flowing at its own pace for ten seconds: how many of the
//           cells that change tone change straight back, within a tenth of
//           a second (chatter: fails over half a percent) and within a
//           second (mostly a thin band sweeping past: reported). A flowing
//           edge crosses a cell once; a cell that goes and comes straight
//           back is flicker.
//   cost    the whole sky at each window size: the main thread's
//           milliseconds a frame (the puffs moved and sent, the passes
//           queued, the layers drawn), median, 95th centile and worst, after
//           a warm-up; then again waiting for the card to finish each frame,
//           which on a software card (a headless browser) is its cost too.
//
//   GAME=http://localhost:<port>/ CDP_PORT=<n> node tools/clouds-check.mjs [slide|flips|cost]
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
const q = `const q = (a, p) => { const s = [...a].sort((x, y) => x - y); return +s[Math.floor(p * (s.length - 1))].toFixed(3); };`;
try {
  if (which === 'all' || which === 'slide') {
    for (const show of ['l0', 'l2', 'l4', 'ground']) {
      const key = show === 'ground' ? 'g' : show;
      const r = await ev(`(() => {
        bench.set({ win: '2000x967', show: ${JSON.stringify(show)}, t: 30, cam: 3, auto: true, slide: 7.3, speed: 0 });
        for (let i = 0; i < 20; i++) bench.frame(1 / 60);       // the fade settled
        const W = 2000;
        let prev = bench.pxRows(), was = bench.placed()[${JSON.stringify(key)}];
        let moved = 0, compared = 0, wrong = 0, runs = 0, offGrid = 0;
        for (let f = 0; f < 240; f++) {
          bench.frame(1 / 60);
          const cur = bench.pxRows(), now = bench.placed()[${JSON.stringify(key)}];
          const d = was - now;
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
        return { show: ${JSON.stringify(show)}, frames: 240, moved, compared, wrong, runs, offGrid };
      })()`);
      const ok = r.wrong === 0 && r.offGrid === 0 && r.moved > 0 && r.runs > 0;
      if (!ok) failed = true;
      console.log(`${ok ? 'ok  ' : 'FAIL'} slide ${r.show.padEnd(6)} moved on ${r.moved}/${r.frames} frames, ` +
        `${r.compared} pixels compared, ${r.wrong} out of place, ${r.offGrid} of ${r.runs} tone runs off the grid`);
    }
  }
  if (which === 'all' || which === 'flips') {
    for (const key of ['l2', 'l3', 'l4', 'g']) {
      const r = await ev(`(() => {
        bench.set({ win: '2000x967', show: 'all', t: 40, cam: 0, auto: false, slide: 0, speed: 1 });
        for (let i = 0; i < 30; i++) bench.frame(1 / 60);
        // tracked in the layer's own cells, so the window stepping a cell
        // with the wind is not taken for every cell changing
        const K = ${JSON.stringify(key)}, first = bench.tones(K), w = first.w, h = first.h, span = w * 8;
        const when = new Float64Array(span * h).fill(-9), from = new Int8Array(span * h), seen = new Int8Array(span * h).fill(-1);
        let changes = 0, back = 0, chatter = 0;
        for (let f = 1; f <= 600; f++) {
          bench.frame(1 / 60);
          const cur = bench.tones(K), ox = bench.placed()[K + ':ox'], t = f / 60;
          for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
            const j = y * span + (((ox + x) % span) + span) % span, v = cur.tones[y * w + x], was = seen[j];
            if (was >= 0 && v !== was) {
              changes++;
              if (t - when[j] < 1 && v === from[j]) back++;
              if (t - when[j] < 0.1 && v === from[j]) chatter++;
              when[j] = t; from[j] = was;
            }
            seen[j] = v;
          }
        }
        const n = w * h;
        return { key: ${JSON.stringify(key)}, cells: n, changes, back, chatter };
      })()`);
      // a cell that goes and comes back within a tenth of a second is
      // chatter, and fails; one back within a second is most often a thin
      // band (a belly, a crevice) sweeping past it, reported, not failed
      const share = r.changes ? r.back / r.changes : 0, chat = r.changes ? r.chatter / r.changes : 0;
      const ok = r.changes > 0 && chat <= 0.005;
      if (!ok) failed = true;
      console.log(`${ok ? 'ok  ' : 'FAIL'} flips ${r.key.padEnd(3)} ${r.changes} cell tone changes in 10 s (of ${r.cells} cells): ` +
        `${r.chatter} back within 0.1 s (${(chat * 100).toFixed(2)}%), ${r.back} back within 1 s (${(share * 100).toFixed(2)}%)`);
    }
  }
  if (which === 'all' || which === 'slivers') {
    // The drawn tones, as the card leaves them (bench.tones): no tone of a sky
    // layer stands one cell thick -- a line, a sliver, a speck -- past a share
    // SLIVER_SHARE of its cloud cells (the owner, 2026-10-20: far clouds read
    // as "single cell lines and a bit messy"). The silhouette alone is checked
    // in the node tier too (test/clouds.test.mjs); this is the bands on it.
    const SLIVER_SHARE = 0.04;
    for (const key of ['l0', 'l1', 'l2', 'l3', 'l4']) {
      const r = await ev(`(() => {
        bench.set({ win: '2000x967', show: 'all', t: 200, cam: 0, auto: false, slide: 0, speed: 1 });
        for (let i = 0; i < 30; i++) bench.frame(1 / 60);
        const { w, h, tones } = bench.tones(${JSON.stringify(key)}), at = (x, y) => (x < 0 || y < 0 || x >= w || y >= h ? 0 : tones[y * w + x]);
        let cloud = 0, thin = 0;
        for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
          const v = at(x, y);
          if (!v) continue;
          cloud++;
          if ((at(x - 1, y) !== v && at(x + 1, y) !== v) || (at(x, y - 1) !== v && at(x, y + 1) !== v)) thin++;
        }
        return { key: ${JSON.stringify(key)}, cloud, thin };
      })()`);
      const share = r.cloud ? r.thin / r.cloud : 0, ok = r.cloud > 0 && share <= SLIVER_SHARE;
      if (!ok) failed = true;
      console.log(`${ok ? 'ok  ' : 'FAIL'} slivers ${r.key} ${r.thin} of ${r.cloud} drawn cloud cells one cell thick in their tone (${(share * 100).toFixed(1)}%)`);
    }
  }
  if (which === 'all' || which === 'cost') {
    for (const win of ['2000x967', '800x600']) for (const sync of [false, true]) {
      const r = await ev(`(() => { ${q}
        bench.set({ win: ${JSON.stringify(win)}, show: 'all', t: 20, cam: 0, auto: true, slide: 3, speed: 1, sync: ${sync}, fresh: true });
        for (let f = 0; f < 120; f++) bench.frame(1 / 60);
        const from = bench.timings().cpu.length;
        for (let f = 0; f < 1200; f++) bench.frame(1 / 60);
        const c = bench.timings().cpu.slice(from), a = bench.timings().frame.slice(from);
        bench.set({ sync: false });
        return { win: ${JSON.stringify(win)}, frames: c.length, cpu: [q(c, 0.5), q(c, 0.95), q(c, 1)], all: [q(a, 0.5), q(a, 0.95), q(a, 1)] };
      })()`);
      console.log(`cost ${r.win.padEnd(8)} ${sync ? 'waiting for the card' : 'main thread only    '} over ${r.frames} frames, ms median / p95 / max: ` +
        `field ${r.cpu.join(' / ')}, with the drawing ${r.all.join(' / ')}`);
    }
  }
} finally {
  await tab.close();
  if (own) own.kill();
}
process.exit(failed ? 1 : 0);
