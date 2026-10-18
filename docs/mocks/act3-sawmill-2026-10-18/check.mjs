// Shoots the saw mill mock in a headless, muted shell, light and dark, into
// snaps/: all three at one times, each held mid-stroke at three times, and the
// pick beside the press. With `--frames`, also a strip of the pick's 3x view
// over one turn of the wheel, to check the blade and wheel stay in step.
//
//   node docs/mocks/act3-sawmill-2026-10-18/check.mjs [--frames]
import { browser, openTab } from '../../../tools/cdp.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const PAGE = new URL('./index.html', import.meta.url).href;
const OUT = fileURLToPath(new URL('./snaps/', import.meta.url));
mkdirSync(OUT, { recursive: true });
const port = 9367;
const { own } = await browser({ port });
const tab = await openTab(port, PAGE, { ready: '!!window.__mock' });
const ev = async e => { const r = await tab.send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }); if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 600)); return r.result?.result?.value; };
await tab.send('Emulation.setDeviceMetricsOverride', { width: 1260, height: 1000, deviceScaleFactor: 1, mobile: false });

async function shotOf(sel, name) {
  const r = await ev(`(() => { const r = document.querySelector('${sel}').getBoundingClientRect(); return { x: r.left + scrollX, y: r.top + scrollY, w: r.width, h: r.height }; })()`);
  const png = await tab.send('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { x: r.x, y: r.y, width: r.w, height: r.h, scale: 1 } });
  writeFileSync(`${OUT}/${name}.png`, Buffer.from(png.result.data, 'base64'));
  console.log(`shot ${name}.png`);
}
try {
  await ev('__mock.pause(true); 1');
  for (const theme of ['light', 'dark']) {
    await ev(`__mock.theme('${theme}'); __mock.mid(true); 1`);
    await shotOf('#all', `all-1x-${theme}`);
    await shotOf('#family canvas', `pick-beside-press-${theme}`);
    for (const id of [1, 2, 3]) await shotOf(`#take-${id} canvas.three`, `take${id}-mid-3x-${theme}`);
  }
  if (process.argv.includes('--frames')) {
    await ev(`__mock.theme('light'); __mock.mid(false); 1`);
    for (let i = 0; i < 16; i += 4) { await ev(`__mock.advance(0.1); 1`); await ev(`__mock.advance(0.3); 1`); await shotOf('#all', `turn-${i}`); }
  }
} finally {
  const errs = tab.logs.filter(l => l.startsWith('EXCEPTION'));
  console.log(errs.length ? errs.join('\n') : 'no page errors');
  await tab.close(); own?.kill();
}
