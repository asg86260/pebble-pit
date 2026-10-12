// Ask the game page one thing after a setup, while building a surface:
//   node tools/wording/probe.mjs <file of page script, an async body> [shot.png]
import { readFileSync, writeFileSync } from 'node:fs';
import { browser, closeOtherTabs, openTab } from '../cdp.mjs';
process.env.WINDOW = '1280,800';
const PORT = +(process.env.CDP_PORT || 9403);
const { own } = await browser({ port: PORT });
await closeOtherTabs(PORT);
const tab = await openTab(PORT, (process.env.GAME || 'http://localhost:5302/') + (process.env.PAGE || 'play.html'));
await tab.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
for (let i = 0; i < 100; i++) { const r = await tab.evaluate('typeof window.__scene'); if (r.result?.result?.value === 'function') break; await new Promise(r => setTimeout(r, 100)); }
const body = readFileSync(process.argv[2], 'utf8');
const r = await tab.evaluate(`(async () => { const M = n => import('/src/' + n + '.js'); ${body}\n })()`);
console.log(JSON.stringify(r.result?.result?.value ?? r.result, null, 1));
if (process.argv[3]) { const png = await tab.send('Page.captureScreenshot', { format: 'png' }); writeFileSync(process.argv[3], Buffer.from(png.result.data, 'base64')); }
await tab.close(); own?.kill(); process.exit(0);
