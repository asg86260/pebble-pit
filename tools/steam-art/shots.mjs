// The five store screenshots, taken from the game itself.
//
// Steam wants 1920x1080. A world pixel has to land on a whole number of
// device pixels, and the desk draws a cell (P world pixels) at CELL CSS pixels,
// so the device ratio is chosen to make that number two: 2 * P / CELL (2.4
// today), with the window 1920x1080 over it (800x450). Every edge the game
// draws on a world pixel is then a whole device pixel, and nothing is
// resampled after the capture. The old shots were a 1152x648 window at 5/3, a
// world pixel 1.39 device pixels, which smeared every edge into a grey ramp.
//
// The press's scanlines stay (the owner, 2026-10-14). Its vignette does not:
// it is the game's one gradient and a ramp over every color in the frame, so
// the shot stubs the radial gradient press.js builds it from (the only one in
// src) and the sheet it lays down is the scanlines alone.
//
// Story notices, the objective plate, the build call and the corner buttons
// are hidden; the purse and the boards are the game's own HUD and stay.

import { writeFileSync } from 'node:fs';
import { gameUrl } from '../cdp.mjs';
import { CELL, P } from '../../src/config.js';

export const SHOT_SCENES = ['steamhome', 'steamrock', 'steamsites', 'steamstorm', 'steamboard'];
export const SHOT_SIZE = [1920, 1080], WORLD_PX = 2;
export const SHOT_DPR = WORLD_PX * P / CELL;
export const SHOT_CSS = SHOT_SIZE.map(n => n / SHOT_DPR);
if (!SHOT_CSS.every(Number.isInteger)) throw new Error(`${SHOT_SIZE.join('x')} is not a whole window at a device ratio of ${SHOT_DPR}`);

export const FRAME_GROUND = 0.66;   // the intro's own framing (intro.js, the walk out)
const HIDE = ['#toast', '#tip', '#raise', '#topleft', '#objective', '#queue', '#corner', '#skip', '#messtags'];

// Smoothing is pinned off as well. At a device ratio of two the yard's cached
// tiles (the ground's hatch above all) are patterns drawn through a 2x
// transform, and a canvas left smoothing scales them bilinearly: every hatch
// mark came out with a grey fringe a device pixel wide. Off, the shot is the
// game at one device pixel a world pixel, doubled.
const NO_VIGNETTE = `(() => {
  const P = CanvasRenderingContext2D.prototype, real = P.createRadialGradient;
  P.createRadialGradient = function (...a) {
    const g = real.apply(this, a); g.addColorStop = () => {}; return g;
  };
  const smooth = Object.getOwnPropertyDescriptor(P, 'imageSmoothingEnabled');
  Object.defineProperty(P, 'imageSmoothingEnabled', { configurable: true,
    get() { return false; }, set() { smooth.set.call(this, false); } });
  // A context starts smoothing, and sizing its canvas resets it to that: the
  // yard's canvas is sized after its context is made, so both are caught.
  const C = HTMLCanvasElement.prototype, made = C.getContext, ctxOf = new WeakMap();
  C.getContext = function (...a) {
    const g = made.apply(this, a);
    if (g && 'imageSmoothingEnabled' in g) { smooth.set.call(g, false); ctxOf.set(this, g); }
    return g;
  };
  for (const key of ['width', 'height']) {
    const d = Object.getOwnPropertyDescriptor(C, key);
    Object.defineProperty(C, key, { configurable: true, get: d.get,
      set(v) { d.set.call(this, v); const g = ctxOf.get(this); if (g) smooth.set.call(g, false); } });
  }
})();`;

export async function takeShots(port, outFile) {
  const tab = await (await fetch(`http://127.0.0.1:${port}/json/new?about:blank`, { method: 'PUT' })).json();
  const ws = new WebSocket(tab.webSocketDebuggerUrl);
  const waiting = new Map(); let n = 0; const logs = [];
  ws.addEventListener('message', e => {
    const m = JSON.parse(e.data);
    if (waiting.has(m.id)) { waiting.get(m.id)(m); waiting.delete(m.id); }
    if (m.method === 'Runtime.exceptionThrown') logs.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
  });
  await new Promise(r => ws.addEventListener('open', r));
  const send = (method, params = {}) => new Promise(res => { const id = ++n; waiting.set(id, res); ws.send(JSON.stringify({ id, method, params })); });
  const run = async expr => {
    const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
    if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text);
    return r.result?.result?.value;
  };
  const wrote = [];
  try {
    await send('Runtime.enable'); await send('Page.enable');
    const [w, h] = SHOT_CSS;
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: SHOT_DPR, mobile: false });
    await send('Page.addScriptToEvaluateOnNewDocument', { source: NO_VIGNETTE });
    for (const name of SHOT_SCENES) {
      // A fresh page a shot: a scene resets the yard, but the press sheet and
      // the boards' open state are the page's, and one shot must not carry
      // into the next.
      await send('Page.navigate', { url: gameUrl() });
      let ready = false;
      for (let i = 0; i < 150 && !ready; i++) {
        await new Promise(r => setTimeout(r, 100));
        ready = await run('typeof window.__scene === "function" && typeof window.__reset === "function" && typeof window.__test === "function"').catch(() => false);
      }
      if (!ready) throw new Error(`the game never came up at ${gameUrl()}`);
      await run(`(() => { const s = document.createElement('style'); s.textContent = ${JSON.stringify(HIDE.join(', ') + ' { display: none !important; }')}; document.head.appendChild(s); return 1; })()`);
      await run(`(() => { window.__scene(${JSON.stringify(name)}); window.__fast(1);
        return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => r(1)))); })()`);
      // A window a world pixel to two device pixels is 540 world pixels tall,
      // and the yard holds the pit floor on the window's foot, which leaves
      // half the frame bare ground. The view is held where the intro's walk
      // out holds it, the ground line two thirds of the way down. state.js is
      // the module the page already loaded (vite serves it unchanged, so the
      // import is that instance, not a second one).
      await run(`(async () => { const { S } = await import('/src/state.js'), { clampCam } = await import('/src/world.js');
        S.camLockY = Math.round(S.groundY - S.viewH * ${FRAME_GROUND}); clampCam(); window.__fast(1 / 60);
        return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => r(1)))); })()`);
      // Let a board finish scaling in; the sim does not move meanwhile.
      await run(`new Promise(ok => { const t0 = performance.now(); const look = () => {
        if (document.getAnimations().every(a => a.playState !== 'running') || performance.now() - t0 > 1500) ok(1); else requestAnimationFrame(look); };
        requestAnimationFrame(look); })`);
      const dpr = await run('[devicePixelRatio, document.getElementById("c").width, document.getElementById("c").height]');
      if (Math.abs(dpr[0] - SHOT_DPR) > 1e-6 || dpr[1] !== SHOT_SIZE[0] || dpr[2] !== SHOT_SIZE[1]) throw new Error(`${name}: canvas is ${dpr[1]}x${dpr[2]} at ${dpr[0]}, not ${SHOT_SIZE[0]}x${SHOT_SIZE[1]}`);
      const png = await send('Page.captureScreenshot', { format: 'png' });
      const f = outFile(name);
      writeFileSync(f, Buffer.from(png.result.data, 'base64'));
      wrote.push(f);
      console.log('wrote', f, logs.length ? `(page threw: ${logs.splice(0).join(' | ')})` : '');
    }
  } finally {
    try { ws.close(); await fetch(`http://127.0.0.1:${port}/json/close/${tab.id}`); } catch {}
  }
  return wrote;
}
