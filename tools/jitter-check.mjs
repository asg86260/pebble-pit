// Shear and jitter under a panning camera, on any scene.
//
//   GAME=http://localhost:<port>/ CDP_PORT=<n> node tools/jitter-check.mjs <scene>[,<scene>...]
//       [--window 2000x967] [--frames 240] [--speed 2.7] [--out dir]
//       [--max-shear 0.004] [--max-jitter 0.001] [--max-offgrid 0.02] [--reach 6]
//
// --stutter k holds the camera k frames and then jumps it k frames' worth: a
// pan that is broken on purpose, to see the tool say FAIL.
// --speed is device pixels a frame of camera; --reach is how many times that a
// layer may be asked to move (act 3's ground cloud runs at about four and a
// half times the camera). --max-shear is a share of the pixels compared,
// --max-jitter a share of the tile-frames sure of their shift, --max-offgrid
// the rise in the off-cell share over the still picture.
//
// Nothing else can see this. The node tier has no canvas and the browser tier
// has no eyes, so "scrolling makes the cloud platform jitter" had nothing to
// go red. The scene is stood up as look.mjs stands it, the yard is held still
// (`__still`: the page keeps drawing, the sim does not step, so nothing
// animates by itself), and the camera is walked `--speed` device pixels a
// frame by setting `camX`, which is setup here and not the thing under test.
// Each frame is read off the canvas and compared to the one before.
//
// Regions are found by a column-tile search, not by bands of rows or a
// table of parallax rates. The window is cut into tiles (48 x 12 device
// pixels) and each tile is asked which whole-pixel shift s makes it the
// previous frame's pixels (cur[x] = prev[x + s*d], d the pan direction),
// among s in -2 .. speed+2. A layer is a stretch of tiles that agree on a
// shift, so no rate is written down here: a new layer, a changed ratio or a
// scene with none is measured the same. Bands of rows were rejected because
// act 3's layers interleave in height and the yard's sprites cross every
// band; a table of rates would be the guessed constant this repo's house
// style forbids. A tile whose best shift is not unique (flat sky, a
// repeating dither) says nothing about motion and is skipped.
//
//   shear   the pixels that still differ after their tile's best shift, as a
//           share of the pixels compared, worst frame. A layer that moves as
//           a rigid sheet leaves none; one that redraws at a different phase
//           than it scrolls leaves a seam of them.
//   jitter  a tile whose shift is more than one pixel from the median shift
//           that tile had over the whole pan (a steady fractional rate gives
//           k and k+1; 2, 0, 3 or 0, 0, 5 is the bug), counted in
//           tile-frames. Only tiles that are sure of their shift count: the
//           match is within a tenth of the tile and every other shift is
//           four times worse, or a near-flat tile would "jitter" on noise.
//           Only frames in which the camera really moved count; a camera
//           that hits its stop ends the run and says so.
//   grid    along every row, a run of one tone between two other tones that is
//           not a whole number of cells, as a share of the runs, sampled
//           every twelfth frame, against the same share in the picture before
//           the camera moves (where two layers meet, runs are odd by nature;
//           it is the rise under a pan that is the bug). The cell is read from
//           the page (P * zoom * dpr) and rounded to a device pixel.
//
// What it cannot see: anything that moves only on the sim's clock (the yard is
// held, so animation is out of scope and an `idle` figure says how much the
// page redraws by itself); a layer that is wrong in the same way as the
// layer beside it; a shift of more than speed+2 pixels; the DOM (boards,
// hud), which is not on the canvas; and whether the tone of a thing is right.
// A tile that straddles two layers carries a seam of residue by nature, which
// is why the shear threshold is a share and not zero.
//
// Exit 1 on any FAIL. The headless shell is muted and its own (cdp.mjs).

import { mkdirSync, writeFileSync } from 'node:fs';
import { browser, closeOtherTabs, openTab, standScene } from './cdp.mjs';

const args = process.argv.slice(2);
const flag = (name, dflt) => { const i = args.indexOf(name); return i >= 0 ? args[i + 1] : dflt; };
const valued = new Set(['--reach', '--stutter', '--window', '--frames', '--speed', '--out', '--max-shear', '--max-jitter', '--max-offgrid']);
const plain = args.filter((a, i) => !a.startsWith('--') && !valued.has(args[i - 1]));
const win = flag('--window', '2000x967');
const [WW, WH] = win.split('x').map(Number);
const opts = {
  frames: +flag('--frames', 240),
  speed: +flag('--speed', 2.7),
  maxShear: +flag('--max-shear', 0.004),
  maxJitter: +flag('--max-jitter', 0.001),
  maxOffGrid: +flag('--max-offgrid', 0.02),
  out: flag('--out', null),  reach: +flag('--reach', 6),
  stutter: +flag('--stutter', 1),
};
const want = (plain[0] || '').split(',').map(s => s.trim()).filter(Boolean);
if (!want.length || !WW || !WH) {
  console.log('usage: node tools/jitter-check.mjs <scene>[,<scene>...] [--window 2000x967] [--frames 240] [--speed px] [--out dir]');
  process.exit(2);
}

