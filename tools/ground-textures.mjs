// Shoot one scene once per ground texture option, for choosing between them.
import { mkdirSync } from 'node:fs';
import { browser, closeOtherTabs, openTab } from './cdp.mjs';
const PORT = +(process.env.CDP_PORT || 9341);
const { own } = await browser({ port: PORT });
await closeOtherTabs(PORT);
const tab = await openTab(PORT);
const out = process.argv[2] || 'shots/ground';
mkdirSync(out, { recursive: true });
const scene = process.argv[3] || 'crew';
const opts = [
  ['dots-light', 1, 6, 0.14], ['dots-dark', 1, 6, 0.3], ['dots-dense', 1, 3, 0.14],
  ['hatch', 2, 6, 0.14], ['strata', 3, 6, 0.14], ['stipple', 4, 6, 0.14],
];
for (const [name, t, tile, ink] of opts) {
  const said = tab.logs.length;
  await tab.evaluate(`(() => { window.__scene(${JSON.stringify(scene)});
    window.__tune('GROUND_TEXTURE', ${t}); window.__tune('GROUND_TILE', ${tile}); window.__tune('GROUND_INK', ${ink});
    window.__fast(1);
    return new Promise(r => requestAnimationFrame(() => requestAnimationFrame(() => r(1)))); })()`);
  await tab.shot(`${out}/${name}.png`);
  const bad = tab.logs.slice(said).find(l => l.startsWith('EXCEPTION'));
  console.log(bad ? `${name}: ${bad}` : `${name}: ${out}/${name}.png`);
}
await tab.close(); own?.kill(); process.exit(0);
