// Shear and jitter under a panning camera, on any scene.
//
//   GAME=http://localhost:<port>/ CDP_PORT=<n> node tools/jitter-check.mjs <scene>[,<scene>...]
//       [--window 2000x967] [--frames 240] [--speed 2.7] [--out dir]
//       [--max-shear 0.01] [--max-jitter 0.001] [--max-offgrid 0.04] [--reach 6]
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
//   shear   the pixels that no shift explains, as a share of the pixels
//           compared, worst frame. A tile gets up to two shifts: the best
//           one, then (when more than 4% of the tile is left) a second fitted
//           to what is left, drawn from the shifts that pure tiles elsewhere
//           in that frame found, and a pixel is explained by either. A tile
//           where two layers at different rates meet is thereby explained;
//           what is left is a layer that does not move as a rigid sheet.
//   jitter  a layer's shift leaving its own median by more than a pixel (a
//           steady fractional rate gives k and k+1; 2, 0, 3 or 0, 0, 5 is the
//           bug), counted in tile-frames. A layer is a group of tiles with the
//           same median shift (two groups in a tile that showed two shifts in
//           one frame, eight times or more). A layer jumps as a whole, so a
//           deviation counts only when a third of that layer's sure tiles,
//           and at least eight, leave together that frame; one tile whose
//           content changed as layers slid through it does not. Only tiles
//           that are sure of their shift take part: edges enough, what is
//           left a tenth of the tile at most, and a lone shift four times
//           better than every other. A jump (3 px or more off the median) and
//           a wobble (2 px off: a layer reversing a pixel) are counted apart,
//           because the yard's sky layer wobbles a little on some seeds and
//           nothing else does. Only frames in which the camera really
//           moved count; a camera that hits its stop ends the run and says so.
//
// Thresholds sit above the noise of main, 7cf32ad4, three runs of each scene:
// shear worst frame yard 0.04-0.06%, act 3 0.31-0.40% (limit 1%); jumps 0 on
// every scene (limit 0.1%); wobbles yard 0-0.19% (a sky layer, some seeds),
// act 3 0-0.01% (limit 0.5%); off-grid rise over the still picture at most 1.9
// points (limit 4). The act 3 crowd snapped to 30 px reads 2.5-2.8% shear (and
// 0.2-0.3% wobbles, under the limit), so it is shear that catches it;
// --stutter 3 reads 31% jumps.
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
const valued = new Set(['--reach', '--stutter', '--window', '--frames', '--speed', '--out', '--max-shear', '--max-jitter', '--max-wobble', '--max-offgrid']);
const plain = args.filter((a, i) => !a.startsWith('--') && !valued.has(args[i - 1]));
const win = flag('--window', '2000x967');
const [WW, WH] = win.split('x').map(Number);
const opts = {
  frames: +flag('--frames', 240),
  speed: +flag('--speed', 2.7),
  maxShear: +flag('--max-shear', 0.01),
  maxJitter: +flag('--max-jitter', 0.001),
  maxOffGrid: +flag('--max-offgrid', 0.04),
  maxWobble: +flag('--max-wobble', 0.005),
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
  // Nothing is imported from the game's modules: after an edit vite serves a
  // second instance of a module and every reading is stale. The page's own
  // handles give the zoom, dpr and cell, and `__look` sets the camera and
  // answers with where it went (in whole world units).
  const V = window.__state();
  const canvas = document.getElementById('c');
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  const W = canvas.width, H = canvas.height;
  const raf = () => new Promise(r => requestAnimationFrame(() => r()));
  const grab = async () => { await raf(); await raf(); return new Uint32Array(ctx.getImageData(0, 0, W, H).data.buffer.slice(0)); };
  const cell = Math.max(1, Math.round(V.cellDevicePx));
  const zd = V.zoom * V.dpr;

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
  const step = o.speed / zd;
  const x0 = window.__look(V.camX);
  const tol = Math.max(1, step * 0.5);                 // __look answers in whole units
  let d = window.__look(x0 + step * 6) - x0 > step * 3 ? 1 : -1;
  window.__look(x0);
  if (d < 0) { if (x0 - window.__look(x0 - step * 6) < step * 3) d = 0; window.__look(x0); }
  if (d === 0) return { name, err: 'the camera cannot pan from here' };

  const nx = Math.ceil(W / TW), ny = Math.ceil(H / TH);
  const lo = -2, hi = Math.ceil(o.speed * o.reach) + 2, ns = hi - lo + 1;
  let prev = await grab();
  const NT = nx * ny, nf = o.frames * NT;
  const shifts = new Float32Array(nf).fill(NaN), shifts2 = new Float32Array(nf).fill(NaN);   // NaN: none
  const jshifts = new Float32Array(nf).fill(NaN), jshifts2 = new Float32Array(nf).fill(NaN);  // the ones a tile is sure of
  let mixedTF = 0, allTF = 0;
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
    if (Math.abs(window.__look(want) - want) > tol) { stopped = f; break; }   // the camera's stop: it would not go where it was sent
    moved.push(f);
    let res = 0, cmp = 0;
    const base = f * NT;
    // Pass 1: each tile's best shift. Pass 2: for a tile that one shift does not
    // explain, a second shift for what is left over, drawn from the shifts that
    // pure tiles elsewhere in this frame found (a layer is a rate the frame
    // shows somewhere on its own). A pixel is explained by either.
    const b1 = new Int32Array(NT).fill(-99), c1 = new Int32Array(NT), sec1 = new Int32Array(NT);
    const hist = new Map();
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
        if (bc === 1e9 || tie) continue;
        b1[t] = bs; c1[t] = bc; sec1[t] = second;
        if (bc <= 0.1 * (yb - ya) * (xb - xa)) hist.set(bs, (hist.get(bs) || 0) + 1);
      }
    }
    const cands = [...hist].filter(([, n]) => n >= 2).map(([s]) => s);
    const edgesOf = (xa, xb, ya, yb) => {
      let e = 0;
      for (let y = ya; y < yb; y++) for (let x = xa + 1; x < xb; x++) if (cur[y * W + x] !== cur[y * W + x - 1]) e++;
      return e;
    };
    for (let ty = 0; ty < ny; ty++) {
      const ya = ty * TH, yb = Math.min(H, ya + TH);
      for (let tx = 0; tx < nx; tx++) {
        const t = ty * nx + tx, xa = tx * TW, xb = Math.min(W, xa + TW);
        if (b1[t] === -99) continue;
        const area = (yb - ya) * (xb - xa), bs = b1[t], bc = c1[t];
        shifts[base + t] = bs;
        let left = bc, s2 = null;
        if (bc > 0.04 * area) {
          const s = bs * d;
          const rest = [];
          for (let y = ya; y < yb; y++) for (let x = Math.max(xa, -s); x < Math.min(xb, W - s); x++) if (cur[y * W + x] !== prev[y * W + x + s]) rest.push(y * W + x);
          let bestN = -1, bestS = null, tied = false;
          for (const c of cands) {
            if (c === bs) continue;
            const sc = c * d;
            let n = 0;
            for (const i of rest) { const x = i % W; if (x + sc >= 0 && x + sc < W && cur[i] === prev[i + sc]) n++; }
            const wgt = hist.get(c);
            if (n > bestN || (n === bestN && wgt > hist.get(bestS))) { bestN = n; bestS = c; tied = false; }
            else if (n === bestN && wgt === hist.get(bestS)) tied = true;
          }
          if (bestS !== null && !tied && bestN >= 0.4 * rest.length && bestN >= 0.03 * area) { s2 = bestS; left = rest.length - bestN; shifts2[base + t] = s2; }
        }
        // Sure of its shift: what is left is a tenth of the tile at most, it has
        // edges enough to have a shift to be sure of, and a lone shift beats
        // every other by four times.
        if (left <= 0.1 * area && edgesOf(xa, xb, ya, yb) >= 12 && (s2 !== null || sec1[t] > Math.max(bc * 4, bc + 16))) {
          jshifts[base + t] = bs;
          if (s2 !== null) jshifts2[base + t] = s2;
        }
        allTF++; if (s2 !== null) mixedTF++;
        res += left; cmp += area;
      }
    }
    frameRes.push(res); frameCmp.push(cmp);
    if (!worst || res / Math.max(1, cmp) > worst.share) worst = { f, share: res / Math.max(1, cmp), cur, prev, s1: shifts.slice(base, base + NT), s2: shifts2.slice(base, base + NT) };

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
  const layerAt = new Map();
  let wob = 0;
  for (let t = 0; t < nx * ny; t++) {
    // Every shift the tile was sure of, from either fit, with the frame.
    const seq = [];
    let both = 0;
    for (let i = 0; i < n; i++) {
      const a = jshifts[i * NT + t], b = jshifts2[i * NT + t];
      if (a === a) seq.push([i, a]);
      if (b === b) { seq.push([i, b]); both++; }
    }
    if (seq.length < 8) continue;
    used++; sure += seq.length;
    // One layer, or two? Two only if the tile showed two shifts in the same
    // frame at least eight times, and the shifts fall in two groups split at
    // their widest gap (more than a pixel). Without that proof the tile is one
    // layer, and a shift that leaves its median is that layer jumping: 0, 0, 9
    // on a stuttering camera is never taken for a second layer.
    const sorted = seq.map(e => e[1]).sort((p, q) => p - q);
    let cut = -1;
    if (both >= 8) {
      let gap = 1;
      for (let i = 1; i < sorted.length; i++) if (sorted[i] - sorted[i - 1] > gap) { gap = sorted[i] - sorted[i - 1]; cut = i; }
      if (cut < 8 || sorted.length - cut < 8) cut = -1;
    }
    const lowTop = cut >= 0 ? sorted[cut - 1] : Infinity;
    const groups = cut >= 0 ? [sorted.slice(0, cut), sorted.slice(cut)] : [sorted];
    const meds = groups.map(g => g[g.length >> 1]);
    meds.forEach(m => { rates[m] = (rates[m] || 0) + 1; });
    for (const [i, v] of seq) {
      const med = meds[cut >= 0 && v > lowTop ? 1 : 0];
      const key = med + '@' + i;                       // the layer (its median shift) in that frame
      const g = layerAt.get(key) || { tot: 0, dev: [] };
      g.tot++;
      if (Math.abs(v - med) > 1) g.dev.push([t, v, med, i]);
      layerAt.set(key, g);
    }
  }
  // A layer jumps as a whole. A tile's shift that leaves its median while the
  // other tiles on that layer keep theirs is a tile whose content changed as
  // the layers slid through it (the union's crowd over the far cloud, God's
  // layer over the fixed sky), not a layer reversing: it counts only when a
  // third of the layer's tiles that frame, and at least eight, leave together.
  const flagged = new Set();
  for (const g of layerAt.values()) {
    if (g.dev.length < 8 || g.dev.length < g.tot * 0.3) continue;
    for (const [t, v, med, i] of g.dev) {
      const dev = Math.abs(v - med);
      if (dev > 2) jit++; else wob++;
      flagged.add(t); badTile[t]++;
      if (dev > jitMax) { jitMax = dev; jitWorst = { frame: i, tile: [t % nx * TW, Math.floor(t / nx) * TH], was: med, got: v }; }
    }
  }
  jitTiles = flagged.size;

  let shearMax = 0, shearAt = -1, resTot = 0, cmpTot = 0;
  frameRes.forEach((r, i) => { const s = r / Math.max(1, frameCmp[i]); resTot += r; cmpTot += frameCmp[i]; if (s > shearMax) { shearMax = s; shearAt = i; } });

  let png = null;
  if (worst && o.draw) {
    const c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d'), img = g.createImageData(W, H), u = new Uint32Array(img.data.buffer);
    for (let i = 0; i < u.length; i++) { const p = worst.cur[i]; const v = ((p & 255) + ((p >> 8) & 255) + ((p >> 16) & 255)) / 3 | 0; u[i] = 0xff000000 | (v >> 1) + 96 << 16 | (v >> 1) + 96 << 8 | (v >> 1) + 96; }
    for (let ty = 0; ty < ny; ty++) for (let tx = 0; tx < nx; tx++) {
      const sh = worst.s1[ty * nx + tx], sh2 = worst.s2[ty * nx + tx];
      if (sh !== sh) continue;
      const s = sh * d, s2 = sh2 === sh2 ? sh2 * d : null;
      for (let y = ty * TH; y < Math.min(H, ty * TH + TH); y++) for (let x = tx * TW; x < Math.min(W, tx * TW + TW); x++) {
        const c = worst.cur[y * W + x];
        const ok = (x + s >= 0 && x + s < W && c === worst.prev[y * W + x + s]) || (s2 !== null && x + s2 >= 0 && x + s2 < W && c === worst.prev[y * W + x + s2]);
        if (!ok) u[y * W + x] = 0xff2020e0;   // ABGR: red
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
    mixed: mixedTF / Math.max(1, allTF), wob, jit, jitTiles, jitMax, jitWorst, sure, rates, still, runs, offRuns, gridFrames, png };
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
  if (v.wob / Math.max(1, v.sure) > opts.maxWobble) why.push('wobble');
  if (offShare - stillShare > opts.maxOffGrid) why.push('grid');
  const bad = why.length > 0;
  if (bad) failed = true;
  console.log(`${bad ? 'FAIL' : 'ok  '} ${name.padEnd(14)} ${v.win} cell ${v.cell}px, camera ${v.dir > 0 ? 'right' : 'left'} ${opts.speed}px x ${v.moved}f` +
    `${v.stopped != null ? ` (stopped at ${v.stopped})` : ''}; ` +
    `shear worst ${(v.shearMax * 100).toFixed(3)}% (frame ${v.shearAt}, mean ${(v.shearMean * 100).toFixed(3)}%, ${(v.mixed * 100).toFixed(1)}% of tile-frames two-layer); ` +
    `jitter ${v.jit} jumps and ${v.wob} wobbles of ${v.sure} sure tile-frames (${(100 * v.jit / Math.max(1, v.sure)).toFixed(3)}% / ${(100 * v.wob / Math.max(1, v.sure)).toFixed(3)}%) in ${v.jitTiles} of ${v.tilesUsed} tiles` +
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
