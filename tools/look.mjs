// A look at the yard, in a few seconds.
//
//   node tools/look.mjs crew          # the crew, hats and all
//   node tools/look.mjs quarry        # the cut, the jaw and the hoist
//   node tools/look.mjs farm          # the plots and the tiller
//   node tools/look.mjs rock          # the hill and the ram
//   node tools/look.mjs yard          # the whole works, machines running
//   node tools/look.mjs crew,farm     # several at once
//   node tools/look.mjs crew --out x  # somewhere other than shots/
//   node tools/look.mjs crew --zoom 4 # crop to the middle and blow it up
//   node tools/look.mjs --list        # every scene, by the part of the game it is about
//
// It wants a dev server; set GAME to it (`GAME=http://localhost:5233/`).
// One browser and one tab serve the whole run: the page loads once, and
// every scene after the first costs about what the scene itself costs.
//
// Why this exists: most of what gets changed in this game is *drawing*, and the
// two test tiers have almost nothing to say about drawing. Waiting four minutes
// for a suite that cannot see a hat, to find out whether a hat sits right, is
// the slowest possible way to answer the question -- and the answer was always
// going to be "look at it" anyway.
//
// So: scenes. Each one sets the yard up the way you would have to set it up by
// hand, points the camera at the thing, and writes a png. Nothing here is a
// check and nothing here passes or fails. It is a window.
//
// The scenes themselves live with the game -- `src/scenes.js`, the one list
// the held sheet draws its buttons from too -- and this tool asks the page for
// them by name (`window.__scene`), so a scene written once is a button and a
// shot the same day and the two cannot drift. This file used to carry ninety
// of them as strings; the reasons behind each setup moved with them.
//
// It needs a dev server (`npm run dev`, or set GAME) and drives the same
// headless shell `tools/headless.mjs` uses (`cdp.mjs`), so there is nothing
// to install.

import { mkdirSync } from 'node:fs';
import { browser, closeOtherTabs, openTab } from './cdp.mjs';

const args = process.argv.slice(2);
const outAt = args.indexOf('--out');
const out = outAt >= 0 ? args[outAt + 1] : 'shots';
const zoomAt = args.indexOf('--zoom');
const zoom = zoomAt >= 0 ? args[zoomAt + 1] : null;
if (zoom) process.env.ZOOM = zoom;
const plain = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--out' && args[i - 1] !== '--zoom');
const want = (plain[0] || 'yard').split(',').map(s => s.trim()).filter(Boolean);

// One browser, one tab, for the whole run. The page is loaded once and every
// scene is stood up in it -- a scene resets the yard itself, so the next one
// starts as clean as a fresh page would have. The tab is what used to be the
// bill: a whole shell launched and the game loaded per shot, and once more
// just to ask for the list, at a couple of seconds each.
const PORT = +(process.env.CDP_PORT || 9333);
const { own } = await browser({ port: PORT });
await closeOtherTabs(PORT);
const tab = await openTab(PORT);
const done = async code => { await tab.close(); own?.kill(); process.exit(code); };

// The list, by part, as the sheet draws it. Asked of the page, which is the
// one place the list is.
const listed = (await tab.evaluate('window.__scenes()')).result?.result?.value;
if (!Array.isArray(listed)) {
  console.log(['the page has no scenes', ...tab.logs].join(String.fromCharCode(10)));
  await done(1);
}
if (args.includes('--list')) {
  for (const [about, names] of listed) console.log(`${about}: ${names.join(', ')}`);
  await done(0);
}

// A name the page does not know is said so before any shot is taken.
const known = new Set(listed.flatMap(([, names]) => names));
const unknown = want.filter(n => !known.has(n));
if (unknown.length) {
  console.log(`no scene ${unknown.map(n => `"${n}"`).join(', ')}. there is: ${[...known].join(', ')}`);
  await done(1);
}

mkdirSync(out, { recursive: true });

for (const name of want) {
  const file = `${out}/${name}.png`;
  // Set the scene, run a second of the yard so everything that animates is
  // somewhere sensible, then wait for two frames to actually paint. Without
  // that wait the shot is taken between the state change and the draw, and
  // every scene came out a blank white page.
  const said = tab.logs.length;
  await tab.evaluate(`(() => { window.__scene(${JSON.stringify(name)});
    window.__fast(1);
    return new Promise(r => requestAnimationFrame(
      () => requestAnimationFrame(() => r(1)))); })()`);
  await tab.shot(file);
  // What the page threw while this scene stood up, and only this one.
  const bad = tab.logs.slice(said).find(l => l.startsWith('EXCEPTION'));
  console.log(bad ? `${name}: ${bad}` : `${name}: ${file}`);
}
await done(0);
