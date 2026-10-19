// Shoots the unbuilt-station mock in a headless, muted shell, light and dark,
// into snaps/: for each pile take, the three-times view at the five moments
// (empty spot, carriers bringing the pile, the pile complete, mid-build,
// complete), the one-times stretch at mid-build, and the empty spot both ways.
//
//   node docs/mocks/act3-unbuilt-2026-10-18/check.mjs
import { browser, openTab } from '../../../tools/cdp.mjs';
import { mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';

const PAGE = new URL('./index.html', import.meta.url).href;
const OUT = fileURLToPath(new URL('./snaps/', import.meta.url));
mkdirSync(OUT, { recursive: true });
const port = 9371;
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
const SLUG = { 'empty spot': 'empty', 'carriers bringing the pile': 'carrying', 'the pile complete': 'pile', 'mid-build': 'midbuild', 'complete': 'complete' };
try {
  await ev('__mock.play(false); 1');
  const times = await ev('__mock.times()');
  console.log(JSON.stringify(times));
  for (const theme of ['light', 'dark']) {
    await ev(`__mock.theme('${theme}'); __mock.hint(false); 1`);
    await shotOf('#empty-plain canvas', `empty-plain-${theme}`);
    await shotOf('#empty-hint canvas', `empty-hint-optional-${theme}`);
    for (const [name, t] of Object.entries(times)) {
      await ev(`__mock.at(${t}); 1`);
      for (const id of ['a', 'b', 'c']) await shotOf(`#take-${id} canvas.three`, `${id}-${SLUG[name]}-3x-${theme}`);
      if (name === 'mid-build') for (const id of ['a', 'b', 'c']) await shotOf(`#take-${id} canvas.one`, `${id}-midbuild-1x-${theme}`);
    }
  }
} finally {
  const errs = tab.logs.filter(l => l.startsWith('EXCEPTION'));
  console.log(errs.length ? errs.join('\n') : 'no page errors');
  await tab.close(); own?.kill();
}
