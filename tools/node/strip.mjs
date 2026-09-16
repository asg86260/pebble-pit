// A frame strip of the cascade: the drop from the tap, a shot every few
// frames into a folder, for stitching (tools/node/stitch.py). Ad hoc, for
// the motion round.
//   GAME=... CDP_PORT=... CLIP=300,340,600,400 node tools/node/strip.mjs <dir> [frames-apart] [count] [stake]
import { mkdirSync } from 'node:fs';
import { browser, openTab, closeOtherTabs } from '../cdp.mjs';

const [dir = 'shots/strip', apart = '6', count = '10', stake = '200'] = process.argv.slice(2);
const N = +count, GAP = +apart;
mkdirSync(dir, { recursive: true });
const port = Number(process.env.CDP_PORT || 9333);
const b = await browser({ port });
await closeOtherTabs(port);
const tab = await openTab(port);
const ev = async expr => (await tab.evaluate(expr)).result?.result?.value;
await ev(`(() => { const st = window.__state; window.__scene('casinoidle'); window.__casinoStakes(6000); window.__casinoStake(${+stake}); window.__look(st().casinoX - 380); window.__fast(1/60); return 1; })()`);
await ev('window.__tapSign()');
process.env.SETTLE = '0';
for (let i = 0; i < N; i++) {
  for (let f = 0; f < GAP; f++) { await ev('window.__fast(1/60)'); await ev('new Promise(r => requestAnimationFrame(r))'); }
  await tab.shot(`${dir}/${String(i).padStart(2, '0')}.png`);
}
console.log(`wrote ${N} frames, ${GAP} apart, to ${dir}`);
await tab.close();
if (b.own) b.own.kill();