process.env.WINDOW = `${WW},${WH}`;
const PORT = +(process.env.CDP_PORT || 9333);
const { own } = await browser({ port: PORT });
await closeOtherTabs(PORT);
const tab = await openTab(PORT);
const done = code => { tab.close(); own?.kill(); process.exit(code); };

// Runs in the page. Plain JS only: it is sent as source.
async function measure(name, o) {
  const TW = 48, TH = 12, GRID_EVERY = 12;
  const { S } = await import('/src/state.js');          // live: __state() is a copy
  const { P } = await import('/src/config/yard.js');
  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const W = canvas.width, H = canvas.height;
  const raf = () => new Promise(r => requestAnimationFrame(() => r()));
  const grab = async () => { await raf(); await raf(); return new Uint32Array(ctx.getImageData(0, 0, W, H).data.buffer.slice(0)); };
  const cell = Math.max(1, Math.round(P * S.zoom * S.dpr));
  const px = () => S.camX * S.zoom * S.dpr;              // the camera in device pixels

  window.__still(true);
  window.__holdShot(0);
  // The page redraws by itself even held; how much of the picture that moves
  // with the camera standing is what no pan can be blamed for.
  const a0 = await grab();
  await new Promise(r => setTimeout(r, 1000));        // a drift on the wall clock shows over a second, not over a frame
  const a1 = await grab();
  let idle = 0;
  for (let i = 0; i < a0.length; i++) if (a0[i] !== a1[i]) idle++;

  // Runs of one tone between two others, and how many are not whole cells.
  const gridOf = fr => {
    let n = 0, off = 0;
    for (let y = 0; y < H; y++) {
      const row = y * W;
      let start = 0;
      for (let x = 1; x <= W; x++) if (x === W || fr[row + x] !== fr[row + x - 1]) {
        if (start > 0 && x < W) { n++; if ((x - start) % cell) off++; }
        start = x;
      }
    }
    return [n, off];
  };
  const still = gridOf(a1);                // the picture before it moves: the share to hold to

  // Which way the room is: try right, and left if the camera will not go.
  const step = o.speed / (S.zoom * S.dpr);
  const x0 = S.camX;
  window.__look(x0 + step * 4);
  let d = S.camX - x0 > step * 2 ? 1 : -1;
  window.__look(x0);
  if (d < 0) { window.__look(x0 - step * 4); if (x0 - S.camX < step * 2) d = 0; window.__look(x0); }
  if (d === 0) return { name, err: 'the camera cannot pan from here' };

  const nx = Math.ceil(W / TW), ny = Math.ceil(H / TH);
  const lo = -2, hi = Math.ceil(o.speed * o.reach) + 2, ns = hi - lo + 1;
  let prev = await grab(), prevPx = px();
  const shifts = new Float32Array(o.frames * nx * ny).fill(NaN);   // NaN: skipped
  const jshifts = new Float32Array(o.frames * nx * ny).fill(NaN);  // the ones a tile is sure of
  const moved = [];
  const frameRes = [], frameCmp = [];
  let worst = null, offRuns = 0, runs = 0, gridFrames = 0;
  let stopped = null;
  // `--stutter k` holds the camera k frames and jumps it k frames' worth: the
  // pan the tool exists to catch, made on purpose, so a run can prove it fails.
  const k = o.stutter || 1;
  const camAt = f => x0 + d * step * (Math.floor((f + 1) / k) * k);

  for (let f = 0; f < o.frames; f++) {
    const want = camAt(f);
    window.__look(want);
    const cur = await grab();
    const now = px();
    if (Math.abs(S.camX - want) > step * 0.5) { stopped = f; break; }       // the camera's stop: it would not go where it was sent
    moved.push(f);
    prevPx = now;
    let res = 0, cmp = 0;
    const best = new Int32Array(nx * ny);
    for (let ty = 0; ty < ny; ty++) {
      const ya = ty * TH, yb = Math.min(H, ya + TH);
      for (let tx = 0; tx < nx; tx++) {
        const xa = tx * TW, xb = Math.min(W, xa + TW);
        // The best shift and the runner-up. A candidate is dropped as soon as it
        // is clearly worse than the best (4x and 16 pixels over), which is as
        // exact as the margin test below needs the runner-up to be.
        let bs = 0, bc = 1e9, second = 1e9, tie = false;
        for (let si = 0; si < ns; si++) {
          const s = (lo + si) * d;
          const xlo = Math.max(xa, -s), xhi = Math.min(xb, W - s);       // x + s inside the frame
          if (xhi <= xlo) continue;
          let c = 0;
          const lim = bc === 1e9 ? 1e9 : Math.max(bc * 4, bc + 16);
          for (let y = ya; y < yb && c <= lim; y++) {
            const row = y * W;
            for (let x = xlo; x < xhi; x++) if (cur[row + x] !== prev[row + x + s]) c++;
          }
          if (c < bc) { second = bc; bc = c; bs = lo + si; tie = false; } else if (c === bc) tie = true;
          else if (c < second) second = c;
        }
        const t = ty * nx + tx;
        best[t] = bc;
        if (bc === 1e9 || tie) continue;
        shifts[(f * ny + ty) * nx + tx] = bs;
        // Sure of its shift: it matches, and no other shift comes close.
        if (bc <= 0.1 * (yb - ya) * (xb - xa) && second > Math.max(bc * 4, bc + 16)) {
          // ...and carries edges enough to have a shift to be sure of
          let edges = 0;
          for (let y = ya; y < yb; y++) for (let x = xa + 1; x < xb; x++) if (cur[y * W + x] !== cur[y * W + x - 1]) edges++;
          if (edges >= 12) jshifts[(f * ny + ty) * nx + tx] = bs;
        }
        res += bc; cmp += (yb - ya) * (xb - xa);
        // keep the worst frame's pair to draw
        best[t] = bc;
      }
    }
    frameRes.push(res); frameCmp.push(cmp);
    if (!worst || res / Math.max(1, cmp) > worst.share) worst = { f, share: res / Math.max(1, cmp), cur, prev, best: best.slice(), shifts: shifts.slice(f * nx * ny, (f + 1) * nx * ny) };

    if (f % GRID_EVERY === 0) {
      gridFrames++;
      const g = gridOf(cur);
      runs += g[0]; offRuns += g[1];
    }
    prev = cur;
  }

  // Jitter: a tile's shift against that tile's own median over the pan.
  const n = moved.length;
  const rates = {}, badTile = new Uint16Array(nx * ny);
  let jit = 0, jitTiles = 0, jitMax = 0, jitWorst = null, used = 0, sure = 0;
  for (let t = 0; t < nx * ny; t++) {
    const seq = [];
    for (let i = 0; i < n; i++) { const v = jshifts[i * nx * ny + t]; if (v === v) seq.push([i, v]); }
    if (seq.length < 8) continue;
    used++; sure += seq.length;
    const sorted = seq.map(e => e[1]).sort((p, q) => p - q);
    const med = sorted[sorted.length >> 1];
    rates[med] = (rates[med] || 0) + 1;
    let bad = 0;
    for (const [i, v] of seq) {
      const dev = Math.abs(v - med);
      if (dev > 1) { bad++; if (dev > jitMax) { jitMax = dev; jitWorst = { frame: i, tile: [t % nx * TW, Math.floor(t / nx) * TH], was: med, got: v }; } }
    }
    if (bad) { jit += bad; jitTiles++; badTile[t] = bad; }
  }

  let shearMax = 0, shearAt = -1, resTot = 0, cmpTot = 0;
  frameRes.forEach((r, i) => { const s = r / Math.max(1, frameCmp[i]); resTot += r; cmpTot += frameCmp[i]; if (s > shearMax) { shearMax = s; shearAt = i; } });

  let png = null;
  if (worst && o.draw) {
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d'), img = g.createImageData(W, H), u = new Uint32Array(img.data.buffer);
    for (let i = 0; i < u.length; i++) { const p = worst.cur[i]; const v = ((p & 255) + ((p >> 8) & 255) + ((p >> 16) & 255)) / 3 | 0; u[i] = 0xff000000 | (v >> 1) + 96 << 16 | (v >> 1) + 96 << 8 | (v >> 1) + 96; }
    for (let ty = 0; ty < ny; ty++) for (let tx = 0; tx < nx; tx++) {
      const sh = worst.shifts[ty * nx + tx];
      if (sh !== sh) continue;
      const s = sh * d;
      for (let y = ty * TH; y < Math.min(H, ty * TH + TH); y++) for (let x = tx * TW; x < Math.min(W, tx * TW + TW); x++) {
        const xs = x + s;
        if (xs >= 0 && xs < W && worst.cur[y * W + x] !== worst.prev[y * W + xs]) u[y * W + x] = 0xff2020e0;   // ABGR: red
      }
    }
    // tiles that jittered somewhere in the pan, boxed in blue
    for (let t = 0; t < nx * ny; t++) if (badTile[t]) {
      const x0 = t % nx * TW, y0 = Math.floor(t / nx) * TH;
      for (let x = x0; x < Math.min(W, x0 + TW); x++) { u[y0 * W + x] = 0xffe04040; u[Math.min(H - 1, y0 + TH - 1) * W + x] = 0xffe04040; }
    }
    g.putImageData(img, 0, 0);
    png = c.toDataURL('image/png');
  }
  window.__still(false);
  return { name, win: W + 'x' + H, cell, dir: d, moved: n, stopped, idle, tilesUsed: used, tilesAll: nx * ny,
    shearMax, shearAt, shearMean: resTot / Math.max(1, cmpTot), resTot,
    jit, jitTiles, jitMax, jitWorst, sure, rates, still, runs, offRuns, gridFrames, png };
}

