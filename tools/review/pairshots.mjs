// The two of them, shot framed on them: each scene named stood up, and the
// glass cropped round her and him and blown up, so a body three cells wide
// can be read in a review card. The picker's scenes are shot whole.
//
//   GAME=http://localhost:<port>/ node tools/review/pairshots.mjs <out dir> pair,pair-deep,finale-parade [--scale 3]
//
// A pair further apart than half the window is shot as two crops, one each.

import { mkdirSync } from 'node:fs';
import { browser, closeOtherTabs, openTab, standScene } from '../cdp.mjs';

const [out, list = 'pair'] = process.argv.slice(2);
const sAt = process.argv.indexOf('--scale');
const scale = sAt > 0 ? +process.argv[sAt + 1] : 3;
const PORT = +(process.env.CDP_PORT || 9333);
const { own } = await browser({ port: PORT });
await closeOtherTabs(PORT);
const tab = await openTab(PORT);
mkdirSync(out, { recursive: true });
const [W, H] = (process.env.WINDOW || '800,600').split(',').map(Number);
const PAD = 54;

const boxOf = (a, b) => {
  const xs = [a, b].filter(Boolean);
  const x0 = Math.min(...xs.map(o => o.x)) - PAD, y0 = Math.min(...xs.map(o => o.y)) - PAD * 1.4;
  const x1 = Math.max(...xs.map(o => o.x + o.s)) + PAD, y1 = Math.max(...xs.map(o => o.y + o.s)) + PAD * 0.6;
  return { x: Math.max(0, x0), y: Math.max(0, y0), width: Math.min(W, x1) - Math.max(0, x0), height: Math.min(H, y1) - Math.max(0, y0), scale };
};
for (const name of list.split(',')) {
  await standScene(tab, name);
  if (name.startsWith('wardrobe')) { await tab.shot(`${out}/${name}.png`); console.log(`${name}: whole`); continue; }
  const at = (await tab.evaluate('JSON.stringify(window.__pairAt())')).result?.result?.value;
  const { sqouse: her, you: him } = JSON.parse(at || '{}');
  const on = o => o && o.x > -o.s && o.x < W && o.y > -o.s && o.y < H;
  const seen = [her, him].filter(on);
  if (!seen.length) { await tab.shot(`${out}/${name}.png`); console.log(`${name}: neither on the glass, shot whole`); continue; }
  if (seen.length === 2 && Math.abs(her.x - him.x) > W / 2) {
    await tab.shot(`${out}/${name}-her.png`, { clip: boxOf(her) });
    await tab.shot(`${out}/${name}-him.png`, { clip: boxOf(him) });
    console.log(`${name}: two crops`);
  } else {
    await tab.shot(`${out}/${name}.png`, { clip: boxOf(...seen) });
    console.log(`${name}: ${seen.length === 2 ? 'both' : on(her) ? 'her' : 'him'}`);
  }
}
await tab.close();
own?.kill();
process.exit(0);
