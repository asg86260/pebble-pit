// Shoots the saw mock in a headless, muted shell, light and dark, into snaps/:
// all four in the camp at one times, and each held mid-stroke at three times.
//
//   node docs/mocks/act3-saw-2026-10-18/check.mjs
import { browser, openTab } from '../../../tools/cdp.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const PAGE = new URL('./index.html', import.meta.url).href;
const OUT = fileURLToPath(new URL('./snaps/', import.meta.url));
mkdirSync(OUT, { recursive: true });
const port = 9363;
const { own } = await browser({ port });
const tab = await openTab(port, PAGE, { ready: '!!window.__mock' });
const ev = async e => { const r = await tab.send('Runtime.evaluate', { expression: e, returnByValue: true, awaitPromise: true }); if (r.result?.exceptionDetails) throw new Error(JSON.stringify(r.result.exceptionDetails).slice(0, 600)); return r.result?.result?.value; };
const W = 1100;
await tab.send('Emulation.setDeviceMetricsOverride', { width: W, height: 1000, deviceScaleFactor: 1, mobile: false });

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
    await shotOf('#all', `all-${theme}`);
    for (const id of [1, 2, 3, 4]) await shotOf(`#saw-${id} canvas.three`, `saw${id}-mid-3x-${theme}`);
  }
  // the same four on the pine's trunk as built, two rows, for the case against it
  await ev(`__mock.theme('light'); __mock.trunk(false); 1`);
  await shotOf('#all', 'all-built-trunk-light');
  await ev(`__mock.trunk(true); 1`);
} finally {
  const errs = tab.logs.filter(l => l.startsWith('EXCEPTION'));
  console.log(errs.length ? errs.join('\n') : 'no page errors');
  await tab.close(); own?.kill();
}