const list = (await tab.evaluate('window.__scenes()')).result?.result?.value;
const known = new Set((list || []).flatMap(([, names]) => names));
const unknown = want.filter(n => !known.has(n));
if (unknown.length) {
  console.log(`no scene ${unknown.map(n => `"${n}"`).join(', ')}. there is: ${[...known].join(', ')}`);
  done(1);
}
if (opts.out) mkdirSync(opts.out, { recursive: true });

let failed = false;
for (const name of want) {
  await standScene(tab, name);
  const r = (await tab.evaluate(`(${measure.toString()})(${JSON.stringify(name)}, ${JSON.stringify({ ...opts, draw: !!opts.out })})`));
  const v = r.result?.result?.value;
  if (!v || v.err) {
    failed = true;
    console.log(`FAIL ${name}: ${v?.err || JSON.stringify(r.result?.exceptionDetails || r).slice(0, 400)}`);
    continue;
  }
  const offShare = v.runs ? v.offRuns / v.runs : 0, stillShare = v.still[0] ? v.still[1] / v.still[0] : 0;
  const why = [];
  if (v.moved < opts.frames / 2) why.push(`camera moved on only ${v.moved}/${opts.frames} frames`);
  if (v.tilesUsed < 20) why.push(`only ${v.tilesUsed} tiles carry a measurable shift`);
  if (v.shearMax > opts.maxShear) why.push('shear');
  if (v.jit / Math.max(1, v.sure) > opts.maxJitter) why.push('jitter');
  if (offShare - stillShare > opts.maxOffGrid) why.push('grid');
  const bad = why.length > 0;
  if (bad) failed = true;
  console.log(`${bad ? 'FAIL' : 'ok  '} ${name.padEnd(14)} ${v.win} cell ${v.cell}px, camera ${v.dir > 0 ? 'right' : 'left'} ${opts.speed}px x ${v.moved}f` +
    `${v.stopped != null ? ` (stopped at ${v.stopped})` : ''}; ` +
    `shear worst ${(v.shearMax * 100).toFixed(3)}% (frame ${v.shearAt}, mean ${(v.shearMean * 100).toFixed(3)}%); ` +
    `jitter ${v.jit} of ${v.sure} sure tile-frames (${(100 * v.jit / Math.max(1, v.sure)).toFixed(3)}%) in ${v.jitTiles} of ${v.tilesUsed} tiles` +
    (v.jitWorst ? ` (worst: frame ${v.jitWorst.frame} at ${v.jitWorst.tile.join(',')} median ${v.jitWorst.was} got ${v.jitWorst.got})` : '') + `; ` +
    `rates px/frame:tiles ${Object.entries(v.rates).sort((p, q) => q[1] - p[1]).slice(0, 6).map(([k, n]) => `${k}:${n}`).join(' ')}; grid ${(offShare * 100).toFixed(2)}% of ${v.runs} runs off cells (${(stillShare * 100).toFixed(2)}% held still); idle ${v.idle}px` +
    (bad ? `  <- ${why.join(', ')}` : ''));
  if (v.png && opts.out) {
    const file = `${opts.out}/${name}-jitter.png`;
    writeFileSync(file, Buffer.from(v.png.split(',')[1], 'base64'));
    console.log(`     worst frame: ${file}`);
  }
}
done(failed ? 1 : 0);
