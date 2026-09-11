// A look at the yard, in about ten seconds.
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
// headless shell `tools/headless.mjs` uses, so there is nothing to install.

import { spawnSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';

// One expression against the page, through the headless shell.
const ask = (expr, env = {}) =>
  spawnSync(process.execPath, ['tools/headless.mjs', expr],
            { encoding: 'utf8', env: { ...process.env, ...env } });

const args = process.argv.slice(2);
const outAt = args.indexOf('--out');
const out = outAt >= 0 ? args[outAt + 1] : 'shots';
const zoomAt = args.indexOf('--zoom');
const zoom = zoomAt >= 0 ? args[zoomAt + 1] : null;
const plain = args.filter((a, i) => !a.startsWith('--') && args[i - 1] !== '--out' && args[i - 1] !== '--zoom');
const want = (plain[0] || 'yard').split(',').map(s => s.trim()).filter(Boolean);

// The list, by part, as the sheet draws it. Asked of the page, which is the
// one place the list is; the shell prints the value as JSON, and the page's
// own chatter comes after it.
const listed = () => {
  const r = ask('window.__scenes()');
  const s = (r.stdout || '').split('--- console')[0];
  const a = s.indexOf('['), b = s.lastIndexOf(']');
  if (a < 0 || b < 0) { console.log(r.stdout); process.exit(1); }
  return JSON.parse(s.slice(a, b + 1));
};
if (args.includes('--list')) {
  for (const [about, names] of listed()) console.log(`${about}: ${names.join(', ')}`);
  process.exit(0);
}

// A name the page does not know is said so before any shot is taken -- the
// shell does not report a throw from a shot's expression, so the check is
// made here, against the same list.
const known = new Set(listed().flatMap(([, names]) => names));
const unknown = want.filter(n => !known.has(n));
if (unknown.length) {
  console.log(`no scene ${unknown.map(n => `"${n}"`).join(', ')}. there is: ${[...known].join(', ')}`);
  process.exit(1);
}

mkdirSync(out, { recursive: true });

for (const name of want) {
  const file = `${out}/${name}.png`;
  const r = spawnSync(process.execPath,
    // Set the scene, run a second of the yard so everything that animates is
    // somewhere sensible, then wait for two frames to actually paint. Without
    // that wait the shot is taken between the state change and the draw, and
    // every scene came out a blank white page.
    ['tools/headless.mjs', '--shot', file,
      `(() => { window.__scene(${JSON.stringify(name)});
        window.__fast(1);
        return new Promise(r => requestAnimationFrame(
          () => requestAnimationFrame(() => r(1)))); })()`],
    { encoding: 'utf8', env: { ...process.env, ...(zoom ? { ZOOM: zoom } : {}) } });
  const bad = /EXCEPTION[^\n]*/.exec(r.stdout || '');
  console.log(bad ? `${name}: ${bad[0]}` : `${name}: ${file}`);
}
